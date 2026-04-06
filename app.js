"use strict";

// ─── Config ────────────────────────────────────────────────────────────────────
const GITHUB_CLIENT_ID = window.GITHUB_CLIENT_ID || "YOUR_CLIENT_ID_HERE";
const GIST_FILENAME = "leetcode-tracker-progress.json";
const ITEMS_PER_PAGE = 20;
const CACHE_KEY = "leet_csv_cache";

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

const SM2_INTERVALS = [1, 3, 7, 14, 30, 90];

// ─── State ─────────────────────────────────────────────────────────────────────
const state = {
  questions: [],
  filtered: [],
  solved: {}, // id -> dateStr
  activity: {}, // dateStr -> count
  bookmarks: {}, // id -> true
  notes: {}, // id -> string  (manual enrichment, kept)
  reviewData: {}, // id -> { intervalIdx, nextReviewDate, reps, lastReviewed }
  user: null, // GitHub user object
  token: null, // GitHub OAuth token
  gistId: null,
  lcUsername: null, // LeetCode username
  lcSyncing: false, // sync in progress flag
  page: 1,
  companies: [],
  allTags: [],
  metaMap: {},
  filters: {
    search: "",
    difficulties: [],
    companies: [],
    patterns: [],
    status: "all",
    starred: false,
    review: false,
  },
  sortCol: "id",
  sortDir: "asc",
  coverageExpanded: false,
  expandedRows: new Set(),
  studyPlanCompany: null,
  activePlatform: "lc",
  cfMeta: {},
  cfSolved: {},
  cfActivity: {},
  cfBookmarks: {},
  cfReviewData: {},
  cfUsername: null,
  cfUserInfo: null,
  cfFilters: { search: "", minRating: 800, maxRating: 3500, tags: [], status: "all", starred: false, review: false },
  cfPage: 1,
  cfFiltered: [],
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

// ─── GitHub Auth ───────────────────────────────────────────────────────────────
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
  state.lcUsername = null;
  localStorage.removeItem("gh_token");
  localStorage.removeItem("gh_gist_id");
  localStorage.removeItem("lc_username");
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
    reviewData: state.reviewData,
    lcUsername: state.lcUsername || null,
    cfSolved: state.cfSolved,
    cfActivity: state.cfActivity,
    cfBookmarks: state.cfBookmarks,
    cfReviewData: state.cfReviewData,
    cfUsername: state.cfUsername || null,
  });
}

function deserializeProgress(content) {
  try {
    const data = JSON.parse(content);
    // migrate old boolean solved values
    if (data.solved) {
      for (const id in data.solved) {
        if (data.solved[id] === true) data.solved[id] = "2024-01-01";
      }
    }
    state.solved = data.solved || {};
    state.activity = data.activity || {};
    state.bookmarks = data.bookmarks || {};
    state.notes = data.notes || {};
    state.reviewData = data.reviewData || {};
    state.cfSolved = data.cfSolved || {};
    state.cfActivity = data.cfActivity || {};
    state.cfBookmarks = data.cfBookmarks || {};
    state.cfReviewData = data.cfReviewData || {};
    // restore LC username from gist if present
    if (data.lcUsername) {
      state.lcUsername = data.lcUsername;
      localStorage.setItem("lc_username", data.lcUsername);
    }
    if (data.cfUsername) {
      state.cfUsername = data.cfUsername;
      localStorage.setItem("cf_username", data.cfUsername);
    }
  } catch (_) {}
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
    } catch (_) {}
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
  if (!state.token) return;
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

function saveProgress() {
  saveLocalProgress();
  if (state.token) saveProgressToGist();
}

