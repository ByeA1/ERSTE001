import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { StoryAssembly } from "../public/cases/erste002/story-assembly.js";
import {
  LIGHT_NAMES,
  LIGHT_PRESETS,
} from "../public/cases/erste002/story-lighting.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createContourReader } from "../public/cases/erste002/section-contours.js";
import { SectionCut } from "../public/cases/erste002/story-section.js";
import { createSurfaceGeometry } from "../public/cases/erste002/surface-normals.js";
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
  sampleStill,
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
      "structure-and-assembly",
      "structural-reinforcement",
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
    assert.deepEqual(sampleStory(story, frame.at).camera, frame.camera);
});

const progress = (index, local) => {
  const { start, end } = story.ranges[index];
  return start + local * (end - start);
};
const sample = (index, local) => sampleStory(story, progress(index, local));

test("assembly hands off at full explosion and the last hero restores all five groups", () => {
  const opening = sampleStory(story, story.ranges[0].hold);
  const exploded = sampleStory(story, story.ranges[2].hold);
  const reinforcement = sample(3, 0);
  const cut = sample(3, 0.36);
  const final = sampleStory(story, 1);
  assert.equal(exploded.explode, 1);
  assert.deepEqual(reinforcement.assembly, exploded.assembly);
  assert.deepEqual(reinforcement.camera, exploded.camera);
  assert.equal(reinforcement.explode, exploded.explode);
  assert.equal(cut.cut.target, "shell_top");
  assert.equal(cut.cut.enabled && cut.cut.cap, true);
  assert.deepEqual(cut.cut.rotation, [0, -90, 0]);
  assert.ok(cut.lights.focus.intensity > 0);
  assert.ok(cut.lights.key.intensity < opening.lights.key.intensity);
  assert.ok(cut.lights.fill.intensity < opening.lights.fill.intensity);
  assert.ok(cut.lights.rim.intensity < opening.lights.rim.intensity);
  const buttons = sample(3, 0.81);
  assert.equal(buttons.isolate, "button_cover");
  assert.equal(buttons.explode, 1);
  assert.ok(buttons.assembly.button_cover.rotation[0] > 150);
  assert.deepEqual(final.assembly, opening.assembly);
  assert.deepEqual(final.cut, opening.cut);
  assert.equal(final.isolate, "");
  assert.equal(final.electronics, 0);
  assert.equal(final.explode, 0);
  assert.equal(final.lights.focus.intensity, 0);
});

test("lights interpolate across named rigs, and both authored cues have two isolated pulses", () => {
  assert.deepEqual(Object.keys(LIGHT_PRESETS), [
    "Studio",
    "Ergonomics",
    "Assembly",
    "Structural",
  ]);
  assert.ok(
    LIGHT_NAMES.every((name) => Object.hasOwn(sample(2, 0.86).lights, name)),
  );
  const a = sample(2, 0).lights.fill.intensity;
  const b = sample(2, 0.24).lights.fill.intensity;
  assert.ok(b > a);
  assert.ok(
    Math.abs(sample(2, 0.12).lights.fill.intensity - (a + b) / 2) < 1e-8,
  );
  const pulses = story.keyframes.filter((frame) => frame.cue.enabled);
  assert.deepEqual(
    pulses.map((frame) => frame.focus),
    ["shell_top", "button_cover"],
  );
  for (const frame of pulses) {
    const { start, end, strength } = frame.cue;
    for (const t of [0.25, 0.75]) {
      const p = start + t * (end - start);
      assert.ok(Math.abs(cueStrength(story, p, frame.focus) - strength) < 1e-9);
      assert.equal(sampleStory(story, p).lights.focus.intensity, 0);
    }
    assert.ok(cueStrength(story, (start + end) / 2, frame.focus) < 1e-9);
    assert.equal(cueStrength(story, end, frame.focus), 0);
  }
});

