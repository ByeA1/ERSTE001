import {createProjectDirectory} from './project-directory';
import { createRollingClock } from "./rolling-clock";
import { openProject, caseIsOpen, caseIsApproaching } from "./project-viewer";
import {collectionAtLane, collectionNumberAtLane} from './project-collections';
import {t, localize} from './terminal-language';
import {projectSummary,projectFindings} from './project-copy';
import {archiveCalloutCue} from './opening-cues';
import {PROJECT_COVER_OPENING_START} from './project-cover-motion';
import { projects, getProject } from "./projects";
import { showProjectShowcase, showcaseVisible, returnToProjectOverview } from "./project-showcase";
import { InspectionOverlay } from "./inspection-overlay";
import { DocumentDecryption } from "./document-decryption";
import "./document-decryption.css";
import "./decryption.css";
import { escapeHtml } from "./html";
import {
  normalizeQuality,
  qualityPresets,
  type QualityPreset,
  type RenderQuality,
} from "./render-quality";
import { qualityMarkup, syncQualityUI } from "./quality-settings";
import { superPerformanceQuality, wallpaperQuality } from "./wallpaper-quality";
import "@kitlangton/rolling-number/styles.css";
import "./style.css";
import "./opening-status.css";
import "./quality-settings.css";
import "./responsive.css";
import { viewportLayout, openingLayout } from "./viewport-layout";
import { assetUrl } from "./asset-url";
import { initPwa, pwaSettingsMarkup } from "./pwa";
import {
  createRollingNumber,
  createRollingText,
} from "@kitlangton/rolling-number";
import { ArchiveScene } from "./scene";
import { ModelViewer } from "./model-viewer";
import { ContentTransition, SurfaceTransition } from "./ui-transitions";
import { BootSequence } from "./boot";
import { OpeningStatus } from "./opening-status";
import { loadBootWebfonts } from "./boot-lettering";
import { wrap, type ArchiveNavigation } from "./archive-loop";
import {
  records,
  categories,
  archiveColumns,
  columnFiles,
  fileLocation,
} from "./data";
import { TerminalAudio } from "./audio";
import { audioSettingsMarkup } from "./audio-settings";
import {
  createMotionPreferences,
  fullMotion,
  motionEnabled,
  motionPresetFor,
  motionSettingsMarkup,
  motionSummary,
  reducedMotion,
  type MotionKey,
  type MotionPreset,
  type StoredMotion,
} from "./motion-preferences";
import { OpeningTimeline, openingAt, type OpeningPhase } from "./opening-timeline";
import {OPENING_HANDOFF_DURATION} from './opening-handoff';
import type { OpeningGroup } from "./opening-status";
import {
  isWallpaper,
  wallpaperHost,
  wallpaperFrame,
  type WallpaperProperties,
} from "./wallpaper";
import "./startup.css";
import "./personal.css";
import "./wallpaper.css";
import { Workbench } from "./workbench";
let workbench: Workbench | undefined;
import { ArchivePlayground } from "./archive-playground";
import { ARRAY_OPENING_END, openingShowsDetail } from "./wallpaper-opening";
import { paintTheme, themeSettingsMarkup } from "./theme-ui";
let playground: ArchivePlayground | undefined;
import { WallpaperEffects } from "./wallpaper-effects";
import { WallpaperBackground } from "./wallpaper-background";
import { enableGamepad, isGamepadEvent, onInputDevice } from "./gamepad";
let wallpaperEffects: WallpaperEffects | undefined;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
import { logo, labelMarkSvg, brandHeading } from "./brand";

$("#stage").innerHTML = `
  <div id="three-scene" class="three-scene"></div>
  <div class="scene-atmosphere archive-atmosphere"></div>
  <div id="boot-background" class="boot-background"><svg viewBox="0 0 1920 1080" preserveAspectRatio="none"><g fill="none" stroke="#fff" stroke-width="3"><path d="M-210 705C-45 705 182 704 247 567C337 377 99 306 4 435S27 680 169 631C309 584 227 314 279 111S568-113 568-113"/><path d="M1560-80C1374 114 1671 168 1601 323S1371 367 1431 480S1692 666 1559 787S1329 886 1498 1130"/><circle cx="1450" cy="648" r="346"/><circle cx="1450" cy="648" r="348"/></g></svg></div>
  <header class="brand">${brandHeading}</header>
  <nav class="system-nav" aria-label="系统导航">${!isWallpaper ? `<div class="project-directory"><span class="directory-label" data-zh="项目目录" data-en="PROJECT INDEX">项目目录</span><div class="directory-window"><div class="directory-track">${projects.filter(p=>p.shortcut && p.page).map((p,i)=>`<button type="button" class="project-shortcut directory-project" data-showcase-project="${escapeHtml(p.id)}" aria-label="${escapeHtml(p.title)}"><small>0${i+1}</small><span>${escapeHtml(p.title)}</span><i aria-hidden="true">↗</i></button>`).join('')}</div></div></div>` : projects.filter(project => project.shortcut).map(project => project.page ? `<button class="project-shortcut" data-showcase-project="${escapeHtml(project.id)}">${escapeHtml(project.title)}</button>` : project.externalUrl ? `<a class="project-shortcut" href="${escapeHtml(project.externalUrl)}">${escapeHtml(project.title)} ↗</a>` : '').join('')}
    <button data-action="search"><span class="nav-glyph">⌕</span> ARCHIVE INDEX <span class="key">/</span></button>
    <button data-action="saved" aria-label="查看收藏档案" title="收藏档案">＋ SAVED <span id="saved-count">00</span></button>
    <button class="settings-button" data-action="settings" aria-label="系统设置" title="系统设置"><span class="settings-glyph" aria-hidden="true">◷</span><span class="settings-label">设置</span></button>
  </nav>
  <button id="skip" class="${isWallpaper?'skip':'opening-skip'}" data-action="skip" ${!isWallpaper?'hidden':''}><span data-zh="跳过开场" data-en="SKIP OPENING">跳过开场</span> ↗</button>
  <section id="boot" class="boot" aria-label="系统启动">
    <div class="access-text">ACCESS</div>
    <div class="boot-logo">${logo}</div>
    <div class="auth-status"><span>▪</span> <span id="auth-message"></span><i></i></div>
    <div class="scan"><svg viewBox="0 0 1920 1080" aria-hidden="true"><g fill="none" stroke="#080a08" stroke-width="2" stroke-linecap="round"><path/><path stroke="#fff"/><path/><path/><path/><path/><circle class="orbit-dot" r="8" fill="#ed821b" stroke="none"/><circle class="orbit-dot" r="8" fill="#ed821b" stroke="none"/><circle class="scan-core" cx="960" cy="540" r="5" fill="#080a08" stroke="none"/></g></svg><span>PERMISSION AUTHORIZED</span></div>
    <div class="welcome"><div class="welcome-panel"></div><div class="welcome-heading">WELCOME TO</div><div class="welcome-company"><strong>albert_z0413@hotmail.com</strong><strong class="welcome-highlight" aria-hidden="true">albert_z0413@hotmail.com</strong></div><div class="welcome-database">DESIGN ARCHIVE</div><div class="welcome-logo">${isWallpaper?logo:labelMarkSvg}${!isWallpaper?'<p class="welcome-attribution" data-zh="终端界面设计源自&#10;《明日方舟》莱茵生命" data-en="TERMINAL DESIGN FROM&#10;ARKNIGHTS · RHINE LAB">终端界面设计源自<br>《明日方舟》莱茵生命</p>':''}</div></div>
  </section>
  <svg id="inspection-marks" viewBox="0 0 1920 1080" aria-hidden="true"><path id="inspection-lines"/><g id="inspection-corners"></g><circle id="inspection-point" r="1.8"/></svg>
  <div id="inspection-text" aria-hidden="true">CONFIDENTIALITY:<strong>GENERAL BUSINESS USE</strong></div>
  <section id="archive-ui" class="archive-ui" aria-label="档案选择" data-portfolio="${!isWallpaper}">
    <div class="archive-callout"><div class="eyebrow"><span class="collection-kicker">PROJECT COLLECTION</span> <span>／</span> <span id="archive-category">GAMING MOUSE</span></div><div class="project-title-row"><button type="button" class="project-step" data-action="prev" aria-label="上一个项目">←</button><button class="file-title" data-action="open"><span class="legacy-file-prefix">FILE NUMBER: </span><span id="selected-id">X-<span id="selected-code">001</span></span><span class="catalogue-project-title">ERSTE001</span><span class="file-open">↗</span></button><button type="button" class="project-step" data-action="next" aria-label="下一个项目">→</button></div><div class="callout-rule"><i></i></div><div class="file-summary"><span id="selected-title">FPS GAMING MOUSE</span><span id="selected-clearance">PROTOTYPED / 2026</span></div><button class="read-file" data-action="open"><span class="read-file-label">查看项目展示</span><span>→</span></button></div>
    <div id="hover-label" class="hover-label" hidden>X-<span id="hover-code">001</span> / <span id="hover-title"></span></div>
    <div class="archive-counter"><span class="tiny-label">PROJECT / SELECT</span><div><span id="selected-number">01</span><i>/</i><span class="count-total">02</span></div></div>
    ${isWallpaper?`<div class="archive-navigation"><button data-action="prev" aria-label="上一个档案">↑</button><div id="file-ticks" class="file-ticks"></div><button data-action="next" aria-label="下一个档案">↓</button></div>`:""}
    ${!isWallpaper ? `<div class="mobile-terminal-tools"><button type="button" class="terminal-settings-open" data-action="settings" aria-haspopup="dialog"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="M2 5h16M2 15h16"/><path d="M7 2v6M13 12v6" stroke-width="3"/></svg><span data-zh="终端设置" data-en="TERMINAL SETTINGS">终端设置</span></button></div>` : ''}
    <div class="column-navigation"><button data-action="column-prev" aria-label="上一个项目集">←</button><div><span id="column-number"><span class="collection-number-label">COLLECTION</span> <span id="column-index">01</span> / 05</span><strong id="column-name">GAMING MOUSE</strong></div><button data-action="column-next" aria-label="下一个项目集">→</button></div>
    ${!isWallpaper?'<p class="mobile-personal-use"><span>PERSONAL USE ONLY</span><small data-zh="非商业个人作品档案" data-en="NON-COMMERCIAL ARCHIVE">非商业个人作品档案</small></p>':''}
    ${isWallpaper?`<div class="archive-hint"><kbd>←</kbd> <kbd>→</kbd> 切换列 <span>／</span> <kbd>↑</kbd> <kbd>↓</kbd> 前后档案 <span>／</span> <kbd>ENTER</kbd> 读取</div>`:""}
  </section>
  <section id="detail-ui" class="detail-ui" aria-label="档案内容" hidden>
    <button class="back-button" data-action="back">← <span>ARCHIVE OVERVIEW</span><small>ESC</small></button>
    <div class="object-caption"><span id="object-id">NO.001</span><div>DESIGN ARCHIVE</div><button class="viewer-open" data-action="model-viewer">360° 查看档案装置 <span>↗</span></button></div>
    <article id="detail-content" class="detail-content"></article>
  </section>
  <div class="powered">PRODUCT DESIGN <b>albert_z0413@hotmail.com</b><i></i></div>
  <footer class="system-footer"><span><i class="status-light"></i> SESSION AUTHORIZED${isWallpaper ? '<button type="button" class="three-toggle" data-action="toggle-three" aria-pressed="true" title="卸载三维模型，保留 2D 界面">3D 开启</button>' : ""}</span><span>albert_z0413@hotmail.com <i>／</i> <span id="clock">00:00:00</span></span><button data-action="replay" title="重播启动流程">REINITIALIZE ↗</button></footer>
  <div id="pwa-update-notice" class="pwa-update-notice" role="status" hidden><span>新版本已就绪</span><button data-pwa-action="update">更新并重启 ↻</button></div>
  <div id="modal-root"></div><div id="toast" class="toast" role="status"></div>
  <div id="loading" class="loading"><div class="loading-mark">${logo}</div><span>CONNECTING TO DESIGN ARCHIVE</span><i></i></div>
`;

