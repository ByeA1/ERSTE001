/* ERSTE002 viewer — lazy engine, single animation owner, raycast picking. */
const viewport = document.getElementById('viewport');
const poster = document.getElementById('poster');
const loadBtn = document.getElementById('loadBtn');
const loadNote = document.getElementById('loadNote');
const statusText = document.getElementById('statusText');
const focusName = document.getElementById('focusName');
const partsEl = document.getElementById('parts');
const assembly = document.getElementById('assembly');
const assemblyPct = document.getElementById('assemblyPct');

const PART_ORDER = ['bottom_plate', 'shell_top', 'button_cover'];
const PART_LABEL = {
  shell_top: ['上盖', 'UPPER SHELL'],
  button_cover: ['按键盖', 'BUTTON COVER'],
  bottom_plate: ['底板', 'BOTTOM PLATE'],
};
const LIFT = { bottom_plate: -0.034, shell_top: 0.026, button_cover: 0.058 };

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let state = 'idle';            // idle | loading | ready | failed
let THREE = null, GLTFLoader = null, OrbitControls = null;
let renderer = null, scene = null, camera = null, controls = null, modelRoot = null;
let parts = new Map();
let unitScale = 1;
let selected = null;
let explode = 0;
let tweenId = 0;
let stageVisible = false;
let pageVisible = !document.hidden;
let resizeBound = false;
let raycaster = null, pointer = null;

function showRetry() {
  poster.classList.remove('hide');
  poster.innerHTML = '<button type="button" id="retryBtn">重新载入</button>';
  const btn = document.getElementById('retryBtn');
  btn.addEventListener('click', () => { state = 'idle'; start(); });
}

function setStatus(text, error = false) {
  statusText.textContent = text;
  statusText.classList.toggle('err', error);
}

function setControlsEnabled(on) {
  for (const el of [assembly, document.getElementById('btnExplode'), document.getElementById('btnReset')]) {
    el.disabled = !on;
    el.style.opacity = on ? '' : '.45';
    el.style.pointerEvents = on ? '' : 'none';
  }
}

/* ---------------- tween: one owner, resumes from the current value ---------------- */
function tweenTo(target, duration, done) {
  cancelAnimationFrame(tweenId);
  const from = explode;
  if (reduceMotion || duration <= 0) {
    applyExplode(target);
    if (done) done();
    return;
  }
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - p, 3);
    applyExplode(from + (target - from) * e);
    if (p < 1) {
      tweenId = requestAnimationFrame(step);
    } else {
      if (state === 'ready') setStatus(target > 0 ? 'EXPLODED' : 'ASSEMBLED');
      if (done) done();
    }
  }
  tweenId = requestAnimationFrame(step);
}

function applyExplode(t) {
  explode = t;
  parts.forEach((obj, name) => { obj.position.y = ((LIFT[name] || 0) / unitScale) * t; });
  const pct = Math.round(t * 100);
  assembly.value = String(pct);
  assemblyPct.textContent = pct + '%';
}

/* ---------------- parts ---------------- */
function faceCount(obj) {
  let tris = 0;
  obj.traverse((o) => {
    if (o.isMesh && o.geometry) {
      tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
    }
  });
  return Math.round(tris);
}

function buildList() {
  partsEl.innerHTML = '';
  const pending = parts.size === 0;
  PART_ORDER.forEach((name, i) => {
    const label = PART_LABEL[name];
    const obj = parts.get(name);
    const tris = obj ? faceCount(obj) : 0;
    const row = document.createElement('div');
    row.className = 'part';
    row.dataset.name = name;
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-selected', 'false');
    row.innerHTML = '<span class="idx">0' + (i + 1) + '</span>' +
      '<span class="name">' + label[0] + ' · ' + label[1] + '</span>' +
      '<span class="meta">' + (tris / 1000).toFixed(1) + 'k</span>';
    row.addEventListener('click', () => selectPart(name === selected ? null : name));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPart(name === selected ? null : name);
      }
    });
    if (pending) { row.style.opacity = '.55'; row.style.pointerEvents = 'none'; }
    partsEl.appendChild(row);
  });

  let total = 0;
  parts.forEach((o) => { total += faceCount(o); });
  const fact = document.querySelector('[data-tris]');
  if (fact) fact.textContent = (total / 1000).toFixed(1) + 'k';
}

function selectPart(name) {
  selected = name;
  Array.from(partsEl.children).forEach((el) => {
    el.setAttribute('aria-selected', String(el.dataset.name === name));
  });
  focusName.textContent = name ? PART_LABEL[name][1] : 'ALL PARTS';
  parts.forEach((obj, key) => {
    obj.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) {
        const on = key === name;
        o.material.emissive.set(on ? '#B3271C' : '#000000');
        o.material.emissiveIntensity = on ? 0.035 : 0;
      }
    });
  });
  if (state === 'ready') setStatus(name ? 'SELECTED' : 'READY');
}

