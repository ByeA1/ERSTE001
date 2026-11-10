import * as THREE from "three";

function createDiffuser() {
  const size = 64;
  const texels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const across = THREE.MathUtils.smoothstep(Math.min(u, 1 - u), 0, 0.22);
      const along = THREE.MathUtils.smoothstep(Math.min(v, 1 - v), 0, 0.13);
      const offset = (y * size + x) * 4;
      const value = Math.round(across * along * 255);
      texels.set([value, value, value, 255], offset);
    }
  }
  const map = new THREE.DataTexture(texels, size, size);
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}

// Bake the asymmetrical light stage once. Only the reflection orientation and
// intensity change during playback, independently of the real spotlights.
export function createStudioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0.012, 0.012, 0.012);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const diffuser = createDiffuser();
  const cards = [
    // A broad key strip across the top shell, a narrower side kicker and
    // a softer, angled strip from the front. Leave the opposite flank dark.
    {
      position: [-1.6, 2.75, -2.7],
      size: [4.2, 1.55],
      roll: -0.27,
      luminance: 5.6,
    },
    {
      position: [2.9, 1.18, -2.0],
      size: [0.75, 3.8],
      roll: 0.12,
      luminance: 3.1,
    },
    {
      position: [-2.8, 1.7, 2.2],
      size: [1.2, 3.9],
      roll: -0.18,
      luminance: 3.7,
    },
    {
      position: [0.55, -2.5, 2.3],
      size: [3.3, 1.65],
      roll: 0.2,
      luminance: 0.78,
    },
  ];
  for (const { position, size, roll, luminance } of cards) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(luminance, luminance, luminance),
      map: diffuser,
      toneMapped: false,
    });
    const card = new THREE.Mesh(geometry, material);
    card.position.fromArray(position);
    card.scale.set(...size, 1);
    card.lookAt(0, 0, 0);
    card.rotateZ(roll);
    studio.add(card);
  }

  const generator = new THREE.PMREMGenerator(renderer);
  try {
    return generator.fromScene(studio, 0.035, 0.1, 12, { size: 128 });
  } finally {
    generator.dispose();
    geometry.dispose();
    diffuser.dispose();
    for (const card of studio.children) card.material.dispose();
  }
}
