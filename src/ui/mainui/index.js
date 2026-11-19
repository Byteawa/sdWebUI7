const $ = id => document.getElementById(id);
const statusEl = $("status");
const previewEl = $("preview");
const goBtn = $("go");

// ---------- 主题控制 ----------
const THEME_KEY = "sd-ui-theme";
const themeButtons = document.querySelectorAll("[data-theme-set]");
const htmlEl = document.documentElement;

function applyTheme(mode) {
  if (mode === "system") {
    htmlEl.removeAttribute("data-theme");
    localStorage.removeItem(THEME_KEY);
  } else {
    htmlEl.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_KEY, mode);
  }
  themeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.themeSet === mode));
}
const savedTheme = localStorage.getItem(THEME_KEY);
applyTheme(savedTheme || "system");
themeButtons.forEach(btn => btn.addEventListener("click", () => applyTheme(btn.dataset.themeSet)));

// ---------- 数字步进器逻辑 ----------
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const step = parseFloat(btn.dataset.step);
    const input = $(targetId);
    let val = parseFloat(input.value) || 0;
    val += step;
    val = Math.round(val * 1000) / 1000;
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    if (!isNaN(min) && val < min) val = min;
    if (!isNaN(max) && val > max) val = max;
    if (targetId === 'width' || targetId === 'height') {
      val = Math.round(val / 64) * 64;
    }
    input.value = val;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

// ---------- 已选 Lora 状态 ----------
let selectedLoras = [];

function saveLoras() {
  try { localStorage.setItem("sd-selected-loras", JSON.stringify(selectedLoras)); } catch(_) {}
}
function loadLorasState() {
  try {
    const raw = localStorage.getItem("sd-selected-loras");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) selectedLoras = arr.filter(x => x && typeof x.path === 'string');
    }
  } catch(_) { selectedLoras = []; }
}
loadLorasState();

function loraCount() {
  return selectedLoras.filter(l => l.enabled).length;
}

