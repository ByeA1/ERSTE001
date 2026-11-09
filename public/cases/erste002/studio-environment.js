import * as THREE from "three";

// White studio cards provide broad reflections without another live render pass.
export function createStudioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0.018, 0.018, 0.018);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const cards = [
    { position: [-2.8, 3, 2.3], size: [4.4, 1.6], luminance: 3.2 },
    { position: [2.6, 1.4, -2.4], size: [0.65, 3.6], luminance: 2.7 },
    { position: [0.7, -2, 2.9], size: [3.2, 1.9], luminance: 0.75 },
  ];
  for (const { position, size, luminance } of cards) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(luminance, luminance, luminance),
      toneMapped: false,
    });
    const card = new THREE.Mesh(geometry, material);
    card.position.fromArray(position);
    card.scale.set(...size, 1);
    card.lookAt(0, 0, 0);
    studio.add(card);
  }

  const generator = new THREE.PMREMGenerator(renderer);
  try {
    return generator.fromScene(studio, 0.035, 0.1, 12, { size: 128 });
  } finally {
    generator.dispose();
    geometry.dispose();
    for (const card of studio.children) card.material.dispose();
  }
}