/* ---------------- scene ---------------- */
async function initScene() {
  const [threeMod, gltfMod, orbitMod] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/controls/OrbitControls.js'),
  ]);
  THREE = threeMod;
  GLTFLoader = gltfMod.GLTFLoader;
  OrbitControls = orbitMod.OrbitControls;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio, matchMedia('(max-width: 880px)').matches ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  viewport.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#EDE7DB');
  scene.fog = new THREE.FogExp2('#EDE7DB', 0.06);

  camera = new THREE.PerspectiveCamera(30, viewport.clientWidth / viewport.clientHeight, 0.01, 20);
  camera.position.set(0.30, 0.22, 0.60);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.28;
  controls.maxDistance = 1.5;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;

  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(-0.5, 0.9, 0.6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#FFD9C9', 0.7);
  rim.position.set(0.8, 0.3, -0.7);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B9AE9B', 0.55));



  modelRoot = new THREE.Group();
  scene.add(modelRoot);

  // soft contact shadow: cheap radial texture, no shadow map cost
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(60,48,34,0.42)');
  grad.addColorStop(0.55, 'rgba(60,48,34,0.14)');
  grad.addColorStop(1, 'rgba(60,48,34,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9 }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -0.062;
  scene.add(contactShadow);

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('click', onCanvasClick);
  if (!resizeBound) { addEventListener('resize', resize); resizeBound = true; }

  animate();
}

function resize() {
  if (!renderer) return;
  camera.aspect = viewport.clientWidth / viewport.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
}

/* ---------------- picking ---------------- */
let pressAt = null;

let resumeTimer = 0;
function pauseSpin() {
  if (!controls) return;
  controls.autoRotate = false;
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => { if (controls && state === 'ready') controls.autoRotate = true; }, 3000);
}

function onPointerDown(ev) {
  if (!THREE) return;
  pressAt = { x: ev.clientX, y: ev.clientY };
  pauseSpin();
  skipIntro();
}

function onCanvasClick(ev) {
  if (!THREE || state !== 'ready') return;
  const moved = pressAt ? Math.hypot(ev.clientX - pressAt.x, ev.clientY - pressAt.y) : 0;
  pressAt = null;
  if (moved > 6) return;   // a drag is orbiting, not selecting
  pick(ev);
}

function pick(ev) {
  if (!raycaster) {
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
  }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);

  const meshes = [];
  parts.forEach((obj) => obj.traverse((o) => { if (o.isMesh) meshes.push(o); }));
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) { selectPart(null); return; }

  let node = hits[0].object;
  while (node && !parts.has(node.name)) node = node.parent;
  if (node) selectPart(node.name === selected ? null : node.name);
}

/* ---------------- model ---------------- */
function loadModel() {
  new GLTFLoader().load(
    './assets/shell.glb',
    (gltf) => {
      const model = gltf.scene;
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      unitScale = 0.30 / Math.max(rawSize.x, rawSize.y, rawSize.z);
      model.scale.setScalar(unitScale);
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      model.position.sub(box.getCenter(new THREE.Vector3()));

      model.traverse((o) => {
        if (o.isMesh) {
          o.material = new THREE.MeshPhysicalMaterial({
            color: '#2A2A2C', metalness: 0.10, roughness: 0.40,
            clearcoat: 0.35, clearcoatRoughness: 0.24, envMapIntensity: 0.85,
          });
          parts.set(o.name, o);
        }
      });

      modelRoot.add(model);
      state = 'ready';
      buildList();
      setControlsEnabled(true);
      setStatus('READY');
      playAssembly();
    },
    undefined,
    () => {
      state = 'failed';
      setStatus('LOAD FAILED', true);
      setControlsEnabled(false);
buildList();
      showRetry();
    },
  );
}

let introRunning = false;
function playAssembly() {
  introRunning = true;
  applyExplode(1);
  tweenTo(0, 850, () => { introRunning = false; });
}

function skipIntro() {
  if (!introRunning) return;
  introRunning = false;
  tweenTo(0, 0);
  setStatus('READY');
}

/* ---------------- controls ---------------- */
assembly.addEventListener('input', () => {
  if (state !== 'ready') return;
  cancelAnimationFrame(tweenId);
  applyExplode(Number(assembly.value) / 100);
  setStatus(explode > 0 ? 'EXPLODED' : 'ASSEMBLED');
});

document.getElementById('btnExplode').addEventListener('click', () => {
  if (state !== 'ready') return;
  setStatus('EXPLODING');
  tweenTo(explode > 0.5 ? 0 : 1, 650);
});

document.getElementById('btnReset').addEventListener('click', () => {
  if (state !== 'ready') return;
  pauseSpin();
  selectPart(null);
  tweenTo(0, 600);
  camera.position.set(0.30, 0.22, 0.60);
  controls.target.set(0, 0.01, 0);
});

/* ---------------- loop / lifecycle ---------------- */
function animate() {
  requestAnimationFrame(animate);
  if (!(stageVisible && pageVisible)) return;
  controls.update();
  renderer.render(scene, camera);
}

document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });
new IntersectionObserver(([entry]) => {
  stageVisible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
}, { threshold: [0, 0.1] }).observe(viewport);

/* ---------------- start / retry ---------------- */
async function start() {
  if (state === 'loading' || state === 'ready') return;
  state = 'loading';
  if (loadBtn) loadBtn.disabled = true;
  setStatus('LOADING');
  try {
    if (!renderer) await initScene();
    poster.classList.add('hide');
    loadModel();
  } catch (err) {
    state = 'failed';
    setStatus('LOAD FAILED', true);
    showRetry();
  }
}

// the terminal opened this case on purpose: start immediately, no prompt to click
if (loadNote) loadNote.textContent = '载入模型…';
start();

setControlsEnabled(false);
buildList();