test("captions enter during the shot while reduced motion samples the held view", () => {
  assert.equal(story.captions.length, 11);
  for (const beat of story.captions) {
    assert.ok(beat.arrive > beat.start);
    assert.ok(beat.reveal > beat.start && beat.reveal < beat.arrive);
    assert.equal(captionAt(story, (beat.start + beat.reveal) / 2), null);
    assert.ok(captionAt(story, (beat.reveal + beat.arrive) / 2).opacity > 0);
    const p = (beat.arrive + beat.end) / 2;
    const visible = captionAt(story, p);
    assert.equal(visible.title[0], beat.title[0]);
    assert.ok(visible.opacity > 0.7);
    assert.deepEqual(
      sampleStory(story, p).camera,
      sampleStill(story, p).camera,
    );
    const arrival = sampleStory(story, beat.arrive);
    const hold = sampleStory(story, p);
    for (const channel of [
      "assembly", "explode", "cut", "isolate", "lights", "reflection",
    ])
      assert.deepEqual(hold[channel], arrival[channel], `${beat.title[0]} ${channel}`);
  }
});

test("opening, section reveal and assembly return stage their motion and lighting separately", () => {
  const silhouette = sample(0, 0.2);
  const sweep = sample(0, 0.46);
  assert.deepEqual(silhouette.camera, sample(0, 0).camera);
  assert.ok(silhouette.lights.key.intensity < 0.2);
  assert.ok(sweep.lights.key.intensity > 4);
  assert.ok(silhouette.lights.rim.intensity > sweep.lights.rim.intensity * 0.5);
  assert.deepEqual(sample(2, 0.53).camera, sample(2, 0.73).camera);
  assert.equal(sample(2, 0.53).explode, 0);
  assert.equal(sample(2, 0.73).explode, 1);

  const cutSweepStart = sample(3, 0.315);
  const cutSweepEnd = sample(3, 0.364);
  assert.deepEqual(cutSweepStart.camera, cutSweepEnd.camera);
  assert.deepEqual(cutSweepStart.cut, cutSweepEnd.cut);
  assert.notDeepEqual(cutSweepStart.lights.focus.position, cutSweepEnd.lights.focus.position);
  assert.equal(captionAt(story, progress(3, 0.364)).annotation, "section-rib");

  const shellSeated = sample(3, 0.945);
  const wheelSeated = sample(3, 0.955);
  const complete = sample(3, 0.965);
  const pulledBack = sample(3, 0.983);
  assert.equal(shellSeated.explode, 0);
  assert.ok(shellSeated.assembly.wheel.offset[1] > 0);
  assert.equal(wheelSeated.assembly.wheel.offset[1], 0);
  assert.ok(wheelSeated.assembly.button_cover.offset[1] > 0);
  assert.equal(complete.assembly.button_cover.offset[1], 0);
  assert.deepEqual(complete.camera, shellSeated.camera);
  assert.notDeepEqual(pulledBack.camera, complete.camera);
  assert.deepEqual(pulledBack.lights, complete.lights);
  assert.notDeepEqual(sample(3, 1).lights, pulledBack.lights);
});

test("the studio reflection moves at a held camera and edits independently of direct lighting", () => {
  const start = sample(1, 0.17);
  const end = sample(1, 0.22);
  assert.deepEqual(start.camera, end.camera);
  assert.notEqual(start.reflection.yaw, end.reflection.yaw);

  const next = structuredClone(data);
  const key = next.segments[1].lightingTrack.find((frame) => frame.at === 0.22);
  key.reflection.yaw = 92;
  const edited = sampleStory(compileStory(next), progress(1, 0.22));
  assert.equal(edited.reflection.yaw, 92);
  assert.deepEqual(edited.lights, end.lights);
  key.reflection.intensity = -1;
  assert.throws(() => compileStory(next), /环境反射强度/);
});