// ─── Export / Import ───────────────────────────────────────────────────────────
function exportProgress() {
  const data = {
    exportedAt: new Date().toISOString(),
    solved: state.solved,
    activity: state.activity,
    bookmarks: state.bookmarks,
    notes: state.notes,
    reviewData: state.reviewData,
    lcUsername: state.lcUsername || null,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `algotrack-lc-backup-${dateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCFProgress() {
  const data = {
    exportedAt: new Date().toISOString(),
    cfSolved: state.cfSolved,
    cfActivity: state.cfActivity,
    cfUsername: state.cfUsername || null,
    cfUserInfo: state.cfUserInfo || null,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `algotrack-cf-backup-${dateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
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
      state.reviewData = data.reviewData || {};
      if (data.lcUsername) {
        state.lcUsername = data.lcUsername;
        localStorage.setItem("lc_username", data.lcUsername);
      }
      saveProgress();
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

// ─── LeetCode Sync ─────────────────────────────────────────────────────────────
function openLCModal() {
  const modal = document.getElementById("lc-modal-overlay");
  const input = document.getElementById("lc-username-input");
  if (input) input.value = state.lcUsername || "";
  if (modal) modal.style.display = "flex";
}
function closeLCModal() {
  const modal = document.getElementById("lc-modal-overlay");
  if (modal) modal.style.display = "none";
}

async function saveLCUsername() {
  const input = document.getElementById("lc-username-input");
  const username = input?.value.trim();
  if (!username) {
    showToast("❌ Please enter a username", "error");
    return;
  }
  state.lcUsername = username;
  localStorage.setItem("lc_username", username);
  closeLCModal();
  renderAuthArea();
  // save to gist so it persists across devices
  saveProgress();
  // immediately kick off a sync
  await syncLeetCode();
}

function disconnectLC() {
  state.lcUsername = null;
  localStorage.removeItem("lc_username");
  saveProgress();
  renderAuthArea();
  showToast("LeetCode disconnected");
}

function openFullSyncModal() {
  document.getElementById("full-sync-session-input").value = "";
  document.getElementById("full-sync-status").textContent = "";
  document.getElementById("full-sync-modal-overlay").style.display = "flex";
}
function closeFullSyncModal() {
  document.getElementById("full-sync-modal-overlay").style.display = "none";
}

async function runFullHistorySync() {
  if (!state.lcUsername) {
    showToast("❌ No LeetCode username connected", "error");
    return;
  }
  const session = document
    .getElementById("full-sync-session-input")
    ?.value.trim();
  if (!session) {
    showToast("❌ Please paste your LEETCODE_SESSION cookie", "error");
    return;
  }

  const statusEl = document.getElementById("full-sync-status");
  statusEl.textContent = "⏳ Fetching full history from LeetCode…";

  try {
    const url = `/.netlify/functions/lc-sync?username=${encodeURIComponent(state.lcUsername)}&session=${encodeURIComponent(session)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const submissions = data.recentAcSubmissionList || [];
    if (submissions.length === 0)
      throw new Error("No submissions found — check your session cookie");

    // Build slug → earliest timestamp map from LC submissions
    const slugMap = new Map();
    submissions.forEach((s) => {
      const slug = s.titleSlug.toLowerCase();
      const existing = slugMap.get(slug);
      if (!existing || s.timestamp < existing) slugMap.set(slug, s.timestamp);
    });

    // Build slug → id map from metaMap (O(1) lookups, no slug extraction per question)
    const slugToId = new Map();
    Object.entries(state.metaMap).forEach(([id, meta]) => {
      if (meta.slug) slugToId.set(meta.slug.toLowerCase(), parseInt(id));
    });

    statusEl.textContent = `✅ Got ${slugMap.size} unique solved problems from LeetCode. Matching with tracker…`;

    const newSolved = {};
    const newActivity = {};
    let matched = 0;

    slugMap.forEach((timestamp, slug) => {
      const id = slugToId.get(slug);
      if (!id) return; // not in tracker
      matched++;
      const lcDate = dateStr(new Date(parseInt(timestamp) * 1000));
      newSolved[id] = lcDate;
      newActivity[lcDate] = (newActivity[lcDate] || 0) + 1;
      initSM2OnSolve(id);
    });

    state.solved = newSolved;
    state.activity = newActivity;

    saveProgress();
    renderTable();
    renderStats();
    refreshDataDependentPages();
    localStorage.setItem("lc_last_sync", new Date().toISOString());
    renderAuthArea();

    closeFullSyncModal();
    showToast(
      `✅ Full sync done! ${matched} problems matched from ${slugMap.size} LC solves.`,
    );
  } catch (err) {
    statusEl.textContent = `❌ ${err.message}`;
  }
}

async function syncLeetCode(silent = false) {
  if (!state.lcUsername) {
    if (!silent) openLCModal();
    return { ok: false };
  }
  if (state.lcSyncing) return { ok: false };
  state.lcSyncing = true;
  updateSyncBtn(true);
  if (!silent) showToast("🔄 Syncing with LeetCode…", "info");

  try {
    const res = await fetch(
      `/.netlify/functions/lc-sync?username=${encodeURIComponent(state.lcUsername)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const submissions2 = data.recentAcSubmissionList || [];
    if (submissions2.length === 0) {
      if (!silent) showToast("⚠️ No recent submissions found. Make sure your profile is public.", "error");
      state.lcSyncing = false;
      updateSyncBtn(false);
      return { ok: false };
    }

    const slugMap2 = new Map();
    submissions2.forEach((s) => {
      const slug = s.titleSlug.toLowerCase();
      const existing = slugMap2.get(slug);
      if (!existing || s.timestamp < existing) slugMap2.set(slug, s.timestamp);
    });

    const slugToId2 = new Map();
    Object.entries(state.metaMap).forEach(([id, meta]) => {
      if (meta.slug) slugToId2.set(meta.slug.toLowerCase(), parseInt(id));
    });

    let newlySynced = 0;
    slugMap2.forEach((timestamp, slug) => {
      const id = slugToId2.get(slug);
      if (!id || state.solved[id]) return;
      const solveDate = dateStr(new Date(parseInt(timestamp) * 1000));
      state.solved[id] = solveDate;
      state.activity[solveDate] = (state.activity[solveDate] || 0) + 1;
      initSM2OnSolve(id);
      newlySynced++;
    });

    saveProgress();
    renderTable();
    renderStats();
    refreshDataDependentPages();
    if (!silent) showToast(`✅ Synced! ${newlySynced} new solve${newlySynced !== 1 ? "s" : ""} found. Total: ${Object.keys(state.solved).length}`);
    localStorage.setItem("lc_last_sync", new Date().toISOString());
    renderAuthArea();
    state.lcSyncing = false;
    updateSyncBtn(false);
    return { ok: true, newlySynced };
  } catch (err) {
    if (!silent) showToast(`❌ Sync failed: ${err.message}`, "error");
    state.lcSyncing = false;
    updateSyncBtn(false);
    return { ok: false, error: err.message };
  }
}

function updateSyncBtn(syncing) {
  const btn = document.getElementById("lc-sync-btn");
  if (!btn) return;
  btn.disabled = syncing;
  btn.textContent = syncing ? "⏳ Syncing…" : "⟳ Sync";
}

// ─── Sync All Platforms ────────────────────────────────────────────────────────
async function syncAll() {
  const lcConnected = !!state.lcUsername;
  const cfConnected = !!state.cfUsername;
  if (!lcConnected && !cfConnected) {
    openLCModal();
    return;
  }

  const btn = document.getElementById("lc-sync-btn");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Syncing…"; }

  const results = await Promise.allSettled([
    lcConnected ? syncLeetCode(true) : Promise.resolve(null),
    cfConnected ? syncCFSilent() : Promise.resolve(null),
  ]);

  if (btn) { btn.disabled = false; btn.textContent = "⟳ Sync"; }

  const lcResult = lcConnected ? results[0] : null;
  const cfResult = cfConnected ? results[1] : null;

  const parts = [];
  if (lcResult?.value?.ok) parts.push(`LC: +${lcResult.value.newlySynced ?? 0} solves`);
  else if (lcConnected && lcResult?.value?.ok === false) parts.push("LC: up to date");
  if (cfResult?.value?.ok) parts.push(`CF: synced`);
  else if (cfConnected && cfResult?.value?.ok === false) parts.push("CF: failed");

  showToast(`✅ ${parts.join(" · ") || "Sync complete"}`);
}

async function syncCFSilent() {
  if (!state.cfUsername) return { ok: false };
  try {
    const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${state.cfUsername}`);
    const infoData = await infoRes.json();
    if (infoData.status !== "OK") throw new Error("CF user not found");
    state.cfUserInfo = infoData.result[0];

    const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${state.cfUsername}&from=1&count=10000`);
    const statusData = await statusRes.json();
    if (statusData.status !== "OK") throw new Error("Could not fetch CF submissions");

    const newSolved = {};
    const newActivity = {};
    statusData.result
      .filter((s) => s.verdict === "OK")
      .forEach((s) => {
        const key = cfProblemKey(s.problem.contestId, s.problem.index);
        const d = dateStr(new Date(s.creationTimeSeconds * 1000));
        if (!newSolved[key] || d < newSolved[key]) newSolved[key] = d;
      });
    Object.values(newSolved).forEach((d) => {
      newActivity[d] = (newActivity[d] || 0) + 1;
    });
    state.cfSolved = newSolved;
    state.cfActivity = newActivity;
    saveProgress();
    applyCFFilters();
    renderProfilePage();
    renderCFConnectedArea();
    renderCFStats();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function getLastSyncLabel() {
  const raw = localStorage.getItem("lc_last_sync");
  if (!raw) return "Never synced";
  const d = new Date(raw);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
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
  }, 3500);
}

// ─── Streak ────────────────────────────────────────────────────────────────────
function calcStreaks() {
  // merge LC + CF activity
  const merged = {};
  Object.entries(state.activity).forEach(([d, v]) => {
    merged[d] = (merged[d] || 0) + v;
  });
  Object.entries(state.cfActivity).forEach(([d, v]) => {
    merged[d] = (merged[d] || 0) + v;
  });
  const days = Object.keys(merged)
    .filter((d) => merged[d] > 0)
    .sort();
  if (!days.length) return { current: 0, longest: 0, totalDays: 0 };
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

// ─── SM2 Spaced Repetition ─────────────────────────────────────────────────────
function getNextReviewDate(id) {
  return state.reviewData[id]?.nextReviewDate || null;
}
function isReviewDue(id) {
  const nd = getNextReviewDate(id);
  return nd ? nd <= dateStr(new Date()) : false;
}
function advanceSM2(id) {
  const rd = state.reviewData[id] || { intervalIdx: 0, reps: 0 };
  const nextIdx = Math.min((rd.intervalIdx || 0) + 1, SM2_INTERVALS.length - 1);
  const days = SM2_INTERVALS[nextIdx];
  const nextDate = new Date(Date.now() + days * 86400000);
  state.reviewData[id] = {
    intervalIdx: nextIdx,
    reps: (rd.reps || 0) + 1,
    nextReviewDate: dateStr(nextDate),
    lastReviewed: dateStr(new Date()),
  };
}
function initSM2OnSolve(id) {
  const nextDate = new Date(Date.now() + SM2_INTERVALS[0] * 86400000);
  state.reviewData[id] = {
    intervalIdx: 0,
    reps: 0,
    nextReviewDate: dateStr(nextDate),
    lastReviewed: dateStr(new Date()),
  };
}

// ─── Bookmarks ─────────────────────────────────────────────────────────────────
function toggleBookmark(id) {
  if (state.bookmarks[id]) delete state.bookmarks[id];
  else state.bookmarks[id] = true;
  const btn = document.querySelector(`.star-btn[data-id="${id}"]`);
  if (btn) {
    btn.classList.toggle("starred", !!state.bookmarks[id]);
    btn.textContent = state.bookmarks[id] ? "★" : "☆";
  }
  saveProgress();
}

// ─── Notes Modal ───────────────────────────────────────────────────────────────
function openNoteModal(id) {
  const q = state.questions.find((x) => x.id === id);
  document.getElementById("note-modal-title").textContent =
    q?.title || "Problem";
  document.getElementById("note-textarea").value = state.notes[id] || "";
  document.getElementById("note-modal-id").value = id;
  document.getElementById("note-modal-overlay").style.display = "flex";
  document.getElementById("note-textarea").focus();
}
function closeNoteModal() {
  document.getElementById("note-modal-overlay").style.display = "none";
}
async function saveNote() {
  const id = parseInt(document.getElementById("note-modal-id").value);
  const text = document.getElementById("note-textarea").value.trim();
  if (text) state.notes[id] = text;
  else delete state.notes[id];
  closeNoteModal();
  refreshDataDependentPages();
  renderTable();
  saveProgress();
}

function refreshDataDependentPages() {
  const activePage = document.querySelector(".page.active")?.id;
  if (activePage === "page-insights") renderInsightsPage();
  if (activePage === "page-profile") renderProfilePage();
  renderStats();
}

// ─── Random Problem Picker ─────────────────────────────────────────────────────
function openRandomPicker() {
  document.getElementById("random-modal-overlay").style.display = "flex";
  state.randomPlatform = state.activePlatform || "lc";
  updateRandomPickerTabs();
  // Auto-pick on first open
  pickRandom();
}
function closeRandomPicker() {
  document.getElementById("random-modal-overlay").style.display = "none";
  state.randomPickCache = {}; // clear so next open auto-picks fresh
}
function switchRandomPlatform(platform) {
  state.randomPlatform = platform;
  updateRandomPickerTabs();
  // If this platform already has a cached pick, restore it; otherwise show prompt
  const cached = state.randomPickCache?.[platform];
  const content = document.getElementById("random-problem-content");
  if (cached && content) {
    content.innerHTML = cached;
  } else if (content) {
    content.innerHTML = `<div class="random-empty" style="padding:40px 0;color:var(--text-muted);font-size:13px">Click <strong style="color:var(--accent)">🔀 Pick Another</strong> to get a problem from this platform</div>`;
  }
}
function updateRandomPickerTabs() {
  const lcBtn = document.getElementById("random-tab-lc");
  const cfBtn = document.getElementById("random-tab-cf");
  if (lcBtn) {
    const active = state.randomPlatform === "lc";
    lcBtn.style.color = active ? "var(--accent)" : "var(--text-muted)";
    lcBtn.style.borderBottomColor = active ? "var(--accent)" : "transparent";
  }
  if (cfBtn) {
    const active = state.randomPlatform === "cf";
    cfBtn.style.color = active ? "var(--accent)" : "var(--text-muted)";
    cfBtn.style.borderBottomColor = active ? "var(--accent)" : "transparent";
  }
}
function pickRandom() {
  const platform = state.randomPlatform || "lc";
  const content = document.getElementById("random-problem-content");
  if (!state.randomPickCache) state.randomPickCache = {};
  if (platform === "cf") {
    pickRandomCF(content);
  } else {
    pickRandomLC(content);
  }
  // Cache the rendered HTML for this platform so tab switching restores it
  if (content) state.randomPickCache[platform] = content.innerHTML;
}

function pickRandomLC(content) {
  const pool = state.filtered.length > 0 ? state.filtered : state.questions;
  const unsolved = pool.filter((q) => !state.solved[q.id]);
  const source = unsolved.length > 0 ? unsolved : pool;
  if (!source.length) {
    content.innerHTML = `<div class="random-empty">No LC problems available!</div>`;
    return;
  }
  const q = source[Math.floor(Math.random() * source.length)];
  const diffCls = q.difficulty.toLowerCase();
  const tags = (state.metaMap[q.id]?.tags || []).slice(0, 3);
  content.innerHTML = `
    <div class="random-problem-card">
      <div class="random-problem-meta">
        <span class="diff-badge ${diffCls}">${q.difficulty}</span>
        <span class="random-problem-id">#${q.id}</span>
        ${state.solved[q.id] ? '<span class="random-solved-badge">✓ Solved</span>' : ""}
      </div>
      <div class="random-problem-title">${q.title}</div>
      ${tags.length ? `<div class="random-problem-tags">${tags.map((t) => `<span class="pattern-tag">${t}</span>`).join("")}</div>` : ""}
      <div class="random-problem-companies">${q.companies
        .slice(0, 4)
        .map((c) => `<span class="company-tag">${formatCompany(c)}</span>`)
        .join("")}</div>
      <a href="${q.link}" target="_blank" class="btn-primary random-open-btn">Open on LeetCode →</a>
    </div>`;
}

function pickRandomCF(content) {
  const pool =
    state.cfFiltered.length > 0
      ? state.cfFiltered
      : Object.values(state.cfMeta);
  if (!pool.length) {
    content.innerHTML = `<div class="random-empty">No CF problems loaded! Connect Codeforces first.</div>`;
    return;
  }
  const unsolved = pool.filter(
    (p) => !state.cfSolved[cfProblemKey(p.contestId, p.index)],
  );
  const source = unsolved.length > 0 ? unsolved : pool;
  const p = source[Math.floor(Math.random() * source.length)];
  const key = cfProblemKey(p.contestId, p.index);
  const solved = !!state.cfSolved[key];
  const link = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
  const ratingColor = p.rating ? cfRatingColor(p.rating) : "var(--text-muted)";
  const tags = (p.tags || []).slice(0, 3);
  content.innerHTML = `
    <div class="random-problem-card">
      <div class="random-problem-meta">
        <span style="font-weight:700;color:${ratingColor}">${p.rating || "Unrated"}</span>
        <span class="random-problem-id">${p.contestId}${p.index}</span>
        ${solved ? '<span class="random-solved-badge">✓ Solved</span>' : ""}
      </div>
      <div class="random-problem-title">${p.name}</div>
      ${tags.length ? `<div class="random-problem-tags">${tags.map((t) => `<span class="cf-tag-chip">${t}</span>`).join("")}</div>` : ""}
      ${p.solvedCount ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Solved by ${p.solvedCount >= 1000 ? (p.solvedCount / 1000).toFixed(1) + "k" : p.solvedCount} users</div>` : ""}
      <a href="${link}" target="_blank" class="btn-primary random-open-btn">Open on Codeforces →</a>
    </div>`;
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
          const due = isReviewDue(q.id);
          return `<div class="sp-row ${done ? "sp-done" : ""}">
          <span class="sp-num">${i + 1}</span>
          <span class="sp-status-icon">${done ? "✓" : "○"}</span>
          <a href="${q.link}" target="_blank" class="sp-title">${q.title}</a>
          ${due ? '<span class="review-due-pill">↺</span>' : ""}
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

// ─── Load Metadata (Tags) ──────────────────────────────────────────────────────
async function loadMetadata() {
  try {
    const res = await fetch("data/leetcode-meta.json");
    if (!res.ok) return;
    const meta = await res.json();
    const tagSet = new Set();
    for (const id in meta) {
      state.metaMap[id] = meta[id];
      (meta[id].tags || []).forEach((t) => tagSet.add(t));
    }
    state.allTags = [...tagSet].sort();
    renderPatternDropdown();
  } catch (_) {}
}

// ─── Codeforces ────────────────────────────────────────────────────────────────
async function loadCFMeta() {
  try {
    const res = await fetch("data/cf-meta.json");
    if (!res.ok) return;
    state.cfMeta = await res.json();
  } catch (_) {}
}

function switchPlatform(platform) {
  state.activePlatform = platform;
  document
    .getElementById("platform-tab-lc")
    .classList.toggle("active", platform === "lc");
  document
    .getElementById("platform-tab-cf")
    .classList.toggle("active", platform === "cf");
  document.getElementById("lc-tracker-content").style.display =
    platform === "lc" ? "" : "none";
  document.getElementById("cf-tracker-content").style.display =
    platform === "cf" ? "" : "none";
  if (platform === "cf") renderCFTable();
}

function cfProblemKey(contestId, index) {
  return `${contestId}_${index}`;
}

function cfRatingColor(rating) {
  if (!rating) return "var(--text-muted)";
  if (rating < 1200) return "#808080";
  if (rating < 1400) return "#008000";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#0000ff";
  if (rating < 2100) return "#aa00aa";
  if (rating < 2400) return "#ff8c00";
  return "#ff0000";
}

function cfRatingLabel(rating) {
  if (!rating) return "Unrated";
  if (rating < 1200) return "Newbie";
  if (rating < 1400) return "Pupil";
  if (rating < 1600) return "Specialist";
  if (rating < 1900) return "Expert";
  if (rating < 2100) return "Candidate Master";
  if (rating < 2400) return "Master";
  if (rating < 2600) return "International Master";
  if (rating < 3000) return "Grandmaster";
  return "Legendary Grandmaster";
}

function applyCFFilters() {
  const { search, minRating, maxRating, tags, status, starred, review } = state.cfFilters;
  const userRating = state.cfUserInfo?.rating || 0;
  const sq = search.toLowerCase();

  state.cfFiltered = Object.values(state.cfMeta).filter((p) => {
    // Include unrated only when minRating is at default floor (800)
    if (!p.rating) {
      if (minRating > 800) return false;
    } else {
      if (p.rating < minRating || p.rating > maxRating) return false;
    }
    if (sq && !p.name.toLowerCase().includes(sq) && !p.tags.some((t) => t.toLowerCase().includes(sq)))
      return false;
    if (tags.length && !tags.every((t) => p.tags.includes(t))) return false;
    const key = cfProblemKey(p.contestId, p.index);
    const solved = !!state.cfSolved[key];
    if (status === "solved" && !solved) return false;
    if (status === "unsolved" && solved) return false;
    if (starred && !state.cfBookmarks[key]) return false;
    if (review) {
      if (!solved) return false;
      if (!isCFReviewDue(key)) return false;
    }
    return true;
  });

  // Sort: rated problems near user's target first (unsolved priority); unrated at end
  if (userRating) {
    const target = userRating + 200;
    state.cfFiltered.sort((a, b) => {
      const aKey = cfProblemKey(a.contestId, a.index);
      const bKey = cfProblemKey(b.contestId, b.index);
      const aSolved = !!state.cfSolved[aKey];
      const bSolved = !!state.cfSolved[bKey];
      if (aSolved !== bSolved) return aSolved ? 1 : -1;
      // Push unrated to end
      if (!a.rating && !b.rating) return 0;
      if (!a.rating) return 1;
      if (!b.rating) return -1;
      return Math.abs(a.rating - target) - Math.abs(b.rating - target);
    });
  } else {
    state.cfFiltered.sort((a, b) => {
      if (!a.rating && !b.rating) return 0;
      if (!a.rating) return 1;
      if (!b.rating) return -1;
      return a.rating - b.rating;
    });
  }

  state.cfPage = 1;
  renderCFTable();
  renderCFStats();
  updateCFClearBtn();
}

function renderCFStats() {
  const allProblems = Object.values(state.cfMeta);
  const ratedTotal = allProblems.filter((p) => p.rating).length;
  const unratedTotal = allProblems.filter((p) => !p.rating).length;
  const solved = Object.keys(state.cfSolved).length;
  const total = ratedTotal; // main denominator is rated
  const el = document.getElementById("cf-stats-bar");
  if (!el) return;
  const rating = state.cfUserInfo?.rating || null;
  const maxRating = state.cfUserInfo?.maxRating || null;
  el.innerHTML = `
    <div class="stat-item"><div class="stat-value">${total.toLocaleString()}</div><div class="stat-label">Rated Problems</div></div>
    <div class="stat-item"><div class="stat-value accent">${solved}</div><div class="stat-label">Solved</div></div>
    <div class="stat-item"><div class="stat-value accent">${total ? Math.round((solved / total) * 100) : 0}%</div><div class="stat-label">Done</div></div>
    ${
      rating != null
        ? `<div class="stat-item"><div class="stat-value" style="color:${cfRatingColor(rating)}">${rating}</div><div class="stat-label">Rating</div></div>`
        : state.cfUserInfo
          ? `<div class="stat-item"><div class="stat-value" style="color:var(--text-muted)">—</div><div class="stat-label">Unrated</div></div>`
          : ""
    }
    ${maxRating ? `<div class="stat-item"><div class="stat-value" style="color:${cfRatingColor(maxRating)}">${maxRating}</div><div class="stat-label">Peak Rating</div></div>` : ""}
  `;
}

function renderCFTable() {
  const tbody = document.getElementById("cf-tbody");
  if (!tbody) return;
  const start = (state.cfPage - 1) * ITEMS_PER_PAGE;
  const page = state.cfFiltered.slice(start, start + ITEMS_PER_PAGE);

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No problems match your filters.</td></tr>`;
    renderCFPagination();
    return;
  }

  tbody.innerHTML = page
    .map((p) => {
      const key = cfProblemKey(p.contestId, p.index);
      const solved = !!state.cfSolved[key];
      const starred = !!state.cfBookmarks[key];
      const reviewDue = solved && isCFReviewDue(key);
      const solveDate = state.cfSolved[key] || "";
      const link = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
      const contestLink = `https://codeforces.com/contest/${p.contestId}`;
      const ratingColor = p.rating ? cfRatingColor(p.rating) : "var(--text-muted)";
      const ratingDisplay = p.rating
        ? `<span style="color:${ratingColor};font-weight:600">${p.rating}</span>`
        : `<span style="color:var(--text-muted);font-size:11px">Unrated</span>`;
      const tags = (p.tags || []).slice(0, 3)
        .map((t) => `<span class="pattern-tag-sm">${t}</span>`).join("");
      const solvedCount = p.solvedCount
        ? `${p.solvedCount >= 1000 ? (p.solvedCount / 1000).toFixed(1) + "k" : p.solvedCount}`
        : "—";
      return `<tr class="${solved ? "solved" : ""}">
      <td class="col-status">
        ${solved
          ? `<span class="solved-icon" title="Solved${solveDate ? " · " + solveDate : ""}">✓</span>`
          : `<span class="unsolved-icon">○</span>`}
      </td>
      <td class="col-title">
        <div class="title-cell-content">
          <button class="star-btn inline-star ${starred ? "starred" : ""}" onclick="toggleCFBookmark('${key}')" title="Bookmark">${starred ? "★" : "☆"}</button>
          <a href="${link}" target="_blank" rel="noopener" class="cf-problem-link">${p.name}</a>
          ${reviewDue ? '<span class="review-badge-inline" title="Due for SM2 review">↺</span>' : ""}
          ${tags ? `<span class="row-tags">${tags}</span>` : ""}
        </div>
      </td>
      <td class="col-diff">${ratingDisplay}</td>
      <td class="col-contest"><a href="${contestLink}" target="_blank" rel="noopener" class="cf-contest-link">${p.contestId}${p.index}</a></td>
      <td class="col-solves">${solvedCount}</td>
    </tr>`;
    })
    .join("");

  renderCFPagination();
}

function renderCFPagination() {
  const el = document.getElementById("cf-pagination");
  if (!el) return;
  const total = Math.ceil(state.cfFiltered.length / ITEMS_PER_PAGE);
  if (total <= 1) {
    el.innerHTML = "";
    return;
  }
  const p = state.cfPage;
  const s = (p - 1) * ITEMS_PER_PAGE + 1;
  const e = Math.min(p * ITEMS_PER_PAGE, state.cfFiltered.length);
  const startP = Math.max(1, p - 2);
  const endP = Math.min(total, p + 2);

  let html = `<button class="page-btn${p === 1 ? " disabled" : ""}" onclick="cfGoPage(${p - 1})" ${p === 1 ? "disabled" : ""}>← Prev</button>`;
  if (startP > 1) {
    html += `<button class="page-btn" onclick="cfGoPage(1)">1</button>`;
    if (startP > 2) html += `<span class="page-ellipsis">…</span>`;
  }
  for (let i = startP; i <= endP; i++) {
    html += `<button class="page-btn${i === p ? " page-btn--active" : ""}" onclick="cfGoPage(${i})">${i}</button>`;
  }
  if (endP < total) {
    if (endP < total - 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" onclick="cfGoPage(${total})">${total}</button>`;
  }
  html += `<button class="page-btn${p === total ? " disabled" : ""}" onclick="cfGoPage(${p + 1})" ${p === total ? "disabled" : ""}>Next →</button>`;
  html += `<span class="page-info">${s}–${e} of ${state.cfFiltered.length}</span>`;
  el.innerHTML = `<div class="pagination-wrap">${html}</div>`;
}

function cfGoPage(p) {
  state.cfPage = p;
  renderCFTable();
}

function toggleCFSolved(key) {
  if (state.cfSolved[key]) {
    delete state.cfSolved[key];
    delete state.cfReviewData[key];
  } else {
    const d = dateStr(new Date());
    state.cfSolved[key] = d;
    state.cfActivity[d] = (state.cfActivity[d] || 0) + 1;
    initCFSM2OnSolve(key);
  }
  saveProgress();
  renderCFTable();
  renderCFStats();
  renderProfilePage();
}

function initCFSM2OnSolve(key) {
  const nextDate = new Date(Date.now() + SM2_INTERVALS[0] * 86400000);
  state.cfReviewData[key] = {
    intervalIdx: 0, reps: 0,
    nextReviewDate: dateStr(nextDate),
    lastReviewed: dateStr(new Date()),
  };
}

function isCFReviewDue(key) {
  const nd = state.cfReviewData[key]?.nextReviewDate;
  return nd ? nd <= dateStr(new Date()) : false;
}

function toggleCFBookmark(key) {
  if (state.cfBookmarks[key]) delete state.cfBookmarks[key];
  else state.cfBookmarks[key] = true;
  saveProgress();
  renderCFTable();
}

async function syncCFUser() {
  const handle = document.getElementById("cf-username-input")?.value.trim();
  if (!handle) return;
  const btn = document.getElementById("cf-sync-btn");
  btn.textContent = "Syncing…";
  btn.disabled = true;
  try {
    // Fetch user info
    const infoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`,
    );
    const infoData = await infoRes.json();
    if (infoData.status !== "OK") throw new Error("User not found");
    state.cfUserInfo = infoData.result[0];
    state.cfUsername = handle;
    localStorage.setItem("cf_username", handle);

    // Fetch all submissions
    const statusRes = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`,
    );
    const statusData = await statusRes.json();
    if (statusData.status !== "OK")
      throw new Error("Could not fetch submissions");

    // Build solved map from accepted submissions
    const newSolved = {};
    const newActivity = {};
    statusData.result
      .filter((s) => s.verdict === "OK")
      .forEach((s) => {
        const key = cfProblemKey(s.problem.contestId, s.problem.index);
        const d = dateStr(new Date(s.creationTimeSeconds * 1000));
        if (!newSolved[key] || d < newSolved[key]) newSolved[key] = d; // keep earliest
      });
    // Build activity from solved dates
    Object.values(newSolved).forEach((d) => {
      newActivity[d] = (newActivity[d] || 0) + 1;
    });

    state.cfSolved = newSolved;
    state.cfActivity = newActivity;
    saveProgress();
    applyCFFilters();
    renderProfilePage();
    showToast(
      `✅ CF synced! ${Object.keys(newSolved).length} problems solved.`,
    );
    document.getElementById("cf-connect-area").style.display = "none";
    document.getElementById("cf-connected-area").style.display = "";
    renderCFConnectedArea();
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
  } finally {
    btn.textContent = "Sync";
    btn.disabled = false;
  }
}

function renderCFConnectedArea() {
  const el = document.getElementById("cf-connected-area");
  if (!el || !state.cfUserInfo) return;
  const u = state.cfUserInfo;
  const rating = u.rating || null;
  const maxRating = u.maxRating || null;
  const ratingDisplay = rating
    ? `<span class="cf-rank-badge" style="color:${cfRatingColor(rating)}">${cfRatingLabel(rating)} · ${rating}</span>`
    : `<span class="cf-rank-badge" style="color:var(--text-muted)">Unrated</span>`;
  const maxDisplay = maxRating
    ? `<span style="font-size:11px;color:var(--text-muted)">peak: ${maxRating}</span>`
    : "";
  el.innerHTML = `
    <div class="cf-user-badge">
      <span style="color:${cfRatingColor(rating)};font-weight:700">${u.handle}</span>
      ${ratingDisplay}
      ${maxDisplay}
      <button class="btn-outline-danger" style="margin-left:auto;padding:4px 10px;font-size:11px" onclick="disconnectCF()">Disconnect</button>
    </div>`;
}

function disconnectCF() {
  state.cfUsername = null;
  state.cfUserInfo = null;
  state.cfSolved = {};
  state.cfActivity = {};
  localStorage.removeItem("cf_username");
  saveProgress();
  document.getElementById("cf-connect-area").style.display = "";
  document.getElementById("cf-connected-area").style.display = "none";
  document.getElementById("cf-connected-area").innerHTML = "";
  applyCFFilters();
  renderProfilePage();
}

async function initCF() {
  await loadCFMeta();
  const savedHandle = state.cfUsername || localStorage.getItem("cf_username");
  if (savedHandle && !state.cfUsername) {
    state.cfUsername = savedHandle;
  }
  // Set default filter based on user rating
  if (state.cfUserInfo?.rating) {
    const r = state.cfUserInfo.rating;
    state.cfFilters.minRating = Math.max(800, r - 300);
    state.cfFilters.maxRating = Math.min(3500, r + 500);
  }
  applyCFFilters();
  renderCFFilterUI();
  updateCFClearBtn();
  // If username saved, fetch fresh user info and restore connected UI
  if (state.cfUsername && !state.cfUserInfo) {
    try {
      const res = await fetch(
        `https://codeforces.com/api/user.info?handles=${state.cfUsername}`,
      );
      const data = await res.json();
      if (data.status === "OK") {
        state.cfUserInfo = data.result[0];
        const connectArea = document.getElementById("cf-connect-area");
        const connectedArea = document.getElementById("cf-connected-area");
        if (connectArea) connectArea.style.display = "none";
        if (connectedArea) connectedArea.style.display = "";
        renderCFConnectedArea();
        renderCFStats();
        // Update filter defaults now that we have rating
        if (state.cfUserInfo.rating) {
          const r = state.cfUserInfo.rating;
          state.cfFilters.minRating = Math.max(800, r - 300);
          state.cfFilters.maxRating = Math.min(3500, r + 500);
          renderCFFilterUI();
          applyCFFilters();
        }
      }
    } catch (_) {}
  } else if (state.cfUsername && state.cfUserInfo) {
    // Already have info (restored from gist) — just show connected area
    const connectArea = document.getElementById("cf-connect-area");
    const connectedArea = document.getElementById("cf-connected-area");
    if (connectArea) connectArea.style.display = "none";
    if (connectedArea) connectedArea.style.display = "";
    renderCFConnectedArea();
    renderCFStats();
  }
}

function renderCFFilterUI() {
  // Populate tag filter
  const allCFTags = new Set();
  Object.values(state.cfMeta).forEach((p) =>
    p.tags?.forEach((t) => allCFTags.add(t)),
  );
  const tagSel = document.getElementById("cf-tag-select");
  if (tagSel) {
    tagSel.innerHTML =
      `<option value="">All Tags</option>` +
      [...allCFTags]
        .sort()
        .map((t) => `<option value="${t}">${t}</option>`)
        .join("");
  }
  // Set rating select values
  const minEl = document.getElementById("cf-min-rating");
  const maxEl = document.getElementById("cf-max-rating");
  if (minEl) minEl.value = state.cfFilters.minRating;
  if (maxEl) maxEl.value = state.cfFilters.maxRating;
  // Set search input if exists
  const searchEl = document.getElementById("cf-search-input");
  if (searchEl) searchEl.value = state.cfFilters.search;
}

function updateCFRatingLabel() {
  // No-op: label removed, selects now show values directly
}

function setCFRating(which, val) {
  const v = parseInt(val);
  if (which === "min") {
    state.cfFilters.minRating = v;
    if (v > state.cfFilters.maxRating) {
      state.cfFilters.maxRating = Math.min(3500, v + 200);
      const maxEl = document.getElementById("cf-max-rating");
      if (maxEl) maxEl.value = state.cfFilters.maxRating;
    }
  } else {
    state.cfFilters.maxRating = v;
    if (v < state.cfFilters.minRating) {
      state.cfFilters.minRating = Math.max(800, v - 200);
      const minEl = document.getElementById("cf-min-rating");
      if (minEl) minEl.value = state.cfFilters.minRating;
    }
  }
  updateCFRatingLabel();
  applyCFFilters();
  updateCFClearBtn();
}

function setCFTagFilter(tag) {
  state.cfFilters.tags = tag ? [tag] : [];
  applyCFFilters();
  updateCFClearBtn();
}

function setCFStatusFilter(val) {
  state.cfFilters.status = val;
  applyCFFilters();
  updateCFClearBtn();
}

function toggleCFStarredFilter() {
  state.cfFilters.starred = !state.cfFilters.starred;
  document.getElementById("cf-filter-starred-btn")?.classList.toggle("active", state.cfFilters.starred);
  applyCFFilters();
  updateCFClearBtn();
}

function toggleCFReviewFilter() {
  state.cfFilters.review = !state.cfFilters.review;
  document.getElementById("cf-filter-review-btn")?.classList.toggle("active", state.cfFilters.review);
  applyCFFilters();
  updateCFClearBtn();
}

function setCFSearch(val) {
  state.cfFilters.search = val;
  applyCFFilters();
  updateCFClearBtn();
}

function updateCFClearBtn() {
  const btn = document.getElementById("cf-clear-filters");
  if (!btn) return;
  const f = state.cfFilters;
  const dirty = f.search || f.tags.length || f.status !== "all" || f.minRating !== 800 || f.maxRating !== 3500 || f.starred || f.review;
  btn.style.display = dirty ? "" : "none";
}

function clearCFFilters() {
  state.cfFilters = { search: "", minRating: 800, maxRating: 3500, tags: [], status: "all", starred: false, review: false };
  const searchEl = document.getElementById("cf-search-input");
  if (searchEl) searchEl.value = "";
  const tagSel = document.getElementById("cf-tag-select");
  if (tagSel) tagSel.value = "";
  const statusSel = document.getElementById("cf-status-select");
  if (statusSel) statusSel.value = "all";
  document.getElementById("cf-filter-starred-btn")?.classList.remove("active");
  document.getElementById("cf-filter-review-btn")?.classList.remove("active");
  renderCFFilterUI();
  applyCFFilters();
  updateCFClearBtn();
}

// ─── CSV Parsing ───────────────────────────────────────────────────────────────
async function loadAllCSVs() {
  try {
    await loadMetadata();
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { questions, companies } = JSON.parse(cached);
      state.questions = questions;
      state.companies = companies;
      renderFilterUI();
      return;
    }
  } catch (_) {}
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
          if (!id) continue;
          const meta = state.metaMap[id];
          if (!map[id]) {
            map[id] = {
              id,
              title: meta?.title || row["Title"]?.trim() || "Unknown Title",
              difficulty:
                meta?.difficulty || row["Difficulty"]?.trim() || "Unknown",
              acceptance: meta?.acceptance || row["Acceptance"]?.trim() || "-",
              link: meta?.slug
                ? `https://leetcode.com/problems/${meta.slug}/`
                : (
                    row["Leetcode Question Link"] ||
                    `https://leetcode.com/problems/`
                  ).trim(),
              companies: new Set(),
              tags: meta?.tags || [],
            };
          }
          map[id].companies.add(company);
        }
      } catch (err) {
        console.warn(`Skipped ${filename}`, err);
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
  } catch (_) {}
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
  renderPatternDropdown();
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
  document
    .getElementById("filter-starred-btn")
    ?.classList.toggle("active", state.filters.starred);
  applyFilters();
}
function toggleReviewFilter() {
  state.filters.review = !state.filters.review;
  document
    .getElementById("filter-review-btn")
    ?.classList.toggle("active", state.filters.review);
  applyFilters();
}