function normalizeLoraPath(path) {
  if (!path) return "";
  let norm = String(path).trim().replace(/\\/g, "/");
  norm = norm.replace(/^\.\//, "");
  norm = norm.replace(/\/+/g, "/");
  norm = norm.replace(/\/$/, "");
  return norm;
}

function addLora(path) {
  if (!path) return;
  const norm = normalizeLoraPath(path);
  if (!norm) return;
  if (selectedLoras.some(l => l.path.toLowerCase() === norm.toLowerCase())) {
    setStatus(`已在列表中 / Already in list：${norm}`);
    return;
  }
  selectedLoras.push({ path: norm, weight: 0.8, enabled: true });
  saveLoras();
  renderSelectedLoras();
  setStatus(`已添加 / Added：${norm}`);
}

function removeLora(idx) {
  if (idx < 0 || idx >= selectedLoras.length) return;
  const removed = selectedLoras.splice(idx, 1)[0];
  saveLoras();
  renderSelectedLoras();
  setStatus(`已移除 / Removed：${removed.path}`);
}

function toggleLora(idx) {
  if (idx < 0 || idx >= selectedLoras.length) return;
  selectedLoras[idx].enabled = !selectedLoras[idx].enabled;
  saveLoras();
  renderSelectedLoras();
}

function setLoraWeight(idx, val) {
  if (idx < 0 || idx >= selectedLoras.length) return;
  const v = parseFloat(val);
  selectedLoras[idx].weight = isNaN(v) ? 1.0 : v;
  saveLoras();
}

function adjustLoraWeight(idx, delta) {
  if (idx < 0 || idx >= selectedLoras.length) return;
  let v = selectedLoras[idx].weight + delta;
  v = Math.round(v * 1000) / 1000;
  if (v < 0) v = 0;
  if (v > 5) v = 5;
  selectedLoras[idx].weight = v;
  saveLoras();
  const weightInput = document.querySelector(`.selected-lora[data-idx="${idx}"] .sl-weight-input`);
  if (weightInput) weightInput.value = v;
}

function clearAllLoras() {
  if (selectedLoras.length === 0) return;
  selectedLoras = [];
  saveLoras();
  renderSelectedLoras();
  setStatus("已清空 Lora 列表 / Lora list cleared");
}

function renderSelectedLoras() {
  const list = $("selectedLorasList");
  const badge = $("loraCountBadge");
  const hint = $("loraListHint");
  const clearBtn = $("clearAllLoras");

  const enabledCount = loraCount();
  badge.textContent = `${enabledCount} / ${selectedLoras.length} 启用`;
  clearBtn.style.display = selectedLoras.length ? "inline" : "none";

  if (selectedLoras.length === 0) {
    list.innerHTML = '<div class="no-selected-hint">暂未选择 Lora / No Lora selected</div>';
    hint.textContent = "点击左侧 L 图标添加 / Click L icon to add";
    return;
  }
  hint.textContent = "启用 / 禁用 / 删除";

  list.innerHTML = "";
  selectedLoras.forEach((lora, idx) => {
    const row = document.createElement("div");
    row.className = "selected-lora" + (lora.enabled ? "" : " disabled");
    row.dataset.idx = idx;

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "sl-toggle" + (lora.enabled ? " enabled" : "");
    toggleBtn.title = lora.enabled ? "点击禁用 / Disable" : "点击启用 / Enable";
    toggleBtn.addEventListener("click", () => toggleLora(idx));
    row.appendChild(toggleBtn);

    const pathEl = document.createElement("span");
    pathEl.className = "sl-path";
    pathEl.textContent = lora.path;
    pathEl.title = lora.path;
    row.appendChild(pathEl);

    const weightGroup = document.createElement("div");
    weightGroup.className = "sl-weight-group";

    const minusBtn = document.createElement("button");
    minusBtn.className = "sl-weight-btn minus";
    minusBtn.textContent = "−";
    minusBtn.title = "减少权重 / Decrease weight";
    minusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      adjustLoraWeight(idx, -0.05);
    });
    weightGroup.appendChild(minusBtn);

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.step = "0.05";
    weightInput.className = "sl-weight-input";
    weightInput.value = lora.weight;
    weightInput.title = "权重 / Weight multiplier";
    weightInput.min = 0;
    weightInput.max = 5;
    weightInput.addEventListener("change", (e) => {
      let v = parseFloat(e.target.value);
      if (isNaN(v)) v = 1.0;
      if (v < 0) v = 0;
      if (v > 5) v = 5;
      e.target.value = v;
      setLoraWeight(idx, v);
    });
    weightInput.addEventListener("blur", (e) => {
      let v = parseFloat(e.target.value);
      if (isNaN(v)) v = 1.0;
      if (v < 0) v = 0;
      if (v > 5) v = 5;
      e.target.value = v;
      setLoraWeight(idx, v);
    });
    weightGroup.appendChild(weightInput);

    const plusBtn = document.createElement("button");
    plusBtn.className = "sl-weight-btn plus";
    plusBtn.textContent = "+";
    plusBtn.title = "增加权重 / Increase weight";
    plusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      adjustLoraWeight(idx, 0.05);
    });
    weightGroup.appendChild(plusBtn);

    row.appendChild(weightGroup);

    const delBtn = document.createElement("button");
    delBtn.className = "sl-btn danger";
    delBtn.title = "从列表删除 / Remove";
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path><path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>`;
    delBtn.addEventListener("click", () => removeLora(idx));
    row.appendChild(delBtn);

    list.appendChild(row);
  });
}

$("clearAllLoras").addEventListener("click", clearAllLoras);
renderSelectedLoras();

// ============================================================
// source 中英双语格式化
// ============================================================
function formatSource(source) {
  if (source === "Builtin") return "内置 / Builtin";
  if (source === "Custom") return "自定义 / Custom";
  return source || "?";
}

// ============================================================
// 确认弹窗
// ============================================================
const confirmOverlay = $("confirmOverlay");
const confirmBody = $("confirmBody");
const confirmOk = $("confirmOk");
const confirmCancel = $("confirmCancel");

let confirmCallback = null;

function showConfirm(message, onOk) {
  confirmBody.textContent = message;
  confirmCallback = onOk;
  confirmOverlay.classList.add("show");
}
function hideConfirm() {
  confirmOverlay.classList.remove("show");
  confirmCallback = null;
}
confirmCancel.addEventListener("click", hideConfirm);
confirmOverlay.addEventListener("click", (e) => { if (e.target === confirmOverlay) hideConfirm(); });
confirmOk.addEventListener("click", () => {
  const cb = confirmCallback;
  hideConfirm();
  if (typeof cb === "function") cb();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && confirmOverlay.classList.contains("show")) hideConfirm();
});

// ============================================================
// 预设预览弹窗（点击预设后弹出，含"添加"按钮）
// ============================================================
const presetPreviewOverlay = $("presetPreviewOverlay");
const presetPreviewTitle = $("presetPreviewTitle");
const presetPreviewMeta = document.querySelector("#presetPreviewBody .preset-preview-meta");
const presetPreviewContent = document.querySelector("#presetPreviewBody .preset-preview-content");
const presetPreviewAdd = $("presetPreviewAdd");
const presetPreviewCancel = $("presetPreviewCancel");

let pendingPreset = null;   // 暂存待确认的预设
let pendingKind = null;     // 'Positive' | 'Negative'

function showPresetPreview(kind, preset) {
  pendingKind = kind;
  pendingPreset = preset;

  const kindLabel = kind === "Positive" ? "正面 / Positive" : "负面 / Negative";
  presetPreviewTitle.textContent = `预览预设（${kindLabel}）/ Preview Preset`;

  presetPreviewMeta.innerHTML = `
    <strong>${escapeHtml(preset.name || "(未命名)")}</strong>
    <span style="margin-left:8px;">[${escapeHtml(formatSource(preset.source))}]</span>
  `;
  presetPreviewContent.textContent = preset.content || "";

  presetPreviewOverlay.classList.add("show");
}

function hidePresetPreview() {
  presetPreviewOverlay.classList.remove("show");
  pendingKind = null;
  pendingPreset = null;
}

presetPreviewCancel.addEventListener("click", hidePresetPreview);
presetPreviewOverlay.addEventListener("click", e => {
  if (e.target === presetPreviewOverlay) hidePresetPreview();
});
presetPreviewAdd.addEventListener("click", () => {
  if (!pendingPreset || !pendingKind) return;
  tryAddExtraPreset(pendingKind, pendingPreset);
  hidePresetPreview();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && presetPreviewOverlay.classList.contains("show")) {
    hidePresetPreview();
  }
});

// ============================================================
// 附加提示词状态（正面 / 负面），不持久化
// ============================================================
const extraState = {
  Positive: [],
  Negative: []
};

function extraEnabledCount(kind) {
  return extraState[kind].filter(x => x.enabled).length;
}

function addExtraPreset(kind, preset) {
  if (!preset || !preset.content) return;
  extraState[kind].push({
    name: preset.name || "(未命名)",
    source: preset.source || "",
    content: String(preset.content),
    enabled: true
  });
  renderExtraLists();
  setStatus(`已添加到附加${kind === 'Positive' ? '正面' : '负面'} / Added to Extra ${kind}`);
}

function tryAddExtraPreset(kind, preset) {
  if (!preset || !preset.content) return;
  const dup = extraState[kind].some(x => x.content === String(preset.content));
  if (dup) {
    const kindLabel = kind === 'Positive' ? '正面' : '负面';
    showConfirm(
      `此提示词已经添加在附加${kindLabel}列表中，是否再次添加？\nThis prompt is already added. Add again?`,
      () => addExtraPreset(kind, preset)
    );
    return;
  }
  addExtraPreset(kind, preset);
}

function removeExtra(kind, idx) {
  if (idx < 0 || idx >= extraState[kind].length) return;
  const removed = extraState[kind].splice(idx, 1)[0];
  renderExtraLists();
  setStatus(`已移除 / Removed：${removed.name}`);
}

function toggleExtra(kind, idx) {
  if (idx < 0 || idx >= extraState[kind].length) return;
  extraState[kind][idx].enabled = !extraState[kind][idx].enabled;
  renderExtraLists();
}

function clearExtra(kind) {
  if (extraState[kind].length === 0) return;
  extraState[kind] = [];
  renderExtraLists();
  setStatus(`已清空附加${kind === 'Positive' ? '正面' : '负面'} / Extra ${kind} cleared`);
}

function renderExtraLists() {
  renderExtraList("Positive");
  renderExtraList("Negative");
  updateExtraHint();
}

function renderExtraList(kind) {
  const listEl = kind === "Positive" ? $("extraPosList") : $("extraNegList");
  const badgeEl = kind === "Positive" ? $("extraPosBadge") : $("extraNegBadge");
  const arr = extraState[kind];
  const enabled = extraEnabledCount(kind);
  badgeEl.textContent = `${enabled} / ${arr.length} 启用`;

  if (arr.length === 0) {
    listEl.innerHTML = `<div class="extra-empty">暂无附加${kind === 'Positive' ? '正面' : '负面'} / No extra ${kind.toLowerCase()}</div>`;
    return;
  }

  listEl.innerHTML = "";
  arr.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "extra-item" + (item.enabled ? "" : " disabled");

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "sl-toggle" + (item.enabled ? " enabled" : "");
    toggleBtn.title = item.enabled ? "点击禁用 / Disable" : "点击启用 / Enable";
    toggleBtn.addEventListener("click", () => toggleExtra(kind, idx));
    row.appendChild(toggleBtn);

    const textEl = document.createElement("div");
    textEl.className = "ei-text";
    const nameLine = document.createElement("div");
    nameLine.textContent = `${item.name}${item.source ? ` [${formatSource(item.source)}]` : ""}`;
    nameLine.style.fontWeight = "600";
    const contentLine = document.createElement("div");
    contentLine.className = "ei-content";
    contentLine.textContent = item.content;
    contentLine.title = item.content;
    contentLine.style.overflow = "hidden";
    contentLine.style.textOverflow = "ellipsis";
    contentLine.style.whiteSpace = "nowrap";
    textEl.appendChild(nameLine);
    textEl.appendChild(contentLine);
    row.appendChild(textEl);

    const delBtn = document.createElement("button");
    delBtn.className = "sl-btn danger";
    delBtn.title = "删除 / Remove";
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path><path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>`;
    delBtn.addEventListener("click", () => removeExtra(kind, idx));
    row.appendChild(delBtn);

    listEl.appendChild(row);
  });
}

