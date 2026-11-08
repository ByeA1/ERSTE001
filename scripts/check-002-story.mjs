import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createContourReader } from "../public/cases/erste002/section-contours.js";
import { SectionCut } from "../public/cases/erste002/story-section.js";
import {
  checkLocks,
  compileStory,
  editFrame,
} from "../public/cases/erste002/story-segments.js";
import {
  DEFAULT_STORY,
  clone,
  validateStory,
  sampleStory,
  cueStrength,
  captionAt,
} from "../public/cases/erste002/story-timeline.js";

const data = JSON.parse(
  fs.readFileSync(
    new URL("../public/cases/erste002/story.json", import.meta.url),
  ),
);
const story = compileStory(data);

test("all authored chapters hold at a readable shot and are reversible", () => {
  assert.deepEqual(
    story.ranges.map((r) => r.id),
    [
      "exterior",
      "right-hand-ergonomics",
      "structural-reinforcement",
      "return-to-form",
    ],
  );
  const forward = Array.from({ length: 1001 }, (_, i) =>
    sampleStory(story, i / 1000),
  );
  for (let i = 1000; i >= 0; i--)
    assert.deepEqual(sampleStory(story, i / 1000), forward[i]);
  for (const range of story.ranges) {
    assert.ok(range.hold > range.start && range.hold <= range.end);
    assert.ok(captionAt(story, range.hold).opacity > 0.9, range.id);
  }
  for (const frame of story.keyframes)
    assert.deepEqual(sampleStory(story, frame.at), frame);
});

test("spotlight focuses the cut shell, the final shot restores all components", () => {
  const opening = sampleStory(story, 0);
  const reinforcement = story.ranges.find(
    (r) => r.id === "structural-reinforcement",
  );
  const section = sampleStory(story, reinforcement.hold);
  const final = sampleStory(story, 1);
  assert.equal(section.cut.enabled && section.cut.cap, true);
  assert.ok(section.lights.focus.intensity > 0);
  assert.ok(section.lights.key.intensity < opening.lights.key.intensity);
  assert.ok(section.lights.rim.intensity < opening.lights.rim.intensity);
  assert.ok(section.electronics > 0 && section.electronics < 1);
  assert.ok(story.keyframes.some((frame) => frame.electronics === 1));
  assert.deepEqual(final.cut, opening.cut);
  assert.equal(final.electronics, 0);
  assert.equal(final.explode, 0);
  assert.ok(story.keyframes.some((frame) => frame.explode === 1));
  assert.equal(final.lights.focus.intensity, 0);
});

test("legacy manual tracks still import and optional cues have precisely two pulses", () => {
  const legacy = clone(DEFAULT_STORY);
  for (const f of legacy.keyframes) delete f.electronics;
  legacy.keyframes[0].focus = "shell_top";
  legacy.keyframes[0].cue = {
    enabled: true,
    start: 0.125,
    end: 0.625,
    strength: 1,
  };
  const imported = compileStory(legacy);
  assert.equal(imported.keyframes[0].electronics, 0);
  for (const p of [0.125, 0.375, 0.625])
    assert.ok(cueStrength(imported, p, "shell_top") < 1e-10);
  for (const p of [0.25, 0.5])
    assert.equal(cueStrength(imported, p, "shell_top"), 1);
  assert.equal(cueStrength(imported, 0.25, "button_cover"), 0);
});

