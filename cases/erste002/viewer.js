import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewport = document.getElementById('viewport');
const poster = document.getElementById('poster');
const statusText = document.getElementById('statusText');
const focusName = document.getElementById('focusName');
const partsEl = document.getElementById('parts');
const assembly = document.getElementById('assembly');
const assemblyPct = document.getElementById('assemblyPct');

const PART_ORDER = ['bottom_plate', 'shell_top', 'button_cover'];
const PART_LABEL = {
  shell_top: ['上盖', 'UPPER SHELL', 9.0],
  button_cover: ['按键盖', 'BUTTON COVER', 5.9],
  bottom_plate: ['底板', 'BOTTOM PLATE', 0.6],
};

let renderer, scene, camera, controls, modelRoot;
let parts = new Map();
let unitScale = 1;
let started = false;
let visible = true;
let rafId = 0;
let selected = null;
let explode = 0; // 0 = assembled, 1 = fully apart

function setStatus(text, error = false) {
  statusText.textContent = text;
  statusText.classList.toggle('err', error);
}

/* ---------- part list ---------- */
function buildList() {
  partsEl.innerHTML = '';
  PART_ORDER.forEach((name, i) => {
    const [zh, en, faces] = PART_LABEL[name];
    const row = document.createElement('div');
    row.className = 'part';
    row.dataset.name = name;
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-selected', 'false');
    row.innerHTML = `<span class="idx">0${i + 1}</span><span class="name">${zh} · ${en}</span><span class="meta">${faces}k</span>`;
    row.addEventListener('click', () => selectPart(name === selected ? null : name));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPart(name); } });
    partsEl.appendChild(row);
  });
}

function selectPart(name) {
  selected = name;
  [...partsEl.children].forEach((el) => el.setAttribute('aria-selected', String(el.dataset.name === name)));
  focusName.textContent = name ? PART_LABEL[name][1] : 'ALL PARTS';
  parts.forEach((obj, key) => {
    const mesh = obj3D;
    mesh.traverse((o) => {
      const m = o;
      if (m.isMesh && m.material) {
        const mat = m.material;
        if (mat.emissive) {
          const on = key === name;
          mat.emissive.set(on ? '#22D3EE' : '#000000');
          mat.emissiveIntensity = on ? 0.35 : 0;
        }
      }
    });
  });
  setStatus(name ? 'SELECTED' : 'READY');
}

/* ---------- scene ---------- */
function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio, matchMedia('(max-width: 880px)').matches ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  viewport.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#080D17');
  scene.fog = new THREE.FogExp2('#080D17', 0.05);

  camera = new THREE.PerspectiveCamera(30, viewport.clientWidth / viewport.clientHeight, 0.01, 20);
  camera.position.set(0.30, 0.22, 0.60);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.28;
  controls.maxDistance = 1.5;
  controls.maxPolarAngle = Math.PI * 0.58;

  const key = new THREE.DirectionalLight('#ffffff', 3.2);
  key.position.set(-0.5, 0.9, 0.6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#22D3EE', 1.6);
  rim.position.set(0.8, 0.3, -0.7);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#DCE3EC', '#05080F', 0.9));

  const grid = new THREE.GridHelper(1.6, 32, '#1B2C42', '#12202F');
  grid.position.y = -0.075;
  scene.add(grid);

  modelRoot = new THREE.Group();
  scene.add(modelRoot);

  animate();
}

function loadModel() {
  setStatus('LOADING');
  new GLTFLoader().load(
    './assets/shell.glb',
    (gltf) => {
      const model = gltf.scene;
      const raw = new THREE.Box3().setFromObject(model);
      const rawSize = raw.getSize(new THREE.Vector3());
      unitScale = 0.30 / Math.max(rawSize.x, rawSize.y, rawSize.z);
      model.scale.setScalar(unitScale);
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      model.position.sub(box.getCenter(new THREE.Vector3()));

      model.traverse((o) => {
        const m = o;
        if (m.isMesh) {
          m.material = new THREE.MeshPhysicalMaterial({
            color: '#2C3949', metalness: 0.22, roughness: 0.30,
            clearcoat: 0.45, clearcoatRoughness: 0.22, envMapIntensity: 1.35,
          });
          parts.set(m.name, m);
        }
      });

      modelRoot.add(model);
      buildList();
      setStatus('READY');
      playAssembly();
    },
    undefined,
    () => {
      setStatus('LOAD FAILED', true);
      poster.classList.remove('hide');
      poster.querySelector('button').textContent = '重试';
    },
  );
}

/* ---------- assembly animation & controls ---------- */
function liftFor(name, t) {
  const amount = { bottom_plate: -0.034, shell_top: 0.026, button_cover: 0.058 }[name] ?? 0;
  return (amount / unitScale) * t;
}

function applyExplode(t) {
  explode = t;
  parts.forEach((obj, name) => {
    obj.position.y = liftFor(name, t);
  });
  assembly.value = String(Math.round(t * 100));
  assemblyPct.textContent = `${Math.round(t * 100)}%`;
}

function playAssembly() {
  applyExplode(1);
  const t0 = performance.now();
  const dur = 850;
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    applyExplode(1 - e);
    if (p < 1) requestAnimationFrame(step);
    else setStatus('READY');
  }
  requestAnimationFrame(step);
}

assembly.addEventListener('input', () => {
  applyExplode(Number(assembly.value) / 100);
  setStatus(Number(assembly.value) > 0 ? 'EXPLODED' : 'ASSEMBLED');
});

document.getElementById('btnExplode').addEventListener('click', () => {
  setStatus('EXPLODING');
  const from = explode;
  const to = from > 0.5 ? 0 : 1;
  const t0 = performance.now();
  const dur = 650;
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    applyExplode(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
    else setStatus(to ? 'EXPLODED' : 'ASSEMBLED');
  }
  requestAnimationFrame(step);
});

document.getElementById('btnReset').addEventListener('click', () => {
  selectPart(null);
  playAssembly();
  camera.position.set(0.30, 0.22, 0.60);
  controls.target.set(0, 0.01, 0);
});

/* ---------- loop / lifecycle ---------- */
function animate() {
  rafId = requestAnimationFrame(animate);
  if (!visible) return;
  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  if (!renderer) return;
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
addEventListener('resize', resize);

document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 }).observe(viewport);

/* ---------- lazy start ---------- */
function start() {
  if (started) return;
  started = true;
  poster.classList.add('hide');
  init();
  loadModel();
}

document.getElementById('loadBtn').addEventListener('click', start);

// desktop: auto-start once the stage is properly visible; mobile keeps the explicit button
if (matchMedia('(min-width: 881px)').matches) {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && entries[0].intersectionRatio >= 0.1) {
      io.disconnect();
      start();
    }
  }, { threshold: [0.1] });
  io.observe(viewport);
}