// ---------- 通用弹窗 ----------
const modalOverlay = $("modalOverlay");
const modalTitleText = $("modalTitleText");
const modalBody = $("modalBody");
const modalIcon = $("modalIcon");
const modalClose = $("modalClose");
const modalBox = $("modalBox");

const modalConfigs = {
  info: {
    title: "信息 / Information",
    body: `这是一个简易的 Stable Diffusion 生图前端。<br>
           <span class="en">A simple Stable Diffusion web UI front-end.</span>
           <div class="ai-note">
              页面由AI生成 / This page was generated by AI./(｡•́︿•̀｡)
           </div>`,
    icon: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
  },
  settings: {
    title: "设置 / Settings",
    body: `设置功能尚未完成，敬请期待。<br>
           <span class="en">Settings feature is not yet complete. Stay tuned.</span>
           <div class="ai-note">
              页面由AI生成 / This page was generated by AI./(｡•́︿•̀｡)
           </div>`,
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>'
  },
  terminal: {
    title: "终端 / Terminal",
    body: `终端功能尚未完成，敬请期待。<br>
           <span class="en">Terminal feature is not yet complete. Stay tuned.</span>
           <div class="ai-note">
              页面由AI生成 / This page was generated by AI./(｡•́︿•̀｡)
           </div>`,
    icon: '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>'
  }
};

