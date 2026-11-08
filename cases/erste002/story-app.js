import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  DEFAULT_STORY,
  clone,
  clamp,
  sampleStory,
  cueStrength,
  captionAt,
  validateStory,
} from "./story-timeline.js";
import { SectionCut } from "./story-section.js";
import { createEditor } from "./story-editor.js";
import { RenderFrameLimiter } from "../shared/render-frame.js";
const renderLimit = new RenderFrameLimiter();
const $ = (s) => document.querySelector(s),
  host = $("#scene-root"),
  scroller = $("#scroller"),
  loading = $("#loading");
let story = clone(DEFAULT_STORY),
  p = 0,
  draft = null,
  free = false,
  helper = false,
  ready = false,
  editor = { update() {} },
  section,
  model,
  scale = 1;
let lang = 0,
  visible = true,
  parentPaused = false,
  raf = 0,
  lastTime = 0,
  triangles = 0;
const meshes = [],
  parts = new Map(),
  origins = new Map(),
  target = new THREE.Vector3();
let renderer, scene, camera, controls, ambient, lights;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const status = document.createElement("span");
status.id = "statusText";
status.hidden = true;
status.textContent = "LOADING";
document.body.append(status);
$("#assembly").disabled = true;
function setLanguage(value, notify = false) {
  lang = value === "en" ? 1 : 0;
  document.documentElement.lang = lang ? "en" : "zh-CN";
  $("#lang").textContent = lang ? "中" : "EN";
  $("#part-label").textContent = lang ? "Part" : "部件";
  $("#assembly-label").textContent = lang ? "Assembly" : "装配";
  $("#explode").textContent = lang ? "Explode" : "展开";
  $("#reset").textContent = lang ? "Reset" : "复位";
  const labels = lang
    ? ["All parts", "Upper shell", "Button cover", "Scroll wheel", "Main board", "Battery"]
    : ["整体", "上盖", "按键盖", "滚轮", "主板", "电池"];
  [...$("#part").options].forEach(
    (option, i) => (option.textContent = labels[i]),
  );
  $("#mode").textContent = free
    ? lang
      ? "Return to scroll"
      : "返回滚动"
    : lang
      ? "Free view"
      : "自由查看";
  $("#hint").textContent = free
    ? lang
      ? "Drag to orbit · Scroll mode resumes the track"
      : "拖动旋转 · 返回滚动继续演出"
    : lang
      ? "SCROLL / CAMERA · LIGHT · SECTION"
      : "向下滚动 · 镜头 / 灯光 / 剖切";
  if (notify && parent !== window)
    parent.postMessage(
      { type: "design-terminal:case-language", language: value },
      location.origin,
    );
}
$("#lang").onclick = () => setLanguage(lang ? "zh" : "en", true);
addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.source !== parent) return;
  if (e.data?.type === "design-terminal:case-language")
    setLanguage(e.data.language);
  // The terminal keeps the case iframe cached; stop drawing while it is closed.
  if (e.data?.type === "design-terminal:pause") {
    parentPaused = true;
    pause();
  }
  if (e.data?.type === "design-terminal:resume") {
    parentPaused = false;
    startLoop();
  }
});
$(".identity").onclick = (e) => {
  if (parent !== window) {
    e.preventDefault();
    parent.postMessage(
      { type: "design-terminal:close-project" },
      location.origin,
    );
  }
};
function scrollProgress() {
  return clamp(
    scroller.scrollTop /
      Math.max(1, scroller.scrollHeight - scroller.clientHeight),
  );
}
scroller.addEventListener(
  "scroll",
  () => {
    draft = null;
    free = false;
    setLanguage(lang ? "en" : "zh");
    controls && (controls.enabled = false);
    $("#free-controls").hidden = true;
    document.body.dataset.mode = "scroll";
  },
  { passive: true },
);
function mode(value) {
  free = value;
  document.body.dataset.mode = free ? "free" : "scroll";
  $("#free-controls").hidden = !free;
  if (controls) {
    controls.enabled = free;
    controls.target.copy(target);
    controls.update();
  }
  setLanguage(lang ? "en" : "zh");
}
$("#mode").onclick = () => {
  if (!ready) return;
  if (!free) draft = capture();
  else draft = null;
  mode(!free);
};
function capture() {
  const v = clone(draft || sampleStory(story, p));
  if (camera) {
    v.camera.position = camera.position.toArray();
    v.camera.target = (free ? controls.target : target).toArray();
    v.camera.fov = camera.fov;
  }
  v.at = p;
  return v;
}
function aim(name) {
  if (!parts.has(name)) return;
  draft = capture();
  const center = new THREE.Box3()
    .setFromObject(parts.get(name))
    .getCenter(new THREE.Vector3());
  draft.lights.focus.target = center.toArray();
  draft.lights.focus.position = center
    .clone()
    .add(new THREE.Vector3(0.12, 0.16, 0.12))
    .toArray();
  draft.lights.focus.intensity = 5;
  draft.lights.key.intensity = 0.6;
  draft.lights.rim.intensity = 0.35;
  draft.ambient = 0.15;
  draft.focus = name;
}
$("#part").onchange = () => {
  const name = $("#part").value;
  if (name) aim(name);
  else {
    draft = capture();
    draft.lights = clone(DEFAULT_STORY.keyframes[0].lights);
    draft.ambient = 0.6;
    draft.focus = "";
  }
};
$("#assembly").oninput = () => {
  draft = capture();
  draft.explode = Number($("#assembly").value);
};
$("#explode").onclick = () => {
  draft = capture();
  draft.explode = 1;
};
$("#reset").onclick = () => {
  draft = clone(DEFAULT_STORY.keyframes[0]);
  controls.target.set(0, 0, 0);
  camera.position.fromArray(draft.camera.position);
  camera.fov = draft.camera.fov;
  controls.update();
  $("#assembly").value = 0;
  $("#part").value = "";
};
function resize() {
  if (!renderer) return;
  const w = host.clientWidth,
    h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
function startLoop() {
  if (ready && !raf && visible && !parentPaused && !document.hidden) {
    lastTime = performance.now();
    renderLimit.reset();
    raf = requestAnimationFrame(tick);
  }
}
function pause() {
  cancelAnimationFrame(raf);
  raf = 0;
}
document.addEventListener("visibilitychange", () =>
  document.hidden ? pause() : startLoop(),
);
addEventListener("pagehide", () => {
  pause();
  try {
    renderer?.dispose();
    scene?.traverse?.((o) => {
      if (o.isMesh) {
        o.geometry?.dispose?.();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose?.());
        else m?.dispose?.();
      }
    });
    controls?.dispose?.();
  } catch {}
});
new IntersectionObserver((entries) => {
  visible = entries[0].isIntersecting;
  if (visible) startLoop();
  else pause();
}).observe(host);
function apply(value) {
  const v = value;
  if (!free) {
    camera.position.fromArray(v.camera.position);
    target.fromArray(v.camera.target);
    camera.fov = v.camera.fov;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  } else {
    controls.update();
    target.copy(controls.target);
  }
  for (const [name, l] of Object.entries(lights)) {
    const def = v.lights[name];
    l.position.fromArray(def.position);
    l.target.position.fromArray(def.target);
    l.intensity = def.intensity;
    l.color.set(def.color);
    l.angle = THREE.MathUtils.degToRad(def.angle);
  }
  ambient.intensity = v.ambient;
  $("#assembly").value = String(v.explode);
  $("#part").value = v.focus;
  let energy = 0;
  for (const mesh of meshes) {
    mesh.position.copy(origins.get(mesh));
    const lift =
      {
        shell_top: 0.026, button_cover: 0.058, wheel: 0.010, pcb: -0.010, battery: -0.016,
      }[mesh.name] || 0;
    mesh.position.y += (lift / scale) * v.explode;
    const emissive = reduce
      ? 0
      : cueStrength(draft ? { keyframes: [draft] } : story, p, mesh.name);
    mesh.material.emissive.setRGB(
      emissive ? 1 : 0,
      emissive ? 1 : 0,
      emissive ? 1 : 0,
    );
    mesh.material.emissiveIntensity = emissive;
    energy = Math.max(energy, emissive);
  }
  model?.updateMatrixWorld(true);
  section?.update(v.cut, helper);
  const cap = captionAt(story, p);
  $("#caption").hidden = free;
  $("#caption").style.opacity = cap ? cap.opacity : 0;
  if (cap) {
    $("#cap-title").textContent = cap.title[lang];
    $("#cap-body").textContent = cap.body[lang];
  }
  $("#progress").textContent =
    String(Math.round(p * 100)).padStart(3, "0") + "%";
  document.body.dataset.progress = p.toFixed(4);
  document.body.dataset.mode = free ? "free" : "scroll";
  document.body.dataset.cut = String(v.cut.enabled);
  document.body.dataset.emissive = energy.toFixed(4);
  editor.update(p, {
    mode: draft ? "手动预览" : free ? "自由查看" : "滚动轨道",
    light: lights.focus.intensity,
    emissive: energy,
    cut: v.cut.enabled ? "ON" : "OFF",
    triangles,
  });
}
function tick(now) {
  raf = 0;
  if (document.hidden || !visible || parentPaused) return;
  raf = requestAnimationFrame(tick);
  const tier = document.documentElement.dataset.terminalQuality ?? "high";
  if (!renderLimit.admit(now, tier === "high")) return;
  const renderStart = performance.now();
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!draft && !free) {
    const desired = scrollProgress();
    p = reduce ? desired : p + (desired - p) * (1 - Math.exp(-dt * 12));
    if (Math.abs(p - desired) < 0.00001) p = desired;
  }
  apply(draft || sampleStory(story, p));
  renderer.render(scene, camera);
  renderLimit.recordFrame(performance.now() - renderStart);
  const limit = String(renderLimit.fpsLimit);
  if (host.dataset.fpsLimit !== limit) host.dataset.fpsLimit = limit;
}
async function start() {
  try {
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        stencil: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.localClippingEnabled = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      host.append(renderer.domElement);
      scene = new THREE.Scene();
      scene.background = new THREE.Color("#e8e5de");
      camera = new THREE.PerspectiveCamera(32, 1, 0.0003, 20);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enabled = false;
      controls.enableDamping = true;
      controls.minDistance = 0.003;
      controls.maxDistance = 3;
      controls.enablePan = true;
      ambient = new THREE.HemisphereLight("#fff9ed", "#3d4136", 0.6);
      scene.add(ambient);
      lights = {};
      for (const name of ["key", "rim", "focus"]) {
        const light = new THREE.SpotLight("#ffffff", 0, 0, 0.6, 0.65, 0);
        lights[name] = light;
        scene.add(light, light.target);
      }
      resize();
      renderer.domElement.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        ready = false;
        pause();
        loading.hidden = false;
        loading.textContent = "三维画面暂时中断，请重新载入。";
        const b = document.createElement("button");
        b.textContent = "重新载入";
        b.onclick = () => location.reload();
        loading.append(b);
      });
    }
    try {
      const response = await fetch("./story.json", { cache: "no-cache" });
      if (response.ok) story = validateStory(await response.json());
    } catch (e) {
      console.warn("演出数据使用内置默认值", e.message);
    }
    const draco = new DRACOLoader();
    draco.setDecoderPath("./vendor/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    let gltf;
    try {
      gltf = await loader.loadAsync(story.model);
    } finally {
      draco.dispose();
    }
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model),
      size = bounds.getSize(new THREE.Vector3());
    scale = 0.3 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    model.position.sub(
      new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()),
    );
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.emissive.set(0);
      o.material.emissiveIntensity = 0;
      o.material.side = THREE.DoubleSide;
      meshes.push(o);
      parts.set(o.name, o);
      origins.set(o, o.position.clone());
      triangles +=
        (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
    });
    scene.add(model);
    section = new SectionCut(scene, meshes);
    apply(sampleStory(story, 0));
    await renderer.compileAsync(scene, camera);
    editor = createEditor({
      capture,
      aim,
      progress: () => p,
      story: () => story,
      setDraft: (v) => {
        draft = clone(v);
        if (free) mode(false);
        apply(draft);
      },
      setHelper: (v) => {
        helper = v;
      },
      seek: (v) => {
        p = clamp(v);
        draft = null;
        mode(false);
        scroller.scrollTop =
          p * (scroller.scrollHeight - scroller.clientHeight);
        apply(sampleStory(story, p));
      },
      follow: () => {
        draft = null;
        mode(false);
      },
      replace: (v) => {
        story = validateStory(v);
        draft = null;
      },
    });
    ready = true;
    $("#assembly").disabled = false;
    status.textContent = "READY";
    document.body.dataset.ready = "true";
    loading.hidden = true;
    startLoop();
    if (parent !== window)
      parent.postMessage(
        { type: "design-terminal:case-ready" },
        location.origin,
      );
  } catch (e) {
    console.error("ERSTE002 viewer", e);
    status.textContent = "FAILED";
    status.classList.add("err");
    loading.replaceChildren();
    const text = document.createElement("p");
    text.textContent = "三维内容暂未载入，可重试。";
    const image = document.createElement("img");
    image.src = "/assets/render/002-cover.avif";
    image.alt = "ERSTE002 项目静态预览";
    image.style.cssText =
      "max-width:min(420px,70vw);max-height:50vh;object-fit:contain";
    const b = document.createElement("button");
    b.textContent = "重新载入";
    b.onclick = () => location.reload();
    loading.append(image, text, b);
  }
}
setLanguage("zh");
start();