test("named segment edits and insertions leave other authored segments unchanged", () => {
  const input = clone(data);
  input.segments[0].locked = true;
  const flat = compileStory(input);
  const local = flat.ranges[1].hold;
  const frame = sampleStory(flat, local);
  frame.camera.fov = 53;
  const edit = editFrame(input, flat, local, frame);
  assert.equal(sampleStory(compileStory(edit), local).camera.fov, 53);
  assert.deepEqual(edit.segments[0], input.segments[0]);
  assert.deepEqual(edit.segments[2], input.segments[2]);
  assert.deepEqual(edit.poses, input.poses);
  checkLocks(input, edit);
  assert.throws(
    () => editFrame(input, flat, flat.ranges[0].hold, frame),
    /锁定/,
  );
  assert.throws(
    () => editFrame(input, flat, flat.ranges[1].start, frame),
    /锁定|交界/,
  );
  edit.poses.cover.camera.fov++;
  assert.throws(() => checkLocks(input, edit), /机位已锁定/);

  const added = clone(input);
  const bridge = clone(input.segments[0]);
  Object.assign(bridge, { id: "extra-bridge", locked: false, from: bridge.to });
  added.segments.splice(1, 0, bridge);
  const expanded = compileStory(added);
  checkLocks(input, added);
  assert.deepEqual(added.segments[2], input.segments[1]);
  const view = (compiled, range) => {
    const { at, ...shot } = sampleStory(compiled, range.hold);
    return JSON.stringify(shot, (_, value) =>
      typeof value === "number" ? Number(value.toPrecision(13)) : value,
    );
  };
  assert.deepEqual(
    view(expanded, expanded.ranges[2]),
    view(flat, flat.ranges[1]),
  );
});

test("invalid captions, section boundaries and keyframes cannot enter the renderer", () => {
  for (const mutate of [
    (s) => (s.segments[1].from = "final"),
    (s) => (s.segments[0].shots[0].at = 1),
    (s) => (s.segments[1].beats[1].start = 0.4),
    (s) => (s.poses.cover.camera.fov = NaN),
    (s) => (s.poses.cover.cut.rotation = [0]),
    (s) => (s.poses.cover.lights.key.intensity = -1),
    (s) => (s.model = "https://elsewhere.invalid/model.glb"),
    (s) => (s.poses.cover.focus = "ribs"),
    (s) => (s.poses.cover.cut.enabled = "true"),
  ]) {
    const input = clone(data);
    mutate(input);
    assert.throws(() => compileStory(input));
  }
  assert.throws(() => validateStory(null));
});

test("Rev 3 shell and buttons are closed, consistently wound volumes and have no bottom shell", () => {
  const file = fs.readFileSync(
    new URL("../public/cases/erste002/assets/shell-full.glb", import.meta.url),
  );
  const jsonEnd = 20 + file.readUInt32LE(12);
  const asset = JSON.parse(file.subarray(20, jsonEnd));
  assert.ok(
    asset.nodes.every((node) => !/bottom_plate|base_shell/i.test(node.name)),
  );
  function read(index) {
    const accessor = asset.accessors[index];
    const view = asset.bufferViews[accessor.bufferView];
    const start =
      jsonEnd + 8 + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    return { data: file.subarray(start, start + view.byteLength), accessor };
  }
  for (const name of ["Shell", "Buttons"]) {
    const primitive = asset.meshes.find((mesh) => mesh.name === name)
      .primitives[0];
    const index = read(primitive.indices),
      position = read(primitive.attributes.POSITION);
    assert.equal(index.accessor.componentType, 5125);
    const edges = new Map();
    const points = Array.from({ length: position.accessor.count }, (_, i) =>
      [0, 4, 8].map((offset) => position.data.readFloatLE(i * 12 + offset)),
    );
    if (name === "Buttons") {
      const landmark = (x) =>
        Math.max(
          ...points
            .filter(
              ([px, y]) =>
                Math.abs(px - x) < 0.001 && Math.abs(y + 0.037) < 0.0005,
            )
            .map((point) => point[2]),
        );
      const high = landmark(0.014),
        low = landmark(-0.014);
      assert.ok(Number.isFinite(high) && Number.isFinite(low) && high > low);
    }
    let volume = 0;
    for (let i = 0; i < index.accessor.count; i += 3) {
      const triangle = [0, 1, 2].map((offset) =>
        index.data.readUInt32LE(4 * (i + offset)),
      );
      const [a, b, c] = triangle.map((vertex) => points[vertex]);
      volume +=
        (a[0] * (b[1] * c[2] - b[2] * c[1]) +
          a[1] * (b[2] * c[0] - b[0] * c[2]) +
          a[2] * (b[0] * c[1] - b[1] * c[0])) /
        6;
      for (let k = 0; k < 3; k++) {
        const a = triangle[k],
          b = triangle[(k + 1) % 3];
        const key = Math.min(a, b) * points.length + Math.max(a, b);
        const edge = edges.get(key) ?? { count: 0, orientation: 0 };
        edge.count++;
        edge.orientation += a < b ? 1 : -1;
        edges.set(key, edge);
      }
    }
    assert.ok(volume > 0, name + " has positive signed volume");
    assert.ok(
      [...edges.values()].every(
        (edge) => edge.count === 2 && edge.orientation === 0,
      ),
      name + " has no open or inconsistently wound edges",
    );
  }
});

