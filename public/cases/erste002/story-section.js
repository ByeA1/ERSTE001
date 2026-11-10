import * as THREE from "three";
import { createContourReader } from "./section-contours.js";

function updateFace(cap, points, faces, normal) {
  let geometry = cap.geometry;
  let position = geometry.getAttribute("position");
  let normals = geometry.getAttribute("normal");
  let index = geometry.index;
  if (
    !position ||
    points.length > position.count ||
    faces.length > index.count
  ) {
    const capacity = (size) => 2 ** Math.ceil(Math.log2(Math.max(128, size)));
    geometry.dispose();
    geometry = new THREE.BufferGeometry();
    position = new THREE.BufferAttribute(
      new Float32Array(capacity(points.length) * 3),
      3,
    ).setUsage(THREE.DynamicDrawUsage);
    normals = new THREE.BufferAttribute(
      new Float32Array(position.array.length),
      3,
    ).setUsage(THREE.DynamicDrawUsage);
    index = new THREE.BufferAttribute(
      new Uint32Array(capacity(faces.length)),
      1,
    ).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", position);
    geometry.setAttribute("normal", normals);
    geometry.setIndex(index);
    cap.geometry = geometry;
  }
  for (const [i, point] of points.entries()) {
    position.setXYZ(i, point.x, point.y, point.z);
    normals.setXYZ(i, -normal.x, -normal.y, -normal.z);
  }
  index.array.set(faces);
  for (const attribute of [position, normals, index])
    attribute.needsUpdate = true;
  geometry.setDrawRange(0, faces.length);
}

export class SectionCut {
  constructor(scene, meshes, sources = new Map()) {
    this.plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -0.2);
    this.records = meshes.map((mesh) => {
      const material = mesh.material.clone();
      const colors =
        mesh.material.vertexColors && mesh.geometry.getAttribute("color");
      if (colors)
        material.color.multiply(
          new THREE.Color(colors.getX(0), colors.getY(0), colors.getZ(0)),
        );
      material.vertexColors = false;
      material.side = THREE.DoubleSide;
      const cap = new THREE.Mesh(new THREE.BufferGeometry(), material);
      cap.castShadow = true;
      cap.receiveShadow = true;
      cap.matrixAutoUpdate = false;
      cap.frustumCulled = false;
      cap.visible = false;
      scene.add(cap);
      return {
        mesh,
        source: sources.get(mesh) ?? mesh.geometry,
        cap,
        clipped: false,
        lastPlane: new THREE.Plane(),
        readContour: null,
      };
    });
    this.helper = new THREE.PlaneHelper(this.plane, 0.42, 0xff5d57);
    this.helper.visible = false;
    scene.add(this.helper);
    this.normal = new THREE.Vector3();
    this.euler = new THREE.Euler();
    this.point = new THREE.Vector3();
    this.sphere = new THREE.Sphere();
    this.inverse = new THREE.Matrix4();
    this.local = new THREE.Plane();
    this.wasEnabled = false;
  }
  update(cut, showHelper = false) {
    if (!cut.enabled && !this.wasEnabled) return 0;
    this.wasEnabled = cut.enabled;
    this.euler.set(...cut.rotation.map(THREE.MathUtils.degToRad));
    this.normal.set(0, 0, 1).applyEuler(this.euler).normalize();
    this.point.fromArray(cut.position);
    this.plane.setFromNormalAndCoplanarPoint(this.normal, this.point);
    this.helper.visible = cut.enabled && showHelper;
    let triangleCount = 0;
    for (const record of this.records) {
      const { mesh, cap, source } = record;
      const enabled =
        cut.enabled && (cut.target === "all" || mesh.name === cut.target);
      if (enabled !== record.clipped) {
        mesh.material.clippingPlanes = enabled ? [this.plane] : [];
        mesh.material.needsUpdate = true;
        record.clipped = enabled;
      }
      cap.visible = false;
      if (!enabled || !cut.cap || !source.index) continue;
      let ancestor = mesh;
      while (ancestor?.visible) ancestor = ancestor.parent;
      if (ancestor) continue;
      if (!source.boundingSphere) source.computeBoundingSphere();
      this.sphere
        .copy(source.boundingSphere)
        .applyMatrix4(mesh.matrixWorld);
      if (!this.plane.intersectsSphere(this.sphere)) continue;
      this.inverse.copy(mesh.matrixWorld).invert();
      this.local.copy(this.plane).applyMatrix4(this.inverse);
      if (!record.readContour || !record.lastPlane.equals(this.local)) {
        record.readContour ??= createContourReader(source);
        const { points, faces } = record.readContour(this.local);
        updateFace(cap, points, faces, this.local.normal);
        record.lastPlane.copy(this.local);
      }
      cap.matrix.copy(mesh.matrixWorld);
      cap.matrixWorldNeedsUpdate = true;
      cap.visible = cap.geometry.drawRange.count > 0;
      if (cap.visible) triangleCount += cap.geometry.drawRange.count / 3;
    }
    return triangleCount;
  }
}