// ─── Pattern Dropdown ──────────────────────────────────────────────────────────
let patternDropdownOpen = false;
function renderPatternDropdown() {
  const wrap = document.getElementById("pattern-filter-wrap");
  if (!wrap) return;
  if (!state.allTags.length) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "";
  renderPatternCheckboxList("");
}
function togglePatternDropdown() {
  const dd = document.getElementById("pattern-dropdown");
  const btn = document.getElementById("pattern-filter-btn");
  const isOpen = patternDropdownOpen;
  closeAllDropdowns();
  if (!isOpen) {
    patternDropdownOpen = true;
    dd.style.display = "block";
    btn.classList.add("active");
    document.getElementById("pattern-search-input").value = "";
    renderPatternCheckboxList("");
    setTimeout(
      () =>
        document.addEventListener("click", closePatternDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function closePatternDropdownOutside(e) {
  const wrap = document.getElementById("pattern-filter-wrap");
  if (wrap && !wrap.contains(e.target)) {
    patternDropdownOpen = false;
    document.getElementById("pattern-dropdown").style.display = "none";
    document.getElementById("pattern-filter-btn").classList.remove("active");
  } else if (patternDropdownOpen) {
    setTimeout(
      () =>
        document.addEventListener("click", closePatternDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}
function renderPatternCheckboxList(search) {
  const list = document.getElementById("pattern-checkbox-list");
  if (!list) return;
  const q = search.toLowerCase();
  const filtered = state.allTags.filter(
    (t) => !q || t.toLowerCase().includes(q),
  );
  list.innerHTML = filtered
    .map((t) => {
      const checked = state.filters.patterns.includes(t);
      return `<label class="company-checkbox-item ${checked ? "checked" : ""}"><input type="checkbox" ${checked ? "checked" : ""} onchange="togglePatternFilter('${t.replace(/'/g, "\\'")}')" onclick="event.stopPropagation()"><span>${t}</span></label>`;
    })
    .join("");
}
function filterPatternList(val) {
  renderPatternCheckboxList(val);
}
function togglePatternFilter(tag) {
  const idx = state.filters.patterns.indexOf(tag);
  if (idx === -1) state.filters.patterns.push(tag);
  else state.filters.patterns.splice(idx, 1);
  updatePatternFilterCount();
  renderPatternCheckboxList(
    document.getElementById("pattern-search-input")?.value || "",
  );
  applyFilters();
}
function clearPatternFilters() {
  state.filters.patterns = [];
  updatePatternFilterCount();
  renderPatternCheckboxList(
    document.getElementById("pattern-search-input")?.value || "",
  );
  applyFilters();
}
function updatePatternFilterCount() {
  const count = state.filters.patterns.length;
  const el = document.getElementById("pattern-filter-count");
  if (!el) return;
  el.textContent = count;
  el.style.display = count ? "inline-flex" : "none";
}

// ─── All Dropdowns ─────────────────────────────────────────────────────────────
function closeAllDropdowns() {
  const cdd = document.getElementById("company-dropdown");
  const cbtn = document.getElementById("company-filter-btn");
  if (cdd) cdd.style.display = "none";
  if (cbtn) cbtn.classList.remove("active");
  companyDropdownOpen = false;

  const pdd = document.getElementById("pattern-dropdown");
  const pbtn = document.getElementById("pattern-filter-btn");
  if (pdd) pdd.style.display = "none";
  if (pbtn) pbtn.classList.remove("active");
  patternDropdownOpen = false;

  const sdd = document.getElementById("status-dropdown");
  const sbtn = document.getElementById("status-filter-btn");
  if (sdd) sdd.style.display = "none";
  if (sbtn) sbtn.classList.toggle("active", state.filters.status !== "all");

  const sortdd = document.getElementById("sort-dropdown");
  if (sortdd) sortdd.style.display = "none";
}

// ─── Company Dropdown ──────────────────────────────────────────────────────────
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

// ─── Filters ───────────────────────────────────────────────────────────────────
function applyFilters() {
  const { search, difficulties, companies, patterns, status, starred, review } =
    state.filters;
  const q = search.toLowerCase();
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
    if (review) {
      if (!state.solved[item.id]) return false;
      if (!isReviewDue(item.id)) return false;
    }
    if (patterns.length) {
      const itemTags = state.metaMap[item.id]?.tags || [];
      if (!patterns.some((p) => itemTags.includes(p))) return false;
    }
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
  const { search, difficulties, companies, patterns, status, starred, review } =
    state.filters;
  const hasFilters =
    search ||
    difficulties.length ||
    companies.length ||
    patterns.length ||
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
function updateSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === state.sortCol)
      th.classList.add(state.sortDir === "asc" ? "sort-asc" : "sort-desc");
  });
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
          ? "🌱 You haven't solved any problems yet. Sync with LeetCode to get started!"
          : "✅ All caught up! No problems are due for SM2 review yet.";
    }
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${emptyMsg}</td></tr>`;
    renderPagination();
    return;
  }

  tbody.innerHTML = items
    .map((q) => {
      const solved = !!state.solved[q.id];
      const starred = !!state.bookmarks[q.id];
      const hasNote = !!state.notes[q.id];
      const diffClass = q.difficulty.toLowerCase();
      const reviewDue = solved && isReviewDue(q.id);
      const tags = (state.metaMap[q.id]?.tags || []).slice(0, 2);
      const solveDate = state.solved[q.id];

      return `<tr class="${solved ? "solved" : ""}">
  <td class="col-status">
    ${
      solved
        ? `<span class="solved-icon" title="Solved via LeetCode sync${solveDate ? " · " + solveDate : ""}">✓</span>`
        : `<span class="unsolved-icon">○</span>`
    }
  </td>
  <td class="col-title">
    <div class="title-cell-content">
      <button class="star-btn inline-star ${starred ? "starred" : ""}"
              data-id="${q.id}" onclick="toggleBookmark(${q.id})"
              title="Bookmark">${starred ? "★" : "☆"}</button>
      <a href="${q.link}" target="_blank" rel="noopener">${q.title}</a>
      ${reviewDue ? '<span class="review-badge-inline" title="Due for SM2 review">↺</span>' : ""}
      ${solved ? `<button class="note-btn-inline ${hasNote ? "has-note" : ""}" data-id="${q.id}" onclick="openNoteModal(${q.id})" title="${hasNote ? "Edit note" : "Add note"}">${hasNote ? "📝" : "✎"}</button>` : ""}
      ${tags.length ? `<span class="row-tags">${tags.map((t) => `<span class="pattern-tag-sm">${t}</span>`).join("")}</span>` : ""}
    </div>
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
  if (!el) return;

  if (state.user) {
    const lcConnected = !!state.lcUsername;
    const cfConnected = !!state.cfUsername;
    const anyConnected = lcConnected || cfConnected;

    let syncTooltip = "";
    if (lcConnected && cfConnected) syncTooltip = `Sync LC (${state.lcUsername}) + CF (${state.cfUsername})`;
    else if (lcConnected) syncTooltip = `Sync LeetCode: ${state.lcUsername} · Last synced: ${getLastSyncLabel()}`;
    else if (cfConnected) syncTooltip = `Sync Codeforces: ${state.cfUsername}`;

    el.innerHTML = `
      <div class="auth-user-row">
        <img src="${state.user.avatar_url}" class="nav-avatar" alt="">
        <span class="nav-username">@${state.user.login}</span>
        ${
          anyConnected
            ? `<button id="lc-sync-btn" class="lc-sync-btn" onclick="syncAll()" title="${syncTooltip}">⟳ Sync</button>`
            : `<button class="btn-lc-connect" onclick="openLCModal()">+ Connect LeetCode</button>`
        }
        <button class="nav-icon-btn logout-btn" onclick="logout()" title="Logout">↩</button>
      </div>`;
  } else {
    el.innerHTML = `<button class="btn-github-sm" onclick="loginWithGitHub()"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>Login with GitHub</button>`;
  }
}

// ─── Sync Banner (shown on tracker page when LC not connected) ─────────────────
function renderSyncBanner() {
  const existing = document.getElementById("lc-sync-banner");
  if (existing) existing.remove();
  // Only show when GitHub logged in but LC not connected
  if (!state.user || state.lcUsername) return;
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;
  const banner = document.createElement("div");
  banner.id = "lc-sync-banner";
  banner.className = "lc-sync-banner";
  banner.innerHTML = `
    <span class="lc-banner-icon">🔗</span>
    <span>Connect your LeetCode account to automatically sync solved problems.</span>
    <button class="btn-lc-connect" onclick="openLCModal()">Connect LeetCode</button>
    <button class="lc-banner-dismiss" onclick="this.parentElement.remove()" title="Dismiss">✕</button>
  `;
  mainContent.insertBefore(banner, mainContent.firstChild);
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
      closeRandomPicker();
      closeOnboarding();
      closeLCModal();
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
      if (state.activePlatform === "cf") {
        document.getElementById("cf-search-input")?.focus();
      } else {
        document.getElementById("search-input")?.focus();
      }
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
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      syncAll();
    }
  });
}