// Language and project navigation share the scaled terminal coordinate system.
$("#stage").append($(".terminal-language-site"));
// Opening artwork scales independently on phones; keep this control at touch size.
if(!isWallpaper)$("#viewport").append($("#skip"));

$("#boot-background").insertAdjacentHTML(
  "beforeend",
  '<div class="boot-white"></div>',
);
const bootSequence = new BootSequence($("#stage"));
const openingStatus = new OpeningStatus($("#loading"));
const openingTimeline = new OpeningTimeline();
const cachedOpeningGroups = new Map<OpeningGroup, "loaded" | "failed">();
let lightweight = false;
let archiveSettled = false;
let overlayTimer: ReturnType<typeof setTimeout> | undefined;
let pwaStarted = false;
let openingTrace: {phase: OpeningPhase; time: number; label: string}[] = [];
const lightPreview = document.createElement("aside");
lightPreview.className = "opening-light-preview"; lightPreview.hidden = true;
lightPreview.innerHTML = '<img alt="项目展示"><strong></strong><small>LIGHTWEIGHT MODE</small>';
document.body.append(lightPreview);
$("#viewport").insertAdjacentHTML(
  "beforeend",
  '<button class="mobile-entry" data-action="skip">进入档案 <span>→</span></button>',
);

type Mode = "boot" | "archive" | "detail";
let mode: Mode = "boot",
  selected = 0,
  bootStart = 0,
  lastStep = "",
  ready = false;
let modal: "search" | "saved" | "settings" | null = null,
  searchQuery = "",
  filter = "全部档案";
let activeTab = "overview";
const reviewParams = new URLSearchParams(location.search);
let frozenTime =
  reviewParams.get("freeze") === "1"
    ? Number(reviewParams.get("time") ?? 0)
    : null;
if (reviewParams.get("review") === "1") {
  $("#stage").dataset.review = "true";
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "rhine-review-frame"
    )
      return;
    const t = Number(event.data.time);
    if (!Number.isFinite(t) || t < 0 || t >= 35) return;
    frozenTime = t;
    if (ready && mode !== "boot") setMode("boot");
  });
}
let toastTimer: ReturnType<typeof setTimeout>;
let previousFocus: HTMLElement | null = null;
const detailTransition = new SurfaceTransition(
  $("#detail-ui"),
  undefined,
  180,
  180,
);
const tabTransition = new ContentTransition();
let modalTransition: SurfaceTransition | undefined;
let modalClosing = false;
let modalSiblings: { node: HTMLElement; inert: boolean }[] = [];
let pendingDetailFocus = false;
let openingBrandAnimation: Animation | undefined;
let bookmarkFeedback: Animation | undefined;
function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const saved = new Set<string>(readLocal<string[]>("tony-design-saved", []));
const storedPrefs = readLocal<
  Partial<{
    sound: boolean;
    music: boolean;
    soundVolume: number;
    musicVolume: number;
    reduced: boolean;
    quality: boolean;
    rendering: RenderQuality;
    superPerformance: boolean;
    colorTheme: "light" | "dark";
    motion: StoredMotion;
    motionPreset: MotionPreset;
  }>
>("tony-design-settings", {});
const initialMotion = createMotionPreferences(storedPrefs.motion, false);
const initialMotionPreset = motionPresetFor(initialMotion);
const prefs = {
  sound: isWallpaper ? storedPrefs.sound ?? false : false,
  music: isWallpaper ? storedPrefs.music ?? storedPrefs.sound ?? false : false,
  soundVolume: isWallpaper ? storedPrefs.soundVolume ?? 0.55 : 0,
  musicVolume: isWallpaper ? storedPrefs.musicVolume ?? 0.5 : 0,
  motion: initialMotion,
  motionPreset: initialMotionPreset,
  quality: storedPrefs.quality ?? true,
  superPerformance: storedPrefs.superPerformance ?? false,
  rendering: normalizeQuality(
    storedPrefs.rendering,
    storedPrefs.quality !== false,
  ),
  colorTheme: isWallpaper && storedPrefs.colorTheme === "dark" ? "dark" : "light",
};
const motionActive = (key: MotionKey) => motionEnabled(prefs.motion, key);
const motionIsReduced = () =>
  Object.values(prefs.motion).every((value) => !value);
paintTheme(prefs.colorTheme === "dark" ? 1 : 0);
const rollingMotion = {
  duration: 460,
  motionBlur: true,
  animated: motionActive("rollingNumbers"),
};
const updateFooterClock = createRollingClock($("#clock"));
const numberOptions = {
  ...rollingMotion,
  locales: "en-US",
  format: { minimumIntegerDigits: 2, useGrouping: false },
};
const fileCounter = createRollingNumber($("#selected-number"), {
  ...numberOptions,
  value: 1,
});
const columnCounter = createRollingNumber($("#column-index"), {
  ...numberOptions,
  value: 3,
});
const codeOptions = {
  ...numberOptions,
  format: { minimumIntegerDigits: 3, useGrouping: false },
  value: 1,
};
const textOptions = {
  ...rollingMotion,
  animated: motionActive("rollingText"),
  transition: "direct" as const,
  stagger: "none" as const,
};
const selectionTitle = createRollingText($("#selected-title"), {
  ...textOptions,
  text: $("#selected-title").textContent ?? "",
});
const columnTitle = createRollingText($("#column-name"), {
  ...textOptions,
  text: $("#column-name").textContent ?? "",
});
const hoverTitle = createRollingText($("#hover-title"), {
  ...textOptions,
  text: "",
});
const categoryTitle = createRollingText($("#archive-category"), {
  ...textOptions,
  text: $("#archive-category").textContent ?? "",
});
const clearanceTitle = createRollingText($("#selected-clearance"), {
  ...textOptions,
  text: $("#selected-clearance").textContent ?? "",
});
const rollingTitles = [
  selectionTitle,
  columnTitle,
  hoverTitle,
  categoryTitle,
  clearanceTitle,
];
const selectedCode = createRollingNumber($("#selected-code"), codeOptions);
const hoverCode = createRollingNumber($("#hover-code"), codeOptions);
const audio = new TerminalAudio(isWallpaper);
let musicSuppressed = false;
function configureAudio() {
  audio.configure({ ...prefs, music: prefs.music && !musicSuppressed });
}
if (isWallpaper) configureAudio();
else saveAudioPrefs();
const reviewEntry =
  reviewParams.has("scene") ||
  reviewParams.has("time") ||
  reviewParams.get("review") === "1";
let started = false;
const loading = $("#loading");
// The entry screen uses the actual viewport, including portrait phones; the
// reference animation still uses its calibrated 1920 x 1080 stage.
$("#viewport").append(loading);
$("#stage").inert = true;
$(".mobile-entry").inert = true;
// Audio follows an ordinary gesture; it never gates the visual opening.
loading.classList.toggle("opening-overlay", !isWallpaper);
$("#viewport").classList.toggle("opening-flow", !isWallpaper);
$("#stage").classList.toggle("opening-flow", !isWallpaper);
let audioPreview = false,
  audioPreviewRequest = 0;
let scene: ArchiveScene | undefined;
let threeState: "on" | "closing" | "off" | "loading" = "on";
let resumeCell: { lane: number; row: number } | undefined;
let resumeSelection = -1;
let viewer: ModelViewer | undefined;
const accessLog: { id: string; time: string }[] = [];
const columnMemory = archiveColumns.map((_, lane) => columnFiles(lane)[0]);
function recordAccess() {
  accessLog.unshift({
    id: records[selected].id,
    time: new Date().toLocaleTimeString("en-GB"),
  });
}
function saveAudioPrefs() {
  if (!isWallpaper) {
    prefs.colorTheme = "light";
    prefs.sound = prefs.music = false;
    prefs.soundVolume = prefs.musicVolume = 0;
  }
  try {
    localStorage.setItem("tony-design-settings", JSON.stringify(prefs));
  } catch {}
  configureAudio();
}
function superPerformanceEnabled() {
  return isWallpaper
    ? wallpaperHost()?.properties.superperformance?.value === true
    : prefs.superPerformance;
}
function effectiveRenderQuality() {
  return superPerformanceEnabled() ? superPerformanceQuality : prefs.rendering;
}
function savePrefs() {
  saveAudioPrefs();
  if (!motionActive("rollingText"))
    rollingTitles.forEach((title) => title.finish());
  if (!motionActive("rollingNumbers"))
    [fileCounter, columnCounter, selectedCode, hoverCode].forEach((counter) =>
      counter.finish(),
    );
  if (!motionActive("surfaceTransitions")) {
    detailTransition.finish();
    modalTransition?.finish();
    tabTransition.finish();
    bookmarkFeedback?.cancel();
  }
  scene?.setMotion(prefs.motion);
  scene?.setTheme(
    prefs.colorTheme === "dark",
    !motionActive("surfaceTransitions") || !started,
  );
  document
    .querySelectorAll<HTMLElement>("[data-color-theme]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.colorTheme === prefs.colorTheme),
      ),
    );
  scene?.setSuperPerformance(superPerformanceEnabled());
  viewer?.setSuperPerformance(superPerformanceEnabled());
  scene?.setQuality(effectiveRenderQuality());
  viewer?.setQuality(effectiveRenderQuality());
  viewer?.setMotion(prefs.motion);
  syncQualityUI(prefs.rendering);
  updateQualitySummary();
  fileCounter.update({
    animated: motionActive("rollingNumbers") && mode === "archive",
  });
  rollingTitles.forEach((title) =>
    title.update({
      animated: motionActive("rollingText") && mode === "archive",
    }),
  );
  columnCounter.update({
    animated: motionActive("rollingNumbers") && mode === "archive",
  });
  selectedCode.update({
    animated: motionActive("rollingNumbers") && mode === "archive",
  });
  hoverCode.update({
    animated: motionActive("rollingNumbers") && mode === "archive",
  });
  $("#stage").classList.toggle("reduce-motion", motionIsReduced());
  $("#stage").classList.toggle(
    "reduce-surfaces",
    !motionActive("surfaceTransitions"),
  );
  workbench?.setMotion(prefs.motion);
  updateFooterClock(new Date(), motionActive("rollingNumbers"));
  syncWallpaperBackground();
}
let previousLayout = "";
function fit() {
  const stage = $("#stage");
  const viewport = $("#viewport");
  const coarse = matchMedia("(pointer: coarse)").matches;
  const reference =
    reviewParams.has("time") || reviewParams.get("review") === "1";
  const { width, height, scale, kind } =
    mode === "boot" && !reference
      ? openingLayout(viewport.clientWidth, viewport.clientHeight)
      : viewportLayout(
          viewport.clientWidth,
          viewport.clientHeight,
          coarse,
          mode === "boot",
        );
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  stage.dataset.layout = kind;
  stage.dataset.touch = String(coarse);
  viewport.dataset.mobileBoot = String(
    mode === "boot" && (coarse || viewport.clientWidth < 1100),
  );
  stage.style.setProperty("--stage-scale", String(scale));
  stage.style.setProperty("--opening-width", `${width}px`);
  stage.style.setProperty("--opening-height", `${height}px`);
  stage.style.setProperty(
    "--opening-scan-scale",
    String(Math.min(1, width / 1920)),
  );
  stage.dataset.openingPortrait = String(width < height);
  // The software keyboard resizes dialogs without recomposing the 3D scene.
  const visible = window.visualViewport;
  const stageTop = (viewport.clientHeight - height * scale) / 2;
  stage.style.setProperty(
    "--modal-top",
    `${Math.max(0, (visible?.offsetTop ?? 0) - stageTop) / scale}px`,
  );
  stage.style.setProperty(
    "--modal-height",
    `${Math.min(height, (visible?.height ?? viewport.clientHeight) / scale)}px`,
  );
  $("#viewport").style.setProperty("--scale", String(scale));
  const marks = document.querySelector("#inspection-marks");
  marks?.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const layoutKey = JSON.stringify([
    width,
    height,
    scale,
    kind,
    devicePixelRatio,
  ]);
  if (layoutKey !== previousLayout) {
    previousLayout = layoutKey;
    scene?.resize();
    viewer?.resize();
  }
  updateQualitySummary();
  // Re-measure line covers and tab underline after wrapping changes.
  requestAnimationFrame(() => {
    documentDecryption.refresh();
    const tab = document.querySelector<HTMLElement>(
      ".detail-tabs button.active",
    );
    const indicator = document.querySelector<HTMLElement>(".tab-indicator");
    if (tab && indicator)
      indicator.style.transform = `translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth})`;
  });
}
document.addEventListener("visibilitychange", () => openingTimeline.sync(performance.now()/1000));
window.addEventListener("resize", fit);
window.visualViewport?.addEventListener("resize", fit);
window.visualViewport?.addEventListener("scroll", fit);
matchMedia("(pointer: coarse)").addEventListener("change", fit);
fit();
if(isWallpaper)$("#file-ticks").innerHTML = columnFiles(fileLocation(selected).lane)
  .map((index) => `<button data-select="${index}"></button>`)
  .join("");