function openGenericModal(type) {
  const cfg = modalConfigs[type];
  if (!cfg) return;
  modalBox.classList.remove("wide-modal");
  modalTitleText.textContent = cfg.title;
  modalBody.innerHTML = cfg.body;
  modalBody.style.display = "";
  modalIcon.innerHTML = cfg.icon;
  const oldWrapper = modalBody.querySelector(".dynamic-wrapper");
  if (oldWrapper) oldWrapper.remove();
  modalOverlay.classList.add("show");
}
function closeModal() {
  modalOverlay.classList.remove("show");
  modalBox.classList.remove("wide-modal");
}

document.querySelectorAll(".sidebar-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.modal;
    if (type === "lora") openLoraModal();
    else if (type === "preset") openPresetModal();
    else openGenericModal(type);
  });
});
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("show")) closeModal();
});

// ---------- 管理弹窗 ----------
document.querySelectorAll(".extra-manage-btn").forEach(btn => {
  btn.addEventListener("click", () => openManageModal(btn.dataset.manage));
});

function openManageModal(kind) {
  const kindLabel = kind === "Positive" ? "正面" : "负面";
  const kindLabelEn = kind;
  modalBox.classList.add("wide-modal");
  modalTitleText.textContent = `管理附加${kindLabel} / Manage Extra ${kindLabelEn}`;
  modalIcon.innerHTML = '<path d="M6 4 L6 20 L19 20"></path>';
  modalBody.textContent = "";
  modalBody.style.display = "block";

  const wrapper = document.createElement("div");
  wrapper.className = "dynamic-wrapper";

  const actions = document.createElement("div");
  actions.className = "mgmt-actions";
  const info = document.createElement("span");
  info.className = "mgmt-info";
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-all";
  clearBtn.textContent = "清空 / Clear";
  actions.appendChild(info);
  actions.appendChild(clearBtn);
  wrapper.appendChild(actions);

  const listEl = document.createElement("div");
  listEl.className = "mgmt-list";
  wrapper.appendChild(listEl);

  modalBody.appendChild(wrapper);

  function renderMgmt() {
    const arr = extraState[kind];
    info.textContent = `共 ${arr.length} 条 · 启用 ${extraEnabledCount(kind)} 条 / Total ${arr.length} · Enabled ${extraEnabledCount(kind)}`;
    clearBtn.style.display = arr.length ? "inline" : "none";

    if (arr.length === 0) {
      listEl.innerHTML = `<div class="extra-empty">暂无附加${kindLabel} / No extra ${kindLabelEn.toLowerCase()}</div>`;
      return;
    }
    listEl.innerHTML = "";
    arr.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "mgmt-item" + (item.enabled ? "" : " disabled");

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "sl-toggle" + (item.enabled ? " enabled" : "");
      toggleBtn.title = item.enabled ? "点击禁用 / Disable" : "点击启用 / Enable";
      toggleBtn.addEventListener("click", () => {
        toggleExtra(kind, idx);
        renderMgmt();
      });
      row.appendChild(toggleBtn);

      const textEl = document.createElement("div");
      textEl.className = "mgmt-text";
      const nameLine = document.createElement("div");
      nameLine.className = "mgmt-name";
      nameLine.textContent = `${item.name}${item.source ? ` [${formatSource(item.source)}]` : ""}`;
      const contentLine = document.createElement("div");
      contentLine.className = "mgmt-content";
      contentLine.textContent = item.content;
      textEl.appendChild(nameLine);
      textEl.appendChild(contentLine);
      row.appendChild(textEl);

      const delBtn = document.createElement("button");
      delBtn.className = "sl-btn danger";
      delBtn.title = "删除 / Remove";
      delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="M10 11v6"></path><path d="M14 11v6"></path>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
      </svg>`;
      delBtn.addEventListener("click", () => {
        removeExtra(kind, idx);
        renderMgmt();
      });
      row.appendChild(delBtn);

      listEl.appendChild(row);
    });
  }

  clearBtn.addEventListener("click", () => {
    clearExtra(kind);
    renderMgmt();
  });

  renderMgmt();
  modalOverlay.classList.add("show");
}

// ---------- Lora 扫描选择器 ----------
async function openLoraModal() {
  modalBox.classList.add("wide-modal");
  modalTitleText.textContent = "选择 Lora（点击加入列表）/ Select Lora (click to add)";
  modalIcon.innerHTML = '<path d="M6 4 L6 20 L19 20"></path>';
  modalBody.textContent = "";
  modalBody.style.display = "block";

  const wrapper = document.createElement("div");
  wrapper.className = "dynamic-wrapper";

  const refreshRow = document.createElement("div");
  refreshRow.className = "lora-refresh";
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "刷新列表 / Refresh";
  refreshRow.appendChild(refreshBtn);
  wrapper.appendChild(refreshRow);

  const countEl = document.createElement("div");
  countEl.className = "lora-count";
  countEl.textContent = "正在加载… / Loading…";
  wrapper.appendChild(countEl);

  const listEl = document.createElement("div");
  listEl.className = "lora-list";
  wrapper.appendChild(listEl);

  modalBody.appendChild(wrapper);
  modalOverlay.classList.add("show");

  async function loadLoras() {
    listEl.innerHTML = '<div class="lora-loading">⏳ 正在扫描 Lora 目录… / Scanning Lora directory…</div>';
    countEl.textContent = "正在加载… / Loading…";
    const server = $("server").value.trim().replace(/\/+$/, "");
    if (!server) {
      listEl.innerHTML = '<div class="lora-empty">请先填写服务地址 / Please enter server URL</div>';
      countEl.textContent = "";
      return;
    }
    try {
      const resp = await fetch(`${server}/sdapi/v1/loras`);
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
      }
      const data = await resp.json();

      let loras = [];
      if (Array.isArray(data)) {
        loras = data;
      } else if (data && Array.isArray(data.value)) {
        loras = data.value;
      } else if (data && Array.isArray(data.loras)) {
        loras = data.loras;
      } else if (data && typeof data === 'object') {
        loras = Object.keys(data).map(k => ({ name: k, ...(data[k] || {}) }));
      }

      const normalized = loras.map(item => {
        if (typeof item === 'string') return normalizeLoraPath(item);
        const p = item.path || item.display_path || item.name || item.filename;
        return normalizeLoraPath(p);
      }).filter(Boolean);

      listEl.innerHTML = "";
      if (normalized.length === 0) {
        listEl.innerHTML = '<div class="lora-empty">📂 没有找到 Lora 文件 / No Lora files found</div>';
        countEl.textContent = "共 0 个 / Total 0";
        return;
      }
      countEl.textContent = `共 ${normalized.length} 个 Lora · 点击加入列表 / Total ${normalized.length} Lora · Click to add`;

      normalized.forEach(path => {
        const div = document.createElement("div");
        div.className = "lora-item";
        div.title = path;
        div.innerHTML = `
          <span class="lora-icon">
            <svg viewBox="0 0 24 24"><path d="M6 4 L6 20 L19 20"></path></svg>
          </span>
          <span class="lora-name">${escapeHtml(path)}</span>
        `;
        div.addEventListener("click", () => {
          addLora(path);
          div.style.borderColor = "var(--accent)";
          setTimeout(() => { div.style.borderColor = ""; }, 300);
        });
        listEl.appendChild(div);
      });
    } catch (err) {
      listEl.innerHTML = `<div class="lora-empty">❌ 加载失败 / Load failed：${escapeHtml(err.message)}</div>`;
      countEl.textContent = "加载失败 / Load failed";
    }
  }

  refreshBtn.addEventListener("click", loadLoras);
  await loadLoras();
}

// ---------- 预设提示词弹窗（两列） ----------
async function openPresetModal() {
  modalBox.classList.add("wide-modal");
  modalTitleText.textContent = "预设提示词（点击查看详情）/ Preset Prompts (click to preview)";
  modalIcon.innerHTML = '<path d="M6 4 L6 20 L19 20"></path>';
  modalBody.textContent = "";
  modalBody.style.display = "block";

  const wrapper = document.createElement("div");
  wrapper.className = "dynamic-wrapper";

  const refreshRow = document.createElement("div");
  refreshRow.className = "lora-refresh";
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "刷新列表 / Refresh";
  refreshRow.appendChild(refreshBtn);
  wrapper.appendChild(refreshRow);

  const countEl = document.createElement("div");
  countEl.className = "lora-count";
  countEl.textContent = "正在加载… / Loading…";
  wrapper.appendChild(countEl);

  const cols = document.createElement("div");
  cols.className = "preset-cols";

  const posCol = document.createElement("div");
  posCol.className = "preset-col";
  const posHeader = document.createElement("div");
  posHeader.className = "preset-col-header";
  posHeader.innerHTML = `<span class="dot pos"></span>正面 / Positive <span class="badge" id="presetPosBadge">0</span>`;
  const posList = document.createElement("div");
  posList.className = "preset-col-list";
  posList.innerHTML = '<div class="lora-loading">⏳ 加载中… / Loading…</div>';
  posCol.appendChild(posHeader);
  posCol.appendChild(posList);

  const negCol = document.createElement("div");
  negCol.className = "preset-col";
  const negHeader = document.createElement("div");
  negHeader.className = "preset-col-header";
  negHeader.innerHTML = `<span class="dot neg"></span>负面 / Negative <span class="badge" id="presetNegBadge">0</span>`;
  const negList = document.createElement("div");
  negList.className = "preset-col-list";
  negList.innerHTML = '<div class="lora-loading">⏳ 加载中… / Loading…</div>';
  negCol.appendChild(negHeader);
  negCol.appendChild(negList);

  cols.appendChild(posCol);
  cols.appendChild(negCol);
  wrapper.appendChild(cols);

  modalBody.appendChild(wrapper);
  modalOverlay.classList.add("show");

  // 从单个接口拉取预设，并打上来源标签
  async function fetchPresetsFrom(url, sourceLabel) {
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status} from ${url}: ${text.slice(0, 200)}`);
    }
    const data = await resp.json();
    let presets = [];
    if (data && Array.isArray(data.p)) presets = data.p;
    else if (Array.isArray(data)) presets = data;

    // 为每条预设补上 source 字段（后端已去掉该字段，前端按接口来源自动标记）
    return presets.map(p => ({ ...p, source: sourceLabel }));
  }

  async function loadPresets() {
    posList.innerHTML = '<div class="lora-loading">⏳ 加载中… / Loading…</div>';
    negList.innerHTML = '<div class="lora-loading">⏳ 加载中… / Loading…</div>';
    countEl.textContent = "正在加载… / Loading…";

    try {
      // 并行请求两个接口
      const [includedPresets, customPresets] = await Promise.all([
        fetchPresetsFrom("/api/included_prompt", "Builtin"),
        fetchPresetsFrom("/api/prompt", "Custom")
      ]);

      // 合并两个来源
      const allPresets = [...includedPresets, ...customPresets];

      const posPresets = allPresets.filter(p => p && p.kind === "Positive");
      const negPresets = allPresets.filter(p => p && p.kind === "Negative");

      renderPresetCol(posList, posPresets, "Positive", "presetPosBadge");
      renderPresetCol(negList, negPresets, "Negative", "presetNegBadge");

      const posBuiltin = posPresets.filter(p => p.source === "Builtin").length;
      const posCustom = posPresets.length - posBuiltin;
      const negBuiltin = negPresets.filter(p => p.source === "Builtin").length;
      const negCustom = negPresets.length - negBuiltin;

      countEl.textContent =
        `共 ${allPresets.length} 条（正面 ${posPresets.length} [内置${posBuiltin}+自定义${posCustom}] · 负面 ${negPresets.length} [内置${negBuiltin}+自定义${negCustom}]）/ Total ${allPresets.length}`;
    } catch (err) {
      const errMsg = `<div class="lora-empty">❌ 加载失败 / Load failed：${escapeHtml(err.message)}</div>`;
      posList.innerHTML = errMsg;
      negList.innerHTML = errMsg;
      countEl.textContent = "加载失败 / Load failed";
    }
  }

  function renderPresetCol(listEl, arr, kind, badgeId) {
    const badgeEl = document.getElementById(badgeId);
    if (badgeEl) badgeEl.textContent = String(arr.length);
    listEl.innerHTML = "";
    if (arr.length === 0) {
      listEl.innerHTML = `<div class="lora-empty">📂 没有${kind === 'Positive' ? '正面' : '负面'}预设 / No ${kind.toLowerCase()} presets</div>`;
      return;
    }
    arr.forEach(preset => {
      const div = document.createElement("div");
      div.className = "preset-item";
      div.title = "点击预览 / Click to preview";

      const head = document.createElement("div");
      head.className = "pi-head";
      const nameEl = document.createElement("span");
      nameEl.className = "pi-name";
      nameEl.textContent = preset.name || "(未命名)";
      const srcEl = document.createElement("span");
      srcEl.className = "pi-source" + (preset.source === "Builtin" ? " builtin" : "");
      srcEl.textContent = formatSource(preset.source);
      head.appendChild(nameEl);
      head.appendChild(srcEl);

      const contentEl = document.createElement("div");
      contentEl.className = "pi-content";
      contentEl.textContent = preset.content || "";

      div.appendChild(head);
      div.appendChild(contentEl);

      // 关键改动：点击后弹出预览弹窗，而不是直接添加
      div.addEventListener("click", () => {
        showPresetPreview(kind, preset);
        div.style.borderColor = "var(--accent)";
        setTimeout(() => { div.style.borderColor = ""; }, 300);
      });
      listEl.appendChild(div);
    });
  }

  refreshBtn.addEventListener("click", loadPresets);
  await loadPresets();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

