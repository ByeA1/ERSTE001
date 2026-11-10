import {
  DEFAULT_STORY,
  clone,
  validateStory,
  clamp,
} from "./story-timeline.js";

import { LIGHT_PRESETS } from "./story-lighting.js";

export const MODEL = DEFAULT_STORY.model;
const idPattern = /^[a-z][a-z0-9-]{0,48}$/;
const channels = [
  "camera",
  "lights",
  "ambient",
  "reflection",
  "cut",
  "explode",
  "assembly",
  "electronics",
  "focus",
  "isolate",
  "cue",
];
const defaults = DEFAULT_STORY.keyframes[0];

function assert(condition, message) {
  if (!condition) throw new Error("演出片段无效：" + message);
}

function mergePose(base, patch) {
  const result = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "at" || key === "pose" || key === "lighting")
      continue;
    assert(
      Object.hasOwn(base, key) &&
        (channels.includes(key) || !Object.hasOwn(base, "at")),
      "未知参数 " + key,
    );
    const initial = base[key];
    result[key] =
      initial &&
      typeof initial === "object" &&
      !Array.isArray(initial) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
        ? mergePose(initial, value)
        : clone(value);
  }
  return result;
}

export function compileStory(input) {
  if (input?.version !== 2) return validateStory(input);
  assert(input.model === MODEL, "模型版本不匹配");
  const { poses, segments } = input;
  assert(
    poses && typeof poses === "object" && !Array.isArray(poses),
    "缺少命名机位",
  );
  assert(
    Array.isArray(segments) && segments.length > 0 && segments.length <= 24,
    "片段须为 1–24 个",
  );
  const frames = [],
    lightingTrack = [],
    captions = [],
    ranges = [],
    ids = new Set();
  const makePose = (name, overrides = {}) => {
    assert(
      idPattern.test(name) && Object.hasOwn(poses, name),
      "未知机位 " + name,
    );
    const preset = overrides.lighting ?? poses[name].lighting;
    assert(
      preset === undefined || Object.hasOwn(LIGHT_PRESETS, preset),
      "未知灯光预设 " + preset,
    );
    const base = preset ? mergePose(defaults, LIGHT_PRESETS[preset]) : defaults;
    const pose = mergePose(base, poses[name]);
    assert(!pose.cue.enabled, "提示闪烁应设在片段内镜头：" + name);
    return mergePose(pose, overrides);
  };
  for (const segment of segments) {
    assert(
      idPattern.test(segment.id) && !ids.has(segment.id),
      "片段 ID 重复或无效",
    );
    ids.add(segment.id);
    assert(
      Number.isFinite(segment.hold) && segment.hold > 0 && segment.hold <= 1,
      segment.id + " 停留机位",
    );
    assert(typeof segment.locked === "boolean", segment.id + " 缺少锁状态");
    assert(
      Number.isFinite(segment.duration) &&
        segment.duration >= 1 &&
        segment.duration <= 45,
      segment.id + " 演出秒数",
    );
  }
  const total = segments.reduce((sum, segment) => sum + segment.duration, 0);
  let elapsed = 0;
  for (const [index, segment] of segments.entries()) {
    const { id, from, to, shots, beats, title, locked } = segment;
    assert(
      index === 0 || segments[index - 1].to === from,
      id + " 必须衔接前一段的出口机位",
    );
    assert(
      Array.isArray(title) &&
        title.length === 2 &&
        title.every(
          (s) => typeof s === "string" && s.length > 0 && s.length <= 80,
        ),
      id + " 标题",
    );
    assert(
      Array.isArray(shots) && Array.isArray(beats) && beats.length > 0,
      id + " 缺少镜头或文字",
    );
    const start = elapsed / total;
    elapsed += segment.duration;
    const end = elapsed / total;
    const map = (local) => start + local * (end - start);
    ranges.push({ id, start, end, hold: map(segment.hold), title, locked });
    if (index === 0) frames.push({ ...makePose(from), at: start });
    let previous = 0;
    const names = new Set();
    for (const shot of shots) {
      assert(
        idPattern.test(shot.id) && !names.has(shot.id),
        id + " 镜头 ID 重复或无效",
      );
      names.add(shot.id);
      assert(
        Number.isFinite(shot.at) && shot.at > previous && shot.at < 1,
        id + " 镜头须按片段进度递增",
      );
      previous = shot.at;
      const pose = makePose(shot.pose ?? from, shot);
      if (pose.cue.enabled) {
        const { start, end } = pose.cue;
        assert(
          start >= 0 && end <= 1 && end > start,
          id + " 提示闪烁须位于片段内",
        );
        pose.cue.start = map(start);
        pose.cue.end = map(end);
      }
      frames.push({ ...pose, at: map(shot.at) });
    }
    frames.push({ ...makePose(to), at: end });
    if (segment.lightingTrack) {
      assert(segment.lightingTrack.length >= 2, id + " 灯光轨道须包含首尾关键帧");
      let last = -1;
      for (const frame of segment.lightingTrack) {
        assert(Number.isFinite(frame.at) && frame.at > last && frame.at <= 1,
          id + " 灯光关键帧须递增且位于片段内");
        last = frame.at;
      }
      assert(segment.lightingTrack[0].at === 0 && last === 1, id + " 灯光轨道须覆盖首尾");
      for (const frame of segment.lightingTrack) {
        const pose = makePose(frame.pose ?? from, frame);
        const { lights, ambient, reflection } = pose;
        const entry = { at: map(frame.at), lights, ambient, reflection };
        const prior = lightingTrack.at(-1);
        if (prior?.at === entry.at) {
          assert(JSON.stringify(prior) === JSON.stringify(entry), id + " 灯光入口须衔接前段出口");
        } else lightingTrack.push(entry);
      }
    } else if (input.segments.some((item) => item.lightingTrack)) {
      assert(false, id + " 须提供灯光轨道以保证章节衔接");
    }
    previous = 0;
    for (const beat of beats) {
      assert(
        beat.start === previous && beat.end > beat.start && beat.end <= 1,
        id + " 文字须连续覆盖片段",
      );
      assert(
        typeof beat.tag === "string" && beat.tag.length <= 50,
        id + " 标记",
      );
      previous = beat.end;
      captions.push({
        start: map(beat.start),
        end: map(beat.end),
        title: beat.title,
        body: beat.body,
        tag: beat.tag,
        layout: beat.layout,
        annotation: beat.annotation,
        ...(beat.arrive !== undefined ? { arrive: map(beat.arrive) } : {}),
        ...(beat.reveal !== undefined ? { reveal: map(beat.reveal) } : {}),
        ...(beat.leave !== undefined ? { leave: map(beat.leave) } : {}),
      });
    }
    assert(previous === 1, id + " 文字须覆盖至片段末尾");
  }
  const flat = validateStory({
    version: 1,
    model: MODEL,
    label: input.label,
    keyframes: frames,
    captions,
    ...(lightingTrack.length ? { lightingTrack } : {}),
  });
  return { ...flat, ranges, duration: total };
}

