import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------- renderer / scene ---------- */
const host = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#EDE8DE');
scene.fog = new THREE.FogExp2('#EDE8DE', 0.06);

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.01, 20);
const HOME = new THREE.Vector3(0.40, 0.24, 0.70);
camera.position.copy(HOME);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.minDistance = 0.30;
controls.maxDistance = 1.7;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minPolarAngle = Math.PI * 0.18;
controls.target.set(0, 0.02, 0);

function fitCamera() {
  const aspect = innerWidth / innerHeight;
  const k = aspect < 1 ? Math.min(2.0, (1 / aspect) * 0.95) : 1;
  camera.position.set(HOME.x * k, HOME.y * k, HOME.z * k);
  controls.minDistance = 0.30 * k;
}
fitCamera();

/* ---------- lights ---------- */
const key = new THREE.DirectionalLight('#ffffff', 2.6);
key.position.set(-0.6, 0.9, 0.7);
scene.add(key);
const rim = new THREE.DirectionalLight('#9fb7ff', 1.5);
rim.position.set(0.8, 0.4, -0.9);
scene.add(rim);
scene.add(new THREE.HemisphereLight('#ffffff', '#8C8478', 0.55));

/* ---------- scan ring (shader) ---------- */
const ringUniforms = {
  uTime: { value: 0 }, uProgress: { value: 0 }, uOpacity: { value: 0 },
  uColor: { value: new THREE.Color('#BE8A34') },
};
const ring = new THREE.Mesh(
  new THREE.PlaneGeometry(1.15, 1.15),
  new THREE.ShaderMaterial({
    uniforms: ringUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform float uTime, uProgress, uOpacity; uniform vec3 uColor; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){
        vec2 p = vUv - 0.5; float r = length(p) * 2.0;
        float radius = mix(0.06, 1.0, uProgress);
        float band = smoothstep(0.03, 0.0, abs(r - radius));
        float trail = smoothstep(0.09, 0.0, abs(r - radius + 0.05)) * 0.3;
        float n = hash(floor(vec2(atan(p.y,p.x)*26.0, uTime*3.0)));
        float gate = step(0.42, n);
        float a = (band*gate + trail) * uOpacity;
        if (a < 0.002) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
  }),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -0.05;
scene.add(ring);

const grid = new THREE.Mesh(
  new THREE.RingGeometry(0.05, 0.92, 96, 1),
  new THREE.MeshBasicMaterial({ color: '#C9BFAE', transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
);
grid.rotation.x = -Math.PI / 2;
grid.position.y = -0.058;
scene.add(grid);

/* ---------- content: 002 model + 001 plate ---------- */
const stage = new THREE.Group();
scene.add(stage);

const projects = {
  '001': {
    id: 'ERSTE001', state: '已发布 / Prototyped', year: '2026',
    summary: '以 Sensor Spine 把传感器、PCB 与外���绑成统一基准，为低矮造型腾出结构空间。',
    href: '/projects/erste001.html',
  },
  '002': {
    id: 'ERSTE002', state: '结构迭代中 / WIP', year: '2026',
    summary: '在低矮的壳体内重新安排传感器、PCB 与滚轮，让光心对齐指尖的捏合轴。',
    href: '/projects/erste002.html',
  },
};

const modelGroup = new THREE.Group();
const plateGroup = new THREE.Group();
stage.add(modelGroup, plateGroup);

let modelReady = false;
let unitScale = 1;

const bootEl = document.getElementById('boot');
const lstate = document.getElementById('lstate');
const lpct = document.getElementById('lpct');
const lbar = document.getElementById('lbar');
let ready = false;
let revealed = false;

function reveal() {
  if (revealed) return;
  revealed = true;
  if (lstate) lstate.textContent = 'ready';
  if (lpct) lpct.textContent = '100%';
  bootEl.style.transition = 'opacity .5s';
  bootEl.style.opacity = '0';
  setTimeout(() => { bootEl.style.display = 'none'; }, 520);
  ringUniforms.uOpacity.value = 0.9;
  ringUniforms.uProgress.value = 0;
  animateValue(ringUniforms.uProgress, 'value', 1, 1100);
  animateValue(ringUniforms.uOpacity, 'value', 0.16, 1200, 900);
  modelGroup.scale.setScalar(0.94);
  animateTo(modelGroup.scale, { x: 1, y: 1, z: 1 }, 900);
}

// safety valve: never trap the visitor behind the overlay
setTimeout(() => { if (!revealed) { if (lstate) lstate.textContent = 'timeout'; reveal(); } }, 12000);

new GLTFLoader().load('./assets/models/shell-v6.glb', (gltf) => {
  const model = gltf.scene;
  const raw = new THREE.Box3().setFromObject(model);
  const rawSize = raw.getSize(new THREE.Vector3());
  const scale = 0.30 / Math.max(rawSize.x, rawSize.y, rawSize.z);
  unitScale = scale;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.sub(box.getCenter(new THREE.Vector3()));

  model.traverse((o) => {
    const m = o;
    if (m.isMesh) {
      m.material = new THREE.MeshPhysicalMaterial({
        color: '#17171c', metalness: 0.06, roughness: 0.36,
        clearcoat: 0.35, clearcoatRoughness: 0.22, envMapIntensity: 1.0,
      });
    }
  });
  modelGroup.add(model);
  modelReady = true;
  boot();
});

// 001: a still, shown as a plane so the index has something to switch to
new THREE.TextureLoader().load('./assets/render/shell-001-1440.avif', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  const aspect = tex.image.width / tex.image.height;
  const h = 0.26;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(h * aspect, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 }),
  );
  plane.position.set(0, 0.06, 0);
  plane.rotation.y = -0.35;
  plateGroup.add(plane);
});
plateGroup.visible = false;

