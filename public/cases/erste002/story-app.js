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
  blendPose,
} from "./story-timeline.js";
import { compileStory, editFrame } from "./story-segments.js";
import { loadStoryModel } from "./model-load.js";
import { applyAssemblyFinish } from "./assembly-finish.js";
import { StoryAssembly } from "./story-assembly.js";
import { LIGHT_NAMES, LIGHT_PRESETS } from "./story-lighting.js";
import { SectionCut } from "./story-section.js";
import { createStudioEnvironment } from "./studio-environment.js";
import { createSurfaceGeometry } from "./surface-normals.js";
import { createEditor } from "./story-editor.js";
import { RenderFrameLimiter } from "../shared/render-frame.js";

const $ = (s) => document.querySelector(s);
const host = $("#scene-root");
const body = document.body;
const loading = $("#loading");
const loadingCopy = $("#loading-copy");
const retry = $("#retry");
const modeButton = $("#mode");
const autoButton = $("#auto");
const previous = $("#prev-chapter");
const next = $("#next-chapter");
const restart = $("#restart-story");
const chapterNav = $("#chapter-nav");
const caption = $("#caption");
const capContent = $("#cap-content");
const capIndex = $("#cap-index");
const progress = $("#progress");
const chapterNumber = $("#chapter-number");
const chapterTitle = $("#chapter-title");
const partSelect = $("#part");
const assembly = $("#assembly");
const extractButton = $("#extract-part"),
  isolateButton = $("#isolate-part"),
  turnButton = $("#turn-part");
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
const heightGuide = $("#button-height-guide");
const heightDatum = heightGuide.querySelector(".datum");
const heightDifference = heightGuide.querySelector(".difference");
const heightScreen = [new THREE.Vector2(), new THREE.Vector2()];
const heightLandmarks = [
  {
    node: $("#left-button-height"),
    point: new THREE.Vector3(0.03434, 0.01199, 0.09105),
    text: ["食指 · 高", "INDEX · HIGH"],
  },
  {
    node: $("#right-button-height"),
    point: new THREE.Vector3(-0.03458, 0.00536, 0.09099),
    text: ["中指 · 低", "MIDDLE · LOW"],
  },
];
const palmLandmarks = [
  {
    node: $("#left-palm-height"),
    point: new THREE.Vector3(0.05, 0.03158268, -0.06),
    text: ["左侧支撑", "LEFT SUPPORT"],
  },
  {
    node: $("#right-palm-height"),
    point: new THREE.Vector3(-0.05, 0.02921289, -0.06),
    text: ["右侧下落", "RIGHT FALLAWAY"],
  },
];
const shellLandmarks = [
  {
    node: $("#high-shell-shoulder"),
    point: new THREE.Vector3(0.048, 0.042317, -0.015),
    text: ["高侧延续", "HIGH SIDE"],
  },
  {
    node: $("#low-shell-shoulder"),
    point: new THREE.Vector3(-0.048, 0.037686, -0.015),
    text: ["低侧收拢", "LOW SIDE"],
  },
];
const sectionLandmarks = [
  {
    node: $("#rib-section-marker"),
    point: new THREE.Vector3(0.015, 0.088, -0.041),
    text: ["肋腹与下缘", "WEB & LOWER FLANGE"],
  },
];
const markerSets = {
  "button-height": heightLandmarks,
  "shell-shoulders": shellLandmarks,
  "palm-support": palmLandmarks,
  "section-rib": sectionLandmarks,
};
let activeMarkers = [];
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
const renderLimit = new RenderFrameLimiter();
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const meshes = [],
  parts = new Map();
let assemblyRig,
  isolated = "",
  assemblyMove = null,
  freeRest;
const extractedParts = new Set();
const target = new THREE.Vector3();
const capTitle = $("#cap-title"),
  capBody = $("#cap-body"),
  capTag = $("#cap-tag");
const initialReadout = ["外观", "Form"];
const looks = {
  "01 / PRODUCT FORM": "hero",
  "02 / INDEX & MIDDLE": "diagram",
  "02 / ASYMMETRIC SURFACE": "surface",
  "02 / PALM & WRIST": "surface",
  "03 / ASSEMBLY RELATIONSHIP": "assembly",
  "03 / FULL EXPLODED VIEW": "assembly",
  "04 / LATERAL SOLID SECTION": "section",
  "04 / RIB CROSS-SECTION": "section",
  "04 / UPPER SHELL JUNCTION": "section",
  "04 / BUTTON COVER UNDERSIDE": "specimen",
  "04 / REASSEMBLED": "hero",
};
let story = DEFAULT_STORY,
  source = DEFAULT_STORY,
  chapters = [],
  shots = [],
  shotIndex = 0;
