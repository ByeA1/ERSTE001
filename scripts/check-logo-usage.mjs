import fs from "node:fs/promises";
import assert from "node:assert/strict";

const read = (file) => fs.readFile(file, "utf8");
const [main, boot, loading, bridge, viewer, template, brand] =
  await Promise.all(
    [
      "src/main.ts",
      "src/boot.ts",
      "src/project-loading.ts",
      "src/project-interface.ts",
      "src/project-viewer.ts",
      "public/cases/_template/index.html",
      "src/brand.ts",
    ].map(read),
  );
assert.ok(
  !/export const logo\s*=/.test(brand),
  "Do not revive the static UI logo export",
);
assert.ok(
  main.includes("${loopingLogoSvg}") &&
    main.includes("${isWallpaper?loopingLogoSvg:loopingMarkSvg}"),
);
assert.ok(
  loading.includes("${loopingLogoSvg}") &&
    loading.includes("new RhineLogoPlayer"),
);
assert.ok(
  boot.includes("new RhineLogoPlayer") &&
    !boot.includes("this.contour.style.strokeDasharray"),
);
assert.ok(
  viewer.includes("new ProjectInterface") &&
    !/projectId\s*[!=]==?\s*['"]erste00[12]/.test(viewer),
  "Public capabilities must not use per-project ID branches",
);
assert.ok(
  bridge.includes("data-rhine-logo") &&
    bridge.includes("data-zh") &&
    bridge.includes("case-policy"),
);
assert.ok(
  template.includes("data-rhine-logo") &&
    template.includes("data-project-close") &&
    template.includes("data-terminal-language"),
);
assert.ok(
  !/<script\b/i.test(template),
  "The default template must work without per-project bootstrap code",
);
// Static graphics belong only to printed labels / OS icons. A newly copied UI
// mark would escape the shared runtime, so reject known mark geometry in cases.
for (const file of await fs.readdir("public/cases", { recursive: true })) {
  if (!/\.(html|js|svg)$/.test(file) || /(^|[\\/])vendor[\\/]/.test(file))
    continue;
  const body = await read("public/cases/" + file);
  assert.ok(
    !/M156\s*75C127|M295\s*73C295|M50\s*50C35\s*25/.test(body),
    `Use the shared logo container instead of static geometry: ${file}`,
  );
}
console.log(
  "Shared project services and logo usage checked; future projects require no UI bootstrap.",
);
