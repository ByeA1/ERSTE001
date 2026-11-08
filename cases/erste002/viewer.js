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

const PART_ORDER = ['bottom_plate', 'shell_top', 'button_cover', 'pcb', 'sensor', 'wheel', 'battery'];
const PART_LABEL = {
  shell_top: ['上盖', 'UPPER SHELL'],
  button_cover: ['按键盖', 'BUTTON COVER'],
  bottom_plate: ['底板', 'BOTTOM PLATE'],
  pcb: ['主板', 'MAIN BOARD'],
  sensor: ['传感器', 'SENSOR'],
  wheel: ['滚轮', 'SCROLL WHEEL'],
  battery: ['电池', 'BATTERY'],
};
const LIFT = {
  bottom_plate: -0.034, shell_top: 0.026, button_cover: 0.058,
  pcb: -0.006, sensor: -0.010, wheel: 0.004, battery: -0.012,
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let state = 'idle';            // idle | loading | ready | failed
let THREE = null, GLTFLoader = null, OrbitControls = null;
let renderer = null, scene = null, camera = null, controls = null, modelRoot = null, loader = null;
let parts = new Map();
let unitScale = 1;
let selected = null;
let explode = 0;
let tweenId = 0;
let stageVisible = false;
let pageVisible = !document.hidden;
let resizeBound = false;
let raycaster = null, pointer = null;
let selectionSpot = null, spotTween = 0, keyLight = null, rimLight = null;
let grainTex = null;

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
  // Highlight = light, not material. Emissive stays at zero here.
  parts.forEach((obj) => {
    obj.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) {
        o.material.emissive.set('#000000');
        o.material.emissiveIntensity = 0;
      }
    });
  });

  focusWithLight(name);
  if (state === 'ready') setStatus(name ? 'SELECTED' : 'READY');
}

/* ---------------- leader lines ---------------- */
const leaders = document.getElementById('leaders');
const SVG_NS = 'http://www.w3.org/2000/svg';

function ensureLeaderNodes() {
  if (!leaders || leaders.dataset.ready === '1') return;
  leaders.innerHTML = '';
  leaders.innerHTML = `
    <line x1="0" y1="0" x2="0" y2="0" />
    <circle class="dot" cx="0" cy="0" r="2.6" />
    <rect class="plate" x="0" y="0" width="0" height="0" rx="0" />
    <text x="0" y="0">SELECTED</text>`;
  leaders.dataset.ready = '1';
}

function updateLeader() {
  if (!leaders) return;
  ensureLeaderNodes();
  const line = leaders.querySelector('line');
  const dot = leaders.querySelector('.dot');
  const plate = leaders.querySelector('.plate');
  const text = leaders.querySelector('text');

  if (!selected || !parts.has(selected) || !camera) {
    leaders.style.display = 'none';
    return;
  }
  leaders.style.display = '';

  const obj = parts.get(selected);
  const box = new THREE.Box3().setFromObject(obj);
  const centre = box.getCenter(new THREE.Vector3());
  centre.project(camera);

  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  const x = (centre.x * 0.5 + 0.5) * w;
  const y = (-centre.y * 0.5 + 0.5) * h;

  // label sits on the side with more room
  const toRight = x < w * 0.6;
  const labelX = toRight ? Math.min(w - 132, x + 54) : Math.max(12, x - 132);
  const labelY = Math.max(28, Math.min(h - 28, y - 42));

  line.setAttribute('x1', String(x));
  line.setAttribute('y1', String(y));
  line.setAttribute('x2', String(toRight ? labelX : labelX + 120));
  line.setAttribute('y2', String(labelY + 12));

  dot.setAttribute('cx', String(x));
  dot.setAttribute('cy', String(y));

  const label = PART_LABEL[selected][1];
  plate.setAttribute('x', String(labelX - 6));
  plate.setAttribute('y', String(labelY - 12));
  plate.setAttribute('width', String(label.length * 6.4 + 16));
  plate.setAttribute('height', '20');
  text.setAttribute('x', String(labelX));
  text.setAttribute('y', String(labelY + 2));
  text.textContent = label;
}


/* Light-only focus: a narrow spot rides the selected part, the room dims. */
function focusWithLight(name) {
  if (!selectionSpot || !THREE) return;
  cancelAnimationFrame(spotTween);
  const keyLights = [keyLight, rimLight].filter(Boolean);

  if (!name || !parts.has(name)) {
    const fromI = selectionSpot.intensity;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 420);
      const e = 1 - Math.pow(1 - p, 3);
      selectionSpot.intensity = fromI * (1 - e);
      keyLights.forEach((l) => { l.intensity = l.userData.base * (0.45 + 0.55 * e); });
      if (p < 1) spotTween = requestAnimationFrame(step);
    };
    spotTween = requestAnimationFrame(step);
    return;
  }

  const box = new THREE.Box3().setFromObject(parts.get(name));
  const centre = box.getCenter(new THREE.Vector3());
  selectionSpot.target.position.copy(centre);
  selectionSpot.position.set(centre.x + 0.10, centre.y + 0.22, centre.z + 0.16);

  // two quick emissive blinks before the light settles, as the "look here" cue
  blinkPart(name);

  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 520);
    const e = 1 - Math.pow(1 - p, 3);
    selectionSpot.intensity = 2.6 * e;
    keyLights.forEach((l) => { l.intensity = l.userData.base * (1 - 0.55 * e); });
    if (p < 1) spotTween = requestAnimationFrame(step);
  };
  spotTween = requestAnimationFrame(step);
}

