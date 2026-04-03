"use strict";

// ─── Config ────────────────────────────────────────────────────────────────────
const GITHUB_CLIENT_ID = window.GITHUB_CLIENT_ID || "YOUR_CLIENT_ID_HERE";
const GIST_FILENAME = "leetcode-tracker-progress.json";
const ITEMS_PER_PAGE = 20;
const CACHE_KEY = "leet_csv_cache_v4";

const PRIORITY_RANK = {
  google: 1,
  amazon: 2,
  microsoft: 3,
  meta: 4,
  apple: 5,
  netflix: 6,
  uber: 7,
  linkedin: 8,
  twitter: 9,
  airbnb: 10,
  bloomberg: 11,
  salesforce: 12,
  adobe: 13,
  oracle: 14,
  nvidia: 15,
  tesla: 16,
  stripe: 17,
  snapchat: 18,
  tiktok: 19,
  bytedance: 20,
  goldman_sachs: 21,
  morgan_stanley: 22,
  atlassian: 23,
  shopify: 24,
  dropbox: 25,
  lyft: 26,
  pinterest: 27,
  doordash: 28,
  coinbase: 29,
  robinhood: 30,
};

// ─── State ─────────────────────────────────────────────────────────────────────
const state = {
  questions: [],
  filtered: [],
  solved: {},
  activity: {},
  bookmarks: {},
  notes: {},
  timeLogs: {},
  user: null,
  token: null,
  gistId: null,
  page: 1,
  companies: [],
  filters: {
    search: "",
    difficulties: [],
    companies: [],
    status: "all",
    starred: false,
    review: false,
  },
  sortCol: "id",
  sortDir: "asc",
  coverageExpanded: false,
  expandedRows: new Set(),
  studyPlanCompany: null,
  onboardingDone: false,
};

// ─── Hash Routing ──────────────────────────────────────────────────────────────
const PAGES = ["tracker", "profile", "insights"];
function showPage(name) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(`page-${name}`).classList.add("active");
  document.getElementById(`nav-${name}`).classList.add("active");
  window.location.hash = name;
  if (name === "profile") renderProfilePage();
  if (name === "insights") renderInsightsPage();
}

function initRouting() {
  const hash = window.location.hash.replace("#", "") || "tracker";
  const page = PAGES.includes(hash) ? hash : "tracker";
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(`page-${page}`).classList.add("active");
  document.getElementById(`nav-${page}`).classList.add("active");
  if (page === "profile") renderProfilePage();
  if (page === "insights") renderInsightsPage();
  window.addEventListener("hashchange", () => {
    const h = window.location.hash.replace("#", "");
    if (PAGES.includes(h)) {
      document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));
      document
        .querySelectorAll(".nav-btn")
        .forEach((b) => b.classList.remove("active"));
      document.getElementById(`page-${h}`).classList.add("active");
      document.getElementById(`nav-${h}`).classList.add("active");
      if (h === "profile") renderProfilePage();
      if (h === "insights") renderInsightsPage();
    }
  });
}

// ─── Theme ─────────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  applyTheme(saved, false);
}
function applyTheme(theme, save = true) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  if (save) localStorage.setItem("theme", theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
function loginWithGitHub() {
  const redirectUri = encodeURIComponent(
    `${window.location.origin}/api/github-oauth`,
  );
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=gist&redirect_uri=${redirectUri}`;
}
function logout() {
  state.token = null;
  state.user = null;
  state.gistId = null;
  localStorage.removeItem("gh_token");
  localStorage.removeItem("gh_gist_id");
  renderAuthArea();
  renderProfilePage();
}
async function fetchGitHubUser(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  if (!res.ok) throw new Error("Bad token");
  return res.json();
}

// ─── Gist Storage ──────────────────────────────────────────────────────────────
function serializeProgress() {
  return JSON.stringify({
    solved: state.solved,
    activity: state.activity,
    bookmarks: state.bookmarks,
    notes: state.notes,
    timeLogs: state.timeLogs,
  });
}
function deserializeProgress(content) {
  try {
    const data = JSON.parse(content);
    if (data.solved) {
      for (const id in data.solved) {
        if (data.solved[id] === true) data.solved[id] = "2024-01-01";
      }
    }
    state.solved = data.solved || {};
    state.activity = data.activity || {};
    state.bookmarks = data.bookmarks || {};
    state.notes = data.notes || {};
    state.timeLogs = data.timeLogs || {};
  } catch (_) { }
}
async function loadProgressFromGist() {
  const savedId = localStorage.getItem("gh_gist_id");
  if (savedId) {
    try {
      const res = await fetch(`https://api.github.com/gists/${savedId}`, {
        headers: { Authorization: `token ${state.token}` },
      });
      if (res.ok) {
        const gist = await res.json();
        state.gistId = savedId;
        const content = gist.files[GIST_FILENAME]?.content;
        if (content) deserializeProgress(content);
        return;
      }
    } catch (_) { }
  }
  const res = await fetch("https://api.github.com/gists?per_page=100", {
    headers: { Authorization: `token ${state.token}` },
  });
  const gists = await res.json();
  const found =
    Array.isArray(gists) && gists.find((g) => g.files[GIST_FILENAME]);
  if (found) {
    state.gistId = found.id;
    localStorage.setItem("gh_gist_id", found.id);
    const full = await fetch(`https://api.github.com/gists/${found.id}`, {
      headers: { Authorization: `token ${state.token}` },
    });
    const data = await full.json();
    deserializeProgress(data.files[GIST_FILENAME]?.content || "{}");
  }
}
async function saveProgressToGist() {
  const body = {
    description: "LeetTrack Progress",
    public: false,
    files: { [GIST_FILENAME]: { content: serializeProgress() } },
  };
  const headers = {
    Authorization: `token ${state.token}`,
    "Content-Type": "application/json",
  };
  if (state.gistId) {
    await fetch(`https://api.github.com/gists/${state.gistId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
  } else {
    const res = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const gist = await res.json();
    state.gistId = gist.id;
    localStorage.setItem("gh_gist_id", gist.id);
  }
}
function saveLocalProgress() {
  localStorage.setItem("leet_local", serializeProgress());
}
function loadLocalProgress() {
  const raw = localStorage.getItem("leet_local");
  if (raw) deserializeProgress(raw);
}

// ─── Export Progress ───────────────────────────────────────────────────────────
function exportProgress() {
  const data = {
    exportedAt: new Date().toISOString(),
    solved: state.solved,
    activity: state.activity,
    bookmarks: state.bookmarks,
    notes: state.notes,
    timeLogs: state.timeLogs,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leettrack-backup-${dateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import Progress ───────────────────────────────────────────────────────────
function triggerImport() {
  document.getElementById("import-file-input").click();
}
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.solved && !data.activity) {
        showToast("❌ Invalid backup file", "error");
        return;
      }
      state.solved = data.solved || {};
      state.activity = data.activity || {};
      state.bookmarks = data.bookmarks || {};
      state.notes = data.notes || {};
      state.timeLogs = data.timeLogs || {};
      saveLocalProgress();
      if (state.token) saveProgressToGist();
      renderTable();
      renderStats();
      refreshDataDependentPages();
      showToast(
        `✅ Imported ${Object.keys(state.solved).length} solved problems`,
      );
    } catch (_) {
      showToast("❌ Failed to parse backup file", "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// ─── Toast Notification ────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast toast-${type} toast-show`;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove("toast-show");
  }, 3000);
}

// ─── Streak Calculation ────────────────────────────────────────────────────────
function calcStreaks() {
  const days = Object.keys(state.activity)
    .filter((d) => state.activity[d] > 0)
    .sort();
  if (days.length === 0) return { current: 0, longest: 0, totalDays: 0 };
  const today = dateStr(new Date());
  const yesterday = dateStr(new Date(Date.now() - 86400000));
  const daySet = new Set(days);
  let longest = 0,
    run = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else run = 1;
  }
  longest = Math.max(longest, 1);
  let current = 0;
  if (daySet.has(today) || daySet.has(yesterday)) {
    let d = daySet.has(today) ? new Date(today) : new Date(yesterday);
    while (daySet.has(dateStr(d))) {
      current++;
      d = new Date(d.getTime() - 86400000);
    }
  }
  return { current, longest, totalDays: days.length };
}
function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

