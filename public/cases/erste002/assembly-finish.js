// ERSTE002's original web assembly palette, applied once when the model loads.
const finishes = {
  Wheel: 0xb8342a,
  Battery_300mAh: 0xb8342a,
  Buttons: 0x161618,
  Shell: 0x161618,
  PCB_Assembly: 0x3a1c5c,
};

export function applyAssemblyFinish(object) {
  for (let group = object.parent; group; group = group.parent) {
    if (!Object.hasOwn(finishes, group.name)) continue;
    object.material = object.material.clone();
    object.material.color.setHex(finishes[group.name]);
    object.material.vertexColors = false;
    object.material.metalness = 0.04;
    object.material.roughness = 0.62;
    return;
  }
}
