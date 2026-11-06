import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as THREE from 'three';
const require = createRequire(path.resolve('.audit/model-logo/tools/package.json'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco = require('draco3dgltf');
const { MeshoptDecoder } = require('meshoptimizer');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder });
function material(m) { return { name: m.getName(), color: m.getBaseColorFactor(), roughness: m.getRoughnessFactor(), metallic: m.getMetallicFactor(), alphaMode: m.getAlphaMode(), alphaCutoff: m.getAlphaCutoff(), doubleSided: m.getDoubleSided(), emissive: m.getEmissiveFactor(), transmission: m.getExtension('KHR_materials_transmission')?.getTransmissionFactor() ?? 0, ior: m.getExtension('KHR_materials_ior')?.getIOR() ?? 1.5 }; }
async function read(id) {
  const doc = await io.read(`.audit/model-logo/models/${id}.glb`), meshes = new Map();
  for (const node of doc.getRoot().listNodes()) if (node.getMesh()) {
    const matrix = new THREE.Matrix4().fromArray(node.getWorldMatrix()), normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    for (const [i, p] of node.getMesh().listPrimitives().entries()) {
      const points = [], normals = [], position = p.getAttribute('POSITION'), normal = p.getAttribute('NORMAL');
      for (let j = 0; j < position.getCount(); j++) { points.push(new THREE.Vector3().fromArray(position.getElement(j, [])).applyMatrix4(matrix)); normals.push(new THREE.Vector3().fromArray(normal.getElement(j, [])).applyMatrix3(normalMatrix).normalize()); }
      const indices = p.getIndices(); let degenerateTriangles = 0;
      for (let j = 0; j < indices.getCount(); j += 3) { const a = points[indices.getScalar(j)], b = points[indices.getScalar(j+1)], c = points[indices.getScalar(j+2)]; if (new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).lengthSq() < 1e-30) degenerateTriangles++; }
      meshes.set(`${p.getMaterial().getName()}:${i}`, { points, normals, triangles: indices.getCount() / 3, degenerateTriangles });
    }
  }
  return { meshes, materials: doc.getRoot().listMaterials().map(material).sort((a,b) => a.name.localeCompare(b.name)), textures: doc.getRoot().listTextures().length };
}
const original = await read('original');
const bounds = new THREE.Box3(); for (const m of original.meshes.values()) for (const p of m.points) bounds.expandByPoint(p);
const diagonal = bounds.getSize(new THREE.Vector3()).length(), step = diagonal / 10000;
function grid(mesh) { const map = new Map(); mesh.points.forEach((p,i) => { const key = [p.x,p.y,p.z].map(x => Math.floor(x/step)).join(','); if (!map.has(key)) map.set(key,[]); map.get(key).push(i); }); return map; }
function compare(source, target) {
  const buckets = grid(target); let maxDistance = 0, sumSquared = 0, maxNormalAngle = 0;
  for (const [i,p] of source.points.entries()) {
    const cell = [p.x,p.y,p.z].map(x => Math.floor(x/step)); let closest = Infinity, normalDot = -1;
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++) for(const j of buckets.get([cell[0]+x,cell[1]+y,cell[2]+z].join(',')) || []) {
      const d = p.distanceToSquared(target.points[j]);
      // Hard edges share positions but deliberately have different normals.
      if(d < closest - 1e-18) { closest = d; normalDot = source.normals[i].dot(target.normals[j]); }
      else if(Math.abs(d-closest) < 1e-18) normalDot = Math.max(normalDot, source.normals[i].dot(target.normals[j]));
    }
    assert.ok(Number.isFinite(closest), 'Geometry moved farther than the verification search radius');
    maxDistance = Math.max(maxDistance, Math.sqrt(closest)); sumSquared += closest;
    maxNormalAngle = Math.max(maxNormalAngle, Math.acos(Math.min(1, Math.max(-1, normalDot))) * 180 / Math.PI);
  }
  return { maxPositionError: maxDistance, rmsPositionError: Math.sqrt(sumSquared/source.points.length), maxNormalAngleDeg: maxNormalAngle };
}
const report = { units: 'source model units; no physical scale inferred', diagonal, variants: [] };
for(const id of ['draco-18','draco-16','meshopt-16','quantize-16']) {
  const candidate = await read(id); assert.deepEqual(candidate.materials,original.materials); assert.equal(candidate.textures,0); assert.equal(candidate.meshes.size,17);
  const meshes=[];
  for(const [name,m] of candidate.meshes) { const ref=original.meshes.get(name); assert.ok(ref); assert.ok(m.triangles <= ref.triangles && ref.triangles-m.triangles <= ref.degenerateTriangles, `${name}: removed non-degenerate triangles`); const forward=compare(m,ref), reverse=compare(ref,m); assert.ok(Math.max(forward.maxPositionError,reverse.maxPositionError)/diagonal < .0001); meshes.push({name,triangles:m.triangles,originalTriangles:ref.triangles,originalDegenerateTriangles:ref.degenerateTriangles,vertices:m.points.length,...forward,reverseMaxPositionError:reverse.maxPositionError}); }
  const entry={id,materialsIdentical:true,triangles:meshes.reduce((n,m)=>n+m.triangles,0),maxPositionError:Math.max(...meshes.map(m=>Math.max(m.maxPositionError,m.reverseMaxPositionError))),maxNormalAngleDeg:Math.max(...meshes.map(m=>m.maxNormalAngleDeg)),meshes}; report.variants.push(entry); console.log(JSON.stringify({...entry,meshes:undefined}));
}
await fs.writeFile('.audit/model-logo/geometry-quality.json',JSON.stringify(report,null,2));
