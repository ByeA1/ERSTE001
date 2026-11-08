import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  DEFAULT_STORY,
  clone,
  clamp,
  sampleStory,
  cueStrength,
  captionAt,
  smooth,
} from "./story-timeline.js";
import { compileStory, editFrame, MODEL } from "./story-segments.js";
import { applyAssemblyFinish } from "./assembly-finish.js";
import { SectionCut } from "./story-section.js";
import { createEditor } from "./story-editor.js";
import { RenderFrameLimiter } from "../shared/render-frame.js";

const $ = (s) => document.querySelector(s);
const host = $("#scene-root");
const body = document.body;
const loading = $("#loading");
const loadingCopy = $("#loading-copy");
const retry = $("#retry");
const modeButton = $("#mode");
const previous = $("#prev-chapter");
const next = $("#next-chapter");
const caption = $("#caption");
const capContent = $("#cap-content");
const progress = $("#progress");
const chapterNumber = $("#chapter-number");
const chapterTitle = $("#chapter-title");
const partSelect = $("#part");
const assembly = $("#assembly");
const status = document.createElement("span");
status.id = "statusText";
status.hidden = true;
status.textContent = "LOADING";
body.append(status);

const partNames = {
  Mesh_Shell: "shell_top",
  Mesh_Buttons: "button_cover",
  Mesh_Wheel: "wheel",
  PCB_plate: "pcb",
  LiPo_300mAh_envelope: "battery",
};
const heightMarkers = $("#button-height-markers");
const heightLandmarks = [
  {
    node: $("#left-button-height"),
    point: new THREE.Vector3(0.03434, 0.01199, 0.09105),
    text: ["左键 · 高", "LEFT · HIGH"],
  },
  {
    node: $("#right-button-height"),
    point: new THREE.Vector3(-0.03458, 0.00536, 0.09099),
    text: ["右键 · 低", "RIGHT · LOW"],
  },
];
const projected = new THREE.Vector3();
const portrait = matchMedia("(max-width: 740px), (orientation: portrait)");
const partLabels = [
  ["整体", "All parts"],
  ["上盖", "Upper shell"],
  ["按键盖", "Button cover"],
  ["滚轮", "Scroll wheel"],
  ["主板", "Main board"],
  ["电池", "Battery"],
];
const assemblyTravel = {
  Wheel: 0.155,
  Buttons: 0.105,
  Shell: 0.049,
  PCB_Assembly: 0.002,
  Battery_300mAh: -0.047,
};
const renderLimit = new RenderFrameLimiter();
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const meshes = [],
  parts = new Map(),
  actors = [];
const target = new THREE.Vector3();
const capTitle = $("#cap-title"),
  capBody = $("#cap-body"),
  capTag = $("#cap-tag");
const initialReadout = ["外观", "Form"];
let story = DEFAULT_STORY,
  source = DEFAULT_STORY,
  chapters = [],
  chapterIndex = 0;
let p = 0,
  playback = null,
  draft = null,
  free = false,
  helper = false;
let renderer, scene, camera, controls, ambient, lights, section, model, scale;
let originalFov = 32,
  lang = 0,
  lastCaption = null,
  triangles = 0;
let ready = false,
  visible = true,
  parentPaused = false,
  parentReduced = false;
let raf = 0,
  dirty = false,
  lastTime = 0,
  pixelRatio = 0,
  renderWidth = 0,
  renderHeight = 0;
let editor = { update() {} };