test("the authored shell cut generates a real cap, and extraction round-trips Rev 3 group transforms", async () => {
  const bytes = fs.readFileSync(
    new URL("../public/cases/erste002/assets/shell-full.glb", import.meta.url),
  );
  const { scene: model } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  model.rotation.x = -Math.PI / 2;
  const size = new THREE.Box3()
    .setFromObject(model)
    .getSize(new THREE.Vector3());
  model.scale.setScalar(0.3 / Math.max(size.x, size.y, size.z));
  model.position.sub(
    new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()),
  );
  const rig = new StoryAssembly(model);
  const state = () =>
    [...rig.actors.values()].map(({ group }) => ({
      position: group.position.toArray(),
      rotation: group.quaternion.toArray(),
      visible: group.visible,
    }));
  const rest = state();
  rig.apply(sample(2, 0.9));
  const exploded = state();
  rig.apply(sample(3, 0.82), "button_cover");
  const buttons = rig.actors.get("button_cover").group;
  assert.ok(buttons.quaternion.angleTo(new THREE.Quaternion()) > 2.5);
  assert.equal(
    [...rig.actors.values()].filter(({ group }) => group.visible).length,
    1,
  );
  rig.apply(sample(2, 0.9));
  assert.deepEqual(state(), exploded);
  const shell = model.getObjectByName("Mesh_Shell");
  shell.name = "shell_top";
  const section = new SectionCut(new THREE.Scene(), [shell]);
  const frame = sample(3, 0.36);
  rig.apply(frame);
  model.updateMatrixWorld(true);
  const capFaces = section.update(frame.cut);
  assert.ok(capFaces > 1000);
  const source = shell.geometry;
  shell.geometry = createSurfaceGeometry(source);
  assert.equal(shell.geometry.index.count, source.index.count);
  assert.ok(shell.geometry.attributes.position.count > source.attributes.position.count);
  const smoothSection = new SectionCut(new THREE.Scene(), [shell], new Map([[shell, source]]));
  assert.equal(smoothSection.update(frame.cut), capFaces);
  rig.apply(frame, "button_cover");
  assert.equal(section.update(frame.cut), 0);
  rig.apply(sampleStory(story, 1));
  assert.deepEqual(state(), rest);
  assert.equal(section.update(sampleStory(story, 1).cut), 0);
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
  bridge.lightingTrack = [
    { ...clone(bridge.lightingTrack.at(-1)), at: 0 },
    { ...clone(bridge.lightingTrack.at(-1)), at: 1 },
  ];
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
    (s) => (s.poses["side-cut-solid"].cut.rotation = [0]),
    (s) => (s.poses.cover.lights = { key: { intensity: -1 } }),
    (s) => (s.model = "https://elsewhere.invalid/model.glb"),
    (s) => (s.poses.cover.focus = "ribs"),
    (s) => (s.poses.cover.lighting = "unknown"),
    (s) => (s.poses["side-cut-solid"].cut.enabled = "true"),
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

test('independent lighting reveals preserve still cameras, pause, validation and editing', () => {
  const before = sample(1, .18), after = sample(1, .22);
  assert.deepEqual(before.camera, after.camera);
  assert.notDeepEqual(before.lights.key.position, after.lights.key.position);
  assert.deepEqual(sample(1,.23).lights, sample(1,.3).lights);
  assert.deepEqual(validateStory(story).lightingTrack, story.lightingTrack);
  const at=progress(1,.25), frame=sampleStory(story,at);
  frame.lights.key.intensity=3.7;
  const edit=editFrame(data,story,at,frame,true);
  assert.deepEqual(edit.segments[1].shots,data.segments[1].shots);
  assert.equal(sampleStory(compileStory(edit),at).lights.key.intensity,3.7);
  assert.deepEqual(edit.segments[2],data.segments[2]);
  assert.deepEqual(editFrame(edit,compileStory(edit),at,null,true),data);
  const invalid=clone(data);
  invalid.segments[1].lightingTrack[1].lights.key.angle=NaN;
  assert.throws(()=>compileStory(invalid));
  const locked=clone(data); locked.segments[1].locked=true;
  assert.throws(()=>editFrame(locked,compileStory(locked),at,frame,true),/锁定/);
});