// ─── Unsolve Modal ─────────────────────────────────────────────────────────────
let _pendingUnsolveId = null;
function openUnsolveModal(id) {
  _pendingUnsolveId = id;
  document.getElementById("unsolve-modal-overlay").style.display = "flex";
}
function closeUnsolveModal() {
  const cb = document.querySelector(`input[data-id="${_pendingUnsolveId}"]`);
  if (cb) cb.checked = true;
  _pendingUnsolveId = null;
  document.getElementById("unsolve-modal-overlay").style.display = "none";
}
async function confirmUnsolve() {
  const id = _pendingUnsolveId;
  _pendingUnsolveId = null;
  document.getElementById("unsolve-modal-overlay").style.display = "none";
  const solvedDate = state.solved[id];
  delete state.solved[id];
  delete state.notes[id];
  delete state.timeLogs[id];
  if (state.activity[solvedDate]) {
    state.activity[solvedDate] = Math.max(0, state.activity[solvedDate] - 1);
    if (state.activity[solvedDate] === 0) delete state.activity[solvedDate];
  }
  renderStats();
  renderTable();
  refreshDataDependentPages();
  saveLocalProgress();
  if (state.token) saveProgressToGist();
}

// ─── Toggle Solved ─────────────────────────────────────────────────────────────
async function toggleSolved(id) {
  const today = dateStr(new Date());
  if (state.solved[id]) {
    openUnsolveModal(id);
    return;
  }
  state.solved[id] = today;
  state.activity[today] = (state.activity[today] || 0) + 1;
  const cb = document.querySelector(`input[data-id="${id}"]`);
  const row = cb?.closest("tr");
  if (cb) cb.checked = true;
  if (row) row.classList.add("solved");
  renderStats();
  renderTable();
  saveLocalProgress();
  if (state.token) saveProgressToGist();
  // Show toast with "Add notes?" action instead of auto-opening modal
  showSolvedToast(id);
}