test("moving, rotating and disabling the section leaves source materials and geometry intact", () => {
  const scene = new THREE.Scene();
  const a = new THREE.Mesh(
    closedGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.MeshStandardMaterial({ color: "#232326" }),
  );
  a.name = "shell_top";
  const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), a.material.clone());
  b.name = "bottom_plate";
  scene.add(a, b);
  scene.updateMatrixWorld(true);
  const section = new SectionCut(scene, [a, b]),
    color = a.material.color.clone(),
    positions = Array.from(a.geometry.attributes.position.array);
  const cut = {
    enabled: true,
    position: [0.2, 0, 0],
    rotation: [0, -90, 0],
    target: "shell_top",
    cap: true,
  };
  section.update(cut, true);
  assert.ok(
    Math.abs(section.plane.distanceToPoint(new THREE.Vector3(0.2, 0, 0))) <
      1e-8,
  );
  assert.equal(section.records[0].cap.visible, true);
  assert.equal(section.records[1].cap.visible, false);
  cut.rotation = [30, -45, 20];
  cut.position = [0.1, 0.2, 0.3];
  a.position.y = 0.08;
  scene.updateMatrixWorld(true);
  section.update(cut);
  assert.ok(
    Math.abs(
      section.plane.distanceToPoint(new THREE.Vector3(...cut.position)),
    ) < 1e-8,
  );
  assert.deepEqual(
    section.records[0].cap.matrix.elements,
    a.matrixWorld.elements,
  );
  cut.enabled = false;
  section.update(cut);
  assert.equal(a.material.clippingPlanes.length, 0);
  assert.equal(section.records[0].cap.visible, false);
  assert.ok(a.material.color.equals(color));
  assert.equal(a.material.opacity, 1);
  assert.deepEqual(Array.from(a.geometry.attributes.position.array), positions);
});

function closedGeometry(geometry) {
  geometry.deleteAttribute("normal");
  geometry.deleteAttribute("uv");
  return mergeVertices(geometry);
}

test("geometric caps fill the wall and keep enclosed holes open", () => {
  const torus = closedGeometry(new THREE.TorusGeometry(1, 0.25, 24, 96));
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.001);
  const { points, faces } = createContourReader(torus)(plane);
  let area = 0;
  for (let i = 0; i < faces.length; i += 3) {
    const [a, b, c] = faces.slice(i, i + 3).map((id) => points[id]);
    for (const vertex of [a, b, c])
      assert.ok(Math.abs(plane.distanceToPoint(vertex)) < 1e-8);
    const cross = b.clone().sub(a).cross(c.clone().sub(a));
    assert.ok(cross.z <= 1e-8, "caps face the discarded half-space");
    area += cross.length() / 2;
  }
  assert.ok(
    Math.abs(area - Math.PI) < 0.03,
    "solid ring area is pi, with its inner void left open",
  );
});
