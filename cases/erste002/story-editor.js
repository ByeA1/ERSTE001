import { clone, validateStory } from "./story-timeline.js";
const KEY = "erste002-director-v1";
const names = { key: "主光", rim: "轮廓光", focus: "聚焦光" };
export function createEditor(api) {
  const panel = document.querySelector("#editor"),
    toggle = document.querySelector("#editor-toggle");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(location.hostname))
    return { update() {} };
  toggle.hidden = false;
  panel.innerHTML = `<h2>ERSTE002 / 演出编辑器</h2><p>调整后点击「保存关键帧」。滚动或拖动进度返回轨道；自由查看可拖拽取景。</p>
    <label>演出进度 <input id="ed-progress" aria-label="演出进度" type="range" min="0" max="1" step=".001"></label>
    <label>精确进度 0–1 <input id="ed-position" aria-label="精确进度" type="number" min="0" max="1" step=".001" value="0"></label>
    <label>关键帧 <select id="ed-frames" aria-label="关键帧"></select></label>
    <div class="actions"><button id="ed-save">保存关键帧</button><button id="ed-delete">删除当前帧</button><button id="ed-follow">返回滚动轨道</button></div>
    <div class="actions"><button id="ed-local">保存本机草稿</button><button id="ed-load">读取本机草稿</button><button id="ed-export">导出 JSON</button><button id="ed-import">导入 JSON</button></div>
    <input id="ed-file" aria-label="导入演出 JSON" type="file" accept=".json,application/json" hidden>
    <p id="editor-status" role="status">默认轨道只是剖切技术演示，正式分镜待编辑。</p><div class="readout" id="ed-readout"></div><div id="ed-fields"></div>`;
  const $ = (id) => panel.querySelector("#" + id),
    fields = $("ed-fields");
  let draft = api.capture(),
    editing = false,
    last = -1;
  const inputs = [];
  const message = (s) => ($("editor-status").textContent = s);
  function section(title) {
    const d = document.createElement("details");
    d.open = title === "镜头";
    const s = document.createElement("summary");
    s.textContent = title;
    d.append(s);
    fields.append(d);
    return d;
  }
  function value(path, obj = draft) {
    return path.reduce((o, k) => o[k], obj);
  }
  function field(host, label, path, type = "number", options = {}) {
    const row = document.createElement("label"),
      span = document.createElement("span");
    span.textContent = label;
    const input = document.createElement(
      type === "select" ? "select" : "input",
    );
    input.setAttribute("aria-label", label);
    if (type === "select")
      for (const [v, t] of options.choices) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = t;
        input.append(o);
      }
    else {
      input.type = type;
      input.step = String(options.step ?? 0.001);
      if (options.min !== undefined) input.min = options.min;
      if (options.max !== undefined) input.max = options.max;
    }
    row.append(span, input);
    host.append(row);
    inputs.push({ input, path, type });
    input.addEventListener("input", () => {
      if (!editing) {
        draft = api.capture();
        editing = true;
      }
      let o = draft;
      for (const k of path.slice(0, -1)) o = o[k];
      let v =
        type === "checkbox"
          ? input.checked
          : type === "number"
            ? Number(input.value)
            : input.value;
      if (type === "number") {
        if (!Number.isFinite(v)) return;
        v = Math.min(
          options.max ?? Infinity,
          Math.max(options.min ?? -Infinity, v),
        );
      }
      o[path.at(-1)] = v;
      api.setDraft(clone(draft));
      message("预览已调整；保存关键帧后进入轨道。");
    });
    return input;
  }
  function vec(host, label, path, rotation = false) {
    for (let i = 0; i < 3; i++)
      field(host, label + " " + "XYZ"[i], [...path, i], "number", {
        step: rotation ? 1 : 0.005,
        min: rotation ? -360 : -3,
        max: rotation ? 360 : 3,
      });
  }
  let d = section("镜头");
  vec(d, "镜头位置", ["camera", "position"]);
  vec(d, "观察目标", ["camera", "target"]);
  field(d, "视野 FOV", ["camera", "fov"], "number", {
    min: 10,
    max: 110,
    step: 1,
  });
  for (const name of Object.keys(names)) {
    d = section(names[name]);
    vec(d, names[name] + "位置", ["lights", name, "position"]);
    vec(d, names[name] + "目标", ["lights", name, "target"]);
    field(d, names[name] + "强度", ["lights", name, "intensity"], "number", {
      min: 0,
      max: 100,
      step: 0.1,
    });
    field(d, names[name] + "颜色", ["lights", name, "color"], "color");
    field(d, names[name] + "聚光角度", ["lights", name, "angle"], "number", {
      min: 1,
      max: 89,
      step: 1,
    });
  }
  d = section("环境与剖切");
  field(d, "环境光强度", ["ambient"], "number", { min: 0, max: 5, step: 0.05 });
  field(d, "启用剖切", ["cut", "enabled"], "checkbox");
  field(d, "实体截面封口", ["cut", "cap"], "checkbox");
  field(d, "剖切目标", ["cut", "target"], "select", {
    choices: [
      ["all", "全部部件"],
      ["shell_top", "上盖"],
      ["button_cover", "按键盖"],
      ["bottom_plate", "底板"],
    ],
  });
  vec(d, "切面位置", ["cut", "position"]);
  vec(d, "切面旋转", ["cut", "rotation"], true);
  const helper = document.createElement("label");
  helper.innerHTML =
    '<span>显示切面辅助线</span><input type="checkbox" aria-label="显示切面辅助线">';
  d.append(helper);
  helper.lastChild.addEventListener("change", () =>
    api.setHelper(helper.lastChild.checked),
  );
  d = section("部件与提示");
  field(d, "聚焦部件", ["focus"], "select", {
    choices: [
      ["", "整体"],
      ["shell_top", "上盖"],
      ["button_cover", "按键盖"],
      ["bottom_plate", "底板"],
    ],
  });
  const aim = document.createElement("button");
  aim.textContent = "聚光灯对准所选部件";
  d.append(aim);
  aim.onclick = () => {
    draft = api.capture();
    api.aim(draft.focus);
    draft = api.capture();
    editing = true;
    sync();
  };
  field(d, "装配展开", ["explode"], "number", { min: 0, max: 1, step: 0.01 });
  field(d, "启用两次提示闪烁", ["cue", "enabled"], "checkbox");
  field(d, "闪烁开始进度", ["cue", "start"], "number", {
    min: 0,
    max: 1,
    step: 0.005,
  });
  field(d, "闪烁结束进度", ["cue", "end"], "number", {
    min: 0,
    max: 1,
    step: 0.005,
  });
  field(d, "提示自发光强度", ["cue", "strength"], "number", {
    min: 0,
    max: 5,
    step: 0.1,
  });
  d = section("双语文字轨道");
  d.insertAdjacentHTML(
    "beforeend",
    '<p>文字独立于机位。修改 JSON 数组，可增减文字与渐隐区间。</p><textarea id="ed-captions" aria-label="双语文字轨道 JSON"></textarea><button id="ed-captions-save">应用文字轨道</button>',
  );
  $("ed-captions-save").onclick = () => {
    try {
      const next = clone(api.story());
      next.captions = JSON.parse($("ed-captions").value);
      api.replace(validateStory(next));
      message("文字轨道已应用。");
    } catch (e) {
      message(e.message);
    }
  };
  function sync() {
    for (const { input, path, type } of inputs) {
      const v = value(path);
      if (type === "checkbox") input.checked = v;
      else input.value = typeof v === "number" ? Number(v.toFixed(4)) : v;
    }
  }
  function refresh() {
    const select = $("ed-frames");
    select.replaceChildren();
    for (const f of api.story().keyframes) {
      const o = document.createElement("option");
      o.value = f.at;
      o.textContent = (f.at * 100).toFixed(1) + "% · " + (f.focus || "整体");
      select.append(o);
    }
    $("ed-captions").value = JSON.stringify(api.story().captions, null, 2);
  }
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    document.body.dataset.editor = String(!panel.hidden);
    if (!panel.hidden) {
      draft = api.capture();
      sync();
      refresh();
    }
  };
  $("ed-progress").oninput = () => {
    editing = false;
    api.seek(Number($("ed-progress").value));
    draft = api.capture();
    sync();
  };
  $("ed-position").oninput = () => {
    const v = Number($("ed-position").value);
    if (!Number.isFinite(v)) return;
    editing = false;
    api.seek(v);
    draft = api.capture();
    sync();
  };
  $("ed-frames").onchange = () => {
    const p = Number($("ed-frames").value);
    api.seek(p);
    draft = clone(api.story().keyframes.find((f) => f.at === p));
    api.setDraft(draft);
    editing = true;
    sync();
  };
  $("ed-follow").onclick = () => {
    editing = false;
    api.follow();
    message("已返回滚动轨道。");
  };
  $("ed-save").onclick = () => {
    try {
      const next = clone(api.story()),
        f = api.capture();
      f.at = api.progress();
      const idx = next.keyframes.findIndex(
        (k) => Math.abs(k.at - f.at) < 0.0005,
      );
      if (idx >= 0) {
        f.at = next.keyframes[idx].at;
        next.keyframes[idx] = f;
      } else next.keyframes.push(f);
      next.keyframes.sort((a, b) => a.at - b.at);
      api.replace(validateStory(next));
      refresh();
      message("关键帧已保存至内存。可继续保存本机或导出 JSON。");
    } catch (e) {
      message(e.message);
    }
  };
  $("ed-delete").onclick = () => {
    const next = clone(api.story()),
      p = Number($("ed-frames").value);
    if (p === 0 || p === 1) {
      message("首尾端点不能删除。");
      return;
    }
    next.keyframes = next.keyframes.filter((f) => f.at !== p);
    api.replace(validateStory(next));
    refresh();
    message("关键帧已删除。");
  };
  $("ed-local").onclick = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(api.story()));
      message("已保存本机草稿；正式页面不会自动读取它。");
    } catch (e) {
      message("草稿未保存：" + e.message);
    }
  };
  $("ed-load").onclick = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) throw Error("没有本机草稿");
      api.replace(validateStory(JSON.parse(raw)));
      editing = false;
      refresh();
      message("本机草稿已读取。");
    } catch (e) {
      message(e.message);
    }
  };
  $("ed-export").onclick = () => {
    const blob = new Blob([JSON.stringify(api.story(), null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "erste002-story.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message("已导出 JSON。将文件替换 story.json 可发布此轨道。");
  };
  $("ed-import").onclick = () => $("ed-file").click();
  $("ed-file").onchange = async () => {
    try {
      const file = $("ed-file").files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) throw Error("文件超过 1 MB");
      api.replace(validateStory(JSON.parse(await file.text())));
      editing = false;
      refresh();
      message("JSON 已导入，尚未修改服务器文件。");
    } catch (e) {
      message(e.message);
    } finally {
      $("ed-file").value = "";
    }
  };
  refresh();
  sync();
  if (new URLSearchParams(location.search).get("editor") === "1")
    toggle.click();
  return {
    update(p, stats) {
      if (panel.hidden) return;
      const rounded = Math.round(p * 1000);
      if (rounded !== last && !editing) {
        draft = api.capture();
        sync();
      }
      last = rounded;
      $("ed-progress").value = p;
      if (document.activeElement !== $("ed-position"))
        $("ed-position").value = p.toFixed(3);
      $("ed-readout").textContent =
        `进度 ${(p * 100).toFixed(1)}% · ${stats.mode}\n聚焦灯 ${stats.light.toFixed(2)} · 提示发光 ${stats.emissive.toFixed(3)}\n切面 ${stats.cut} · ${stats.triangles.toLocaleString()} 三角面`;
    },
  };
}