function showSolvedToast(id) {
  const q = state.questions.find((x) => x.id === id);
  let toast = document.getElementById("solved-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "solved-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <span>🎉 Solved: <strong>${q?.title || "Problem"}</strong></span>
    <button onclick="openNoteModal(${id}); hideSolvedToast()" class="solved-toast-btn">Add Notes & Time</button>
    <button onclick="hideSolvedToast()" class="solved-toast-dismiss">✕</button>
  `;
  toast.classList.add("solved-toast-show");
  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => hideSolvedToast(), 6000);
}
function hideSolvedToast() {
  const toast = document.getElementById("solved-toast");
  if (toast) toast.classList.remove("solved-toast-show");
}

// ─── Bookmarks ─────────────────────────────────────────────────────────────────
async function toggleBookmark(id) {
  if (state.bookmarks[id]) delete state.bookmarks[id];
  else state.bookmarks[id] = true;
  const btn = document.querySelector(`.star-btn[data-id="${id}"]`);
  if (btn) {
    btn.classList.toggle("starred", !!state.bookmarks[id]);
    btn.textContent = state.bookmarks[id] ? "★" : "☆";
  }
  saveLocalProgress();
  if (state.token) saveProgressToGist();
}

// ─── Time Log ──────────────────────────────────────────────────────────────────
async function saveTimeLog(id, minutes) {
  const mins = parseInt(minutes);
  if (isNaN(mins) || mins <= 0) delete state.timeLogs[id];
  else state.timeLogs[id] = mins;
  saveLocalProgress();
  if (state.token) saveProgressToGist();
}

// ─── Notes Modal ───────────────────────────────────────────────────────────────
function openNoteModal(id) {
  const q = state.questions.find((x) => x.id === id);
  const note = state.notes[id] || "";
  const time = state.timeLogs[id] || "";
  document.getElementById("note-modal-title").textContent =
    q?.title || "Problem";
  document.getElementById("note-textarea").value = note;
  document.getElementById("note-time-input").value = time;
  document.getElementById("note-modal-id").value = id;
  document.getElementById("note-modal-overlay").style.display = "flex";
  document.getElementById("note-textarea").focus();
}
function closeNoteModal() {
  document.getElementById("note-modal-overlay").style.display = "none";
}

function refreshDataDependentPages() {
  const activePage = document.querySelector(".page.active")?.id;
  if (activePage === "page-insights") renderInsightsPage();
  if (activePage === "page-profile") renderProfilePage();
  renderStats();
}

async function saveNote() {
  const id = parseInt(document.getElementById("note-modal-id").value);
  const text = document.getElementById("note-textarea").value.trim();
  const minutes = document.getElementById("note-time-input").value;
  if (text) state.notes[id] = text;
  else delete state.notes[id];
  const mins = parseInt(minutes);
  if (isNaN(mins) || mins <= 0) delete state.timeLogs[id];
  else state.timeLogs[id] = mins;
  closeNoteModal();
  // Remove the entire old DOM-patching block — renderTable handles it
  refreshDataDependentPages();
  renderTable(); // ← add this
  saveLocalProgress();
  if (state.token) saveProgressToGist();
}

// ─── Random Problem Picker ─────────────────────────────────────────────────────
function openRandomPicker() {
  document.getElementById("random-modal-overlay").style.display = "flex";
  pickRandom();
}
function closeRandomPicker() { document.getElementById("random-modal-overlay").style.display = "none"; }
function pickRandom() {
  const pool = state.filtered.length > 0 ? state.filtered : state.questions;
  const unsolved = pool.filter((q) => !state.solved[q.id]);
  const source = unsolved.length > 0 ? unsolved : pool;
  if (!source.length) { document.getElementById("random-problem-content").innerHTML = `<div class="random-empty">No problems available!</div>`; return; }
  const q = source[Math.floor(Math.random() * source.length)];
  const diffCls = q.difficulty.toLowerCase();
  document.getElementById("random-problem-content").innerHTML = `
    <div class="random-problem-card">
      <div class="random-problem-meta">
        <span class="diff-badge ${diffCls}">${q.difficulty}</span>
        <span class="random-problem-id">#${q.id}</span>
        ${state.solved[q.id] ? '<span class="random-solved-badge">✓ Solved</span>' : ""}
      </div>
      <div class="random-problem-title">${q.title}</div>
      <div class="random-problem-companies">${q.companies.slice(0, 4).map((c) => `<span class="company-tag">${formatCompany(c)}</span>`).join("")}</div>
      <a href="${q.link}" target="_blank" class="btn-primary random-open-btn">Open Problem →</a>
    </div>
  `;
}

// ─── Study Plan Modal ──────────────────────────────────────────────────────────
function openStudyPlan(company) {
  state.studyPlanCompany = company;
  const qs = state.questions
    .filter((q) => q.companies.includes(company))
    .sort((a, b) => {
      const order = { Easy: 0, Medium: 1, Hard: 2 };
      if (order[a.difficulty] !== order[b.difficulty])
        return order[a.difficulty] - order[b.difficulty];
      return b.companies.length - a.companies.length;
    });
  const solved = qs.filter((q) => state.solved[q.id]).length;
  const pct = qs.length ? Math.round((solved / qs.length) * 100) : 0;
  const byDiff = (d) => qs.filter((q) => q.difficulty === d);
  const easy = byDiff("Easy"),
    medium = byDiff("Medium"),
    hard = byDiff("Hard");
  document.getElementById("study-plan-title").textContent =
    `${formatCompany(company)} Study Plan`;
  document.getElementById("study-plan-meta").textContent =
    `${qs.length} problems · ${solved} solved · ${pct}% done`;
  document.getElementById("study-plan-body").innerHTML = [
    { label: "Easy", cls: "easy", list: easy },
    { label: "Medium", cls: "medium", list: medium },
    { label: "Hard", cls: "hard", list: hard },
  ]
    .map(({ label, cls, list }) => {
      if (!list.length) return "";
      return `<div class="sp-section">
      <div class="sp-section-title ${cls}-text">${label} <span class="sp-count">${list.filter((q) => state.solved[q.id]).length}/${list.length}</span></div>
      ${list
          .map((q, i) => {
            const done = !!state.solved[q.id];
            const starred = !!state.bookmarks[q.id];
            return `<div class="sp-row ${done ? "sp-done" : ""}">
          <span class="sp-num">${i + 1}</span>
          <label class="checkbox-wrap sp-check"><input type="checkbox" ${done ? "checked" : ""} onchange="toggleSolved(${q.id}); rerenderStudyPlan()"><span class="checkmark"></span></label>
          <a href="${q.link}" target="_blank" class="sp-title">${q.title}</a>
          <span class="sp-freq">${q.companies.length} co.</span>
          <button class="star-btn ${starred ? "starred" : ""}" data-id="${q.id}" onclick="toggleBookmark(${q.id}); this.classList.toggle('starred'); this.textContent=state.bookmarks[${q.id}]?'★':'☆'">${starred ? "★" : "☆"}</button>
        </div>`;
          })
          .join("")}
    </div>`;
    })
    .join("");
  document.getElementById("study-plan-overlay").style.display = "flex";
}
function rerenderStudyPlan() {
  if (state.studyPlanCompany) openStudyPlan(state.studyPlanCompany);
}
function closeStudyPlan() {
  document.getElementById("study-plan-overlay").style.display = "none";
  state.studyPlanCompany = null;
}

// ─── Expandable company tags ───────────────────────────────────────────────────
function toggleRowExpand(id) {
  if (state.expandedRows.has(id)) state.expandedRows.delete(id);
  else state.expandedRows.add(id);
  const cell = document.querySelector(`td[data-cid="${id}"]`);
  const q = state.questions.find((x) => x.id === id);
  if (cell && q) cell.innerHTML = buildCompanyTags(q);
}
function buildCompanyTags(q) {
  const expanded = state.expandedRows.has(q.id);
  const limit = 5;
  const shown = expanded ? q.companies : q.companies.slice(0, limit);
  const tags = shown
    .map(
      (c) =>
        `<span class="company-tag" onclick="addCompanyFilter('${c}')" title="Filter by ${formatCompany(c)}">${formatCompany(c)}</span>`,
    )
    .join("");
  const overflow = q.companies.length - limit;
  const btn =
    !expanded && overflow > 0
      ? `<span class="company-tag more" onclick="toggleRowExpand(${q.id})">+${overflow} more ▾</span>`
      : expanded && q.companies.length > limit
        ? `<span class="company-tag more collapse" onclick="toggleRowExpand(${q.id})">show less ▴</span>`
        : "";
  return tags + btn;
}

// ─── CSV Parsing ───────────────────────────────────────────────────────────────
async function loadAllCSVs() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { questions, companies } = JSON.parse(cached);
      state.questions = questions;
      state.companies = companies;
      renderFilterUI();
      return;
    }
  } catch (_) { }
  let csvFiles = [];
  try {
    const res = await fetch("data/manifest.json");
    if (!res.ok) throw new Error();
    csvFiles = await res.json();
  } catch (_) {
    showError(
      "Could not load <code>data/manifest.json</code>. Run <code>node generate-manifest.js</code> first.",
    );
    return;
  }
  const map = {};
  await Promise.all(
    csvFiles.map(async (filename) => {
      const company = filename
        .replace(/\.csv$/, "")
        .replace(/_([0-9]+year|[0-9]+months|alltime|all_time|recent)$/i, "");
      try {
        const res = await fetch(`data/${filename}`);
        const text = await res.text();
        for (const row of parseCSV(text)) {
          const id = parseInt(row["ID"]);
          if (!id || !row["Title"]) continue;
          if (!map[id]) {
            map[id] = {
              id,
              title: row["Title"].trim(),
              difficulty: row["Difficulty"]?.trim() || "Unknown",
              acceptance: row["Acceptance"]?.trim() || "-",
              link:
                (row["Leetcode Question Link"] || "").trim() ||
                "https://leetcode.com/problems/",
              companies: new Set(),
            };
          }
          map[id].companies.add(company);
        }
      } catch (_) {
        console.warn(`Skipped ${filename}`);
      }
    }),
  );
  state.questions = Object.values(map)
    .map((q) => ({
      ...q,
      companies: [...q.companies].sort((a, b) => {
        const aRank = PRIORITY_RANK[a] ?? 999;
        const bRank = PRIORITY_RANK[b] ?? 999;
        if (aRank !== 999 && bRank !== 999) return Math.random() - 0.5;
        if (aRank !== bRank) return aRank - bRank;
        return a.localeCompare(b);
      }),
    }))
    .sort((a, b) => a.id - b.id);
  const cs = new Set();
  state.questions.forEach((q) => q.companies.forEach((c) => cs.add(c)));
  state.companies = [...cs].sort();
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        questions: state.questions,
        companies: state.companies,
      }),
    );
  } catch (_) { }
  renderFilterUI();
}
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = csvSplit(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (vals[i] || "").trim()));
    return obj;
  });
}
function csvSplit(line) {
  const out = [];
  let cur = "",
    inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

// ─── Filter UI ─────────────────────────────────────────────────────────────────
function renderFilterUI() {
  renderDiffPills();
  renderCompanyDropdown();
}
function renderDiffPills() {
  const wrap = document.getElementById("filter-difficulty-pills");
  ["Easy", "Medium", "Hard"].forEach((d) => {
    const btn = wrap.querySelector(`[data-diff="${d.toLowerCase()}"]`);
    if (btn)
      btn.classList.toggle(
        "active",
        state.filters.difficulties.includes(d.toLowerCase()),
      );
  });
}
function toggleDiffFilter(diff) {
  const idx = state.filters.difficulties.indexOf(diff);
  if (idx === -1) state.filters.difficulties.push(diff);
  else state.filters.difficulties.splice(idx, 1);
  renderDiffPills();
  applyFilters();
}
function toggleStarredFilter() {
  state.filters.starred = !state.filters.starred;
  const btn = document.getElementById("filter-starred-btn");
  if (btn) btn.classList.toggle("active", state.filters.starred);
  applyFilters();
}
function toggleReviewFilter() {
  state.filters.review = !state.filters.review;
  const btn = document.getElementById("filter-review-btn");
  if (btn) btn.classList.toggle("active", state.filters.review);
  applyFilters();
}
function closeAllDropdowns() {
  const cdd = document.getElementById("company-dropdown");
  const cbtn = document.getElementById("company-filter-btn");
  if (cdd) cdd.style.display = "none";
  if (cbtn) cbtn.classList.remove("active");
  companyDropdownOpen = false;
  const sdd = document.getElementById("status-dropdown");
  const sbtn = document.getElementById("status-filter-btn");
  if (sdd) sdd.style.display = "none";
  if (sbtn) sbtn.classList.toggle("active", state.filters.status !== "all");
  const sortdd = document.getElementById("sort-dropdown");
  if (sortdd) sortdd.style.display = "none";
}
let companyDropdownOpen = false;
function toggleCompanyDropdown() {
  const dd = document.getElementById("company-dropdown");
  const btn = document.getElementById("company-filter-btn");
  const isOpen = companyDropdownOpen;
  closeAllDropdowns();
  if (!isOpen) {
    companyDropdownOpen = true;
    dd.style.display = "block";
    btn.classList.add("active");
    document.getElementById("company-search-input").value = "";
    renderCompanyCheckboxList("");
    setTimeout(
      () =>
        document.addEventListener("click", closeCompanyDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function closeCompanyDropdownOutside(e) {
  const wrap = document.getElementById("company-filter-wrap");
  if (wrap && !wrap.contains(e.target)) {
    companyDropdownOpen = false;
    document.getElementById("company-dropdown").style.display = "none";
    document.getElementById("company-filter-btn").classList.remove("active");
  } else if (companyDropdownOpen) {
    setTimeout(
      () =>
        document.addEventListener("click", closeCompanyDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function renderCompanyCheckboxList(search) {
  const list = document.getElementById("company-checkbox-list");
  const q = search.toLowerCase();
  const filtered = state.companies.filter(
    (c) => !q || c.includes(q) || formatCompany(c).toLowerCase().includes(q),
  );
  list.innerHTML = filtered
    .map((c) => {
      const checked = state.filters.companies.includes(c);
      return `<label class="company-checkbox-item ${checked ? "checked" : ""}"><input type="checkbox" ${checked ? "checked" : ""} onchange="toggleCompanyFilter('${c}')" onclick="event.stopPropagation()"><span>${formatCompany(c)}</span></label>`;
    })
    .join("");
}
function filterCompanyList(val) {
  renderCompanyCheckboxList(val);
}
function toggleCompanyFilter(company) {
  const idx = state.filters.companies.indexOf(company);
  if (idx === -1) state.filters.companies.push(company);
  else state.filters.companies.splice(idx, 1);
  updateCompanyFilterCount();
  renderCompanyCheckboxList(
    document.getElementById("company-search-input").value,
  );
  applyFilters();
}
function addCompanyFilter(company) {
  if (!company || state.filters.companies.includes(company)) return;
  state.filters.companies.push(company);
  updateCompanyFilterCount();
  applyFilters();
}
function clearCompanyFilters() {
  state.filters.companies = [];
  updateCompanyFilterCount();
  renderCompanyCheckboxList(
    document.getElementById("company-search-input")?.value || "",
  );
  applyFilters();
}
function updateCompanyFilterCount() {
  const count = state.filters.companies.length;
  const el = document.getElementById("company-filter-count");
  if (!el) return;
  el.textContent = count;
  el.style.display = count ? "inline-flex" : "none";
}
function renderCompanyDropdown() {
  renderCompanyCheckboxList("");
}

function applyFilters() {
  const { search, difficulties, companies, status, starred, review } =
    state.filters;
  const q = search.toLowerCase();
  const reviewCutoff = dateStr(new Date(Date.now() - 7 * 86400000));
  state.filtered = state.questions.filter((item) => {
    if (
      difficulties.length &&
      !difficulties.includes(item.difficulty.toLowerCase())
    )
      return false;
    if (companies.length && !companies.some((c) => item.companies.includes(c)))
      return false;
    if (status === "solved" && !state.solved[item.id]) return false;
    if (status === "unsolved" && state.solved[item.id]) return false;
    if (starred && !state.bookmarks[item.id]) return false;
    if (
      review &&
      (!state.solved[item.id] || state.solved[item.id] > reviewCutoff)
    )
      return false;
    if (
      q &&
      !item.title.toLowerCase().includes(q) &&
      !item.companies.some((c) => c.includes(q))
    )
      return false;
    return true;
  });
  applySort();
  state.page = 1;
  renderTable();
  renderStats();
  updateClearButton();
  updateStatusDropdown();
  updateSortBtn();
}
function updateClearButton() {
  const { search, difficulties, companies, status, starred, review } =
    state.filters;
  const hasFilters =
    search ||
    difficulties.length ||
    companies.length ||
    status !== "all" ||
    starred ||
    review;
  const btn = document.getElementById("clear-filters");
  if (btn) btn.style.display = hasFilters ? "" : "none";
}
function updateStatusDropdown() {
  const { status } = state.filters;
  const btn = document.getElementById("status-filter-btn");
  if (!btn) return;
  const labels = { all: "All Status", solved: "Solved", unsolved: "Unsolved" };
  const labelEl = btn.querySelector(".status-filter-label");
  if (labelEl) labelEl.textContent = labels[status] || "All Status";
  btn.classList.toggle("active", status !== "all");
}
function toggleStatusDropdown() {
  const dd = document.getElementById("status-dropdown");
  const isOpen = dd.style.display !== "none";
  closeAllDropdowns();
  if (!isOpen) {
    dd.style.display = "block";
    document.getElementById("status-filter-btn").classList.add("active");
    setTimeout(
      () =>
        document.addEventListener("click", closeStatusDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function closeStatusDropdownOutside(e) {
  const wrap = document.getElementById("status-filter-wrap");
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById("status-dropdown").style.display = "none";
    const btn = document.getElementById("status-filter-btn");
    if (btn) btn.classList.toggle("active", state.filters.status !== "all");
  } else {
    setTimeout(
      () =>
        document.addEventListener("click", closeStatusDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function setStatusFilter(value) {
  state.filters.status = value;
  document.getElementById("status-dropdown").style.display = "none";
  const btn = document.getElementById("status-filter-btn");
  if (btn) btn.classList.toggle("active", value !== "all");
  applyFilters();
}

// ─── Sort ──────────────────────────────────────────────────────────────────────
function applySort() {
  const { sortCol, sortDir } = state;
  state.filtered.sort((a, b) => {
    let av, bv;
    if (sortCol === "solveDate") {
      av = state.solved[a.id] || "";
      bv = state.solved[b.id] || "";
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
    } else if (sortCol === "id") {
      av = +a.id;
      bv = +b.id;
    } else if (sortCol === "acceptance") {
      av = parseFloat(a.acceptance) || 0;
      bv = parseFloat(b.acceptance) || 0;
    } else {
      av = String(a[sortCol] || "").toLowerCase();
      bv = String(b[sortCol] || "").toLowerCase();
    }
    return av < bv
      ? sortDir === "asc"
        ? -1
        : 1
      : av > bv
        ? sortDir === "asc"
          ? 1
          : -1
        : 0;
  });
}
function setSort(col) {
  state.sortDir =
    state.sortCol === col && state.sortDir === "asc" ? "desc" : "asc";
  state.sortCol = col;
  applySort();
  state.page = 1;
  renderTable();
  updateSortHeaders();
  updateSortBtn();
}
function updateSortBtn() {
  const btn = document.getElementById("sort-btn");
  if (!btn) return;
  const labels = {
    id: "# ID",
    title: "Title",
    difficulty: "Difficulty",
    acceptance: "Accept %",
    solveDate: "Solve Date",
  };
  btn.querySelector(".sort-btn-label").textContent =
    labels[state.sortCol] || "Sort";
  btn.classList.toggle("active", state.sortCol !== "id");
}
function toggleSortDropdown() {
  const dd = document.getElementById("sort-dropdown");
  const isOpen = dd.style.display !== "none";
  closeAllDropdowns();
  if (!isOpen) {
    dd.style.display = "block";
    setTimeout(
      () =>
        document.addEventListener("click", closeSortDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function closeSortDropdownOutside(e) {
  const wrap = document.getElementById("sort-wrap");
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById("sort-dropdown").style.display = "none";
  } else {
    setTimeout(
      () =>
        document.addEventListener("click", closeSortDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function setSortFromDropdown(col, dir) {
  state.sortCol = col;
  state.sortDir = dir;
  document.getElementById("sort-dropdown").style.display = "none";
  applySort();
  state.page = 1;
  renderTable();
  updateSortHeaders();
  updateSortBtn();
}

// ─── Render: Table ─────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById("questions-tbody");
  const start = (state.page - 1) * ITEMS_PER_PAGE;
  const items = state.filtered.slice(start, start + ITEMS_PER_PAGE);
  if (!items.length) {
    let emptyMsg = "No questions match your filters.";
    if (state.filters.review) {
      const totalSolved = Object.keys(state.solved).length;
      emptyMsg =
        totalSolved === 0
          ? "🌱 You haven't solved any problems yet. Start solving and come back in 7 days to review!"
          : "✅ You're all caught up! No problems are due for review yet. Check back in a few days.";
    }
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${emptyMsg}</td></tr>`;
    renderPagination();
    return;
  }
  tbody.innerHTML = items
    .map((q) => {
      const solved = !!state.solved[q.id];
      const starred = !!state.bookmarks[q.id];
      const hasNote = !!state.notes[q.id];
      const timeLog = state.timeLogs[q.id];
      const diffClass = q.difficulty.toLowerCase();
      return `<tr class="${solved ? "solved" : ""}">
      <td class="col-check"><label class="checkbox-wrap"><input type="checkbox" data-id="${q.id}" ${solved ? "checked" : ""} onchange="toggleSolved(${q.id})"><span class="checkmark"></span></label></td>
      <td class="col-star"><button class="star-btn ${starred ? "starred" : ""}" data-id="${q.id}" onclick="toggleBookmark(${q.id})" title="Bookmark">${starred ? "★" : "☆"}</button></td>
      <td class="col-id">${q.id}</td>
      <td class="col-title">
  <a href="${q.link}" target="_blank" rel="noopener">${q.title}</a>
  ${solved ? `<button class="note-btn-inline ${hasNote ? "has-note" : ""}" data-id="${q.id}" onclick="openNoteModal(${q.id})" title="${hasNote ? "Edit note" : "Add note"}">${hasNote ? "📝" : "✎"}</button>` : ""}
  ${solved && !timeLog ? `<span class="time-badge" style="opacity:.4">N/A</span>` : timeLog ? `<span class="time-badge">${timeLog}m</span>` : ""}
</td>
      <td class="col-diff"><span class="diff-badge ${diffClass}">${q.difficulty}</span></td>
      <td class="col-accept">${q.acceptance}</td>
      <td class="col-companies" data-cid="${q.id}">${buildCompanyTags(q)}</td>
    </tr>`;
    })
    .join("");
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
  const el = document.getElementById("pagination");
  if (total <= 1) {
    el.innerHTML = "";
    return;
  }
  const s = (state.page - 1) * ITEMS_PER_PAGE + 1;
  const e = Math.min(state.page * ITEMS_PER_PAGE, state.filtered.length);
  el.innerHTML = `
    <button onclick="goPage(${state.page - 1})" ${state.page === 1 ? "disabled" : ""}>← Prev</button>
    <span class="page-info">Page <strong>${state.page}</strong> of <strong>${total}</strong> &nbsp;·&nbsp; ${s}–${e} of ${state.filtered.length}</span>
    <button onclick="goPage(${state.page + 1})" ${state.page === total ? "disabled" : ""}>Next →</button>
  `;
}
function goPage(p) {
  const total = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
  if (p < 1 || p > total) return;
  state.page = p;
  renderTable();
}