// ---------- 提示词拼接 ----------
function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#ff6b6b" : "var(--label)";
}

function buildPrompt() {
  const basePrompt = $("prompt").value.trim();
  const baseNegative = $("negative").value.trim();
  const useExtraPos = $("useExtraPositive").checked;
  const useExtraNeg = $("useExtraNegative").checked;

  const extraPosContents = useExtraPos
    ? extraState.Positive.filter(x => x.enabled).map(x => x.content).filter(Boolean)
    : [];
  const extraNegContents = useExtraNeg
    ? extraState.Negative.filter(x => x.enabled).map(x => x.content).filter(Boolean)
    : [];

  const posParts = [];
  if (basePrompt) posParts.push(basePrompt);
  posParts.push(...extraPosContents);
  const finalPositive = posParts.join(", ");

  const negParts = [];
  if (baseNegative) negParts.push(baseNegative);
  negParts.push(...extraNegContents);
  const finalNegative = negParts.join(", ");

  return { finalPositive, finalNegative };
}

let currentImageB64 = null;

async function generate() {
  const server = $("server").value.trim().replace(/\/+$/, "");
  const { finalPositive, finalNegative } = buildPrompt();
  if (!finalPositive) {
    setStatus("提示词不能为空 / Prompt cannot be empty", true);
    return;
  }

  const activeLoras = selectedLoras
    .filter(l => l.enabled)
    .map(l => ({ path: l.path, multiplier: l.weight }));

  const payload = {
    prompt: finalPositive,
    negative_prompt: finalNegative,
    width: parseInt($("width").value) || 512,
    height: parseInt($("height").value) || 512,
    steps: parseInt($("steps").value) || 12,
    cfg_scale: parseFloat($("cfg").value) || 2
  };
  if (activeLoras.length > 0) payload.lora = activeLoras;

  goBtn.disabled = true;
  setStatus(`正在请求… / Requesting…（${activeLoras.length} 个 Lora 启用）`);

  try {
    const resp = await fetch(`${server}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text.slice(0, 300)}`);
    }
    const data = await resp.json();
    const b64 = data.images && data.images[0];
    if (!b64) throw new Error("响应里没有 images 字段 / Response has no images field");

    currentImageB64 = b64;
    previewEl.innerHTML = "";

    const dlBtn = document.createElement("div");
    dlBtn.className = "download-btn";
    dlBtn.id = "downloadBtn";
    dlBtn.title = "下载图片 / Download";
    dlBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>`;
    dlBtn.addEventListener("click", downloadImage);
    previewEl.appendChild(dlBtn);

    const img = document.createElement("img");
    img.src = "data:image/png;base64," + b64;
    img.alt = "生成结果 / Result";
    previewEl.appendChild(img);
    previewEl.classList.add("has-image");
    setStatus("完成 / Done");
  } catch (err) {
    setStatus("失败 / Failed：" + err.message, true);
  } finally {
    goBtn.disabled = false;
  }
}

function downloadImage() {
  if (!currentImageB64) { setStatus("没有可下载的图片 / No image to download", true); return; }
  const link = document.createElement("a");
  link.href = "data:image/png;base64," + currentImageB64;
  link.download = `sd-output-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function updateExtraHint() {
  const usePos = $("useExtraPositive").checked;
  const useNeg = $("useExtraNegative").checked;
  const posCount = extraEnabledCount("Positive");
  const negCount = extraEnabledCount("Negative");
  $("extraPreviewHint").textContent =
    (usePos ? `附加正面已启用（${posCount} 条） / Extra Pos ON` : "附加正面已关闭 / Extra Pos OFF") + " · " +
    (useNeg ? `附加负面已启用（${negCount} 条） / Extra Neg ON` : "附加负面已关闭 / Extra Neg OFF");
}
$("useExtraPositive").addEventListener("change", updateExtraHint);
$("useExtraNegative").addEventListener("change", updateExtraHint);

$("width").value = 512;
$("height").value = 512;
$("steps").value = 12;
$("cfg").value = 2;

goBtn.addEventListener("click", generate);
const initialDl = $("downloadBtn");
if (initialDl) initialDl.addEventListener("click", downloadImage);
previewEl.classList.remove("has-image");

renderExtraLists();
