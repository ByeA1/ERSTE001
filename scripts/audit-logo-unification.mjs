import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createHash } from "node:crypto";
import ts from "typescript";
import vm from "node:vm";

const require = createRequire(
  path.resolve(".audit/model-logo/tools/package.json"),
);
const { chromium } = require("playwright");
const out = path.resolve(".audit/logo-unification");
await fs.mkdir(out + "/screenshots", { recursive: true });
const before = JSON.parse(
  await fs.readFile(out + "/before.json", "utf8").catch(() => "null"),
);
const protectedPaths = [
  "public/assets/archive-cassette.glb",
  "public/assets/archive-assembly.glb",
  ".audit/model-logo/models/draco-18.glb",
  "src/boot-logo-tracks.ts",
  "src/opening-timeline.ts",
  "src/boot-motion.ts",
  "scripts/pwa-worker.js",
];
for (const file of before ? protectedPaths : [])
  assert.equal(
    createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex"),
    before[file],
    `Protected asset/timeline changed: ${file}`,
  );
let approvedVisualMatch = null;
if (before) {
  const original = await fs.readFile(out + "/before/src/rhine-logo.ts", "utf8");
  const current = await fs.readFile("src/rhine-logo.ts", "utf8");
  const svg = (source) =>
    source.match(/export const loopingMarkSvg\s*=\s*(`[^`]+`)/)[1];
  assert.equal(
    svg(current),
    svg(original),
    "Approved SVG must not be redesigned",
  );
  const sample = (source) => {
    const ast = ts.createSourceFile(
      "logo.ts",
      source,
      ts.ScriptTarget.ES2022,
      true,
    );
    const fn = ast.statements.find(
      (node) =>
        ts.isFunctionDeclaration(node) && node.name?.text === "logoSample",
    );
    const code = ts.transpileModule(fn.getText(ast), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const sandbox = { exports: {}, bootLogoTrack: (frame) => ({ frame }) };
    vm.runInNewContext(code, sandbox);
    return sandbox.exports.logoSample;
  };
  const a = sample(original),
    b = sample(current);
  for (let i = -2048; i <= 6144; i++)
    assert.equal(JSON.stringify(a(i / 2048)), JSON.stringify(b(i / 2048)));
  approvedVisualMatch = true;
}
const compressed = await fs.stat(".audit/model-logo/models/draco-18.glb").then(
  () => true,
  () => false,
);
const resultFile =
  out + (process.argv.includes("--quick") ? "/quick.json" : "/browser.json");
const report = {
  date: new Date().toISOString(),
  protectedPaths: before ? protectedPaths : [],
  approvedVisualMatch,
  checks: [],
  errors: [],
};
const fixture = {
  id: "future-public-services",
  number: "099",
  title: "FUTURE099",
  page: "/cases/_template/index.html",
  shortcut: true,
  summary: "Public-service fixture, not a real portfolio entry.",
};
const server = await createServer({
  logLevel: "error",
  plugins: [
    {
      name: "unknown-project-fixture",
      enforce: "pre",
      async load(id) {
        if (
          id.replaceAll("\\", "/") !==
          path.resolve("content/projects.json").replaceAll("\\", "/")
        )
          return;
        const registry = JSON.parse(
          await fs.readFile("content/projects.json", "utf8"),
        );
        return JSON.stringify({
          ...registry,
          projects: [...registry.projects, fixture],
        });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 4182, strictPort: true },
});
await server.listen();
const base = "http://127.0.0.1:4182";
const logo = (svg) => ({
  mode: svg.dataset.logoMode,
  contour: svg.querySelector(".rhine-logo__wire")?.getAttribute("d"),
  animations: svg.getAnimations({ subtree: true }).map((a) => ({
    state: a.playState,
    duration: a.effect.getTiming().duration,
  })),
});
try {
  for (const [name, executablePath] of [
    ["Chrome", "C:/Program Files/Google/Chrome/Application/chrome.exe"],
    ["Edge", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"],
  ]) {
    if (process.argv.includes("--quick") && name !== "Chrome") continue;
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      for (const mobile of [false, true]) {
        if (process.argv.includes("--quick") && mobile) continue;
        const key = `${name}-${mobile ? "mobile" : "desktop"}`;
        const context = await browser.newContext({
          viewport: mobile
            ? { width: 390, height: 844 }
            : { width: 1440, height: 1000 },
          deviceScaleFactor: mobile ? 2 : 1,
          isMobile: mobile,
          hasTouch: mobile,
        });
        await context.addInitScript(() => {
          window.__auditRafTicks = 0;
          const request = window.requestAnimationFrame.bind(window);
          window.requestAnimationFrame = (callback) =>
            request((now) => {
              window.__auditRafTicks++;
              callback(now);
            });
        });
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(m.text());
        });
        try {
          await page.goto(
            base + (compressed ? "/?cassetteReview=draco-18" : "/"),
          );
          await page.waitForFunction(
            () => window.rhine?.stats().ready,
            {},
            { timeout: 90000 },
          );
          await page.waitForFunction(
            () =>
              document.querySelector("#stage").dataset.openingPhase ===
              "welcome",
          );
          await page.waitForFunction(() =>
            document
              .querySelector(".welcome-logo svg")
              .getAnimations({ subtree: true })
              .some((a) => a.playState === "running"),
          );
          const welcome = await page
            .locator(".welcome-logo svg")
            .evaluate(logo);
          assert.equal(welcome.animations.length, 3);
          assert.ok(welcome.animations.every((a) => a.duration === 6400));
          await page.evaluate(() => window.rhine.archive());
          await page.waitForFunction(
            () => window.rhine.stats().mode === "archive",
          );
          const hidden = await page
            .locator(".boot-logo svg,.welcome-logo svg,.loading-mark svg")
            .evaluateAll((svgs) =>
              svgs.every((svg) =>
                svg
                  .getAnimations({ subtree: true })
                  .every((a) => a.playState !== "running"),
              ),
            );
          assert.ok(hidden);

          // Keep a real project request pending to inspect the common loader.
          await page.route("**/cases/erste001/index.html", async (route) => {
            await new Promise((r) => setTimeout(r, 5500));
            await route.continue();
          });
          await page.evaluate(() =>
            window.DesignTerminal.openProject("erste001"),
          );
          await page.waitForFunction(
            () =>
              document
                .querySelector(".case-loading svg")
                ?.getAnimations({ subtree: true })
                .some((a) => a.playState === "running"),
            {},
            { timeout: 15000 },
          );
          const loader = await page.locator(".case-loading svg").evaluate(logo);
          assert.equal(loader.contour, welcome.contour);
          assert.equal(loader.animations.length, 3);
          assert.ok(loader.animations.every((a) => a.duration === 6400));
          await page
            .locator(".case-loading-optics")
            .screenshot({ path: out + `/screenshots/${key}-loader.png` });
          await page.waitForFunction(
            () =>
              document.querySelector(".project-case").dataset.casePhase ===
              "open",
            {},
            { timeout: 40000 },
          );
          await page
            .locator('.project-case [data-terminal-language="en"]')
            .click();
          const first = page
            .frames()
            .find((f) => f.url().includes("/cases/erste001/"));
          await first.waitForFunction(() =>
            document.documentElement.lang.startsWith("en"),
          );
          await page.locator(".project-case-close").click();
          await page.waitForFunction(
            () => !document.querySelector(".project-case").open,
          );
          assert.ok(
            await page
              .locator(".case-loading svg")
              .evaluate((svg) =>
                svg
                  .getAnimations({ subtree: true })
                  .every((a) => a.playState === "paused"),
              ),
          );

          // Only the registry gets a virtual new entry, before the app starts.
          // No archive record, per-project JS or host ID branch is added.
          assert.equal(
            await page
              .locator(
                '.project-directory [data-showcase-project="future-public-services"]',
              )
              .count(),
            1,
          );
          await page.evaluate(() =>
            window.DesignTerminal.openProject("future-public-services"),
          );
          await page.waitForFunction(
            () =>
              document.querySelector(".project-case").dataset.casePhase ===
              "open",
            {},
            { timeout: 30000 },
          );
          const future = page
            .frames()
            .find((f) => f.url().includes("/cases/_template/"));
          assert.ok(future);
          await future.waitForFunction(() =>
            document
              .querySelector("[data-rhine-logo] svg")
              ?.getAnimations({ subtree: true })
              .some((a) => a.playState === "running"),
          );
          const inherited = await future
            .locator("[data-rhine-logo] svg")
            .evaluate(logo);
          assert.equal(inherited.contour, welcome.contour);
          assert.ok(inherited.animations.every((a) => a.duration === 6400));
          await future.evaluate(() => {
            document.body.style.minHeight = "3000px";
            window.scrollTo(0, 1200);
          });
          await future.waitForFunction(() =>
            document
              .querySelector("[data-rhine-logo] svg")
              .getAnimations({ subtree: true })
              .every((a) => a.playState === "paused"),
          );
          await future.evaluate(() => {
            window.scrollTo(0, 0);
            document.body.style.minHeight = "";
          });
          await future.waitForFunction(() =>
            document
              .querySelector("[data-rhine-logo] svg")
              .getAnimations({ subtree: true })
              .every((a) => a.playState === "running"),
          );
          assert.equal(
            await future.locator("h1").textContent(),
            "Your project title",
          );
          await future.locator('[data-terminal-language="zh"]').click();
          await page.waitForFunction(
            () => document.documentElement.lang === "zh-CN",
          );
          assert.equal(
            await future.locator("h1").textContent(),
            "替换为项目标题",
          );
          await page.evaluate(async () => {
            const { setRhineLogoPolicy } = await import("/src/rhine-logo.ts");
            setRhineLogoPolicy(true, false);
          });
          await future.waitForFunction(
            () =>
              document.querySelector("[data-rhine-logo] svg").dataset
                .logoMode === "light",
          );
          assert.equal(
            await future.locator("html").getAttribute("data-terminal-quality"),
            "low",
          );
          await page.emulateMedia({ reducedMotion: "reduce" });
          await future.waitForFunction(
            () =>
              document.querySelector("[data-rhine-logo] svg").dataset
                .logoMode === "still",
          );
          await page.emulateMedia({ reducedMotion: "no-preference" });
          await page.evaluate(async () => {
            const { setRhineLogoPolicy } = await import("/src/rhine-logo.ts");
            setRhineLogoPolicy(false, true);
          });
          await future.waitForFunction(
            () => document.documentElement.dataset.terminalMotion === "reduced",
          );
          await page.evaluate(async () => {
            const { setRhineLogoPolicy } = await import("/src/rhine-logo.ts");
            setRhineLogoPolicy(false, false);
          });
          // Capture a recognizable settled contour, not the first draw-in dot.
          await page.waitForTimeout(1700);
          await future
            .locator("[data-rhine-logo]")
            .screenshot({ path: out + `/screenshots/${key}-future.png` });
          await future.locator("[data-project-close]").click();
          await page.waitForFunction(
            () => !document.querySelector(".project-case").open,
          );
          assert.ok(
            await future
              .locator("svg")
              .evaluate((svg) =>
                svg
                  .getAnimations({ subtree: true })
                  .every((a) => a.playState !== "running"),
              ),
          );
          await future.evaluate(
            () => (document.body.dataset.projectReady = "loading"),
          );
          await page.evaluate(() =>
            window.DesignTerminal.openProject("future-public-services"),
          );
          await page.waitForFunction(
            () =>
              document.querySelector(".project-case").dataset.casePhase ===
              "loading",
          );
          assert.ok(await page.locator(".case-loading").isVisible());
          await future.evaluate(
            () => (document.body.dataset.projectReady = "ready"),
          );
          await page.waitForFunction(
            () =>
              document.querySelector(".project-case").dataset.casePhase ===
              "open",
          );
          assert.equal(
            page.frames().filter((f) => f.url().includes("/cases/_template/"))
              .length,
            1,
          );
          assert.equal(
            await future.locator("[data-rhine-logo] svg").count(),
            1,
          );
          await future.locator("body").press("Escape");
          await page.waitForFunction(
            () => !document.querySelector(".project-case").open,
          );

          await page.evaluate(() =>
            window.DesignTerminal.openProject("erste002"),
          );
          await page.waitForFunction(
            () =>
              document.querySelector(".project-case").dataset.casePhase ===
              "open",
            {},
            { timeout: 60000 },
          );
          const second = page
            .frames()
            .find((f) => f.url().includes("/cases/erste002/"));
          await second.waitForFunction(
            () => document.body.dataset.ready === "true",
          );
          await second.locator("#mode").click();
          await second.locator("#part").selectOption("shell_top");
          await second.locator("#explode").click();
          await page.waitForTimeout(250);
          await second.locator("#reset").click();
          await page
            .locator('.project-case [data-terminal-language="en"]')
            .click();
          await second.waitForFunction(() =>
            document.querySelector("#mode").textContent.includes("Return"),
          );
          await page.locator(".project-case-close").click();
          await page.waitForFunction(
            () => !document.querySelector(".project-case").open,
          );
          await page.waitForTimeout(150);
          const rafBefore = await second.evaluate(() => window.__auditRafTicks);
          await page.waitForTimeout(400);
          assert.equal(
            await second.evaluate(() => window.__auditRafTicks),
            rafBefore,
            "Closed 002 must stop its animation loop",
          );
          const overflow = await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          );
          assert.ok(overflow);
          assert.equal(errors.length, 0, JSON.stringify(errors));
          report.checks.push({
            key,
            welcome,
            loader,
            inherited,
            registryOnlyNewProject: true,
            asynchronousReady: true,
            offscreenPaused: true,
            closed002RafStopped: true,
            language: true,
            lowReduced: true,
            reenter: true,
            overflow,
            errors,
          });
        } catch (e) {
          const state = await page.evaluate(() => ({
            phase: document.querySelector(".project-case")?.dataset.casePhase,
            frames: [...document.querySelectorAll(".project-case-frame")].map(
              (f) => ({
                url: f.src,
                hidden: f.hidden,
                inert: f.inert,
                opacity: getComputedStyle(f).opacity,
                body: f.contentDocument?.body?.innerHTML.slice(0, 400),
                logos: [
                  ...(f.contentDocument?.querySelectorAll("svg.rhine-logo") ??
                    []),
                ].map((s) => ({
                  mode: s.dataset.logoMode,
                  rect: s.getBoundingClientRect().toJSON(),
                  animations: s
                    .getAnimations({ subtree: true })
                    .map((a) => a.playState),
                })),
              }),
            ),
          }));
          report.errors.push({ key, error: e.stack, console: errors, state });
          console.log(key, e.stack, JSON.stringify(state));
          await page
            .screenshot({ path: out + `/screenshots/${key}-failure.png` })
            .catch(() => {});
        }
        await context.close();
        await fs.writeFile(resultFile, JSON.stringify(report, null, 2));
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
  await fs.writeFile(resultFile, JSON.stringify(report, null, 2));
}
assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
console.log(
  "Site-wide logo and unknown-project default services passed in Chrome/Edge desktop/mobile.",
);