// ─── Render: Stats bar ─────────────────────────────────────────────────────────
function renderStats() {
  const all = state.questions;
  const solved = Object.keys(state.solved).length;
  const pct = all.length ? Math.round((solved / all.length) * 100) : 0;
  document.getElementById("stat-total").textContent = all.length;
  document.getElementById("stat-easy").textContent = all.filter(
    (q) => q.difficulty === "Easy",
  ).length;
  document.getElementById("stat-medium").textContent = all.filter(
    (q) => q.difficulty === "Medium",
  ).length;
  document.getElementById("stat-hard").textContent = all.filter(
    (q) => q.difficulty === "Hard",
  ).length;
  document.getElementById("stat-solved").textContent = solved;
  document.getElementById("stat-pct").textContent = pct + "%";
  document.getElementById("progress-bar-fill").style.width = pct + "%";
}

// ─── Render: Auth Area ─────────────────────────────────────────────────────────
function renderAuthArea() {
  const el = document.getElementById("auth-area");
  if (state.user) {
    el.innerHTML = `<img src="${state.user.avatar_url}" class="nav-avatar" alt=""><span class="nav-username">@${state.user.login}</span>`;
  } else {
    el.innerHTML = `<button class="btn-github-sm" onclick="loginWithGitHub()"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>Login with GitHub</button>`;
  }
}

