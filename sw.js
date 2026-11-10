/* The build replaces both tokens; this file is never registered in development. */
const VERSION = "ad78af3bba1fbde9";
const FILES = ["archives/RHINE-LAB-X-001.txt","archives/RHINE-LAB-X-002.txt","archives/RHINE-LAB-X-003.txt","archives/RHINE-LAB-X-004.txt","archives/RHINE-LAB-X-005.txt","archives/RHINE-LAB-X-006.txt","archives/RHINE-LAB-X-007.txt","archives/RHINE-LAB-X-008.txt","archives/RHINE-LAB-X-009.txt","archives/RHINE-LAB-X-010.txt","assets/archive-assembly.d411170676f55a32.glb","assets/archive-cassette.94fc471418156825.glb","assets/boot-lettering-notice.txt","assets/index-B2io0Bgh.js","assets/index-Ci4XsJQZ.css","audio/atmosphere.ogg","audio/motif.ogg","audio/pulse.ogg","cases/erste001/assets/erste001-hero-front-right-v01.webp","cases/erste001/assets/opt/assets/mouse/bottom-shell-cad-1440.avif","cases/erste001/assets/opt/assets/mouse/bottom-shell-cad-1920.avif","cases/erste001/assets/opt/assets/mouse/bottom-shell-cad-480.avif","cases/erste001/assets/opt/assets/mouse/bottom-shell-cad-960.avif","cases/erste001/assets/opt/assets/mouse/explosive-view-1440.avif","cases/erste001/assets/opt/assets/mouse/explosive-view-480.avif","cases/erste001/assets/opt/assets/mouse/explosive-view-960.avif","cases/erste001/assets/opt/assets/mouse/hero-1-1440.avif","cases/erste001/assets/opt/assets/mouse/hero-1-1920.avif","cases/erste001/assets/opt/assets/mouse/hero-1-480.avif","cases/erste001/assets/opt/assets/mouse/hero-1-960.avif","cases/erste001/assets/opt/assets/mouse/internal-constraint-1440.avif","cases/erste001/assets/opt/assets/mouse/internal-constraint-480.avif","cases/erste001/assets/opt/assets/mouse/internal-constraint-960.avif","cases/erste001/assets/opt/assets/mouse/sensor-spine-cad-1440.avif","cases/erste001/assets/opt/assets/mouse/sensor-spine-cad-480.avif","cases/erste001/assets/opt/assets/mouse/sensor-spine-cad-960.avif","cases/erste001/assets/opt/assets/mouse/side1-1440.avif","cases/erste001/assets/opt/assets/mouse/side1-480.avif","cases/erste001/assets/opt/assets/mouse/side1-960.avif","cases/erste001/assets/opt/assets/mouse/upper1-1440.avif","cases/erste001/assets/opt/assets/mouse/upper1-480.avif","cases/erste001/assets/opt/assets/mouse/upper1-960.avif","cases/erste001/assets/opt/mouse/prototype_01_hero_4x3-1440.avif","cases/erste001/assets/opt/mouse/prototype_01_hero_4x3-1920.avif","cases/erste001/assets/opt/mouse/prototype_01_hero_4x3-480.avif","cases/erste001/assets/opt/mouse/prototype_01_hero_4x3-960.avif","cases/erste001/assets/opt/mouse/prototype_02_internal_4x3-1440.avif","cases/erste001/assets/opt/mouse/prototype_02_internal_4x3-1920.avif","cases/erste001/assets/opt/mouse/prototype_02_internal_4x3-480.avif","cases/erste001/assets/opt/mouse/prototype_02_internal_4x3-960.avif","cases/erste001/case.css","cases/erste001/case.js","cases/erste001/index.html","cases/erste002/assembly-finish.js","cases/erste002/assembly.html","cases/erste002/assets/erste002-hero-front-left-v01.webp","cases/erste002/assets/erste002-hero-front-right-v01.webp","cases/erste002/assets/shell-full.a7c8796cd5aec04d.glb.bin","cases/erste002/index.html","cases/erste002/model-load.js","cases/erste002/section-contours.js","cases/erste002/story-app.js","cases/erste002/story-assembly.js","cases/erste002/story-editor.js","cases/erste002/story-lighting.js","cases/erste002/story-section.js","cases/erste002/story-segments.js","cases/erste002/story-timeline.js","cases/erste002/story.css","cases/erste002/story.json","cases/erste002/studio-environment.js","cases/erste002/surface-normals.js","cases/erste002/vendor/addons/controls/OrbitControls.js","cases/erste002/vendor/addons/environments/RoomEnvironment.js","cases/erste002/vendor/addons/loaders/DRACOLoader.js","cases/erste002/vendor/addons/loaders/GLTFLoader.js","cases/erste002/vendor/addons/utils/BufferGeometryUtils.js","cases/erste002/vendor/addons/utils/SkeletonUtils.js","cases/erste002/vendor/draco/draco_decoder.js","cases/erste002/vendor/draco/draco_wasm_wrapper.js","cases/erste002/vendor/three.core.min.js","cases/erste002/vendor/three.module.min.js","cases/erste002/viewer.js","cases/shared/render-frame.js","favicon.svg","fonts/MiSans-license.pdf","fonts/NOTICE.txt","fonts/misans-webfont-4.3.1/UPSTREAM-README.md","fonts/misans-webfont-4.3.1/bold/upstream.css.txt","fonts/misans-webfont-4.3.1/demibold/upstream.css.txt","fonts/misans-webfont-4.3.1/light/upstream.css.txt","fonts/misans-webfont-4.3.1/regular/upstream.css.txt","fonts/misans-webfont-4.3.1/source.json","icons/app-icon.svg","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","licenses/rolling-number.txt","manifest.webmanifest"];
const PREFIX = `rhine-lab:${new URL(self.registration.scope).pathname}:`;
const CACHE = PREFIX + VERSION;
// MiSans ships 753 unicode-range shards (23 MB). They are cached the first time
// a page actually asks for one, never during install.
const FONT_CACHE = PREFIX + "fonts";
const urls = FILES.map(path => new URL(path, self.registration.scope).href);
const allowed = new Set(urls);
const index = new URL("index.html", self.registration.scope).href;
const rawCaseModel = new URL("cases/erste002/assets/shell-full.glb", self.registration.scope).href;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      // Limit connections so a complete font family does not flood the page.
      // Keep successful files private until every resource is present; failure
      // still deletes this entire release and leaves the active release intact.
      let next = 0;
      const workers = Array.from({ length: 6 }, async () => {
        while (next < urls.length) {
          const url = urls[next++];
          const immutable = /\/fonts\/misans-webfont-4\.3\.1\//.test(url) || /\/assets\/(?:archive-(cassette|assembly)\.[a-f0-9]{16}\.glb|shell-full\.[a-f0-9]{16}\.glb\.bin)$/.test(url);
          if (url === index) {
            // Pages redirects index.html to the directory URL. Keep the release's
            // cache key, but fetch the canonical page without a followed redirect.
            const response = await fetch(new Request(self.registration.scope, { cache: "no-cache" }));
            if (!response.ok) throw new Error(`Homepage download failed: ${response.status}`);
            await cache.put(url, response);
          } else {
            await cache.add(new Request(url, { cache: immutable ? "default" : "no-cache" }));
          }
        }
      });
      const results = await Promise.allSettled(workers);
      const failure = results.find(result => result.status === "rejected");
      if (failure) throw failure.reason;
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys())
      if (key.startsWith(PREFIX) && key !== CACHE && key !== FONT_CACHE)
        await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "RHINE_APPLY_UPDATE") event.waitUntil(self.skipWaiting());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (/\/fonts\/.*\.woff2$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })());
    return;
  }
  url.search = "";
  url.hash = "";
  const navigation = event.request.mode === "navigate" &&
    (url.href === self.registration.scope || url.href === index);
  const key = navigation ? index : url.href;
  if (key === rawCaseModel && !allowed.has(key)) {
    // Older browsers request the raw GLB. Store it only if it is used.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(key);
      if (hit) return hit;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    })());
    return;
  }
  if (!allowed.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // HTML, hashed bundles and stable model URLs come from the same release.
    // A new release stays waiting until the user chooses to restart or exits.
    const cached = await cache.match(key);
    // A navigation uses redirect: manual and cannot consume a response whose
    // URL list contains a followed redirect (including older cached releases).
    if (navigation && cached?.redirected) {
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
      });
    }
    return cached ?? fetch(event.request);
  })());
});