let fileTicks = [
  ...(document.querySelector("#file-ticks")?.querySelectorAll<HTMLButtonElement>("button") ?? []),
];

function fadeOpeningOverlay() {
  if (loading.classList.contains("loaded")) return;
  loading.classList.add("loaded");
  loading.inert = true;
  overlayTimer = setTimeout(() => { loading.hidden = true; }, 400);
}
function updateLightPreview(entering = false) {
  const project = getProject(records[selected].projectId);
  lightPreview.hidden = !lightweight || mode === "archive" || (mode === "boot" && !entering);
  const image = lightPreview.querySelector("img")!;
  image.hidden = !project?.cover;
  if (project?.cover && image.getAttribute("src") !== project.cover) image.src = project.cover;
  lightPreview.querySelector("strong")!.textContent = project?.title ?? "DESIGN ARCHIVE";
}
function enterLightweightMode() {
  if (lightweight) return;
  lightweight = true;
  viewer?.dispose(); viewer = undefined;
  const previous = scene; scene = undefined;
  // A pending GLB promise may still be assembling. Dispose only after it settles.
  if (archiveSettled) previous?.dispose();
  threeState = "off";
  ready = true;
}
function beginOpening() {
  openingBrandAnimation?.cancel();
  openingBrandAnimation=undefined;
  clearTimeout(overlayTimer);
  openingStatus.reset();
  loading.hidden = false; loading.inert = false;
  loading.classList.remove("loaded");
  bootStart = performance.now() / 1000;
  openingTimeline.restart(bootStart);
  openingTrace = [];
  $("#stage").dataset.openingTrace = "[]";
  delete $("#stage").dataset.overlayFadeAt;
  $("#stage").dataset.openingPhase = "loading";
  $("#stage").dataset.openingTime = "0.000";
  $("#stage").dataset.openingHeld = "false";
  frozenTime = null; lastStep = "";
  selected = 0; scene?.select(0); updateSelection();
  setMode("boot"); audio.restartBoot();
  if (!isWallpaper) bootSequence.update(openingAt(0).referenceTime, { phase:"loading", elapsed:0, lightweight });
  if (isWallpaper) fadeOpeningOverlay();
  // Reuse settled resources on replay. No new downloads or synthetic progress.
  queueMicrotask(() => {
    for (const [group,state] of cachedOpeningGroups)
      state === "loaded" ? openingStatus.complete(group) : openingStatus.fail(group);
    if (lightweight) openingStatus.chooseLightweight();
  });
}