// ─── Onboarding ────────────────────────────────────────────────────────────────
function checkOnboarding() {
  const done = localStorage.getItem("onboarding_done");
  if (
    !done &&
    state.questions.length > 0 &&
    Object.keys(state.solved).length === 0
  ) {
    document.getElementById("onboarding-overlay").style.display = "flex";
  }
}
function closeOnboarding() {
  document.getElementById("onboarding-overlay").style.display = "none";
  localStorage.setItem("onboarding_done", "1");
}

// ─── Keyboard Shortcuts ────────────────────────────────────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeNoteModal();
      closeStudyPlan();
      closeModal();
      closeUnsolveModal();
      closeRandomPicker();
      closeOnboarding();
      return;
    }
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      openRandomPicker();
    }
    if (e.key === "/") {
      e.preventDefault();
      document.getElementById("search-input")?.focus();
    }
    if (e.key === "1") {
      e.preventDefault();
      showPage("tracker");
    }
    if (e.key === "2") {
      e.preventDefault();
      showPage("profile");
    }
    if (e.key === "3") {
      e.preventDefault();
      showPage("insights");
    }
  });
}

// ─── Render: Profile Page ──────────────────────────────────────────────────────
function renderProfilePage() {
  if (!state.user) {
    document.getElementById("profile-guest").style.display = "flex";
    document.getElementById("profile-content").style.display = "none";
    return;
  }
  document.getElementById("profile-guest").style.display = "none";
  document.getElementById("profile-content").style.display = "block";
  document.getElementById("profile-avatar").src = state.user.avatar_url;
  document.getElementById("profile-name").textContent =
    state.user.name || state.user.login;
  document.getElementById("profile-handle").textContent =
    "@" + state.user.login;
  const { current, longest, totalDays } = calcStreaks();
  animateNumber("streak-number", current);
  animateNumber("longest-streak", longest);
  animateNumber("total-days", totalDays);
  animateNumber("total-solved-profile", Object.keys(state.solved).length);
  const streakCard = document.getElementById("streak-card");
  const flame = document.getElementById("streak-flame");
  const sub = document.getElementById("streak-sub");
  streakCard.classList.remove(
    "streak-cold",
    "streak-warm",
    "streak-hot",
    "streak-fire",
  );
  if (current === 0) {
    streakCard.classList.add("streak-cold");
    flame.textContent = "💤";
    sub.textContent = "Solve a problem today to start your streak!";
  } else if (current < 3) {
    streakCard.classList.add("streak-warm");
    flame.textContent = "🔥";
    sub.textContent = "Keep going! You're building momentum.";
  } else if (current < 7) {
    streakCard.classList.add("streak-hot");
    flame.textContent = "🔥";
    sub.textContent = `${current} days strong! Don't break the chain.`;
  } else {
    streakCard.classList.add("streak-fire");
    flame.textContent = "🔥";
    sub.textContent = `${current} day streak! You're on fire! 🚀`;
  }
  renderHeatmap();
  const solvedIds = new Set(Object.keys(state.solved).map(Number));
  const solved = state.questions.filter((q) => solvedIds.has(q.id));
  const byDiff = (d) => ({
    s: solved.filter((q) => q.difficulty === d).length,
    t: state.questions.filter((q) => q.difficulty === d).length,
  });
  const easy = byDiff("Easy"),
    medium = byDiff("Medium"),
    hard = byDiff("Hard");
  setDiffBar("bar-easy", "count-easy", easy.s, easy.t);
  setDiffBar("bar-medium", "count-medium", medium.s, medium.t);
  setDiffBar("bar-hard", "count-hard", hard.s, hard.t);
  renderCompanyCoverage(solvedIds);
  const timeLogs = Object.entries(state.timeLogs)
    .map(([id, m]) => ({
      id: +id,
      m,
      q: state.questions.find((x) => x.id === +id),
    }))
    .filter((x) => x.q);
  const avgTime = timeLogs.length
    ? Math.round(timeLogs.reduce((s, x) => s + x.m, 0) / timeLogs.length)
    : null;
  const timeEl = document.getElementById("profile-avg-time");
  if (timeEl) timeEl.textContent = avgTime ? `~${avgTime}m avg solve time` : "";
  const recent = Object.entries(state.solved)
    .map(([id, date]) => ({ id: +id, date }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  const recentEl = document.getElementById("recent-solves");
  if (!recent.length) {
    recentEl.innerHTML = `<div class="empty-recent">No solves yet. Go crush some problems! 💪</div>`;
  } else {
    recentEl.innerHTML = recent
      .map(({ id, date }) => {
        const q = state.questions.find((x) => x.id === id);
        if (!q) return "";
        const t = state.timeLogs[id];
        return `<div class="recent-item">
  <span class="recent-diff ${q.difficulty.toLowerCase()}"></span>
  <div class="recent-title-wrap">
    <a href="${q.link}" target="_blank" class="recent-title">${q.title}</a>
  </div>
  ${state.notes[id] ? `<span class="recent-note-icon" onclick="openNoteModal(${id}); event.preventDefault()" title="View note">📝</span>` : ""}
  ${t ? `<span class="time-badge">${t}m</span>` : ""}
  <span class="recent-date">${formatDate(date)}</span>
  <span class="diff-badge ${q.difficulty.toLowerCase()} sm">${q.difficulty}</span>
</div>`;
      })
      .join("");
  }
}

// ─── Company Coverage ──────────────────────────────────────────────────────────
function renderCompanyCoverage(solvedIds) {
  const coverage = document.getElementById("company-coverage");
  const companyData = state.companies
    .map((c) => {
      const qfc = state.questions.filter((q) => q.companies.includes(c));
      const sfc = qfc.filter((q) => solvedIds.has(q.id));
      return { company: c, solved: sfc.length, total: qfc.length };
    })
    .sort((a, b) => b.solved / b.total - a.solved / a.total);
  const limit = 8;
  const showAll = state.coverageExpanded;
  const toShow = showAll ? companyData : companyData.slice(0, limit);
  const hasMore = companyData.length > limit;
  coverage.innerHTML =
    toShow
      .map(({ company, solved, total }) => {
        const pct = total ? Math.round((solved / total) * 100) : 0;
        return `<div class="company-row"><span class="company-row-name">${formatCompany(company)}</span><div class="company-row-bar-wrap"><div class="company-row-bar" style="width:${pct}%"></div></div><span class="company-row-count">${solved}/${total}</span></div>`;
      })
      .join("") +
    (hasMore
      ? `<button class="coverage-toggle" onclick="toggleCoverageExpand()">${showAll ? "▲ Show less" : `▼ Show all ${companyData.length} companies`}</button>`
      : "");
}
function toggleCoverageExpand() {
  state.coverageExpanded = !state.coverageExpanded;
  const solvedIds = new Set(Object.keys(state.solved).map(Number));
  renderCompanyCoverage(solvedIds);
}
function setDiffBar(barId, countId, s, t) {
  const pct = t ? (s / t) * 100 : 0;
  setTimeout(() => {
    document.getElementById(barId).style.width = pct + "%";
    document.getElementById(countId).textContent = `${s} / ${t}`;
  }, 100);
}
function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  const steps = 30;
  let i = 0;
  const tick = setInterval(() => {
    i++;
    el.textContent = Math.round(start + diff * (i / steps));
    if (i >= steps) {
      el.textContent = target;
      clearInterval(tick);
    }
  }, 16);
}
function formatDate(str) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Heatmap ───────────────────────────────────────────────────────────────────
function renderHeatmap() {
  const el = document.getElementById("heatmap");
  const weeks = 16;
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);
  const maxVal = Math.max(1, ...Object.values(state.activity));
  let html = "";
  for (let w = 0; w < weeks; w++) {
    html += `<div class="heatmap-col">`;
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = dateStr(date);
      const count = state.activity[key] || 0;
      const level = count === 0 ? 0 : Math.ceil((count / maxVal) * 4);
      const future = date > today;
      html += `<div class="heatmap-cell l${future ? 0 : level} ${future ? "future" : ""}" title="${key}: ${count} solve${count !== 1 ? "s" : ""}"></div>`;
    }
    html += `</div>`;
  }
  el.innerHTML = html;
}

