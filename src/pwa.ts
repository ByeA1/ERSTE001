import { assetUrl } from "./asset-url";
import { isWallpaper } from "./wallpaper";
import { t } from "./terminal-language";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let installPrompt: InstallPrompt | undefined;
let registration: ServiceWorkerRegistration | undefined;
let ready = false, failed = false, reloading = false, started = false;
let registrationRequest: Promise<ServiceWorkerRegistration> | undefined;
let checkingTask: Promise<void> | undefined;
let checking = false, lastAttempt = 0, lastChecked = 0;
let updateError: 'offline' | 'failed' | '' = '';
let updateTimer = 0, applyTimer = 0, reloadIssued = false;
const UPDATE_INTERVAL = 15 * 60 * 1000;
const FOREGROUND_INTERVAL = 60 * 1000;
const updatesSupported = () => !isWallpaper && import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator;
let tell: (message: string) => void = () => {};
const installed = () => matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event as InstallPrompt;
  refresh();
});
window.addEventListener("appinstalled", () => { installPrompt = undefined; refresh(); });
matchMedia("(display-mode: standalone)").addEventListener("change", refresh);

export function pwaSettingsMarkup() {
  if (isWallpaper) return "";
  const status = !import.meta.env.PROD ? t("开发预览不保存离线副本。", "Offline copies are disabled in development previews.")
    : !window.isSecureContext ? t("使用 HTTPS 地址后可保存离线副本。", "Use HTTPS to save an offline copy.")
    : !("serviceWorker" in navigator) ? t("当前浏览器支持在线使用。", "This browser can use the site online.")
    : failed ? t("离线副本未能保存，可联网后重试。", "The offline copy could not be saved. Reconnect and retry.")
    : ready ? t("基础离线资源已就绪。大型模型与案例图片按访问保存。", "Core offline resources are ready. Large models and case images are saved as you visit.")
    : t("正在准备离线资源，首次需要保持联网。", "Preparing offline resources. Stay connected during the first visit.");
  const guidance = installed() ? t("已从主屏幕打开。", "Opened from the home screen.")
    : ios() ? t("在 Safari 中轻点“分享”→“添加到主屏幕”，然后从主屏幕图标打开。", "In Safari, choose Share, then Add to Home Screen. Open the site from its home screen icon.")
    : installPrompt ? t("安装后可在独立窗口中打开档案。", "Install to open the archive in its own window.")
    : t("可通过浏览器菜单安装或添加到主屏幕。", "Use the browser menu to install or add to your home screen.");
  const busy = checking || reloading || Boolean(registration?.installing);
  return `<section id="pwa-settings" class="pwa-settings" aria-label="${t('主屏幕与网站更新','Home screen and site updates')}"><h3>${t('APP / 主屏幕与离线','APP / HOME SCREEN & OFFLINE')}</h3><p>${guidance}</p><p class="pwa-status" role="status">${status}</p><h3>${t('UPDATE / 网站更新','UPDATE / SITE UPDATES')}</h3><p class="pwa-update-status" role="status" aria-live="polite">${updateStatus()}</p><div class="pwa-actions"><button data-pwa-action="check" ${!updatesSupported() || busy ? 'disabled' : ''} aria-busy="${checking}">${checking ? t('正在检查…','Checking…') : t('检查更新 ↻','Check for updates ↻')}</button>${registration?.waiting ? `<button data-pwa-action="update" ${reloading ? 'disabled' : ''}>${reloading ? t('正在更新…','Updating…') : t('更新并重新载入 ↻','Update and reload ↻')}</button>` : ''}${installPrompt && !installed() ? `<button data-pwa-action="install">${t('安装到设备 ↗','Install on device ↗')}</button>` : ""}${failed ? `<button data-pwa-action="retry">${t('重试保存离线资源 ↻','Retry offline setup ↻')}</button>` : ""}</div></section>`;
}
function refresh() {
  const current = document.querySelector("#pwa-settings");
  if (current) current.outerHTML = pwaSettingsMarkup();
  document.documentElement.dataset.offlineReady = String(ready);
  const notice = document.querySelector<HTMLElement>("#pwa-update-notice");
  const waiting = Boolean(registration?.waiting);
  if (notice) {
    notice.hidden = !waiting;
    notice.querySelector('span')!.textContent = updateError ? updateStatus() : t('新版本已就绪', 'A new version is ready');
    const button = notice.querySelector<HTMLButtonElement>('button')!;
    button.textContent = reloading ? t('正在更新…','Updating…') : t('更新并重新载入 ↻', 'Update and reload ↻');
    button.disabled = reloading;
  }
  const stage = document.querySelector<HTMLElement>("#stage");
  if (stage) stage.dataset.pwaUpdate = String(waiting);
}