/* ---------- boot ---------- */
const sweep = document.getElementById('sweep');

function typeLine(el, delay) {
  return { el, delay };
}

function boot() {
  const lines = ['l1', 'l2', 'l3', 'l4'].map((id) => document.getElementById(id));
  lines.forEach((el, i) => {
    setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '1'; }, 120 + i * 190);
  });
  sweep.style.transition = 'opacity .2s';
  sweep.style.opacity = '0.9';
  sweep.animate([{ top: '18%' }, { top: '82%' }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' });
  setTimeout(() => { sweep.style.opacity = '0'; }, 950);



}

function animateValue(obj, key, to, duration, delay = 0) {
  const from = obj[key];
  const t0 = performance.now() + delay;
  function step(now) {
    const t = Math.min(1, Math.max(0, (now - t0) / duration));
    const e = 1 - Math.pow(1 - t, 3);
    obj[key] = from + (to - from) * e;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateTo(obj, to, duration) {
  const from = {};
  Object.keys(to).forEach((k) => { from[k] = obj[k]; });
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - t, 3);
    Object.keys(to).forEach((k) => { obj[k] = from[k] + (to[k] - from[k]) * e; });
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

boot();

/* ---------- selection ---------- */
let selected = '002';

function select(id) {
  if (id === selected) return;
  selected = id;
  document.querySelectorAll('.item').forEach((el) => {
    el.setAttribute('aria-selected', String(el.dataset.id === id));
  });

  const p = projects[id];
  document.getElementById('d-id').textContent = p.id;
  document.getElementById('d-state').textContent = p.state;
  document.getElementById('d-year').textContent = p.year;
  document.getElementById('d-summary').textContent = p.summary;
  document.getElementById('d-enter').href = p.href;

  const showModel = id === '002';
  const showPlate = id === '001';
  modelGroup.visible = showModel;
  plateGroup.visible = showPlate;

  ringUniforms.uProgress.value = 0;
  ringUniforms.uOpacity.value = 0.55;
  animateValue(ringUniforms.uProgress, 'value', 1, 900);
  animateValue(ringUniforms.uOpacity, 'value', 0.16, 900, 500);

  const target = showModel ? 0 : -0.25;
  animateTo(stage.rotation, { y: target }, 700);
}

document.querySelectorAll('.item').forEach((el) => {
  el.addEventListener('click', () => select(el.dataset.id));
});

addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') select('001');
  if (e.key === 'ArrowRight') select('002');
});

/* ---------- clock ---------- */
const clockEl = document.getElementById('clock');
function tickClock() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  clockEl.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let spin = 0;
function tick() {
  const t = clock.getElapsedTime();
  ringUniforms.uTime.value = t;
  spin += 0.0018;
  if (modelGroup.visible) modelGroup.rotation.y = Math.sin(t * 0.12) * 0.22 + 0.15;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  fitCamera();
});