function blinkPart(name) {
  const obj = parts.get(name);
  if (!obj) return;
  const t0 = performance.now();
  obj.traverse((o) => {
    if (o.isMesh && o.material && o.material.emissive) {
      const step = (now) => {
        const el = now - t0;
        // 0.18s on / 0.12s off / 0.18s on / off
        let a = 0;
        if (el < 180) a = el / 180;
        else if (el < 300) a = 1 - (el - 180) / 120;
        else if (el < 480) a = (el - 300) / 180;
        else if (el < 600) a = 1 - (el - 480) / 120;
        o.material.emissive.set('#C4291E');
        o.material.emissiveIntensity = Math.max(0, a) * 0.22;
        if (el < 600) requestAnimationFrame(step);
        else { o.material.emissive.set('#000000'); o.material.emissiveIntensity = 0; }
      };
      requestAnimationFrame(step);
    }
  });
}

/* ---------------- scene ---------------- */
async function initScene() {
  const [threeMod, gltfMod, orbitMod, dracoMod] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/loaders/DRACOLoader.js'),
  ]);
  THREE = threeMod;
  const envMod = await import('three/addons/environments/RoomEnvironment.js');
  GLTFLoader = gltfMod.GLTFLoader;
  OrbitControls = orbitMod.OrbitControls;
  const DRACOLoader = dracoMod.DRACOLoader;
  const draco = new DRACOLoader();
  draco.setDecoderPath('./vendor/draco/');
  loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio, matchMedia('(max-width: 880px)').matches ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  viewport.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new envMod.RoomEnvironment(), 0.05).texture;
  scene.environmentIntensity = 0.5;
  scene.background = new THREE.Color('#0B0B0C');
  scene.fog = new THREE.FogExp2('#0B0B0C', 0.05);

  camera = new THREE.PerspectiveCamera(30, viewport.clientWidth / viewport.clientHeight, 0.01, 20);
  fitCamera();

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
  key.userData.base = 2.2;
  keyLight = key;
  key.position.set(-0.5, 0.9, 0.6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#C4291E', 0.55);
  rim.userData.base = 0.55;
  rimLight = rim;
  rim.position.set(0.8, 0.3, -0.7);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#F2EEE6', '#07070A', 0.28));



  // fine frosted micro-texture: breaks up the specular so highlights read as sheen, not blobs
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = noiseCanvas.height = 256;
  const nctx = noiseCanvas.getContext('2d');
  const img = nctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  grainTex = new THREE.CanvasTexture(noiseCanvas);
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;
  grainTex.repeat.set(8, 8);

  selectionSpot = new THREE.SpotLight('#FFF1E2', 0, 0.8, 0.42, 0.6, 1.2);
  selectionSpot.position.set(0, 0.3, 0.3);
  scene.add(selectionSpot);
  selectionSpot.target.position.set(0, 0, 0);
  scene.add(selectionSpot.target);

  modelRoot = new THREE.Group();
  scene.add(modelRoot);

  // soft contact shadow: cheap radial texture, no shadow map cost
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
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

const HOME = { x: 0.30, y: 0.22, z: 0.60 };

function fitCamera() {
  const w = viewport.clientWidth || 1;
  const h = viewport.clientHeight || 1;
  const aspect = w / h;
  const k = aspect < 1 ? Math.min(2.2, (1 / aspect) * 0.95) : 1;
  camera.position.set(HOME.x * k, HOME.y * k, HOME.z * k);
  camera.lookAt(0, 0, 0);
  if (controls) {
    controls.minDistance = 0.28 * k;
    controls.maxDistance = 1.5 * k;
    controls.target.set(0, 0, 0);
    controls.update();
  }
}

function resize() {
  if (!renderer) return;
  camera.aspect = viewport.clientWidth / viewport.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  fitCamera();
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
  loader.load(
    './assets/shell-full.glb',
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
            color: '#232326',
            metalness: 0.02,
            roughness: 0.86,
            roughnessMap: grainTex,
            bumpMap: grainTex,
            bumpScale: 0.0016,
            clearcoat: 0.0,
            envMapIntensity: 0.65,
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
    (err) => {
      console.error('gltf load failed', err);
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
  fitCamera();
});

/* ---------------- loop / lifecycle ---------------- */
function animate() {
  requestAnimationFrame(animate);
  if (!(stageVisible && pageVisible)) return;
  controls.update();
  renderer.render(scene, camera);
  updateLeader();
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
