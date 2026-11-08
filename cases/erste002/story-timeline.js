// Pure, deterministic timeline. No dependence on playback direction or earlier samples.
export const PARTS = ["", "shell_top", "button_cover", "bottom_plate", "pcb", "sensor", "wheel", "battery"];
export const clone = (v) => JSON.parse(JSON.stringify(v));
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const light = (position, target, intensity, color, angle = 35) => ({
  position,
  target,
  intensity,
  color,
  angle,
});
const base = {
  at: 0,
  camera: { position: [0.36, 0.24, 0.64], target: [0, 0, 0], fov: 32 },
  lights: {
    key: light([-0.4, 0.6, 0.35], [0, 0, 0], 3, "#fff5df", 48),
    rim: light([0.3, 0.2, -0.4], [0, 0, 0], 2, "#ffffff", 42),
    focus: light([0.05, 0.22, 0.15], [0, 0, 0], 0, "#ffffff", 24),
  },
  ambient: 0.6,
  cut: {
    enabled: true,
    position: [0.16, 0, 0],
    rotation: [0, -90, 0],
    target: "all",
    cap: true,
  },
  explode: 0,
  focus: "",
  cue: { enabled: false, start: 0.16, end: 0.24, strength: 1.5 },
};
function frame(at, changes = {}) {
  return { ...clone(base), at, ...changes };
}
const focused = clone(base.lights);
focused.key.intensity = 0.6;
focused.rim.intensity = 0.35;
focused.focus = light(
  [0.14, 0.14, 0.03],
  [0, -0.005, -0.055],
  6,
  "#fff5e5",
  23,
);
// Only a technical section demonstration, NOT the cancelled five-chapter storyboard.
export const DEFAULT_STORY = {
  version: 1,
  model: "./assets/shell-full.glb",
  label: "ERSTE002 / editable section study",
  keyframes: [
    frame(0),
    frame(0.16),
    frame(0.24, {
      focus: "shell_top",
      cue: { enabled: true, start: 0.16, end: 0.24, strength: 1.5 },
    }),
    frame(0.58, {
      camera: {
        position: [0.36, 0.18, 0.46],
        target: [-0.025, -0.012, -0.03],
        fov: 36,
      },
      lights: focused,
      ambient: 0.15,
      cut: {
        enabled: true,
        position: [0, 0, 0],
        rotation: [0, -90, 0],
        target: "all",
        cap: true,
      },
      focus: "shell_top",
    }),
    frame(0.8, {
      camera: {
        position: [0.035, -0.012, -0.025],
        target: [-0.025, -0.012, -0.075],
        fov: 65,
      },
      lights: {
        ...clone(focused),
        focus: light(
          [0.03, 0.012, -0.02],
          [-0.025, -0.012, -0.075],
          1.8,
          "#fff5e5",
          44,
        ),
      },
      ambient: 0.12,
      cut: {
        enabled: true,
        position: [0.005, 0, 0],
        rotation: [0, -105, 8],
        target: "all",
        cap: true,
      },
      focus: "shell_top",
    }),
    frame(1),
  ],
  captions: [
    {
      start: 0,
      end: 0.22,
      title: ["低矮外壳，向内观察。", "A low shell. A closer look."],
      body: [
        "滚动推进镜头与剖切，向上滚动即可复原。",
        "Scroll to move through the section. Scroll back to restore it.",
      ],
    },
    {
      start: 0.28,
      end: 0.64,
      title: ["剖开表面，观察结构。", "Beyond the surface."],
      body: [
        "灯光照向切开的上盖；外壳与内部结构保留原本材质。",
        "A real spotlight reveals the section. The original surface material stays unchanged.",
      ],
    },
    {
      start: 0.66,
      end: 0.88,
      title: ["进入壳体内部。", "Inside the shell."],
      body: [
        "切面旋转后，镜头与灯光继续进入内部。",
        "The section rotates as the camera and light move inside.",
      ],
    },
    {
      start: 0.9,
      end: 1,
      title: ["一条轨道，可进可退。", "One track. Both directions."],
      body: [
        "剖切与装配可以复原，继续向上滚动回看细节。",
        "Scroll upward to revisit the cut and restore the assembly.",
      ],
    },
  ],
};
function mix(a, b, t, key = "") {
  if (t === 0) return clone(a);
  if (t === 1) return clone(b);
  if (typeof a === "number") return a + (b - a) * t;
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], t));
  if (typeof a === "object" && a !== null)
    return Object.fromEntries(
      Object.keys(a).map((k) => [k, mix(a[k], b[k], t, k)]),
    );
  if (key === "color")
    return (
      "#" +
      [1, 3, 5]
        .map((i) =>
          Math.round(
            parseInt(a.slice(i, i + 2), 16) * (1 - t) +
              parseInt(b.slice(i, i + 2), 16) * t,
          )
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  return t < 0.5 ? a : b;
}
export function sampleStory(story, progress) {
  const p = clamp(progress),
    f = story.keyframes;
  let i = 0;
  while (i < f.length - 2 && p > f[i + 1].at) i++;
  const a = f[i],
    b = f[i + 1],
    value = mix(a, b, smooth((p - a.at) / (b.at - a.at)));
  value.at = p;
  return value;
}
export function cueStrength(story, p, part) {
  let result = 0;
  for (const f of story.keyframes) {
    const c = f.cue;
    if (!c.enabled || f.focus !== part || p <= c.start || p >= c.end) continue;
    const t = (p - c.start) / (c.end - c.start);
    result = Math.max(result, Math.sin(t * Math.PI * 2) ** 2 * c.strength);
  }
  return result;
}
export function captionAt(story, p) {
  const c = story.captions.find((c) => p >= c.start && p <= c.end);
  if (!c) return null;
  const edge = Math.min(0.035, (c.end - c.start) / 4);
  return {
    ...c,
    opacity:
      (c.start === 0 ? 1 : smooth((p - c.start) / edge)) *
      (c.end === 1 ? 1 : smooth((c.end - p) / edge)),
  };
}
export function validateStory(input) {
  const fail = (m) => {
    throw Error("演出文件无效：" + m);
  };
  if (!input || input.version !== 1 || input.model !== DEFAULT_STORY.model)
    fail("版本或模型不匹配");
  if (
    !Array.isArray(input.keyframes) ||
    input.keyframes.length < 2 ||
    input.keyframes.length > 200
  )
    fail("关键帧须为 2–200 个");
  const range = (n, a, b, k) => {
    if (!Number.isFinite(n) || n < a || n > b) fail(k);
  };
  const vec = (v, k) => {
    if (!Array.isArray(v) || v.length !== 3) fail(k);
    v.forEach((n) => range(n, -360, 360, k));
  };
  let prev = -1;
  for (const f of input.keyframes) {
    range(f.at, 0, 1, "进度");
    if (f.at <= prev) fail("进度必须递增且不重复");
    prev = f.at;
    if (!f.camera || !f.lights || !f.cut || !f.cue) fail("缺少参数");
    vec(f.camera.position, "镜头");
    vec(f.camera.target, "观察目标");
    range(f.camera.fov, 10, 110, "视野");
    for (const name of ["key", "rim", "focus"]) {
      const l = f.lights[name];
      if (!l) fail("灯光");
      vec(l.position, "灯光位置");
      vec(l.target, "灯光方向");
      range(l.intensity, 0, 100, "灯光强度");
      range(l.angle, 1, 89, "聚光角度");
      if (!/^#[0-9a-f]{6}$/i.test(l.color)) fail("灯光颜色");
    }
    vec(f.cut.position, "切面位置");
    vec(f.cut.rotation, "切面角度");
    if (
      !["all", ...PARTS.slice(1)].includes(f.cut.target) ||
      typeof f.cut.enabled !== "boolean" ||
      typeof f.cut.cap !== "boolean"
    )
      fail("剖切目标/开关");
    if (!PARTS.includes(f.focus) || typeof f.cue.enabled !== "boolean")
      fail("提示目标");
    range(f.ambient, 0, 5, "环境光");
    range(f.explode, 0, 1, "装配");
    range(f.cue.start, 0, 1, "闪烁开始");
    range(f.cue.end, 0, 1, "闪烁结束");
    range(f.cue.strength, 0, 5, "闪烁强度");
    if (f.cue.end <= f.cue.start) fail("闪烁结束须晚于开始");
  }
  if (input.keyframes[0].at !== 0 || prev !== 1) fail("须保留 0 和 1 端点");
  if (!Array.isArray(input.captions) || input.captions.length > 100)
    fail("文字轨道");
  for (const c of input.captions) {
    range(c.start, 0, 1, "文字开始");
    range(c.end, 0, 1, "文字结束");
    if (c.end <= c.start) fail("文字区间");
    for (const k of ["title", "body"])
      if (
        !Array.isArray(c[k]) ||
        c[k].length !== 2 ||
        c[k].some((s) => typeof s !== "string" || s.length > 2000)
      )
        fail("双语文字");
  }
  const clean = (v, t) =>
    Array.isArray(t)
      ? t.map((_, i) => clean(v[i], t[i]))
      : t && typeof t === "object"
        ? Object.fromEntries(Object.keys(t).map((k) => [k, clean(v[k], t[k])]))
        : v;
  return {
    version: 1,
    model: DEFAULT_STORY.model,
    label: String(input.label || "ERSTE002").slice(0, 160),
    keyframes: input.keyframes.map((f) => clean(f, base)),
    captions: input.captions.map((c) => ({
      start: c.start,
      end: c.end,
      title: [...c.title],
      body: [...c.body],
    })),
  };
}