function reducedMotion() {
  return motion.matches || parentReduced;
}
function updateChapters() {
  const selected = chapters[chapterIndex];
  const number = (value) => String(value).padStart(2, "0");
  chapterNumber.textContent =
    number(chapterIndex + 1) + " / " + number(chapters.length || 1);
  chapterTitle.textContent = selected?.title[lang] ?? initialReadout[lang];
  const loading = body.dataset.projectReady === "loading";
  previous.disabled = loading || chapterIndex === 0;
  next.disabled = loading || chapterIndex >= chapters.length - 1;
}
function setLanguage(value, notify = false) {
  lang = value === "en" ? 1 : 0;
  document.documentElement.lang = lang ? "en" : "zh-CN";
  $("#lang").textContent = lang ? "中" : "EN";
  $(".identity").setAttribute(
    "aria-label",
    lang ? "Back to terminal" : "返回终端",
  );
  $(".chapter-controls").setAttribute(
    "aria-label",
    lang ? "Story chapters" : "演出章节",
  );
  previous.lastElementChild.textContent = lang ? "Previous" : "上一章";
  next.firstElementChild.textContent = lang ? "Next" : "下一章";
  $("#part-label").textContent = lang ? "Part" : "部件";
  $("#assembly-label").textContent = lang ? "Assembly" : "装配";
  $("#explode").textContent = lang ? "Explode" : "展开";
  $("#reset").textContent = lang ? "Reset" : "复位";
  $("#assembly-link").textContent = lang ? "Assembly ↗" : "装配图 ↗";
  retry.textContent = lang ? "Reload model" : "重新载入";
  [...partSelect.options].forEach(
    (option, i) => (option.textContent = partLabels[i][lang]),
  );
  modeButton.textContent = free
    ? lang
      ? "Return to story"
      : "返回演出"
    : lang
      ? "Free view"
      : "自由查看";
  loadingCopy.textContent =
    body.dataset.projectReady === "failed"
      ? lang
        ? "The 3D model could not be displayed."
        : "暂时无法显示三维模型。"
      : lang
        ? "Loading 3D model…"
        : "正在载入三维模型…";
  for (const { node, text } of heightLandmarks) node.textContent = text[lang];
  lastCaption = null;
  updateChapters();
  updateCaption();
  invalidate();
  if (notify && parent !== window)
    parent.postMessage(
      { type: "design-terminal:case-language", language: value },
      location.origin,
    );
}
$("#lang").onclick = () => setLanguage(lang ? "zh" : "en", true);
$(".identity").onclick = (event) => {
  if (parent === window) return;
  event.preventDefault();
  parent.postMessage(
    { type: "design-terminal:close-project" },
    location.origin,
  );
};
addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  const { type, language, reduced } = event.data ?? {};
  if (type === "design-terminal:case-language") setLanguage(language);
  if (type === "design-terminal:pause") {
    parentPaused = true;
    pause();
  }
  if (type === "design-terminal:resume") {
    parentPaused = false;
    resize();
    invalidate();
  }
  if (type === "design-terminal:case-policy") {
    parentReduced = Boolean(reduced);
    resize();
    invalidate();
  }
});
motion.addEventListener("change", invalidate);
function configureStory(value) {
  const compiled = compileStory(value);
  source = value;
  story = compiled;
  chapters =
    compiled.ranges ??
    compiled.captions.map((item, i, all) => ({
      id: "legacy-" + (i + 1),
      title: item.title,
      start: item.start,
      end: item.end,
      hold: i === 0 ? 0 : (item.start + item.end) / 2,
    }));
  chapterAtProgress();
  lastCaption = null;
  updateChapters();
  updateCaption();
  invalidate();
}
function chapterAtProgress() {
  chapterIndex = Math.max(
    0,
    chapters.findLastIndex((item) => p >= item.start - 1e-7),
  );
}
function navigate(offset) {
  const index = chapterIndex + offset;
  if (
    body.dataset.projectReady === "loading" ||
    index < 0 ||
    index >= chapters.length
  )
    return;
  setFree(false);
  draft = null;
  chapterIndex = index;
  const to = chapters[index].hold;
  const duration = Math.max(0.45, Math.abs(to - p) * (story.duration ?? 16));
  playback = { from: p, to, duration, elapsed: 0 };
  updateChapters();
  invalidate();
}
previous.onclick = () => navigate(-1);
next.onclick = () => navigate(1);
addEventListener("keydown", (event) => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    free ||
    event.target.closest("button, input, select, textarea, a, #editor")
  )
    return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  navigate(event.key === "ArrowLeft" ? -1 : 1);
});
function setFree(value) {
  if (free === value) return;
  free = value;
  body.dataset.mode = free ? "free" : "chapter";
  $("#free-controls").hidden = !free;
  modeButton.setAttribute("aria-pressed", String(free));
  if (controls) {
    controls.enabled = free;
    if (free) {
      controls.target.fromArray(draft.camera.target);
      camera.position.fromArray(draft.camera.position);
      controls.update();
    }
  }
  setLanguage(lang ? "en" : "zh");
}
modeButton.onclick = () => {
  if (!ready) return;
  if (!free) {
    const current = capture();
    draft = current.cut.enabled ? clone(story.keyframes[0]) : current;
    setFree(true);
  } else {
    draft = null;
    setFree(false);
  }
  invalidate();
};
function capture() {
  const value = clone(draft || sampleStory(story, p));
  if (ready) {
    value.camera.position = camera.position.toArray();
    value.camera.target = (free ? controls.target : target).toArray();
    value.camera.fov = originalFov;
  }
  value.at = p;
  return value;
}
function aim(name) {
  if (!parts.has(name)) return;
  draft = capture();
  const center = new THREE.Box3()
    .setFromObject(parts.get(name))
    .getCenter(new THREE.Vector3());
  const light = draft.lights.focus;
  light.target = center.toArray();
  light.position = center
    .clone()
    .add(new THREE.Vector3(0.12, 0.16, 0.12))
    .toArray();
  light.intensity = 4;
  draft.lights.key.intensity = 0.85;
  draft.lights.rim.intensity = 0.65;
  draft.ambient = 0.4;
  draft.focus = name;
  invalidate();
}
partSelect.onchange = () => {
  if (partSelect.value) aim(partSelect.value);
  else {
    draft = capture();
    draft.lights = clone(story.keyframes[0].lights);
    draft.ambient = story.keyframes[0].ambient;
    draft.focus = "";
    invalidate();
  }
};
assembly.oninput = () => {
  draft = capture();
  draft.explode = Number(assembly.value);
  invalidate();
};
$("#explode").onclick = () => {
  draft = capture();
  draft.explode = 1;
  invalidate();
};
$("#reset").onclick = () => {
  draft = clone(story.keyframes[0]);
  camera.position.fromArray(draft.camera.position);
  controls.target.fromArray(draft.camera.target);
  controls.update();
  invalidate();
};
retry.onclick = () => location.reload();
function resize() {
  if (!renderer) return;
  const w = host.clientWidth,
    h = host.clientHeight;
  if (w < 1 || h < 1) return;
  const tier = document.documentElement.dataset.terminalQuality;
  const mobile = portrait.matches;
  const ratio = Math.min(
    devicePixelRatio,
    tier === "low" ? 1 : mobile ? 1.35 : 1.65,
    Math.sqrt(1_450_000 / (w * h)),
  );
  if (pixelRatio !== ratio) {
    renderer.setPixelRatio(ratio);
    pixelRatio = ratio;
  }
  if (renderWidth !== w || renderHeight !== h) {
    renderer.setSize(w, h, false);
    renderWidth = w;
    renderHeight = h;
  }
  camera.aspect = w / h;
  invalidate();
}
new ResizeObserver(resize).observe(host);
addEventListener("resize", resize);
function canRender() {
  return visible && !parentPaused && !document.hidden;
}
function invalidate() {
  dirty = true;
  if (!raf && canRender()) raf = requestAnimationFrame(tick);
}
function pause() {
  cancelAnimationFrame(raf);
  raf = 0;
  lastTime = 0;
}
document.addEventListener("visibilitychange", () =>
  document.hidden ? pause() : invalidate(),
);
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible) invalidate();
  else pause();
}).observe(host);
addEventListener("pageshow", (event) => {
  if (event.persisted) invalidate();
});
addEventListener("pagehide", (event) => {
  pause();
  if (event.persisted) return;
  scene?.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    object.material?.dispose();
  });
  controls?.dispose();
  renderer?.dispose();
});
function updateCaption() {
  const cap = captionAt(story, p);
  const key = cap ? cap.start : null;
  if (
    cap &&
    (lastCaption !== key || capTitle.textContent !== cap.title[lang])
  ) {
    capTag.textContent = cap.tag;
    capTitle.textContent = cap.title[lang];
    capBody.textContent = cap.body[lang];
    body.dataset.segment =
      chapters.findLast((item) => cap.start >= item.start - 1e-7)?.id ??
      "exterior";
    lastCaption = key;
  }
  if (cap) body.dataset.captionLayout = cap.layout ?? "left";
  const opacity = !cap ? 0 : reducedMotion() ? 1 : cap.opacity;
  heightMarkers.hidden = !ready || free || cap?.annotation !== "button-height";
  if (!heightMarkers.hidden) heightMarkers.style.opacity = opacity;
  capContent.style.opacity = opacity;
  capContent.style.transform = reducedMotion()
    ? ""
    : "translateY(" + (1 - opacity) * 7 + "px)";
  caption.hidden = free;
  progress.textContent = String(Math.round(p * 100)).padStart(3, "0") + "%";
  progress.parentElement.style.setProperty("--progress", p);
  body.dataset.progress = p.toFixed(4);
  body.dataset.playing = String(Boolean(playback) && !free);
}
function apply(value) {
  originalFov = value.camera.fov;
  const view = Math.tan(THREE.MathUtils.degToRad(originalFov / 2));
  camera.fov = THREE.MathUtils.radToDeg(
    2 * Math.atan(view * Math.max(1, 1.03 / camera.aspect)),
  );
  if (!free) {
    camera.position.fromArray(value.camera.position);
    target.fromArray(value.camera.target);
    camera.lookAt(target);
  } else {
    controls.update();
    target.copy(controls.target);
  }
  const [x, y] = value.camera.frame;
  if (portrait.matches || free) camera.clearViewOffset();
  else if (renderWidth && renderHeight)
    camera.setViewOffset(
      renderWidth,
      renderHeight,
      (-x * renderWidth) / 2,
      (y * renderHeight) / 2,
      renderWidth,
      renderHeight,
    );
  camera.updateProjectionMatrix();
  if (!heightMarkers.hidden) {
    camera.updateMatrixWorld();
    for (const { node, point } of heightLandmarks) {
      projected.copy(point).project(camera);
      node.style.left = 50 + projected.x * 50 + "%";
      node.style.top = 50 - projected.y * 50 + "%";
    }
  }
  for (const [name, light] of Object.entries(lights)) {
    const definition = value.lights[name];
    light.position.fromArray(definition.position);
    light.target.position.fromArray(definition.target);
    light.intensity = definition.intensity;
    light.color.set(definition.color);
    light.angle = THREE.MathUtils.degToRad(definition.angle);
  }
  ambient.intensity = value.ambient;
  assembly.value = value.explode;
  partSelect.value = value.focus;
  for (const { group, origin } of actors) {
    group.position.copy(origin);
    group.position.z += (assemblyTravel[group.name] * value.explode) / scale;
    if (group.userData.referenceAssembly) {
      // Slide the reference components toward the removed front half of the cut.
      group.position.y -= (0.28 * value.electronics) / scale;
      group.position.z -= (0.045 * value.electronics) / scale;
    }
  }
  let energy = 0;
  for (const mesh of meshes) {
    const emissive =
      reducedMotion() || value.lights.focus.intensity > 0.00001
        ? 0
        : cueStrength(draft ? { keyframes: [draft] } : story, p, mesh.name);
    mesh.material.emissive.setScalar(emissive > 0 ? 1 : 0);
    mesh.material.emissiveIntensity = emissive;
    energy = Math.max(energy, emissive);
  }
  model.updateMatrixWorld(true);
  const cutFaces = section.update(value.cut, helper);
  host.dataset.sectionFaces = cutFaces;
  body.dataset.cut = String(value.cut.enabled);
  body.dataset.emissive = energy.toFixed(4);
  editor.update(p, {
    mode: draft ? "手动预览" : playback ? "镜头演出" : "章节停留",
    light: lights.focus.intensity,
    emissive: energy,
    cut: value.cut.enabled ? "ON" : "OFF",
    cutFaces,
    triangles,
  });
}
function tick(now) {
  raf = 0;
  if (!canRender() || !dirty) return;
  const previousTime = lastTime;
  if (!previousTime || now - previousTime > 250) renderLimit.reset();
  const tier = document.documentElement.dataset.terminalQuality ?? "high";
  if (!renderLimit.admit(now, tier === "high")) {
    raf = requestAnimationFrame(tick);
    return;
  }
  const renderStart = performance.now();
  const dt =
    previousTime && now - previousTime <= 250
      ? Math.min(0.12, (now - previousTime) / 1000)
      : 0;
  lastTime = now;
  dirty = false;
  if (playback && !free) {
    playback.elapsed += dt;
    const fraction =
      !ready || reducedMotion()
        ? 1
        : clamp(playback.elapsed / playback.duration);
    p = playback.from + (playback.to - playback.from) * smooth(fraction);
    if (fraction === 1) {
      p = playback.to;
      playback = null;
    }
  }
  updateCaption();
  if (ready) {
    apply(draft || sampleStory(story, p));
    renderer.render(scene, camera);
    renderLimit.recordFrame(performance.now() - renderStart);
    host.dataset.fpsLimit = renderLimit.fpsLimit;
  }
  if (playback && !free) invalidate();
}
function setReady(value) {
  ready = value;
  body.dataset.ready = String(value);
  body.dataset.projectReady = value ? "ready" : "failed";
  status.textContent = value ? "READY" : "FAILED";
  status.classList.toggle("err", !value);
  modeButton.disabled = !value;
  assembly.disabled = !value;
  loading.hidden = value;
  retry.hidden = value;
  if (renderer) renderer.domElement.hidden = !value;
  if (value) {
    $("#fallback-poster")?.remove();
    if (parent !== window)
      parent.postMessage(
        { type: "design-terminal:case-ready" },
        location.origin,
      );
  } else if (!$("#fallback-poster")) {
    const image = document.createElement("img");
    image.id = "fallback-poster";
    image.src = "/assets/render/002-cover.avif";
    image.alt = "ERSTE002";
    loading.prepend(image);
  }
  setLanguage(lang ? "en" : "zh");
}
async function loadStory() {
  try {
    const response = await fetch("./story.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    configureStory(await response.json());
  } catch (error) {
    console.warn("ERSTE002 story fallback", error.message);
    configureStory(DEFAULT_STORY);
  }
}
function seek(progress) {
  playback = null;
  draft = null;
  setFree(false);
  p = clamp(progress);
  chapterAtProgress();
  updateChapters();
  if (ready) apply(sampleStory(story, p));
  invalidate();
}
async function start() {
  const data = loadStory();
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.localClippingEnabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    host.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.0006, 5);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.minDistance = 0.04;
    controls.maxDistance = 2;
    controls.addEventListener("change", invalidate);
    ambient = new THREE.HemisphereLight("#ffffff", "#9c9ca5", 0.65);
    scene.add(ambient);
    lights = {};
    for (const name of ["key", "rim", "focus"]) {
      const light = new THREE.SpotLight("#ffffff", 0, 0, 0.6, 0.65, 0);
      lights[name] = light;
      scene.add(light, light.target);
    }
    resize();
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      setReady(false);
    });
    renderer.domElement.addEventListener("webglcontextrestored", () => {
      if (section) setReady(true);
    });

    const loader = new GLTFLoader();
    const [gltf] = await Promise.all([loader.loadAsync(MODEL), data]);
    model = gltf.scene;
    model.rotation.x = -Math.PI / 2; // NX exports Z-up in metres.
    const size = new THREE.Box3()
      .setFromObject(model)
      .getSize(new THREE.Vector3());
    scale = 0.3 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.sub(
      new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()),
    );
    for (const name of Object.keys(assemblyTravel)) {
      const group = model.getObjectByName(name);
      if (!group) throw new Error("Missing Rev 3 assembly group " + name);
      group.userData.referenceAssembly =
        name === "PCB_Assembly" || name === "Battery_300mAh";
      actors.push({ group, origin: group.position.clone() });
    }
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.name = partNames[object.name] || object.name;
      applyAssemblyFinish(object);
      if (!object.geometry.hasAttribute("normal")) {
        object.geometry.computeVertexNormals();
        object.material.flatShading = false;
      }
      object.geometry.computeBoundingSphere();
      object.material.emissive.set(0);
      object.material.emissiveIntensity = 0;
      meshes.push(object);
      parts.set(object.name, object);
      triangles +=
        (object.geometry.index?.count ||
          object.geometry.attributes.position.count) / 3;
    });
    scene.add(model);
    section = new SectionCut(scene, meshes);
    // Warm the geometric section and its material before the first transition.
    const cutFrame = story.keyframes.find(
      (frame) => frame.cut.enabled && frame.cut.position[2] < 0.12,
    );
    if (cutFrame) {
      apply(cutFrame);
      await renderer.compileAsync(scene, camera);
    }
    apply(sampleStory(story, 0));
    await renderer.compileAsync(scene, camera);
    editor = createEditor({
      capture,
      aim,
      seek,
      progress: () => p,
      story: () => story,
      source: () => source,
      setDraft: (value) => {
        playback = null;
        draft = clone(value);
        setFree(false);
        apply(draft);
        invalidate();
      },
      setHelper: (value) => {
        helper = value;
        invalidate();
      },
      follow: () => {
        draft = null;
        setFree(false);
        invalidate();
      },
      replace: (value) => {
        draft = null;
        playback = null;
        configureStory(value);
      },
      saveFrame: (at, frame) =>
        configureStory(editFrame(source, story, at, frame)),
    });
    if (
      chapters[0]?.hold &&
      !reducedMotion() &&
      !new URLSearchParams(location.search).has("editor")
    ) {
      playback = { from: 0, to: chapters[0].hold, elapsed: 0, duration: 1.45 };
    }
    setReady(true);
  } catch (error) {
    console.error("ERSTE002 model", error);
    await data;
    setReady(false);
  }
}
body.dataset.mode = "chapter";
setLanguage("zh");
start();