// ─── Interview Readiness Score ─────────────────────────────────────────────────
function calcReadinessScore() {
  const solvedIds = new Set(Object.keys(state.solved).map(Number));
  const totalSolved = solvedIds.size;
  const top5 = ["google", "amazon", "meta", "microsoft", "apple"];
  let top5Score = 0;
  for (const company of top5) {
    const qs = state.questions.filter((q) => q.companies.includes(company));
    const s = qs.filter((q) => solvedIds.has(q.id)).length;
    top5Score += (qs.length ? s / qs.length : 0) * 8;
  }
  const VOLUME_GOAL = 400;
  const volumeScore = Math.min(35, (totalSolved / VOLUME_GOAL) * 35);
  const easy = [...solvedIds].filter(
    (id) => state.questions.find((q) => q.id === id)?.difficulty === "Easy",
  ).length;
  const medium = [...solvedIds].filter(
    (id) => state.questions.find((q) => q.id === id)?.difficulty === "Medium",
  ).length;
  const hard = [...solvedIds].filter(
    (id) => state.questions.find((q) => q.id === id)?.difficulty === "Hard",
  ).length;
  const hasBalance = easy > 10 && medium > 20 && hard > 5;
  const balanceScore = hasBalance
    ? 15
    : Math.min(15, easy * 0.3 + medium * 0.5 + hard * 1.5);
  const { current, totalDays } = calcStreaks();
  const consistencyScore = Math.min(10, current * 0.5 + totalDays * 0.1);
  const total = Math.min(
    100,
    Math.round(top5Score + volumeScore + balanceScore + consistencyScore),
  );
  return {
    total,
    breakdown: {
      top5: Math.round(top5Score),
      volume: Math.round(volumeScore),
      balance: Math.round(balanceScore),
      consistency: Math.round(consistencyScore),
    },
  };
}

