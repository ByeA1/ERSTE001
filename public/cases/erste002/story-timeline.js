import { LIGHT_NAMES, LIGHT_PRESETS } from "./story-lighting.js";

// Pure, deterministic timeline. No dependence on playback direction or earlier samples.
export const PARTS = [
  "",
  "shell_top",
  "button_cover",
  "wheel",
  "pcb",
  "battery",
];
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
  camera: {
    position: [0.34, 0.26, 0.39],
    target: [0, 0, 0],
    fov: 32,
    frame: [0.31, 0],
  },
  lights: {
    fill: { ...LIGHT_PRESETS.Studio.lights.fill, intensity: 0 },
    key: light([-0.4, 0.6, 0.35], [0, 0, 0], 3, "#fff5df", 48),
    rim: light([0.3, 0.2, -0.4], [0, 0, 0], 2, "#ffffff", 42),
    focus: light([0.05, 0.22, 0.15], [0, 0, 0], 0, "#ffffff", 24),
  },
  ambient: 0.6,
  reflection: { intensity: 0.48, yaw: 0 },
  cut: {
    enabled: false,
    position: [0.16, 0, 0],
    rotation: [0, -90, 0],
    target: "all",
    cap: true,
  },
  explode: 0,
  assembly: Object.fromEntries(
    PARTS.slice(1).map((part) => [
      part,
      { offset: [0, 0, 0], rotation: [0, 0, 0] },
    ]),
  ),
  electronics: 0,
  focus: "",
  isolate: "",
  cue: { enabled: false, start: 0.16, end: 0.24, strength: 1.5 },
};
function frame(at, changes = {}) {
  return { ...clone(base), at, ...changes };
}
// A readable cover pose if the authored JSON is unavailable.
export const DEFAULT_STORY = {
  version: 1,
  model: "./assets/shell-full.glb",
  label: "ERSTE002",
  keyframes: [frame(0), frame(1)],
  captions: [
    {
      start: 0,
      end: 1,
      tag: "ERSTE002 / DESIGN STUDY",
      title: ["ERSTE002", "ERSTE002"],
      body: [
        "右手人体工学，无底壳设计。约 33 g 为设计目标。",
        "Right-hand ergonomics with an open underside. Approx. 33 g design target.",
      ],
    },
  ],
};
export function blendPose(a, b, t, key = "") {
  if (t === 0) return clone(a);
  if (t === 1) return clone(b);
  if (typeof a === "number") return a + (b - a) * t;
  if (Array.isArray(a)) return a.map((v, i) => blendPose(v, b[i], t));
  if (typeof a === "object" && a !== null)
    return Object.fromEntries(
      Object.keys(a).map((k) => [k, blendPose(a[k], b[k], t, k)]),
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
    value = blendPose(a, b, smooth((p - a.at) / (b.at - a.at)));
  value.at = p;
  if (story.lightingTrack) {
    const lighting = sampleStory({ keyframes: story.lightingTrack }, p);
    value.lights = lighting.lights;
    value.ambient = lighting.ambient;
    value.reflection = lighting.reflection;
  }
  return value;
}
// Reduced motion shows the completed poses as stills, so technical views
// inside a chapter remain available without animated camera or part motion.
export function sampleStill(story, progress) {
  const caption = story.captions.findLast(
    (item) => item.arrive !== undefined && progress >= item.arrive,
  );
  return sampleStory(story, caption?.arrive ?? 0);
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
  const arrive = c.arrive ?? c.start;
  const reveal = c.reveal ?? arrive;
  const leave = c.leave ?? c.end;
  if (p < reveal || p > leave) return null;
  const fadeIn = Math.min(0.011, (leave - reveal) / 2);
  const fadeOut = Math.min(0.008, (leave - arrive) / 4);
  const entrance = reveal === 0 ? 1 : clamp((p - reveal) / fadeIn);
  const exit = leave === 1 ? 1 : clamp((leave - p) / fadeOut);
  return {
    ...c,
    revealProgress: Math.min(entrance, exit),
    opacity: smooth(entrance) * smooth(exit),
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
    if (f.camera.frame !== undefined) {
      if (!Array.isArray(f.camera.frame) || f.camera.frame.length !== 2)
        fail("构图偏移");
      f.camera.frame.forEach((n) => range(n, -0.75, 0.75, "构图偏移"));
    }
    for (const name of LIGHT_NAMES) {
      const l =
        f.lights[name] ?? (name === "fill" ? base.lights.fill : undefined);
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
    if (!PARTS.includes(f.isolate ?? "")) fail("单独显示部件");
    range(f.ambient, 0, 5, "环境光");
    if (f.reflection !== undefined) {
      range(f.reflection?.intensity, 0, 3, "环境反射强度");
      range(f.reflection?.yaw, -360, 360, "环境反射角度");
    }
    range(f.explode, 0, 1, "装配");
    if (f.assembly !== undefined) {
      if (
        !f.assembly ||
        typeof f.assembly !== "object" ||
        Array.isArray(f.assembly)
      )
        fail("装配部件");
      for (const [part, transform] of Object.entries(f.assembly)) {
        if (!Object.hasOwn(base.assembly, part) || !transform) fail("装配部件");
        vec(transform.offset, "部件位移");
        transform.offset.forEach((n) => range(n, -1, 1, "部件位移"));
        vec(transform.rotation, "部件旋转");
      }
    }
    range(f.electronics ?? 0, 0, 1, "电子件退让");
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
    const arrive = c.arrive ?? c.start,
      leave = c.leave ?? c.end;
    range(arrive, c.start, c.end, "文字出现机位");
    range(c.reveal ?? arrive, c.start, arrive, "文案入场起点");
    range(leave, arrive, c.end, "文字离开机位");
    if (arrive === leave) fail("文字停留区间");
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
    ...(input.lightingTrack ? {
      lightingTrack: validateStory({
        ...DEFAULT_STORY,
        keyframes: input.lightingTrack.map((frame) => ({ ...clone(base), ...frame })),
      }).keyframes.map(({ at, lights, ambient, reflection }) => ({ at, lights, ambient, reflection })),
    } : {}),
    label: String(input.label || "ERSTE002").slice(0, 160),
    keyframes: input.keyframes.map((f) =>
      clean(
        {
          electronics: 0,
          isolate: "",
          reflection: base.reflection,
          ...f,
          assembly: { ...base.assembly, ...f.assembly },
          lights: { fill: base.lights.fill, ...f.lights },
          camera: { frame: base.camera.frame, ...f.camera },
        },
        base,
      ),
    ),
    captions: input.captions.map((c) => ({
      tag: typeof c.tag === "string" ? c.tag.slice(0, 50) : "",
      layout: ["left", "right", "bottom"].includes(c.layout)
        ? c.layout
        : "left",
      annotation: [
        "button-height",
        "shell-shoulders",
        "palm-support",
        "section-rib",
      ].includes(c.annotation)
        ? c.annotation
        : "",
      ...(c.arrive !== undefined ? { arrive: c.arrive } : {}),
      ...(c.reveal !== undefined ? { reveal: c.reveal } : {}),
      ...(c.leave !== undefined ? { leave: c.leave } : {}),
      start: c.start,
      end: c.end,
      title: [...c.title],
      body: [...c.body],
    })),
  };
}
