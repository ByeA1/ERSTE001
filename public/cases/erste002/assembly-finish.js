// ERSTE002's original web assembly palette, applied once when the model loads.
const finishes = {
  Wheel: 0xb8342a,
  Battery_300mAh: 0xb8342a,
  Buttons: 0x161618,
  Shell: 0x161618,
  PCB_Assembly: 0x3a1c5c,
};

const studioRoughness = {
  Wheel: 0.53,
  Battery_300mAh: 0.66,
  Buttons: 0.51,
  Shell: 0.49,
  PCB_Assembly: 0.55,
};

export function applyAssemblyFinish(object, studio = false) {
  for (let group = object.parent; group; group = group.parent) {
    if (!Object.hasOwn(finishes, group.name)) continue;
    object.material = object.material.clone();
    object.material.color.setHex(finishes[group.name]);
    object.material.vertexColors = false;
    object.material.metalness = studio ? 0 : 0.04;
    object.material.roughness = studio ? studioRoughness[group.name] : 0.62;
    return;
  }
}