function renderReadinessGauge(score) {
  const el = document.getElementById("readiness-gauge");
  if (!el) return;
  const { total, breakdown } = score;
  const color =
    total >= 75
      ? "var(--green)"
      : total >= 50
        ? "var(--yellow)"
        : total >= 25
          ? "var(--accent)"
          : "var(--red)";
  const label =
    total >= 80
      ? "Interview Ready! 🚀"
      : total >= 60
        ? "Getting There 💪"
        : total >= 40
          ? "Keep Grinding 📚"
          : "Just Starting 🌱";
  const r = 54,
    circ = 2 * Math.PI * r;
  const fill = (total / 100) * circ;
  el.innerHTML = `
    <div class="readiness-gauge-wrap">
      <svg class="readiness-svg" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r="${r}" fill="none" stroke="var(--bg-4)" stroke-width="10"/>
        <circle cx="65" cy="65" r="${r}" fill="none" stroke="${color}" stroke-width="10"
          stroke-dasharray="${fill.toFixed(1)} ${circ.toFixed(1)}"
          stroke-dashoffset="${(circ * 0.25).toFixed(1)}"
          stroke-linecap="round" style="transition: stroke-dasharray 1s ease"/>
        <text x="65" y="60" text-anchor="middle" class="gauge-score-text" fill="${color}" font-size="28" font-weight="700" font-family="Syne,sans-serif">${total}</text>
        <text x="65" y="76" text-anchor="middle" fill="var(--text-muted)" font-size="9" font-family="JetBrains Mono,monospace">/100</text>
      </svg>
      <div class="readiness-label">${label}</div>
    </div>
    <div class="readiness-breakdown">
      ${[
        {
          label: "Top 5 Co.",
          val: breakdown.top5,
          max: 40,
          color: "var(--blue)",
        },
        {
          label: "Volume",
          val: breakdown.volume,
          max: 35,
          color: "var(--accent)",
        },
        {
          label: "Balance",
          val: breakdown.balance,
          max: 15,
          color: "var(--green)",
        },
        {
          label: "Streak",
          val: breakdown.consistency,
          max: 10,
          color: "var(--yellow)",
        },
      ]
        .map(
          (r) => `
        <div class="readiness-row">
          <span class="readiness-row-label">${r.label}</span>
          <div class="readiness-row-bar-bg">
            <div class="readiness-row-bar" style="width:${Math.round((r.val / r.max) * 100)}%;background:${r.color}"></div>
          </div>
          <span class="readiness-row-score">${r.val}/${r.max}</span>
        </div>`,
        )
        .join("")}
    </div>`;
}

// ─── Weekly Chart ──────────────────────────────────────────────────────────────
function renderWeeklyChart() {
  const el = document.getElementById("insights-weekly");
  if (!el) return;
  const NUM_WEEKS = 12;
  const weeks = [];
  const today = new Date();
  for (let w = NUM_WEEKS - 1; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    let easy = 0,
      medium = 0,
      hard = 0;
    for (const [id, date] of Object.entries(state.solved)) {
      const d = new Date(date);
      if (d >= weekStart && d <= weekEnd) {
        const q = state.questions.find((x) => x.id === +id);
        if (!q) continue;
        if (q.difficulty === "Easy") easy++;
        else if (q.difficulty === "Medium") medium++;
        else if (q.difficulty === "Hard") hard++;
      }
    }
    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    weeks.push({ label, easy, medium, hard, total: easy + medium + hard });
  }
  const maxTotal = Math.max(...weeks.map((w) => w.total), 1);
  el.innerHTML = `
    <div class="weekly-chart-wrap">
      <div class="weekly-bars">
        ${weeks
          .map((w) => {
            const eH = Math.round((w.easy / maxTotal) * 100);
            const mH = Math.round((w.medium / maxTotal) * 100);
            const hH = Math.round((w.hard / maxTotal) * 100);
            return `<div class="weekly-col">
            <div class="weekly-count">${w.total || ""}</div>
            <div class="weekly-bar-wrap">
              ${hH ? `<div style="height:${hH}%;background:var(--red);min-height:2px;border-radius:2px 2px 0 0"></div>` : ""}
              ${mH ? `<div style="height:${mH}%;background:var(--yellow);min-height:2px"></div>` : ""}
              ${eH ? `<div style="height:${eH}%;background:var(--green);min-height:2px;border-radius:${hH || mH ? "0" : "2px 2px"} 0 0"></div>` : ""}
            </div>
            <div class="weekly-label">${w.label}</div>
          </div>`;
          })
          .join("")}
      </div>
      <div class="weekly-legend">
        <span><span style="color:var(--green)">■</span> Easy</span>
        <span><span style="color:var(--yellow)">■</span> Medium</span>
        <span><span style="color:var(--red)">■</span> Hard</span>
      </div>
    </div>`;
}

