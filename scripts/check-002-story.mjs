import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import { SectionCut } from "../public/cases/erste002/story-section.js";
import {
  DEFAULT_STORY,
  clone,
  validateStory,
  sampleStory,
  cueStrength,
  captionAt,
} from "../public/cases/erste002/story-timeline.js";
test("published JSON validates and agrees with default fallback", () =>
  assert.deepEqual(
    validateStory(
      JSON.parse(
        fs.readFileSync(
          new URL("../public/cases/erste002/story.json", import.meta.url),
        ),
      ),
    ),
    validateStory(DEFAULT_STORY),
  ));
test("all channels are reversible over the full scroll domain", () => {
  const original = JSON.stringify(DEFAULT_STORY),
    forward = [];
  for (let i = 0; i <= 1000; i++)
    forward.push(sampleStory(DEFAULT_STORY, i / 1000));
  for (let i = 1000; i >= 0; i--)
    assert.deepEqual(sampleStory(DEFAULT_STORY, i / 1000), forward[i]);
  assert.equal(JSON.stringify(DEFAULT_STORY), original);
});
test("every authored keyframe is hit exactly", () => {
  for (const f of DEFAULT_STORY.keyframes)
    assert.deepEqual(sampleStory(DEFAULT_STORY, f.at), f);
});
test("cue has two pulses only, ends before focus lights begin, zero outside", () => {
  const f = DEFAULT_STORY.keyframes.find((f) => f.cue.enabled),
    c = f.cue;
  assert.equal(cueStrength(DEFAULT_STORY, c.start, "shell_top"), 0);
  assert.ok(
    Math.abs(
      cueStrength(
        DEFAULT_STORY,
        c.start + (c.end - c.start) * 0.25,
        "shell_top",
      ) - c.strength,
    ) < 1e-10,
  );
  assert.ok(
    Math.abs(
      cueStrength(
        DEFAULT_STORY,
        c.start + (c.end - c.start) * 0.75,
        "shell_top",
      ) - c.strength,
    ) < 1e-10,
  );
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    for (const part of ["shell_top", "button_cover", "bottom_plate"]) {
      const glow = cueStrength(DEFAULT_STORY, p, part);
      if (part !== "shell_top" || p <= c.start || p >= c.end)
        assert.equal(glow, 0);
      if (glow > 0)
        assert.equal(sampleStory(DEFAULT_STORY, p).lights.focus.intensity, 0);
    }
  }
});
test("restoration keeps geometry intact and light focus dims other lights", () => {
  const start = sampleStory(DEFAULT_STORY, 0),
    cut = sampleStory(DEFAULT_STORY, 0.58),
    end = sampleStory(DEFAULT_STORY, 1);
  assert.deepEqual(start.cut, end.cut);
  assert.ok(cut.lights.focus.intensity > 0);
  assert.ok(cut.lights.key.intensity < start.lights.key.intensity);
  assert.ok(cut.ambient < start.ambient);
  assert.notDeepEqual(cut.cut.position, start.cut.position);
});
test("caption opacity is driven by progress, both endpoints readable", () => {
  assert.equal(captionAt(DEFAULT_STORY, 0).opacity, 1);
  assert.equal(captionAt(DEFAULT_STORY, 1).opacity, 1);
  assert.equal(captionAt(DEFAULT_STORY, 0.25), null);
  assert.equal(captionAt(DEFAULT_STORY, 0.28).opacity, 0);
});
test("invalid imports never enter a render loop", () => {
  for (const mutate of [
    (s) => (s.keyframes[1].at = 0),
    (s) => (s.keyframes[0].camera.fov = NaN),
    (s) => (s.keyframes[0].cut.rotation = [0]),
    (s) => (s.keyframes[0].lights.focus.intensity = -1),
    (s) => (s.keyframes[0].cue.end = 0),
    (s) => (s.model = "https://elsewhere.invalid/model.glb"),
    (s) => (s.keyframes[0].focus = "ribs"),
    (s) => (s.keyframes[0].cut.enabled = "true"),
  ]) {
    const s = clone(DEFAULT_STORY);
    mutate(s);
    assert.throws(() => validateStory(s));
  }
});
test("moving, rotating and disabling the section leaves source materials and geometry intact", () => {
  const scene = new THREE.Scene();
  const a = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
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
    section.records[0].proxies[0].matrix.elements,
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