let p = 0,
  playback = null,
  draft = null,
  free = false,
  helper = false;
let renderer, scene, camera, controls, ambient, lights, section, model;
let studioEnvironment;
let originalFov = 32,
  lang = 0,
  lastCaption = null,
  triangles = 0;
let ready = false,
  visible = true,
  parentPaused = parent !== window,
  parentReduced = false;
let presented = parent === window;
let openingPlayed = false;
let auto = false;
let autoTimer = 0;
let shadowLight;
let shadowCut = "";
const shadowPlane = new THREE.Plane();
const lifetime = new AbortController();
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
function updateNavigation() {
  const selected = shots[shotIndex]?.chapter;
  const number = (value) => String(value).padStart(2, "0");
  chapterNumber.textContent =
    number(shotIndex + 1) + " / " + number(shots.length || 1);
  chapterTitle.textContent = selected?.title[lang] ?? initialReadout[lang];
  const busy =
    body.dataset.projectReady === "loading" || Boolean(playback && !free);
  const last = shots.length > 1 && shotIndex === shots.length - 1;
  previous.disabled = busy || shotIndex === 0;
  next.disabled = busy || shotIndex >= shots.length - 1;
  next.hidden = last && !busy;
  restart.hidden = !last || busy;
  autoButton.disabled = body.dataset.projectReady !== "ready" || free || shots.length < 2;
  autoButton.setAttribute("aria-pressed", String(auto));
  autoButton.textContent = auto ? (lang ? "Stop auto" : "停止自动") : (lang ? "Auto play" : "自动观看");
  for (const [index, button] of Array.from(chapterNav.children).entries()) {
    const chapter = chapters[index];
    const label = chapter.title[lang];
    button.setAttribute("aria-label", `${number(index + 1)} ${label}`);
    button.title = label;
    button.lastElementChild.textContent = label;
    if (chapter === selected) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
    button.disabled = body.dataset.projectReady === "loading";
  }
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
    lang ? "Story shots" : "演出镜头",
  );
  chapterNav.setAttribute("aria-label", lang ? "Chapters" : "章节导航");
  previous.lastElementChild.textContent = lang ? "Previous" : "上一镜";
  next.firstElementChild.textContent = lang ? "Next" : "下一镜";
  restart.lastElementChild.textContent = lang ? "Back to start" : "回到开头";
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
  for (const landmarks of Object.values(markerSets))
    for (const { node, text } of landmarks) node.textContent = text[lang];
  updatePartControls();
  lastCaption = null;
  updateNavigation();
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
  if (type === "design-terminal:case-presented") {
    presented = true;
    startPresentation();
  }
  if (type === "design-terminal:case-policy") {
    parentReduced = Boolean(reduced);
    resize();
    invalidate();
  }
});
motion.addEventListener("change", invalidate, { signal: lifetime.signal });
function configureStory(value) {
  const compiled = compileStory(value);
  source = value;
  story = compiled;
  chapters =
    compiled.ranges ??
    compiled.captions.map((item, i) => ({
      id: "legacy-" + (i + 1),
      title: item.title,
      start: item.start,
      end: item.end,
    }));
  shots = compiled.captions.map((item, index) => ({
    start: item.start,
    chapter: chapters.findLast((chapter) => item.start >= chapter.start - 1e-7),
    hold:
      index === compiled.captions.length - 1 && (item.leave ?? item.end) === 1
        ? 1
        : ((item.arrive ?? item.start) + (item.leave ?? item.end)) / 2,
  }));
  chapterNav.replaceChildren(
    ...chapters.map((chapter, index) => {
      const button = document.createElement("button");
      button.type = "button";
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      button.append(number, document.createElement("span"));
      button.onclick = () => {
        const first = shots.find((shot) => shot.chapter === chapter);
        if (first) {
          setAuto(false);
          seek(first.hold);
        }
      };
      return button;
    }),
  );
  shotAtProgress();
  lastCaption = null;
  updateNavigation();
  updateCaption();
  invalidate();
}
function shotAtProgress() {
  shotIndex = Math.max(
    0,
    shots.findLastIndex((item) => p >= item.start - 1e-7),
  );
}
function navigate(offset) {
  setAuto(false);
  const index = shotIndex + offset;
  if (
    body.dataset.projectReady === "loading" ||
    index < 0 ||
    index >= shots.length ||
    (playback && !free)
  )
    return;
  playToShot(index);
}
function setAuto(value) {
  if (value === auto) return;
  auto = value;
  clearTimeout(autoTimer);
  autoTimer = 0;
  updateNavigation();
  if (auto) invalidate();
}
function scheduleAuto() {
  if (!auto || autoTimer || playback || !ready || free || !canRender()) return;
  if (shotIndex >= shots.length - 1) {
    setAuto(false);
    return;
  }
  autoTimer = setTimeout(() => {
    autoTimer = 0;
    if (canRender()) playToShot(shotIndex + 1);
  }, 2600);
}
autoButton.onclick = () => setAuto(!auto);
function startPresentation() {
  if (!presented || openingPlayed || body.dataset.projectReady === "loading") return;
  openingPlayed = true;
  if (!new URLSearchParams(location.search).has("editor")) playToShot(0);
}
function playToShot(index) {
  const shot = shots[index];
  if (!shot) return;
  if (!ready || reducedMotion()) {
    seek(shot.hold);
    return;
  }
  setFree(false);
  draft = null;
  shotIndex = index;
  const to = shot.hold;
  const duration = clamp(Math.abs(to - p) * (story.duration ?? 16), 0.45, 5.4);
  playback = {
    from: p,
    to,
    duration,
    outgoing: captionAt(story, p)?.start,
    elapsed: 0,
  };
  updateNavigation();
  invalidate();
}
previous.onclick = () => navigate(-1);
next.onclick = () => navigate(1);
restart.onclick = () => {
  setAuto(false);
  seek(0);
  playToShot(0);
  chapterNav.firstElementChild?.focus();
};
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
  if (!free) {
    isolated = "";
    assemblyMove = null;
    extractedParts.clear();
  } else freeRest = clone(draft.assembly);
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
  setAuto(false);
  if (!free) {
    const current = capture();
    draft = current;
    draft.cut.enabled = false;
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
  draft.lights.fill.intensity = 0.8;
  draft.ambient = 0.4;
  draft.focus = name;
  invalidate();
}
function partTransformed(part) {
  return extractedParts.has(part);
}
function updatePartControls() {
  const part = partSelect.value;
  const extracted = partTransformed(part);
  extractButton.disabled = turnButton.disabled = isolateButton.disabled = !part;
  extractButton.textContent = extracted
    ? lang
      ? "Return part"
      : "归位部件"
    : lang
      ? "Extract"
      : "提取部件";
  turnButton.textContent = lang ? "Flip part" : "翻转部件";
  isolateButton.textContent = isolated
    ? lang
      ? "Show all"
      : "显示全部"
    : lang
      ? "Isolate"
      : "仅看此件";
  isolateButton.setAttribute("aria-pressed", String(Boolean(isolated)));
}
function moveAssembly(change) {
  draft = capture();
  const from = { explode: draft.explode, assembly: draft.assembly };
  const to = clone(from);
  change(to);
  assemblyMove = { from, to, elapsed: 0 };
  invalidate();
}
extractButton.onclick = () => {
  const part = partSelect.value;
  const extracted = partTransformed(part);
  const towardCamera = camera.position.clone().sub(controls.target).normalize();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  if (extracted) extractedParts.delete(part);
  else extractedParts.add(part);
  moveAssembly((value) => {
    value.assembly[part] = extracted
      ? clone(freeRest[part])
      : {
          ...value.assembly[part],
          offset: towardCamera
            .multiplyScalar(0.065)
            .addScaledVector(right, 0.06)
            .add(new THREE.Vector3().fromArray(freeRest[part].offset))
            .toArray(),
        };
  });
};
turnButton.onclick = () => {
  const part = partSelect.value;
  moveAssembly((value) => {
    const transform = value.assembly[part];
    const rest = freeRest[part].rotation[0];
    transform.rotation[0] =
      Math.abs(transform.rotation[0] - rest) > 1
        ? rest
        : rest + (rest > 180 ? -165 : 165);
  });
};
isolateButton.onclick = () => {
  isolated = isolated ? "" : partSelect.value;
  updatePartControls();
  invalidate();
};
partSelect.onchange = () => {
  if (isolated) isolated = partSelect.value;
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
  assemblyMove = null;
  draft = capture();
  draft.explode = Number(assembly.value);
  invalidate();
};
$("#explode").onclick = () => {
  const preset = clone(LIGHT_PRESETS.Assembly);
  moveAssembly((value) => {
    value.explode = 1;
  });
  draft.lights = preset.lights;
  draft.ambient = preset.ambient;
  draft.focus = "";
};
$("#reset").onclick = () => {
  const home = clone(story.keyframes[0]);
  freeRest = clone(home.assembly);
  extractedParts.clear();
  moveAssembly((value) => {
    value.explode = 0;
    value.assembly = home.assembly;
  });
  isolated = "";
  draft.lights = home.lights;
  draft.ambient = home.ambient;
  draft.electronics = 0;
  draft.focus = "";
  camera.position.fromArray(home.camera.position);
  controls.target.fromArray(home.camera.target);
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
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(host);
addEventListener("resize", resize);
function canRender() {
  return visible && !parentPaused && !document.hidden && !lifetime.signal.aborted;
}
function invalidate() {
  dirty = true;
  if (!raf && canRender()) raf = requestAnimationFrame(tick);
}
function pause() {
  cancelAnimationFrame(raf);
  clearTimeout(autoTimer);
  autoTimer = 0;
  raf = 0;
  lastTime = 0;
}
document.addEventListener("visibilitychange", () =>
  document.hidden ? pause() : invalidate(),
);
const visibilityObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  if (visible) invalidate();
  else pause();
});
visibilityObserver.observe(host);
addEventListener("pageshow", (event) => {
  if (event.persisted) invalidate();
});
addEventListener("pagehide", (event) => {
  pause();
  if (!event.persisted) dispose();
});
addEventListener("design-terminal:dispose", dispose, { once: true });
function dispose() {
  if (lifetime.signal.aborted) return;
  lifetime.abort();
  pause();
  resizeObserver.disconnect();
  visibilityObserver.disconnect();
  const geometries = new Set(section?.records.map(({ source }) => source));
  const materials = new Set();
  scene?.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) for (const material of [object.material].flat()) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  Object.values(lights ?? {}).forEach(light => light.shadow?.dispose());
  controls?.dispose();
  studioEnvironment?.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
}
function updateCaption() {
  const cap =
    body.dataset.projectReady !== "loading" ? captionAt(story, p) : null;
  const key = cap ? cap.start : null;
  if (
    cap &&
    (lastCaption !== key || capTitle.textContent !== cap.title[lang])
  ) {
    const frame = shots.findIndex((shot) => shot.start === key) + 1;
    capIndex.textContent = frame ? String(frame).padStart(2, "0") : "";
    capTag.textContent = cap.tag.replace(/^\d+ \/ /, "");
    capTitle.textContent = cap.title[lang];
    capBody.textContent = cap.body[lang];
    body.dataset.segment =
      chapters.findLast((item) => cap.start >= item.start - 1e-7)?.id ??
      "exterior";
    body.dataset.look = looks[cap.tag] ?? "";
    lastCaption = key;
  }
  if (cap) body.dataset.captionLayout = cap.layout ?? "left";
  const envelope =
    playback && key === playback.outgoing
      ? 1 - smooth(playback.elapsed / Math.min(0.28, playback.duration))
      : 1;
  const still = reducedMotion();
  const annotation = cap && p >= (cap.arrive ?? cap.start) ? cap.annotation : "";
  activeMarkers = ready && !free ? (markerSets[annotation] ?? []) : [];
  heightMarkers.hidden = activeMarkers.length === 0;
  heightGuide.toggleAttribute("hidden", activeMarkers !== heightLandmarks);
  for (const [name, landmarks] of Object.entries(markerSets))
    for (const { node } of landmarks) node.hidden = annotation !== name;
  if (!heightMarkers.hidden)
    heightMarkers.style.opacity = still ? 1 : cap.opacity * envelope;
  capContent.style.opacity = cap ? (still ? 1 : envelope) : 0;
  const reveal = still ? 1 : (cap?.revealProgress ?? 0);
  capContent.style.setProperty("--label-in", smooth(reveal / 0.42));
  capContent.style.setProperty("--title-in", smooth((reveal - 0.16) / 0.65));
  capContent.style.setProperty("--copy-in", smooth((reveal - 0.45) / 0.55));
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
    for (const [index, { node, point }] of activeMarkers.entries()) {
      projected.copy(point).project(camera);
      const x = 0.5 + projected.x * 0.5;
      const y = 0.5 - projected.y * 0.5;
      node.style.left = x * 100 + "%";
      node.style.top = y * 100 + "%";
      if (activeMarkers === heightLandmarks)
        heightScreen[index].set(x * renderWidth, y * renderHeight);
    }
    if (activeMarkers === heightLandmarks) {
      const [high, low] = heightScreen;
      const bracket = Math.min(renderWidth - 22, high.x + renderWidth * 0.13);
      const gap = 7;
      heightDatum.setAttribute(
        "d",
        `M ${low.x} ${low.y} H ${bracket - gap} M ${high.x} ${high.y} H ${bracket - gap}`,
      );
      heightDifference.setAttribute(
        "d",
        `M ${bracket} ${high.y} V ${low.y} M ${bracket - gap} ${high.y} h ${gap * 2} M ${bracket - gap} ${low.y} h ${gap * 2}`,
      );
    }
  }
  const shadowName = value.lights.focus.intensity > 0 ? "focus" : "key";
  let shadowMoved = shadowName !== shadowLight;
  for (const [name, light] of Object.entries(lights)) {
    const definition = value.lights[name];
    const angle = THREE.MathUtils.degToRad(definition.angle);
    // One shadow map follows the light responsible for the current reveal.
    light.castShadow = name === shadowName;
    if (light.castShadow && !shadowMoved) {
      shadowMoved = light.angle !== angle ||
        definition.position.some((n, i) => n !== light.position.getComponent(i)) ||
        definition.target.some((n, i) => n !== light.target.position.getComponent(i));
    }
    light.position.fromArray(definition.position);
    light.target.position.fromArray(definition.target);
    light.intensity = definition.intensity;
    light.color.set(definition.color);
    light.angle = angle;
  }
  ambient.intensity = value.ambient;
  scene.environmentIntensity = value.reflection.intensity;
  scene.environmentRotation.y = THREE.MathUtils.degToRad(value.reflection.yaw);
  assembly.value = value.explode;
  partSelect.value = value.focus;
  const partsMoved = assemblyRig.apply(value, free ? isolated : value.isolate);
  host.dataset.isolated = free ? isolated : value.isolate;
  host.dataset.explode = value.explode.toFixed(3);
  if (free) updatePartControls();
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
  if (value.cut.enabled && partsMoved) model.updateMatrixWorld(true);
  const cutFaces = section.update(value.cut, helper);
  const cutState = value.cut.enabled ? `${value.cut.target}:${value.cut.cap}` : "";
  if (shadowMoved || partsMoved || cutState !== shadowCut || (cutState && !shadowPlane.equals(section.plane)))
    lights[shadowName].shadow.needsUpdate = true;
  shadowLight = shadowName;
  shadowCut = cutState;
  if (cutState) shadowPlane.copy(section.plane);
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
    const fraction = clamp(playback.elapsed / playback.duration);
    p = playback.from + (playback.to - playback.from) * fraction;
    if (!ready || reducedMotion() || fraction === 1) {
      p = playback.to;
      playback = null;
      updateNavigation();
    }
  }
  if (free && assemblyMove) {
    assemblyMove.elapsed += dt;
    const fraction = reducedMotion() ? 1 : clamp(assemblyMove.elapsed / 0.75);
    Object.assign(
      draft,
      blendPose(assemblyMove.from, assemblyMove.to, smooth(fraction)),
    );
    if (fraction === 1) assemblyMove = null;
  }
  updateCaption();
  if (ready) {
    apply(draft || sampleStory(story, p));
    renderer.render(scene, camera);
    renderLimit.recordFrame(performance.now() - renderStart);
    host.dataset.fpsLimit = renderLimit.fpsLimit;
  }
  if ((playback && !free) || (free && assemblyMove)) invalidate();
  else scheduleAuto();
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
    image.src = "./assets/erste002-hero-front-right-v01.webp";
    image.alt = "ERSTE002";
    loading.prepend(image);
  }
  setLanguage(lang ? "en" : "zh");
}
async function loadStory() {
  try {
    const response = await fetch("./story.json", { signal: lifetime.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    configureStory(await response.json());
  } catch (error) {
    if (lifetime.signal.aborted) return;
    console.warn("ERSTE002 story fallback", error.message);
    configureStory(DEFAULT_STORY);
  }
}
function seek(progress) {
  playback = null;
  draft = null;
  setFree(false);
  p = clamp(progress);
  shotAtProgress();
  updateNavigation();
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
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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
    for (const name of LIGHT_NAMES) {
      const light = new THREE.SpotLight("#ffffff", 0, 0, 0.6, 0.65, 0);
      if (name === "key" || name === "focus") {
        light.shadow.autoUpdate = false;
        light.castShadow = name === "key";
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.01;
        light.shadow.camera.far = 1.2;
        light.shadow.bias = -0.0003;
        light.shadow.normalBias = 0.0006;
        light.shadow.radius = name === "focus" ? 3.4 : 4.5;
        light.shadow.intensity = 0.74;
      }
      lights[name] = light;
      scene.add(light, light.target);
    }
    resize();
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      if (lifetime.signal.aborted) return;
      setReady(false);
    });
    renderer.domElement.addEventListener("webglcontextrestored", () => {
      if (section && !lifetime.signal.aborted) {
        shadowLight = undefined;
        studioEnvironment?.dispose();
        studioEnvironment = createStudioEnvironment(renderer);
        scene.environment = studioEnvironment.texture;
        setReady(true);
      }
    });

    const loader = new GLTFLoader();
    const [gltf] = await Promise.all([loadStoryModel(loader, lifetime.signal), data]);
    if (lifetime.signal.aborted) return;
    studioEnvironment = createStudioEnvironment(renderer);
    scene.environment = studioEnvironment.texture;
    model = gltf.scene;
    model.rotation.x = -Math.PI / 2; // NX exports Z-up in metres.
    const size = new THREE.Box3()
      .setFromObject(model)
      .getSize(new THREE.Vector3());
    const scale = 0.3 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.sub(
      new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()),
    );
    assemblyRig = new StoryAssembly(model);
    for (const [part, { group }] of assemblyRig.actors) parts.set(part, group);
    const sectionSources = new Map();
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.name = partNames[object.name] || object.name;
      applyAssemblyFinish(object, true);
      object.castShadow = true;
      object.receiveShadow = true;
      object.material.clipShadows = true;
      if (!object.geometry.hasAttribute("normal")) {
        if (
          object.geometry.index &&
          ["shell_top", "button_cover"].includes(object.name)
        ) {
          sectionSources.set(object, object.geometry);
          object.geometry = createSurfaceGeometry(object.geometry);
        } else object.geometry.computeVertexNormals();
        object.material.flatShading = false;
      }
      object.geometry.computeBoundingSphere();
      object.material.emissive.set(0);
      object.material.emissiveIntensity = 0;
      meshes.push(object);
      triangles +=
        (object.geometry.index?.count ||
          object.geometry.attributes.position.count) / 3;
    });
    scene.add(model);
    section = new SectionCut(scene, meshes, sectionSources);
    // Warm the geometric section and its material before the first transition.
    const cutFrame = story.keyframes.find(
      (frame) =>
        frame.cut.enabled &&
        frame.cut.target === "shell_top" &&
        Math.abs(frame.cut.position[0]) < 0.065,
    );
    if (cutFrame) {
      apply(cutFrame);
      await renderer.compileAsync(scene, camera);
      if (lifetime.signal.aborted) return;
    }
    apply(sampleStory(story, 0));
    await renderer.compileAsync(scene, camera);
    if (lifetime.signal.aborted) return;
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
        updateNavigation();
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
      saveFrame: (at, frame, lightingOnly) =>
        configureStory(editFrame(source, story, at, frame, lightingOnly)),
    });
    setReady(true);
    startPresentation();
  } catch (error) {
    if (lifetime.signal.aborted) return;
    console.error("ERSTE002 model", error);
    await data;
    if (lifetime.signal.aborted) return;
    setReady(false);
    startPresentation();
  }
}
body.dataset.mode = "chapter";
setLanguage("zh");
start();
