import * as THREE from "three";
// Local clipping plus independent per-mesh stencil counters. Source geometry is unchanged.
// Based on three.js r183 webgl_clipping_stencil (MIT).
export class SectionCut {
  constructor(scene, meshes) {
    this.plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -0.2);
    this.group = new THREE.Group();
    scene.add(this.group);
    this.records = meshes.map((mesh, i) => {
      const stencil = new THREE.MeshBasicMaterial({
        depthWrite: false,
        depthTest: false,
        colorWrite: false,
        stencilWrite: true,
        stencilFunc: THREE.AlwaysStencilFunc,
        clippingPlanes: [this.plane],
      });
      const back = stencil.clone(),
        front = stencil.clone();
      stencil.dispose();
      back.side = THREE.BackSide;
      front.side = THREE.FrontSide;
      for (const [mat, op] of [
        [back, THREE.IncrementWrapStencilOp],
        [front, THREE.DecrementWrapStencilOp],
      ])
        mat.stencilFail = mat.stencilZFail = mat.stencilZPass = op;
      const proxies = [back, front].map((mat, j) => {
        const p = new THREE.Mesh(mesh.geometry, mat);
        p.matrixAutoUpdate = false;
        p.frustumCulled = false;
        p.renderOrder = i * 3 + j;
        this.group.add(p);
        return p;
      });
      const cap = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshStandardMaterial({
          color: mesh.material.color,
          roughness: mesh.material.roughness,
          metalness: mesh.material.metalness,
          side: THREE.DoubleSide,
          stencilWrite: true,
          stencilRef: 0,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilFail: THREE.ReplaceStencilOp,
          stencilZFail: THREE.ReplaceStencilOp,
          stencilZPass: THREE.ReplaceStencilOp,
        }),
      );
      cap.renderOrder = i * 3 + 2;
      cap.frustumCulled = false;
      cap.onAfterRender = (renderer) => renderer.clearStencil();
      this.group.add(cap);
      mesh.renderOrder = 100;
      return { mesh, proxies, cap, clipped: false };
    });
    this.helper = new THREE.PlaneHelper(this.plane, 0.42, 0x8b9278);
    this.helper.visible = false;
    scene.add(this.helper);
    this.normal = new THREE.Vector3();
    this.euler = new THREE.Euler();
    this.point = new THREE.Vector3();
  }
  update(cut, showHelper = false) {
    this.euler.set(...cut.rotation.map((v) => THREE.MathUtils.degToRad(v)));
    this.normal.set(0, 0, 1).applyEuler(this.euler).normalize();
    this.point.fromArray(cut.position);
    this.plane.setFromNormalAndCoplanarPoint(this.normal, this.point);
    this.helper.visible = cut.enabled && showHelper;
    for (const r of this.records) {
      const enabled =
        cut.enabled && (cut.target === "all" || r.mesh.name === cut.target);
      if (enabled !== r.clipped) {
        r.mesh.material.clippingPlanes = enabled ? [this.plane] : [];
        r.mesh.material.clipShadows = true;
        r.mesh.material.needsUpdate = true;
        r.clipped = enabled;
      }
      for (const proxy of r.proxies) {
        proxy.visible = enabled && cut.cap;
        proxy.matrix.copy(r.mesh.matrixWorld);
      }
      r.cap.visible = enabled && cut.cap;
      this.plane.coplanarPoint(r.cap.position);
      r.cap.lookAt(r.cap.position.clone().sub(this.normal));
    }
  }
}
