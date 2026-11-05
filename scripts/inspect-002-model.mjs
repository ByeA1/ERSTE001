import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const base = new URL("../public/cases/erste002/", import.meta.url);
const b = fs.readFileSync(new URL("assets/shell-hi.glb", base));
const length = b.readUInt32LE(12);
const gltf = JSON.parse(b.subarray(20, 20 + length).toString());
const bin = b.subarray(28 + length);
const context = {
  module: { exports: {} },
  require: createRequire(import.meta.url),
  console,
  process,
  Buffer,
  __dirname: ".",
  TextDecoder,
  TextEncoder,
  WebAssembly,
  setTimeout,
  clearTimeout,
};
vm.runInNewContext(
  fs.readFileSync(new URL("vendor/draco/draco_wasm_wrapper.js", base), "utf8"),
  context,
);
const draco = await context.DracoDecoderModule({
  wasmBinary: fs.readFileSync(new URL("vendor/draco/draco_decoder.wasm", base)),
});
const result = [];
for (const node of gltf.nodes) {
  const prim = gltf.meshes[node.mesh].primitives[0];
  const ext = prim.extensions.KHR_draco_mesh_compression;
  const view = gltf.bufferViews[ext.bufferView];
  const bytes = bin.subarray(
    view.byteOffset || 0,
    (view.byteOffset || 0) + view.byteLength,
  );
  const decoder = new draco.Decoder(),
    input = new draco.DecoderBuffer(),
    mesh = new draco.Mesh();
  input.Init(bytes, bytes.length);
  const status = decoder.DecodeBufferToMesh(input, mesh);
  if (!status.ok()) throw Error(status.error_msg());
  const positions = new draco.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(
    mesh,
    decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION),
    positions,
  );
  // Weld coincident position splits before measuring manifold edges.
  const ids = new Map(),
    weld = [];
  for (let i = 0; i < mesh.num_points(); i++) {
    const key = [0, 1, 2]
      .map((k) => positions.GetValue(i * 3 + k).toFixed(4))
      .join(",");
    if (!ids.has(key)) ids.set(key, ids.size);
    weld.push(ids.get(key));
  }
  const edges = new Map(),
    face = new draco.DracoInt32Array();
  for (let i = 0; i < mesh.num_faces(); i++) {
    decoder.GetFaceFromMesh(mesh, i, face);
    const v = [0, 1, 2].map((k) => weld[face.GetValue(k)]);
    for (let k = 0; k < 3; k++) {
      const a = v[k],
        c = v[(k + 1) % 3];
      if (a === c) continue;
      const key = a < c ? `${a},${c}` : `${c},${a}`;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  result.push({
    name: node.name,
    primitives: 1,
    triangles: mesh.num_faces(),
    vertices: mesh.num_points(),
    weldedVertices: ids.size,
    boundaryEdges: [...edges.values()].filter((n) => n === 1).length,
    nonManifoldEdges: [...edges.values()].filter((n) => n > 2).length,
    bounds: gltf.accessors[prim.attributes.POSITION],
  });
  for (const obj of [positions, face, mesh, input, decoder]) draco.destroy(obj);
}
console.log(JSON.stringify({ asset: "shell-hi.glb", parts: result }, null, 2));