// Protect each locked segment's local content and every pose it references.
export function checkLocks(before, after) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const old of before.segments.filter((segment) => segment.locked)) {
    const next = after.segments.find((segment) => segment.id === old.id);
    assert(next && same(old, next), old.id + " 已锁定");
    const names = new Set([
      old.from,
      old.to,
      ...old.shots.map((shot) => shot.pose ?? old.from),
      ...(old.lightingTrack ?? []).map((frame) => frame.pose ?? old.from),
    ]);
    for (const name of names)
      assert(
        same(before.poses[name], after.poses[name]),
        old.id + " 引用的机位已锁定：" + name,
      );
  }
}

export function editFrame(document, flat, progress, frame, lightingOnly = false) {
  const range = flat.ranges.find(
    (item) => progress >= item.start && progress <= item.end,
  );
  assert(range && !range.locked, "请在未锁定的片段中修改");
  const segment = document.segments.find((item) => item.id === range.id);
  const at = (progress - range.start) / (range.end - range.start);
  assert(
    at > 0.00001 && at < 0.99999,
    "交界机位由相邻片段共用，请在片段内部保存",
  );
  const next = clone(document);
  if (lightingOnly) {
    const track = next.segments.find((item) => item.id === segment.id).lightingTrack;
    assert(track, "当前文件没有独立灯光轨道");
    const index = track.findIndex((key) => Math.abs(key.at - at) < 0.001);
    if (frame) {
      const entry = {
        at,
        lights: clone(frame.lights),
        ambient: frame.ambient,
        reflection: clone(frame.reflection),
      };
      if (index < 0) track.push(entry);
      else track[index] = entry;
      track.sort((a, b) => a.at - b.at);
    } else {
      assert(index > 0 && index < track.length - 1, "请选择片段内部的灯光关键帧");
      track.splice(index, 1);
    }
    compileStory(next);
    return next;
  }
  const shots = next.segments.find((item) => item.id === segment.id).shots;
  const index = shots.findIndex((shot) => Math.abs(shot.at - at) < 0.001);
  if (frame) {
    const value = Object.fromEntries(
      channels.map((channel) => [channel, clone(frame[channel])]),
    );
    if (value.cue.enabled) {
      const local = (position) =>
        (position - range.start) / (range.end - range.start);
      value.cue.start = local(value.cue.start);
      value.cue.end = local(value.cue.end);
    }
    const shot = {
      id: shots[index]?.id ?? "manual-" + Math.round(at * 1e6),
      at: shots[index]?.at ?? clamp(at),
      ...value,
    };
    const track = next.segments.find((item) => item.id === segment.id).lightingTrack;
    if (track) {
      const lightIndex = track.findIndex((key) => Math.abs(key.at - at) < 0.001);
      const { lights, ambient, reflection } = value;
      const lightFrame = { at, lights, ambient, reflection };
      if (lightIndex < 0) track.push(lightFrame);
      else track[lightIndex] = lightFrame;
      track.sort((a, b) => a.at - b.at);
    }
    if (index === -1) shots.push(shot);
    else shots[index] = shot;
    shots.sort((a, b) => a.at - b.at);
  } else {
    assert(index !== -1, "请选择片段内的已有镜头");
    shots.splice(index, 1);
  }
  compileStory(next);
  return next;
}