function updateStatus() {
  if (!updatesSupported()) return !import.meta.env.PROD
    ? t('开发预览不检查线上更新，请使用构建预览或正式网站。', 'Use a production preview or the published site to check for updates.')
    : t('当前环境无法检查更新，可重新打开网站获取新版。', 'Update checks are unavailable here. Reopen the site to get the latest version.');
  if (reloading) return t('正在切换到已准备好的新版本…', 'Switching to the prepared version…');
  if (checking) return t('正在检查网站更新…', 'Checking for site updates…');
  if (updateError) return updateError === 'offline'
    ? t('当前处于离线状态，联网后会自动重试。', 'You are offline. Checks resume when you reconnect.')
    : t('更新检查或安装未完成，可稍后重试。当前版本仍可使用。', 'The update check or installation did not complete. Retry later. The current version remains available.');
  if (registration?.waiting) return t('新版本已准备好，点击更新后重新载入。', 'A new version is ready. Select Update and reload to apply it.');
  if (registration?.installing) return registration.active
    ? t('正在准备新版本，完成后会显示更新按钮。', 'Preparing a new version. The update button appears when it is ready.')
    : t('正在准备初始版本。', 'Preparing the initial version.');
  if (lastChecked) return t('已是最新版本。最近检查 ', 'You are up to date. Last checked ')
    + new Date(lastChecked).toLocaleTimeString(document.documentElement.lang, {hour: '2-digit', minute: '2-digit'});
  return t('进入网站、回到前台和联网时自动检查；使用期间每 15 分钟复查。', 'Checks run on entry, when you return or reconnect, and every 15 minutes while the site is visible.');
}

function scheduleUpdateCheck() {
  clearTimeout(updateTimer);
  if (!registration || document.hidden || !navigator.onLine || reloading) return;
  updateTimer = window.setTimeout(() => void checkForUpdates(false), UPDATE_INTERVAL);
}

export function checkForUpdates(manual = true): Promise<void> {
  if (checkingTask) return checkingTask;
  if (!updatesSupported()) { refresh(); return Promise.resolve(); }
  const restoreFocus = manual && (document.activeElement as HTMLElement)?.dataset.pwaAction === 'check';
  checkingTask = (async () => {
    checking = true;
    updateError = '';
    lastAttempt = Date.now();
    refresh();
    try {
      if (!navigator.onLine) { updateError = 'offline'; return; }
      if (!registration) {
        await initPwa(tell);
        if (!registration && registrationRequest) registration = await registrationRequest;
      }
      if (!registration) throw new Error('No registration');
      if (!registration.waiting && !registration.installing) await registration.update();
      lastChecked = Date.now();
    } catch { updateError = navigator.onLine ? 'failed' : 'offline'; }
  })().finally(() => {
    checking = false;
    checkingTask = undefined;
    refresh();
    scheduleUpdateCheck();
    if (restoreFocus && document.activeElement === document.body)
      document.querySelector<HTMLButtonElement>('[data-pwa-action=check]:not(:disabled)')?.focus({preventScroll: true});
  });
  return checkingTask;
}

function foregroundUpdateCheck() {
  if (!registration || document.hidden) return;
  if (navigator.onLine && Date.now() - lastAttempt >= FOREGROUND_INTERVAL) void checkForUpdates(false);
  else scheduleUpdateCheck();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearTimeout(updateTimer);
  else foregroundUpdateCheck();
});
window.addEventListener('focus', foregroundUpdateCheck);
window.addEventListener('online', () => { if (registration && !document.hidden) void checkForUpdates(false); });
window.addEventListener('offline', () => { clearTimeout(updateTimer); updateError = 'offline'; refresh(); });
window.addEventListener('pagehide', () => clearTimeout(updateTimer));
window.addEventListener('pageshow', foregroundUpdateCheck);
window.addEventListener('design-terminal:language', refresh);

export async function initPwa(notify: (message: string) => void) {
  if (isWallpaper) return;
  tell = notify;
  if (started || !import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) return;
  started = true;
  try {
    registrationRequest = navigator.serviceWorker.register(assetUrl("sw.js"), {
      scope: import.meta.env.BASE_URL, updateViaCache: "none",
    });
    registration = await registrationRequest;
    const watch = () => {
      const worker = registration?.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          failed = false;
          updateError = '';
          setTimeout(refresh, 0);
        } else if (worker.state === "redundant") {
          if (!registration?.active) failed = true;
          updateError = navigator.onLine ? 'failed' : 'offline';
          refresh();
        }
      });
    };
    registration.addEventListener("updatefound", watch);
    watch();
    refresh();
    void navigator.serviceWorker.ready.then(() => { ready = true; failed = false; refresh(); });
    void checkForUpdates(false);
  } catch { failed = true; started = false; }

  refresh();
}

if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (reloading && !reloadIssued) {
    reloadIssued = true;
    clearTimeout(applyTimer);
    location.reload();
  } else refresh();
});
document.addEventListener("click", async event => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-pwa-action]");
  if (!button) return;
  if (button.disabled) return;
  if (button.dataset.pwaAction === "check") { await checkForUpdates(); return; }
  if (button.dataset.pwaAction === "install" && installPrompt) {
    const prompt = installPrompt; installPrompt = undefined;
    try { await prompt.prompt(); await prompt.userChoice; } catch { tell("请通过浏览器菜单添加到主屏幕"); }
    refresh();
  }
  if (button.dataset.pwaAction === "update" && registration?.waiting) {
    reloading = true;
    updateError = '';
    refresh();
    try {
      registration.waiting.postMessage({ type: "RHINE_APPLY_UPDATE" });
      clearTimeout(applyTimer);
      applyTimer = window.setTimeout(() => {
        reloading = false;
        updateError = 'failed';
        refresh();
      }, 12_000);
    } catch {
      reloading = false;
      updateError = 'failed';
      refresh();
    }
  }
  if (button.dataset.pwaAction === "retry") {
    failed = false;
    refresh();
    if (registration) {
      try { await registration.update(); } catch { failed = true; refresh(); }
    } else { started = false; void initPwa(tell); }
  }
});
