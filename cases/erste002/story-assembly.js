import * as THREE from "three";

// All offsets are in the normalized story world. The axes stay fixed while the camera moves.
export const ASSEMBLY_GROUPS = {
  wheel: ["Wheel", 0.188],
  button_cover: ["Buttons", 0.119],
  shell_top: ["Shell", 0.049],
  pcb: ["PCB_Assembly", -0.018],
  battery: ["Battery_300mAh", -0.088],
};

export class StoryAssembly {
  constructor(model) {
    model.updateWorldMatrix(true, true);
    this.actors = new Map();
    for (const [part, [name, travel]] of Object.entries(ASSEMBLY_GROUPS)) {
      const group = model.getObjectByName(name);
      if (!group) throw new Error("Missing Rev 3 assembly group " + name);
      const inverse = group.parent.matrixWorld.clone().invert();
      const center = new THREE.Box3()
        .setFromObject(group)
        .getCenter(new THREE.Vector3());
      const pivot = center.applyMatrix4(inverse).sub(group.position);
      const parentRotation = group.parent.getWorldQuaternion(
        new THREE.Quaternion(),
      );
      this.actors.set(part, {
        group,
        travel,
        pivot,
        position: group.position.clone(),
        rotation: group.quaternion.clone(),
        inverse: new THREE.Matrix3().setFromMatrix4(inverse),
        parentRotation,
        parentInverse: parentRotation.clone().invert(),
        last: null,
      });
    }
    this.offset = new THREE.Vector3();
    this.center = new THREE.Vector3();
    this.euler = new THREE.Euler();
    this.turn = new THREE.Quaternion();
  }

  apply(frame, isolated = "") {
    let changed = false;
    for (const [part, actor] of this.actors) {
      const {
        group,
        travel,
        pivot,
        position,
        rotation,
        inverse,
        parentRotation,
        parentInverse,
      } = actor;
      const transform = frame.assembly[part];
      const visible = !isolated || isolated === part;
      const electronics =
        part === "pcb" || part === "battery" ? frame.electronics : 0;
      const last = actor.last;
      if (
        last &&
        last.explode === frame.explode &&
        last.electronics === electronics &&
        group.visible === visible &&
        transform.offset.every((value, i) => value === last.offset[i]) &&
        transform.rotation.every((value, i) => value === last.rotation[i])
      ) continue;
      actor.last = {
        explode: frame.explode,
        electronics,
        offset: [...transform.offset],
        rotation: [...transform.rotation],
      };
      changed = true;
      this.offset.fromArray(transform.offset);
      this.offset.y += travel * frame.explode;
      // Retain the slide used in older imported story tracks.
      this.offset.y -= 0.045 * electronics;
      this.offset.z += 0.28 * electronics;
      this.euler.set(...transform.rotation.map(THREE.MathUtils.degToRad));
      this.turn
        .setFromEuler(this.euler)
        .premultiply(parentInverse)
        .multiply(parentRotation);
      group.quaternion.copy(this.turn).multiply(rotation);
      this.center.copy(pivot).applyQuaternion(this.turn);
      group.position
        .copy(position)
        .add(this.offset.applyMatrix3(inverse))
        .add(pivot)
        .sub(this.center);
      group.visible = visible;
    }
    return changed;
  }
}