// ─── Modals ────────────────────────────────────────────────────────────────────
function confirmClearData() {
  document.getElementById("modal-overlay").style.display = "flex";
}
function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
}
async function clearAllData() {
  state.solved = {};
  state.activity = {};
  state.bookmarks = {};
  state.notes = {};
  state.timeLogs = {};
  saveLocalProgress();
  if (state.token) await saveProgressToGist();
  closeModal();
  renderProfilePage();
  renderStats();
  renderTable();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatCompany(name) {
  return name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
function updateSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === state.sortCol)
      th.classList.add(state.sortDir === "asc" ? "sort-asc" : "sort-desc");
  });
}
function showError(msg) {
  document.getElementById("loading").innerHTML =
    `<div class="error-state">⚠️ ${msg}</div>`;
}

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  initTheme();
  const params = new URLSearchParams(window.location.search);
  const oauthToken = params.get("token");
  if (oauthToken) {
    localStorage.setItem("gh_token", oauthToken);
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.hash,
    );
  }
  state.token = oauthToken || localStorage.getItem("gh_token");
  if (state.token) {
    try {
      state.user = await fetchGitHubUser(state.token);
      await loadProgressFromGist();
    } catch (_) {
      state.token = null;
      localStorage.removeItem("gh_token");
    }
  } else {
    loadLocalProgress();
  }
  renderAuthArea();
  try {
    await loadAllCSVs();
  } catch (e) {
    showError("Failed to load question data. " + e.message);
    return;
  }
  document.getElementById("loading").style.display = "none";
  document.getElementById("main-content").style.display = "block";
  document
    .querySelectorAll(".pill-diff")
    .forEach((btn) =>
      btn.addEventListener("click", () => toggleDiffFilter(btn.dataset.diff)),
    );
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    applyFilters();
  });
  document.getElementById("clear-filters").addEventListener("click", () => {
    state.filters = {
      search: "",
      difficulties: [],
      companies: [],
      status: "all",
      starred: false,
      review: false,
    };
    document.getElementById("search-input").value = "";
    document.getElementById("filter-starred-btn").classList.remove("active");
    document.getElementById("filter-review-btn").classList.remove("active");
    renderDiffPills();
    clearCompanyFilters();
    renderCompanyCheckboxList("");
    updateStatusDropdown();
    state.sortCol = "id";
    state.sortDir = "asc";
    updateSortBtn();
    applyFilters();
  });
  document
    .querySelectorAll("th[data-sort]")
    .forEach((th) =>
      th.addEventListener("click", () => setSort(th.dataset.sort)),
    );
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);
  document
    .getElementById("note-modal-overlay")
    .addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeNoteModal();
    });
  document
    .getElementById("import-file-input")
    .addEventListener("change", handleImportFile);
  initKeyboardShortcuts();
  applyFilters();
  initRouting();
  setTimeout(checkOnboarding, 800);
}
document.addEventListener("DOMContentLoaded", init);