function setMode(next: Mode) {
  if (!isWallpaper && next === 'detail' && records[selected].placeholder) next = 'archive';
  if (workbench?.enabled && next === "detail") next = "archive";
  const previousMode = mode;
  const openingBrandBounds=!isWallpaper && previousMode==='boot' && next==='detail' && scene?.openingHandoffVisibility!==undefined ? $('.brand').getBoundingClientRect() : undefined;
  rollingTitles.forEach((title) =>
    title.update({
      animated: motionActive("rollingText") && next === "archive",
    }),
  );
  document.body.classList.toggle("zip", next !== "boot");
  const entryButton = document.querySelector<HTMLElement>(".mobile-entry");
  if (entryButton) entryButton.classList.toggle("is-retired", next !== "boot");
  if (next !== "archive") {
    rollingTitles.forEach((title) => title.finish());
    hoverCode.finish();
    $("#hover-label").hidden = true;
  }
  if (next === "detail" && mode !== "detail") recordAccess();
  mode = next;
  if (next !== "boot") {
    fadeOpeningOverlay();
    if (!pwaStarted && !lightweight) {
      pwaStarted = true;
      setTimeout(() => void initPwa(notify), 1500);
    }
  }
  updateLightPreview();
  const overview = !isWallpaper && next === 'archive';
  showProjectShowcase(next === 'detail' || overview ? records[selected].projectId : undefined, overview);
  syncWallpaperBackground();
  audio.setScene(next);
  if (next !== "boot" && audioPreview) {
    audioPreview = false;
    audioPreviewRequest++;
    configureAudio();
  }
  $("#stage").dataset.mode = next;
  if(!isWallpaper)$("#skip").hidden=next!=="boot" || !ready;
  workbench?.syncVisibility();
  if (previousMode !== next) fit();
  $("#boot").inert = next !== "boot";
  $("#boot").setAttribute("aria-hidden", String(next !== "boot"));
  $("#archive-ui").inert =
    next !== "archive" || Boolean(modal) || Boolean(workbench?.enabled);
  $("#archive-ui").setAttribute(
    "aria-hidden",
    String(next !== "archive" || Boolean(workbench?.enabled)),
  );
  $(".system-nav").inert = next === "boot" || Boolean(modal);
  $(".system-footer").inert = next === "boot" || Boolean(modal);
  if (next === "detail") {
    if (previousMode !== "detail")
      detailTransition.show(!motionActive("surfaceTransitions"));
  } else if (
    previousMode === "detail" ||
    (next === "boot" && !$("#detail-ui").hidden)
  ) {
    pendingDetailFocus = false;
    tabTransition.cancel();
    detailTransition.hide(
      !motionActive("surfaceTransitions") || next === "boot",
    );
    if (!modal && next === "archive")
      $(".read-file").focus({ preventScroll: true });
  }
  $("#detail-ui").inert = next !== "detail" || Boolean(modal);
  scene?.setMode(next === "boot" ? "hidden" : next);
  scene?.setProjectDisplay(next === 'archive' ? undefined : records[selected].projectId,next === 'detail');
  if (next !== "boot") {
    bootSequence.reset();
    $(".file-title").firstChild!.textContent = "FILE NUMBER: ";
    $("#stage").dataset.boot = "done";
  }
  if (next === "detail" && previousMode !== "detail") {
    renderDetail();
    pendingDetailFocus = false;
    if (!scene) {
      $("#detail-content").style.opacity = "1";
      $("#detail-content").style.translate = "0 0";
      $("#detail-content").inert = false;
    }
  }
  if (!isWallpaper && next !== 'boot') updateSelection();
  if(openingBrandBounds){
    const brand=$('.brand'),bounds=brand.getBoundingClientRect();
    const scale=Number($('#stage').style.getPropertyValue('--stage-scale'))||1;
    if(bounds.width>0 && bounds.height>0){
      openingBrandAnimation=brand.animate([
        {translate:`${(openingBrandBounds.left-bounds.left)/scale}px ${(openingBrandBounds.top-bounds.top)/scale}px`,scale:`${openingBrandBounds.width/bounds.width} ${openingBrandBounds.height/bounds.height}`},
        {translate:'0 0',scale:'1 1'},
      ],{duration:OPENING_HANDOFF_DURATION*1000,easing:'cubic-bezier(.65,0,.35,1)'});
    }
  }
}
window.addEventListener('design-terminal:project-overview',()=>{
  if (!ready || mode === 'boot') return;
  setMode('archive');
  requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.read-file')?.focus({preventScroll:true}));
});
function select(index: number, navigation?: ArchiveNavigation) {
  selected = (index + records.length) % records.length;
  if (mode === "detail") setMode("archive");
  activeTab = "overview";
  scene?.select(selected, navigation);
  columnMemory[isWallpaper ? fileLocation(selected).lane : wrap(scene?.selectedArchiveCell.lane ?? fileLocation(selected).lane,archiveColumns.length)] = selected;
  updateSelection(navigation);
  const columnMove =
    navigation && "axis" in navigation && navigation.axis === "lane";
  audio.play(
    columnMove ? "column" : "tick",
    columnMove ? navigation.direction * 0.45 : 0,
  );
}
function stepFile(direction: number) {
  const files = columnFiles(fileLocation(selected).lane);
  if (files.length < 2) return;
  select(
    files[(files.indexOf(selected) + direction + files.length) % files.length],
    { axis: "row", direction },
  );
}
function stepColumn(direction: number) {
  const lane = isWallpaper ? fileLocation(selected).lane : wrap(scene?.selectedArchiveCell.lane ?? fileLocation(selected).lane,archiveColumns.length);
  const next = wrap(lane + direction, archiveColumns.length);
  select(columnMemory[next], { axis: "lane", direction });
}
const projectDirectory = !isWallpaper ? createProjectDirectory($('.project-directory'), projects.filter(p=>p.shortcut && p.page),id=>{
  if(!ready || mode==='boot' || modal || caseIsOpen())return;
  const index=records.findIndex(r=>r.projectId===id && !r.section && r.title===getProject(id)?.title);
  if(index<0)return;const detail=mode==='detail';select(index);if(detail)setMode('detail');
}) : undefined;
function updateSelection(navigation?: ArchiveNavigation) {
  projectDirectory?.sync(records[selected].projectId);
  const r = records[selected];
  const lane = isWallpaper ? fileLocation(selected).lane : wrap(scene?.selectedArchiveCell.lane ?? fileLocation(selected).lane,archiveColumns.length);
  const files = columnFiles(lane);
  selectionTitle.update({
    text: isWallpaper ? r.title : r.placeholder ? t('项目集待补充','COLLECTION RESERVED') : getProject(r.projectId)?.subtitle ?? r.title,
    animated: motionActive("rollingText") && mode === "archive",
  });
  clearanceTitle.update({
    text: isWallpaper ? r.clearance : r.placeholder ? t('尚未开放','NOT AVAILABLE') : r.projectId==='erste001' ? t('已打样 / 2026','PROTOTYPED / 2026') : t('结构迭代中 / 2026','IN PROGRESS / 2026'),
    animated: motionActive("rollingText") && mode === "archive",
  });
  categoryTitle.update({
    text: isWallpaper ? r.category : collectionAtLane(lane).id==='gamingmouse' ? 'GAMING MOUSE' : t(collectionAtLane(lane).zh,collectionAtLane(lane).title),
    animated: motionActive("rollingText") && mode === "archive",
  });
  const direction =
    navigation && "axis" in navigation
      ? navigation.direction > 0
        ? "up"
        : "down"
      : "auto";
  selectedCode.update({
    value: Number(r.id.slice(2)),
    animated: motionActive("rollingNumbers") && mode === "archive",
    direction,
  });
  fileCounter.update({
    value: !isWallpaper && r.placeholder ? 0 : files.indexOf(selected) + 1,
    animated: motionActive("rollingNumbers") && mode === "archive",
    direction:
      navigation && "axis" in navigation && navigation.axis === "row"
        ? direction
        : "auto",
  });
  $(".count-total").textContent = String(!isWallpaper && r.placeholder ? 0 : files.length).padStart(2, "0");
  columnCounter.update({
    value: isWallpaper ? lane + 1 : collectionNumberAtLane(lane),
    animated: motionActive("rollingNumbers") && mode === "archive",
    direction:
      navigation && "axis" in navigation && navigation.axis === "lane"
        ? direction
        : "auto",
  });
  columnTitle.update({
    text: isWallpaper ? archiveColumns[lane] : collectionAtLane(lane).id==='gamingmouse' ? 'GAMING MOUSE' : t(collectionAtLane(lane).zh,collectionAtLane(lane).title),
    animated: motionActive("rollingText") && mode === "archive",
  });
  $<HTMLButtonElement>('[data-action="column-prev"]').disabled = false;
  $<HTMLButtonElement>('[data-action="column-next"]').disabled = false;
  if (isWallpaper && fileTicks.length !== files.length) {
    $("#file-ticks").innerHTML = files.map(index => `<button data-select="${index}"></button>`).join('');
    fileTicks = [...$("#file-ticks").querySelectorAll<HTMLButtonElement>("button")];
  }
  fileTicks.forEach((button, slot) => {
    const index = files[slot],
      record = records[index];
    button.dataset.select = String(index);
    button.setAttribute("aria-label", t(`选择项目 ${record.title}`,`Select project ${record.placeholder?record.en:record.title}`));
    button.disabled = Boolean(record.placeholder);
    button.title = `${record.id} · ${record.title}`;
    button.classList.toggle("selected", index === selected);
    button.setAttribute("aria-pressed", String(index === selected));
  });
  $("#saved-count").textContent = String(saved.size).padStart(2, "0");
  if (!isWallpaper) {
    const empty=Boolean(r.placeholder);
    $('.archive-callout').dataset.reserved=String(empty);
    $('.catalogue-project-title').textContent=empty?t('待补充','COMING SOON'):r.title;
    $<HTMLButtonElement>('.file-title').disabled=empty;
    $<HTMLButtonElement>('.read-file').disabled=empty;
    $('.read-file-label').textContent=empty?t('项目集尚未开放','COLLECTION RESERVED'):t('查看项目展示','VIEW PROJECT');
    document.querySelectorAll<HTMLButtonElement>('[data-action=prev],[data-action=next]').forEach(button=>button.disabled=files.length<2);
    document.querySelectorAll<HTMLElement>('[data-action=prev]').forEach(button=>button.setAttribute('aria-label',t('上一个项目','Previous project')));
    document.querySelectorAll<HTMLElement>('[data-action=next]').forEach(button=>button.setAttribute('aria-label',t('下一个项目','Next project')));
    $('[data-action=column-prev]').setAttribute('aria-label',t('上一个项目集','Previous collection'));
    $('[data-action=column-next]').setAttribute('aria-label',t('下一个项目集','Next collection'));

    $('.collection-kicker').textContent=t('项目集','PROJECT COLLECTION');
    $('.collection-number-label').textContent=t('项目集','COLLECTION');
    $('.archive-counter .tiny-label').textContent=t('项目 / 选择','PROJECT / SELECT');
    $('#archive-ui').setAttribute('aria-label',t('项目集与项目选择','Collections and projects'));
    $('[data-action=replay]').textContent=t('重播开场 ↗','REPLAY OPENING ↗');
    $('[data-action=replay]').title=t('重播启动流程','Replay opening sequence');
    document.querySelectorAll<HTMLElement>('.terminal-settings-open').forEach(button=>{
      button.setAttribute('aria-label',t('终端设置','Terminal settings'));
      button.title=t('终端设置','Terminal settings');
    });
    localize();
  }
}
window.addEventListener('design-terminal:language',()=>{updateSelection();if(mode==='detail')renderDetail();});
window.addEventListener('design-terminal:case-approach',()=>scene?.beginProjectApproach());
window.addEventListener('design-terminal:case-return',()=>scene?.endProjectApproach());
window.addEventListener('design-terminal:case-return-start',()=>scene?.beginProjectReturn());
window.addEventListener('design-terminal:case-showcase',event=>{
  const id=(event as CustomEvent<{projectId?:string}>).detail?.projectId;
  const index=records.findIndex(r=>r.projectId===id && !r.section && r.title===getProject(id)?.title);
  if(index>=0 && index!==selected)select(index);
  setMode('detail');
});
function replayBoot(forcePreview = false) {
  if (!ready) return;
  closeModal(() => replayBootAfterModal(forcePreview));
}
function replayBootAfterModal(forcePreview: boolean) {
  beginOpening();
  if (isWallpaper && !motionActive("boot") && !forcePreview) setMode("archive");
  if (!forcePreview) audio.play("ui-tick");
}
function openFile() {
  if (!ready) return;
  if (!isWallpaper && records[selected].placeholder) { notify(t('这个项目集尚未开放','This collection is coming soon')); return; }
  if (!isWallpaper && mode === 'archive') {
    setMode('detail');
    audio.play('open');
    return;
  }
  const record = records[selected];
  if (getProject(record.projectId)?.page) {
    closeModal(() => openProject(record.projectId!, record.section));
    return;
  }
  closeModal(() => {
    setMode("detail");
    audio.play("open");
  });
}
function toggleSaved() {
  const id = records[selected].id;
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  try {
    localStorage.setItem("tony-design-saved", JSON.stringify([...saved]));
  } catch {}
  $("#saved-count").textContent = String(saved.size).padStart(2, "0");
  const button = $<HTMLButtonElement>('[data-action="bookmark"]');
  const added = saved.has(id);
  if(!isWallpaper) {
    button.firstChild!.textContent=added?t('已保存','SAVED'):t('保存档案','SAVE');
    button.querySelector('span')!.textContent=added?'−':'+';
    button.setAttribute('aria-pressed',String(added));
    audio.play('confirm');
    notify(added?t('档案已保存','Archive saved'):t('已取消保存','Archive removed from saved'));
    return;
  }
  button.firstChild!.textContent = added
    ? "− REMOVE FROM SAVED"
    : "＋ SAVE ARCHIVE";
  button.querySelector("span")!.textContent = added ? "已收藏" : "收藏档案";
  button.setAttribute("aria-pressed", String(added));
  bookmarkFeedback?.cancel();
  if (motionActive("surfaceTransitions"))
    bookmarkFeedback = button.animate(
      [{ backgroundColor: "#67634c" }, { backgroundColor: "#252820" }],
      { duration: 220, easing: "ease-out" },
    );
  audio.play("confirm");
  notify(saved.has(id) ? "档案已加入收藏" : "已取消收藏");
}
function renderDetail() {
  tabTransition.cancel();
  const r = records[selected];
  if(!isWallpaper && r.projectId) {renderProjectDetail();return;}
  $("#object-id").textContent = "NO." + String(selected + 1).padStart(3, "0");
  $("#detail-content").innerHTML = `
  <div class="detail-kicker"><span>FILE ${r.id}</span><span>${escapeHtml(r.clearance)}</span></div>
  <h2>${escapeHtml(r.en)}</h2><div class="detail-title-cn">${escapeHtml(r.title)}<span>${escapeHtml(r.category)}</span></div>
  <div class="detail-rule"></div>
  <dl class="metadata"><div><dt>DISCIPLINE / 方向</dt><dd>${escapeHtml(r.department)}</dd></div><div><dt>YEAR / 年份</dt><dd>${escapeHtml(r.date)}</dd></div><div><dt>DESIGNER / 设计师</dt><dd>${escapeHtml(r.lead)}</dd></div><div><dt>STATUS / 状态</dt><dd><i></i>${r.clearance === "RESTRICTED" ? "目录访问" : "项目记录 · 可读取"}</dd></div></dl>
  <div class="detail-tabs" role="tablist"><button id="tab-overview" class="active" role="tab" aria-controls="tab-panel" aria-selected="true" data-tab="overview">01 <span>概述</span></button><button id="tab-notes" role="tab" aria-controls="tab-panel" aria-selected="false" data-tab="notes">02 <span>研究记录</span></button><button id="tab-history" role="tab" aria-controls="tab-panel" aria-selected="false" data-tab="history">03 <span>访问日志</span></button><i class="tab-indicator" aria-hidden="true"></i></div>
  <div id="tab-panel" class="tab-panel" role="tabpanel">${overview()}</div>
  <div class="detail-actions"><button class="solid-button" data-action="bookmark">${saved.has(r.id) ? "− REMOVE FROM SAVED" : "＋ SAVE ARCHIVE"}<span>${saved.has(r.id) ? "已收藏" : "收藏档案"}</span></button><a class="export-button" href="${assetUrl(`archives/RHINE-LAB-${r.id}.txt`)}" download="RHINE-LAB-${r.id}.txt" aria-label="导出 ${r.id} 档案">EXPORT <span>↓</span></a></div>
  <div class="detail-footnote">${getProject(r.projectId)?.page ? `<button class="case-study-open" data-project="${escapeHtml(r.projectId!)}" data-section="${escapeHtml(r.section ?? '')}">展开完整项目档案 →</button>` : `<a href="${escapeHtml(r.source)}" target="_blank" rel="noopener">完整项目档案 ↗</a>`}<span>${String(selected + 1).padStart(3, "0")} / ${String(records.length).padStart(3, "0")}</span></div>`;
  $("#detail-content").setAttribute("tabindex", "-1");
  $('[data-action="bookmark"]').setAttribute(
    "aria-pressed",
    String(saved.has(r.id)),
  );
  documentDecryption.reset(
    $("#detail-content"),
    !motionActive("documentReveal") ||
      !scene ||
      scene.decryptionFrame.phase === "clear",
  );
  setTab(activeTab, false);
}
function renderProjectDetail() {
  const r=records[selected], project=getProject(r.projectId)!;
  const collectionProjects=columnFiles(fileLocation(selected).lane).map(index=>records[index]).filter(record=>!record.placeholder && record.projectId && !record.section);
  const projectIndex=collectionProjects.findIndex(record=>record.projectId===project.id);
  const projectStep=(direction:number)=>{
    const target=collectionProjects[wrap(projectIndex+direction,collectionProjects.length)];
    const label=direction<0?t('上一个项目','Previous project'):t('下一个项目','Next project');
    return `<button type="button" class="detail-project-step" data-showcase-project="${escapeHtml(target.projectId!)}" data-detail-direction="${direction}" aria-label="${label}" ${collectionProjects.length<2?'disabled':''}><span aria-hidden="true">${direction<0?'←':'→'}</span><span class="detail-project-step-label">${label}</span></button>`;
  };
  const status=r.projectId==='erste001'?t('已打样 · 可读取','PROTOTYPED · READABLE'):t('结构迭代中 · 可读取','IN PROGRESS · READABLE');
  $('#object-id').textContent=`NO.${project.number}`;
  $('.back-button span').textContent=t('返回项目集','PROJECT COLLECTIONS');
  $('.back-button').setAttribute('aria-label',t('返回项目集','Back to collections'));
  $('.object-caption>div').textContent='GAMING MOUSE / DESIGN ARCHIVE';
  $('.viewer-open').innerHTML=`${t('360° 查看档案装置','360° INSPECT ARCHIVE')} <span>↗</span>`;
  $('#detail-content').innerHTML=`<div class="detail-kicker"><span>FILE ${escapeHtml(r.id)}</span><span>PROJECT ARCHIVE / ${project.number}</span></div>
    <div class="project-detail-title-row"><h2 class="project-detail-heading">${escapeHtml(project.title)}</h2><nav class="detail-project-navigation" aria-label="${t('切换项目','Project selection')}">${projectStep(-1)}${projectStep(1)}</nav></div><div class="detail-title-cn">${r.projectId==='erste001'?t('FPS 游戏鼠标','FPS Gaming Mouse'):t('低矮壳体结构重排','Low-profile Shell Rebuild')}<span>GAMING MOUSE</span></div>
    <div class="detail-rule"></div>
    <dl class="metadata"><div><dt>${t('DISCIPLINE / 设计方向','DISCIPLINE')}</dt><dd>${t('独立产品设计','Independent product design')}</dd></div><div><dt>${t('COLLECTION / 项目集','COLLECTION')}</dt><dd>GAMING MOUSE</dd></div><div><dt>${t('DESIGNER / 设计师','DESIGNER')}</dt><dd>${escapeHtml(r.lead)}</dd></div><div><dt>${t('STATUS / 状态','STATUS')}</dt><dd><i></i>${status}</dd></div></dl>
    <div class="detail-tabs" role="tablist"><button id="tab-overview" role="tab" aria-controls="tab-panel" data-tab="overview">01 <span>${t('概述','Overview')}</span></button><button id="tab-notes" role="tab" aria-controls="tab-panel" data-tab="notes">02 <span>${t('研究记录','Research')}</span></button><button id="tab-history" role="tab" aria-controls="tab-panel" data-tab="history">03 <span>${t('访问记录','Access log')}</span></button><i class="tab-indicator" aria-hidden="true"></i></div>
    <div id="tab-panel" class="tab-panel" role="tabpanel"></div>
    <div class="detail-actions"><button class="solid-button showcase-open" data-project="${escapeHtml(project.id)}">${t('进入项目','ENTER PROJECT')}<span>↗</span></button><button class="export-button" data-action="bookmark" aria-pressed="${saved.has(r.id)}">${saved.has(r.id)?t('已保存','SAVED'):t('保存档案','SAVE')}<span>${saved.has(r.id)?'−':'+'}</span></button></div>
    <div class="detail-footnote"><span>${project.subtitle??''}</span><span>${project.number} / 002</span></div>`;
  $('#detail-content').setAttribute('tabindex','-1');
  documentDecryption.reset($('#detail-content'),!motionActive('documentReveal')||!scene||scene.decryptionFrame.phase==='clear');
  setTab(activeTab,false);
}
function overview() {
  return `<div class="panel-label">${t('ABSTRACT / 摘要','ABSTRACT')}</div><p>${escapeHtml(!isWallpaper && records[selected].projectId ? projectSummary(records[selected].projectId!) : records[selected].abstract)}</p>`;
}
function setTab(tab: string, sound = true) {
  if (sound && tab === activeTab) return;
  activeTab = tab;
  document.querySelectorAll("[data-tab]").forEach((b) => {
    const active = (b as HTMLElement).dataset.tab === tab;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
    b.setAttribute("tabindex", active ? "0" : "-1");
  });
  const r = records[selected];
  const tabButton = $<HTMLButtonElement>(`[data-tab="${tab}"]`);
  const indicator = $(".tab-indicator");
  indicator.style.transition =
    sound && motionActive("surfaceTransitions") ? "" : "none";
  indicator.style.transform = `translateX(${tabButton.offsetLeft}px) scaleX(${tabButton.offsetWidth})`;
  $("#tab-panel").setAttribute("aria-labelledby", tabButton.id);
  $("#tab-panel").innerHTML =
    tab === "overview"
      ? overview()
      : tab === "notes"
        ? `<div class="panel-label">${t('RESEARCH NOTES / 研究记录','RESEARCH NOTES')}</div><ol class="research-notes">${(!isWallpaper&&r.projectId?projectFindings(r.projectId):r.findings).map((f, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${escapeHtml(f)}</li>`).join("")}</ol>`
        : `<div class="panel-label">${t('ACCESS LOG / 本次访问','ACCESS LOG')}</div>${accessLog
            .filter((entry) => entry.id === r.id)
            .slice(0, 4)
            .map(
              (entry) =>
                `<div class="log-row"><span>${entry.time}</span><span>albert_z0413@hotmail.com</span><b>READ AUTHORIZED</b></div>`,
            )
            .join(
              "",
            )}<p class="log-note">${t('此处记录本次浏览会话中的档案阅读操作。','Archive views recorded in this browser session.')}</p>`;
  $("#tab-panel").scrollTop = 0;
  documentDecryption.refresh();
  if (sound) {
    tabTransition.reveal($("#tab-panel"), !motionActive("surfaceTransitions"));
    audio.play("ui-tick");
  }
}
function notify(message: string) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2600);
}

function openModal(kind: NonNullable<typeof modal>) {
  if (!ready) return;
  if (!modal) {
    previousFocus = document.activeElement as HTMLElement;
    modalSiblings = [...$("#stage").children]
      .filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.id !== "modal-root",
      )
      .map((node) => ({ node, inert: node.inert }));
    modalSiblings.forEach(({ node }) => (node.inert = true));
  }
  modalClosing = false;
  modal = kind;
  document.documentElement.classList.add('terminal-modal-open');
  searchQuery = "";
  filter = "全部档案";
  audio.play("page-open");
  renderModal();
}
function closeModal(afterClose?: () => void) {
  if (!modal) {
    afterClose?.();
    return;
  }
  if (modalClosing) return;
  modalClosing = true;
  audio.play("page-close");
  modalTransition!.hide(!motionActive("surfaceTransitions"), () => {
    modal = null;
    document.documentElement.classList.remove('terminal-modal-open');
    modalClosing = false;
    $("#modal-root").replaceChildren();
    modalTransition = undefined;
    modalSiblings.forEach(({ node, inert }) => (node.inert = inert));
    modalSiblings = [];
    $("#archive-ui").inert = mode !== "archive" || Boolean(workbench?.enabled);
    $("#detail-ui").inert = mode !== "detail";
    previousFocus?.focus({ preventScroll: true });
    afterClose?.();
  });
}
function renderModal() {
  if (!modal) return;
  modalTransition?.dispose();
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="terminal-modal ${modal === "settings" ? "settings-modal" : ""}" role="dialog" aria-modal="true" aria-label="${modal === "settings" ? "系统设置" : modal === "saved" ? "收藏档案" : "档案检索"}"><div class="modal-top"><span>albert_z0413@hotmail.com / ${modal === "settings" ? "SYSTEM PREFERENCES" : "ARCHIVE DIRECTORY"}</span><button data-action="close-modal" aria-label="关闭窗口">CLOSE <span>×</span></button></div>${modal === "settings" ? settingsMarkup() : `<h2>${modal === "saved" ? "SAVED ARCHIVES" : "ARCHIVE INDEX"}<small>${modal === "saved" ? "收藏档案" : "内部档案检索"}</small></h2><div class="search-field"><span>⌕</span><input id="archive-search" type="search" autocomplete="off" placeholder="搜索项目、结构或原型" aria-label="检索档案"/><span class="key">ESC</span></div><div class="category-filters">${categories.map((c, i) => `<button data-filter="${escapeHtml(c)}" class="${i === 0 ? "active" : ""}">${escapeHtml(c)}</button>`).join("")}</div><div class="result-header"><span>FILE / 档案</span><span>DISCIPLINE / 方向</span><span>ACCESS</span></div><div id="search-results" class="search-results"></div><div class="modal-bottom"><span id="result-count"></span><span>DESIGN ARCHIVE <i>●</i> CONNECTED</span></div>`}</section></div>`;
  const backdrop = $(".modal-backdrop");
  backdrop.hidden = true;
  modalTransition = new SurfaceTransition(backdrop, $(".terminal-modal"));
  modalTransition.show(!motionActive("surfaceTransitions"));
  if (modal === "settings") updateQualitySummary();
  if (modal !== "settings") {
    renderResults();
    requestAnimationFrame(() => {
      if (backdrop.isConnected && !modalClosing) $("#archive-search").focus();
    });
  } else
    requestAnimationFrame(() => {
      if (backdrop.isConnected && !modalClosing)
        $('[data-action="close-modal"]').focus();
    });
  $("#modal-root")
    .querySelector(".modal-backdrop")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
}
function renderResults() {
  const results = records
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r }) =>
        (modal !== "saved" || saved.has(r.id)) &&
        (filter === "全部档案" || r.category === filter) &&
        `${r.id} ${r.title} ${r.en} ${r.department} ${r.lead}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  $("#search-results").innerHTML = results.length
    ? results
        .map(
          ({ r, i }) =>
            `<button class="result-row" data-result="${i}"><span class="result-name"><b>${r.id}</b><span>${escapeHtml(r.title)}<small>${escapeHtml(r.en)}</small></span>${saved.has(r.id) ? "<i>＋</i>" : ""}</span><span>${escapeHtml(r.department)}</span><span>${r.clearance === "RESTRICTED" ? "CATALOG ONLY" : "AUTHORIZED"} <i>↗</i></span></button>`,
        )
        .join("")
    : `<div class="empty-results"><span>∅</span><strong>${modal === "saved" && !searchQuery ? "尚无收藏档案" : "没有匹配的档案"}</strong><p>${modal === "saved" && !searchQuery ? "读取档案时，选择 SAVE ARCHIVE 将其保存在此处。" : "尝试其他名称、档案编号，或切换科室分类。"}</p><button data-action="reset-search">${modal === "saved" ? "查看全部档案 →" : "重置检索 →"}</button></div>`;
  $("#result-count").textContent =
    `${String(results.length).padStart(2, "0")} RECORDS FOUND`;
}
function updateQualitySummary() {
  const summary = document.querySelector("#quality-summary");
  if (!summary) return;
  if (!scene) {
    summary.textContent = "3D 已关闭 · 三维模型与渲染资源已释放";
    return;
  }
  const canvas = scene.renderer.domElement;
  const metrics = JSON.parse(
    canvas.parentElement?.dataset.renderQuality ?? "{}",
  );
  summary.textContent = `${superPerformanceEnabled() ? "超级性能模式已启用 · 画质设置暂被覆盖，关闭后恢复 · " : ""}实际渲染 ${canvas.width} × ${canvas.height} · ${effectiveRenderQuality().antialias === "smaa" ? "SMAA" : "原始抗锯齿"} · 纹理 ${metrics.anisotropy ?? 1}×${metrics.limited ? " · 已达到缓冲上限" : ""}`;
}
function motionPreferenceNoteMarkup() {
  const preset = prefs.motionPreset;
  const allEnabled = Object.values(prefs.motion).every(Boolean);
  return `<div id="motion-preference-note" class="motion-preference-note"><p>${motionSummary(prefs.motion)}</p><span>预设：${preset === "full" ? "完整动画" : preset === "reduced" ? "减少动画" : "自定义"} · 选择会保存在本站</span>${allEnabled ? "" : '<button data-action="enable-motion">启用完整动画并重播 ↻</button>'}</div>`;
}
function settingsMarkup() {
  return `<h2>SYSTEM SETTINGS<small>终端偏好设置</small></h2><p class="settings-intro">albert_z0413@hotmail.com <span>·</span> SESSION AUTHORIZED</p>${isWallpaper ? '<p class="wallpaper-settings-note">每次启动都会读取 Wallpaper Engine 中的设置。在此修改仅对当前运行生效，无法持久保存；如需保留，请在 Wallpaper Engine 的壁纸属性中调整。</p>' : ""}<div class="settings-list">${isWallpaper ? themeSettingsMarkup(prefs.colorTheme === "dark") : ""}${!isWallpaper ? `<label><div><strong>SUPER PERFORMANCE</strong><span>降低三维画质和渲染分辨率，保留完整动效；关闭后恢复原画质</span></div><input type="checkbox" data-pref="superPerformance" ${prefs.superPerformance ? "checked" : ""}/><i class="toggle"></i></label>` : ""}${workbench?.settingsMarkup() ?? ""}${isWallpaper ? audioSettingsMarkup(prefs) : ""}</div>${motionPreferenceNoteMarkup()}${motionSettingsMarkup(prefs.motion, prefs.motionPreset)}${qualityMarkup(prefs.rendering)}${pwaSettingsMarkup()}<div class="settings-shortcuts">${isWallpaper ? "<span>DESKTOP CONTROLS</span><p>拖动阵列或点击界面按钮浏览档案。桌面模式下，方向键与滚轮可能无法传入壁纸。</p>" : "<span>KEYBOARD CONTROLS</span><p><kbd>←</kbd><kbd>→</kbd> 切列 <kbd>↑</kbd><kbd>↓</kbd> 选档 <kbd>ENTER</kbd> 读取 <kbd>/</kbd> 检索 <kbd>ESC</kbd> 返回</p>"}</div><div class="settings-bottom">${!isWallpaper && document.fullscreenEnabled ? '<button data-action="fullscreen">FULLSCREEN <span>↗</span></button>' : ""}<button data-action="restart">REINITIALIZE SYSTEM <span>↻</span></button></div><div class="modal-bottom"><span>ANALYSIS OS / 1.0 · 使用 MiSans 字体（小米） <a href="${assetUrl("fonts/MiSans-license.pdf")}" target="_blank" rel="noopener">字体许可</a></span><span>界面基于 <a href="https://github.com/LBEILC/RhineLabUI" target="_blank" rel="noopener">RhineLabUI</a></span></div>`;
}

document.addEventListener("input", (e) => {
  const slider = e.target as HTMLInputElement;
  if (slider.dataset.quality) {
    const output = document.querySelector<HTMLOutputElement>(
      `[data-quality-output="${slider.dataset.quality}"]`,
    );
    if (output) output.value = `${slider.value}%`;
  }
  const volume = e.target as HTMLInputElement;
  if (
    isWallpaper && (volume.dataset.volume === "musicVolume" ||
    volume.dataset.volume === "soundVolume")
  ) {
    prefs[volume.dataset.volume] = Number(volume.value) / 100;
    volume
      .closest("label")
      ?.querySelector("output")
      ?.replaceChildren(`${volume.value}%`);
    saveAudioPrefs();
  }
  if ((e.target as HTMLElement).id === "archive-search") {
    searchQuery = (e.target as HTMLInputElement).value;
    renderResults();
  }
});
document.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === "quality-preset" && Object.hasOwn(qualityPresets, el.value)) {
    prefs.rendering = { ...qualityPresets[el.value as QualityPreset] };
    savePrefs();
  } else if (el.dataset.quality) {
    const key = el.dataset.quality as keyof RenderQuality;
    prefs.rendering = normalizeQuality({
      ...prefs.rendering,
      [key]: key === "antialias" ? el.value : Number(el.value),
    });
    savePrefs();
  }
  if (el.dataset.pref) {
    const key = el.dataset.pref;
    if (
      (isWallpaper && (key === "sound" || key === "music")) ||
      key === "quality" ||
      key === "superPerformance"
    )
      prefs[key] = el.checked;
    if (key === "sound" || key === "music") saveAudioPrefs();
    else savePrefs();
    audio.play("confirm");
  }
  if (el.dataset.motion) {
    const key = el.dataset.motion as MotionKey;
    prefs.motion[key] = el.checked;
    prefs.motionPreset = motionPresetFor(prefs.motion);
    savePrefs();
    const motionRoot = $("#motion-settings");
    const advancedOpen =
      motionRoot.querySelector<HTMLDetailsElement>(".motion-advanced")?.open ??
      false;
    const settingsPanel = motionRoot.closest<HTMLElement>(".settings-modal");
    const scrollTop = settingsPanel?.scrollTop ?? 0;
    motionRoot.outerHTML = motionSettingsMarkup(
      prefs.motion,
      prefs.motionPreset,
    );
    $("#motion-preference-note").outerHTML = motionPreferenceNoteMarkup();
    $("#motion-settings").querySelector<HTMLDetailsElement>(
      ".motion-advanced",
    )!.open = advancedOpen;
    requestAnimationFrame(() => {
      if (settingsPanel) settingsPanel.scrollTop = scrollTop;
      document
        .querySelector<HTMLInputElement>(`[data-motion="${key}"]`)
        ?.focus({ preventScroll: true });
    });
    notify(
      key === "boot"
        ? "开场设置将在下次重播时生效"
        : el.checked
          ? "已启用此动画"
          : "已关闭此动画",
    );
    audio.play("confirm");
  }
});
document.addEventListener("click", (e) => {
  const themeButton = (e.target as Element).closest<HTMLElement>(
    "[data-color-theme]",
  );
  if (themeButton && isWallpaper) {
    prefs.colorTheme =
      themeButton.dataset.colorTheme === "dark" ? "dark" : "light";
    savePrefs();
    return;
  }
  if (!started) return;
  if (modalClosing) return;
  const el = (e.target as Element).closest<HTMLElement>("button");
  if (!el) return;
  if (el.dataset.action === "motion-preset") {
    const preset = el.dataset.preset;
    if (preset !== "full" && preset !== "reduced") return;
    prefs.motionPreset = preset;
    prefs.motion = preset === "full" ? fullMotion() : reducedMotion();
    savePrefs();
    renderModal();
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(
          `[data-action="motion-preset"][data-preset="${prefs.motionPreset}"]`,
        )
        ?.focus({ preventScroll: true }),
    );
    audio.play("confirm");
    return;
  }
  if (el.dataset.select) {
    select(Number(el.dataset.select));
    return;
  }
  if (el.dataset.result) {
    const index = Number(el.dataset.result);
    closeModal(() => {
      select(index);
      openFile();
    });
    return;
  }
  if (el.dataset.filter) {
    filter = el.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          (b as HTMLElement).dataset.filter === filter,
        ),
      );
    renderResults();
    return;
  }
  if (el.dataset.tab) {
    setTab(el.dataset.tab);
    return;
  }
  const action = el.dataset.action;
  if(el.dataset.showcaseProject){
    const index=records.findIndex(r=>r.projectId===el.dataset.showcaseProject && !r.section && r.title===getProject(r.projectId)?.title);
    if(index>=0){
      const direction=el.dataset.detailDirection;
      select(index);setMode('detail');
      if(direction)document.querySelector<HTMLButtonElement>(`.detail-project-step[data-detail-direction="${direction}"]`)?.focus({preventScroll:true});
    }
    return;
  }
  if (el.dataset.project) {
    openProject(el.dataset.project, el.dataset.section);
    return;
  }
  if (action === "toggle-three") {
    void toggleThree();
    return;
  }
  if (action === "sound-preview") audio.play("confirm");
  if (action === "skip") {
    if(!isWallpaper && !ready)return;
    setMode(isWallpaper?"archive":"detail");
    scene?.revealImmediately();
    scene?.revealProjectDisplay();
    audio.play("confirm");
  }
  if (action === "prev") stepFile(-1);
  if (action === "next") stepFile(1);
  if (action === "column-prev") stepColumn(-1);
  if (action === "column-next") stepColumn(1);
  if (action === "open") openFile();
  if (action === "model-viewer" && mode === "detail" && scene) {
    const activeScene = scene;
    // Safari does not always focus a button when it is tapped. Capture the
    // actual opener so closing the modal reliably restores the right control.
    el.focus({ preventScroll: true });
    viewer ??= new ModelViewer(
      $("#stage"),
      () => {
        audio.setScene(mode);
        audio.play("page-close");
      },
      (sound) => audio.play(sound === "tick" ? "ui-tick" : sound),
    );
    audio.setScene("viewer");
    viewer.setSuperPerformance(superPerformanceEnabled());
    viewer.setQuality(effectiveRenderQuality());
    viewer.setMotion(prefs.motion);
    scene.finishDecryption();
    viewer.open(
      records[selected].id,
      records[selected].title,
      () => activeScene.createAssemblyModel(),
      !motionActive("viewerNavigation"),
    );
    audio.play("page-open");
  }
  if (action === "back") {
    setMode("archive");
    audio.play("back");
  }
  if (action === "search" || action === "saved" || action === "settings") {
    el.focus({ preventScroll: true });
    openModal(action);
  }
  if (action === "close-modal") closeModal();
  if (action === "bookmark") toggleSaved();
  if (action === "reset-search") {
    modal = "search";
    searchQuery = "";
    filter = "全部档案";
    renderModal();
  }
  if (action === "replay" || action === "restart") {
    replayBoot();
  }
  if (action === "enable-motion") {
    prefs.motion = fullMotion();
    prefs.motionPreset = "full";
    savePrefs();
    replayBoot();
  }
  if (action === "fullscreen" && document.fullscreenEnabled) {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen()
        .catch(() => notify("请使用浏览器的全屏快捷键 F11"));
  }
});
document.addEventListener("keydown", (e) => {
  if (caseIsOpen()) return;
  if (showcaseVisible()) {
    if(e.key==='Escape' && mode==='detail'){
      e.preventDefault();
      returnToProjectOverview();
      return;
    }
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();
      const current=projects.findIndex(p=>p.id===records[selected].projectId);
      const next=projects[(current+(e.key==='ArrowRight'?1:projects.length-1))%projects.length];
      document.querySelector<HTMLButtonElement>(`[data-showcase-project="${next.id}"]`)?.click();
    }
    return;
  }
  if (!started) return;
  if (mode === "boot" && !isWallpaper) {
    if (["Enter", "Escape", " "].includes(e.key)) e.preventDefault();
    return;
  }
  if (viewer?.isOpen) return;
  if (playground?.active && !modal) {
    if (e.key === "Escape") {
      e.preventDefault();
      playground.stop();
    } else if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Enter",
        "/",
      ].includes(e.key) &&
      !(e.target instanceof HTMLButtonElement)
    )
      e.preventDefault();
    return;
  }
  if (modalClosing) {
    e.preventDefault();
    return;
  }
  const typing = e.target instanceof HTMLInputElement;
  if (e.key === "Escape") {
    if (modal) closeModal();
    else if (mode === "detail" || (mode === "boot" && ready)) {
      const sound = mode === "detail" ? "back" : "ui-tick";
      setMode("archive");
      audio.play(sound);
    }
    return;
  }
  if (modal && e.key === "Tab") {
    const focusables = [
      ...$("#modal-root").querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]',
      ),
    ];
    const visible = focusables.filter(
      (el) =>
        el.tabIndex >= 0 &&
        !el.matches(":disabled") &&
        el.getClientRects().length > 0,
    );
    const first = visible[0],
      last = visible.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
    return;
  }
  if (typing || modal || !ready) return;
  if (
    (e.target as HTMLElement).dataset.tab &&
    ["ArrowLeft", "ArrowRight"].includes(e.key)
  ) {
    e.preventDefault();
    const tabs = ["overview", "notes", "history"];
    setTab(
      tabs[(tabs.indexOf(activeTab) + (e.key === "ArrowRight" ? 1 : 2)) % 3],
    );
    $<HTMLButtonElement>(`[data-tab="${activeTab}"]`).focus();
    return;
  }
  if (e.key === "/") {
    if (showcaseVisible()) return;
    e.preventDefault();
    if (mode === "boot") setMode("archive");
    openModal("search");
  }
  if (e.key === "Home" && isGamepadEvent(e) && mode === "archive" && !modal) {
    e.preventDefault();
    openModal("saved");
  }
  if (e.key === "ArrowLeft" && mode !== "boot") {
    e.preventDefault();
    stepColumn(-1);
  }
  if (e.key === "ArrowRight" && mode !== "boot") {
    e.preventDefault();
    stepColumn(1);
  }
  if (["ArrowUp", "ArrowDown"].includes(e.key) && mode !== "boot") {
    e.preventDefault();
    stepFile(e.key === "ArrowUp" ? -1 : 1);
  }
  if (
    e.key === "Enter" &&
    (document.activeElement === document.body ||
      document.activeElement?.id === "detail-content" ||
      ["prev", "next", "column-prev", "column-next"].includes(
        (document.activeElement as HTMLElement)?.dataset.action ?? "",
      ) ||
      (document.activeElement as HTMLElement)?.dataset.select)
  ) {
    e.preventDefault();
    if (mode === "boot") setMode("archive");
    else if (mode === "archive") openFile();
  }
});

const ease = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
function bootFrame(t: number, opening?: { phase: OpeningPhase; time: number; complete: boolean }) {
  if (opening) {
    if (opening.phase === "archive") {
      if (!loading.classList.contains("loaded")) $("#stage").dataset.overlayFadeAt = opening.time.toFixed(3);
      fadeOpeningOverlay();
      updateLightPreview(true);
    }
    if (opening.complete) {
      if(motionActive('detailTransition') && motionActive('surfaceTransitions') && !motionIsReduced()) scene?.beginOpeningHandoff();
      setMode("detail");
      return undefined;
    }
  }
  if (isWallpaper && !scene && frozenTime === null && t >= 21.9) {
    setMode("archive");
    return undefined;
  }
  if (
    isWallpaper &&
    frozenTime === null &&
    t >= ARRAY_OPENING_END &&
    !openingShowsDetail(
      wallpaperHost()?.properties.openingdetail?.value,
      !!workbench?.enabled,
    )
  ) {
    setMode("archive");
    return undefined;
  }
  audio.updateBoot(t, frozenTime !== null || (!isWallpaper && openingTimeline.state.held));
  if(t>=(isWallpaper?25.5:PROJECT_COVER_OPENING_START))scene?.revealProjectDisplay();
  const motion = bootSequence.update(t, opening ? {phase:opening.phase, elapsed:opening.time, lightweight} : undefined);
  if (workbench?.enabled && frozenTime === null) {
    const end = openingShowsDetail(
      wallpaperHost()?.properties.openingdetail?.value,
      true,
    )
      ? 35
      : ARRAY_OPENING_END;
    if (t > end - 0.35)
      $(".powered").style.opacity = String(1 - ease((t - end + 0.35) / 0.35));
  }
  let step: string = motion.step;
  if (t >= 22) {
    step = "array";
  }
  if (t >= 25.68) {
    step = "select";
  }
  if (t >= 28.3) {
    step = "inspect";
  }
  if (step !== lastStep) {
    $("#stage").dataset.boot = step;
    lastStep = step;
  }
  $(".file-title").firstChild!.textContent =
    step === "array"
      ? "SELECTING FILES...".slice(0, Math.max(0, Math.floor((t - 21.94) * 18)))
      : "FILE NUMBER: ";
  $("#stage").style.setProperty(
    "--entry-opacity",
    String(ease((t - 21.9) / 0.13)),
  );
  const callout=archiveCalloutCue(t);
  if(opening)$('#stage').dataset.openingCallout=callout.visible?'visible':'hidden';
  $(".callout-rule").style.transform = `scaleX(${opening?callout.progress:ease((t - 22.08) / 0.9)})`;
  const reveal = ease((t - 22) / 0.4),
    lift = ease((t - 26) / 1.8),
    zoom = 0.55 * ease((t - 27.3) / 1.65) + 0.45 * ease((t - 29.0) / 5.0);
  if (t >= 35) {
    setMode("detail");
    return undefined;
  }
  return { reveal, lift, zoom, time: t };
}

const inspectionOverlay = new InspectionOverlay();
const documentDecryption = new DocumentDecryption();
// A newly opened archive can introduce another font shard. Re-measure its
// redaction lines after font swap while retaining the current reveal progress.
document.fonts.addEventListener("loadingdone", () =>
  documentDecryption.refresh(),
);

let lastTime = 0,
  frameCount = 0,
  frameStart = performance.now(),
  fps = 0;
function frame(ms: number) {
  if (caseIsOpen() && !caseIsApproaching()) {
    lastTime = ms / 1000;
    requestAnimationFrame(frame);
    return;
  }
  if (!wallpaperFrame(ms)) {
    requestAnimationFrame(frame);
    return;
  }
  if (document.hidden) {
    requestAnimationFrame(frame);
    return;
  }
  workbench?.tick();
  const time = ms / 1000;
  const theme = scene?.themeAmount ?? (prefs.colorTheme === "dark" ? 1 : 0);
  paintTheme(theme);
  viewer?.setTheme(theme);
  playground?.tick(time);
  openingStatus.update();
  if (openingStatus.forcedMode) enterLightweightMode();
  if (!isWallpaper || openingStatus.forcedMode) ready = openingStatus.isReady;
  if(!isWallpaper)$("#skip").hidden=mode!=="boot" || !ready;
  const opening = !isWallpaper && mode === "boot" ? openingTimeline.advance(time, ready) : undefined;
  if (opening) {
    const stage = $("#stage");
    stage.dataset.openingPhase = opening.phase;
    stage.dataset.openingTime = opening.time.toFixed(3);
    stage.dataset.openingHeld = String(opening.held);
    stage.dataset.lightweight = String(lightweight);
    loading.dataset.phase = opening.phase;
  }
  const cinema = mode === "boot" && (!isWallpaper || ready)
    ? opening ? bootFrame(opening.referenceTime, opening) : bootFrame(frozenTime ?? time - bootStart)
    : undefined;
  if (opening && openingTrace.at(-1)?.phase !== opening.phase) {
    const label = opening.phase === "archive" ? "ARCHIVE ENTRY"
      : $(opening.phase === "welcome" ? ".welcome-heading" : ".scan > span").textContent ?? "";
    openingTrace.push({phase:opening.phase, time:Number(opening.time.toFixed(3)), label});
    $("#stage").dataset.openingTrace = JSON.stringify(openingTrace);
  }
  wallpaperEffects?.update(
    time,
    motionIsReduced(),
    motionActive("pointerParallax"),
  );
  // The calibrated 2D opening fully covers the scene until array entry.
  if (!viewer?.isOpen && (!cinema || cinema.time >= 21.9))
    scene?.update(time, cinema);
  viewer?.update(time);
  const handoffVisibility=scene?.openingHandoffVisibility;
  const handoffStage=$('#stage');
  if(handoffVisibility!==undefined){
    handoffStage.dataset.openingHandoff='true';
    handoffStage.style.setProperty('--opening-ui-opacity',String(handoffVisibility));
    $('#detail-ui').inert=true;
  }else if(handoffStage.hasAttribute('data-opening-handoff')){
    delete handoffStage.dataset.openingHandoff;
    handoffStage.style.removeProperty('--opening-ui-opacity');
    $('#detail-ui').inert=mode!=='detail'||Boolean(modal);
  }
  if (threeState === "closing" && scene?.presentationHidden) releaseThree();
  playground?.position();
  if (scene && mode === "detail") {
    documentDecryption.update(
      time,
      scene.decryptionFrame,
      !motionActive("documentReveal"),
    );
    $("#detail-content").style.opacity = String(scene.detailVisibility);
    $("#detail-content").style.translate =
      `0 ${(1 - scene.detailVisibility) * 18}px`;
    $("#detail-content").inert = scene.detailVisibility < 0.1;
    if (
      pendingDetailFocus &&
      scene.detailVisibility >= 0.1 &&
      !modal &&
      !viewer?.isOpen
    ) {
      $("#detail-content").focus({ preventScroll: true });
      pendingDetailFocus = false;
    }
  }
  $("#stage").style.setProperty(
    "--detail-shade",
    String(mode === "boot" ? 0 : (scene?.detailVisibility ?? 0)*(handoffVisibility??1)),
  );
  const currentScene = scene;
  if (currentScene)
    inspectionOverlay.render(
      currentScene.decryptionFrame,
      (x, y) => currentScene.projectCard(x, y),
      Boolean(cinema),
      motionActive("modelDecryption") && (isWallpaper || (!cinema && !caseIsOpen())),
    );
  else inspectionOverlay.hide();
  if (Math.floor(time) !== lastTime) {
    lastTime = Math.floor(time);
    updateFooterClock(new Date(), motionActive("rollingNumbers"));
  }
  frameCount++;
  if (ms - frameStart > 1000) {
    fps = (frameCount * 1000) / (ms - frameStart);
    frameStart = ms;
    frameCount = 0;
    $("#three-scene").dataset.fps = String(Math.round(fps));
    $("#three-scene").dataset.renderStats = JSON.stringify(
      scene?.getStats() ?? { loaded: false, drawCalls: 0, triangles: 0 },
    );
  }
  requestAnimationFrame(frame);
}
function bindScene(scene: ArchiveScene, cell?: { lane: number; row: number }) {
  scene.select(selected, cell ? { cell } : undefined);
  scene.onSelect = (i, cell) => {
    if (mode !== "archive" || modal || viewer?.isOpen) return;
    select(i, cell ? { cell } : undefined);
  };
  scene.onActivate = isWallpaper ? undefined : (i, cell) => {
    if (mode !== "archive" || modal || viewer?.isOpen) return;
    select(i, cell ? { cell } : undefined);
    openFile();
  };
  scene.onNavigate = (axis, direction) => {
    if (mode !== "archive" || modal || viewer?.isOpen) return;
    if (axis === "lane") stepColumn(direction);
    else stepFile(direction);
  };
  scene.onHover = (i) => {
    if(!isWallpaper){$("#hover-label").hidden=true;return;}
    const label = $("#hover-label");
    if (i === null) {
      label.hidden = true;
      hoverCode.finish();
      hoverTitle.finish();
      return;
    }
    const animated = motionActive("rollingText") && mode === "archive";
    const numbersAnimated =
      motionActive("rollingNumbers") && mode === "archive";
    hoverCode.update({
      value: Number(records[i].id.slice(2)),
      animated: !label.hidden && numbersAnimated,
    });
    hoverTitle.update({
      text: records[i].title,
      animated: !label.hidden && animated,
    });
    label.hidden = false;
    // Prepare the first visible value so the next hover can animate immediately.
    hoverCode.update({ animated: numbersAnimated });
    hoverTitle.update({ animated });
  };
}
function syncThreeButton() {
  $("#stage").dataset.threeState = threeState;
  syncWallpaperBackground();
  const button = document.querySelector<HTMLButtonElement>(
    '[data-action="toggle-three"]',
  );
  if (!button) return;
  button.textContent =
    threeState === "loading"
      ? "3D 载入中…"
      : threeState === "closing"
        ? "3D 关闭中…"
        : threeState === "off"
          ? "3D 关闭"
          : "3D 开启";
  button.disabled = threeState === "loading";
  button.setAttribute("aria-pressed", String(threeState === "on"));
  button.title =
    threeState === "off"
      ? "重新载入三维模型"
      : threeState === "closing"
        ? "取消关闭，恢复三维画面"
        : "卸载三维模型，保留 2D 界面";
}
function releaseThree() {
  if (!scene) return;
  resumeCell = { ...scene.getStats().selectedCell };
  resumeSelection = selected;
  viewer?.dispose();
  viewer = undefined;
  scene.dispose();
  scene = undefined;
  if (mode === "detail") {
    $("#detail-content").style.opacity = "1";
    $("#detail-content").style.translate = "0 0";
    $("#detail-content").inert = false;
    documentDecryption.reset($("#detail-content"), true);
  }
  threeState = "off";
  syncThreeButton();
  $("#hover-label").hidden = true;
  delete $("#three-scene").dataset.renderQuality;
  updateQualitySummary();
}
async function toggleThree() {
  if (!isWallpaper || !ready || threeState === "loading") return;
  if (threeState === "closing") {
    scene?.setPresentationVisible(true, !motionActive("surfaceTransitions"));
    threeState = "on";
    syncThreeButton();
    return;
  }
  if (scene) {
    playground?.stop();
    threeState = "closing";
    syncThreeButton();
    scene.setPresentationVisible(false, !motionActive("surfaceTransitions"));
    if (!motionActive("surfaceTransitions")) releaseThree();
    return;
  }
  threeState = "loading";
  syncThreeButton();
  let next: ArchiveScene | undefined;
  try {
    next = new ArchiveScene($("#three-scene"));
    next.renderer.domElement.style.opacity = "0";
    next.setPresentationVisible(false, true);
    await next.load();
    next.setMode(mode === "detail" ? "detail" : "archive");
    bindScene(next, resumeSelection === selected ? resumeCell : undefined);
    next.revealImmediately();
    scene = next;
    scene.setTheme(prefs.colorTheme === "dark", true);
    scene.setArchiveCoverage(
      wallpaperHost()?.properties.archivecoverage?.value === "extra",
    );
    savePrefs();
    scene.setPresentationVisible(true, !motionActive("surfaceTransitions"));
    threeState = "on";
    syncThreeButton();
  } catch (error) {
    next?.dispose();
    scene = undefined;
    threeState = "off";
    syncThreeButton();
    notify("三维模型载入失败，请点击 3D 关闭重试。");
    console.error(error);
  }
}

async function start() {
  if (isWallpaper) await window.rhineWallpaperPropertiesReady;
  if (!isWallpaper) completeStartup(false);
  let candidate: ArchiveScene | undefined;
  const archive = (async () => {
    try {
      if (!isWallpaper || wallpaperHost()?.properties.load3donstartup?.value !== false) {
        candidate = new ArchiveScene($("#three-scene"));
        scene = candidate;
        candidate.setTheme(prefs.colorTheme === "dark", true);
        candidate.setArchiveCoverage(wallpaperHost()?.properties.archivecoverage?.value === "extra");
        await candidate.load();
        if (!lightweight) {
          bindScene(candidate);
          candidate.setMode(mode === "boot" ? "hidden" : mode);
          candidate.setProjectDisplay(records[selected].projectId, mode !== "boot");
          // Keep GPU program compilation inside the archive resource group.
          await candidate.prepareShaders();
        }
      } else threeState = "off";
      cachedOpeningGroups.set("archive", "loaded");
      openingStatus.complete("archive");
    } catch (error) {
      console.error(error);
      if (scene === candidate) scene = undefined;
      cachedOpeningGroups.set("archive", "failed"); openingStatus.fail("archive");
    } finally {
      archiveSettled = true;
      if (lightweight || cachedOpeningGroups.get("archive") === "failed") candidate?.dispose();
    }
  })();
  const fonts = Promise.all([
    loadBootWebfonts(),
    document.fonts.load("300 20px MiSans", "LOADING ARCHIVE PERMISSION AUTHORIZED WELCOME, PROFESSOR LIGHTWEIGHT MODE"),
    document.fonts.load("400 20px MiSans", "三维档案开屏字体资源已就绪项正在准备载入加载失败可先进入轻量模式选择等待秒0123456789 albert_z0413@hotmail.com"),
    document.fonts.load("600 20px MiSans", "INDEPENDENT PRODUCT DESIGN ANALYSIS OS"),
    document.fonts.load("700 20px MiSans", "albert_z0413@hotmail.com WELCOME, PROFESSOR DESIGN ARCHIVE"),
  ]).then(() => {
    cachedOpeningGroups.set("fonts", "loaded"); openingStatus.complete("fonts");
  }).catch(error => {
    console.error(error); cachedOpeningGroups.set("fonts", "failed"); openingStatus.fail("fonts");
  });
  await Promise.all([archive, fonts]);
  ready = openingStatus.isReady;
  savePrefs();
  if (isWallpaper) completeStartup(false);
}
function completeStartup(silent: boolean) {
  if (started) return;
  started = true;
  if (silent) { prefs.sound = false; prefs.music = false; saveAudioPrefs(); }
  audio.releaseEntry();
  beginOpening();
  $("#stage").inert = false;
  $(".mobile-entry").inert = false;
  if (isWallpaper && (!motionActive("boot") || wallpaperHost()?.properties.boot?.value === false)) setMode("archive");
  requestAnimationFrame(frame);
}

updateSelection();
const customBackground = isWallpaper
  ? new WallpaperBackground($("#stage"), notify)
  : undefined;
function syncWallpaperBackground(retry = false) {
  customBackground?.update(
    wallpaperHost()?.properties ?? {},
    mode !== "boot" && (threeState === "off" || threeState === "loading"),
    !motionActive("surfaceTransitions"),
    retry,
  );
}
if (isWallpaper) {
  const apply = (properties: WallpaperProperties) => {
    const theme = properties.colortheme?.value;
    if (theme === "light" || theme === "dark") prefs.colorTheme = theme;
    scene?.setArchiveCoverage(
      properties.archivecoverage?.value === "extra" ||
        wallpaperHost()?.properties.archivecoverage?.value === "extra",
    );
    for (const key of ["sound", "music"] as const)
      if (typeof properties[key]?.value === "boolean")
        prefs[key] = properties[key].value as boolean;
    if (typeof properties.reduced?.value === "boolean") {
      prefs.motion = properties.reduced.value ? reducedMotion() : fullMotion();
      prefs.motionPreset = motionPresetFor(prefs.motion);
    }
    for (const key of ["soundVolume", "musicVolume"] as const) {
      const value = properties[key.toLowerCase()]?.value;
      if (typeof value === "number" && Number.isFinite(value))
        prefs[key] = Math.max(0, Math.min(1, value / 100));
    }
    const qualityProperties = { ...wallpaperHost()?.properties, ...properties };
    if (
      Object.keys(properties).some(
        (key) => key === "renderquality" || key.startsWith("quality"),
      )
    )
      prefs.rendering = wallpaperQuality(qualityProperties, prefs.rendering);
    savePrefs();
    if (
      properties.customwallpaperfile ||
      properties.customwallpaper?.value === true
    )
      syncWallpaperBackground(true);
    if (properties.boot?.value === false && started && mode === "boot")
      setMode("archive");
    // Keep an already-open settings surface in sync without replacing focused controls.
    document
      .querySelectorAll<HTMLInputElement>("[data-pref]")
      .forEach((input) => {
        const key = input.dataset.pref as
          "sound" | "music" | "quality" | "superPerformance";
        if (key in prefs) input.checked = prefs[key];
      });
    document
      .querySelectorAll<HTMLInputElement>("[data-motion]")
      .forEach((input) => {
        input.checked = prefs.motion[input.dataset.motion as MotionKey];
      });
    document
      .querySelectorAll<HTMLElement>('[data-action="motion-preset"]')
      .forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.preset === prefs.motionPreset),
        );
      });
    const note = document.querySelector("#motion-preference-note");
    if (note) note.outerHTML = motionPreferenceNoteMarkup();
    for (const key of ["soundVolume", "musicVolume"] as const) {
      const input = document.querySelector<HTMLInputElement>(
        `[data-volume="${key}"]`,
      );
      if (input) {
        input.value = String(Math.round(prefs[key] * 100));
        input
          .closest("label")
          ?.querySelector("output")
          ?.replaceChildren(`${input.value}%`);
      }
    }
  };
  window.addEventListener("rhine-wallpaper-properties", (event) =>
    apply((event as CustomEvent<WallpaperProperties>).detail),
  );
  let pausedAt: number | undefined;
  const pause = () => {
    const paused = wallpaperHost()?.paused ?? false;
    if (paused && pausedAt === undefined) pausedAt = performance.now();
    if (!paused && pausedAt !== undefined) {
      if (started && mode === "boot")
        bootStart += (performance.now() - pausedAt) / 1000;
      pausedAt = undefined;
    }
    audio.setHostPaused(paused);
  };
  window.addEventListener("rhine-wallpaper-pause", pause);
  apply(wallpaperHost()?.properties ?? {});
  pause();
}
if (isWallpaper) {
  workbench = new Workbench(
    $("#stage"),
    () => {
      if (ready && mode !== "boot") setMode("archive");
    },
    (lane) => {
      if (ready && !modal) select(columnMemory[lane]);
    },
  );
  workbench.setMotion(prefs.motion);
  playground = new ArchivePlayground(
    $("#stage"),
    () => scene,
    () => ({
      enabled: !!workbench?.enabled && mode === "archive" && ready,
      paused:
        Boolean(modal) ||
        modalClosing ||
        Boolean(wallpaperHost()?.paused) ||
        document.hidden,
      reduced: motionIsReduced(),
    }),
    (value) => {
      musicSuppressed = value;
      configureAudio();
    },
    () => audio.play("tick"),
  );
  wallpaperEffects = new WallpaperEffects($("#stage"), () => scene);
  document.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-workbench-mode]",
    );
    if (button)
      closeModal(() => {
        workbench!.setEnabled(button.dataset.workbenchMode === "workbench");
      });
  });
}
void start();
enableGamepad();
const ARCHIVE_HINT: Record<"keyboard" | "gamepad", string> = {
  keyboard: `<kbd>←</kbd> <kbd>→</kbd> 切换列 <span>／</span> <kbd>↑</kbd> <kbd>↓</kbd> 前后档案 <span>／</span> <kbd>ENTER</kbd> 读取`,
  gamepad: `<kbd>LS</kbd> <kbd>DP</kbd> 切换列 / 前后档案 <span>／</span> <kbd>A</kbd> 读取`,
};
onInputDevice((device) => {
  const hint = document.querySelector(".archive-hint");
  if (hint) hint.innerHTML = ARCHIVE_HINT[device];
});
// Deterministic review controls: the running application, never a video surrogate.
Object.assign(window, {
  rhine: {
    // The review button supplies a real user activation. Preferences stay local to this preview.
    playBootPreview: async (music = false) => {
      if (!isWallpaper) return false;
      if (!ready || !navigator.userActivation.isActive) return false;
      const request = ++audioPreviewRequest;
      audioPreview = true;
      audio.configure({ ...prefs, sound: true, music });
      const unlocked = await audio.unlock();
      if (request !== audioPreviewRequest) return false;
      if (!unlocked) {
        audioPreview = false;
        configureAudio();
        return false;
      }
      replayBoot(true);
      return true;
    },
    seek: (t: number) => {
      setMode("boot");
      bootStart = performance.now() / 1000 - t;
      lastStep = "";
    },
    archive: () => setMode("archive"),
    detail: () => openFile(),
    select: (i: number) => select(i),
    stats: () => ({
      ...scene?.getStats(),
      threeState,
      fps: Math.round(fps),
      mode,
      ready,
      startup: started ? "started" : "loading",
      opening: openingTimeline.state,
      lightweight,
      motion: { reduced: motionIsReduced(), preset: prefs.motionPreset },
      bootTime: mode === "boot" ? isWallpaper ? (frozenTime ?? performance.now()/1000 - bootStart) + 5 : openingTimeline.state.time : null,
      selected: records[selected].id,
      saved: [...saved],
      audio: audio.stats(),
      wallpaper: isWallpaper ? wallpaperHost() : null,
    }),
  },
});
if (import.meta.hot) import.meta.hot.dispose(() => audio.dispose());
