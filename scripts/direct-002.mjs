import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  checkLocks,
  compileStory,
} from "../public/cases/erste002/story-segments.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const file = resolve(root, "public/cases/erste002/story.json");
const history = resolve(root, ".audit/002-director/history");
const [command = "list", argument, side = "before"] = process.argv.slice(2);
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const format = (value) => JSON.stringify(value, null, 2) + "\n";
const original = readFileSync(file, "utf8");
const document = JSON.parse(original);

function validate(value) {
  if (value.version !== 2)
    throw new Error("应用到正式演出须使用分段版 JSON（version 2）。");
  return compileStory(value);
}
function segment(id) {
  const found = document.segments.find((item) => item.id === id);
  if (!found) throw new Error("找不到片段：" + id);
  return found;
}
function revisionId() {
  return (
    new Date().toISOString().replace(/[:.]/g, "-") +
    "-" +
    randomUUID().slice(0, 8)
  );
}
function record(before, after, description) {
  mkdirSync(history, { recursive: true });
  const id = revisionId();
  writeFileSync(
    resolve(history, id + ".json"),
    format({ before, after, description }),
    { flag: "wx" },
  );
  return id;
}
function save(value, description) {
  validate(JSON.parse(value));
  if (value === original) {
    console.log("演出数据无变化。");
    return;
  }
  const id = record(original, value, description);
  const temporary = file + "." + id + ".tmp";
  writeFileSync(temporary, value, { flag: "wx" });
  if (readFileSync(file, "utf8") !== original)
    throw new Error("story.json 同时被修改。已保留备份，请重新执行。");
  renameSync(temporary, file);
  console.log(description + " · revision " + id);
}
function loadRevision(id) {
  if (!/^\d{4}-[0-9TZ-]+-[0-9a-f]{8}$/.test(id ?? ""))
    throw new Error("请提供 history 中的修订 ID。");
  return read(resolve(history, id + ".json"));
}
function revisions() {
  return existsSync(history)
    ? readdirSync(history)
        .filter((name) => name.endsWith(".json"))
        .sort()
        .reverse()
        .map((name) => name.slice(0, -5))
    : [];
}
try {
  const compiled = validate(document);
  if (command === "list") {
    console.table(
      compiled.ranges.map((range, i) => ({
        id: range.id,
        locked: range.locked,
        duration: document.segments[i].duration,
        start: range.start.toFixed(3),
        hold: range.hold.toFixed(3),
        end: range.end.toFixed(3),
        shots: document.segments[i].shots.map((shot) => shot.id).join(", "),
      })),
    );
  } else if (command === "check") {
    if (argument) validate(read(argument));
    console.log("演出文件有效。");
  } else if (command === "apply") {
    const patch = read(argument);
    const before = JSON.parse(original);
    if (patch.segment) {
      const target = segment(patch.segment);
      if (target.locked) throw new Error(target.id + " 已锁定。");
      const keys = Object.keys(patch.set ?? {});
      if (
        keys.length === 0 ||
        keys.some(
          (key) =>
            !["title", "duration", "hold", "beats", "shots"].includes(key),
        )
      )
        throw new Error("set 只接受 title、duration、hold、beats、shots。");
      Object.assign(target, patch.set);
    } else {
      if (!patch.insert || typeof patch.after !== "string")
        throw new Error("新增片段需要 after 和 insert。");
      const previous = segment(patch.after);
      document.segments.splice(
        document.segments.indexOf(previous) + 1,
        0,
        patch.insert,
      );
    }
    validate(document);
    checkLocks(before, document);
    save(
      format(document),
      patch.segment ? "修改 " + patch.segment : "新增 " + patch.insert.id,
    );
  } else if (command === "replace") {
    const value = read(argument);
    validate(value);
    checkLocks(document, value);
    save(format(value), "应用编辑器导出");
  } else if (command === "lock" || command === "unlock") {
    segment(argument).locked = command === "lock";
    save(format(document), command + " " + argument);
  } else if (command === "backup") {
    console.log("备份 " + record(original, original, "手动备份"));
  } else if (command === "history") {
    for (const id of revisions())
      console.log(id + "  " + loadRevision(id).description);
  } else if (command === "undo") {
    const id =
      argument ??
      revisions().find((entry) => {
        const item = loadRevision(entry);
        return (
          item.before !== item.after &&
          item.after === original &&
          !item.description.startsWith("撤销 ")
        );
      });
    if (!id) throw new Error("当前文件未匹配可撤销的修订。");
    const item = loadRevision(id);
    if (item.after !== original)
      throw new Error("文件已更改。请使用 restore 明确指定恢复点。");
    save(item.before, "撤销 " + id);
  } else if (command === "restore") {
    if (!["before", "after"].includes(side))
      throw new Error("恢复位置须为 before 或 after。");
    save(loadRevision(argument)[side], "恢复 " + argument + " " + side);
  } else {
    throw new Error(
      "用法：list | check [file] | apply patch.json | replace draft.json | lock/unlock <id> | backup | history | undo [revision] | restore <revision> [before|after]",
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