// ─── Insights ──────────────────────────────────────────────────────────────────
function renderInsightsPage() {
  if (!state.questions.length) return;
  renderInsightsRibbon();
  renderHotQuestions();
  renderDiffChart();
  renderSolveRate();
  renderCompanyLeaderboard("");
  renderTodoBreakdown();
  renderNextToSolve();
  renderTimeStats();
}
function renderInsightsRibbon() {
  const total = state.questions.length;
  const solved = Object.keys(state.solved).length;
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const companies = state.companies.length;
  const streak = getCurrentStreak();
  const starred = Object.keys(state.bookmarks).length;
  document.getElementById("insights-ribbon").innerHTML = `
    <div class="ribbon-item"><div class="ribbon-val">${total}</div><div class="ribbon-label">Total Questions</div></div>
    <div class="ribbon-item"><div class="ribbon-val accent-text">${solved}</div><div class="ribbon-label">Solved</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${pct}%</div><div class="ribbon-label">Completion</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${companies}</div><div class="ribbon-label">Companies</div></div>
    <div class="ribbon-item"><div class="ribbon-val streak-text">${streak}🔥</div><div class="ribbon-label">Day Streak</div></div>
    <div class="ribbon-item"><div class="ribbon-val" style="color:var(--accent)">★ ${starred}</div><div class="ribbon-label">Bookmarked</div></div>
  `;
}
function getCurrentStreak() {
  const days = Object.keys(state.activity)
    .filter((d) => state.activity[d] > 0)
    .sort();
  if (!days.length) return 0;
  let streak = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (state.activity[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
function renderHotQuestions() {
  const sorted = [...state.questions]
    .sort((a, b) => b.companies.length - a.companies.length)
    .slice(0, 15);
  const max = sorted[0]?.companies.length || 1;
  document.getElementById("insights-hot").innerHTML = sorted
    .map((q, i) => {
      const pct = Math.round((q.companies.length / max) * 100);
      const solved = !!state.solved[q.id];
      const diffCls = q.difficulty.toLowerCase();
      return `<div class="hot-row ${solved ? "hot-row-solved" : ""}" onclick="window.open('${q.link}', '_blank')">
      <span class="hot-rank">${i + 1}</span>
      <div class="hot-bar-wrap"><div class="hot-title">${q.title} <span class="diff-badge diff-${diffCls}">${q.difficulty}</span>${solved ? ' <span class="solved-tick">✓</span>' : ""}</div>
      <div class="hot-bar-bg"><div class="hot-bar-fill diff-fill-${diffCls}" style="width:${pct}%"></div></div></div>
      <span class="hot-count">${q.companies.length} co.</span>
    </div>`;
    })
    .join("");
}
function renderDiffChart() {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  state.questions.forEach((q) => {
    if (counts[q.difficulty] !== undefined) counts[q.difficulty]++;
  });
  const total = state.questions.length || 1;
  const rows = [
    { label: "Easy", count: counts.Easy, cls: "easy", color: "var(--green)" },
    {
      label: "Medium",
      count: counts.Medium,
      cls: "medium",
      color: "var(--yellow)",
    },
    { label: "Hard", count: counts.Hard, cls: "hard", color: "var(--red)" },
  ];
  const maxCount = Math.max(...rows.map((r) => r.count)) || 1;
  document.getElementById("insights-diff-chart").innerHTML = `
    <div class="diff-donut-wrap"><svg viewBox="0 0 120 120" class="diff-donut">${buildDonut(rows, total)}</svg>
    <div class="donut-center"><div class="donut-total">${total}</div><div class="donut-label">total</div></div></div>
    <div class="diff-legend">${rows
      .map(
        (r) => `
      <div class="diff-legend-row"><span class="diff-legend-dot" style="background:${r.color}"></span><span class="diff-legend-name ${r.cls}-text">${r.label}</span>
      <div class="diff-legend-bar-bg"><div class="diff-legend-bar" style="width:${Math.round((r.count / maxCount) * 100)}%;background:${r.color}"></div></div>
      <span class="diff-legend-count">${r.count}</span><span class="diff-legend-pct">${Math.round((r.count / total) * 100)}%</span></div>`,
      )
      .join("")}
    </div>`;
}
function buildDonut(rows, total) {
  const cx = 60,
    cy = 60,
    r = 48,
    stroke = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const colors = {
    Easy: "var(--green)",
    Medium: "var(--yellow)",
    Hard: "var(--red)",
  };
  return rows
    .map((row) => {
      const frac = row.count / (total || 1);
      const dash = frac * circ;
      const gap = circ - dash;
      const svg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[row.label]}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}" stroke-dashoffset="${((-offset * circ) / (total || 1)).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" opacity="0.85"/>`;
      offset += row.count;
      return svg;
    })
    .join("");
}
function renderSolveRate() {
  const buckets = {
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 },
  };
  state.questions.forEach((q) => {
    if (!buckets[q.difficulty]) return;
    buckets[q.difficulty].total++;
    if (state.solved[q.id]) buckets[q.difficulty].solved++;
  });
  const rows = [
    { label: "Easy", ...buckets.Easy, cls: "easy", color: "var(--green)" },
    {
      label: "Medium",
      ...buckets.Medium,
      cls: "medium",
      color: "var(--yellow)",
    },
    { label: "Hard", ...buckets.Hard, cls: "hard", color: "var(--red)" },
  ];
  const totalSolved = rows.reduce((s, r) => s + r.solved, 0);
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  document.getElementById("insights-solve-rate").innerHTML = `
    <div class="solve-overall"><div class="solve-overall-num accent-text">${totalSolved} <span>/ ${totalAll}</span></div><div class="solve-overall-label">Total solved</div></div>
    ${rows
      .map((r) => {
        const pct = r.total ? Math.round((r.solved / r.total) * 100) : 0;
        return `
      <div class="solve-row"><div class="solve-row-top"><span class="${r.cls}-text">${r.label}</span><span class="solve-nums">${r.solved} / ${r.total}</span><span class="solve-pct">${pct}%</span></div>
      <div class="solve-bar-bg"><div class="solve-bar-fill" style="width:${pct}%;background:${r.color}"></div></div></div>`;
      })
      .join("")}`;
}
function renderCompanyLeaderboard(search) {
  const q = (search || "").toLowerCase();
  const companies = state.companies.filter(
    (c) => !q || c.includes(q) || formatCompany(c).toLowerCase().includes(q),
  );
  const data = companies
    .map((c) => {
      const qs = state.questions.filter((q) => q.companies.includes(c));
      const solved = qs.filter((q) => state.solved[q.id]).length;
      const diff = { easy: 0, medium: 0, hard: 0 };
      qs.forEach((q) => {
        const d = q.difficulty.toLowerCase();
        if (diff[d] !== undefined) diff[d]++;
      });
      return { c, qs: qs.length, solved, diff };
    })
    .sort((a, b) => b.qs - a.qs);
  const maxQs = data[0]?.qs || 1;
  document.getElementById("insights-companies").innerHTML = data
    .map((row, i) => {
      const pct = Math.round((row.solved / (row.qs || 1)) * 100);
      const barW = Math.round((row.qs / maxQs) * 100);
      return `<div class="co-row"><span class="co-rank">${i + 1}</span>
      <div class="co-info"><div class="co-top"><span class="co-name">${formatCompany(row.c)}</span>
        <span class="co-tags"><span class="co-diff easy-text">${row.diff.easy}E</span><span class="co-diff medium-text">${row.diff.medium}M</span><span class="co-diff hard-text">${row.diff.hard}H</span></span>
        <span class="co-solved-badge ${pct === 100 ? "co-complete" : ""}">${row.solved}/${row.qs} <span class="co-pct">${pct}%</span></span></div>
      <div class="co-bar-bg"><div class="co-bar-fill" style="width:${barW}%"></div><div class="co-bar-solved" style="width:${Math.round((row.solved / maxQs) * 100)}%"></div></div></div>
      <button class="sp-launch-btn" onclick="openStudyPlan('${row.c}')" title="Open Study Plan">📋</button></div>`;
    })
    .join("");
}
function renderTodoBreakdown() {
  const unsolved = state.questions.filter((q) => !state.solved[q.id]);
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  unsolved.forEach((q) => {
    if (counts[q.difficulty] !== undefined) counts[q.difficulty]++;
  });
  const reviewCutoff = dateStr(new Date(Date.now() - 7 * 86400000));
  const reviewDue = Object.entries(state.solved).filter(
    ([, date]) => date <= reviewCutoff,
  ).length;
  document.getElementById("insights-todo").innerHTML = `
    <div class="todo-total">${unsolved.length} <span>unsolved</span></div>
    ${[
      { label: "Easy", count: counts.Easy, cls: "easy", color: "var(--green)" },
      {
        label: "Medium",
        count: counts.Medium,
        cls: "medium",
        color: "var(--yellow)",
      },
      { label: "Hard", count: counts.Hard, cls: "hard", color: "var(--red)" },
    ]
      .map((r) => {
        const pct = unsolved.length
          ? Math.round((r.count / unsolved.length) * 100)
          : 0;
        return `<div class="todo-row"><span class="${r.cls}-text todo-label">${r.label}</span><div class="todo-bar-bg"><div class="todo-bar" style="width:${pct}%;background:${r.color}"></div></div><span class="todo-count">${r.count}</span></div>`;
      })
      .join("")}
    ${reviewDue > 0 ? `<div class="review-due-badge" onclick="showPage('tracker'); state.filters.review=true; document.getElementById('filter-review-btn').classList.add('active'); applyFilters();">🔁 ${reviewDue} problem${reviewDue > 1 ? "s" : ""} due for review</div>` : ""}`;
}
function renderNextToSolve() {
  const unsolved = [...state.questions]
    .filter((q) => !state.solved[q.id])
    .sort((a, b) => b.companies.length - a.companies.length)
    .slice(0, 10);
  const max = unsolved[0]?.companies.length || 1;
  document.getElementById("insights-next").innerHTML =
    unsolved
      .map((q, i) => {
        const pct = Math.round((q.companies.length / max) * 100);
        const diffCls = q.difficulty.toLowerCase();
        const starred = !!state.bookmarks[q.id];
        return `<div class="hot-row" onclick="window.open('${q.link}', '_blank')"><span class="hot-rank">${i + 1}</span>
      <div class="hot-bar-wrap"><div class="hot-title">${q.title} <span class="diff-badge diff-${diffCls}">${q.difficulty}</span>${starred ? ' <span style="color:var(--accent)">★</span>' : ""}</div>
      <div class="hot-bar-bg"><div class="hot-bar-fill diff-fill-${diffCls}" style="width:${pct}%"></div></div></div>
      <span class="hot-count">${q.companies.length} co.</span></div>`;
      })
      .join("") ||
    `<div class="empty-insights">🎉 All high-frequency problems solved!</div>`;
}
function renderTimeStats() {
  const el = document.getElementById("insights-time");
  if (!el) return;
  const logs = Object.entries(state.timeLogs)
    .map(([id, m]) => ({
      id: +id,
      m,
      q: state.questions.find((x) => x.id === +id),
    }))
    .filter((x) => x.q && x.m);

  // ── Solve pace (problems/week from activity) ───────────────────────────────
  const activityDays = Object.keys(state.activity)
    .filter((d) => state.activity[d] > 0)
    .sort();
  let paceHtml = "";
  if (activityDays.length >= 2) {
    const firstDay = new Date(activityDays[0]);
    const lastDay = new Date(activityDays[activityDays.length - 1]);
    const weeks = Math.max(1, (lastDay - firstDay) / (7 * 86400000));
    const totalSolved = Object.keys(state.solved).length;
    const pace = (totalSolved / weeks).toFixed(1);
    const last7 = dateStr(new Date(Date.now() - 7 * 86400000));
    const last7Count = Object.values(state.activity).reduce(
      (s, v, i) => (Object.keys(state.activity)[i] >= last7 ? s + v : s),
      0,
    );
    paceHtml = `
      <div class="smart-stat-row">
        <div class="smart-stat"><div class="smart-stat-val accent-text">${pace}</div><div class="smart-stat-label">problems/week (all time)</div></div>
        <div class="smart-stat"><div class="smart-stat-val">${last7Count}</div><div class="smart-stat-label">solved last 7 days</div></div>
        <div class="smart-stat"><div class="smart-stat-val">${activityDays.length}</div><div class="smart-stat-label">active days total</div></div>
      </div>`;
  }

  if (!logs.length) {
    el.innerHTML = `
      ${paceHtml ? `<div><div class="time-section-title">Time Distribution <span style="font-size:9px;color:var(--text-dim);font-weight:400">(how many problems solved in each time range, split by difficulty)</span></div>` : ""}
      <div class="empty-insights">No time logs yet. Solve a problem and log your time via the ✎ button — time analytics will appear here.</div>`;
    return;
  }

  const total = logs.reduce((s, x) => s + x.m, 0);
  const avg = Math.round(total / logs.length);
  const sorted = [...logs].sort((a, b) => a.m - b.m);
  const median = sorted[Math.floor(sorted.length / 2)].m;

  const byDiff = { Easy: [], Medium: [], Hard: [] };
  logs.forEach(({ m, q }) => {
    if (byDiff[q.difficulty]) byDiff[q.difficulty].push(m);
  });

  const avgOf = (arr) =>
    arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
  const medianOf = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  // Consistency: lower stddev = more consistent. Show as a score 0-100
  const stdDev = (arr) => {
    if (arr.length < 2) return null;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
  };
  const consistencyScore = (arr) => {
    if (arr.length < 2) return null;
    const sd = stdDev(arr);
    const mean = avgOf(arr);
    const cv = sd / mean; // coefficient of variation
    return Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
  };

  const diffColor = {
    Easy: "var(--green)",
    Medium: "var(--yellow)",
    Hard: "var(--red)",
  };

  const outliers = logs
    .filter((x) => x.q && byDiff[x.q.difficulty].length >= 2)
    .map((x) => {
      const diffAvg = avgOf(byDiff[x.q.difficulty]);
      const delta = x.m - diffAvg;
      const pct = Math.round((delta / diffAvg) * 100);
      return { ...x, diffAvg, delta, pct };
    })
    .filter((x) => x.diffAvg !== null)
    .sort((a, b) => b.pct - a.pct);

  const slow = outliers.filter((x) => x.pct > 10).slice(0, 3);
  const fast = outliers
    .filter((x) => x.pct < -10)
    .reverse()
    .slice(0, 3);

  const hasEnoughData = Object.values(byDiff).some(arr => arr.length >= 2);

  const outlierHtml =
    hasEnoughData
      ? `
  <div><div class="time-section-title">Performance vs Your Average 
  <span style="font-size:10px;color:var(--text-muted);font-weight:400;text-transform:none">— Easy avg ${avgOf(byDiff.Easy) ?? "—"}m · Medium avg ${avgOf(byDiff.Medium) ?? "—"}m · Hard avg ${avgOf(byDiff.Hard) ?? "—"}m</span>
  </div>
    <div class="outlier-grid">
      ${slow.length
        ? `<div class="outlier-col">
        <div class="outlier-heading" style="color:var(--red)">🐢 Took longer than usual</div>
        ${slow
          .map(
            (
              x,
            ) => `<div class="time-problem-row" onclick="window.open('${x.q.link}','_blank')">
          <span class="time-problem-diff-dot" style="background:${diffColor[x.q.difficulty]}"></span>
          <span class="time-problem-name">${x.q.title}</span>
          <span class="diff-badge diff-${x.q.difficulty.toLowerCase()} sm" style="flex-shrink:0;margin-right:4px">${x.q.difficulty[0]}</span>
          <span class="time-problem-badge" style="color:var(--red)">${x.m}m</span>
          <span class="outlier-delta">+${x.pct}%</span>
        </div>`,
          )
          .join("")}
      </div>`
        : ""
      }
      ${fast.length
        ? `<div class="outlier-col">
        <div class="outlier-heading" style="color:var(--green)">⚡ Faster than usual</div>
        ${fast
          .map(
            (
              x,
            ) => `<div class="time-problem-row" onclick="window.open('${x.q.link}','_blank')">
          <span class="time-problem-diff-dot" style="background:${diffColor[x.q.difficulty]}"></span>
          <span class="time-problem-name">${x.q.title}</span>
          <span class="diff-badge diff-${x.q.difficulty.toLowerCase()} sm" style="flex-shrink:0;margin-right:4px">${x.q.difficulty[0]}</span>
          <span class="time-problem-badge" style="color:var(--green)">${x.m}m</span>
          <span class="outlier-delta" style="color:var(--green)">${x.pct}%</span>
        </div>`,
          )
          .join("")}
      </div>`
        : ""
      }
    </div>
  </div>`
      : "";

  // Buckets
  const buckets = [
    { label: "≤15m", min: 0, max: 15 },
    { label: "≤30m", min: 15, max: 30 },
    { label: "≤60m", min: 30, max: 60 },
    { label: "≤2h", min: 60, max: 120 },
    { label: "2h+", min: 120, max: Infinity },
  ];
  buckets.forEach((b) => {
    b.easy = logs.filter(
      (x) => x.q.difficulty === "Easy" && x.m > b.min && x.m <= b.max,
    ).length;
    b.medium = logs.filter(
      (x) => x.q.difficulty === "Medium" && x.m > b.min && x.m <= b.max,
    ).length;
    b.hard = logs.filter(
      (x) => x.q.difficulty === "Hard" && x.m > b.min && x.m <= b.max,
    ).length;
    b.total = b.easy + b.medium + b.hard;
  });
  const maxBucket = Math.max(...buckets.map((b) => b.total), 1);

  el.innerHTML = `<div class="time-analytics-wrap">
    ${paceHtml ? `<div><div class="time-section-title">Solve Pace</div>${paceHtml}</div>` : ""}
    <div><div class="time-section-title">Overview</div>
      <div class="time-stats-summary">
        ${[
      { label: "Problems timed", val: logs.length },
      {
        label: "Total time",
        val:
          total >= 60
            ? `${Math.floor(total / 60)}h ${total % 60}m`
            : `${total}m`,
      },
      { label: "Average", val: avg + "m", cls: "accent-text" },
      { label: "Median", val: median + "m" },
      { label: "Fastest", val: sorted[0].m + "m", cls: "easy-text" },
    ]
      .map(
        (r) =>
          `<div class="time-stat-card"><div class="time-stat-val ${r.cls || ""}">${r.val}</div><div class="time-stat-label">${r.label}</div></div>`,
      )
      .join("")}
      </div>
    </div>
    <div><div class="time-section-title">Time Distribution</div>
      <div class="time-histogram">
        ${buckets
      .map((b) => {
        const heightPct = Math.round((b.total / maxBucket) * 100);
        const easyH = b.total
          ? Math.round((b.easy / b.total) * heightPct)
          : 0;
        const medH = b.total
          ? Math.round((b.medium / b.total) * heightPct)
          : 0;
        const hardH = heightPct - easyH - medH;
        return `<div class="time-hist-col">
            <div class="time-hist-count">${b.total || ""}</div>
            <div class="time-hist-bar-wrap"><div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;height:${heightPct}%;min-height:${b.total ? "4px" : "0"}">
              ${hardH > 0 ? `<div style="height:${hardH}%;background:var(--red);min-height:2px"></div>` : ""}
              ${medH > 0 ? `<div style="height:${medH}%;background:var(--yellow);min-height:2px"></div>` : ""}
              ${easyH > 0 ? `<div style="height:${easyH}%;background:var(--green);min-height:2px"></div>` : ""}
            </div></div>
            <div class="time-hist-label">${b.label}</div>
          </div>`;
      })
      .join("")}
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;font-size:10px;color:var(--text-muted)">
        <span><span style="color:var(--green)">■</span> Easy</span>
        <span><span style="color:var(--yellow)">■</span> Medium</span>
        <span><span style="color:var(--red)">■</span> Hard</span>
      </div>
    </div>
    ${outlierHtml}
  </div>`;
}