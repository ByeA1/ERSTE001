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
scene.fog = new THREE.FogExp2('#0b0b0c', 0.05);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.01, 12);
const HOME = new THREE.Vector3(0.52, 0.30, 0.86);
camera.position.copy(HOME);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 0.35;
controls.maxDistance = 1.6;
controls.maxPolarAngle = Math.PI * 0.86;
controls.target.set(0, 0.01, 0);

const key = new THREE.DirectionalLight('#ffffff', 1.6);
key.position.set(-0.6, 0.9, 0.7);
scene.add(key);
const rim = new THREE.DirectionalLight('#9fb7ff', 0.9);
rim.position.set(0.8, 0.4, -0.9);
scene.add(rim);
scene.add(new THREE.HemisphereLight('#ffffff', '#101014', 0.18));

const ringUniforms = {
  uTime: { value: 0 },
  uProgress: { value: 0 },
  uOpacity: { value: 0 },
  uColor: { value: new THREE.Color('#c4291e') },
};

const ringMat = new THREE.ShaderMaterial({
  uniforms: ringUniforms,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform float uTime;
    uniform float uProgress;
    uniform float uOpacity;
    uniform vec3 uColor;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;
      float radius = mix(0.05, 1.0, uProgress);
      float band = smoothstep(0.035, 0.0, abs(r - radius));
      float trail = smoothstep(0.10, 0.0, abs(r - radius + 0.06)) * 0.35;
      float n = hash(floor(vec2(atan(p.y, p.x) * 24.0, uTime * 3.0)));
      float gate = step(0.35, n);
      float a = (band * gate + trail) * uOpacity;
      if (a < 0.002) discard;
      gl_FragColor = vec4(uColor, a);
    }
  `,
});

const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), ringMat);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -0.055;
scene.add(ring);

const gridMat = new THREE.MeshBasicMaterial({ color: '#232329', transparent: true, opacity: 0.5, side: THREE.DoubleSide });
const grid = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.95, 96, 1), gridMat);
grid.rotation.x = -Math.PI / 2;
grid.position.y = -0.062;
scene.add(grid);

const modelRoot = new THREE.Group();
scene.add(modelRoot);

const parts = new Map<string, THREE.Object3D>();
const PART_ORDER = ['bottom_plate', 'shell_top', 'button_cover'];
const PART_LABEL: Record<string, string> = {
  bottom_plate: '底板 / BOTTOM PLATE',
  shell_top: '上盖 / UPPER SHELL',
  button_cover: '按键盖 / BUTTON COVER',
};

let loaded = false;
let unitScale = 1;

new GLTFLoader().load('../../assets/models/shell-v6.glb', (gltf) => {
  const model = gltf.scene;
  const rawBox = new THREE.Box3().setFromObject(model);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const scale = 0.30 / Math.max(rawSize.x, rawSize.y, rawSize.z);
  model.scale.setScalar(scale);
  unitScale = scale;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.material = new THREE.MeshPhysicalMaterial({
        color: '#17171c', metalness: 0.06, roughness: 0.36,
        clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 0.65,
      });
      parts.set(m.name, m);
    }
  });

  modelRoot.add(model);
  loaded = true;
  playIntro();
});

function playIntro() {
  const title = document.getElementById('title')!;
  const rule = document.getElementById('rule')!;
  const meta = document.getElementById('meta')!;
  const hud = document.querySelectorAll<HTMLElement>('.hud .top, .hud .caption');

  gsap.set(modelRoot.scale, { x: 0.94, y: 0.94, z: 0.94 });
  gsap.set(modelRoot.position, { y: 0.0 });
  gsap.to(modelRoot.scale, { x: 1, y: 1, z: 1, duration: 1.0, ease: 'power3.out' }, 0);
  gsap.fromTo(title, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.05);
  gsap.to(rule, { width: 96, duration: 0.5, ease: 'power2.out' }, 0.25);
  gsap.to(meta, { opacity: 1, duration: 0.4 }, 0.3);
  gsap.fromTo(hud, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05 }, 0.1);

  gsap.to(ringUniforms.uOpacity, { value: 0.95, duration: 0.25 }, 0.3);
  gsap.to(ringUniforms.uProgress, { value: 1, duration: 0.85, ease: 'power2.inOut' }, 0.3);
  const scan = document.getElementById('scan')!;
  gsap.fromTo(scan, { opacity: 0.85, top: '18%' }, { top: '78%', duration: 0.85, ease: 'power2.inOut' }, 0.3);
  gsap.to(scan, { opacity: 0, duration: 0.3 }, 1.1);

  gsap.to(modelRoot.position, { y: 0.012, duration: 1.0, ease: 'power2.out' }, 1.2);
  gsap.to(ringUniforms.uOpacity, { value: 0.18, duration: 0.8 }, 1.5);
}

let exploded = false;
const LIFT: Record<string, number> = { bottom_plate: -0.034, shell_top: 0.026, button_cover: 0.058 };
const DELAY: Record<string, number> = { bottom_plate: 0, shell_top: 0.16, button_cover: 0.32 };

const labels = document.getElementById('labels')!;

function setExplode(on: boolean) {
  exploded = on;
  const btn = document.getElementById('btn-explode')!;
  btn.setAttribute('aria-pressed', String(on));
  btn.textContent = on ? '重组' : '拆解';

  const order = on ? PART_ORDER : [...PART_ORDER].reverse();
  order.forEach((name) => {
    const obj = parts.get(name);
    if (!obj) return;
    gsap.to(obj.position, {
      y: on ? (LIFT[name] ?? 0) / unitScale : 0,
      duration: on ? 0.62 : 0.5,
      delay: on ? DELAY[name] ?? 0 : 0.05,
      ease: on ? 'power3.out' : 'power3.inOut',
      overwrite: 'auto',
    });
  });

  gsap.to(camera.position, {
    x: on ? 0.56 : HOME.x, y: on ? 0.32 : HOME.y, z: on ? 0.94 : HOME.z,
    duration: 0.9, ease: 'power2.inOut',
  });
  gsap.to(ringUniforms.uOpacity, { value: on ? 0.06 : 0.18, duration: 0.5 });

  if (on) {
    labels.innerHTML = PART_ORDER.map((n) => `<div class="label">${PART_LABEL[n]}</div>`).join('');
    gsap.fromTo(labels.children, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, delay: 0.35 });
  } else {
    gsap.to(labels.children, { opacity: 0, duration: 0.2 }, 0);
    setTimeout(() => { labels.innerHTML = ''; }, 260);
  }
}

document.getElementById('btn-explode')!.addEventListener('click', () => setExplode(!exploded));

document.getElementById('btn-reset')!.addEventListener('click', () => {
  setExplode(false);
  gsap.to(camera.position, { ...HOME, duration: 0.7, ease: 'power2.inOut' });
  gsap.to(controls.target, { x: 0, y: 0.01, z: 0, duration: 0.7, ease: 'power2.inOut' });
});

let spinning = true;
const btnSpin = document.getElementById('btn-spin')!;
btnSpin.addEventListener('click', () => {
  spinning = !spinning;
  btnSpin.setAttribute('aria-pressed', String(spinning));
});

const clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();
  ringUniforms.uTime.value = t;
  if (spinning && !exploded) modelRoot.rotation.y += 0.0032;
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