// ─── Notes Search ──────────────────────────────────────────────────────────────
function renderNotesSearch(query = "") {
  const el = document.getElementById("notes-search-results");
  if (!el) return;
  const q = query.toLowerCase().trim();
  const results = Object.entries(state.notes)
    .map(([id, note]) => ({
      id: +id,
      note,
      q: state.questions.find((x) => x.id === +id),
    }))
    .filter(
      (x) =>
        x.q &&
        (!q ||
          x.note.toLowerCase().includes(q) ||
          x.q.title.toLowerCase().includes(q)),
    )
    .slice(0, 20);
  if (!results.length) {
    el.innerHTML = query
      ? `<div class="notes-no-results">No notes match "${query}"</div>`
      : `<div class="notes-no-results">No notes yet. Open any solved problem and add a note.</div>`;
    return;
  }
  el.innerHTML = results
    .map(({ id, note, q }) => {
      const diffCls = q.difficulty.toLowerCase();
      const highlighted = query
        ? note.replace(
            new RegExp(`(${escapeRegex(query)})`, "gi"),
            "<mark>$1</mark>",
          )
        : note;
      const preview =
        highlighted.length > 200
          ? highlighted.slice(0, 200) + "…"
          : highlighted;
      return `<div class="note-result-item" onclick="openNoteModal(${id})">
      <div class="note-result-header">
        <span class="diff-badge ${diffCls} sm">${q.difficulty[0]}</span>
        <a href="${q.link}" target="_blank" class="note-result-title" onclick="event.stopPropagation()">${q.title}</a>
      </div>
      <div class="note-result-body">${preview}</div>
    </div>`;
    })
    .join("");
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Render: Profile Page ──────────────────────────────────────────────────────
function renderProfilePage() {
  const guestEl = document.getElementById("profile-guest");
  const contentEl = document.getElementById("profile-content");
  if (!state.user) {
    if (guestEl) guestEl.style.display = "flex";
    if (contentEl) contentEl.style.display = "none";
    return;
  }
  if (guestEl) guestEl.style.display = "none";
  if (contentEl) contentEl.style.display = "block";

  // ── GitHub identity (always shown, generic) ──
  document.getElementById("profile-avatar").src = state.user.avatar_url;
  document.getElementById("profile-name").textContent =
    state.user.name || state.user.login;
  document.getElementById("profile-handle").textContent =
    "@" + state.user.login;
  // ── Combined streak & heatmap (cross-platform) ──
  const { current, longest, totalDays } = calcStreaks();
  animateNumber("streak-number", current);
  animateNumber("longest-streak", longest);
  animateNumber("total-days", totalDays);
  animateNumber(
    "total-solved-profile",
    Object.keys(state.solved).length + Object.keys(state.cfSolved).length,
  );

  const streakCard = document.getElementById("streak-card");
  const flame = document.getElementById("streak-flame");
  const sub = document.getElementById("streak-sub");
  if (streakCard && flame && sub) {
    streakCard.classList.remove(
      "streak-cold",
      "streak-warm",
      "streak-hot",
      "streak-fire",
    );
    if (current === 0) {
      streakCard.classList.add("streak-cold");
      flame.textContent = "💤";
      sub.textContent = "Start solving to build your streak!";
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
  }

  renderHeatmap();

  // ── Platform sub-tabs ──
  const activeTab = state.profilePlatform || "lc";
  renderProfilePlatformTabs(activeTab);
}

function renderProfilePlatformTabs(platform) {
  state.profilePlatform = platform;

  // Update tab buttons
  const lcTab = document.getElementById("profile-tab-lc");
  const cfTab = document.getElementById("profile-tab-cf");
  if (lcTab) lcTab.classList.toggle("active", platform === "lc");
  if (cfTab) cfTab.classList.toggle("active", platform === "cf");

  // Show/hide sections
  const lcSection = document.getElementById("profile-lc-section");
  const cfSection = document.getElementById("profile-cf-section");
  if (lcSection) lcSection.style.display = platform === "lc" ? "" : "none";
  if (cfSection) cfSection.style.display = platform === "cf" ? "" : "none";

  if (platform === "lc") renderProfileLC();
  else renderProfileCF();
}

function switchProfilePlatform(platform) {
  renderProfilePlatformTabs(platform);
}

function renderProfileLC() {
  // LC connect badge
  const lcBadge = document.getElementById("profile-lc-badge");
  if (lcBadge) {
    if (state.lcUsername) {
      lcBadge.innerHTML = `<span class="lc-dot"></span> LeetCode: <a href="https://leetcode.com/${state.lcUsername}" target="_blank">@${state.lcUsername}</a> <button class="lc-disconnect-btn" onclick="disconnectLC()">Disconnect</button>`;
    } else {
      lcBadge.innerHTML = `<button class="btn-lc-connect" onclick="openLCModal()">+ Connect LeetCode</button>`;
    }
  }

  // Difficulty bars
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

  // Readiness gauge
  renderReadinessGauge(calcReadinessScore());

  // Company coverage
  renderCompanyCoverage(solvedIds);

  // Recent solves (LC)
  renderLCRecentSolves();

  // Notes search
  renderNotesSearch();
}

function renderLCRecentSolves() {
  const recentEl = document.getElementById("recent-solves");
  if (!recentEl) return;
  const recent = Object.entries(state.solved)
    .map(([id, date]) => ({ id: +id, date }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  if (!recent.length) {
    recentEl.innerHTML = `<div class="empty-recent">No solves yet. Connect LeetCode and hit Sync! 🚀</div>`;
    return;
  }
  recentEl.innerHTML = recent
    .map(({ id, date }) => {
      const q = state.questions.find((x) => x.id === id);
      if (!q) return "";
      const reviewDue = isReviewDue(id);
      return `<div class="recent-item">
      <span class="recent-diff ${q.difficulty.toLowerCase()}"></span>
      <div class="recent-title-wrap">
        <a href="${q.link}" target="_blank" class="recent-title">${q.title}</a>
        ${reviewDue ? '<span class="review-due-pill">↺ Review</span>' : ""}
      </div>
      ${state.notes[id] ? `<span class="recent-note-icon" onclick="openNoteModal(${id}); event.preventDefault()" title="View note">📝</span>` : ""}
      <span class="recent-date">${formatDate(date)}</span>
      <span class="diff-badge ${q.difficulty.toLowerCase()} sm">${q.difficulty}</span>
    </div>`;
    })
    .join("");
}

function renderProfileCF() {
  // CF connect badge
  const cfBadge = document.getElementById("profile-cf-badge");
  if (cfBadge) {
    if (state.cfUserInfo) {
      const u = state.cfUserInfo;
      const rating = u.rating || null;
      cfBadge.innerHTML = `<span class="lc-dot" style="background:${cfRatingColor(rating)}"></span> Codeforces: <a href="https://codeforces.com/profile/${u.handle}" target="_blank" style="color:${cfRatingColor(rating)}">@${u.handle}</a> <span style="color:${cfRatingColor(rating)};font-size:11px">${cfRatingLabel(rating)}${rating ? " · " + rating : ""}</span> <button class="lc-disconnect-btn" onclick="disconnectCF()">Disconnect</button>`;
    } else {
      cfBadge.innerHTML = `<button class="btn-lc-connect" onclick="switchPlatform('cf'); showPage('tracker')">+ Connect Codeforces</button>`;
    }
  }

  // CF stats summary
  renderProfileCFStats();

  // CF rating distribution
  renderProfileCFRatingDist();

  // CF recent solves
  renderCFRecentSolves();

  // CF tag coverage
  renderProfileCFTagCoverage();
}

function renderProfileCFStats() {
  const el = document.getElementById("profile-cf-stats");
  if (!el) return;
  const cfSolvedKeys = Object.keys(state.cfSolved);
  const totalSolved = cfSolvedKeys.length;
  const ratedTotal = Object.values(state.cfMeta).filter((p) => p.rating).length;
  const u = state.cfUserInfo;

  if (!u) {
    el.innerHTML = `<div class="empty-recent">Connect Codeforces on the tracker page to see your stats.</div>`;
    return;
  }

  const rating = u.rating || null;
  const maxRating = u.maxRating || null;
  const rank = u.rank || "unrated";
  const maxRank = u.maxRank || null;

  el.innerHTML = `
    <div class="cf-profile-stats-grid">
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:${cfRatingColor(rating)}">${rating ?? "—"}</div>
        <div class="cf-profile-stat-label">Current Rating</div>
        <div class="cf-profile-stat-sub" style="color:${cfRatingColor(rating)}">${cfRatingLabel(rating)}</div>
      </div>
      ${
        maxRating
          ? `<div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:${cfRatingColor(maxRating)}">${maxRating}</div>
        <div class="cf-profile-stat-label">Peak Rating</div>
        <div class="cf-profile-stat-sub" style="color:${cfRatingColor(maxRating)}">${cfRatingLabel(maxRating)}</div>
      </div>`
          : ""
      }
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val accent-text">${totalSolved}</div>
        <div class="cf-profile-stat-label">Problems Solved</div>
        <div class="cf-profile-stat-sub">${ratedTotal ? Math.round((totalSolved / ratedTotal) * 100) + "% of rated" : ""}</div>
      </div>
    </div>`;
}

function renderProfileCFRatingDist() {
  const el = document.getElementById("profile-cf-rating-dist");
  if (!el) return;
  if (!Object.keys(state.cfSolved).length) {
    el.innerHTML = `<div class="empty-recent">Solve CF problems to see your rating distribution.</div>`;
    return;
  }

  const bands = [
    { label: "800–1199", min: 800, max: 1199, color: "#808080" },
    { label: "1200–1399", min: 1200, max: 1399, color: "#008000" },
    { label: "1400–1599", min: 1400, max: 1599, color: "#03a89e" },
    { label: "1600–1899", min: 1600, max: 1899, color: "#0000ff" },
    { label: "1900–2099", min: 1900, max: 2099, color: "#aa00aa" },
    { label: "2100–2399", min: 2100, max: 2399, color: "#ff8c00" },
    { label: "2400+", min: 2400, max: Infinity, color: "#ff0000" },
  ];

  const counts = {};
  for (const key of Object.keys(state.cfSolved)) {
    const p = state.cfMeta[key];
    if (!p || !p.rating) continue;
    const band = bands.find((b) => p.rating >= b.min && p.rating <= b.max);
    if (band) counts[band.label] = (counts[band.label] || 0) + 1;
  }

  const max = Math.max(...Object.values(counts), 1);
  el.innerHTML =
    bands
      .filter((b) => counts[b.label])
      .map((b) => {
        const count = counts[b.label] || 0;
        const pct = Math.round((count / max) * 100);
        return `<div class="cf-dist-row">
        <span class="cf-dist-label" style="color:${b.color}">${b.label}</span>
        <div class="cf-dist-bar-bg"><div class="cf-dist-bar" style="width:${pct}%;background:${b.color}"></div></div>
        <span class="cf-dist-count">${count}</span>
      </div>`;
      })
      .join("") ||
    `<div class="empty-recent">No rated problems solved yet.</div>`;
}

function renderCFRecentSolves() {
  const el = document.getElementById("cf-recent-solves");
  if (!el) return;
  const entries = Object.entries(state.cfSolved)
    .map(([key, date]) => ({ key, date, meta: state.cfMeta[key] }))
    .filter((x) => x.meta)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  if (!entries.length) {
    el.innerHTML = `<div class="empty-recent">No CF problems solved yet. Connect and start solving!</div>`;
    return;
  }

  el.innerHTML = entries
    .map(({ key, date, meta }) => {
      const link = `https://codeforces.com/problemset/problem/${meta.contestId}/${meta.index}`;
      const rating = meta.rating;
      const ratingColor = cfRatingColor(rating);
      return `<div class="recent-item">
      <span class="recent-diff" style="background:${ratingColor}"></span>
      <div class="recent-title-wrap">
        <a href="${link}" target="_blank" class="recent-title">${meta.name}</a>
      </div>
      <span class="recent-date">${formatDate(date)}</span>
      ${rating ? `<span class="diff-badge sm" style="background:${ratingColor}20;color:${ratingColor};border:1px solid ${ratingColor}40">${rating}</span>` : `<span class="diff-badge sm" style="color:var(--text-muted)">Unrated</span>`}
    </div>`;
    })
    .join("");
}

function renderProfileCFTagCoverage() {
  const el = document.getElementById("profile-cf-tags");
  if (!el) return;
  if (!Object.keys(state.cfMeta).length) {
    el.innerHTML = `<div class="empty-recent">No CF metadata loaded.</div>`;
    return;
  }

  const tagStats = {};
  for (const p of Object.values(state.cfMeta)) {
    if (!p.rating) continue;
    const key = cfProblemKey(p.contestId, p.index);
    const solved = !!state.cfSolved[key];
    for (const tag of p.tags || []) {
      if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
      tagStats[tag].total++;
      if (solved) tagStats[tag].solved++;
    }
  }

  const sorted = Object.entries(tagStats)
    .filter(([, v]) => v.solved > 0)
    .sort((a, b) => b[1].solved - a[1].solved)
    .slice(0, 12);

  if (!sorted.length) {
    el.innerHTML = `<div class="empty-recent">Solve some CF problems to see your tag coverage.</div>`;
    return;
  }

  const maxSolved = sorted[0]?.[1].solved || 1;
  el.innerHTML = sorted
    .map(([tag, { total, solved }]) => {
      const pct = Math.round((solved / total) * 100);
      const barW = Math.round((solved / maxSolved) * 100);
      return `<div class="company-row">
      <span class="company-row-name">${tag}</span>
      <div class="company-row-bar-wrap"><div class="company-row-bar" style="width:${barW}%"></div></div>
      <span class="company-row-count">${solved}/${total}</span>
    </div>`;
    })
    .join("");
}

// ─── Company Coverage ──────────────────────────────────────────────────────────
function renderCompanyCoverage(solvedIds) {
  const coverage = document.getElementById("company-coverage");
  if (!coverage) return;
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
  renderCompanyCoverage(new Set(Object.keys(state.solved).map(Number)));
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
  if (!el) return;
  const WEEKS = 52;
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const today = new Date();
  const start = new Date(today);
  // Start from the Sunday of the week that was (WEEKS-1) weeks ago
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);
  const maxVal = Math.max(1, ...Object.values(state.activity));

  const monthMarkers = [];
  let lastMonth = -1;
  let colsHtml = "";

  for (let w = 0; w < WEEKS; w++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + w * 7);
    const m = weekStart.getMonth();
    // Only add label if month changed AND it's not the very last week (avoids duplicate at end)
    if (m !== lastMonth) {
      monthMarkers.push({ w, label: MONTHS[m] });
      lastMonth = m;
    }

    colsHtml += `<div class="heatmap-col">`;
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = dateStr(date);
      const count = (state.activity[key] || 0) + (state.cfActivity[key] || 0);
      const level = count === 0 ? 0 : Math.ceil((count / maxVal) * 4);
      const future = date > today;
      colsHtml += `<div class="heatmap-cell l${future ? 0 : level}${future ? " future" : ""}" title="${key}: ${count} solve${count !== 1 ? "s" : ""}"></div>`;
    }
    colsHtml += `</div>`;
  }

  // Each col = 12px cell + 3px gap = 15px
  const COL_WIDTH = 15;
  const monthsHtml = monthMarkers
    .map(
      ({ w, label }) =>
        `<span class="heatmap-month-label" style="left:${w * COL_WIDTH}px">${label}</span>`,
    )
    .join("");

  el.innerHTML = `
    <div class="heatmap-wrapper">
      <div class="heatmap-month-row">${monthsHtml}</div>
      <div class="heatmap-grid">${colsHtml}</div>
    </div>
  `;
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
  state.reviewData = {};
  saveProgress();
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
function showError(msg) {
  document.getElementById("loading").innerHTML =
    `<div class="error-state">⚠️ ${msg}</div>`;
}

// ─── Insights Page ─────────────────────────────────────────────────────────────
function renderInsightsPage() {
  if (!state.questions.length) return;
  const platform = state.insightsPlatform || "lc";
  renderInsightsPlatformTabs(platform);
}

function renderInsightsPlatformTabs(platform) {
  state.insightsPlatform = platform;
  const lcTab = document.getElementById("insights-tab-lc");
  const cfTab = document.getElementById("insights-tab-cf");
  if (lcTab) lcTab.classList.toggle("active", platform === "lc");
  if (cfTab) cfTab.classList.toggle("active", platform === "cf");

  const lcSection = document.getElementById("insights-lc-section");
  const cfSection = document.getElementById("insights-cf-section");
  if (lcSection) lcSection.style.display = platform === "lc" ? "" : "none";
  if (cfSection) cfSection.style.display = platform === "cf" ? "" : "none";

  if (platform === "lc") renderLCInsights();
  else renderCFInsights();
}

function switchInsightsPlatform(platform) {
  renderInsightsPlatformTabs(platform);
}

function renderLCInsights() {
  renderInsightsRibbon();
  renderHotQuestions();
  renderDiffChart();
  renderSolveRate();
  renderCompanyLeaderboard("");
  renderTodoBreakdown();
  renderNextToSolve();
  renderWeeklyChart();
  renderPatternInsights();
}

function renderCFInsights() {
  renderCFInsightsRibbon();
  renderCFRatingChart();
  renderCFSolveByRating();
  renderCFTagInsights();
  renderCFWeeklyChart();
}

function renderInsightsRibbon() {
  const total = state.questions.length;
  const solved = Object.keys(state.solved).length;
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const companies = state.companies.length;
  const streak = getCurrentStreak();
  const starred = Object.keys(state.bookmarks).length;
  const reviewDue = Object.keys(state.solved).filter((id) =>
    isReviewDue(+id),
  ).length;
  document.getElementById("insights-ribbon").innerHTML = `
    <div class="ribbon-item"><div class="ribbon-val">${total}</div><div class="ribbon-label">Total Questions</div></div>
    <div class="ribbon-item"><div class="ribbon-val accent-text">${solved}</div><div class="ribbon-label">Solved</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${pct}%</div><div class="ribbon-label">Completion</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${companies}</div><div class="ribbon-label">Companies</div></div>
    <div class="ribbon-item"><div class="ribbon-val streak-text">${streak}🔥</div><div class="ribbon-label">Day Streak</div></div>
    <div class="ribbon-item"><div class="ribbon-val" style="color:var(--accent)">★ ${starred}</div><div class="ribbon-label">Bookmarked</div></div>
    ${reviewDue > 0 ? `<div class="ribbon-item" style="cursor:pointer" onclick="showPage('tracker'); state.filters.review=true; document.getElementById('filter-review-btn').classList.add('active'); applyFilters()"><div class="ribbon-val" style="color:var(--yellow)">↺ ${reviewDue}</div><div class="ribbon-label">Due Review</div></div>` : ""}
  `;
}
function getCurrentStreak() {
  let streak = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (state.activity[key] || state.cfActivity[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function renderPatternInsights() {
  const el = document.getElementById("insights-patterns");
  if (!el) return;

  // LC patterns
  let lcHtml = "";
  if (state.allTags.length) {
    const solvedIds = new Set(Object.keys(state.solved).map(Number));
    const tagStats = {};
    for (const q of state.questions) {
      const tags = state.metaMap[q.id]?.tags || [];
      for (const tag of tags) {
        if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
        tagStats[tag].total++;
        if (solvedIds.has(q.id)) tagStats[tag].solved++;
      }
    }
    const sorted = Object.entries(tagStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 15);
    const maxTotal = sorted[0]?.[1].total || 1;
    lcHtml = sorted
      .map(([tag, { total, solved }]) => {
        const pct = Math.round((solved / total) * 100);
        const barW = Math.round((total / maxTotal) * 100);
        return `<div class="pattern-row" onclick="state.filters.patterns=[]; togglePatternFilter('${tag.replace(/'/g, "\\'")}'); showPage('tracker')">
      <span class="pattern-row-name">${tag}</span>
      <div class="pattern-row-bar-bg">
        <div class="pattern-row-bar-total" style="width:${barW}%"></div>
        <div class="pattern-row-bar-solved" style="width:${Math.round((solved / maxTotal) * 100)}%"></div>
      </div>
      <span class="pattern-row-count">${solved}/${total}</span>
      <span class="pattern-row-pct ${pct >= 70 ? "easy-text" : pct >= 40 ? "medium-text" : "hard-text"}">${pct}%</span>
    </div>`;
      })
      .join("");
  } else {
    lcHtml = `<div class="empty-insights">Run <code>node fetch-metadata.js</code> to enable LC pattern analytics.</div>`;
  }

  // CF tag coverage
  let cfHtml = "";
  if (Object.keys(state.cfMeta).length) {
    const cfTagStats = {};
    for (const p of Object.values(state.cfMeta)) {
      if (!p.rating) continue;
      const key = cfProblemKey(p.contestId, p.index);
      const solved = !!state.cfSolved[key];
      for (const tag of p.tags || []) {
        if (!cfTagStats[tag]) cfTagStats[tag] = { total: 0, solved: 0 };
        cfTagStats[tag].total++;
        if (solved) cfTagStats[tag].solved++;
      }
    }
    const cfSorted = Object.entries(cfTagStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 15);
    const cfMax = cfSorted[0]?.[1].total || 1;
    cfHtml = cfSorted
      .map(([tag, { total, solved }]) => {
        const pct = Math.round((solved / total) * 100);
        return `<div class="pattern-row">
      <span class="pattern-row-name">${tag}</span>
      <div class="pattern-row-bar-bg">
        <div class="pattern-row-bar-total" style="width:${Math.round((total / cfMax) * 100)}%"></div>
        <div class="pattern-row-bar-solved" style="width:${Math.round((solved / cfMax) * 100)}%"></div>
      </div>
      <span class="pattern-row-count">${solved}/${total}</span>
      <span class="pattern-row-pct ${pct >= 70 ? "easy-text" : pct >= 40 ? "medium-text" : "hard-text"}">${pct}%</span>
    </div>`;
      })
      .join("");
  }

  el.innerHTML = `
    <div class="insights-platform-tabs">
      <button class="ins-tab active" id="ins-tab-lc" onclick="switchInsightTab('lc')">LeetCode</button>
      ${cfHtml ? `<button class="ins-tab" id="ins-tab-cf" onclick="switchInsightTab('cf')">Codeforces</button>` : ""}
    </div>
    <div id="ins-patterns-lc">${lcHtml}</div>
    ${cfHtml ? `<div id="ins-patterns-cf" style="display:none">${cfHtml}</div>` : ""}
  `;
}

function switchInsightTab(platform) {
  document
    .getElementById("ins-tab-lc")
    ?.classList.toggle("active", platform === "lc");
  document
    .getElementById("ins-tab-cf")
    ?.classList.toggle("active", platform === "cf");
  const lcEl = document.getElementById("ins-patterns-lc");
  const cfEl = document.getElementById("ins-patterns-cf");
  if (lcEl) lcEl.style.display = platform === "lc" ? "" : "none";
  if (cfEl) cfEl.style.display = platform === "cf" ? "" : "none";
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
        return `<div class="solve-row"><div class="solve-row-top"><span class="${r.cls}-text">${r.label}</span><span class="solve-nums">${r.solved} / ${r.total}</span><span class="solve-pct">${pct}%</span></div>
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
  const reviewDue = Object.keys(state.solved).filter((id) =>
    isReviewDue(+id),
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
    ${reviewDue > 0 ? `<div class="review-due-badge" onclick="showPage('tracker'); state.filters.review=true; document.getElementById('filter-review-btn').classList.add('active'); applyFilters();">↺ ${reviewDue} problem${reviewDue > 1 ? "s" : ""} due for SM2 review</div>` : ""}`;
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

// ─── CF Insights ───────────────────────────────────────────────────────────────
function renderCFInsightsRibbon() {
  const el = document.getElementById("cf-insights-ribbon");
  if (!el) return;
  const allProblems = Object.values(state.cfMeta);
  const ratedTotal = allProblems.filter((p) => p.rating).length;
  const solved = Object.keys(state.cfSolved).length;
  const pct = ratedTotal ? Math.round((solved / ratedTotal) * 100) : 0;
  const u = state.cfUserInfo;
  const rating = u?.rating ?? null;
  const { current } = calcStreaks();
  el.innerHTML = `
    <div class="ribbon-item"><div class="ribbon-val">${ratedTotal.toLocaleString()}</div><div class="ribbon-label">Rated Problems</div></div>
    <div class="ribbon-item"><div class="ribbon-val accent-text">${solved}</div><div class="ribbon-label">Solved</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${pct}%</div><div class="ribbon-label">Completion</div></div>
    ${
      rating != null
        ? `<div class="ribbon-item"><div class="ribbon-val" style="color:${cfRatingColor(rating)}">${rating}</div><div class="ribbon-label">Rating</div></div>`
        : u
          ? `<div class="ribbon-item"><div class="ribbon-val" style="color:var(--text-muted)">—</div><div class="ribbon-label">Unrated</div></div>`
          : ""
    }
    <div class="ribbon-item"><div class="ribbon-val streak-text">${current}🔥</div><div class="ribbon-label">Day Streak</div></div>
  `;
}

function renderCFRatingChart() {
  const el = document.getElementById("cf-insights-rating-chart");
  if (!el) return;
  const bands = [
    { label: "800", min: 800, max: 1199, color: "#808080" },
    { label: "1200", min: 1200, max: 1399, color: "#008000" },
    { label: "1400", min: 1400, max: 1599, color: "#03a89e" },
    { label: "1600", min: 1600, max: 1899, color: "#0000ff" },
    { label: "1900", min: 1900, max: 2099, color: "#aa00aa" },
    { label: "2100", min: 2100, max: 2399, color: "#ff8c00" },
    { label: "2400+", min: 2400, max: Infinity, color: "#ff0000" },
  ];
  const counts = {};
  const solvedCounts = {};
  for (const p of Object.values(state.cfMeta)) {
    if (!p.rating) continue;
    const band = bands.find((b) => p.rating >= b.min && p.rating <= b.max);
    if (!band) continue;
    counts[band.label] = (counts[band.label] || 0) + 1;
    const key = cfProblemKey(p.contestId, p.index);
    if (state.cfSolved[key])
      solvedCounts[band.label] = (solvedCounts[band.label] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(counts), 1);
  el.innerHTML = `<div class="cf-rating-dist-chart">${bands
    .map((b) => {
      const total = counts[b.label] || 0;
      const solved = solvedCounts[b.label] || 0;
      const barH = Math.round((total / maxCount) * 100);
      const solvedH = total ? Math.round((solved / total) * barH) : 0;
      return `<div class="cf-chart-col">
      <div class="cf-chart-count">${total > 1000 ? (total / 1000).toFixed(1) + "k" : total}</div>
      <div class="cf-chart-bar-wrap">
        <div class="cf-chart-bar-total" style="height:${barH}%;background:${b.color}20;border:1px solid ${b.color}40"></div>
        <div class="cf-chart-bar-solved" style="height:${solvedH}%;background:${b.color}"></div>
      </div>
      <div class="cf-chart-label" style="color:${b.color}">${b.label}</div>
    </div>`;
    })
    .join("")}
  <div class="cf-chart-legend"><span><span style="display:inline-block;width:10px;height:10px;background:var(--accent);border-radius:2px"></span> Solved</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--bg-4);border-radius:2px;border:1px solid var(--border)"></span> Total</span></div>
  </div>`;
}

function renderCFSolveByRating() {
  const el = document.getElementById("cf-insights-solve-rate");
  if (!el) return;
  const bands = [
    { label: "800–1199", min: 800, max: 1199, color: "#808080" },
    { label: "1200–1399", min: 1200, max: 1399, color: "#008000" },
    { label: "1400–1599", min: 1400, max: 1599, color: "#03a89e" },
    { label: "1600–1899", min: 1600, max: 1899, color: "#0000ff" },
    { label: "1900–2099", min: 1900, max: 2099, color: "#aa00aa" },
    { label: "2100–2399", min: 2100, max: 2399, color: "#ff8c00" },
    { label: "2400+", min: 2400, max: Infinity, color: "#ff0000" },
  ];
  const data = bands
    .map((b) => {
      const total = Object.values(state.cfMeta).filter(
        (p) => p.rating >= b.min && p.rating <= b.max,
      ).length;
      const solved = Object.values(state.cfMeta).filter((p) => {
        if (p.rating < b.min || p.rating > b.max) return false;
        return !!state.cfSolved[cfProblemKey(p.contestId, p.index)];
      }).length;
      return { ...b, total, solved };
    })
    .filter((b) => b.total > 0);
  const totalSolved = data.reduce((s, r) => s + r.solved, 0);
  el.innerHTML = `
    <div class="solve-overall"><div class="solve-overall-num accent-text">${totalSolved} <span>solved</span></div><div class="solve-overall-label">Total CF problems solved</div></div>
    ${data
      .map((r) => {
        const pct = r.total ? Math.round((r.solved / r.total) * 100) : 0;
        return `<div class="solve-row">
        <div class="solve-row-top">
          <span style="color:${r.color}">${r.label}</span>
          <span class="solve-nums">${r.solved} / ${r.total}</span>
          <span class="solve-pct">${pct}%</span>
        </div>
        <div class="solve-bar-bg"><div class="solve-bar-fill" style="width:${pct}%;background:${r.color}"></div></div>
      </div>`;
      })
      .join("")}`;
}

function renderCFTagInsights() {
  const el = document.getElementById("cf-insights-tags");
  if (!el) return;
  const tagStats = {};
  for (const p of Object.values(state.cfMeta)) {
    if (!p.rating) continue;
    const key = cfProblemKey(p.contestId, p.index);
    const solved = !!state.cfSolved[key];
    for (const tag of p.tags || []) {
      if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
      tagStats[tag].total++;
      if (solved) tagStats[tag].solved++;
    }
  }
  const sorted = Object.entries(tagStats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15);
  if (!sorted.length) {
    el.innerHTML = `<div class="empty-insights">No CF metadata loaded.</div>`;
    return;
  }
  const maxTotal = sorted[0][1].total;
  el.innerHTML = sorted
    .map(([tag, { total, solved }]) => {
      const pct = Math.round((solved / total) * 100);
      const barW = Math.round((total / maxTotal) * 100);
      return `<div class="pattern-row">
      <span class="pattern-row-name">${tag}</span>
      <div class="pattern-row-bar-bg">
        <div class="pattern-row-bar-total" style="width:${barW}%"></div>
        <div class="pattern-row-bar-solved" style="width:${Math.round((solved / maxTotal) * 100)}%"></div>
      </div>
      <span class="pattern-row-count">${solved}/${total}</span>
      <span class="pattern-row-pct ${pct >= 70 ? "easy-text" : pct >= 40 ? "medium-text" : "hard-text"}">${pct}%</span>
    </div>`;
    })
    .join("");
}

function renderCFWeeklyChart() {
  const el = document.getElementById("cf-insights-weekly");
  if (!el) return;
  const NUM_WEEKS = 12;
  const weeks = [];
  const today = new Date();
  for (let w = NUM_WEEKS - 1; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    let count = 0;
    for (const date of Object.values(state.cfSolved)) {
      const d = new Date(date);
      if (d >= weekStart && d <= weekEnd) count++;
    }
    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    weeks.push({ label, count });
  }
  const maxCount = Math.max(...weeks.map((w) => w.count), 1);
  el.innerHTML = `<div class="weekly-chart-wrap"><div class="weekly-bars">
    ${weeks
      .map((w) => {
        const h = Math.round((w.count / maxCount) * 100);
        return `<div class="weekly-col">
        <div class="weekly-count">${w.count || ""}</div>
        <div class="weekly-bar-wrap">${h ? `<div style="height:${h}%;background:var(--accent);min-height:2px;border-radius:2px 2px 0 0"></div>` : ""}</div>
        <div class="weekly-label">${w.label}</div>
      </div>`;
      })
      .join("")}
  </div></div>`;
}

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  initTheme();

  // Handle GitHub OAuth callback token in URL
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
    // restore LC username from localStorage for non-GitHub users too
    const savedLC = localStorage.getItem("lc_username");
    if (savedLC) state.lcUsername = savedLC;
  }

  // Also restore LC username from localStorage if not already set from gist
  if (!state.lcUsername) {
    const savedLC = localStorage.getItem("lc_username");
    if (savedLC) state.lcUsername = savedLC;
  }

  renderAuthArea();

  await Promise.all([loadAllCSVs(), loadMetadata(), initCF()]);

  document.getElementById("loading").style.display = "none";
  document.getElementById("main-content").style.display = "block";

  // Event listeners
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
      patterns: [],
      status: "all",
      starred: false,
      review: false,
    };
    document.getElementById("search-input").value = "";
    document.getElementById("filter-starred-btn")?.classList.remove("active");
    document.getElementById("filter-review-btn")?.classList.remove("active");
    renderDiffPills();
    clearCompanyFilters();
    clearPatternFilters();
    renderCompanyCheckboxList("");
    renderPatternCheckboxList("");
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

  // LC modal enter key
  document
    .getElementById("lc-username-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveLCUsername();
    });

  initKeyboardShortcuts();
  applyFilters();
  initRouting();

  // Show sync banner if logged in but LC not connected
  renderSyncBanner();

  // Auto-sync on load if LC username exists (silent)
  if (state.lcUsername) {
    setTimeout(() => syncLeetCode(true), 1500);
  }

  setTimeout(checkOnboarding, 800);
}

document.addEventListener("DOMContentLoaded", init);