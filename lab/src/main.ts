import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0b0c');
scene.fog = new THREE.FogExp2('#0b0b0c', 0.06);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.01, 12);
camera.position.set(0.52, 0.30, 0.86);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 0.22;
controls.maxDistance = 0.95;
controls.maxPolarAngle = Math.PI * 0.86;
controls.target.set(0, 0.0, 0);

// lights
const key = new THREE.DirectionalLight('#ffffff', 1.6);
key.position.set(-0.6, 0.9, 0.7);
scene.add(key);
const rim = new THREE.DirectionalLight('#9fb7ff', 0.9);
rim.position.set(0.8, 0.4, -0.9);
scene.add(rim);
const fill = new THREE.HemisphereLight('#ffffff', '#101014', 0.18);
scene.add(fill);

// scanning ring
const ringMat = new THREE.MeshBasicMaterial({ color: '#c4291e', transparent: true, opacity: 0 });
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.0012, 8, 220), ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = -0.062;
scene.add(ring);

const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.0008, 8, 240), ringMat.clone());
ring2.rotation.x = Math.PI / 2;
ring2.position.y = -0.062;
scene.add(ring2);

// floor grid lines
const gridGeo = new THREE.RingGeometry(0.02, 0.9, 96, 1);
const gridMat = new THREE.MeshBasicMaterial({ color: '#2a2a30', transparent: true, opacity: 0.55, side: THREE.DoubleSide });
const grid = new THREE.Mesh(gridGeo, gridMat);
grid.rotation.x = -Math.PI / 2;
grid.position.y = -0.068;
scene.add(grid);

// model
const modelRoot = new THREE.Group();
scene.add(modelRoot);

const parts = new Map<string, THREE.Object3D>();
let loaded = false;

new GLTFLoader().load('../../assets/models/shell-v6.glb', (gltf) => {
  const model = gltf.scene;
  // normalise: STL was authored in mm at 1:1000 scale inside Blender
  const rawBox = new THREE.Box3().setFromObject(model);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const scale = 0.30 / Math.max(rawSize.x, rawSize.y, rawSize.z);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const size = box.getSize(new THREE.Vector3());
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat) { mat.color.set('#191a1f'); mat.metalness = 0.08; mat.roughness = 0.42; mat.envMapIntensity = 1.15; }
      if (mat && 'roughness' in mat) {

        mat.roughness = Math.min(0.45, mat.roughness ?? 0.35);
        mat.envMapIntensity = 0.9;
      }
    }
  });
  model.traverse((o) => { if ((o as any).isMesh) parts.set(o.name, o); });
  modelRoot.add(model);
  loaded = true;
  (window as any).__lab = { model, modelRoot, camera, box: { size: size.toArray(), center: center.toArray() }, rawScale: scale };
  console.log('LAB model size', size.toArray(), 'scale', scale);

  modelRoot.scale.setScalar(0.8);
  modelRoot.rotation.y = -0.6;
  modelRoot.position.y = 0.015;
  playIntro();
});

// explode: any direct children with a distinct origin get pushed outward
function buildExplodeTargets() {
  explodeTargets = [];
  modelRoot.children.forEach((child, i) => {
    if (i === 0) return;
    explodeTargets.push({ obj: child, dir: new THREE.Vector3(0, 1, 0), amount: 0.06 });
  });
}

function playIntro() {
  const tl = gsap.timeline();
  const scan = document.getElementById('scan')!;
  const title = document.getElementById('title')!;
  const rule = document.getElementById('rule')!;
  const meta = document.getElementById('meta')!;

  tl.fromTo(title, { yPercent: 108, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.15);
  tl.to(rule, { width: 96, duration: 0.6, ease: 'power2.out' }, 0.55);
  tl.to(meta, { opacity: 1, duration: 0.5 }, 0.75);

  tl.fromTo(scan, { opacity: 0.9, top: '12%' }, { top: '82%', duration: 1.1, ease: 'power2.inOut' }, 0.2);
  tl.to(scan, { opacity: 0, duration: 0.35 }, 1.25);

  tl.fromTo(ringMat, { opacity: 0 }, { opacity: 0.85, duration: 0.4 }, 0.9);
  tl.fromTo(ring.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'power2.out' }, 0.9);
  tl.to(ringMat, { opacity: 0.16, duration: 0.8 }, 1.9);

  tl.fromTo(modelRoot.scale, { x: 0.82, y: 0.82, z: 0.82 }, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'power3.out' }, 0.75);
  tl.fromTo(modelRoot.position, { y: -0.05 }, { y: 0.06, duration: 1.2, ease: 'power3.out' }, 0.75);

  tl.to(ring2.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 1.6, ease: 'power1.out', repeat: -1, yoyo: true }, 2.0);
}

// simple idle motion
let spinning = true;
const clock = new THREE.Clock();

function tick() {
  const t = clock.getElapsedTime();
  if (spinning) modelRoot.rotation.y += 0.0035;
  ring.position.y = -0.02 + Math.sin(t * 1.1) * 0.004;
  ring2.position.y = ring.position.y;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// controls
const btnExplode = document.getElementById('btn-explode')!;
const btnReset = document.getElementById('btn-reset')!;
const btnSpin = document.getElementById('btn-spin')!;

let exploded = false;
btnExplode.addEventListener('click', () => {
  exploded = !exploded;
  btnExplode.setAttribute('aria-pressed', String(exploded));
  gsap.to(modelRoot.position, { y: exploded ? 0.10 : 0.06, duration: 0.6, ease: 'power2.out' });
  gsap.to(modelRoot.rotation, { x: exploded ? -0.22 : 0, duration: 0.6, ease: 'power2.out' });
  gsap.to(ringMat, { opacity: exploded ? 0.05 : 0.16, duration: 0.5 });
});

btnReset.addEventListener('click', () => {
  gsap.to(camera.position, { x: 0.52, y: 0.30, z: 0.86, duration: 0.7, ease: 'power2.inOut' });
  gsap.to(controls.target, { x: 0, y: 0.02, z: 0, duration: 0.7, ease: 'power2.inOut' });
  exploded = false;
  btnExplode.setAttribute('aria-pressed', 'false');
  gsap.to(modelRoot.position, { y: 0.06, duration: 0.5 });
  gsap.to(modelRoot.rotation, { x: 0, duration: 0.5 });
});

btnSpin.addEventListener('click', () => {
  spinning = !spinning;
  btnSpin.setAttribute('aria-pressed', String(spinning));
});
