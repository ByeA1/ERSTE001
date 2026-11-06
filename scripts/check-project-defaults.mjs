import test from "node:test";
import assert from "node:assert/strict";
import { fillMissingProjectOverviews } from "../src/project-records.mjs";
test("a registry-only future project receives a real overview and export record", () => {
  const project = {
    id: "new-case",
    number: "099",
    title: "NEW099",
    page: "/cases/new-case/index.html",
    status: "PROTOTYPE",
    summary: "Authored content",
  };
  const [record] = fillMissingProjectOverviews([], [project]);
  assert.equal(record.id, "X-099");
  assert.equal(record.projectId, "new-case");
  assert.equal(record.source, project.page);
  assert.equal(record.abstract, project.summary);
  assert.equal(record.clearance, project.status);
  assert.deepEqual(record.findings, []);
});
test("authored overviews and input arrays are preserved without duplicates", () => {
  const record = {
    id: "X-001",
    projectId: "first",
    title: "FIRST",
    abstract: "Keep original",
  };
  const records = [record],
    projects = [{ id: "first", number: "001", title: "FIRST" }];
  const result = fillMissingProjectOverviews(records, projects);
  assert.equal(result.length, 1);
  assert.equal(result[0], record);
  assert.equal(records.length, 1);
});
test("unsafe export identifiers and collisions fail before writing", () => {
  assert.throws(
    () => fillMissingProjectOverviews([], [{ id: "bad", number: "../oops" }]),
    /Invalid/,
  );
  assert.throws(
    () =>
      fillMissingProjectOverviews(
        [{ id: "X-099" }],
        [{ id: "new", number: "099" }],
      ),
    /collision/,
  );
});
