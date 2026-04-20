"use strict";

const SUPABASE_URL = window.SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_ANON = window.SUPABASE_ANON || "YOUR_SUPABASE_ANON_KEY";
const ITEMS_PER_PAGE = 20;

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const SM2_INTERVALS = [1, 3, 7, 14, 30, 90];

const CURATED_LISTS = {
  blind75: new Set([
    1, 11, 15, 19, 20, 21, 23, 33, 39, 48, 49, 53, 54, 55, 56, 57, 62, 70, 73, 76, 79, 91, 98, 100, 101, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143, 152, 153, 190, 191, 198, 200, 206, 207, 208, 211, 212, 213, 217, 226, 230, 235, 236, 238, 242, 252, 253, 261, 268, 269, 271, 295, 297, 300, 322, 323, 338, 347, 371, 417, 424, 435, 572, 647, 1143
  ]),
  neetcode150: new Set([
    1, 2, 3, 4, 5, 10, 11, 15, 17, 19, 20, 21, 22, 23, 25, 33, 36, 39, 40, 42, 43, 45, 46, 48, 49, 51, 53, 54, 55, 56, 57, 62, 70, 72, 73, 74, 76, 78, 79, 84, 90, 91, 97, 98, 100, 101, 102, 104, 105, 106, 110, 115, 121, 124, 125, 127, 128, 130, 131, 133, 134, 136, 138, 139, 141, 143, 146, 150, 152, 153, 155, 167, 190, 191, 198, 199, 200, 202, 206, 207, 208, 210, 211, 212, 213, 215, 217, 226, 230, 235, 236, 238, 239, 242, 252, 253, 261, 268, 269, 271, 286, 287, 295, 297, 300, 309, 312, 322, 323, 329, 332, 338, 347, 355, 371, 416, 417, 424, 435, 494, 518, 543, 560, 567, 572, 621, 647, 678, 684, 695, 703, 704, 739, 743, 746, 763, 778, 787, 846, 853, 875, 953, 973, 981, 994, 1046, 1143, 1448, 1584, 1851, 1899, 2013
  ]),
  striver_sde: new Set([
    1, 2, 3, 4, 8, 13, 14, 15, 18, 19, 20, 21, 23, 25, 26, 28, 31, 33, 37, 38, 39, 40, 42, 46, 48, 50, 51, 52, 53, 54, 56, 60, 61, 62, 64, 72, 73, 74, 75, 78, 84, 88, 90, 94, 98, 99, 101, 102, 103, 104, 105, 106, 108, 110, 114, 116, 118, 121, 124, 128, 131, 133, 138, 141, 142, 144, 145, 146, 151, 155, 160, 165, 169, 173, 200, 206, 207, 208, 210, 215, 222, 225, 229, 230, 232, 234, 235, 236, 237, 239, 242, 273, 287, 295, 297, 300, 322, 416, 460, 485, 493, 496, 503, 540, 543, 653, 662, 703, 733, 785, 863, 876, 901, 987, 994, 1008
  ]),
  lc_top_150: new Set([
    1, 2, 3, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 30, 33, 34, 35, 36, 38, 39, 42, 45, 46, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 61, 63, 64, 66, 67, 68, 69, 70, 71, 72, 73, 74, 76, 77, 79, 80, 82, 86, 88, 92, 97, 98, 100, 101, 102, 103, 104, 105, 106, 112, 114, 117, 120, 121, 122, 123, 124, 125, 127, 128, 129, 130, 133, 134, 135, 136, 137, 138, 139, 141, 146, 148, 149, 150, 151, 153, 155, 162, 167, 169, 172, 173, 188, 189, 190, 191, 198, 199, 200, 201, 202, 205, 207, 208, 209, 210, 211, 212, 215, 219, 221, 222, 224, 226, 228, 230, 236, 238, 242, 274, 289, 290, 295, 300, 322, 373, 380, 383, 392, 399, 427, 433, 452, 502, 530, 637, 909, 918
  ]),
  striver_cp_sheet: new Set([
    "263_A", "110_A", "281_A", "236_A", "112_A", "282_A", "158_A", "160_A", "69_A", "58_A", "96_A", "122_A", "479_A", "546_A", "617_A", "791_A", "977_A", "1030_A", "705_A", "136_A", "266_B", "59_A", "271_A", "467_A", "116_A", "41_A", "677_A", "734_A", "266_A", "61_A", "486_A", "200_B", "155_A", "144_A", "141_A", "443_A", "520_A", "785_A", "996_A", "231_A", "71_A", "4_A"
  ]),
  cf_a2oj_800: new Set([
    "263_A", "110_A", "281_A", "236_A", "112_A", "282_A", "158_A", "160_A", "69_A", "58_A", "96_A", "122_A", "479_A", "546_A", "617_A", "791_A", "977_A", "1030_A", "705_A", "136_A", "266_B", "59_A", "271_A", "467_A", "116_A", "41_A", "677_A", "734_A", "266_A", "61_A", "486_A", "200_B", "155_A", "144_A", "141_A", "443_A", "520_A", "785_A", "996_A", "231_A", "71_A", "4_A", "263_B", "339_A", "118_A", "131_A", "230_A", "469_A", "472_A", "581_A"
  ]),
  cf_a2oj_1200: new Set([
    "4_C", "489_C", "459_B", "25_B", "363_B", "368_B", "431_C", "580_C", "276_C", "466_C", "401_C", "339_C", "352_B", "279_B", "285_C", "166_A", "349_A", "149_A", "414_B", "217_A", "350_A", "347_B", "441_C", "371_C", "478_C", "385_C", "115_A", "103_B", "330_B", "265_B", "242_B", "377_A", "445_B", "339_D", "474_B", "489_B", "456_A", "451_B", "514_A", "514_B", "515_C", "519_B", "519_C", "520_B", "522_A", "525_A", "535_B", "538_B", "545_C", "545_D"
  ]),
  ac_typical90: new Set([
    "typical90_a", "typical90_b", "typical90_c", "typical90_d", "typical90_e", "typical90_f", "typical90_g", "typical90_h", "typical90_i", "typical90_j", "typical90_k", "typical90_l", "typical90_m", "typical90_n", "typical90_o", "typical90_p", "typical90_q", "typical90_r", "typical90_s", "typical90_t", "typical90_u", "typical90_v", "typical90_w", "typical90_x", "typical90_y", "typical90_z", "typical90_aa", "typical90_ab", "typical90_ac", "typical90_ad", "typical90_ae", "typical90_af", "typical90_ag", "typical90_ah", "typical90_ai", "typical90_aj", "typical90_ak", "typical90_al", "typical90_am", "typical90_an", "typical90_ao", "typical90_ap", "typical90_aq", "typical90_ar", "typical90_as", "typical90_at", "typical90_au", "typical90_av", "typical90_aw", "typical90_ax", "typical90_ay", "typical90_az", "typical90_ba", "typical90_bb", "typical90_bc", "typical90_bd", "typical90_be", "typical90_bf", "typical90_bg", "typical90_bh", "typical90_bi", "typical90_bj", "typical90_bk", "typical90_bl", "typical90_bm", "typical90_bn", "typical90_bo", "typical90_bp", "typical90_bq", "typical90_br", "typical90_bs", "typical90_bt", "typical90_bu", "typical90_bv", "typical90_bw", "typical90_bx", "typical90_by", "typical90_bz", "typical90_ca", "typical90_cb", "typical90_cc", "typical90_cd", "typical90_ce", "typical90_cf", "typical90_cg", "typical90_ch", "typical90_ci", "typical90_cj", "typical90_ck", "typical90_cl"
  ]),
  ac_edu_dp: new Set([
    "dp_a", "dp_b", "dp_c", "dp_d", "dp_e", "dp_f", "dp_g", "dp_h", "dp_i", "dp_j", "dp_k", "dp_l", "dp_m", "dp_n", "dp_o", "dp_p", "dp_q", "dp_r", "dp_s", "dp_t", "dp_u", "dp_v", "dp_w", "dp_x", "dp_y", "dp_z"
  ]),
  ac_beginner: new Set([
    "practice_1", "abc086_a", "abc081_a", "abc081_b", "abc087_b", "abc083_b", "abc088_b", "abc085_b", "abc085_c", "abc049_c", "abc086_c"
  ])
};

function setCuratedList(platform, listKey) {
  if (platform === "lc") {
    state.curatedList = state.curatedList === listKey ? null : listKey;
    updateCuratedPills("lc");
    applyFilters();
  } else if (platform === "cf") {
    state.cfCuratedList = state.cfCuratedList === listKey ? null : listKey;
    updateCuratedPills("cf");
    applyCFFilters();
  } else if (platform === "ac") {
    state.acCuratedList = state.acCuratedList === listKey ? null : listKey;
    updateCuratedPills("ac");
    applyACFilters();
  }
}

let cfTagDropdownOpen = false;

function toggleCFTagDropdown() {
  const dd = document.getElementById("cf-tag-dropdown");
  const btn = document.getElementById("cf-tag-filter-btn");
  if (!dd) return;
  const isOpen = dd.style.display === "block";
  closeAllDropdowns();
  if (!isOpen) {
    cfTagDropdownOpen = true;
    dd.style.display = "block";
    btn.classList.add("active");
    renderCFTagCheckboxList("");
    setTimeout(() => document.addEventListener("click", closeCFTagDropdownOutside, { once: true }), 0);
  }
}

function closeCFTagDropdownOutside(e) {
  const wrap = document.getElementById("cf-tag-filter-wrap");
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById("cf-tag-dropdown").style.display = "none";
    document.getElementById("cf-tag-filter-btn").classList.remove("active");
  } else {
    setTimeout(() => document.addEventListener("click", closeCFTagDropdownOutside, { once: true }), 0);
  }
}

function renderCFTagCheckboxList(search) {
  const list = document.getElementById("cf-tag-checkbox-list");
  if (!list) return;
  const allTags = new Set();
  Object.values(state.cfMeta).forEach(p => p.tags?.forEach(t => allTags.add(t)));
  const q = search.toLowerCase();
  const filtered = [...allTags].sort().filter(t => t.toLowerCase().includes(q));
  
  list.innerHTML = filtered.map(t => {
    const checked = state.cfFilters.tags.includes(t);
    return `<label class="company-checkbox-item ${checked ? 'checked' : ''}">
      <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleCFTagFilterCheckbox('${t.replace(/'/g, "\\'")}')" onclick="event.stopPropagation()">
      <span>${t}</span>
    </label>`;
  }).join("");
}

function toggleCFTagFilterCheckbox(tag) {
  const idx = state.cfFilters.tags.indexOf(tag);
  if (idx === -1) {
    state.cfFilters.tags.push(tag);
  } else {
    state.cfFilters.tags.splice(idx, 1);
  }

  const countEl = document.getElementById("cf-tag-filter-count");
  if (countEl) {
    countEl.textContent = state.cfFilters.tags.length;
    countEl.style.display = state.cfFilters.tags.length ? "inline-flex" : "none";
  }
  
  applyCFFilters();
  renderActiveCFTags();
}

function filterCFTagList(val) { renderCFTagCheckboxList(val); }
function clearCFTagFilters() { 
  state.cfFilters.tags = []; 
  
  const countEl = document.getElementById("cf-tag-filter-count");
  if (countEl) {
    countEl.textContent = "0";
    countEl.style.display = "none";
  }

  renderActiveCFTags(); 
  renderCFTagCheckboxList(""); 
  
  applyCFFilters(); 
}

function renderCuratedDropdown(platform) {
  const containerId = `${platform}-curated-container`;
  const container = document.getElementById(containerId);
  if (!container) return;

  const options = {
    lc: [
      ["", "All Problems"],
      ["blind75", "Blind 75"],
      ["neetcode150", "NeetCode 150"],
      ["striver_sde", "Striver SDE"],
      ["lc_top_150", "Top 150"],
    ],
    cf: [
      ["", "All Problems"],
      ["cf_a2oj_800", "A2OJ 800"],
      ["cf_a2oj_1200", "A2OJ 1200"],
      ["striver_cp_sheet", "Striver CP"],
    ],
    ac: [
      ["", "All Problems"],
      ["ac_typical90", "Typical 90"],
      ["ac_edu_dp", "Edu DP"],
      ["ac_beginner", "Beginner Series"],
    ],
  };

  const active =
    platform === "lc"
      ? state.curatedList
      : platform === "cf"
        ? state.cfCuratedList
        : state.acCuratedList;

  container.innerHTML = `
    <div class="curated-row">
      <span style="font-size:10px; color:var(--text-muted); font-weight:700; white-space:nowrap">📋 LIST:</span>
      <select onchange="setCuratedList('${platform}', this.value)" class="contest-filter-select" style="min-width:140px">
        ${options[platform].map(([val, label]) => `<option value="${val}" ${active === val ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </div>
  `;
}

function updateCuratedPills(platform) {
  const active =
    platform === "lc"
      ? state.curatedList
      : platform === "cf"
        ? state.cfCuratedList
        : state.acCuratedList;
  document
    .querySelectorAll(`.curated-pill[data-platform="${platform}"]`)
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.list === active);
    });
}

function renderCuratedRow(platform) {
  const pills =
    platform === "lc"
      ? [
          ["blind75", "Blind 75"],
          ["neetcode150", "NeetCode 150"],
        ]
      : platform === "cf"
        ? [
            ["cf_a2oj_800", "A2OJ 800"],
            ["cf_a2oj_1200", "A2OJ 1200"],
            ["striver_cp_sheet", "Striver CP"],
          ]
        : [
            ["ac_typical90", "Typical 90"],
            ["ac_edu_dp", "Edu DP"],
            ["ac_beginner", "Beginner Series"],
          ];
  const active =
    platform === "lc"
      ? state.curatedList
      : platform === "cf"
        ? state.cfCuratedList
        : state.acCuratedList;
  return `<div class="curated-row" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
    <span style="font-size:11px;color:var(--text-muted);line-height:28px;margin-right:2px;">📋 Curated:</span>
    ${pills.map(([key, label]) => `<button class="curated-pill${active === key ? " active" : ""}" data-platform="${platform}" data-list="${key}" onclick="setCuratedList('${platform}','${key}')">${label}</button>`).join("")}
  </div>`;
}

const state = {
  questions: [],
  filtered: [],
  solved: {},
  activity: {},
  bookmarks: {},
  notes: {},
  reviewData: {},
  user: null,
  lcUsername: null,
  lcUserInfo: null,
  lcSyncing: false,
  page: 1,
  allTags: [],
  filters: {
    search: "",
    difficulties: [],
    patterns: [],
    status: "all",
    starred: false,
    review: false,
  },
  sortCol: "id",
  sortDir: "asc",
  coverageExpanded: false,
  expandedRows: new Set(),
  curatedList: null,
  cfCuratedList: null,
  acCuratedList: null,
  activePlatform: "lc",
  cfMeta: {},
  cfSolved: {},
  cfActivity: {},
  cfBookmarks: {},
  cfNotes: {},
  cfReviewData: {},
  cfUsername: null,
  cfUserInfo: null,
  cfFilters: {
    search: "",
    minRating: 800,
    maxRating: 3500,
    tags: [],
    status: "all",
    starred: false,
    review: false,
  },
  cfPage: 1,
  cfFiltered: [],
  acMeta: {},
  acSolved: {},
  acActivity: {},
  acBookmarks: {},
  acNotes: {},
  acReviewData: {},
  acUsername: null,
  acUserInfo: null,
  acFilters: {
    search: "",
    minDiff: 0,
    maxDiff: 4000,
    status: "all",
    starred: false,
    review: false,
  },
  acPage: 1,
  acFiltered: [],
  interviewDate: null,
  compareRival: null,
  nextContestData: null,
};

const PAGES = ["tracker", "profile", "insights", "contests"];

function activatePage(name) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(`page-${name}`)?.classList.add("active");
  document.getElementById(`nav-${name}`)?.classList.add("active");
}

function showPage(name) {
  activatePage(name);
  const sub =
    name === "profile"
      ? state.profilePlatform || "lc"
      : name === "insights"
        ? state.insightsPlatform || "lc"
        : name === "tracker"
          ? state.activePlatform || "lc"
          : name === "contests"
            ? contestsState.activePlatform || "cf"
            : null;
  window.location.hash = sub ? `${name}/${sub}` : name;
  if (name === "profile") renderProfilePage();

  if (name === "insights") {
    const loggedIn = !!state.user;
    const hasHandle = !!(
      state.lcUsername ||
      state.cfUsername ||
      state.acUsername
    );
    document.getElementById("insights-guest").style.display = !loggedIn
      ? ""
      : "none";
    document.getElementById("insights-no-handle").style.display =
      loggedIn && !hasHandle ? "" : "none";
    document.getElementById("insights-content").style.display =
      loggedIn && hasHandle ? "" : "none";
    if (loggedIn && hasHandle) renderInsightsPage();
  }
  if (name === "contests") {
    const loggedIn = !!state.user;
    const hasHandle = !!(state.cfUsername || state.acUsername);
    document.getElementById("contests-guest").style.display = !loggedIn
      ? ""
      : "none";
    document.getElementById("contests-no-handle").style.display =
      loggedIn && !hasHandle ? "" : "none";
    document.getElementById("contests-content").style.display =
      loggedIn && hasHandle ? "" : "none";
    if (loggedIn && hasHandle) initContestsPage();
  }
}

function handleHashChange() {
  const raw = window.location.hash.replace("#", "");
  const [page, sub] = raw.split("/");
  if (!PAGES.includes(page)) return;
  activatePage(page);
  if (page === "profile") renderProfilePage();

  if (page === "insights") {
    const loggedIn = !!state.user;
    const hasHandle = !!(
      state.lcUsername ||
      state.cfUsername ||
      state.acUsername
    );
    document.getElementById("insights-guest").style.display = !loggedIn
      ? ""
      : "none";
    document.getElementById("insights-no-handle").style.display =
      loggedIn && !hasHandle ? "" : "none";
    document.getElementById("insights-content").style.display =
      loggedIn && hasHandle ? "" : "none";
    if (loggedIn && hasHandle) renderInsightsPage();
  }

  if (page === "contests") {
    const loggedIn = !!state.user;
    const hasHandle = !!(state.cfUsername || state.acUsername);
    document.getElementById("contests-guest").style.display = !loggedIn
      ? ""
      : "none";
    document.getElementById("contests-no-handle").style.display =
      loggedIn && !hasHandle ? "" : "none";
    document.getElementById("contests-content").style.display =
      loggedIn && hasHandle ? "" : "none";
    if (loggedIn && hasHandle) initContestsPage();
  }

  if (sub) {
    if (page === "profile") renderProfilePlatformTabs(sub);
    else if (page === "insights") renderInsightsPlatformTabs(sub);
    else if (page === "tracker") switchPlatform(sub);
    else if (page === "contests") switchContestPlatform(sub);
  }
}

function initRouting() {
  const raw = window.location.hash.replace("#", "") || "tracker";
  const [page, sub] = raw.split("/");
  const validPage = PAGES.includes(page) ? page : "tracker";
  activatePage(validPage);
  if (page === "profile") renderProfilePage();
  if (page === "insights") renderInsightsPage();
  if (page === "contests") initContestsPage();
  if (sub) {
    if (page === "profile") renderProfilePlatformTabs(sub);
    else if (page === "insights") renderInsightsPlatformTabs(sub);
    else if (page === "tracker") switchPlatform(sub);
    else if (page === "contests") switchContestPlatform(sub);
  }
}

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

let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _supabase;
}

function loginWithGitHub() {
  getSupabase().auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

async function logout() {
  await getSupabase().auth.signOut();
  state.user = null;
  state.lcUsername = null;
  state.cfUsername = null;
  state.acUsername = null;
  state.solved = {};
  state.activity = {};
  state.bookmarks = {};
  state.notes = {};
  state.reviewData = {};
  state.cfSolved = {};
  state.cfActivity = {};
  state.cfBookmarks = {};
  state.cfNotes = {};
  state.cfReviewData = {};
  state.cfUserInfo = null;
  state.acSolved = {};
  state.acActivity = {};
  state.acBookmarks = {};
  state.acNotes = {};
  state.acReviewData = {};
  state.acUserInfo = null;
  localStorage.removeItem("leet_local");
  localStorage.removeItem("lc_last_sync");
  localStorage.removeItem("cf_rivals");
  localStorage.removeItem("ac_rivals");
  renderAuthArea();
  renderProfilePage();
  const cfConnectArea = document.getElementById("cf-connect-area");
  const cfConnectedArea = document.getElementById("cf-connected-area");
  if (cfConnectArea) cfConnectArea.style.display = "";
  if (cfConnectedArea) {
    cfConnectedArea.style.display = "none";
    cfConnectedArea.innerHTML = "";
  }
  renderCFStats();
  applyCFFilters();
  const acConnectArea = document.getElementById("ac-connect-area");
  const acConnectedArea = document.getElementById("ac-connected-area");
  if (acConnectArea) acConnectArea.style.display = "";
  if (acConnectedArea) {
    acConnectedArea.style.display = "none";
    acConnectedArea.innerHTML = "";
  }
  renderACStats();
  applyACFilters();
  renderLCHeader();
}

function buildProgressPayload() {
  return {
    user_id: state.user?.id,
    lc_username: state.lcUsername || null,
    cf_username: state.cfUsername || null,
    ac_username: state.acUsername || null,
    solved: state.solved,
    activity: state.activity,
    bookmarks: state.bookmarks,
    notes: state.notes,
    review_data: state.reviewData,
    cf_solved: state.cfSolved,
    cf_activity: state.cfActivity,
    cf_bookmarks: state.cfBookmarks,
    cf_notes: state.cfNotes,
    cf_review_data: state.cfReviewData,
    cf_user_info: state.cfUserInfo || null,
    ac_solved: state.acSolved,
    ac_activity: state.acActivity,
    ac_bookmarks: state.acBookmarks,
    ac_notes: state.acNotes,
    ac_review_data: state.acReviewData,
    ac_user_info: state.acUserInfo || null,
    lc_last_sync: localStorage.getItem("lc_last_sync") || null,
    cf_rivals: JSON.parse(localStorage.getItem("cf_rivals") || "[]"),
    ac_rivals: JSON.parse(localStorage.getItem("ac_rivals") || "[]"),
    interview_date: state.interviewDate || null,
    updated_at: new Date().toISOString(),
  };
}

function applyProgressData(data) {
  if (!data) return;

  const oldHandles = {
    lc: state.lcUsername,
    cf: state.cfUsername,
    ac: state.acUsername,
  };

  const mergeMaps = (local, remote) => {
    const merged = { ...remote };
    for (const id in local) {
      if (!merged[id] || local[id] > merged[id]) {
        merged[id] = local[id];
      }
    }
    return merged;
  };

  state.solved = mergeMaps(state.solved, data.solved || {});
  state.cfSolved = mergeMaps(state.cfSolved, data.cf_solved || {});
  state.acSolved = mergeMaps(state.acSolved, data.ac_solved || {});

  const rebuildActivity = (solvedMap) => {
    const activityMap = {};
    Object.values(solvedMap).forEach((dateStr) => {
      if (dateStr && dateStr !== "null") {
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });
    return activityMap;
  };

  state.activity = rebuildActivity(state.solved);
  state.cfActivity = rebuildActivity(state.cfSolved);
  state.acActivity = rebuildActivity(state.acSolved);

  state.bookmarks = data.bookmarks || {};
  state.notes = data.notes || {};
  state.reviewData = data.review_data || {};
  state.cfBookmarks = data.cf_bookmarks || {};
  state.cfNotes = data.cf_notes || {};
  state.cfReviewData = data.cf_review_data || {};
  state.cfUserInfo = data.cf_user_info || null;
  state.acBookmarks = data.ac_bookmarks || {};
  state.acNotes = data.ac_notes || {};
  state.acReviewData = data.ac_review_data || {};
  state.acUserInfo = data.ac_user_info || null;
  state.interviewDate = data.interview_date || null;

  if (data.lc_username) state.lcUsername = data.lc_username;
  if (data.cf_username) state.cfUsername = data.cf_username;
  if (data.ac_username) state.acUsername = data.ac_username;

  if (state.lcUsername && !oldHandles.lc && !state.lcSyncing) {
    syncLeetCode(true);
  }
  if (state.cfUsername && !oldHandles.cf) {
    syncCFSilent();
  }
  if (state.acUsername && !oldHandles.ac) {
    syncACSilent();
  }

  if (typeof refreshDataDependentPages === "function") {
    refreshDataDependentPages();
  }
}

async function loadProgressFromSupabase() {
  if (!state.user) return;
  const { data, error } = await getSupabase()
    .from("users_progress")
    .select("*")
    .eq("user_id", state.user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    console.warn("[supabase] load error:", error.message);
    return;
  }
  if (data) applyProgressData(data);
}

let _saveTimer = null;
async function saveProgress() {
  const payload = buildProgressPayload();
  try {
    localStorage.setItem("leet_local", JSON.stringify(payload));
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      showToast(
        "⚠️ Browser storage full! Please export data and delete old notes.",
        "error",
      );
    }
  }
  if (!state.user) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      const { error } = await getSupabase()
        .from("users_progress")
        .upsert(payload, { onConflict: "user_id" });
    } catch (err) {
      console.warn("Supabase background save failed");
    }
  }, 1000);
}

function loadLocalProgress() {
  try {
    const raw = localStorage.getItem("leet_local");
    if (raw) applyProgressData(JSON.parse(raw));
  } catch (_) {}
  renderCountdown();
}

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

function saveLCUsernameFromTracker() {
  const input = document.getElementById("lc-username-input-tracker");
  const username = input?.value.trim();
  if (!username) {
    showToast("❌ Please enter a username", "error");
    return;
  }
  document.getElementById("lc-username-input").value = username;
  saveLCUsername();
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

  state.lcUserInfo = {
    username,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=56&background=f89f1b&color=fff&rounded=true`,
    ranking: null,
    solvedCount: null,
  };

  document.getElementById("lc-connect-area").style.display = "none";
  document.getElementById("lc-connected-area").style.display = "";
  renderLCHeader();
  renderAuthArea();
  applyFilters();
  saveProgress();
  fetchLCUserInfo();
  showToast("🔗 Connected! Fetching recent activity...", "info");
  await syncLeetCode(true);
  const solvedCount = Object.keys(state.solved).length;

  setTimeout(() => {
    openFullSyncModal();

    const statusEl = document.getElementById("full-sync-status");
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="background:rgba(200, 168, 75, 0.1); color:var(--accent); padding:12px; border-radius:8px; margin-bottom:12px; font-size:12px; border:1px solid var(--accent-dim); line-height:1.5">
          <strong>✅ Found ${solvedCount} recent solves!</strong><br>
          Note: LeetCode only shows your last ~20 problems publicly. To import your 
          <strong>entire history</strong>, please provide your session cookie below.
        </div>`;
    }
  }, 1500);
}

async function disconnectLC() {
  state.lcUsername = null;
  state.lcUserInfo = null;
  state.solved = {};
  state.activity = {};
  localStorage.removeItem("lc_username");
  await saveProgress();

  document.getElementById("lc-connect-area").style.display = "";
  const connectedArea = document.getElementById("lc-connected-area");
  connectedArea.style.display = "none";
  connectedArea.innerHTML = "";

  applyFilters();
  renderStats();
  renderAuthArea();
  renderProfilePage();
  showToast("LeetCode disconnected");
}

async function fetchLCUserInfo() {
  if (!state.lcUsername) return;
  try {
    const res = await fetch(
      `/.netlify/functions/lc-sync?username=${encodeURIComponent(state.lcUsername)}`,
    );
    const data = await res.json();
    state.lcUserInfo = {
      username: state.lcUsername,
      avatar:
        data.userAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(state.lcUsername)}&size=56&background=f89f1b&color=fff&rounded=true`,
      ranking: data.ranking || null,
      solvedCount: Object.keys(state.solved).length,
    };
  } catch (_) {
    state.lcUserInfo = {
      username: state.lcUsername,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(state.lcUsername)}&size=56&background=f89f1b&color=fff&rounded=true`,
      ranking: null,
      solvedCount: null,
    };
  }
  renderProfileLC();
  renderLCHeader();
}

function openFullSyncModal() {
  document.getElementById("full-sync-session-input").value = "";

  const statusEl = document.getElementById("full-sync-status");
  if (statusEl && !statusEl.innerHTML.includes("Found")) {
    statusEl.textContent = "";
  }

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

    const slugMap = new Map();
    submissions.forEach((s) => {
      const slug = s.titleSlug.toLowerCase();
      const existing = slugMap.get(slug);
      if (!existing || s.timestamp > existing) slugMap.set(slug, s.timestamp);
    });

    const slugToId = new Map();
    state.questions.forEach((q) => {
      if (q.slug) slugToId.set(q.slug.toLowerCase(), q.id);
    });

    statusEl.textContent = `✅ Got ${slugMap.size} unique solved problems from LeetCode. Matching with tracker…`;

    const newSolved = {};
    const newActivity = {};
    let matched = 0;

    slugMap.forEach((timestamp, slug) => {
      const id = slugToId.get(slug);
      if (!id) return;
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
      if (!silent)
        showToast(
          "⚠️ No recent submissions found. Make sure your profile is public.",
          "error",
        );
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
    state.questions.forEach((q) => {
      if (q.slug) slugToId2.set(q.slug.toLowerCase(), q.id);
    });

    let newlySynced = 0;
    slugMap2.forEach((timestamp, slug) => {
      const id = slugToId2.get(slug);
      if (!id) return;
      const newDate = dateStr(new Date(parseInt(timestamp) * 1000));
      const existingDate = state.solved[id];
      if (!existingDate || newDate > existingDate) {
        if (existingDate) {
          state.activity[existingDate] = Math.max(0, (state.activity[existingDate] || 1) - 1);
        }
        state.solved[id] = newDate;
        state.activity[newDate] = (state.activity[newDate] || 0) + 1;
        initSM2OnSolve(id);
        newlySynced++;
      }
    });

    saveProgress();
    renderTable();
    renderStats();
    refreshDataDependentPages();
    if (!silent)
      showToast(
        `✅ Synced! ${newlySynced} new solve${newlySynced !== 1 ? "s" : ""} found. Total: ${Object.keys(state.solved).length}`,
      );
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

async function syncAll() {
  const lcConnected = !!state.lcUsername;
  const cfConnected = !!state.cfUsername;
  const acConnected = !!state.acUsername;
  if (!lcConnected && !cfConnected && !acConnected) {
    openLCModal();
    return;
  }

  const btn = document.getElementById("lc-sync-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Syncing…";
  }

  const results = await Promise.allSettled([
    lcConnected ? syncLeetCode(true) : Promise.resolve(null),
    cfConnected ? syncCFSilent() : Promise.resolve(null),
    acConnected ? syncACSilent() : Promise.resolve(null),
  ]);

  if (btn) {
    btn.disabled = false;
    btn.textContent = "⟳ Sync";
  }

  const lcResult = lcConnected ? results[0] : null;
  const cfResult = cfConnected ? results[1] : null;
  const acResult = acConnected ? results[2] : null;

  const parts = [];
  if (lcResult?.value?.ok)
    parts.push(`LC: +${lcResult.value.newlySynced ?? 0} solves`);
  else if (lcConnected && lcResult?.value?.ok === false)
    parts.push("LC: up to date");
  if (cfResult?.value?.ok) parts.push(`CF: synced`);
  else if (cfConnected && cfResult?.value?.ok === false)
    parts.push("CF: failed");
  if (acResult?.value?.ok) parts.push(`AC: synced`);
  else if (acConnected && acResult?.value?.ok === false)
    parts.push("AC: failed");

  showToast(`✅ ${parts.join(" · ") || "Sync complete"}`);
}

async function syncCFSilent() {
  if (!state.cfUsername) return { ok: false };
  try {
    const infoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${state.cfUsername}`,
    );
    const infoData = await infoRes.json();
    if (infoData.status !== "OK") throw new Error("CF user not found");
    state.cfUserInfo = infoData.result[0];

    const statusRes = await fetch(
      `https://codeforces.com/api/user.status?handle=${state.cfUsername}&from=1&count=10000`,
    );
    const statusData = await statusRes.json();
    if (statusData.status !== "OK")
      throw new Error("Could not fetch CF submissions");

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

function calcStreaks() {
  const merged = {};

  [state.activity, state.cfActivity, state.acActivity].forEach((map) => {
    if (map) {
      Object.entries(map).forEach(([d, v]) => {
        if (v > 0) merged[d] = (merged[d] || 0) + v;
      });
    }
  });

  const days = Object.keys(merged).sort();
  if (!days.length) return { current: 0, longest: 0, totalDays: 0 };

  const daySet = new Set(days);
  const today = dateStr(new Date());
  const yesterday = dateStr(new Date(Date.now() - 86400000));

  let longest = 0,
    currentRun = 0;
  let prevDate = null;
  days.forEach((d) => {
    if (prevDate) {
      const diff = (new Date(d) - new Date(prevDate)) / 86400000;
      if (diff === 1) currentRun++;
      else currentRun = 1;
    } else {
      currentRun = 1;
    }
    longest = Math.max(longest, currentRun);
    prevDate = d;
  });

  let current = 0;
  let cursor = daySet.has(today) ? new Date() : new Date(Date.now() - 86400000);

  while (daySet.has(dateStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest, totalDays: daySet.size };
}
function dateStr(d) {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function addCFTagFilter(tag) {
  if (!state.cfFilters.tags.includes(tag)) {
    state.cfFilters.tags.push(tag);
  }
  renderCF();
}

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

async function loadLCProblems() {
  try {
    const res = await fetch("data/leetcode-meta.json");
    const meta = await res.json();

    setTimeout(() => {
      state.questions = Object.values(meta)
  .sort((a, b) => a.id - b.id)
  .map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    acceptance: p.acceptance,
    tags: p.tags || [],
    isPremium: p.isPremium,
    solved: false,
    link: `https://leetcode.com/problems/${p.slug}/`,
  }));

      const tagSet = new Set();
      for (const q of state.questions) q.tags.forEach((t) => tagSet.add(t));
      state.allTags = [...tagSet].sort();

      renderFilterUI();
      applyFilters();
      renderStats();
    }, 0);
  } catch (err) {
    console.error("Failed to load LC problems:", err);
  }
}

function openCFNoteModal(key, name) {
  document.getElementById("cf-note-modal-title").textContent =
    name || "Problem";
  document.getElementById("cf-note-textarea").value = state.cfNotes[key] || "";
  document.getElementById("cf-note-modal-key").value = key;
  document.getElementById("cf-note-modal-overlay").style.display = "flex";
  document.getElementById("cf-note-textarea").focus();
}
function closeCFNoteModal() {
  document.getElementById("cf-note-modal-overlay").style.display = "none";
}
async function saveCFNote() {
  const key = document.getElementById("cf-note-modal-key").value;
  const text = document.getElementById("cf-note-textarea").value.trim();
  if (text) state.cfNotes[key] = text;
  else delete state.cfNotes[key];
  closeCFNoteModal();
  renderCFTable();
  saveProgress();
}

function openACNoteModal(id, title) {
  document.getElementById("ac-note-modal-title").textContent =
    title || "Problem";
  document.getElementById("ac-note-textarea").value = state.acNotes[id] || "";
  document.getElementById("ac-note-modal-key").value = id;
  document.getElementById("ac-note-modal-overlay").style.display = "flex";
  document.getElementById("ac-note-textarea").focus();
}
function closeACNoteModal() {
  document.getElementById("ac-note-modal-overlay").style.display = "none";
}
async function saveACNote() {
  const id = document.getElementById("ac-note-modal-key").value;
  const text = document.getElementById("ac-note-textarea").value.trim();
  if (text) state.acNotes[id] = text;
  else delete state.acNotes[id];
  closeACNoteModal();
  renderACTable();
  saveProgress();
}

function refreshDataDependentPages() {
  const activePage = document.querySelector(".page.active")?.id;
  if (activePage === "page-insights") showPage("insights");
  if (activePage === "page-profile") renderProfilePage();
  if (activePage === "page-contests") showPage("contests");
  renderStats();
}

function openRandomPicker() {
  document.getElementById("random-modal-overlay").style.display = "flex";
  state.randomPlatform = state.activePlatform || "lc";
  updateRandomPickerTabs();
  pickRandom();
}
function closeRandomPicker() {
  document.getElementById("random-modal-overlay").style.display = "none";
  state.randomPickCache = {};
}
function switchRandomPlatform(platform) {
  state.randomPlatform = platform;
  updateRandomPickerTabs();
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
  const acBtn = document.getElementById("random-tab-ac");
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
  if (acBtn) {
    const active = state.randomPlatform === "ac";
    acBtn.style.color = active ? "var(--accent)" : "var(--text-muted)";
    acBtn.style.borderBottomColor = active ? "var(--accent)" : "transparent";
  }
}
function pickRandom() {
  const platform = state.randomPlatform || "lc";
  const content = document.getElementById("random-problem-content");
  if (!state.randomPickCache) state.randomPickCache = {};
  if (platform === "cf") {
    pickRandomCF(content);
  } else if (platform === "ac") {
    pickRandomAC(content);
  } else {
    pickRandomLC(content);
  }
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
  const tags = (q.tags || []).slice(0, 3);
  const diffCls = q.difficulty.toLowerCase();
  content.innerHTML = `
    <div class="random-problem-card">
      <div class="random-problem-meta">
        <span class="diff-badge ${diffCls}">${q.difficulty}</span>
        <span class="random-problem-id">#${q.id}</span>
        ${state.solved[q.id] ? '<span class="random-solved-badge">✓ Solved</span>' : ""}
      </div>
      <div class="random-problem-title">${q.title}</div>
      ${tags.length ? `<div class="random-problem-tags">${tags.map((t) => `<span class="pattern-tag">${t}</span>`).join("")}</div>` : ""}
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
  document
    .getElementById("platform-tab-ac")
    .classList.toggle("active", platform === "ac");
  document.getElementById("lc-tracker-content").style.display =
    platform === "lc" ? "" : "none";
  document.getElementById("cf-tracker-content").style.display =
    platform === "cf" ? "" : "none";
  document.getElementById("ac-tracker-content").style.display =
    platform === "ac" ? "" : "none";
  if (platform === "cf") renderCFTable();
  if (platform === "ac") renderACTable();
  if (platform === "lc") renderLCHeader();
  window.location.hash = `tracker/${platform}`;
  renderCuratedDropdown(platform);
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
  const { search, minRating, maxRating, tags, status, starred, review } =
    state.cfFilters;
  const userRating = state.cfUserInfo?.rating || 0;
  const sq = search.toLowerCase();

  state.cfFiltered = Object.values(state.cfMeta).filter((p) => {
    if (!p.rating) {
      if (minRating > 800) return false;
    } else {
      if (p.rating < minRating || p.rating > maxRating) return false;
    }
    if (sq) {
      const nameMatch = p.name.toLowerCase().includes(sq);
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(sq));
      const contestIdMatch = String(p.contestId).includes(sq);
      const indexMatch = p.index.toLowerCase().includes(sq);
      const combinedMatch = `${p.contestId}${p.index}`.toLowerCase().includes(sq);
    
      if (!nameMatch && !tagMatch && !contestIdMatch && !indexMatch && !combinedMatch) {
        return false;
      }
    }
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
    if (state.cfCuratedList) {
      const probId = `${p.contestId}_${p.index}`; 
    if (!CURATED_LISTS[state.cfCuratedList]?.has(probId)) return false;
    }
    return true;
  });

  if (userRating) {
    const target = userRating + 200;
    state.cfFiltered.sort((a, b) => {
      const aKey = cfProblemKey(a.contestId, a.index);
      const bKey = cfProblemKey(b.contestId, b.index);
      const aSolved = !!state.cfSolved[aKey];
      const bSolved = !!state.cfSolved[bKey];
      if (aSolved !== bSolved) return aSolved ? 1 : -1;
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
  const total = ratedTotal;
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

  const pct = total ? Math.round((solved / total) * 100) : 0;
  const fill = document.getElementById("cf-progress-bar-fill");
  if (fill) fill.style.width = pct + "%";
}

function renderCFTable() {
  const tbody = document.getElementById("cf-tbody");
  if (!tbody) return;
  const start = (state.cfPage - 1) * ITEMS_PER_PAGE;
  const page = state.cfFiltered.slice(start, start + ITEMS_PER_PAGE);

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No problems match your filters.</td></tr>`;
    renderCFPagination();
    return;
  }

  tbody.innerHTML = page
    .map((p) => {
      const key = cfProblemKey(p.contestId, p.index);
      const solved = !!state.cfSolved[key];
      const starred = !!state.cfBookmarks[key];
      const hasNote = !!state.cfNotes[key];
      const safeCFName = escHtml(p.name).replace(/'/g, "&#39;");
      const reviewDue = solved && isCFReviewDue(key);
      const solveDate = state.cfSolved[key] || "";
      const link = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
      const contestLink = `https://codeforces.com/contest/${p.contestId}`;
      const ratingColor = p.rating
        ? cfRatingColor(p.rating)
        : "var(--text-muted)";
      const ratingDisplay = p.rating
        ? `<span style="color:${ratingColor};font-weight:600">${p.rating}</span>`
        : `<span style="color:var(--text-muted);font-size:11px">Unrated</span>`;
      const tags = (p.tags || [])
        .slice(0, 3)
        .map(
          (t) =>
            `<span class="pattern-tag-sm" style="cursor:pointer" onclick="toggleCFTagFilter('${t.replace(/'/g, "\\'")}')" title="Filter by ${t}">${t}</span>`,
        )
        .join("");
      const solvedCount = p.solvedCount
        ? `${p.solvedCount >= 1000 ? (p.solvedCount / 1000).toFixed(1) + "k" : p.solvedCount}`
        : "—";
        return `<tr class="${solved ? "solved" : ""}">
        <td class="col-status">
          ${
            solved
              ? `<span class="solved-icon" title="Solved${solveDate ? " · " + solveDate : ""}">✓</span>`
              : `<span class="unsolved-icon">○</span>`
          }
        </td>
        <td class="col-title">
          <div class="title-cell-content">
            <button class="star-btn inline-star ${starred ? "starred" : ""}" onclick="toggleCFBookmark('${key}')" title="Bookmark">${starred ? "★" : "☆"}</button>
            ${
              solved
                ? `<button class="note-btn-inline ${hasNote ? "has-note" : ""}" 
              onclick="openCFNoteModal('${key}', '${safeCFName}')" 
              title="${hasNote ? "Edit note" : "Add note"}">${hasNote ? "📝" : "✎"}</button>`
                : ""
            }
            <a href="${link}" target="_blank" rel="noopener" class="cf-problem-link">
              <span style="color:var(--text-muted);margin-right:4px;font-size:12px">${p.index}. </span>${p.name}
            </a>
            ${reviewDue ? '<span class="review-badge-inline" title="Due for SM2 review">↺</span>' : ""}
            ${tags ? `<span class="row-tags">${tags}</span>` : ""}
          </div>
        </td>
        <td class="col-diff">${ratingDisplay}</td>
        <td class="col-contest">
          <a href="${contestLink}" target="_blank" rel="noopener" class="cf-contest-link">${p.contestId}</a>
        </td>
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
    intervalIdx: 0,
    reps: 0,
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

  clearContestCache("cfHistory");
  clearContestCache(`cfHistory_${handle}`);
  contestsState.cfHistoryLoaded = false;

  const btn = document.getElementById("cf-sync-btn");
  btn.textContent = "Syncing…";
  btn.disabled = true;
  try {
    const infoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`,
    );
    const infoData = await infoRes.json();
    if (infoData.status !== "OK") throw new Error("User not found");
    state.cfUserInfo = infoData.result[0];
    state.cfUsername = handle;
    localStorage.setItem("cf_username", handle);

    const statusRes = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`,
    );
    const statusData = await statusRes.json();
    if (statusData.status !== "OK")
      throw new Error("Could not fetch submissions");

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
    await saveProgress();
    applyCFFilters();
    renderProfilePage();
    showToast(
      `✅ CF synced! ${Object.keys(newSolved).length} problems solved.`,
    );
    document.getElementById("cf-connect-area").style.display = "none";
    document.getElementById("cf-connected-area").style.display = "";
    renderCFConnectedArea();
    refreshDataDependentPages();
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
  const handleColor = rating ? cfRatingColor(rating) : "#a0a0a0";

  const isDefaultCFAvatar = (url) => !url || url.includes("/no-");
  const avatarUrl = !isDefaultCFAvatar(u.titlePhoto)
    ? u.titlePhoto.startsWith("http")
      ? u.titlePhoto
      : `https:${u.titlePhoto}`
    : !isDefaultCFAvatar(u.avatar)
      ? u.avatar.startsWith("http")
        ? u.avatar
        : `https:${u.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.handle)}&size=56&background=random&rounded=true`;

  const avatar = `<img src="${avatarUrl}"
    style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid ${handleColor}60;margin-right:8px"
    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.handle)}&size=56&background=random&rounded=true'">`;

  const ratingBadge = rating
    ? `<span class="cf-rank-badge" style="color:${cfRatingColor(rating)}">${cfRatingLabel(rating)} · ${rating}</span>`
    : `<span class="cf-rank-badge" style="color:#a0a0a0">Unrated</span>`;

  const maxRatingBadge =
    u.maxRating && u.maxRating !== rating
      ? `<span style="font-size:11px;color:var(--text-muted)">peak: <span style="color:${cfRatingColor(u.maxRating)}">${u.maxRating}</span></span>`
      : "";

  const solved = Object.keys(state.cfSolved).length;
  const solvedBadge = solved
    ? `<span class="cf-rank-badge" style="color:var(--accent)">${solved} Solved</span>`
    : "";

  el.innerHTML = `
    <div class="cf-user-badge">
      ${avatar}
      <span style="font-weight:700;color:${handleColor}">${u.handle}</span>
      ${ratingBadge}
      ${maxRatingBadge}
      ${solvedBadge}
      <button class="btn-outline-danger" style="margin-left:auto;padding:4px 10px;font-size:11px" onclick="disconnectCF()">Disconnect</button>
    </div>`;
}

function renderLCHeader() {
  const connectArea = document.getElementById("lc-connect-area");
  const area = document.getElementById("lc-connected-area");
  if (!connectArea || !area) return;
  if (!state.lcUsername) {
    connectArea.style.display = "";
    area.style.display = "none";
    area.innerHTML = "";
    return;
  }
  connectArea.style.display = "none";
  area.style.display = "";

  const info = state.lcUserInfo || {};
  const avatarUrl =
    info.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(state.lcUsername)}&size=56&background=f89f1b&color=fff&rounded=true`;
  const avatar = `<img src="${avatarUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #f89f1b60;margin-right:8px;vertical-align:middle" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(state.lcUsername)}&size=56&background=f89f1b&color=fff&rounded=true'">`;
  const ranking = info.ranking
    ? `<span class="cf-rank-badge" style="color:var(--text-muted)">Rank #${Number(info.ranking).toLocaleString()}</span>`
    : "";
  const solvedCount = Object.keys(state.solved).length;
  const solved =
    solvedCount > 0
      ? `<span class="cf-rank-badge" style="color:var(--accent)">${solvedCount} Solved</span>`
      : "";

  area.innerHTML = `
    <div class="cf-user-badge">
      ${avatar}
      <span style="font-weight:700;color:#f89f1b">${info.username || state.lcUsername}</span>
      ${ranking}
      ${solved}
      <button class="btn-outline-danger" style="margin-left:auto;padding:4px 10px;font-size:11px" onclick="disconnectLC()">Disconnect</button>
    </div>`;
}

async function disconnectCF() {
  state.cfUsername = null;
  state.cfUserInfo = null;
  state.cfSolved = {};
  state.cfActivity = {};

  contestsState.cfContestHistory = [];
  contestsState.cfHistoryFiltered = [];
  contestsState.cfHistoryLoaded = false;

  localStorage.removeItem("cf_username");
  clearContestCache("cfHistory");
  clearContestCache(`cfHistory_${state.cfUsername}`);

  await saveProgress();

  document.getElementById("cf-connect-area").style.display = "";
  const connectedArea = document.getElementById("cf-connected-area");
  connectedArea.style.display = "none";
  connectedArea.innerHTML = "";

  applyCFFilters();
  renderProfilePage();

  const ap = document.querySelector(".page.active")?.id?.replace("page-", "");
  if (ap === "insights" || ap === "contests") showPage(ap);

  showToast("Codeforces disconnected and cache cleared.");
}

async function initCF() {
  await loadCFMeta();
  const savedHandle = state.cfUsername || localStorage.getItem("cf_username");
  if (savedHandle && !state.cfUsername) {
    state.cfUsername = savedHandle;
  }
  if (state.cfUserInfo?.rating) {
    const r = state.cfUserInfo.rating;
    state.cfFilters.minRating = Math.max(800, r - 300);
    state.cfFilters.maxRating = Math.min(3500, r + 500);
  }
  applyCFFilters();
  renderCFFilterUI();
  updateCFClearBtn();
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
    const connectArea = document.getElementById("cf-connect-area");
    const connectedArea = document.getElementById("cf-connected-area");
    if (connectArea) connectArea.style.display = "none";
    if (connectedArea) connectedArea.style.display = "";
    renderCFConnectedArea();
    renderCFStats();
  }
}

function renderCFNotesSearch(query = "") {
  const el = document.getElementById("cf-notes-search-results");
  if (!el) return;
  const q = query.toLowerCase().trim();
  const results = Object.entries(state.cfNotes)
    .map(([key, note]) => ({ key, note, meta: state.cfMeta[key] }))
    .filter(
      (x) =>
        x.meta &&
        (!q ||
          x.note.toLowerCase().includes(q) ||
          x.meta.name.toLowerCase().includes(q)),
    )
    .slice(0, 20);

  if (!results.length) {
    el.innerHTML = `<div class="notes-no-results">No matches found.</div>`;
    return;
  }
  el.innerHTML = results
    .map(({ key, note, meta }) => {
      const color = cfRatingColor(meta.rating);
      return `<div class="note-result-item" onclick="openCFNoteModal('${key}', '${meta.name.replace(/'/g, "\\'")}')">
      <div class="note-result-header">
        <span class="diff-badge sm" style="color:${color}">${meta.rating || "Unrated"}</span>
        <span class="note-result-title">${meta.name}</span>
      </div>
      <div class="note-result-body">${note}</div>
    </div>`;
    })
    .join("");
}

function renderACNotesSearch(query = "") {
  const el = document.getElementById("ac-notes-search-results");
  if (!el) return;
  const q = query.toLowerCase().trim();
  const results = Object.entries(state.acNotes)
    .map(([id, note]) => ({ id, note, meta: state.acMeta[id] }))
    .filter(
      (x) =>
        x.meta &&
        (!q ||
          x.note.toLowerCase().includes(q) ||
          x.meta.title.toLowerCase().includes(q)),
    )
    .slice(0, 20);

  if (!results.length) {
    el.innerHTML = `<div class="notes-no-results">No matches found.</div>`;
    return;
  }
  el.innerHTML = results
    .map(({ id, note, meta }) => {
      const color = acDiffColor(meta.difficulty);
      return `<div class="note-result-item" onclick="openACNoteModal('${id}', '${meta.title.replace(/'/g, "\\'")}')">
      <div class="note-result-header">
        <span class="diff-badge sm" style="color:${color}">${meta.difficulty || "Unrated"}</span>
        <span class="note-result-title">${meta.title}</span>
      </div>
      <div class="note-result-body">${note}</div>
    </div>`;
    })
    .join("");
}

function renderCFNextToSolve() {
  const el = document.getElementById("cf-insights-next");
  if (!el) return;

  const isUnrated = !state.cfUserInfo?.rating || state.cfUserInfo.rating === 0;
  const userRating = isUnrated ? 800 : state.cfUserInfo.rating;

  const suggestions = Object.values(state.cfMeta)
    .filter((p) => {
      const key = cfProblemKey(p.contestId, p.index);
      const isSolved = !!state.cfSolved[key];
      if (isSolved) return false;

      if (isUnrated) return p.rating >= 800 && p.rating <= 1000;
      return p.rating <= userRating + 200 && p.rating >= userRating;
    })
    .sort((a, b) => (b.solvedCount || 0) - (a.solvedCount || 0))
    .slice(0, 8);

  if (!suggestions.length) {
    el.innerHTML = `<div class="empty-recent">No suggestions found. Try adjusting your filters.</div>`;
    return;
  }

  el.innerHTML = suggestions
    .map(
      (p) => `
    <div class="hot-item">
      <a href="https://codeforces.com/contest/${p.contestId}/problem/${p.index}" target="_blank" class="hot-title">${p.name}</a>
      <span class="diff-badge" style="color:${cfRatingColor(p.rating)}">${p.rating || "800"}</span>
      <span class="hot-count">${p.solvedCount ? (p.solvedCount / 1000).toFixed(1) + "k" : "—"}</span>
    </div>`,
    )
    .join("");
}

function renderACNextToSolve() {
  const el = document.getElementById("ac-insights-next");
  if (!el) return;
  const userRating = state.acUserInfo?.currentRating || 400;
  const suggestions = Object.values(state.acMeta)
    .filter(
      (p) =>
        !state.acSolved[p.id] &&
        p.difficulty <= userRating + 300 &&
        p.difficulty >= userRating - 200,
    )
    .slice(0, 8);

  if (!suggestions.length) {
    el.innerHTML = `<div class="empty-recent">No suggestions available.</div>`;
    return;
  }

  el.innerHTML = suggestions
    .map(
      (p) => `
    <div class="hot-item">
      <a href="https://atcoder.jp/contests/${p.contestId}/tasks/${p.id}" target="_blank" class="hot-title">${p.title}</a>
      <span class="diff-badge" style="color:${acDiffColor(p.difficulty)}">${p.difficulty || "???"}</span>
    </div>`,
    )
    .join("");
}

function renderCFFilterUI() {
  const minEl = document.getElementById("cf-min-rating");
  const maxEl = document.getElementById("cf-max-rating");
  if (minEl) minEl.value = state.cfFilters.minRating;
  if (maxEl) maxEl.value = state.cfFilters.maxRating;

  const searchEl = document.getElementById("cf-search-input");
  if (searchEl) searchEl.value = state.cfFilters.search;

  renderActiveCFTags(); 
}

function renderActiveCFTags() {
  let container = document.getElementById("cf-active-tags-container");
  const filterRow = document.querySelector("#cf-tracker-content .filters-row");
  
  if (!container) {
    if (!filterRow) return;
    
    container = document.createElement("div");
    container.id = "cf-active-tags-container";
    container.className = "active-tags-row";
    filterRow.parentNode.insertBefore(container, filterRow.nextSibling);
  }

  if (state.cfFilters.tags.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";
  container.innerHTML = state.cfFilters.tags
    .map(
      (t) => `
    <span class="tag-pill">
      ${t} <button onclick="toggleCFTagFilterCheckbox('${t.replace(/'/g, "\\'")}')">✕</button>
    </span>
  `
    )
    .join("");
}

function updateCFRatingLabel() {}

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
  document
    .getElementById("cf-filter-starred-btn")
    ?.classList.toggle("active", state.cfFilters.starred);
  applyCFFilters();
  updateCFClearBtn();
}

function toggleCFReviewFilter() {
  state.cfFilters.review = !state.cfFilters.review;
  document
    .getElementById("cf-filter-review-btn")
    ?.classList.toggle("active", state.cfFilters.review);
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
  const dirty =
    f.search ||
    f.tags.length ||
    f.status !== "all" ||
    f.minRating !== 800 ||
    f.maxRating !== 3500 ||
    f.starred ||
    f.review;
  btn.style.display = dirty ? "" : "none";
}

function clearCFFilters() {
  state.cfFilters = {
    search: "",
    minRating: 800,
    maxRating: 3500,
    tags: [],
    status: "all",
    starred: false,
    review: false,
  };

  const searchEl = document.getElementById("cf-search-input");
  if (searchEl) searchEl.value = "";

  const statusSel = document.getElementById("cf-status-select");
  if (statusSel) statusSel.value = "all";

  const tagCountEl = document.getElementById("cf-tag-filter-count");
  if (tagCountEl) {
    tagCountEl.textContent = "0";
    tagCountEl.style.display = "none";
  }

  renderActiveCFTags();

  document.getElementById("cf-filter-starred-btn")?.classList.remove("active");
  document.getElementById("cf-filter-review-btn")?.classList.remove("active");

  renderCFFilterUI();
  applyCFFilters();
  updateCFClearBtn();
}

function renderFilterUI() {
  renderDiffPills();
  renderPatternDropdown();
}
function renderDiffPills() {
  renderDiffCheckboxList();
}

let diffDropdownOpen = false;

function toggleDiffDropdown() {
  const dd = document.getElementById("diff-dropdown");
  const btn = document.getElementById("diff-filter-btn");
  const isOpen = diffDropdownOpen;
  closeAllDropdowns();
  if (!isOpen) {
    diffDropdownOpen = true;
    dd.style.display = "block";
    btn.classList.add("active");
    renderDiffCheckboxList();
    setTimeout(
      () =>
        document.addEventListener("click", closeDiffDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}

function closeDiffDropdownOutside(e) {
  const wrap = document.getElementById("diff-filter-wrap");
  if (wrap && !wrap.contains(e.target)) {
    diffDropdownOpen = false;
    document.getElementById("diff-dropdown").style.display = "none";
    document.getElementById("diff-filter-btn").classList.remove("active");
  } else if (diffDropdownOpen) {
    setTimeout(
      () =>
        document.addEventListener("click", closeDiffDropdownOutside, {
          once: true,
        }),
      0,
    );
  }
}

function renderDiffCheckboxList() {
  const list = document.getElementById("diff-checkbox-list");
  if (!list) return;
  const diffs = ["Easy", "Medium", "Hard"];

  list.innerHTML = diffs
    .map((d) => {
      const val = d.toLowerCase();
      const checked = state.filters.difficulties.includes(val);
      return `
      <label class="company-checkbox-item ${checked ? "checked" : ""}">
        <input type="checkbox" ${checked ? "checked" : ""} onchange="toggleDiffFilter('${val}')" onclick="event.stopPropagation()">
        <span>${d}</span>
      </label>
    `;
    })
    .join("");

  const count = state.filters.difficulties.length;
  const countEl = document.getElementById("diff-filter-count");
  const btn = document.getElementById("diff-filter-btn");

  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count ? "inline-flex" : "none";
  }

  if (btn) {
    btn.classList.toggle("active", count > 0);
  }
}

function clearDiffFilters() {
  state.filters.difficulties = [];
  renderDiffCheckboxList();
  applyFilters();
}

function toggleDiffFilter(diff) {
  const idx = state.filters.difficulties.indexOf(diff);
  if (idx === -1) state.filters.difficulties.push(diff);
  else state.filters.difficulties.splice(idx, 1);

  renderDiffCheckboxList();
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
function renderActiveLCPatterns() {
  let container = document.getElementById("lc-active-patterns-container");
  const filterRow = document.querySelector("#lc-tracker-content .filters-row");
  
  if (!container) {
    if (!filterRow) return;
    container = document.createElement("div");
    container.id = "lc-active-patterns-container";
    container.className = "active-tags-row";
    filterRow.parentNode.insertBefore(container, filterRow.nextSibling);
  }

  if (state.filters.patterns.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";
  container.innerHTML = state.filters.patterns
    .map(
      (t) => `
    <span class="tag-pill lc-tag-pill">
      ${t} <button onclick="togglePatternFilter('${t.replace(/'/g, "\\'")}')">✕</button>
    </span>
  `
    )
    .join("");
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
  renderActiveLCPatterns();
}
function clearPatternFilters() {
  state.filters.patterns = [];
  updatePatternFilterCount();
  renderPatternCheckboxList(
    document.getElementById("pattern-search-input")?.value || "",
  );
  applyFilters();
  renderActiveLCPatterns();
}

function toggleCFTagFilter(tag) {
  if (!tag) return; 

  const idx = state.cfFilters.tags.indexOf(tag);
  if (idx === -1) {
    state.cfFilters.tags.push(tag);
  } else {
    state.cfFilters.tags.splice(idx, 1);
  }

  applyCFFilters();
  renderCFFilterUI();
}

function toggleACTagFilter(tag) {
  if (!state.acFilters.tags) state.acFilters.tags = [];
  const idx = state.acFilters.tags.indexOf(tag);
  if (idx === -1) state.acFilters.tags.push(tag);
  else state.acFilters.tags.splice(idx, 1);
  applyACFilters();
}

function updatePatternFilterCount() {
  const count = state.filters.patterns.length;
  const el = document.getElementById("pattern-filter-count");
  if (!el) return;
  el.textContent = count;
  el.style.display = count > 0 ? "inline-flex" : "none";
}

function closeAllDropdowns() {
  const ddd = document.getElementById("diff-dropdown");
  const dbtn = document.getElementById("diff-filter-btn");
  if (ddd) ddd.style.display = "none";
  if (dbtn) dbtn.classList.remove("active");
  diffDropdownOpen = false;

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

function applyFilters() {
  const { search, difficulties, patterns, status, starred, review } =
    state.filters;
  const q = search.toLowerCase();
  state.filtered = state.questions.filter((item) => {
    if (
      difficulties.length &&
      !difficulties.includes(item.difficulty.toLowerCase())
    )
      return false;
    if (status === "solved" && !state.solved[item.id]) return false;
    if (status === "unsolved" && state.solved[item.id]) return false;
    if (status === "premium" && !item.isPremium) return false;
    if (status === "free" && item.isPremium) return false;
    if (starred && !state.bookmarks[item.id]) return false;
    if (review) {
      if (!state.solved[item.id]) return false;
      if (!isReviewDue(item.id)) return false;
    }
    if (patterns.length) {
      const itemTags = item.tags || [];
      if (!patterns.some((p) => itemTags.includes(p))) return false;
    }
    if (state.curatedList && !CURATED_LISTS[state.curatedList]?.has(item.id))
      return false;
    if (q && !item.title.toLowerCase().includes(q) && !String(item.id).includes(q)) return false;
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
  const { search, difficulties, patterns, status, starred, review } =
    state.filters;
  const hasFilters =
    search ||
    difficulties.length ||
    patterns.length ||
    status !== "all" ||
    starred ||
    review;
  const btn = document.getElementById("clear-filters");
  if (btn) btn.style.display = hasFilters ? "inline-block" : "none";
}
function updateStatusDropdown() {
  const { status } = state.filters;
  const btn = document.getElementById("status-filter-btn");
  if (!btn) return;
  const labels = { 
    all: "All Status", 
    solved: "Solved", 
    unsolved: "Unsolved",
    premium: "Premium 🔒", 
    free: "Free Only" 
  };
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
    dd.innerHTML = `
      <div class="status-option" onclick="setStatusFilter('all')">All Status</div>
      <div class="status-option" onclick="setStatusFilter('unsolved')">Unsolved</div>
      <div class="status-option" onclick="setStatusFilter('solved')">Solved</div>
      <div class="status-divider" style="height:1px; background:var(--border); margin:4px 0;"></div>
      <div class="status-option" onclick="setStatusFilter('premium')">Premium 🔒</div>
      <div class="status-option" onclick="setStatusFilter('free')">Free</div>
    `;
    setTimeout(
      () => document.addEventListener("click", closeStatusDropdownOutside, { once: true }),
      0
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
  const dd = document.getElementById("status-dropdown");
  if (dd) dd.style.display = "none";
  updateStatusDropdown();
  applyFilters();
}

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
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${emptyMsg}</td></tr>`;
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
      const tags = (q.tags || []).slice(0, 2);
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
              <a href="${q.link}" target="_blank" rel="noopener" style="${q.isPremium ? 'color: var(--yellow); opacity: 0.8;' : ''}">
  ${q.isPremium ? '<span title="LeetCode Premium Required" style="margin-right:5px">🔒</span>' : ''}
  <span style="color:var(--text-muted);margin-right:4px;font-size:12px">${q.id}. </span>${q.title}
</a>
      ${reviewDue ? '<span class="review-badge-inline" title="Due for SM2 review">↺</span>' : ""}
      ${solved ? `<button class="note-btn-inline ${hasNote ? "has-note" : ""}" data-id="${q.id}" onclick="openNoteModal(${q.id})" title="${hasNote ? "Edit note" : "Add note"}">${hasNote ? "📝" : "✎"}</button>` : ""}
      ${tags.length ? `<span class="row-tags">${tags.map((t) => `<span class="pattern-tag-sm" style="cursor:pointer" onclick="togglePatternFilter('${t.replace(/'/g, "\\'")}')" title="Filter by ${t}">${t}</span>`).join("")}</span>` : ""}
    </div>
  </td>
  <td class="col-diff"><span class="diff-badge ${diffClass}">${q.difficulty}</span></td>
  <td class="col-accept">${q.acceptance}</td>
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

function renderAuthArea() {
  const el = document.getElementById("auth-area");
  if (!el) return;

  if (state.user) {
    const lcConnected = !!state.lcUsername;
    const cfConnected = !!state.cfUsername;
    const anyConnected = lcConnected || cfConnected || !!state.acUsername;

    const acConnectedAuth = !!state.acUsername;
    let syncTooltip = "";
    const parts = [];
    if (lcConnected) parts.push(`LC (${state.lcUsername})`);
    if (cfConnected) parts.push(`CF (${state.cfUsername})`);
    if (acConnectedAuth) parts.push(`AC (${state.acUsername})`);
    syncTooltip = parts.length ? `Sync ${parts.join(" + ")}` : "";

    const avatarUrl = state.user.user_metadata?.avatar_url || "";
    const login = state.user.user_metadata?.user_name || state.user.email || "";

    el.innerHTML = `
      <div class="auth-user-row">
        ${avatarUrl ? `<img src="${avatarUrl}" class="nav-avatar" alt="">` : ""}
        <span class="nav-username">@${login}</span>
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

  const activePage = document
    .querySelector(".page.active")
    ?.id?.replace("page-", "");
  if (activePage === "insights" || activePage === "contests")
    showPage(activePage);
}

function renderSyncBanner() {
  const existing = document.getElementById("lc-sync-banner");
  if (existing) existing.remove();
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

function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeNoteModal();
      closeModal();
      closeRandomPicker();
      closeOnboarding();
      closeLCModal();
      closeContestDetail();
      closeWeeklyDigest();

      if (typeof closeCFNoteModal === 'function') closeCFNoteModal();
      if (typeof closeACNoteModal === 'function') closeACNoteModal();
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
      } else if (state.activePlatform === "ac") {
        document.getElementById("ac-search-input")?.focus();
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
    if (e.key === "4") {
      e.preventDefault();
      showPage("contests");
    }
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      syncAll();
    }
  });
}

function openWeeklyDigest() {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const lcCount = days.reduce((s, d) => s + (state.activity[d] || 0), 0);
  const cfCount = days.reduce((s, d) => s + (state.cfActivity[d] || 0), 0);
  const acCount = days.reduce((s, d) => s + (state.acActivity[d] || 0), 0);
  const total = lcCount + cfCount + acCount;
  const stats = calcStreaks();
  const current = stats.combined.current; 
  const score = calcReadinessScore().total;
  const scoreColor =
    score >= 75
      ? "var(--green)"
      : score >= 50
        ? "var(--yellow)"
        : "var(--accent)";
  document.getElementById("weekly-digest-body").innerHTML = `
    <div style="text-align:center;padding:8px 0 20px">
      <div style="font-size:48px;font-weight:800;color:var(--accent);line-height:1">${total}</div>
      <div style="color:var(--text-muted);font-size:13px;margin-top:4px">problems solved this week</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="text-align:center;background:var(--bg-card);border-radius:10px;padding:12px 8px">
        <div style="font-size:26px;font-weight:700">${lcCount}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">LeetCode</div>
      </div>
      <div style="text-align:center;background:var(--bg-card);border-radius:10px;padding:12px 8px">
        <div style="font-size:26px;font-weight:700">${cfCount}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Codeforces</div>
      </div>
      <div style="text-align:center;background:var(--bg-card);border-radius:10px;padding:12px 8px">
        <div style="font-size:26px;font-weight:700">${acCount}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">AtCoder</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-around;font-size:12px;padding:12px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:12px">
      <span>🔥 <strong>${current}</strong> day streak</span>
      <span style="color:${scoreColor}">⚡ <strong>${score}%</strong> readiness</span>
      <span>📅 ${days[0]}</span>
    </div>
    <div style="font-size:11px;color:var(--text-muted);text-align:center">Week of ${days[0]} → ${days[6]}</div>`;
  document.getElementById("weekly-digest-overlay").style.display = "flex";
}
function closeWeeklyDigest() {
  document.getElementById("weekly-digest-overlay").style.display = "none";
}

function setInterviewDate(val) {
  state.interviewDate = val || null;
  saveProgress();
  renderCountdown();
}
function renderCountdown() {
  const el = document.getElementById("interview-countdown");
  if (!el) return;
  const inputHtml = `<input type="date" ${state.interviewDate ? `value="${state.interviewDate}"` : ""} onchange="setInterviewDate(this.value)" style="background:var(--bg-card);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:2px 6px;font-size:11px;margin-left:6px">`;
  if (!state.interviewDate) {
    el.innerHTML = `<span style="color:var(--text-muted);font-size:11px">🎯 Interview date:</span>${inputHtml}`;
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(state.interviewDate + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  const score = calcReadinessScore().total;
  const scoreColor =
    score >= 75
      ? "var(--green)"
      : score >= 50
        ? "var(--yellow)"
        : "var(--accent)";
  const daysStr =
    days < 0
      ? `<span style="color:var(--text-muted)">${Math.abs(days)}d ago</span>`
      : `<span style="font-weight:700;color:var(--accent)">${days}d left</span>`;
  el.innerHTML = `<span style="font-size:11px;color:var(--text-muted)">🎯</span> ${daysStr} · <span style="color:${scoreColor};font-weight:600;font-size:11px">${score}% ready</span>${inputHtml}<button onclick="setInterviewDate(null)" title="Clear interview date" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:11px;padding:0 4px;line-height:1">✕</button>`;
}

function calcReadinessScore() {
  const solvedIds = new Set(Object.keys(state.solved).map(Number));
  let targetPool = state.questions;
  const totalPool = targetPool.length || 1;
  const solvedPool = targetPool.filter((q) => solvedIds.has(q.id)).length;
  const coverageScore = (solvedPool / Math.min(totalPool, 100)) * 40;

  const hardSolved = targetPool.filter((q) => q.difficulty === "Hard" && solvedIds.has(q.id)).length;
  const medSolved = targetPool.filter((q) => q.difficulty === "Medium" && solvedIds.has(q.id)).length;
  const qualityScore = Math.min(40, hardSolved * 5 + medSolved * 1.5);

  const stats = calcStreaks();
  const currentStreak = stats.combined.current || 0;
  const consistencyScore = Math.min(20, currentStreak * 2);

  const total = Math.min(100, Math.round(coverageScore + qualityScore + consistencyScore));
  return {
    total: isNaN(total) ? 0 : total,
    breakdown: { top5: Math.round(coverageScore), volume: Math.round(qualityScore), balance: 15, consistency: Math.round(consistencyScore) },
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
          label: "Coverage",
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

  const stats = calcStreaks();

  document.getElementById("profile-avatar").src =
    state.user.user_metadata?.avatar_url || "";
  document.getElementById("profile-name").textContent =
    state.user.user_metadata?.full_name || "User";
  document.getElementById("profile-handle").textContent =
    "@" + (state.user.user_metadata?.user_name || "anonymous");

  animateNumber("streak-number", stats.combined.current);
  animateNumber("longest-streak", stats.combined.longest);
  animateNumber("total-days", stats.combined.totalDays);

  const lcCount = Object.keys(state.solved || {}).length;
  const cfCount = Object.keys(state.cfSolved || {}).length;
  const acCount = Object.keys(state.acSolved || {}).length;
  animateNumber("total-solved-profile", lcCount + cfCount + acCount);

  const breakdownTemplate = (lc, cf, ac) => `
    <div class="platform-mini-labels">
      <span style="color:#f89f1b">LC: ${lc}</span>
      <span style="color:#4fc3f7">CF: ${cf}</span>
      <span style="color:#4f46e5">AC: ${ac}</span>
    </div>
  `;

  document.getElementById("streak-sub").innerHTML = breakdownTemplate(
    stats.lc.current + "🔥",
    stats.cf.current + "🔥",
    stats.ac.current + "🔥",
  );
  updateBoxSubtext(
    "longest-streak",
    breakdownTemplate(stats.lc.longest, stats.cf.longest, stats.ac.longest),
  );
  updateBoxSubtext(
    "total-days",
    breakdownTemplate(
      stats.lc.totalDays,
      stats.cf.totalDays,
      stats.ac.totalDays,
    ),
  );
  updateBoxSubtext(
    "total-solved-profile",
    breakdownTemplate(lcCount, cfCount, acCount),
  );

  renderHeatmap();
  renderProfilePlatformTabs(state.profilePlatform || "lc");
}

function updateBoxSubtext(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  const parent = el.parentElement;
  let sub = parent.querySelector(".platform-mini-labels");
  if (!sub) {
    sub = document.createElement("div");
    parent.appendChild(sub);
  }
  sub.className = "platform-mini-labels";
  sub.innerHTML = html;
}

function renderProfilePlatformTabs(platform) {
  state.profilePlatform = platform;

  const lcTab = document.getElementById("profile-tab-lc");
  const cfTab = document.getElementById("profile-tab-cf");
  const acTab = document.getElementById("profile-tab-ac");
  if (lcTab) lcTab.classList.toggle("active", platform === "lc");
  if (cfTab) cfTab.classList.toggle("active", platform === "cf");
  if (acTab) acTab.classList.toggle("active", platform === "ac");

  const lcSection = document.getElementById("profile-lc-section");
  const cfSection = document.getElementById("profile-cf-section");
  const acSection = document.getElementById("profile-ac-section");
  if (lcSection) lcSection.style.display = platform === "lc" ? "" : "none";
  if (cfSection) cfSection.style.display = platform === "cf" ? "" : "none";
  if (acSection) acSection.style.display = platform === "ac" ? "" : "none";

  if (platform === "lc") renderProfileLC();
  else if (platform === "cf") renderProfileCF();
  else renderProfileAC();
}

function switchProfilePlatform(platform) {
  window.location.hash = `profile/${platform}`;
  renderProfilePlatformTabs(platform);
}

function renderProfileLC() {
  const lcBadge = document.getElementById("profile-lc-badge");
  if (lcBadge) {
    if (state.lcUsername) {
      const lcAvatar = state.lcUserInfo?.avatar
        ? `<img src="${state.lcUserInfo.avatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle" onerror="this.style.display='none'">`
        : "";
      lcBadge.innerHTML = `${lcAvatar}<span class="lc-dot"></span> LeetCode: <a href="https://leetcode.com/${state.lcUsername}" target="_blank">@${state.lcUsername}</a> <button class="lc-disconnect-btn" onclick="disconnectLC()">Disconnect</button>`;
    } else {
      lcBadge.innerHTML = `<button class="btn-lc-connect" onclick="openLCModal()">+ Connect LeetCode</button>`;
    }
  }

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
  renderReadinessGauge(calcReadinessScore());
  renderLCRecentSolves();
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
  const cfBadge = document.getElementById("profile-cf-badge");
  if (cfBadge) {
    if (state.cfUserInfo) {
      const u = state.cfUserInfo;
      const rating = u.rating || null;
      const isDefaultCFAvatar = (url) => !url || url.includes("/no-");

      const avatarUrl = !isDefaultCFAvatar(u.titlePhoto)
        ? u.titlePhoto.startsWith("http")
          ? u.titlePhoto
          : `https:${u.titlePhoto}`
        : !isDefaultCFAvatar(u.avatar)
          ? u.avatar.startsWith("http")
            ? u.avatar
            : `https:${u.avatar}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.handle)}&size=56&background=random&rounded=true`;
      const avatarHtml = `<img src="${avatarUrl}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:7px;vertical-align:middle;border:2px solid ${cfRatingColor(rating)}40">`;
      cfBadge.innerHTML = `${avatarHtml}Codeforces: <a href="https://codeforces.com/profile/${u.handle}" target="_blank" style="color:${cfRatingColor(rating)}">@${u.handle}</a> <span style="color:${cfRatingColor(rating)};font-size:11px">${cfRatingLabel(rating)}${rating ? " · " + rating : ""}</span> <button class="lc-disconnect-btn" onclick="disconnectCF()">Disconnect</button>`;
    } else {
      cfBadge.innerHTML = `<button class="btn-lc-connect" onclick="switchPlatform('cf'); showPage('tracker')">+ Connect Codeforces</button>`;
    }
  }

  renderProfileCFStats();
  renderProfileCFRatingDist();
  renderCFRecentSolves();
  renderProfileCFTagCoverage();
  renderCFNotesSearch();
}

function renderProfileCFStats() {
  const el = document.getElementById("profile-cf-stats");
  if (!el) return;
  
  const cfSolvedKeys = Object.keys(state.cfSolved);
  const totalSolved = cfSolvedKeys.length;
  const u = state.cfUserInfo;

  if (!u) {
    el.innerHTML = `<div class="empty-recent">Connect Codeforces on the tracker page to see your stats.</div>`;
    return;
  }

  const stats = calcStreaks();
  const streak = stats.cf.current;
  
  const rating = u.rating || null;
  const maxRating = u.maxRating || null;

  el.innerHTML = `
    <div class="cf-profile-stats">
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:${cfRatingColor(rating)}">${rating ?? "—"}</div>
        <div class="cf-profile-stat-label">Rating</div>
      </div>
      
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val accent-text">${totalSolved}</div>
        <div class="cf-profile-stat-label">Solved</div>
      </div>

      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val streak-text">${streak}🔥</div>
        <div class="cf-profile-stat-label">CF Streak</div>
      </div>

      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:${cfRatingColor(maxRating)}">${maxRating ?? "—"}</div>
        <div class="cf-profile-stat-label">Peak</div>
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

function toggleCoverageExpand() {
  state.coverageExpanded = !state.coverageExpanded;
  renderProfileLC();
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

function filterByDate(date) {
  state.filters.search = date;
  const input = document.getElementById("search-input");
  if (input) input.value = date;

  switchPlatform("lc");
  showPage("tracker");
  applyFilters();
  showToast(`📅 Showing problems from ${date}`, "info");
}

function getStreakStats(activityMap) {
  const days = Object.keys(activityMap || {})
    .filter((d) => activityMap[d] > 0)
    .sort();
  if (!days.length) return { current: 0, longest: 0, totalDays: 0 };

  const daySet = new Set(days);
  const today = dateStr(new Date());

  let longest = 0,
    tempRun = 0,
    prevDate = null;
  days.forEach((d) => {
    if (prevDate) {
      const diff = (new Date(d) - new Date(prevDate)) / 86400000;
      tempRun = Math.round(diff) === 1 ? tempRun + 1 : 1;
    } else tempRun = 1;
    longest = Math.max(longest, tempRun);
    prevDate = d;
  });

  let current = 0;
  let cursor = daySet.has(today) ? new Date() : new Date(Date.now() - 86400000);
  while (daySet.has(dateStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest, totalDays: daySet.size };
}

function calcStreaks() {
  const mergedActivity = {};
  [state.activity, state.cfActivity, state.acActivity].forEach((map) => {
    Object.entries(map || {}).forEach(([d, v]) => {
      if (v > 0) mergedActivity[d] = (mergedActivity[d] || 0) + v;
    });
  });

  return {
    combined: getStreakStats(mergedActivity),
    lc: getStreakStats(state.activity),
    cf: getStreakStats(state.cfActivity),
    ac: getStreakStats(state.acActivity),
  };
}

function showDayDetail(date) {
  const lcSolves = Object.entries(state.solved).filter(([id, d]) => d === date);
  const cfSolves = Object.entries(state.cfSolved).filter(
    ([key, d]) => d === date,
  );
  const acSolves = Object.entries(state.acSolved).filter(
    ([id, d]) => d === date,
  );

  if (!lcSolves.length && !cfSolves.length && !acSolves.length) return;

  let html = `<div class="day-detail-modal-list">`;

  if (lcSolves.length) {
    html += `<div class="day-detail-header">⚡ LeetCode</div>`;
    lcSolves.forEach(([id]) => {
      const q = state.questions.find((x) => x.id == id);
      html += `<div class="day-detail-item">#${id} ${q?.title || "Problem"} <span class="diff-badge sm ${q?.difficulty?.toLowerCase()}">${q?.difficulty || ""}</span></div>`;
    });
  }

  if (cfSolves.length) {
    html += `<div class="day-detail-header" style="color:#4fc3f7">📊 Codeforces</div>`;
    cfSolves.forEach(([key]) => {
      const p = state.cfMeta[key];
      html += `<div class="day-detail-item">${p?.name || key} <span style="color:${cfRatingColor(p?.rating)}">${p?.rating || "Unrated"}</span></div>`;
    });
  }

  if (acSolves.length) {
    html += `<div class="day-detail-header" style="color:#4f46e5">🔵 AtCoder</div>`;
    acSolves.forEach(([id]) => {
      const p = state.acMeta[id];
      html += `<div class="day-detail-item">${p?.title || id} <span style="color:${acDiffColor(p?.difficulty)}">${p?.difficulty || "Unrated"}</span></div>`;
    });
  }
  html += `</div>`;

  document.getElementById("contest-detail-title").textContent =
    `Activity: ${formatDate(date)}`;
  document.getElementById("contest-detail-subtitle").textContent =
    "Daily Solve Summary";
  document.getElementById("contest-detail-body").innerHTML = html;
  document.getElementById("contest-detail-overlay").style.display = "flex";
}

function renderHeatmap() {
  const el = document.getElementById("heatmap");
  if (!el) return;

  const WEEKS = 28; 
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const activity = {};
  [state.activity, state.cfActivity, state.acActivity].forEach(map => {
    Object.entries(map || {}).forEach(([d, v]) => { 
      if (v > 0) activity[d] = (activity[d] || 0) + v; 
    });
  });

  const maxVal = Math.max(1, ...Object.values(activity));
  let colsHtml = "";

  for (let w = 0; w < WEEKS; w++) {
    let cells = "";
    for (let d = 0; d < 7; d++) {
      const curr = new Date(start);
      curr.setDate(start.getDate() + w * 7 + d);
      const key = dateStr(curr);
      const count = activity[key] || 0;
      let level = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxVal) * 4));
      const isFuture = curr > today;
      cells += `<div class="heatmap-cell l${isFuture ? '0 future' : level}" 
                     title="${key}: ${count} solves" 
                     onclick="showDayDetail('${key}')"></div>`;
    }
    colsHtml += `<div class="heatmap-col">${cells}</div>`;
  }
  el.innerHTML = `<div class="heatmap-wrapper"><div class="heatmap-grid">${colsHtml}</div></div>`;
}

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

function showError(msg) {
  document.getElementById("loading").innerHTML =
    `<div class="error-state">⚠️ ${msg}</div>`;
}

function renderInsightsPage() {
  if (!state.questions.length) return;
  const platform = state.insightsPlatform || "lc";
  renderInsightsPlatformTabs(platform);
}

function renderInsightsPlatformTabs(platform) {
  state.insightsPlatform = platform;
  const lcTab = document.getElementById("insights-tab-lc");
  const cfTab = document.getElementById("insights-tab-cf");
  const acTab = document.getElementById("insights-tab-ac");
  if (lcTab) lcTab.classList.toggle("active", platform === "lc");
  if (cfTab) cfTab.classList.toggle("active", platform === "cf");
  if (acTab) acTab.classList.toggle("active", platform === "ac");

  const lcSection = document.getElementById("insights-lc-section");
  const cfSection = document.getElementById("insights-cf-section");
  const acSection = document.getElementById("insights-ac-section");
  if (lcSection) lcSection.style.display = platform === "lc" ? "" : "none";
  if (cfSection) cfSection.style.display = platform === "cf" ? "" : "none";
  if (acSection) acSection.style.display = platform === "ac" ? "" : "none";

  if (platform === "lc") {
    renderLCInsights();
  } else if (platform === "cf") {
    if (!state.cfUsername) {
      cfSection.innerHTML = `<div class="contests-no-user" style="padding:60px 20px">
        <div class="contests-no-user-icon">📊</div>
        <div class="contests-no-user-title">Connect Codeforces to see CF Insights</div>
        <div class="contests-no-user-sub">Link your Codeforces handle from the Tracker page.</div>
        <button class="btn-primary" onclick="switchPlatform('cf'); showPage('tracker')">→ Connect Codeforces</button>
      </div>`;
      cfSection.style.display = "";
    } else {
      renderCFInsights();
    }
  } else {
    if (!state.acUsername) {
      acSection.innerHTML = `<div class="contests-no-user" style="padding:60px 20px">
        <div class="contests-no-user-icon">📊</div>
        <div class="contests-no-user-title">Connect AtCoder to see AC Insights</div>
        <div class="contests-no-user-sub">Link your AtCoder handle from the Tracker page.</div>
        <button class="btn-primary" onclick="switchPlatform('ac'); showPage('tracker')">→ Connect AtCoder</button>
      </div>`;
      acSection.style.display = "";
    } else {
      renderACInsights();
    }
  }
}

function switchInsightsPlatform(platform) {
  window.location.hash = `insights/${platform}`;
  renderInsightsPlatformTabs(platform);
}

function renderLCInsights() {
  renderInsightsRibbon();
  renderDiffChart();
  renderSolveRate();
  renderTodoBreakdown();
  renderWeeklyChart();
  renderPatternInsights();
  renderDailyQueue();
  renderNextToSolve();
}

function renderCFInsights() {
  renderCFInsightsRibbon();
  renderCFRatingChart();
  renderCFSolveByRating();
  renderCFTagInsights();
  renderCFWeeklyChart();
  renderCFNextToSolve();
}

function renderNextToSolve() {
  const el = document.getElementById("insights-next");
  if (!el) return;
  const solvedIds = new Set(Object.keys(state.solved).map(Number));
  const unsolved = state.questions
    .filter((q) => !solvedIds.has(q.id) && q.difficulty !== "Easy")
    .sort((a, b) => parseFloat(b.acceptance) - parseFloat(a.acceptance))
    .slice(0, 8);
  if (!unsolved.length) {
    el.innerHTML = `<div class="empty-recent">Solve more problems to get recommendations.</div>`;
    return;
  }
  el.innerHTML = unsolved
    .map(
      (q) => `
    <div class="hot-item">
      <a href="${q.link}" target="_blank" class="hot-title">${q.id}. ${escHtml(q.title)}</a>
      <span class="diff-badge diff-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
      <span class="hot-count">${q.acceptance}%</span>
    </div>`,
    )
    .join("");
}

function renderInsightsRibbon() {
  const total = state.questions.length;
  const solved = Object.keys(state.solved).length;
  const pct = total ? Math.round((solved / total) * 100) : 0;
  
  const stats = calcStreaks();
  const streak = stats.lc.current; 
  
  const starred = Object.keys(state.bookmarks).length;
  const reviewDue = Object.keys(state.solved).filter((id) =>
    isReviewDue(+id),
  ).length;
  
  document.getElementById("insights-ribbon").innerHTML = `
    <div class="ribbon-item"><div class="ribbon-val">${total}</div><div class="ribbon-label">Total Questions</div></div>
    <div class="ribbon-item"><div class="ribbon-val accent-text">${solved}</div><div class="ribbon-label">Solved</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${pct}%</div><div class="ribbon-label">Completion</div></div>
    <div class="ribbon-item"><div class="ribbon-val streak-text">${streak}🔥</div><div class="ribbon-label">Day Streak</div></div>
    
    <!-- UPDATED: Now clickable to show LeetCode bookmarks -->
    <div class="ribbon-item" style="cursor:pointer" onclick="switchPlatform('lc'); showPage('tracker'); state.filters.starred=true; applyFilters();">
      <div class="ribbon-val" style="color:var(--accent)">★ ${starred}</div>
      <div class="ribbon-label">Bookmarked</div>
    </div>

    ${reviewDue > 0 ? `<div class="ribbon-item" style="cursor:pointer" onclick="switchPlatform('lc'); showPage('tracker'); state.filters.review=true; applyFilters()"><div class="ribbon-val" style="color:var(--yellow)">↺ ${reviewDue}</div><div class="ribbon-label">Due Review</div></div>` : ""}
  `;
}

function renderPatternInsights() {
  const el = document.getElementById("insights-patterns");
  if (!el) return;

  let lcHtml = "";
  if (state.allTags.length) {
    const solvedIds = new Set(Object.keys(state.solved).map(Number));
    const tagStats = {};
    for (const q of state.questions) {
      const tags = q.tags || [];
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

  el.innerHTML =
    lcHtml ||
    `<div class="empty-insights">Run <code>node fetch-metadata.js</code> to enable pattern analytics.</div>`;
}

function renderDailyQueue() {
  const container = document.getElementById("insights-lc-section");
  let queueEl = document.getElementById("daily-review-queue");

  if (!queueEl) {
    queueEl = document.createElement("div");
    queueEl.id = "daily-review-queue";
    const ribbon = document.getElementById("insights-ribbon");
    ribbon.parentNode.insertBefore(queueEl, ribbon.nextSibling);
  }

  const due = state.questions.filter((q) => isReviewDue(q.id)).slice(0, 5);

  queueEl.className = "insights-card insights-card-wide review-queue-card";
  queueEl.style.marginBottom = "20px";

  let rows = due
    .map(
      (q) => `
    <div class="upsolver-problem">
      <span class="diff-badge ${q.difficulty.toLowerCase()} sm">${q.difficulty[0]}</span>
      <a href="${q.link}" target="_blank" class="upsolver-name">${q.title}</a>
      <button class="review-item-btn" onclick="advanceSM2(${q.id}); renderDailyQueue(); saveProgress(); showToast('Review Complete!')">Mark Reviewed</button>
    </div>
  `,
    )
    .join("");

  queueEl.innerHTML = `
    <div class="insights-card-header">
      <span class="insights-card-icon">🧠</span>
      <div>
        <div class="insights-card-title">Daily Review Queue</div>
        <div class="insights-card-sub">SM2 Spaced-Repetition: Strengthen your memory on these ${due.length} items</div>
      </div>
    </div>
    <div class="upsolver-problems">
      ${due.length ? rows : '<div class="empty-insights">🎉 No reviews due today. Your memory is sharp!</div>'}
    </div>
  `;
}

function renderDiffChart() {
  const el = document.getElementById("insights-diff-chart");
  if (!el) return;
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

function renderCFInsightsRibbon() {
  const el = document.getElementById("cf-insights-ribbon");
  if (!el) return;
  const allProblems = Object.values(state.cfMeta);
  const ratedTotal = allProblems.filter((p) => p.rating).length;
  const solved = Object.keys(state.cfSolved).length;
  const pct = ratedTotal ? Math.round((solved / ratedTotal) * 100) : 0;
  const u = state.cfUserInfo;
  const rating = u?.rating ?? null;
  
  const stats = calcStreaks();
  const streak = stats.cf.current;

  const starred = Object.keys(state.cfBookmarks || {}).length;

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
    <div class="ribbon-item"><div class="ribbon-val streak-text">${streak}🔥</div><div class="ribbon-label">Day Streak</div></div>
    
    <div class="ribbon-item" style="cursor:pointer" onclick="switchPlatform('cf'); showPage('tracker'); state.cfFilters.starred=true; applyCFFilters();">
      <div class="ribbon-val" style="color:var(--accent)">★ ${starred}</div>
      <div class="ribbon-label">Bookmarked</div>
    </div>
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
  el.innerHTML = `<div class="cf-rating-chart">${bands
    .map((b) => {
      const total = counts[b.label] || 0;
      const solved = solvedCounts[b.label] || 0;
      const barH = Math.round((total / maxCount) * 100);
      const solvedH = total ? Math.round((solved / total) * barH) : 0;
      return `<div class="cf-chart-col">
      <div class="cf-chart-count">${total > 1000 ? (total / 1000).toFixed(1) + "k" : total}</div>
      <div class="cf-chart-bar-wrap">
        <div class="cf-chart-bar" style="height:${barH}%;background:${b.color}25;border:1px solid ${b.color}60;position:relative">
          <div style="position:absolute;bottom:0;left:0;right:0;height:${total ? Math.round((solved / total) * 100) : 0}%;background:${b.color};border-radius:2px 2px 0 0"></div>
        </div>
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

function renderCFRadar() {
  const el = document.getElementById("cf-radar-chart");
  if (!el) return;

  const tagStats = {};
  for (const p of Object.values(state.cfMeta)) {
    if (!p.rating) continue;
    const solved = !!state.cfSolved[cfProblemKey(p.contestId, p.index)];
    for (const tag of p.tags || []) {
      if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
      tagStats[tag].total++;
      if (solved) tagStats[tag].solved++;
    }
  }

  const top = Object.entries(tagStats)
    .filter(([, v]) => v.total >= 20)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  if (!top.length) {
    el.innerHTML = `<div class="empty-insights" style="padding:40px 0;text-align:center;color:var(--text-muted)">Solve more CF problems to see radar.</div>`;
    return;
  }

  const labels = top.map(([t]) => (t.length > 12 ? t.slice(0, 11) + "…" : t));
  const values = top.map(([, v]) => (v.total ? v.solved / v.total : 0));
  const rawData = top.map(([, v]) => ({ solved: v.solved, total: v.total }));
  renderRadarChart("cf-radar-chart", labels, values, "var(--accent)", rawData);
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

async function loadACMeta() {
  try {
    const res = await fetch("data/atcoder-meta.json");
    if (!res.ok) return;
    state.acMeta = await res.json();
  } catch (_) {}
}

function acDiffColor(diff) {
  if (diff == null) return "var(--text-muted)";
  if (diff < 400) return "#808080";
  if (diff < 800) return "#804000";
  if (diff < 1200) return "#008000";
  if (diff < 1600) return "#00c0c0";
  if (diff < 2000) return "#0000ff";
  if (diff < 2400) return "#c0c000";
  if (diff < 2800) return "#ff8000";
  return "#ff0000";
}

function acDiffLabel(diff) {
  if (diff == null) return "Unrated";
  if (diff < 400) return "Gray";
  if (diff < 800) return "Brown";
  if (diff < 1200) return "Green";
  if (diff < 1600) return "Teal";
  if (diff < 2000) return "Blue";
  if (diff < 2400) return "Yellow";
  if (diff < 2800) return "Orange";
  return "Red";
}

async function initAC() {
  await loadACMeta();
  const savedHandle = state.acUsername || localStorage.getItem("ac_username");
  if (savedHandle && !state.acUsername) state.acUsername = savedHandle;
  applyACFilters();
  if (state.acUsername && !state.acUserInfo) {
    try {
      let ratingData = {};
      try {
        const r = await fetch(
          `/api/contests-proxy?platform=ac-user&handle=${encodeURIComponent(state.acUsername)}`,
        );
        if (r.ok) ratingData = await r.json();
      } catch (_) {}
      state.acUserInfo = { handle: state.acUsername, ...ratingData };
      const connectArea = document.getElementById("ac-connect-area");
      const connectedArea = document.getElementById("ac-connected-area");
      if (connectArea) connectArea.style.display = "none";
      if (connectedArea) connectedArea.style.display = "";
      renderACConnectedArea();
      renderACStats();
    } catch (_) {}
  } else if (state.acUsername && state.acUserInfo) {
    const connectArea = document.getElementById("ac-connect-area");
    const connectedArea = document.getElementById("ac-connected-area");
    if (connectArea) connectArea.style.display = "none";
    if (connectedArea) connectedArea.style.display = "";
    renderACConnectedArea();
    renderACStats();
  }
}

async function syncACUser() {
  const handle = document.getElementById("ac-username-input")?.value.trim();
  if (!handle) return;

  clearContestCache("acHistory");
  clearContestCache(`acHistory_${handle}`);
  contestsState.acHistoryLoaded = false;

  const btn = document.getElementById("ac-sync-btn");
  btn.textContent = "Syncing…";
  btn.disabled = true;
  try {
    const res = await fetch(
      `/.netlify/functions/ac-sync?user=${encodeURIComponent(handle)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const submissions = Array.isArray(data) ? data : [];
    if (!submissions.length && res.ok) {
    }

    state.acUsername = handle;
    localStorage.setItem("ac_username", handle);

    try {
      const ratingRes = await fetch(
        `/api/contests-proxy?platform=ac-user&handle=${encodeURIComponent(handle)}`,
      );
      const ratingData = await ratingRes.json();
      state.acUserInfo = { handle, ...ratingData };
    } catch (_) {
      state.acUserInfo = { handle };
    }

    const newSolved = {};
    const newActivity = {};
    submissions
      .filter((s) => s.result === "AC")
      .forEach((s) => {
        const key = s.problem_id;
        const d = dateStr(new Date(s.epoch_second * 1000));
        if (!newSolved[key] || d < newSolved[key]) newSolved[key] = d;
      });
    Object.values(newSolved).forEach((d) => {
      newActivity[d] = (newActivity[d] || 0) + 1;
    });

    state.acSolved = newSolved;
    state.acActivity = newActivity;
    saveProgress();
    applyACFilters();
    renderProfilePage();
    showToast(
      `✅ AtCoder synced! ${Object.keys(newSolved).length} problems solved.`,
    );
    document.getElementById("ac-connect-area").style.display = "none";
    document.getElementById("ac-connected-area").style.display = "";
    renderACConnectedArea();
    renderACStats();
    const ap = document.querySelector(".page.active")?.id?.replace("page-", "");
    if (ap === "insights" || ap === "contests") showPage(ap);
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
  } finally {
    btn.textContent = "Sync";
    btn.disabled = false;
  }
}

async function syncACSilent() {
  if (!state.acUsername) return { ok: false };
  try {
    const res = await fetch(
      `/.netlify/functions/ac-sync?user=${encodeURIComponent(state.acUsername)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const submissions = Array.isArray(data) ? data : [];
    const newSolved = {};
    const newActivity = {};
    submissions
      .filter((s) => s.result === "AC")
      .forEach((s) => {
        const key = s.problem_id;
        const d = dateStr(new Date(s.epoch_second * 1000));
        if (!newSolved[key] || d < newSolved[key]) newSolved[key] = d;
      });
    Object.values(newSolved).forEach((d) => {
      newActivity[d] = (newActivity[d] || 0) + 1;
    });
    state.acSolved = newSolved;
    state.acActivity = newActivity;
    saveProgress();
    applyACFilters();
    renderProfilePage();
    renderACConnectedArea();
    renderACStats();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function renderACConnectedArea() {
  const el = document.getElementById("ac-connected-area");
  if (!el || !state.acUserInfo) return;
  const u = state.acUserInfo;
  const handle = u.handle;
  const rating = u.currentRating || null;
  const handleColor = rating ? acDiffColor(rating) : "var(--accent)";

  const avatar = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&size=56&background=4f46e5&color=fff&rounded=true"
    style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid ${handleColor}60;margin-right:8px"
    onerror="this.style.display='none'">`;

  const ratingBadge = rating
    ? `<span class="cf-rank-badge" style="color:${acDiffColor(rating)}">${acDiffLabel(rating)} · ${rating}</span>`
    : `<span class="cf-rank-badge" style="color:var(--text-muted)">Unrated</span>`;

  const peakBadge =
    u.peakRating && u.peakRating !== rating
      ? `<span style="font-size:11px;color:var(--text-muted)">peak: <span style="color:${acDiffColor(u.peakRating)}">${u.peakRating}</span></span>`
      : "";

  const solved = Object.keys(state.acSolved).length;
  const solvedBadge = solved
    ? `<span class="cf-rank-badge" style="color:var(--accent)">${solved} Solved</span>`
    : "";

  el.innerHTML = `
    <div class="cf-user-badge">
      ${avatar}
      <span style="font-weight:700;color:${handleColor}">${handle}</span>
      ${ratingBadge}
      ${peakBadge}
      ${solvedBadge}
      <button class="btn-outline-danger" style="margin-left:auto;padding:4px 10px;font-size:11px" onclick="disconnectAC()">Disconnect</button>
    </div>`;
}

async function disconnectAC() {
  state.acUsername = null;
  state.acUserInfo = null;
  state.acSolved = {};
  state.acActivity = {};
  contestsState.acContestHistory = [];
  contestsState.acHistoryFiltered = [];
  contestsState.acHistoryLoaded = false;

  localStorage.removeItem("ac_username");
  clearContestCache("acHistory");
  clearContestCache(`acHistory_${state.acUsername}`);

  await saveProgress();

  document.getElementById("ac-connect-area").style.display = "";
  const connectedArea = document.getElementById("ac-connected-area");
  connectedArea.style.display = "none";
  connectedArea.innerHTML = "";

  applyACFilters();
  renderProfilePage();

  const ap = document.querySelector(".page.active")?.id?.replace("page-", "");
  if (ap === "insights" || ap === "contests") showPage(ap);

  showToast("AtCoder disconnected and cache cleared.");
}

function applyACFilters() {
  const { search, minDiff, maxDiff, status, starred, review } = state.acFilters;
  const sq = search.toLowerCase();

  state.acFiltered = Object.values(state.acMeta).filter((p) => {
    if (p.difficulty != null) {
      if (p.difficulty < minDiff || p.difficulty > maxDiff) return false;
    } else {
      if (minDiff > 0) return false;
    }
    if (
      sq &&
      !p.title.toLowerCase().includes(sq) &&
      !p.id.toLowerCase().includes(sq)
    )
      return false;
    const solved = !!state.acSolved[p.id];
    if (status === "solved" && !solved) return false;
    if (status === "unsolved" && solved) return false;
    if (starred && !state.acBookmarks[p.id]) return false;
    if (review) {
      if (!solved) return false;
      if (!isACReviewDue(p.id)) return false;
    }
    if (state.acCuratedList && !CURATED_LISTS[state.acCuratedList]?.has(p.id))
      return false;
    return true;
  });

  state.acFiltered.sort((a, b) => {
    const aSolved = !!state.acSolved[a.id];
    const bSolved = !!state.acSolved[b.id];
    if (aSolved !== bSolved) return aSolved ? 1 : -1;
    if (a.difficulty == null && b.difficulty == null) return 0;
    if (a.difficulty == null) return 1;
    if (b.difficulty == null) return -1;
    return a.difficulty - b.difficulty;
  });

  state.acPage = 1;
  renderACTable();
  renderACStats();
  updateACClearBtn();
}

function renderACStats() {
  const allProblems = Object.values(state.acMeta);
  const ratedTotal = allProblems.filter((p) => p.difficulty != null).length;
  const solved = Object.keys(state.acSolved).length;
  const el = document.getElementById("ac-stats-bar");
  if (!el) return;
  el.innerHTML = `
    <div class="stat-item"><div class="stat-value">${ratedTotal.toLocaleString()}</div><div class="stat-label">Rated Problems</div></div>
    <div class="stat-item"><div class="stat-value accent">${solved}</div><div class="stat-label">Solved</div></div>
    <div class="stat-item"><div class="stat-value accent">${ratedTotal ? Math.round((solved / ratedTotal) * 100) : 0}%</div><div class="stat-label">Done</div></div>
  `;

  const pct = ratedTotal ? Math.round((solved / ratedTotal) * 100) : 0;
  const fill = document.getElementById("ac-progress-bar-fill");
  if (fill) fill.style.width = pct + "%";
}

function renderACTable() {
  const tbody = document.getElementById("ac-tbody");
  if (!tbody) return;
  const start = (state.acPage - 1) * ITEMS_PER_PAGE;
  const page = state.acFiltered.slice(start, start + ITEMS_PER_PAGE);

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No problems match your filters.</td></tr>`;
    renderACPagination();
    return;
  }

  tbody.innerHTML = page
    .map((p) => {
      const solved = !!state.acSolved[p.id];
      const starred = !!state.acBookmarks[p.id];
      const hasNote = !!state.acNotes[p.id];
      const safeACTitle = escHtml(p.title).replace(/'/g, "&#39;");
      const reviewDue = solved && isACReviewDue(p.id);
      const solveDate = state.acSolved[p.id] || "";
      const link = `https://atcoder.jp/contests/${p.contestId}/tasks/${p.id}`;
      const contestLink = `https://atcoder.jp/contests/${p.contestId}`;
      const diffColor = acDiffColor(p.difficulty);
      const diffDisplay =
        p.difficulty != null
          ? `<span style="color:${diffColor};font-weight:600">${p.difficulty}</span>`
          : `<span style="color:var(--text-muted);font-size:11px">Unrated</span>`;
      const solvedCount = p.solvedCount
        ? `${p.solvedCount >= 1000 ? (p.solvedCount / 1000).toFixed(1) + "k" : p.solvedCount}`
        : "—";
      return `<tr class="${solved ? "solved" : ""}">
      <td class="col-status">
        ${
          solved
            ? `<span class="solved-icon" title="Solved${solveDate ? " · " + solveDate : ""}">✓</span>`
            : `<span class="unsolved-icon">○</span>`
        }
      </td>
      <td class="col-title">
        <div class="title-cell-content">
          <button class="star-btn inline-star ${starred ? "starred" : ""}" onclick="toggleACBookmark('${p.id}')" title="Bookmark">${starred ? "★" : "☆"}</button>
          ${
            solved
              ? `<button class="note-btn-inline ${hasNote ? "has-note" : ""}" 
            onclick="openACNoteModal('${p.id}', '${safeACTitle}')" 
            title="${hasNote ? "Edit note" : "Add note"}">${hasNote ? "📝" : "✎"}</button>`
              : ""
          }
          <a href="${link}" target="_blank" rel="noopener" class="cf-problem-link">${p.title}</a>
          ${reviewDue ? '<span class="review-badge-inline" title="Due for SM2 review">↺</span>' : ""}
        </div>
      </td>
      <td class="col-diff">${diffDisplay}</td>
      <td class="col-contest">
        <a href="${contestLink}" target="_blank" rel="noopener" class="cf-contest-link">${p.contestId.toUpperCase()}</a>
      </td>
      <td class="col-solves">${solvedCount}</td>
    </tr>`;
    })
    .join("");

  renderACPagination();
}

function renderACPagination() {
  const el = document.getElementById("ac-pagination");
  if (!el) return;
  const total = Math.ceil(state.acFiltered.length / ITEMS_PER_PAGE);
  if (total <= 1) {
    el.innerHTML = "";
    return;
  }
  const p = state.acPage;
  const s = (p - 1) * ITEMS_PER_PAGE + 1;
  const e = Math.min(p * ITEMS_PER_PAGE, state.acFiltered.length);
  const startP = Math.max(1, p - 2);
  const endP = Math.min(total, p + 2);
  let html = `<button class="page-btn${p === 1 ? " disabled" : ""}" onclick="acGoPage(${p - 1})" ${p === 1 ? "disabled" : ""}>← Prev</button>`;
  if (startP > 1) {
    html += `<button class="page-btn" onclick="acGoPage(1)">1</button>`;
    if (startP > 2) html += `<span class="page-ellipsis">…</span>`;
  }
  for (let i = startP; i <= endP; i++) {
    html += `<button class="page-btn${i === p ? " page-btn--active" : ""}" onclick="acGoPage(${i})">${i}</button>`;
  }
  if (endP < total) {
    if (endP < total - 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" onclick="acGoPage(${total})">${total}</button>`;
  }
  html += `<button class="page-btn${p === total ? " disabled" : ""}" onclick="acGoPage(${p + 1})" ${p === total ? "disabled" : ""}>Next →</button>`;
  html += `<span class="page-info">${s}–${e} of ${state.acFiltered.length}</span>`;
  el.innerHTML = `<div class="pagination-wrap">${html}</div>`;
}

function acGoPage(p) {
  state.acPage = p;
  renderACTable();
}

function toggleACBookmark(id) {
  if (state.acBookmarks[id]) delete state.acBookmarks[id];
  else state.acBookmarks[id] = true;
  saveProgress();
  renderACTable();
}

function isACReviewDue(id) {
  const nd = state.acReviewData[id]?.nextReviewDate;
  return nd ? nd <= dateStr(new Date()) : false;
}

function setACSearch(val) {
  state.acFilters.search = val;
  applyACFilters();
  updateACClearBtn();
}

function setACStatusFilter(val) {
  state.acFilters.status = val;
  applyACFilters();
  updateACClearBtn();
}

function toggleACStarredFilter() {
  state.acFilters.starred = !state.acFilters.starred;
  document
    .getElementById("ac-filter-starred-btn")
    ?.classList.toggle("active", state.acFilters.starred);
  applyACFilters();
  updateACClearBtn();
}

function toggleACReviewFilter() {
  state.acFilters.review = !state.acFilters.review;
  document
    .getElementById("ac-filter-review-btn")
    ?.classList.toggle("active", state.acFilters.review);
  applyACFilters();
  updateACClearBtn();
}

function setACDiffFilter(which, val) {
  const v = parseInt(val);
  if (which === "min") state.acFilters.minDiff = v;
  else state.acFilters.maxDiff = v;
  applyACFilters();
  updateACClearBtn();
}

function updateACClearBtn() {
  const btn = document.getElementById("ac-clear-filters");
  if (!btn) return;
  const f = state.acFilters;
  const dirty =
    f.search ||
    f.status !== "all" ||
    f.minDiff !== 0 ||
    f.maxDiff !== 4000 ||
    f.starred ||
    f.review;
    btn.style.display = dirty ? "inline-block" : "none";
}

function clearACFilters() {
  state.acFilters = {
    search: "",
    minDiff: 0,
    maxDiff: 4000,
    status: "all",
    starred: false,
    review: false,
  };
  const searchEl = document.getElementById("ac-search-input");
  if (searchEl) searchEl.value = "";
  const statusSel = document.getElementById("ac-status-select");
  if (statusSel) statusSel.value = "all";
  document.getElementById("ac-filter-starred-btn")?.classList.remove("active");
  document.getElementById("ac-filter-review-btn")?.classList.remove("active");
  applyACFilters();
  updateACClearBtn();
}

function exportACProgress() {
  const data = {
    exportedAt: new Date().toISOString(),
    acSolved: state.acSolved,
    acActivity: state.acActivity,
    acUsername: state.acUsername || null,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `algotrack-ac-backup-${dateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows, filename) {
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
    type: "text/csv",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportLCFilteredCSV() {
  const rows = [["ID", "Title", "Difficulty", "Acceptance", "Tags", "Solved", "SolveDate"]];
  state.filtered.forEach((q) => {
    rows.push([q.id, `"${q.title}"`, q.difficulty, q.acceptance, `"${(q.tags || []).join(";")}"`, state.solved[q.id] ? "Yes" : "No", state.solved[q.id] || ""]);
  });
  downloadCSV(rows, `algotrack-lc-filtered-${dateStr(new Date())}.csv`);
}

function exportCFFilteredCSV() {
  const rows = [["Contest", "Index", "Name", "Rating", "Tags", "Solved", "SolveDate"]];
  state.cfFiltered.forEach((p) => {
    const key = cfProblemKey(p.contestId, p.index);
    rows.push([p.contestId, p.index, `"${p.name}"`, p.rating || "", `"${(p.tags || []).join(";")}"`, state.cfSolved[key] ? "Yes" : "No", state.cfSolved[key] || ""]);
  });
  downloadCSV(rows, `algotrack-cf-filtered-${dateStr(new Date())}.csv`);
}

function exportACFilteredCSV() {
  const rows = [["ID", "Title", "Difficulty", "Contest", "Solved", "SolveDate"]];
  state.acFiltered.forEach((p) => {
    rows.push([p.id, `"${p.title}"`, p.difficulty ?? "", p.contestId, state.acSolved[p.id] ? "Yes" : "No", state.acSolved[p.id] || ""]);
  });
  downloadCSV(rows, `algotrack-ac-filtered-${dateStr(new Date())}.csv`);
}

function renderProfileAC() {
  const acBadge = document.getElementById("profile-ac-badge");
  if (acBadge) {
    if (state.acUserInfo) {
      const handle = state.acUserInfo.handle;
      const acAvatar = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&size=56&background=4f46e5&color=fff&rounded=true" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle">`;
      acBadge.innerHTML = `${acAvatar}<span class="lc-dot" style="background:var(--accent)"></span> AtCoder: <a href="https://atcoder.jp/users/${handle}" target="_blank">@${handle}</a> <button class="lc-disconnect-btn" onclick="disconnectAC()">Disconnect</button>`;
    } else {
      acBadge.innerHTML = `<button class="btn-lc-connect" onclick="switchPlatform('ac'); showPage('tracker')">+ Connect AtCoder</button>`;
    }
  }
  renderProfileACStats();
  renderProfileACDiffDist();
  renderACRecentSolves();
  renderACNotesSearch();
}

function renderProfileACStats() {
  const el = document.getElementById("profile-ac-stats");
  if (!el) return;
  const solved = Object.keys(state.acSolved).length;
  const total = Object.values(state.acMeta).filter(
    (p) => p.difficulty != null,
  ).length;
  const pct = total ? Math.round((solved / total) * 100) : 0;

  const stats = calcStreaks();
  const streak = stats.ac.current; 

  el.innerHTML = `
    <div class="cf-profile-stats">
      <div class="cf-profile-stat"><div class="cf-profile-stat-val accent">${solved}</div><div class="cf-profile-stat-label">Solved</div></div>
      <div class="cf-profile-stat"><div class="cf-profile-stat-val">${total.toLocaleString()}</div><div class="cf-profile-stat-label">Rated Total</div></div>
      <div class="cf-profile-stat"><div class="cf-profile-stat-val accent">${pct}%</div><div class="cf-profile-stat-label">Done</div></div>
      <div class="cf-profile-stat"><div class="cf-profile-stat-val streak-text">${streak}🔥</div><div class="cf-profile-stat-label">Day Streak</div></div>
    </div>`;
}

function renderProfileACDiffDist() {
  const el = document.getElementById("profile-ac-diff-dist");
  if (!el) return;
  const bands = [
    { label: "0–399 (Gray)", min: 0, max: 399, color: "#808080" },
    { label: "400–799 (Brown)", min: 400, max: 799, color: "#804000" },
    { label: "800–1199 (Green)", min: 800, max: 1199, color: "#008000" },
    { label: "1200–1599 (Teal)", min: 1200, max: 1599, color: "#00c0c0" },
    { label: "1600–1999 (Blue)", min: 1600, max: 1999, color: "#0000ff" },
    { label: "2000–2399 (Yel.)", min: 2000, max: 2399, color: "#c0c000" },
    { label: "2400–2799 (Org.)", min: 2400, max: 2799, color: "#ff8000" },
    { label: "2800+ (Red)", min: 2800, max: Infinity, color: "#ff0000" },
  ];
  const data = bands
    .map((b) => {
      const total = Object.values(state.acMeta).filter(
        (p) =>
          p.difficulty != null &&
          p.difficulty >= b.min &&
          p.difficulty <= b.max,
      ).length;
      const solved = Object.values(state.acMeta).filter((p) => {
        if (
          p.difficulty == null ||
          p.difficulty < b.min ||
          p.difficulty > b.max
        )
          return false;
        return !!state.acSolved[p.id];
      }).length;
      return { ...b, total, solved };
    })
    .filter((b) => b.total > 0);
  el.innerHTML = data
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
    .join("");
}

function renderACRecentSolves() {
  const el = document.getElementById("ac-recent-solves");
  if (!el) return;
  const recent = Object.entries(state.acSolved)
    .map(([id, date]) => ({ id, date }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-recent">No solves yet. Connect AtCoder and hit Sync! 🚀</div>`;
    return;
  }
  el.innerHTML = recent
    .map(({ id, date }) => {
      const p = state.acMeta[id];
      if (!p) return "";
      const link = `https://atcoder.jp/contests/${p.contestId}/tasks/${id}`;
      const diffColor = acDiffColor(p.difficulty);
      return `<div class="recent-item">
      <span style="background:${diffColor};width:6px;height:6px;border-radius:50%;display:inline-block;flex-shrink:0;margin-top:3px"></span>
      <div class="recent-title-wrap"><a href="${link}" target="_blank" class="recent-title">${p.title}</a></div>
      <span class="recent-date">${formatDate(date)}</span>
      ${p.difficulty != null ? `<span style="font-size:11px;color:${diffColor};font-weight:600">${p.difficulty}</span>` : ""}
    </div>`;
    })
    .join("");
}

function renderACInsights() {
  renderACInsightsRibbon();
  renderACInsightsDiffDist();
  renderACInsightsSolveRate();
  renderACInsightsWeekly();
  renderACNextToSolve();
}

function renderACInsightsRibbon() {
  const el = document.getElementById("ac-insights-ribbon");
  if (!el) return;
  const allProblems = Object.values(state.acMeta);
  const ratedTotal = allProblems.filter((p) => p.difficulty != null).length;
  const solved = Object.keys(state.acSolved).length;
  const pct = ratedTotal ? Math.round((solved / ratedTotal) * 100) : 0;
  
  const stats = calcStreaks();
  const streak = stats.ac.current;
  
  const starred = Object.keys(state.acBookmarks || {}).length;
  const reviewDue = Object.keys(state.acSolved).filter((id) =>
    isACReviewDue(id),
  ).length;
  
  el.innerHTML = `
    <div class="ribbon-item"><div class="ribbon-val">${ratedTotal.toLocaleString()}</div><div class="ribbon-label">Rated Problems</div></div>
    <div class="ribbon-item"><div class="ribbon-val accent-text">${solved}</div><div class="ribbon-label">Solved</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${pct}%</div><div class="ribbon-label">Completion</div></div>
    <div class="ribbon-item"><div class="ribbon-val streak-text">${streak}🔥</div><div class="ribbon-label">Day Streak</div></div>
    
    <!-- UPDATED: Now clickable to show AtCoder bookmarks -->
    <div class="ribbon-item" style="cursor:pointer" onclick="switchPlatform('ac'); showPage('tracker'); state.acFilters.starred=true; applyACFilters();">
      <div class="ribbon-val" style="color:var(--accent)">★ ${starred}</div>
      <div class="ribbon-label">Bookmarked</div>
    </div>

    ${reviewDue > 0 ? `<div class="ribbon-item" style="cursor:pointer" onclick="switchPlatform('ac'); showPage('tracker'); state.acFilters.review=true; applyACFilters()"><div class="ribbon-val" style="color:var(--yellow)">↺ ${reviewDue}</div><div class="ribbon-label">Due Review</div></div>` : ""}
  `;
}

function renderACInsightsDiffDist() {
  const el = document.getElementById("ac-insights-rating-chart");
  if (!el) return;
  const bands = [
    { label: "0–399", min: 0, max: 399, color: "#808080" },
    { label: "400–799", min: 400, max: 799, color: "#804000" },
    { label: "800–1199", min: 800, max: 1199, color: "#008000" },
    { label: "1200–1599", min: 1200, max: 1599, color: "#00c0c0" },
    { label: "1600–1999", min: 1600, max: 1999, color: "#0000ff" },
    { label: "2000–2399", min: 2000, max: 2399, color: "#c0c000" },
    { label: "2400–2799", min: 2400, max: 2799, color: "#ff8000" },
    { label: "2800+", min: 2800, max: Infinity, color: "#ff0000" },
  ];
  const data = bands
    .map((b) => {
      const total = Object.values(state.acMeta).filter(
        (p) =>
          p.difficulty != null &&
          p.difficulty >= b.min &&
          p.difficulty <= b.max,
      ).length;
      const solved = Object.values(state.acMeta).filter((p) => {
        if (
          p.difficulty == null ||
          p.difficulty < b.min ||
          p.difficulty > b.max
        )
          return false;
        return !!state.acSolved[p.id];
      }).length;
      return { ...b, total, solved };
    })
    .filter((b) => b.total > 0);
  el.innerHTML = data
    .map((r) => {
      const solvedPct = r.total ? Math.round((r.solved / r.total) * 100) : 0;
      return `<div class="solve-row">
        <div class="solve-row-top">
          <span style="color:${r.color};min-width:90px">${r.label}</span>
          <span class="solve-nums">${r.solved} / ${r.total}</span>
          <span class="solve-pct">${solvedPct}%</span>
        </div>
        <div class="solve-bar-bg">
          <div class="solve-bar-fill" style="width:${solvedPct}%;background:${r.color}"></div>
        </div>
      </div>`;
    })
    .join("");
}

function renderACInsightsSolveRate() {
  const el = document.getElementById("ac-insights-solve-rate");
  if (!el) return;
  const bands = [
    { label: "0–399", min: 0, max: 399, color: "#808080" },
    { label: "400–799", min: 400, max: 799, color: "#804000" },
    { label: "800–1199", min: 800, max: 1199, color: "#008000" },
    { label: "1200–1599", min: 1200, max: 1599, color: "#00c0c0" },
    { label: "1600–1999", min: 1600, max: 1999, color: "#0000ff" },
    { label: "2000–2399", min: 2000, max: 2399, color: "#c0c000" },
    { label: "2400+", min: 2400, max: Infinity, color: "#ff8000" },
  ];
  const data = bands
    .map((b) => {
      const total = Object.values(state.acMeta).filter(
        (p) =>
          p.difficulty != null &&
          p.difficulty >= b.min &&
          p.difficulty <= b.max,
      ).length;
      const solved = Object.values(state.acMeta).filter((p) => {
        if (
          p.difficulty == null ||
          p.difficulty < b.min ||
          p.difficulty > b.max
        )
          return false;
        return !!state.acSolved[p.id];
      }).length;
      return { ...b, total, solved };
    })
    .filter((b) => b.total > 0);
  const totalSolved = data.reduce((s, r) => s + r.solved, 0);
  el.innerHTML = `
    <div class="solve-overall"><div class="solve-overall-num accent-text">${totalSolved} <span>solved</span></div><div class="solve-overall-label">Total AC problems solved</div></div>
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

function renderACInsightsWeekly() {
  const el = document.getElementById("ac-insights-weekly");
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
    for (const date of Object.values(state.acSolved)) {
      const d = new Date(date);
      if (d >= weekStart && d <= weekEnd) count++;
    }
    weeks.push({
      label: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count,
    });
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

function renderACRadar() {
  const el = document.getElementById("ac-radar-chart");
  if (!el) return;

  const bands = [
    { label: "~400", min: 0, max: 399 },
    { label: "~800", min: 400, max: 799 },
    { label: "~1200", min: 800, max: 1199 },
    { label: "~1600", min: 1200, max: 1599 },
    { label: "~2000", min: 1600, max: 1999 },
    { label: "~2400", min: 2000, max: 2399 },
    { label: "2400+", min: 2400, max: Infinity },
  ];

  const data = bands
    .map((b) => {
      const total = Object.values(state.acMeta).filter(
        (p) =>
          p.difficulty != null &&
          p.difficulty >= b.min &&
          p.difficulty <= b.max,
      ).length;
      const solved = Object.values(state.acMeta).filter(
        (p) =>
          p.difficulty != null &&
          p.difficulty >= b.min &&
          p.difficulty <= b.max &&
          !!state.acSolved[p.id],
      ).length;
      return { label: b.label, total, solved };
    })
    .filter((b) => b.total > 0);

  if (!data.length) {
    el.innerHTML = `<div class="empty-insights" style="padding:40px 0;text-align:center;color:var(--text-muted)">Solve more AC problems to see radar.</div>`;
    return;
  }

  const labels = data.map((b) => b.label);
  const values = data.map((b) => (b.total ? b.solved / b.total : 0));
  const rawData = data.map((b) => ({ solved: b.solved, total: b.total }));
  renderRadarChart("ac-radar-chart", labels, values, "#4f46e5", rawData);
}

function pickRandomAC(content) {
  const pool =
    state.acFiltered.length > 0
      ? state.acFiltered
      : Object.values(state.acMeta);
  if (!pool.length) {
    content.innerHTML = `<div class="random-empty">No AC problems loaded! Connect AtCoder first.</div>`;
    return;
  }
  const unsolved = pool.filter((p) => !state.acSolved[p.id]);
  const source = unsolved.length > 0 ? unsolved : pool;
  const p = source[Math.floor(Math.random() * source.length)];
  const solved = !!state.acSolved[p.id];
  const link = `https://atcoder.jp/contests/${p.contestId}/tasks/${p.id}`;
  const diffColor = acDiffColor(p.difficulty);
  content.innerHTML = `
    <div class="random-problem-card">
      <div class="random-problem-meta">
        ${
          p.difficulty != null
            ? `<span style="font-weight:700;color:${diffColor}">${p.difficulty} · ${acDiffLabel(p.difficulty)}</span>`
            : `<span style="color:var(--text-muted)">Unrated</span>`
        }
        <span class="random-problem-id">${p.id}</span>
        ${solved ? '<span class="random-solved-badge">✓ Solved</span>' : ""}
      </div>
      <div class="random-problem-title">${p.title}</div>
      ${p.solvedCount ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Solved by ${p.solvedCount >= 1000 ? (p.solvedCount / 1000).toFixed(1) + "k" : p.solvedCount} users</div>` : ""}
      <a href="${link}" target="_blank" class="btn-primary random-open-btn">Open on AtCoder →</a>
    </div>`;
}

async function init() {
  initTheme();
  const sb = getSupabase();
  loadLocalProgress();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session) {
    state.user = session.user;
    await loadProgressFromSupabase();
  }

  sb.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      state.user = session.user;
      await loadProgressFromSupabase();
      renderAuthArea();
      renderProfilePage();
    } else {
      state.user = null;
      state.lcUsername = null;
      state.cfUsername = null;
      state.acUsername = null;
      state.solved = {};
      state.activity = {};
      state.bookmarks = {};
      state.notes = {};
      state.reviewData = {};
      state.cfSolved = {};
      state.cfActivity = {};
      state.cfBookmarks = {};
      state.cfNotes = {};
      state.cfReviewData = {};
      state.cfUserInfo = null;
      state.acSolved = {};
      state.acActivity = {};
      state.acBookmarks = {};
      state.acNotes = {};
      state.acReviewData = {};
      state.acUserInfo = null;
      localStorage.removeItem("leet_local");
      localStorage.removeItem("lc_last_sync");
      localStorage.removeItem("cf_rivals");
      localStorage.removeItem("ac_rivals");
    }
    renderAuthArea();
  });

  renderAuthArea();
  await Promise.all([loadLCProblems(), initCF(), initAC()]);

  document.getElementById("loading").style.display = "none";
  document.getElementById("main-content").style.display = "block";

  if (state.lcUsername) {
    fetchLCUserInfo();
    setTimeout(() => syncLeetCode(true), 8000);
  }

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
      patterns: [],
      status: "all",
      starred: false,
      review: false,
    };
    document.getElementById("search-input").value = "";
    document.getElementById("filter-starred-btn")?.classList.remove("active");
    document.getElementById("filter-review-btn")?.classList.remove("active");
    renderDiffPills();
    clearPatternFilters();
    renderPatternCheckboxList("");
    updateStatusDropdown();
    state.sortCol = "id";
    state.sortDir = "asc";
    updateSortBtn();
    applyFilters();
    renderActiveLCPatterns();
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

  document
    .getElementById("lc-username-input")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveLCUsername();
    });

  initKeyboardShortcuts();
  applyFilters();
  initRouting();

  Promise.all([
    fetch("/api/contests-proxy?platform=cf")
      .then((r) => r.json())
      .then((data) => {
        contestsState.cfContests = data;
        contestsState.cfLoaded = true;
      })
      .catch(() => {}),
    fetch("/api/contests-proxy?platform=ac")
      .then((r) => r.json())
      .then((data) => {
        contestsState.acContests = data;
        contestsState.acLoaded = true;
      })
      .catch(() => {}),
  ]).then(() => initNavContestBadge());

  renderSyncBanner();

  setTimeout(checkOnboarding, 800);

  renderCuratedDropdown("lc");
  renderCuratedDropdown("cf");
  renderCuratedDropdown("ac");
}

const contestsState = {
  cfContests: [],
  cfContestHistory: [],
  cfHistoryFiltered: [],
  cfHistoryPage: 1,
  cfPastVisible: 10,
  cfLoaded: false,
  cfHistoryLoaded: false,
  cfParticipatedOnly: false,

  acContests: [],
  acContestHistory: [],
  acHistoryFiltered: [],
  acHistoryPage: 1,
  acPastVisible: 10,
  acLoaded: false,
  acHistoryLoaded: false,
  acParticipatedOnly: false,

  activePlatform: "cf",

  cfRivals: [],
  cfRivalsLoaded: false,
  acRivals: [],
  acRivalsLoaded: false,
  navBadgeTimer: null,
};

const CONTEST_CACHE_TTL = {
  cfContests: 6 * 60 * 60 * 1000,
  cfHistory: 1 * 60 * 60 * 1000,
  acContests: 6 * 60 * 60 * 1000,
  acHistory: 1 * 60 * 60 * 1000,
};

function getContestCache(key) {
  try {
    const raw = localStorage.getItem(`contest_cache_${key}`);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CONTEST_CACHE_TTL[key]) return null;
    return data;
  } catch (_) {
    return null;
  }
}

function setContestCache(key, data) {
  try {
    localStorage.setItem(
      `contest_cache_${key}`,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch (_) {}
}

function clearContestCache(key) {
  try {
    localStorage.removeItem(`contest_cache_${key}`);
  } catch (_) {}
}

async function refreshContestData() {
  const plat = contestsState.activePlatform;
  showToast(`Refreshing ${plat.toUpperCase()} contests...`, "info");

  if (plat === "cf") {
    clearContestCache("cfContests");
    clearContestCache("cfHistory");
    await loadCFContests(true);
    await loadCFContestHistory();
  } else {
    clearContestCache("acContests");
    clearContestCache("acHistory");
    await loadACContests(true);
    await loadACContestHistory();
  }
  showToast("Contest data updated!");
}

const CONTESTS_HISTORY_PER_PAGE = 15;

function initContestsPage() {
  const plat = contestsState.activePlatform || "cf";
  renderContestsPlatformTabs(plat);
  if (plat === "cf") initCFContestsSection();
  else initACContestsSection();
}

function switchContestPlatform(plat) {
  contestsState.activePlatform = plat;
  renderContestsPlatformTabs(plat);
  document.getElementById("contests-cf-section").style.display =
    plat === "cf" ? "" : "none";
  document.getElementById("contests-ac-section").style.display =
    plat === "ac" ? "" : "none";
  if (plat === "cf") initCFContestsSection();
  else initACContestsSection();
  window.location.hash = `contests/${plat}`;
}

function renderContestsPlatformTabs(plat) {
  document.getElementById("ctab-cf")?.classList.toggle("active", plat === "cf");
  document.getElementById("ctab-ac")?.classList.toggle("active", plat === "ac");
}

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtContestDate(epochSeconds) {
  return new Date(epochSeconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelativeTime(epochSeconds) {
  const diff = epochSeconds * 1000 - Date.now();
  const abs = Math.abs(diff);
  const sign = diff < 0 ? "ago" : "in";
  if (abs < 60000) return "just now";
  if (abs < 3600000)
    return `${sign === "in" ? "in " : ""}${Math.round(abs / 60000)}m ${sign === "ago" ? " ago" : ""}`.trim();
  if (abs < 86400000)
    return `${sign === "in" ? "in " : ""}${Math.round(abs / 3600000)}h ${sign === "ago" ? " ago" : ""}`.trim();
  return `${sign === "in" ? "in " : ""}${Math.round(abs / 86400000)}d ${sign === "ago" ? " ago" : ""}`.trim();
}

function cfContestDivLabel(name) {
  if (/div\.?\s*1[^234]/i.test(name)) return { text: "Div. 1", cls: "div1" };
  if (/div\.?\s*2/i.test(name)) return { text: "Div. 2", cls: "div2" };
  if (/div\.?\s*3/i.test(name)) return { text: "Div. 3", cls: "div3" };
  if (/div\.?\s*4/i.test(name)) return { text: "Div. 4", cls: "div4" };
  if (/educational/i.test(name)) return { text: "Educational", cls: "edu" };
  if (/global/i.test(name)) return { text: "Global", cls: "global" };
  return null;
}

function acContestCategory(id) {
  if (/^abc\d/i.test(id))
    return { text: "ABC", cls: "abc", fullName: "AtCoder Beginner Contest" };
  if (/^arc\d/i.test(id))
    return { text: "ARC", cls: "arc", fullName: "AtCoder Regular Contest" };
  if (/^agc\d/i.test(id))
    return { text: "AGC", cls: "agc", fullName: "AtCoder Grand Contest" };
  if (/^ahc\d/i.test(id))
    return { text: "AHC", cls: "ahc", fullName: "AtCoder Heuristic Contest" };
  return { text: "Other", cls: "ac-other", fullName: "Contest" };
}

function ratingDeltaBadge(delta) {
  if (delta == null) return "";
  const sign = delta > 0 ? "+" : "";
  const cls = delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-zero";
  return `<span class="rating-delta ${cls}">${sign}${delta}</span>`;
}

async function initCFContestsSection() {
  const hasUser = !!state.cfUserInfo;
  document.getElementById("cf-contest-user-panel").style.display = hasUser
    ? ""
    : "none";
  document.getElementById("cf-contest-no-user").style.display = hasUser
    ? "none"
    : "";

  if (hasUser) {
    document.getElementById("cf-contests-user-tag").textContent =
      `@${state.cfUserInfo.handle} · ${cfRatingLabel(state.cfUserInfo.rating)} ${state.cfUserInfo.rating || "Unrated"}`;
    if (!contestsState.cfHistoryLoaded) {
      await loadCFContestHistory();
    } else {
      renderCFContestHistory();
      renderCFRatingGraph();
      renderCFContestRibbon();
      renderCFBestContests();
      renderCFRankDistribution();
      renderCFImprovementTips();
      renderCFPersonalRecords();
      initCFUpsolver();
      initCFRatingPredictor();
      initCFRivals();
      loadSavedCFRivals();
    }
  }

  if (!contestsState.cfLoaded) {
    await loadCFContests();
  } else {
    renderCFContestLists();
  }
  renderCFRadar();
}

function renderRadarChart(elId, labels, values, color, rawData) {
  const el = document.getElementById(elId);
  if (!el) return;
  const N = labels.length;
  if (!N) return;

  const W = 360,
    H = 360,
    cx = 180,
    cy = 172,
    R = 118;
  const angle = (i) => i * ((2 * Math.PI) / N) - Math.PI / 2;
  const pt = (i, r) => [
    cx + r * Math.cos(angle(i)),
    cy + r * Math.sin(angle(i)),
  ];
  const getColor = (v) =>
    v >= 0.7 ? "#4ade80" : v >= 0.4 ? "#facc15" : "#f87171";

  let rings = "";
  [0.25, 0.5, 0.75, 1.0].forEach((frac, gi) => {
    const pts = Array.from({ length: N }, (_, i) =>
      pt(i, R * frac)
        .map((v) => v.toFixed(1))
        .join(","),
    ).join(" ");
    rings += `<polygon points="${pts}" fill="${gi === 3 ? "var(--bg-4)" : "none"}" stroke="var(--border)" stroke-width="${gi === 3 ? 1.2 : 0.7}" opacity="${gi === 3 ? 0.5 : 0.6}" stroke-dasharray="${gi < 3 ? "4,3" : "none"}"/>`;
    if (gi < 3) {
      const labelY = (cy - R * frac - 5).toFixed(1);
      rings += `<text x="${cx + 4}" y="${labelY}" text-anchor="start" font-size="8" fill="var(--text-dim)" font-family="var(--mono)" opacity="0.55">${frac * 100}%</text>`;
    }
  });

  let axes = "";
  for (let i = 0; i < N; i++) {
    const [x1, y1] = pt(i, R);
    const [lx, ly] = pt(i, R + 28);
    const v = values[i];
    const axisColor = getColor(v);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${axisColor}" stroke-width="1" opacity="0.35"/>`;
    const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
    const textY = ly > cy ? ly + 5 : ly - 4;
    const pct = Math.round(v * 100);
    const shortLabel = labels[i];
    axes += `<text text-anchor="${anchor}" font-family="var(--mono)" font-size="9.5" font-weight="600" fill="var(--text)" x="${lx.toFixed(1)}" y="${textY.toFixed(1)}">${shortLabel}</text>`;
    axes += `<text text-anchor="${anchor}" font-family="var(--mono)" font-size="9" font-weight="700" fill="${axisColor}" x="${lx.toFixed(1)}" y="${(parseFloat(textY) + 11).toFixed(1)}">${pct}%</text>`;
  }

  const shapePts = values
    .map((v, i) =>
      pt(i, R * Math.min(Math.max(v, 0.02), 1))
        .map((x) => x.toFixed(1))
        .join(","),
    )
    .join(" ");

  const dots = values
    .map((v, i) => {
      const [x, y] = pt(i, R * Math.min(Math.max(v, 0.02), 1));
      const dotColor = getColor(v);
      const pct = Math.round(v * 100);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${dotColor}" stroke="var(--bg-1)" stroke-width="2" opacity="0.95">
      <animate attributeName="r" values="4.5;6.5;4.5" dur="2.4s" begin="${i * 0.18}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="transparent" style="cursor:pointer">
      <title>${labels[i]}: ${pct}%</title>
    </circle>`;
    })
    .join("");

  const legend = `<g transform="translate(${cx - 100}, ${H - 18})">
    <rect width="8" height="8" rx="2" fill="#4ade80"/><text x="12" y="8" font-size="8.5" fill="var(--text-muted)" font-family="var(--mono)">Strong ≥70%</text>
    <rect x="85" width="8" height="8" rx="2" fill="#facc15"/><text x="97" y="8" font-size="8.5" fill="var(--text-muted)" font-family="var(--mono)">OK ≥40%</text>
    <rect x="155" width="8" height="8" rx="2" fill="#f87171"/><text x="167" y="8" font-size="8.5" fill="var(--text-muted)" font-family="var(--mono)">Weak</text>
  </g>`;

  const svgId = `radar-svg-${elId}`;
  el.innerHTML = `
    <div class="radar-click-hint">Click to see details</div>
    <svg id="${svgId}" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;margin:0 auto;overflow:visible;cursor:pointer">
      <defs>
        <radialGradient id="radar-grad-${elId}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.05"/>
        </radialGradient>
        <filter id="radar-glow-${elId}">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      ${rings}${axes}
      <polygon points="${shapePts}" fill="url(#radar-grad-${elId})" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" filter="url(#radar-glow-${elId})">
        <animate attributeName="opacity" values="0;1" dur="0.6s" fill="freeze"/>
      </polygon>
      ${dots}${legend}
    </svg>`;

  el.querySelector("svg").addEventListener("click", () => {
    openRadarModal(elId, labels, values, color, rawData);
  });
  el.style.cursor = "pointer";
}

function openRadarModal(elId, labels, values, color, rawData) {
  const isCF = elId.startsWith("cf");
  const title = isCF ? "Tag Coverage Analysis" : "Difficulty Coverage Analysis";
  const subtitle = isCF
    ? `${state.cfUsername || "You"} · Codeforces`
    : `${state.acUsername || "You"} · AtCoder`;

  const getColor = (v) =>
    v >= 0.7 ? "#4ade80" : v >= 0.4 ? "#facc15" : "#f87171";
  const getBg = (v) =>
    v >= 0.7
      ? "rgba(74,222,128,0.10)"
      : v >= 0.4
        ? "rgba(250,204,21,0.10)"
        : "rgba(248,113,113,0.10)";
  const getTier = (v) =>
    v >= 0.7 ? "Strong" : v >= 0.5 ? "Good" : v >= 0.3 ? "Developing" : "Weak";
  const getTierColor = (v) =>
    v >= 0.7
      ? "#4ade80"
      : v >= 0.5
        ? "#a3e635"
        : v >= 0.3
          ? "#facc15"
          : "#f87171";

  const totalSolved = rawData ? rawData.reduce((s, d) => s + d.solved, 0) : 0;
  const totalProbs = rawData ? rawData.reduce((s, d) => s + d.total, 0) : 0;
  const overallPct = totalProbs
    ? Math.round((totalSolved / totalProbs) * 100)
    : 0;
  const sorted = labels
    .map((l, i) => ({ l, v: values[i], raw: rawData?.[i] }))
    .sort((a, b) => b.v - a.v);
  const weakest = sorted[sorted.length - 1];
  const strongest = sorted[0];
  const avgPct = Math.round(
    (values.reduce((s, v) => s + v, 0) / values.length) * 100,
  );

  const N = labels.length;
  const W = 260,
    H = 260,
    cx = 130,
    cy = 125,
    R = 90;
  const ang = (i) => i * ((2 * Math.PI) / N) - Math.PI / 2;
  const mpt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];

  let mRings = "";
  [0.25, 0.5, 0.75, 1.0].forEach((f, gi) => {
    const pts = Array.from({ length: N }, (_, i) =>
      mpt(i, R * f)
        .map((v) => v.toFixed(1))
        .join(","),
    ).join(" ");
    mRings += `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="${gi === 3 ? 1 : 0.5}" opacity="${gi === 3 ? 0.6 : 0.4}" stroke-dasharray="${gi < 3 ? "3,3" : "none"}"/>`;
  });
  let mAxes = "";
  for (let i = 0; i < N; i++) {
    const [x1, y1] = mpt(i, R);
    mAxes += `<line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${getColor(values[i])}" stroke-width="0.8" opacity="0.3"/>`;
    const [lx, ly] = mpt(i, R + 20);
    const anchor = lx < cx - 8 ? "end" : lx > cx + 8 ? "start" : "middle";
    mAxes += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${anchor}" font-size="8.5" font-family="var(--mono)" fill="var(--text-muted)">${labels[i]}</text>`;
  }
  const mShape = values
    .map((v, i) =>
      mpt(i, R * Math.min(Math.max(v, 0.02), 1))
        .map((x) => x.toFixed(1))
        .join(","),
    )
    .join(" ");
  const mDots = values
    .map((v, i) => {
      const [x, y] = mpt(i, R * Math.min(Math.max(v, 0.02), 1));
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${getColor(v)}" stroke="var(--bg-1)" stroke-width="1.5"/>`;
    })
    .join("");

  const miniRadar = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;margin:0 auto;overflow:visible">
    <defs>
      <radialGradient id="modal-radar-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.05"/>
      </radialGradient>
    </defs>
    ${mRings}${mAxes}
    <polygon points="${mShape}" fill="url(#modal-radar-grad)" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    ${mDots}
  </svg>`;

  const rankedRows = sorted
    .map((item, rank) => {
      const pct = Math.round(item.v * 100);
      const c = getColor(item.v);
      const bg = getBg(item.v);
      const tier = getTier(item.v);
      const solved = item.raw?.solved ?? "—";
      const total = item.raw?.total ?? "—";
      const remaining = item.raw ? item.raw.total - item.raw.solved : "—";
      const rankEmoji =
        rank === 0
          ? "🥇"
          : rank === 1
            ? "🥈"
            : rank === 2
              ? "🥉"
              : `${rank + 1}.`;

      const tierMarkers = `
      <div style="position:absolute;left:30%;top:-4px;height:calc(100%+8px);width:1px;background:rgba(250,204,21,0.4)"></div>
      <div style="position:absolute;left:50%;top:-4px;height:calc(100%+8px);width:1px;background:rgba(163,230,53,0.4)"></div>
      <div style="position:absolute;left:70%;top:-4px;height:calc(100%+8px);width:1px;background:rgba(74,222,128,0.4)"></div>
    `;

      return `<div class="rdm-row" style="background:${bg};border-left:3px solid ${c}">
      <div class="rdm-rank">${rankEmoji}</div>
      <div class="rdm-label-block">
        <div class="rdm-label">${item.l}</div>
        <div class="rdm-tier" style="color:${c}">${tier}</div>
      </div>
      <div class="rdm-bar-col">
        <div class="rdm-bar-track" style="position:relative">
          ${tierMarkers}
          <div class="rdm-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${c}99,${c})"></div>
        </div>
        <div class="rdm-bar-labels">
          <span style="color:var(--text-dim)">0%</span>
          <span style="color:rgba(250,204,21,0.7)">30%</span>
          <span style="color:rgba(163,230,53,0.7)">50%</span>
          <span style="color:rgba(74,222,128,0.7)">70%</span>
          <span style="color:var(--text-dim)">100%</span>
        </div>
      </div>
      <div class="rdm-stats">
        <div class="rdm-pct" style="color:${c}">${pct}%</div>
        <div class="rdm-counts">${solved}/${total}</div>
        <div class="rdm-remaining" style="color:var(--text-muted)">${typeof remaining === "number" ? remaining + " left" : ""}</div>
      </div>
    </div>`;
    })
    .join("");

  const priority = sorted
    .filter((d) => d.v < 0.5)
    .slice(0, 3)
    .map(
      (d) =>
        `<span class="rdm-pill rdm-pill-warn">📌 Focus: ${d.l} (${Math.round(d.v * 100)}%)</span>`,
    )
    .join("");
  const strong = sorted
    .filter((d) => d.v >= 0.7)
    .map((d) => `<span class="rdm-pill rdm-pill-ok">✓ ${d.l}</span>`)
    .join("");

  let overlay = document.getElementById("radar-detail-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "radar-detail-overlay";
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "9999";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `<div class="modal rdm-modal" onclick="event.stopPropagation()">

    <!-- Header -->
    <div class="rdm-header">
      <div>
        <div class="rdm-title">🕸️ ${title}</div>
        <div class="rdm-subtitle">${subtitle}</div>
      </div>
      <button class="sp-close-btn" onclick="document.getElementById('radar-detail-overlay').style.display='none'">✕</button>
    </div>

    <!-- Top summary ribbon -->
    <div class="rdm-ribbon">
      <div class="rdm-ribbon-stat">
        <div class="rdm-ribbon-val" style="color:var(--accent)">${overallPct}%</div>
        <div class="rdm-ribbon-label">Overall Coverage</div>
      </div>
      <div class="rdm-ribbon-stat">
        <div class="rdm-ribbon-val">${totalSolved}</div>
        <div class="rdm-ribbon-label">Problems Solved</div>
      </div>
      <div class="rdm-ribbon-stat">
        <div class="rdm-ribbon-val">${totalProbs}</div>
        <div class="rdm-ribbon-label">Total Problems</div>
      </div>
      <div class="rdm-ribbon-stat">
        <div class="rdm-ribbon-val">${avgPct}%</div>
        <div class="rdm-ribbon-label">Avg Solve Rate</div>
      </div>
      <div class="rdm-ribbon-stat">
        <div class="rdm-ribbon-val" style="color:#f87171">${Math.round(weakest.v * 100)}%</div>
        <div class="rdm-ribbon-label">Weakest: ${weakest.l}</div>
      </div>
      <div class="rdm-ribbon-stat">
        <div class="rdm-ribbon-val" style="color:#4ade80">${Math.round(strongest.v * 100)}%</div>
        <div class="rdm-ribbon-label">Strongest: ${strongest.l}</div>
      </div>
    </div>

    <!-- Body: radar + breakdown side by side -->
    <div class="rdm-body">

      <!-- Left: radar + insight pills -->
      <div class="rdm-left">
        <div class="rdm-section-label">Skill Web</div>
        ${miniRadar}
        <div class="rdm-legend">
          <span><span class="rdm-dot" style="background:#f87171"></span>Weak &lt;30%</span>
          <span><span class="rdm-dot" style="background:#facc15"></span>Dev ≥30%</span>
          <span><span class="rdm-dot" style="background:#a3e635"></span>Good ≥50%</span>
          <span><span class="rdm-dot" style="background:#4ade80"></span>Strong ≥70%</span>
        </div>
        ${
          priority || strong
            ? `<div class="rdm-pills-section">
          ${priority ? `<div class="rdm-pills-group">${priority}</div>` : ""}
          ${strong ? `<div class="rdm-pills-group">${strong}</div>` : ""}
        </div>`
            : ""
        }
      </div>

      <!-- Right: ranked breakdown -->
      <div class="rdm-right">
        <div class="rdm-section-label">Breakdown by ${isCF ? "Tag" : "Difficulty Band"} <span style="font-weight:400;color:var(--text-dim)">(ranked by solve rate)</span></div>
        <div class="rdm-rows">${rankedRows}</div>
      </div>
    </div>
  </div>`;

  overlay.style.display = "flex";
}

async function loadCFContests(force = false) {
  if (contestsState.cfLoaded && !force) return;
  setContestLoadingState("cf-upcoming-contests", true);
  setContestLoadingState("cf-past-contests", true);
  try {
    const cached = !force && getContestCache("cfContests");
    if (cached) {
      contestsState.cfContests = cached;
      contestsState.cfLoaded = true;
    } else {
      const res = await fetch("/api/contests-proxy?platform=cf", {
        headers: { "User-Agent": "AlgoTrack/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      contestsState.cfContests = await res.json();
      contestsState.cfLoaded = true;
      setContestCache("cfContests", contestsState.cfContests);
    }
    renderCFContestLists();
    initNavContestBadge();
    initCFRecommender();
  } catch (err) {
    setContestError(
      "cf-upcoming-contests",
      `Failed to load contests: ${err.message}`,
    );
    setContestError("cf-past-contests", "");
  }
}

async function loadCFContestHistory() {
  if (!state.cfUsername) return;
  const btn = document.getElementById("cf-contest-user-panel");
  try {
    const cacheKey = `cfHistory_${state.cfUsername}`;
    const cached = getContestCache(cacheKey) || getContestCache("cfHistory");
    if (cached && cached.handle === state.cfUsername) {
      contestsState.cfContestHistory = cached.history;
    } else {
      const res = await fetch(
        `/api/contests-proxy?platform=cf-history&handle=${encodeURIComponent(state.cfUsername)}`,
        { headers: { "User-Agent": "AlgoTrack/1.0" } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      contestsState.cfContestHistory = await res.json();
      setContestCache("cfHistory", {
        handle: state.cfUsername,
        history: contestsState.cfContestHistory,
      });
    }
    contestsState.cfHistoryFiltered = [
      ...contestsState.cfContestHistory,
    ].reverse();
    contestsState.cfHistoryLoaded = true;
    renderCFContestHistory();
    renderCFRatingGraph();
    renderCFContestRibbon();
    renderCFBestContests();
    renderCFRankDistribution();
    renderCFImprovementTips();
    renderCFPersonalRecords();
    initCFUpsolver();
    initCFRatingPredictor();
    initCFRivals();
    loadSavedCFRivals();
  } catch (err) {
    console.warn("[contests] CF history load failed:", err.message);
  }
}

function renderCFContestLists() {
  const now = Math.floor(Date.now() / 1000);
  const upcoming = contestsState.cfContests
    .filter((c) => c.startTimeSeconds > now)
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  const live = contestsState.cfContests.filter((c) => c.phase === "CODING");
  const past = contestsState.cfContests
    .filter((c) => c.phase === "FINISHED")
    .sort((a, b) => b.startTimeSeconds - a.startTimeSeconds);

  const liveSection = document.getElementById("cf-live-section");
  if (live.length) {
    liveSection.style.display = "";
    document.getElementById("cf-live-contests").innerHTML = live
      .map((c) => renderCFContestCard(c, "live"))
      .join("");
  } else {
    liveSection.style.display = "none";
  }

  const upcomingEl = document.getElementById("cf-upcoming-contests");
  if (upcoming.length) {
    upcomingEl.innerHTML = upcoming
      .slice(0, 20)
      .map((c) => renderCFContestCard(c, "upcoming"))
      .join("");
  } else {
    upcomingEl.innerHTML = `<div class="contests-empty">No upcoming contests scheduled right now. Check back soon!</div>`;
  }

  const pastEl = document.getElementById("cf-past-contests");
  let pastFiltered = past;
  if (contestsState.cfParticipatedOnly) {
    if (!state.cfUsername) {
      pastFiltered = [];
    } else if (contestsState.cfContestHistory.length) {
      const ids = new Set(
        contestsState.cfContestHistory.map((h) => h.contestId),
      );
      pastFiltered = past.filter((c) => ids.has(c.id));
    } else if (!contestsState.cfHistoryLoaded) {
      pastEl.innerHTML = `<div class="contests-empty">Loading your contest history…</div>`;
      document.getElementById("cf-past-count").textContent = "loading…";
      document.getElementById("cf-past-more-btn").style.display = "none";
      return;
    } else {
      pastFiltered = [];
    }
  }
  const toShow = pastFiltered.slice(0, contestsState.cfPastVisible);
  pastEl.innerHTML = toShow.length
    ? toShow.map((c) => renderCFContestCard(c, "past")).join("")
    : `<div class="contests-empty">${contestsState.cfParticipatedOnly ? "No participated contests found." : "No past contests."}</div>`;
  document.getElementById("cf-past-count").textContent =
    contestsState.cfParticipatedOnly
      ? `${pastFiltered.length} participated`
      : `${past.length} total`;
  const moreBtn = document.getElementById("cf-past-more-btn");
  moreBtn.style.display =
    pastFiltered.length > contestsState.cfPastVisible ? "" : "none";
}

function showMoreCFPast() {
  contestsState.cfPastVisible += 20;
  renderCFContestLists();
}

function renderCFContestCard(c, type) {
  const now = Math.floor(Date.now() / 1000);
  const div = cfContestDivLabel(c.name);
  const link = `https://codeforces.com/contest/${c.id}`;
  const startMs = c.startTimeSeconds;
  const durStr = fmtDuration(c.durationSeconds);

  let timeInfo = "";
  if (type === "upcoming") {
    timeInfo = `<span class="contest-time-badge upcoming-badge">Starts ${fmtRelativeTime(startMs)} · ${fmtContestDate(startMs)}</span>`;
  } else if (type === "live") {
    const endEpoch = startMs + c.durationSeconds;
    timeInfo = `<span class="contest-time-badge live-badge">🔴 Ends ${fmtRelativeTime(endEpoch)}</span>`;
  } else {
    timeInfo = `<span class="contest-time-badge past-badge">${fmtContestDate(startMs)}</span>`;
  }

  let userResult = "";
  if (contestsState.cfContestHistory.length) {
    const entry = contestsState.cfContestHistory.find(
      (h) => h.contestId === c.id,
    );
    if (entry) {
      if (type === "past") {
        const delta = entry.newRating - entry.oldRating;
        userResult = `<div class="contest-user-result">
          <span class="contest-participated-tag">✓ Participated</span>
          <span class="contest-rank-pill">Rank #${entry.rank}</span>
          ${ratingDeltaBadge(delta)}
          <span class="contest-rating-after">${entry.newRating}</span>
        </div>`;
      } else {
        userResult = `<div class="contest-user-result">
          <span class="contest-participated-tag">✓ Participated</span>
        </div>`;
      }
    }
  }

  const clickable =
    type === "past"
      ? `onclick="openCFContestDetail(${c.id})" style="cursor:pointer"`
      : "";
  return `<div class="contest-card ${type}-card" ${clickable}>
    <div class="contest-card-top">
      <div class="contest-card-name-row">
        ${div ? `<span class="contest-div-badge ${div.cls}">${div.text}</span>` : ""}
        <a href="${link}" target="_blank" class="contest-name">${c.name}</a>
      </div>
      <span class="contest-duration">${durStr}</span>
    </div>
    <div class="contest-card-bottom">
      ${timeInfo}
      ${userResult}
      <a href="${link}" target="_blank" class="contest-open-btn" onclick="event.stopPropagation()">Open →</a>
      ${type === "upcoming" ? `<a href="https://codeforces.com/contest/${c.id}/register" target="_blank" class="contest-register-btn" onclick="event.stopPropagation()">Register</a>` : ""}
    </div>
  </div>`;
}
function filterCFContestHistory(search) {
  const q = (search || "").toLowerCase();
  const resultFilter =
    document.getElementById("cf-contest-result-filter")?.value || "all";
  const hist = [...contestsState.cfContestHistory].reverse();

  contestsState.cfHistoryFiltered = hist.filter((h) => {
    if (q && !h.contestName.toLowerCase().includes(q)) return false;
    const delta = h.newRating - h.oldRating;
    if (resultFilter === "up" && delta <= 0) return false;
    if (resultFilter === "down" && delta >= 0) return false;
    if (resultFilter === "good") {
      if (delta <= 0) return false;
    }
    return true;
  });

  contestsState.cfHistoryPage = 1;
  renderCFContestHistoryTable();
}

function renderCFContestHistory() {
  contestsState.cfHistoryFiltered = [
    ...contestsState.cfContestHistory,
  ].reverse();
  contestsState.cfHistoryPage = 1;
  renderCFContestHistoryTable();
}

function renderCFContestHistoryTable() {
  const el = document.getElementById("cf-contest-history-table");
  if (!el) return;
  const data = contestsState.cfHistoryFiltered;
  const page = contestsState.cfHistoryPage;
  const start = (page - 1) * CONTESTS_HISTORY_PER_PAGE;
  const pageData = data.slice(start, start + CONTESTS_HISTORY_PER_PAGE);

  if (!data.length) {
    el.innerHTML = `<div class="contests-empty">No contests match your filters.</div>`;
    renderCFHistoryPagination(0);
    return;
  }

  el.innerHTML = `
    <table class="contests-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Contest</th>
          <th>Date</th>
          <th>Rank</th>
          <th>Old Rating</th>
          <th>New Rating</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        ${pageData
          .map((h, i) => {
            const delta = h.newRating - h.oldRating;
            const contestLink = `https://codeforces.com/contest/${h.contestId}`;
            const idx = data.length - start - i;
            return `<tr class="contest-history-row ${delta > 0 ? "ch-up" : delta < 0 ? "ch-down" : ""}">
            <td class="ch-num">${idx}</td>
            <td class="ch-name"><a href="${contestLink}" target="_blank">${h.contestName}</a></td>
            <td class="ch-date">${fmtContestDate(h.ratingUpdateTimeSeconds)}</td>
            <td class="ch-rank">#${h.rank.toLocaleString()}</td>
            <td class="ch-old" style="color:${cfRatingColor(h.oldRating)}">${h.oldRating}</td>
            <td class="ch-new" style="color:${cfRatingColor(h.newRating)}">${h.newRating}</td>
            <td class="ch-delta">${ratingDeltaBadge(delta)}</td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;

  renderCFHistoryPagination(data.length);
}

function renderCFHistoryPagination(total) {
  const el = document.getElementById("cf-contest-history-pagination");
  if (!el) return;
  const totalPages = Math.ceil(total / CONTESTS_HISTORY_PER_PAGE);
  if (totalPages <= 1) {
    el.innerHTML = "";
    return;
  }
  const p = contestsState.cfHistoryPage;
  let html = "";
  if (p > 1)
    html += `<button class="page-btn" onclick="cfHistoryGoPage(${p - 1})">← Prev</button>`;
  html += `<span class="page-info">Page ${p} / ${totalPages}</span>`;
  if (p < totalPages)
    html += `<button class="page-btn" onclick="cfHistoryGoPage(${p + 1})">Next →</button>`;
  el.innerHTML = `<div class="pagination-wrap">${html}</div>`;
}

function cfHistoryGoPage(p) {
  contestsState.cfHistoryPage = p;
  renderCFContestHistoryTable();
}

function renderCFRatingGraph() {
  const el = document.getElementById("cf-rating-graph");
  if (!el) return;
  const hist = contestsState.cfContestHistory;
  if (!hist.length) {
    el.innerHTML = `<div class="contests-empty">No contest history yet.</div>`;
    return;
  }

  const W = 700,
    H = 220,
    PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const ratings = hist.map((h) => h.newRating);
  const minR = Math.min(...ratings, 800) - 100;
  const maxR = Math.max(...ratings) + 100;
  const times = hist.map((h) => h.ratingUpdateTimeSeconds);
  const minT = times[0],
    maxT = times[times.length - 1];

  function xOf(t) {
    return PAD.left + ((t - minT) / (maxT - minT || 1)) * innerW;
  }
  function yOf(r) {
    return PAD.top + innerH - ((r - minR) / (maxR - minR || 1)) * innerH;
  }

  const zones = [
    { min: 800, max: 1200, color: "#80808018" },
    { min: 1200, max: 1400, color: "#00800018" },
    { min: 1400, max: 1600, color: "#03a89e18" },
    { min: 1600, max: 1900, color: "#0000ff18" },
    { min: 1900, max: 2100, color: "#aa00aa18" },
    { min: 2100, max: 2400, color: "#ff8c0018" },
    { min: 2400, max: 4000, color: "#ff000018" },
  ];

  const zoneRects = zones
    .map((z) => {
      const y1 = yOf(Math.min(z.max, maxR));
      const y2 = yOf(Math.max(z.min, minR));
      if (y1 >= y2) return "";
      return `<rect x="${PAD.left}" y="${y1}" width="${innerW}" height="${y2 - y1}" fill="${z.color}"/>`;
    })
    .join("");

  const yTicks = [];
  const step = Math.ceil((maxR - minR) / 5 / 100) * 100;
  for (let r = Math.ceil(minR / step) * step; r <= maxR; r += step) {
    const y = yOf(r);
    yTicks.push(`
      <line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4"/>
      <text x="${PAD.left - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="var(--text-muted)" font-family="var(--mono)">${r}</text>
    `);
  }

  const points = hist
    .map(
      (h) =>
        `${xOf(h.ratingUpdateTimeSeconds).toFixed(1)},${yOf(h.newRating).toFixed(1)}`,
    )
    .join(" ");
  const fillPoints = `${xOf(times[0]).toFixed(1)},${(PAD.top + innerH).toFixed(1)} ${points} ${xOf(times[times.length - 1]).toFixed(1)},${(PAD.top + innerH).toFixed(1)}`;

  const dots = hist
    .map((h, i) => {
      const cx = xOf(h.ratingUpdateTimeSeconds).toFixed(1);
      const cy = yOf(h.newRating).toFixed(1);
      const color = cfRatingColor(h.newRating);
      const delta = h.newRating - h.oldRating;
      const tip = `${h.contestName}: ${h.newRating} (${delta > 0 ? "+" : ""}${delta})`;
      return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${color}" stroke="var(--bg-2)" stroke-width="1.5" opacity="0.9">
      <title>${tip}</title>
    </circle>`;
    })
    .join("");

  const peakIdx = ratings.indexOf(Math.max(...ratings));
  const peakH = hist[peakIdx];
  const peakX = xOf(peakH.ratingUpdateTimeSeconds).toFixed(1);
  const peakY = yOf(peakH.newRating).toFixed(1);

  const labelStep = Math.max(1, Math.floor(hist.length / 6));
  const xLabels = hist
    .filter((_, i) => i % labelStep === 0)
    .map((h) => {
      const x = xOf(h.ratingUpdateTimeSeconds).toFixed(1);
      const label = new Date(
        h.ratingUpdateTimeSeconds * 1000,
      ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return `<text x="${x}" y="${PAD.top + innerH + 18}" text-anchor="middle" font-size="9" fill="var(--text-muted)" font-family="var(--mono)">${label}</text>`;
    })
    .join("");

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="rating-graph-svg" preserveAspectRatio="xMidYMid meet">
      ${zoneRects}
      ${yTicks.join("")}
      <polygon points="${fillPoints}" fill="var(--accent)" opacity="0.08"/>
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>
      ${dots}
      <circle cx="${peakX}" cy="${peakY}" r="5" fill="#81c784" stroke="var(--bg-2)" stroke-width="1.5">
        <title>Peak: ${peakH.newRating}</title>
      </circle>
      ${xLabels}
    </svg>
  `;
}

function renderCFContestRibbon() {
  const el = document.getElementById("cf-contests-ribbon");
  if (!el) return;
  const hist = contestsState.cfContestHistory;
  if (!hist.length) {
    el.innerHTML = "";
    return;
  }

  const ratings = hist.map((h) => h.newRating);
  const deltas = hist.map((h) => h.newRating - h.oldRating);
  const bestDelta = Math.max(...deltas);
  const worstDelta = Math.min(...deltas);
  const totalContests = hist.length;
  const wins = deltas.filter((d) => d > 0).length;
  const current = state.cfUserInfo?.rating || ratings[ratings.length - 1];
  const peak = Math.max(...ratings);

  el.innerHTML = `
    <div class="ribbon-item"><div class="ribbon-val" style="color:${cfRatingColor(current)}">${current}</div><div class="ribbon-label">Current</div></div>
    <div class="ribbon-item"><div class="ribbon-val" style="color:${cfRatingColor(peak)}">${peak}</div><div class="ribbon-label">Peak</div></div>
    <div class="ribbon-item"><div class="ribbon-val">${totalContests}</div><div class="ribbon-label">Contests</div></div>
    <div class="ribbon-item"><div class="ribbon-val" style="color:var(--green)">${wins}</div><div class="ribbon-label">Rating ↑</div></div>
    <div class="ribbon-item"><div class="ribbon-val" style="color:var(--red)">${totalContests - wins}</div><div class="ribbon-label">Rating ↓</div></div>
    <div class="ribbon-item"><div class="ribbon-val delta-up">+${bestDelta}</div><div class="ribbon-label">Best Gain</div></div>
    <div class="ribbon-item"><div class="ribbon-val delta-down">${worstDelta}</div><div class="ribbon-label">Worst Loss</div></div>
  `;
}

function renderCFBestContests() {
  const el = document.getElementById("cf-best-contests");
  if (!el) return;
  const hist = [...contestsState.cfContestHistory];
  if (!hist.length) {
    el.innerHTML = `<div class="contests-empty">No contest history.</div>`;
    return;
  }

  const best = [...hist]
    .sort((a, b) => b.newRating - b.oldRating - (a.newRating - a.oldRating))
    .slice(0, 5);
  el.innerHTML = best
    .map((h, i) => {
      const delta = h.newRating - h.oldRating;
      const link = `https://codeforces.com/contest/${h.contestId}`;
      return `<div class="best-contest-row">
      <span class="best-rank-num">${i + 1}</span>
      <div class="best-contest-info">
        <a href="${link}" target="_blank" class="best-contest-name">${h.contestName}</a>
        <span class="best-contest-meta">Rank #${h.rank} · ${new Date(h.ratingUpdateTimeSeconds * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
      </div>
      <div class="best-contest-rating">
        ${ratingDeltaBadge(delta)}
        <span style="color:${cfRatingColor(h.newRating)};font-size:11px">${h.newRating}</span>
      </div>
    </div>`;
    })
    .join("");
}

function renderCFRankDistribution() {
  const el = document.getElementById("cf-rank-distribution");
  if (!el) return;
  const hist = contestsState.cfContestHistory;
  if (!hist.length) {
    el.innerHTML = `<div class="contests-empty">No contest history.</div>`;
    return;
  }

  const buckets = [
    { label: "Top 100", max: 100 },
    { label: "Top 500", max: 500 },
    { label: "Top 1k", max: 1000 },
    { label: "Top 5k", max: 5000 },
    { label: "Top 10k", max: 10000 },
    { label: "10k+", max: Infinity },
  ];

  const counts = new Array(buckets.length).fill(0);
  for (const h of hist) {
    for (let i = 0; i < buckets.length; i++) {
      if (h.rank <= buckets[i].max) {
        counts[i]++;
        break;
      }
    }
  }
  const maxCount = Math.max(...counts, 1);
  el.innerHTML = buckets
    .map((b, i) => {
      const pct = Math.round((counts[i] / maxCount) * 100);
      return `<div class="rank-dist-row">
      <span class="rank-dist-label">${b.label}</span>
      <div class="rank-dist-bar-bg"><div class="rank-dist-bar" style="width:${pct}%"></div></div>
      <span class="rank-dist-count">${counts[i]}</span>
    </div>`;
    })
    .join("");
}

function renderCFImprovementTips() {
  const el = document.getElementById("cf-improvement-tips");
  if (!el) return;

  const tips = [];
  const hist = contestsState.cfContestHistory;
  const solved = Object.keys(state.cfSolved).length;
  const userRating = state.cfUserInfo?.rating || 0;

  if (!hist.length && !solved) {
    el.innerHTML = `<div class="contests-empty">Solve problems and participate in contests to unlock personalized tips.</div>`;
    return;
  }

  if (hist.length >= 3) {
    const recent3 = [...hist].slice(-3).map((h) => h.newRating - h.oldRating);
    if (recent3.every((d) => d < 0)) {
      tips.push({
        icon: "⚠️",
        text: "You've lost rating in 3 consecutive contests. Stop and upsove problems from those contests — competing more won't fix the underlying gaps.",
        cls: "tip-warn",
      });
    }
  }
  if (hist.length >= 5) {
    const recent5 = [...hist].slice(-5);
    const netMove =
      recent5[recent5.length - 1].newRating - recent5[0].oldRating;
    if (Math.abs(netMove) < 50) {
      tips.push({
        icon: "📊",
        text: `Your rating has barely moved (${netMove > 0 ? "+" : ""}${netMove}) across your last 5 contests. You've hit a plateau — switch from quantity to quality: pick one weak tag and drill it for 2 weeks.`,
        cls: "tip-warn",
      });
    }
  }

  if (hist.length) {
    const lastContestTs = [...hist].slice(-1)[0].ratingUpdateTimeSeconds;
    const daysSince = Math.floor((Date.now() / 1000 - lastContestTs) / 86400);
    if (daysSince > 30) {
      tips.push({
        icon: "📅",
        text: `Your last rated contest was ${daysSince} days ago. Regular participation (at least 2× per month) is essential for consistent rating growth.`,
        cls: "tip-neutral",
      });
    }
  }

  if (userRating) {
    const targetRating = userRating + 200;
    const metaLoaded = Object.keys(state.cfMeta || {}).length > 0;
    if (metaLoaded) {
      const solvable = Object.values(state.cfMeta).filter(
        (p) =>
          p.rating >= userRating &&
          p.rating <= targetRating &&
          !state.cfSolved[cfProblemKey(p.contestId, p.index)],
      ).length;
      tips.push({
        icon: "🎯",
        text: `${solvable} unsolved problems rated ${userRating}–${targetRating} are waiting. Solving these is the fastest path to ${cfRatingLabel(targetRating)} territory.`,
        cls: "tip-info",
      });
    } else {
      tips.push({
        icon: "🎯",
        text: `Target problems rated ${userRating}–${targetRating} (just above your current rating). These are your highest-leverage problems right now.`,
        cls: "tip-info",
      });
    }
  }

  if (userRating && Object.keys(state.cfMeta || {}).length) {
    const solvedRatings = Object.keys(state.cfSolved)
      .map((key) => {
        const [contestId, index] = key.split("_");
        return state.cfMeta[key]?.rating || null;
      })
      .filter((r) => r != null);
    if (solvedRatings.length >= 10) {
      const avgSolved = Math.round(
        solvedRatings.reduce((s, v) => s + v, 0) / solvedRatings.length,
      );
      if (avgSolved < userRating - 200) {
        tips.push({
          icon: "📈",
          text: `Your average solved difficulty (${avgSolved}) is ${userRating - avgSolved} points below your rating. You're grinding easy problems — push into ${userRating}–${userRating + 300} rated problems to actually grow.`,
          cls: "tip-warn",
        });
      }
    }
  }

  if (Object.keys(state.cfMeta || {}).length) {
    const tagStats = {};
    for (const p of Object.values(state.cfMeta)) {
      if (!p.rating || p.rating > userRating + 300) continue;
      const key = cfProblemKey(p.contestId, p.index);
      const isSolved = !!state.cfSolved[key];
      for (const tag of p.tags || []) {
        if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
        tagStats[tag].total++;
        if (isSolved) tagStats[tag].solved++;
      }
    }
    const weak = Object.entries(tagStats)
      .filter(([, v]) => v.total >= 10 && v.solved / v.total < 0.3)
      .sort((a, b) => a[1].solved / a[1].total - b[1].solved / b[1].total)
      .slice(0, 3)
      .map(([tag]) => tag);
    if (weak.length) {
      tips.push({
        icon: "📉",
        text: `Weak tags in your rating range: <strong>${weak.join(", ")}</strong> (< 30% solve rate). One focused week on each will compound into real rating gains.`,
        cls: "tip-warn",
      });
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyKey = thirtyDaysAgo.toISOString().slice(0, 10);
  const recentDays30 = Object.entries(state.cfActivity || {})
    .filter(([date]) => date >= thirtyKey)
    .reduce((s, [, v]) => s + v, 0);
  if (recentDays30 < 20) {
    tips.push({
      icon: "📚",
      text: `Only ${recentDays30} CF problems solved in the last 30 days. Aim for 2–3 problems daily — contest stamina is built through consistent practice, not bursts.`,
      cls: "tip-neutral",
    });
  }

  if (hist.length) {
    const bestRank = Math.min(...hist.map((h) => h.rank));
    if (bestRank > 2000) {
      tips.push({
        icon: "🚀",
        text: `Best rank so far: #${bestRank.toLocaleString()}. To break top 1000, you need A+B solved within 15 minutes. Practice speed on easy problems before each contest.`,
        cls: "tip-info",
      });
    }
  }

  if (!tips.length) {
    tips.push({
      icon: "✅",
      text: "Strong form! Keep contesting regularly, upsove after every round, and push into problems just above your rating.",
      cls: "tip-info",
    });
  }

  el.innerHTML = tips
    .map(
      (t) => `
    <div class="tip-card ${t.cls}">
      <span class="tip-icon">${t.icon}</span>
      <div class="tip-text">${t.text}</div>
    </div>
  `,
    )
    .join("");
}

async function initACContestsSection() {
  const hasUser = !!state.acUserInfo;
  document.getElementById("ac-contest-user-panel").style.display = hasUser
    ? ""
    : "none";
  document.getElementById("ac-contest-no-user").style.display = hasUser
    ? "none"
    : "";

  if (hasUser) {
    document.getElementById("ac-contests-user-tag").textContent =
      `@${state.acUserInfo.handle}`;
    if (!contestsState.acHistoryLoaded) {
      await loadACContestHistory();
    } else {
      renderACContestHistory();
      renderACRatingGraph();
      renderACBestContests();
      renderACPerfStats();
      renderACImprovementTips();
      renderACPersonalRecords();
      initACUpsolver();
      initACRatingPredictor();
      initACRivals();
      loadSavedACRivals();
    }
  }

  if (!contestsState.acLoaded) {
    await loadACContests();
  } else {
    renderACContestLists();
  }

  renderACRadar();
}

async function loadACContests(force = false) {
  if (contestsState.acLoaded && !force) return;
  setContestLoadingState("ac-upcoming-contests", true);
  setContestLoadingState("ac-past-contests", true);
  try {
    const cached = !force && getContestCache("acContests");
    if (cached) {
      contestsState.acContests = cached;
      contestsState.acLoaded = true;
    } else {
      const res = await fetch("/api/contests-proxy?platform=ac");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      contestsState.acContests = await res.json();
      contestsState.acLoaded = true;
      setContestCache("acContests", contestsState.acContests);
    }
    renderACContestLists();
    initNavContestBadge();
    initACRecommender();
  } catch (err) {
    setContestError(
      "ac-upcoming-contests",
      `Failed to load contests: ${err.message}`,
    );
    setContestError("ac-past-contests", "");
  }
}

async function loadACContestHistory() {
  if (!state.acUsername) return;
  try {
    const cacheKey = `acHistory_${state.acUsername}`;
    const cached = getContestCache(cacheKey) || getContestCache("acHistory");

    if (cached && cached.handle === state.acUsername) {
      contestsState.acContestHistory = cached.history;
    } else {
      const res = await fetch(
        `/api/contests-proxy?platform=ac-history&handle=${encodeURIComponent(state.acUsername)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawHistory = await res.json();
      contestsState.acContestHistory = rawHistory || [];
      setContestCache("acHistory", {
        handle: state.acUsername,
        history: contestsState.acContestHistory,
      });
    }

    contestsState.acHistoryFiltered = [
      ...contestsState.acContestHistory,
    ].reverse();
    contestsState.acHistoryLoaded = true;

    renderACContestHistory();
    renderACRatingGraph();
    renderACBestContests();
    renderACPerfStats();
    renderACImprovementTips();
    renderACPersonalRecords();
    initACUpsolver();
    initACRatingPredictor();
    initACRivals();
    loadSavedACRivals();
  } catch (err) {
    console.warn("[contests] AC history load failed:", err.message);
  }
}

function renderACContestLists() {
  const now = Math.floor(Date.now() / 1000);
  const upcoming = contestsState.acContests
    .filter((c) => c.start_epoch_second > now)
    .sort((a, b) => a.start_epoch_second - b.start_epoch_second);
  const live = contestsState.acContests.filter(
    (c) =>
      c.start_epoch_second <= now &&
      c.start_epoch_second + c.duration_second > now,
  );
  const past = contestsState.acContests
    .filter((c) => c.start_epoch_second + c.duration_second <= now)
    .sort((a, b) => b.start_epoch_second - a.start_epoch_second);

  const liveSection = document.getElementById("ac-live-section");
  if (live.length) {
    liveSection.style.display = "";
    document.getElementById("ac-live-contests").innerHTML = live
      .map((c) => renderACContestCard(c, "live"))
      .join("");
  } else {
    liveSection.style.display = "none";
  }

  const upcomingEl = document.getElementById("ac-upcoming-contests");
  if (upcoming.length) {
    upcomingEl.innerHTML = upcoming
      .slice(0, 20)
      .map((c) => renderACContestCard(c, "upcoming"))
      .join("");
  } else {
    upcomingEl.innerHTML = `<div class="contests-empty">No upcoming AtCoder contests scheduled. Check back soon!</div>`;
  }

  const pastEl = document.getElementById("ac-past-contests");
  let pastFiltered = past;
  if (contestsState.acParticipatedOnly) {
    if (!state.acUsername) {
      pastFiltered = [];
    } else if (!contestsState.acHistoryLoaded) {
      pastEl.innerHTML = `<div class="contests-empty">Loading your contest history…</div>`;
      document.getElementById("ac-past-count").textContent = "loading…";
      document.getElementById("ac-past-more-btn").style.display = "none";
      return;
    } else if (contestsState.acContestHistory.length) {
      const ids = new Set(
        contestsState.acContestHistory.map((h) =>
          (h.ContestScreenName || "").toLowerCase(),
        ),
      );
      pastFiltered = past.filter((c) => ids.has((c.id || "").toLowerCase()));
    } else {
      pastFiltered = [];
    }
  }
  const toShow = pastFiltered.slice(0, contestsState.acPastVisible);
  pastEl.innerHTML = toShow.length
    ? toShow.map((c) => renderACContestCard(c, "past")).join("")
    : `<div class="contests-empty">${contestsState.acParticipatedOnly ? "No participated contests found." : "No past contests."}</div>`;
  document.getElementById("ac-past-count").textContent =
    contestsState.acParticipatedOnly
      ? `${pastFiltered.length} participated`
      : `${past.length} total`;
  const moreBtn = document.getElementById("ac-past-more-btn");
  moreBtn.style.display =
    pastFiltered.length > contestsState.acPastVisible ? "" : "none";
}

function showMoreACPast() {
  contestsState.acPastVisible += 20;
  renderACContestLists();
}

function renderACContestCard(c, type) {
  const id = c.id;
  const cat = acContestCategory(id);
  const link = `https://atcoder.jp/contests/${id}`;
  const startMs = c.start_epoch_second;
  const durStr = fmtDuration(c.duration_second);
  const rateChange = c.rate_change || "";

  let timeInfo = "";
  if (type === "upcoming") {
    timeInfo = `<span class="contest-time-badge upcoming-badge">Starts ${fmtRelativeTime(startMs)} · ${fmtContestDate(startMs)}</span>`;
  } else if (type === "live") {
    const endEpoch = startMs + c.duration_second;
    timeInfo = `<span class="contest-time-badge live-badge">🔴 Ends ${fmtRelativeTime(endEpoch)}</span>`;
  } else {
    timeInfo = `<span class="contest-time-badge past-badge">${fmtContestDate(startMs)}</span>`;
  }

  let userResult = "";
  if (contestsState.acContestHistory.length) {
    const entry = contestsState.acContestHistory.find(
      (h) =>
        h.ContestScreenName === id ||
        (h.ContestScreenName || "").toLowerCase() === id.toLowerCase(),
    );
    if (entry) {
      if (type === "past") {
        const delta = entry.NewRating - entry.OldRating;
        userResult = `<div class="contest-user-result">
          <span class="contest-participated-tag">✓ Participated</span>
          <span class="contest-rank-pill">Rank #${entry.Place}</span>
          ${entry.IsRated ? ratingDeltaBadge(delta) : `<span class="rating-delta delta-zero">Unrated</span>`}
          ${entry.IsRated ? `<span class="contest-rating-after">${entry.NewRating}</span>` : ""}
        </div>`;
      } else {
        userResult = `<div class="contest-user-result">
          <span class="contest-participated-tag">✓ Participated</span>
        </div>`;
      }
    }
  }

  const clickable =
    type === "past"
      ? `onclick="openACContestDetail('${id}')" style="cursor:pointer"`
      : "";
  return `<div class="contest-card ${type}-card" ${clickable}>
    <div class="contest-card-top">
      <div class="contest-card-name-row">
        <span class="contest-div-badge ${cat.cls}" title="${cat.fullName}">${cat.text}</span>
        <a href="${link}" target="_blank" class="contest-name">${c.title}</a>
        ${rateChange ? `<span class="contest-rate-change">${rateChange}</span>` : ""}
      </div>
      <span class="contest-duration">${durStr}</span>
    </div>
    <div class="contest-card-bottom">
      ${timeInfo}
      ${userResult}
      <a href="${link}" target="_blank" class="contest-open-btn" onclick="event.stopPropagation()">Open →</a>
      ${type === "upcoming" ? `<a href="${link}/register" target="_blank" class="contest-register-btn" onclick="event.stopPropagation()">Register</a>` : ""}
    </div>
  </div>`;
}

function filterACContestHistory(search) {
  const q = (search || "").toLowerCase();
  const resultFilter =
    document.getElementById("ac-contest-result-filter")?.value || "all";
  const hist = [...contestsState.acContestHistory].reverse();

  contestsState.acHistoryFiltered = hist.filter((h) => {
    const name = (h.ContestScreenName || "").toLowerCase();
    if (q && !name.includes(q)) return false;
    if (resultFilter === "rated" && !h.IsRated) return false;
    const delta = h.NewRating - h.OldRating;
    if (resultFilter === "up" && delta <= 0) return false;
    if (resultFilter === "down" && delta >= 0) return false;
    return true;
  });

  contestsState.acHistoryPage = 1;
  renderACContestHistoryTable();
}

function renderACContestHistory() {
  contestsState.acHistoryFiltered = [
    ...contestsState.acContestHistory,
  ].reverse();
  contestsState.acHistoryPage = 1;
  renderACContestHistoryTable();
}

function renderACContestHistoryTable() {
  const el = document.getElementById("ac-contest-history-table");
  if (!el) return;
  const data = contestsState.acHistoryFiltered;
  const page = contestsState.acHistoryPage;
  const start = (page - 1) * CONTESTS_HISTORY_PER_PAGE;
  const pageData = data.slice(start, start + CONTESTS_HISTORY_PER_PAGE);

  if (!data.length) {
    el.innerHTML = `<div class="contests-empty">No contests match your filters.</div>`;
    renderACHistoryPagination(0);
    return;
  }

  el.innerHTML = `
    <table class="contests-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Contest</th>
          <th>Rank</th>
          <th>Performance</th>
          <th>Old Rating</th>
          <th>New Rating</th>
          <th>Change</th>
          <th>Rated</th>
        </tr>
      </thead>
      <tbody>
        ${pageData
          .map((h, i) => {
            const delta = h.NewRating - h.OldRating;
            const link = `https://atcoder.jp/contests/${h.ContestScreenName}`;
            const idx = data.length - start - i;
            const cat = acContestCategory(h.ContestScreenName || "");
            return `<tr class="contest-history-row ${h.IsRated && delta > 0 ? "ch-up" : h.IsRated && delta < 0 ? "ch-down" : ""}">
            <td class="ch-num">${idx}</td>
            <td class="ch-name">
              <span class="contest-div-badge ${cat.cls} sm">${cat.text}</span>
              <a href="${link}" target="_blank">${h.ContestScreenName}</a>
            </td>
            <td class="ch-rank">#${(h.Place || 0).toLocaleString()}</td>
            <td class="ch-perf" style="color:${acDiffColor(h.Performance)}">${h.Performance ?? "—"}</td>
            <td class="ch-old">${h.IsRated ? `<span style="color:${acDiffColor(h.OldRating)}">${h.OldRating}</span>` : "—"}</td>
            <td class="ch-new">${h.IsRated ? `<span style="color:${acDiffColor(h.NewRating)}">${h.NewRating}</span>` : "—"}</td>
            <td class="ch-delta">${h.IsRated ? ratingDeltaBadge(delta) : '<span style="color:var(--text-muted);font-size:10px">N/A</span>'}</td>
            <td class="ch-rated">${h.IsRated ? '<span class="rated-dot">●</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;

  renderACHistoryPagination(data.length);
}

function renderACHistoryPagination(total) {
  const el = document.getElementById("ac-contest-history-pagination");
  if (!el) return;
  const totalPages = Math.ceil(total / CONTESTS_HISTORY_PER_PAGE);
  if (totalPages <= 1) {
    el.innerHTML = "";
    return;
  }
  const p = contestsState.acHistoryPage;
  let html = "";
  if (p > 1)
    html += `<button class="page-btn" onclick="acHistoryGoPage(${p - 1})">← Prev</button>`;
  html += `<span class="page-info">Page ${p} / ${totalPages}</span>`;
  if (p < totalPages)
    html += `<button class="page-btn" onclick="acHistoryGoPage(${p + 1})">Next →</button>`;
  el.innerHTML = `<div class="pagination-wrap">${html}</div>`;
}

function acHistoryGoPage(p) {
  contestsState.acHistoryPage = p;
  renderACContestHistoryTable();
}

function renderACRatingGraph() {
  const el = document.getElementById("ac-rating-graph");
  if (!el) return;
  const ratedHist = contestsState.acContestHistory.filter((h) => h.IsRated);
  if (!ratedHist.length) {
    el.innerHTML = `<div class="contests-empty">No rated contest history yet.</div>`;
    return;
  }

  const W = 700,
    H = 220,
    PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const ratings = ratedHist.map((h) => h.NewRating);
  const perfs = ratedHist.map((h) => h.Performance || h.NewRating);
  const minR = Math.min(...ratings, ...perfs, 0) - 100;
  const maxR = Math.max(...ratings, ...perfs) + 200;

  function xOf(i, total) {
    return PAD.left + (i / Math.max(total - 1, 1)) * innerW;
  }
  function yOf(r) {
    return PAD.top + innerH - ((r - minR) / (maxR - minR || 1)) * innerH;
  }

  const ratingPoints = ratedHist
    .map(
      (h, i) =>
        `${xOf(i, ratedHist.length).toFixed(1)},${yOf(h.NewRating).toFixed(1)}`,
    )
    .join(" ");
  const perfPoints = ratedHist
    .map(
      (h, i) =>
        `${xOf(i, ratedHist.length).toFixed(1)},${yOf(h.Performance || h.NewRating).toFixed(1)}`,
    )
    .join(" ");

  const dots = ratedHist
    .map((h, i) => {
      const cx = xOf(i, ratedHist.length).toFixed(1);
      const cy = yOf(h.NewRating).toFixed(1);
      const color = acDiffColor(h.NewRating);
      return `<circle cx="${cx}" cy="${cy}" r="3" fill="${color}" stroke="var(--bg-2)" stroke-width="1.2"><title>${h.ContestScreenName}: Rating ${h.NewRating}</title></circle>`;
    })
    .join("");

  const step = Math.ceil((maxR - minR) / 5 / 100) * 100;
  const yTicks = [];
  for (let r = Math.ceil(minR / step) * step; r <= maxR; r += step) {
    const y = yOf(r);
    yTicks.push(`
      <line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4"/>
      <text x="${PAD.left - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="var(--text-muted)" font-family="var(--mono)">${r}</text>
    `);
  }

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="rating-graph-svg" preserveAspectRatio="xMidYMid meet">
      ${yTicks.join("")}
      <polyline points="${perfPoints}" fill="none" stroke="var(--yellow)" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <polyline points="${ratingPoints}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
    </svg>
    <div class="rating-graph-legend" style="margin-top:6px">
      <span class="rg-legend-dot" style="background:var(--accent)"></span><span>Rating</span>
      <span class="rg-legend-dot" style="background:var(--yellow)"></span><span>Performance</span>
    </div>
  `;
}

function renderACBestContests() {
  const el = document.getElementById("ac-best-contests");
  if (!el) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  if (!rated.length) {
    el.innerHTML = `<div class="contests-empty">No rated contest history.</div>`;
    return;
  }

  const best = [...rated]
    .sort((a, b) => (b.Performance || 0) - (a.Performance || 0))
    .slice(0, 5);
  el.innerHTML = best
    .map((h, i) => {
      const link = `https://atcoder.jp/contests/${h.ContestScreenName}`;
      const delta = h.NewRating - h.OldRating;
      return `<div class="best-contest-row">
      <span class="best-rank-num">${i + 1}</span>
      <div class="best-contest-info">
        <a href="${link}" target="_blank" class="best-contest-name">${h.ContestScreenName}</a>
        <span class="best-contest-meta">Rank #${h.Place} · Perf <span style="color:${acDiffColor(h.Performance)}">${h.Performance}</span></span>
      </div>
      <div class="best-contest-rating">
        ${ratingDeltaBadge(delta)}
        <span style="color:${acDiffColor(h.NewRating)};font-size:11px">${h.NewRating}</span>
      </div>
    </div>`;
    })
    .join("");
}

function renderACPerfStats() {
  const el = document.getElementById("ac-perf-stats");
  if (!el) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  const all = contestsState.acContestHistory;
  if (!all.length) {
    el.innerHTML = `<div class="contests-empty">No contest history.</div>`;
    return;
  }

  const perfs = rated.map((h) => h.Performance).filter((p) => p != null);
  const avgPerf = perfs.length
    ? Math.round(perfs.reduce((s, v) => s + v, 0) / perfs.length)
    : null;
  const maxPerf = perfs.length ? Math.max(...perfs) : null;
  const wins = rated.filter((h) => h.NewRating > h.OldRating).length;

  el.innerHTML = `
    <div class="cf-profile-stats-grid">
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val">${all.length}</div>
        <div class="cf-profile-stat-label">Total Contests</div>
      </div>
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val">${rated.length}</div>
        <div class="cf-profile-stat-label">Rated Contests</div>
      </div>
      ${
        avgPerf != null
          ? `<div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:${acDiffColor(avgPerf)}">${avgPerf}</div>
        <div class="cf-profile-stat-label">Avg Performance</div>
      </div>`
          : ""
      }
      ${
        maxPerf != null
          ? `<div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:${acDiffColor(maxPerf)}">${maxPerf}</div>
        <div class="cf-profile-stat-label">Best Performance</div>
      </div>`
          : ""
      }
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:var(--green)">${wins}</div>
        <div class="cf-profile-stat-label">Rating ↑</div>
      </div>
      <div class="cf-profile-stat">
        <div class="cf-profile-stat-val" style="color:var(--red)">${rated.length - wins}</div>
        <div class="cf-profile-stat-label">Rating ↓</div>
      </div>
    </div>
  `;
}

function renderACImprovementTips() {
  const el = document.getElementById("ac-improvement-tips");
  if (!el) return;

  const tips = [];
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  const all = contestsState.acContestHistory;
  const solved = Object.keys(state.acSolved || {}).length;

  if (!rated.length && !solved) {
    el.innerHTML = `<div class="contests-empty">Participate in rated AtCoder contests to unlock personalized tips.</div>`;
    return;
  }

  if (rated.length >= 3) {
    const recent3 = [...rated].slice(-3).map((h) => h.NewRating - h.OldRating);
    if (recent3.every((d) => d < 0)) {
      tips.push({
        icon: "⚠️",
        text: "Rating dropped in your last 3 rated contests. Upsove every problem you couldn't solve — reading editorials after each contest is the single highest-ROI habit in AtCoder.",
        cls: "tip-warn",
      });
    }
  }

  if (rated.length >= 5) {
    const recent5 = [...rated].slice(-5);
    const avgPerf = Math.round(
      recent5.reduce((s, h) => s + (h.Performance || 0), 0) / recent5.length,
    );
    const currentRating = rated[rated.length - 1].NewRating;
    if (avgPerf > currentRating + 100) {
      tips.push({
        icon: "🚀",
        text: `Your avg performance (${avgPerf}) is ${avgPerf - currentRating} points above your rating (${currentRating}). You're underrated — contest more frequently to let your rating catch up.`,
        cls: "tip-info",
      });
    }

    const netMove =
      recent5[recent5.length - 1].NewRating - recent5[0].OldRating;
    if (Math.abs(netMove) < 50) {
      tips.push({
        icon: "📊",
        text: `Rating barely moved (${netMove > 0 ? "+" : ""}${netMove}) across last 5 contests. Plateau detected — identify which problem position (C, D, E) you're consistently failing and drill that level.`,
        cls: "tip-warn",
      });
    }
  }

  const solvedDifficulties = Object.keys(state.acSolved || {})
    .map((id) => state.acMeta?.[id]?.difficulty)
    .filter((d) => d != null);
  const avgDiff = solvedDifficulties.length
    ? Math.round(
        solvedDifficulties.reduce((s, v) => s + v, 0) /
          solvedDifficulties.length,
      )
    : null;

  if (avgDiff != null) {
    let recommend = "";
    if (avgDiff < 800)
      recommend =
        "Focus on ABC A/B problems for speed. Aim to solve both within 10 minutes.";
    else if (avgDiff < 1200)
      recommend =
        "ABC C/D problems are your growth zone. These directly translate to rated contest gains.";
    else if (avgDiff < 1600)
      recommend =
        "Push into ABC E/F and ARC A/B. These are where real rating jumps happen.";
    else
      recommend =
        "You're ready for ARC C+ and AGC. Aim for top 200 finishes in ARC.";
    tips.push({ icon: "🎯", text: recommend, cls: "tip-info" });
  }

  if (rated.length >= 3) {
    const perfs = [...rated].slice(-5).map((h) => h.Performance || 0);
    const avg = Math.round(perfs.reduce((s, v) => s + v, 0) / perfs.length);
    const variance = Math.round(
      Math.sqrt(
        perfs.map((p) => (p - avg) ** 2).reduce((s, v) => s + v, 0) /
          perfs.length,
      ),
    );
    if (variance > 300) {
      tips.push({
        icon: "📉",
        text: `Performance variance ±${variance} in last 5 contests — very inconsistent. This usually means mental mistakes under pressure. Solve 1–2 problems at your target difficulty every day without a timer first.`,
        cls: "tip-warn",
      });
    }
  }

  const unratedCount = all.filter((h) => !h.IsRated).length;
  if (unratedCount > 3) {
    tips.push({
      icon: "⚠️",
      text: `${unratedCount} unrated participations. Register before the contest starts (not after it begins) — late registration makes you unrated even if you perform well.`,
      cls: "tip-warn",
    });
  }

  if (rated.length) {
    const lastTs = rated[rated.length - 1].EndTime
      ? new Date(rated[rated.length - 1].EndTime).getTime() / 1000
      : null;
    if (lastTs) {
      const daysSince = Math.floor((Date.now() / 1000 - lastTs) / 86400);
      if (daysSince > 30) {
        tips.push({
          icon: "📅",
          text: `Last rated contest was ${daysSince} days ago. AtCoder holds ABC every weekend — aim for at least 2–3 rated contests per month.`,
          cls: "tip-neutral",
        });
      }
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyKey = thirtyDaysAgo.toISOString().slice(0, 10);
  const recentACSolves = Object.entries(state.acActivity || {})
    .filter(([date]) => date >= thirtyKey)
    .reduce((s, [, v]) => s + v, 0);
  if (recentACSolves < 20) {
    tips.push({
      icon: "📚",
      text: `${recentACSolves} AC problems solved in the last 30 days. Daily practice on AtCoder Problems (virtual contests recommended) builds the speed needed for rated performance.`,
      cls: "tip-neutral",
    });
  }

  if (!tips.length) {
    tips.push({
      icon: "✅",
      text: "Excellent consistency! Keep contesting every weekend, upsove after each round, and push one problem difficulty level higher each month.",
      cls: "tip-info",
    });
  }

  el.innerHTML = tips
    .map(
      (t) => `
    <div class="tip-card ${t.cls}">
      <span class="tip-icon">${t.icon}</span>
      <div class="tip-text">${t.text}</div>
    </div>
  `,
    )
    .join("");
}

function setContestLoadingState(elId, loading) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (loading) {
    el.innerHTML = `<div class="contests-loading"><span class="spinner"></span> Loading…</div>`;
  }
}

function setContestError(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (msg) el.innerHTML = `<div class="contests-error">⚠️ ${msg}</div>`;
  else el.innerHTML = "";
}

function toggleCFParticipatedFilter() {
  if (!state.cfUsername) {
    alert("Connect your Codeforces account first.");
    return;
  }
  contestsState.cfParticipatedOnly = !contestsState.cfParticipatedOnly;
  contestsState.cfPastVisible = 10;
  const btn = document.getElementById("cf-participated-filter");
  if (btn) btn.classList.toggle("active", contestsState.cfParticipatedOnly);
  if (contestsState.cfParticipatedOnly && !contestsState.cfHistoryLoaded) {
    renderCFContestLists();
    loadCFContestHistory().then(() => renderCFContestLists());
  } else {
    renderCFContestLists();
  }
}
function toggleACParticipatedFilter() {
  if (!state.acUsername) {
    alert("Connect your AtCoder account first.");
    return;
  }
  contestsState.acParticipatedOnly = !contestsState.acParticipatedOnly;
  contestsState.acPastVisible = 10;
  const btn = document.getElementById("ac-participated-filter");
  if (btn) btn.classList.toggle("active", contestsState.acParticipatedOnly);
  if (contestsState.acParticipatedOnly && !contestsState.acHistoryLoaded) {
    renderACContestLists();
    loadACContestHistory().then(() => renderACContestLists());
  } else {
    renderACContestLists();
  }
}

function closeContestDetail() {
  document.getElementById("contest-detail-overlay").style.display = "none";
}

function openCFContestDetail(contestId) {
  const c = contestsState.cfContests.find((x) => x.id === contestId);
  if (!c) return;
  const entry = contestsState.cfContestHistory.find(
    (h) => h.contestId === contestId,
  );
  const startMs = c.startTimeSeconds * 1000;
  const div = cfContestDivLabel(c.name);
  const link = `https://codeforces.com/contest/${contestId}`;

  document.getElementById("contest-detail-title").textContent = c.name;
  document.getElementById("contest-detail-subtitle").innerHTML =
    `${fmtContestDate(c.startTimeSeconds)} · ${fmtDuration(c.durationSeconds)}` +
    (div
      ? ` · <span class="contest-div-badge ${div.cls}">${div.text}</span>`
      : "");

  let body = "";
  if (entry) {
    const delta = entry.newRating - entry.oldRating;
    const deltaStr = (delta >= 0 ? "+" : "") + delta;
    const deltaColor =
      delta > 0
        ? "var(--color-positive)"
        : delta < 0
          ? "var(--color-negative)"
          : "var(--text-muted)";
    body += `
      <div class="cd-participated-banner">✓ You participated in this contest</div>
      <div class="cd-stats-grid">
        <div class="cd-stat"><div class="cd-stat-val">#${entry.rank.toLocaleString()}</div><div class="cd-stat-label">Rank</div></div>
        <div class="cd-stat"><div class="cd-stat-val" style="color:${deltaColor}">${deltaStr}</div><div class="cd-stat-label">Rating Δ</div></div>
        <div class="cd-stat"><div class="cd-stat-val" style="color:${cfRatingColor(entry.oldRating)}">${entry.oldRating}</div><div class="cd-stat-label">Rating Before</div></div>
        <div class="cd-stat"><div class="cd-stat-val" style="color:${cfRatingColor(entry.newRating)}">${entry.newRating}</div><div class="cd-stat-label">Rating After</div></div>
      </div>
      <div class="cd-meta-row">
        <span class="cd-meta-item">📅 ${new Date(entry.ratingUpdateTimeSeconds * 1000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        <span class="cd-meta-item">🏆 ${cfRatingLabel(entry.newRating)}</span>
      </div>`;
  } else {
    body += `<div class="cd-no-participation">You did not participate in this contest.</div>`;
  }
  body += `<div class="cd-actions">
    <a href="${link}" target="_blank" class="btn-primary" style="text-decoration:none;font-size:13px">Open Contest →</a>
    <a href="${link}/standings" target="_blank" class="btn-secondary" style="text-decoration:none;font-size:13px">Standings</a>
    ${entry ? `<a href="https://codeforces.com/contest/${contestId}/submission/${state.cfUsername}" target="_blank" class="btn-secondary" style="text-decoration:none;font-size:13px">My Submissions</a>` : ""}
  </div>`;

  document.getElementById("contest-detail-body").innerHTML = body;
  document.getElementById("contest-detail-overlay").style.display = "flex";
}

function openACContestDetail(contestId) {
  const c = contestsState.acContests.find((x) => x.id === contestId);
  if (!c) return;
  const entry = contestsState.acContestHistory.find(
    (h) =>
      (h.ContestScreenName || "").toLowerCase() === contestId.toLowerCase(),
  );
  const link = `https://atcoder.jp/contests/${contestId}`;
  const cat = acContestCategory(contestId);

  document.getElementById("contest-detail-title").textContent = c.title;
  document.getElementById("contest-detail-subtitle").innerHTML =
    `${fmtContestDate(c.start_epoch_second)} · ${fmtDuration(c.duration_second)} · <span class="contest-div-badge ${cat.cls}">${cat.text}</span>`;

  let body = "";
  if (entry) {
    const delta = entry.IsRated ? entry.NewRating - entry.OldRating : null;
    const deltaStr = delta != null ? (delta >= 0 ? "+" : "") + delta : "N/A";
    const deltaColor =
      delta > 0
        ? "var(--color-positive)"
        : delta < 0
          ? "var(--color-negative)"
          : "var(--text-muted)";
    body += `
      <div class="cd-participated-banner">✓ You participated in this contest</div>
      <div class="cd-stats-grid">
        <div class="cd-stat"><div class="cd-stat-val">#${(entry.Place || 0).toLocaleString()}</div><div class="cd-stat-label">Rank</div></div>
        <div class="cd-stat"><div class="cd-stat-val" style="color:${acDiffColor(entry.Performance)}">${entry.Performance ?? "—"}</div><div class="cd-stat-label">Performance</div></div>
        ${
          entry.IsRated
            ? `
        <div class="cd-stat"><div class="cd-stat-val" style="color:${deltaColor}">${deltaStr}</div><div class="cd-stat-label">Rating Δ</div></div>
        <div class="cd-stat"><div class="cd-stat-val" style="color:${acDiffColor(entry.OldRating)}">${entry.OldRating}</div><div class="cd-stat-label">Before</div></div>
        <div class="cd-stat"><div class="cd-stat-val" style="color:${acDiffColor(entry.NewRating)}">${entry.NewRating}</div><div class="cd-stat-label">After</div></div>
        `
            : `<div class="cd-stat"><div class="cd-stat-val" style="color:var(--text-muted)">Unrated</div><div class="cd-stat-label">Contest Type</div></div>`
        }
      </div>`;
  } else {
    body += `<div class="cd-no-participation">You did not participate in this contest.</div>`;
  }
  body += `<div class="cd-actions">
    <a href="${link}" target="_blank" class="btn-primary" style="text-decoration:none;font-size:13px">Open Contest →</a>
    <a href="${link}/standings" target="_blank" class="btn-secondary" style="text-decoration:none;font-size:13px">Standings</a>
    ${entry ? `<a href="${link}/submissions?f.User=${state.acUsername}" target="_blank" class="btn-secondary" style="text-decoration:none;font-size:13px">My Submissions</a>` : ""}
  </div>`;

  document.getElementById("contest-detail-body").innerHTML = body;
  document.getElementById("contest-detail-overlay").style.display = "flex";
}

window.addEventListener("hashchange", handleHashChange);
document.addEventListener("DOMContentLoaded", init);
function initNavContestBadge() {
  if (window.navBadgeTimer) clearInterval(window.navBadgeTimer);
  updateNavBadge();
  contestsState.navBadgeTimer = setInterval(updateNavBadge, 60000);
}
function updateNavBadge() {
  const badge = document.getElementById("nav-contest-badge");
  if (!badge) return;
  const now = Math.floor(Date.now() / 1000);

  const all = [
    ...(contestsState.cfContests || []).map((c) => ({
      ...c,
      _start: c.startTimeSeconds,
      _plat: "CF",
      _title: c.name,
    })),
    ...(contestsState.acContests || []).map((c) => ({
      ...c,
      _start: c.start_epoch_second,
      _plat: "AC",
      _title: c.title,
    })),
  ]
    .filter((c) => c._start > now)
    .sort((a, b) => a._start - b._start);
  if (!all.length) {
    badge.style.display = "none";
    return;
  }
  const next = all[0];
  state.nextContestData = next;
  const diff = next._start - now;
  const h = Math.floor(diff / 3600),
    m = Math.floor((diff % 3600) / 60);
  const label =
    h > 48 ? `${Math.floor(h / 24)}d` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  badge.style.display = "flex";
  badge.title = `Next: ${next._title} in ${label}`;
  badge.innerHTML = `<span class="nav-badge-dot"></span><span>${next._plat} · ${label}</span>`;
  badge.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log(
      "Badge clicked! Opening modal for:",
      state.nextContestData._title,
    );
    openUpcomingContestModal(state.nextContestData);
  };
}

function openUpcomingContestModal(c) {
  if (!c) return;

  const modalTitle = document.getElementById("contest-detail-title");
  const modalSubtitle = document.getElementById("contest-detail-subtitle");
  const modalBody = document.getElementById("contest-detail-body");
  const overlay = document.getElementById("contest-detail-overlay");

  if (!modalTitle || !overlay) return;

  modalTitle.textContent = c._title;
  modalSubtitle.innerHTML = `<span class="contest-div-badge ${c._plat === "CF" ? "div2" : "abc"}">${c._plat} Contest</span> · Starts ${fmtContestDate(c._start)}`;

  const regLink =
    c._plat === "CF"
      ? `https://codeforces.com/contestRegistration/${c.id}`
      : `https://atcoder.jp/contests/${c.id}`;

  const infoLink =
    c._plat === "CF"
      ? `https://codeforces.com/contests`
      : `https://atcoder.jp/contests/${c.id}`;

  modalBody.innerHTML = `
    <div style="background:var(--bg-3); padding:16px; border-radius:8px; border:1px solid var(--border); margin-bottom:16px; text-align:center">
      <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Starts in</div>
      <div style="font-size:24px; font-weight:800; color:var(--accent); font-family:var(--display)">
        ${fmtRelativeTime(c._start).replace("in ", "")}
      </div>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px">
      <div class="cd-stat">
        <div class="cd-stat-val">${fmtDuration(c.durationSeconds || c.duration_second)}</div>
        <div class="cd-stat-label">Duration</div>
      </div>
      <div class="cd-stat">
        <div class="cd-stat-val">${c._plat}</div>
        <div class="cd-stat-label">Platform</div>
      </div>
    </div>

    <div class="cd-actions" style="border-top:none; padding-top:0; display:flex; gap:10px">
      <a href="${regLink}" target="_blank" class="btn-primary" style="flex:1; text-align:center; padding:10px; text-decoration:none; color:black">Register / Info</a>
      <a href="${infoLink}" target="_blank" class="btn-secondary" style="flex:1; text-align:center; padding:10px; text-decoration:none">All Contests</a>
    </div>
    <button class="coverage-toggle" onclick="closeContestDetail(); showPage('contests');" style="margin-top:10px; border-style:solid; width:100%; cursor:pointer">View Inside App Schedule →</button>
  `;

  overlay.style.display = "flex";
}

function renderCFPersonalRecords() {
  const panel = document.getElementById("cf-records-panel");
  const el = document.getElementById("cf-personal-records");
  if (!el) return;
  const hist = contestsState.cfContestHistory;
  if (!hist.length) {
    if (panel) panel.style.display = "none";
    return;
  }
  if (panel) panel.style.display = "";
  const deltas = hist.map((h) => h.newRating - h.oldRating);
  const bestDelta = Math.max(...deltas),
    worstDelta = Math.min(...deltas);
  const bestRank = Math.min(...hist.map((h) => h.rank));
  const peakRating = Math.max(...hist.map((h) => h.newRating));
  const currentRating = hist[hist.length - 1].newRating;
  let maxStreak = 0,
    cur = 0;
  for (const d of deltas) {
    if (d > 0) {
      cur++;
      maxStreak = Math.max(maxStreak, cur);
    } else cur = 0;
  }
  let currentStreak = 0;
  for (let i = deltas.length - 1; i >= 0; i--) {
    if (deltas[i] > 0) currentStreak++;
    else break;
  }
  const bestH = hist[deltas.indexOf(bestDelta)];
  const worstH = hist[deltas.indexOf(worstDelta)];
  const bestRankH = hist.find((h) => h.rank === bestRank);
  const records = [
    {
      icon: "🏆",
      label: "Best Rank Ever",
      val: `#${bestRank.toLocaleString()}`,
      sub: (bestRankH?.contestName || "").slice(0, 32),
    },
    {
      icon: "📈",
      label: "Best Rating Gain",
      val: `+${bestDelta}`,
      sub: (bestH?.contestName || "").slice(0, 32),
      color: "var(--color-positive)",
    },
    {
      icon: "📉",
      label: "Worst Drop",
      val: `${worstDelta}`,
      sub: (worstH?.contestName || "").slice(0, 32),
      color: "var(--color-negative)",
    },
    {
      icon: "⭐",
      label: "Peak Rating",
      val: peakRating,
      sub: cfRatingLabel(peakRating),
      color: cfRatingColor(peakRating),
    },
    {
      icon: "🔥",
      label: "Best Win Streak",
      val: maxStreak,
      sub: "consecutive gains",
    },
    {
      icon: "⚡",
      label: "Current Streak",
      val: currentStreak,
      sub: currentStreak > 0 ? "ongoing" : "no streak",
    },
    {
      icon: "🎯",
      label: "Total Contests",
      val: hist.length,
      sub: `${deltas.filter((d) => d > 0).length}W · ${deltas.filter((d) => d < 0).length}L`,
    },
    {
      icon: "📊",
      label: "Current Rating",
      val: currentRating,
      sub: cfRatingLabel(currentRating),
      color: cfRatingColor(currentRating),
    },
  ];
  el.innerHTML = records
    .map(
      (r) => `<div class="pr-card">
    <div class="pr-icon">${r.icon}</div>
    <div class="pr-val"${r.color ? ` style="color:${r.color}"` : ""}>${r.val}</div>
    <div class="pr-label">${r.label}</div>
    ${r.sub ? `<div class="pr-sub">${r.sub}</div>` : ""}
  </div>`,
    )
    .join("");
}

function renderACPersonalRecords() {
  const panel = document.getElementById("ac-records-panel");
  const el = document.getElementById("ac-personal-records");
  if (!el) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  const all = contestsState.acContestHistory;
  if (!all.length) {
    if (panel) panel.style.display = "none";
    return;
  }
  if (panel) panel.style.display = "";
  const deltas = rated.map((h) => h.NewRating - h.OldRating);
  const perfs = rated.map((h) => h.Performance || 0).filter(Boolean);
  const bestDelta = deltas.length ? Math.max(...deltas) : 0;
  const worstDelta = deltas.length ? Math.min(...deltas) : 0;
  const bestRank = Math.min(...all.map((h) => h.Place || Infinity));
  const peakRating = rated.length
    ? Math.max(...rated.map((h) => h.NewRating))
    : 0;
  const currentRating = rated.length ? rated[rated.length - 1].NewRating : 0;
  const bestPerf = perfs.length ? Math.max(...perfs) : 0;
  const avgPerf = perfs.length
    ? Math.round(perfs.reduce((s, v) => s + v, 0) / perfs.length)
    : 0;
  let maxStreak = 0,
    cur = 0;
  for (const d of deltas) {
    if (d > 0) {
      cur++;
      maxStreak = Math.max(maxStreak, cur);
    } else cur = 0;
  }
  let currentStreak = 0;
  for (let i = deltas.length - 1; i >= 0; i--) {
    if (deltas[i] > 0) currentStreak++;
    else break;
  }
  const records = [
    {
      icon: "🏆",
      label: "Best Rank",
      val: bestRank === Infinity ? "—" : `#${bestRank.toLocaleString()}`,
    },
    {
      icon: "🚀",
      label: "Best Performance",
      val: bestPerf || "—",
      sub: "single contest",
      color: bestPerf ? acDiffColor(bestPerf) : undefined,
    },
    {
      icon: "📊",
      label: "Avg Performance",
      val: avgPerf || "—",
      sub: `over ${rated.length} rated`,
      color: avgPerf ? acDiffColor(avgPerf) : undefined,
    },
    {
      icon: "⭐",
      label: "Peak Rating",
      val: peakRating || "—",
      sub: peakRating ? acDiffLabel(peakRating) : "",
      color: peakRating ? acDiffColor(peakRating) : undefined,
    },
    {
      icon: "📈",
      label: "Best Rating Gain",
      val: deltas.length ? `+${bestDelta}` : "—",
      color: "var(--color-positive)",
    },
    {
      icon: "📉",
      label: "Worst Drop",
      val: deltas.length ? `${worstDelta}` : "—",
      color: "var(--color-negative)",
    },
    {
      icon: "🔥",
      label: "Best Win Streak",
      val: maxStreak,
      sub: "consecutive gains",
    },
    {
      icon: "🎯",
      label: "Total Contests",
      val: all.length,
      sub: `${rated.length} rated · ${all.length - rated.length} unrated`,
    },
  ];
  el.innerHTML = records
    .map(
      (r) => `<div class="pr-card">
    <div class="pr-icon">${r.icon}</div>
    <div class="pr-val"${r.color ? ` style="color:${r.color}"` : ""}>${r.val}</div>
    <div class="pr-label">${r.label}</div>
    ${r.sub ? `<div class="pr-sub">${r.sub}</div>` : ""}
  </div>`,
    )
    .join("");
}

function initCFUpsolver() {
  const panel = document.getElementById("cf-upsolver-panel");
  const sel = document.getElementById("cf-upsolver-contest-select");
  if (!panel || !sel) return;
  const hist = contestsState.cfContestHistory;
  if (!hist.length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  sel.innerHTML =
    `<option value="">Select a contest you participated in…</option>` +
    [...hist]
      .reverse()
      .slice(0, 50)
      .map(
        (h) =>
          `<option value="${h.contestId}">${h.contestName} — ${new Date(h.ratingUpdateTimeSeconds * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</option>`,
      )
      .join("");
}
function renderCFUpsolver(contestId) {
  const el = document.getElementById("cf-upsolver-body");
  if (!el || !contestId) {
    if (el) el.innerHTML = "";
    return;
  }
  contestId = parseInt(contestId);
  const entry = contestsState.cfContestHistory.find(
    (h) => h.contestId === contestId,
  );
  if (!entry) {
    el.innerHTML = `<div class="contests-empty">No data for this contest.</div>`;
    return;
  }
  const problems = Object.values(state.cfMeta || {})
    .filter((p) => p.contestId === contestId)
    .sort((a, b) => (a.index || "").localeCompare(b.index || ""));
  const delta = entry.newRating - entry.oldRating;
  const deltaColor =
    delta > 0
      ? "var(--color-positive)"
      : delta < 0
        ? "var(--color-negative)"
        : "var(--text-muted)";
  const solvedCount = problems.filter(
    (p) => state.cfSolved[cfProblemKey(p.contestId, p.index)],
  ).length;
  if (!problems.length) {
    el.innerHTML = `<div class="upsolver-summary">
      <span>Rank <strong>#${entry.rank.toLocaleString()}</strong></span>
      <span style="color:${deltaColor}"><strong>${delta > 0 ? "+" : ""}${delta}</strong></span>
      <span>${entry.oldRating} → <span style="color:${cfRatingColor(entry.newRating)}">${entry.newRating}</span></span>
    </div><div class="contests-empty">No cf-meta loaded — run <code>node fetch-cf-metadata.js</code> first.</div>`;
    return;
  }
  let html = `<div class="upsolver-summary">
    <span>Rank <strong>#${entry.rank.toLocaleString()}</strong></span>
    <span style="color:${deltaColor}"><strong>${delta > 0 ? "+" : ""}${delta}</strong> rating</span>
    <span>${entry.oldRating} → <span style="color:${cfRatingColor(entry.newRating)}">${entry.newRating}</span></span>
    <span style="color:var(--text-muted)">${solvedCount}/${problems.length} solved</span>
  </div><div class="upsolver-problems">`;
  for (const p of problems) {
    const key = cfProblemKey(p.contestId, p.index);
    const solved = !!state.cfSolved[key];
    const link = `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`;
    html += `<div class="upsolver-problem ${solved ? "upsolved" : "unsolved"}">
      <span class="upsolver-idx">${p.index}</span>
      <a href="${link}" target="_blank" class="upsolver-name" onclick="event.stopPropagation()">${p.name}</a>
      ${p.rating ? `<span class="upsolver-rating" style="color:${cfRatingColor(p.rating)}">${p.rating}</span>` : ""}
      <span class="upsolver-status">${solved ? "✓ Solved" : "⟳ Upsolve"}</span>
    </div>`;
  }
  const unsolved = problems.filter(
    (p) => !state.cfSolved[cfProblemKey(p.contestId, p.index)],
  ).length;
  html += `</div>${unsolved === 0 ? `<div class="upsolver-complete">🎉 All problems solved!</div>` : `<div class="upsolver-footer">${unsolved} problem${unsolved > 1 ? "s" : ""} left to upsolve</div>`}`;
  el.innerHTML = html;
}

function initACUpsolver() {
  const panel = document.getElementById("ac-upsolver-panel");
  const sel = document.getElementById("ac-upsolver-contest-select");
  if (!panel || !sel) return;
  const hist = contestsState.acContestHistory;
  if (!hist.length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  sel.innerHTML =
    `<option value="">Select a contest you participated in…</option>` +
    [...hist]
      .reverse()
      .slice(0, 50)
      .map(
        (h) =>
          `<option value="${h.ContestScreenName}">${h.ContestScreenName}${h.IsRated ? ` · Rank #${h.Place}` : " (unrated)"}</option>`,
      )
      .join("");
}
function renderACUpsolver(contestId) {
  const el = document.getElementById("ac-upsolver-body");
  if (!el || !contestId) {
    if (el) el.innerHTML = "";
    return;
  }
  const entry = contestsState.acContestHistory.find(
    (h) =>
      (h.ContestScreenName || "").toLowerCase() === contestId.toLowerCase(),
  );
  const contest = contestsState.acContests.find(
    (c) => (c.id || "").toLowerCase() === contestId.toLowerCase(),
  );
  const link = `https://atcoder.jp/contests/${contestId}`;
  const problems = Object.values(state.acMeta || {})
    .filter(
      (p) => (p.contestId || "").toLowerCase() === contestId.toLowerCase(),
    )
    .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  let html = "";
  if (entry) {
    const delta = entry.IsRated ? entry.NewRating - entry.OldRating : null;
    const deltaColor =
      delta > 0
        ? "var(--color-positive)"
        : delta < 0
          ? "var(--color-negative)"
          : "var(--text-muted)";
    const solvedCount = problems.filter((p) => state.acSolved[p.id]).length;
    html += `<div class="upsolver-summary">
      <span>Rank <strong>#${(entry.Place || 0).toLocaleString()}</strong></span>
      ${entry.Performance != null ? `<span style="color:${acDiffColor(entry.Performance)}">Perf <strong>${entry.Performance}</strong></span>` : ""}
      ${delta !== null ? `<span style="color:${deltaColor}"><strong>${delta > 0 ? "+" : ""}${delta}</strong> rating</span>` : "<span style='color:var(--text-muted)'>Unrated</span>"}
      ${problems.length ? `<span style="color:var(--text-muted)">${solvedCount}/${problems.length} solved</span>` : ""}
    </div>`;
  } else {
    html += `<div class="cd-no-participation">You did not participate in this contest.</div>`;
  }
  if (!problems.length) {
    html += `<div class="contests-empty">No problem data for this contest in ac-meta. Run <code>node fetch-atcoder-metadata.js</code> first.</div>`;
  } else {
    html += `<div class="upsolver-problems">`;
    for (const p of problems) {
      const solved = !!state.acSolved[p.id];
      const plink = `https://atcoder.jp/contests/${contestId}/tasks/${p.id}`;
      html += `<div class="upsolver-problem ${solved ? "upsolved" : "unsolved"}">
        <span class="upsolver-idx">${p.id.replace(contestId + "_", "").toUpperCase()}</span>
        <a href="${plink}" target="_blank" class="upsolver-name" onclick="event.stopPropagation()">${p.title}</a>
        ${p.difficulty != null ? `<span class="upsolver-rating" style="color:${acDiffColor(p.difficulty)}">${p.difficulty}</span>` : ""}
        <span class="upsolver-status">${solved ? "✓ Solved" : "⟳ Upsolve"}</span>
      </div>`;
    }
    const unsolved = problems.filter((p) => !state.acSolved[p.id]).length;
    html += `</div>${unsolved === 0 ? `<div class="upsolver-complete">🎉 All problems solved!</div>` : `<div class="upsolver-footer">${unsolved} problem${unsolved > 1 ? "s" : ""} left to upsolve</div>`}`;
  }
  html += `<div class="cd-actions" style="margin-top:12px">
    <a href="${link}" target="_blank" class="btn-primary" style="text-decoration:none;font-size:13px">Open Contest →</a>
    <a href="${link}/submissions?f.User=${state.acUsername || ""}" target="_blank" class="btn-secondary" style="text-decoration:none;font-size:13px">My Submissions</a>
  </div>`;
  el.innerHTML = html;
}

function initCFRecommender() {
  const panel = document.getElementById("cf-recommender-panel");
  if (!panel) return;
  if (!Object.keys(state.cfMeta || {}).length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  renderCFRecommender();
}
function renderCFRecommender() {
  const el = document.getElementById("cf-recommender-body");
  if (!el) return;
  const baseRating = state.cfUserInfo?.rating || 1200;
  const challengeRating = baseRating + 150;
  const userRating = state.cfUserInfo?.rating || 1200;
  const tagStats = {};
  for (const p of Object.values(state.cfMeta || {})) {
    if (!p.rating || p.rating > userRating + 400) continue;
    const key = cfProblemKey(p.contestId, p.index);
    const solved = !!state.cfSolved[key];
    for (const tag of p.tags || []) {
      if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
      tagStats[tag].total++;
      if (solved) tagStats[tag].solved++;
    }
  }
  const weakTags = Object.entries(tagStats)
    .filter(([, v]) => v.total >= 5 && v.solved / v.total < 0.4)
    .sort((a, b) => a[1].solved / a[1].total - b[1].solved / b[1].total)
    .slice(0, 4)
    .map(([tag]) => tag);
  const candidates = Object.values(state.cfMeta || {}).filter((p) => {
    const isUnsolved = !state.cfSolved[cfProblemKey(p.contestId, p.index)];
    if (!isUnsolved) return false;

    if (!p.rating) {
      return userRating < 1400;
    }
    return p.rating >= baseRating && p.rating <= challengeRating + 100;
  });
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
  const weak = shuffle(
    candidates.filter((p) => (p.tags || []).some((t) => weakTags.includes(t))),
  ).slice(0, 6);
  const normal = shuffle(
    candidates.filter((p) => !(p.tags || []).some((t) => weakTags.includes(t))),
  ).slice(0, 6);
  const picks = [...weak, ...normal];
  if (!picks.length) {
    el.innerHTML = `<div class="contests-empty">No recommendations yet — sync CF data to populate.</div>`;
    return;
  }
  el.innerHTML = `
    ${weakTags.length ? `<div class="recommender-tags-row">Targeting weak tags: ${weakTags.map((t) => `<span class="rec-tag">${t}</span>`).join("")}</div>` : ""}
    <div class="recommender-grid">${picks
      .map((p) => {
        const link = `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`;
        const isWeak = (p.tags || []).some((t) => weakTags.includes(t));
        return `<a href="${link}" target="_blank" class="rec-problem-card${isWeak ? " rec-weak" : ""}">
        <div class="rec-top"><span class="rec-idx">${p.contestId}${p.index}</span>${isWeak ? `<span class="rec-weak-badge">weak tag</span>` : ""}</div>
        <div class="rec-name">${p.name}</div>
        <div class="rec-meta"><span style="color:${cfRatingColor(p.rating)}">${p.rating}</span>${(
          p.tags || []
        )
          .slice(0, 2)
          .map((t) => `<span class="rec-tag-small">${t}</span>`)
          .join("")}</div>
      </a>`;
      })
      .join("")}</div>`;
}

function initACRecommender() {
  const panel = document.getElementById("ac-recommender-panel");
  if (!panel) return;
  if (!Object.keys(state.acMeta || {}).length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  renderACRecommender();
}
function renderACRecommender() {
  const el = document.getElementById("ac-recommender-body");
  if (!el) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  const userRating = rated.length ? rated[rated.length - 1].NewRating : 0;
  const targetMin = Math.max(0, (userRating || 800) - 100);
  const targetMax = (userRating || 800) + 400;
  const candidates = Object.values(state.acMeta || {}).filter((p) => {
    if (p.difficulty == null) return false;
    if (p.difficulty < targetMin || p.difficulty > targetMax) return false;
    return !state.acSolved[p.id];
  });
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
  const picks = shuffle(candidates).slice(0, 12);
  if (!picks.length) {
    el.innerHTML = `<div class="contests-empty">No recommendations — sync AC data first.</div>`;
    return;
  }
  const label = userRating
    ? `Targeting difficulty ${targetMin}–${targetMax} (around your rating ${userRating})`
    : "Targeting beginner-friendly problems";
  el.innerHTML = `
    <div class="recommender-tags-row">${label}</div>
    <div class="recommender-grid">${picks
      .map((p) => {
        const link = `https://atcoder.jp/contests/${p.contestId}/tasks/${p.id}`;
        return `<a href="${link}" target="_blank" class="rec-problem-card">
        <div class="rec-top"><span class="rec-idx">${p.id}</span></div>
        <div class="rec-name">${p.title}</div>
        <div class="rec-meta"><span style="color:${acDiffColor(p.difficulty)}">${p.difficulty}</span></div>
      </a>`;
      })
      .join("")}</div>`;
}

function initCFRatingPredictor() {
  const panel = document.getElementById("cf-predictor-panel");
  if (!panel) return;
  if (
    !contestsState.cfContestHistory.length ||
    !contestsState.cfContests.length
  ) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  renderCFRatingPredictor();
}
function renderCFRatingPredictor() {
  const el = document.getElementById("cf-predictor-body");
  if (!el) return;
  const hist = contestsState.cfContestHistory;
  if (!hist.length) {
    el.innerHTML = `<div class="contests-empty">Participate in at least one contest to unlock.</div>`;
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  const upcoming = contestsState.cfContests
    .filter((c) => c.startTimeSeconds > now)
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
    .slice(0, 3);
  if (!upcoming.length) {
    el.innerHTML = `<div class="contests-empty">No upcoming CF contests found.</div>`;
    return;
  }
  const recentDeltas = hist.slice(-10).map((h) => h.newRating - h.oldRating);
  const avgDelta = Math.round(
    recentDeltas.reduce((s, v) => s + v, 0) / recentDeltas.length,
  );
  const trend =
    recentDeltas.slice(-3).reduce((s, v) => s + v, 0) > 0
      ? "📈 Positive"
      : "📉 Negative";
  const userRating =
    state.cfUserInfo?.rating || hist[hist.length - 1].newRating;
  el.innerHTML = `
    <div class="predictor-context">Last ${recentDeltas.length} contests · Avg Δ <strong style="color:${avgDelta >= 0 ? "var(--color-positive)" : "var(--color-negative)"}">${avgDelta > 0 ? "+" : ""}${avgDelta}</strong> · Trend: ${trend}</div>
    <div class="predictor-grid">${upcoming
      .map((c) => {
        const div = cfContestDivLabel(c.name);
        const mult =
          div?.text === "Div. 1"
            ? 0.6
            : div?.text === "Div. 3" || div?.text === "Div. 4"
              ? 1.3
              : 1.0;
        const pd = Math.round(avgDelta * mult);
        const pr = userRating + pd;
        const link = `https://codeforces.com/contest/${c.id}`;
        return `<div class="predictor-card">
        <div class="predictor-card-top">${div ? `<span class="contest-div-badge ${div.cls}">${div.text}</span>` : ""}
          <a href="${link}" target="_blank" class="predictor-name" onclick="event.stopPropagation()">${c.name}</a></div>
        <div class="predictor-stats">
          <div class="predictor-stat"><div class="predictor-stat-val" style="color:${pd >= 0 ? "var(--color-positive)" : "var(--color-negative)"}">${pd > 0 ? "+" : ""}${pd}</div><div class="predictor-stat-label">Expected Δ</div></div>
          <div class="predictor-stat"><div class="predictor-stat-val" style="color:${cfRatingColor(pr)}">${pr}</div><div class="predictor-stat-label">Predicted</div></div>
          <div class="predictor-stat"><div class="predictor-stat-val">${fmtRelativeTime(c.startTimeSeconds)}</div><div class="predictor-stat-label">Starts</div></div>
        </div>
        <div class="predictor-disclaimer">Based on your last ${recentDeltas.length}-contest trend. Actual results vary.</div>
      </div>`;
      })
      .join("")}</div>`;
}

function initACRatingPredictor() {
  const panel = document.getElementById("ac-predictor-panel");
  if (!panel) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  if (!rated.length || !contestsState.acContests.length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  renderACRatingPredictor();
}
function renderACRatingPredictor() {
  const el = document.getElementById("ac-predictor-body");
  if (!el) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  if (!rated.length) {
    el.innerHTML = `<div class="contests-empty">Participate in rated contests to unlock.</div>`;
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  const upcoming = contestsState.acContests
    .filter((c) => c.start_epoch_second > now)
    .sort((a, b) => a.start_epoch_second - b.start_epoch_second)
    .slice(0, 3);
  if (!upcoming.length) {
    el.innerHTML = `<div class="contests-empty">No upcoming AC contests found.</div>`;
    return;
  }
  const recentPerfs = rated
    .slice(-10)
    .map((h) => h.Performance || 0)
    .filter(Boolean);
  const avgPerf = recentPerfs.length
    ? Math.round(recentPerfs.reduce((s, v) => s + v, 0) / recentPerfs.length)
    : 0;
  const recentDeltas = rated.slice(-10).map((h) => h.NewRating - h.OldRating);
  const avgDelta = recentDeltas.length
    ? Math.round(recentDeltas.reduce((s, v) => s + v, 0) / recentDeltas.length)
    : 0;
  const trend =
    recentDeltas.slice(-3).reduce((s, v) => s + v, 0) > 0
      ? "📈 Positive"
      : "📉 Negative";
  const currentRating = rated[rated.length - 1].NewRating;
  el.innerHTML = `
    <div class="predictor-context">Last ${recentDeltas.length} rated · Avg Perf <strong style="color:${acDiffColor(avgPerf)}">${avgPerf}</strong> · Avg Δ <strong style="color:${avgDelta >= 0 ? "var(--color-positive)" : "var(--color-negative)"}">${avgDelta > 0 ? "+" : ""}${avgDelta}</strong> · Trend: ${trend}</div>
    <div class="predictor-grid">${upcoming
      .map((c) => {
        const cat = acContestCategory(c.id);
        const perfMult =
          cat.text === "AGC" ? 1.1 : cat.text === "ARC" ? 1.05 : 1.0;
        const predictedPerf = Math.round(avgPerf * perfMult);
        const predictedDelta = Math.round(avgDelta * perfMult);
        const predictedRating = currentRating + predictedDelta;
        const link = `https://atcoder.jp/contests/${c.id}`;
        return `<div class="predictor-card">
        <div class="predictor-card-top"><span class="contest-div-badge ${cat.cls}">${cat.text}</span>
          <a href="${link}" target="_blank" class="predictor-name" onclick="event.stopPropagation()">${c.title}</a></div>
        <div class="predictor-stats">
          <div class="predictor-stat"><div class="predictor-stat-val" style="color:${acDiffColor(predictedPerf)}">${predictedPerf || "—"}</div><div class="predictor-stat-label">Pred. Perf</div></div>
          <div class="predictor-stat"><div class="predictor-stat-val" style="color:${predictedDelta >= 0 ? "var(--color-positive)" : "var(--color-negative)"}">${predictedDelta > 0 ? "+" : ""}${predictedDelta}</div><div class="predictor-stat-label">Expected Δ</div></div>
          <div class="predictor-stat"><div class="predictor-stat-val" style="color:${acDiffColor(predictedRating)}">${predictedRating}</div><div class="predictor-stat-label">Predicted</div></div>
          <div class="predictor-stat"><div class="predictor-stat-val">${fmtRelativeTime(c.start_epoch_second)}</div><div class="predictor-stat-label">Starts</div></div>
        </div>
        <div class="predictor-disclaimer">Based on your last ${recentDeltas.length}-contest trend. Actual results vary.</div>
      </div>`;
      })
      .join("")}</div>`;
}

function initCFRivals() {
  const panel = document.getElementById("cf-rivals-panel");
  if (panel) {
    panel.style.display = "";
    renderCFRivals();
  }
}
async function addCFRival() {
  const input = document.getElementById("cf-rival-input");
  const handle = (input?.value || "").trim();
  if (!handle) return;
  if (contestsState.cfRivals.length >= 5) {
    showToast("Max 5 rivals allowed for performance.", "error");
    input.value = "";
    return;
  }

  if (
    contestsState.cfRivals.find(
      (r) => r.handle.toLowerCase() === handle.toLowerCase(),
    )
  ) {
    showToast("Already tracking this rival", "info");
    input.value = "";
    return;
  }
  input.value = "";
  const el = document.getElementById("cf-rivals-body");
  const lid = `cfrl-${Date.now()}`;
  if (el)
    el.insertAdjacentHTML(
      "afterbegin",
      `<div class="rivals-loading" id="${lid}">⏳ Loading @${handle}…</div>`,
    );
  try {
    const [hr, ir] = await Promise.all([
      fetch(
        `/api/contests-proxy?platform=cf-history&handle=${encodeURIComponent(handle)}`,
      ),
      fetch(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      ),
    ]);
    if (!hr.ok) throw new Error("Handle not found");
    const history = await hr.json();
    const info = (await ir.json()).result?.[0] || {};
    contestsState.cfRivals.push({ handle, history, rating: info.rating || 0 });
    const saved = JSON.parse(localStorage.getItem("cf_rivals") || "[]");
    if (!saved.find((r) => r.handle === handle)) saved.push({ handle });
    localStorage.setItem("cf_rivals", JSON.stringify(saved));
  } catch (e) {
    document.getElementById(lid)?.remove();
    if (el)
      el.insertAdjacentHTML(
        "afterbegin",
        `<div class="contests-error" style="font-size:12px;margin-bottom:8px">⚠️ @${handle}: ${e.message}</div>`,
      );
    return;
  }
  renderCFRivals();
}
function removeCFRival(handle) {
  contestsState.cfRivals = contestsState.cfRivals.filter(
    (r) => r.handle !== handle,
  );
  localStorage.setItem(
    "cf_rivals",
    JSON.stringify(
      JSON.parse(localStorage.getItem("cf_rivals") || "[]").filter(
        (r) => r.handle !== handle,
      ),
    ),
  );
  renderCFRivals();
}
async function loadSavedCFRivals() {
  if (contestsState.cfRivalsLoaded) return;
  contestsState.cfRivalsLoaded = true;
  const saved = JSON.parse(localStorage.getItem("cf_rivals") || "[]");
  for (const { handle } of saved) {
    if (contestsState.cfRivals.find((r) => r.handle === handle)) continue;
    try {
      const [hr, ir] = await Promise.all([
        fetch(
          `/api/contests-proxy?platform=cf-history&handle=${encodeURIComponent(handle)}`,
        ),
        fetch(
          `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
        ),
      ]);
      if (!hr.ok) continue;
      const history = await hr.json();
      const info = (await ir.json()).result?.[0] || {};
      contestsState.cfRivals.push({
        handle,
        history,
        rating: info.rating || 0,
      });
      renderCFRivals();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 300));
  }
  renderCFRivals();
}
function renderCFRivals() {
  const el = document.getElementById("cf-rivals-body");
  if (!el) return;
  const userRating = state.cfUserInfo?.rating || 0;
  const colors = [
    "#4fc3f7",
    "#81c784",
    "#ffb74d",
    "#f06292",
    "#ce93d8",
    "#80cbc4",
  ];
  const me =
    state.cfUsername && userRating
      ? [
          {
            handle: state.cfUsername,
            rating: userRating,
            history: contestsState.cfContestHistory,
            isYou: true,
          },
        ]
      : [];
  const all = [...me, ...contestsState.cfRivals].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0),
  );
  if (!contestsState.cfRivals.length && !me.length) {
    el.innerHTML = `<div class="contests-empty">Add a rival's CF handle to compare side by side.</div>`;
    return;
  }
  const allRatings = all
    .flatMap((e) => (e.history || []).map((h) => h.newRating || 0))
    .filter(Boolean);
  const maxR = allRatings.length ? Math.max(...allRatings) : 2000,
    minR = allRatings.length ? Math.min(...allRatings) : 800;
  const W = 500,
    H = 110,
    pad = 16;
  let svgLines = "";
  all.forEach((entry, i) => {
    const hist = entry.history || [];
    if (hist.length < 2) return;
    const color = colors[i % colors.length];
    const pts = hist
      .map((h, j) => {
        const x = pad + (j / (hist.length - 1)) * (W - pad * 2);
        const y =
          H -
          pad -
          ((h.newRating - minR) / Math.max(maxR - minR, 100)) * (H - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    svgLines += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${entry.isYou ? 2.5 : 1.5}" opacity="0.9" stroke-linejoin="round"/>`;
  });
  const graph = all.some((e) => (e.history || []).length >= 2)
    ? `<svg viewBox="0 0 ${W} ${H}" class="rivals-graph" preserveAspectRatio="none">${svgLines}</svg>`
    : "";
  el.innerHTML =
    graph +
    `<div class="rivals-list">${all
      .map((entry, i) => {
        const color = colors[i % colors.length];
        const diff =
          userRating && !entry.isYou ? entry.rating - userRating : null;
        return `<div class="rival-row">
      <span class="rival-color-dot" style="background:${color}"></span>
      <a href="https://codeforces.com/profile/${escHtml(entry.handle)}" target="_blank" class="rival-handle" onclick="event.stopPropagation()">${entry.isYou ? "👤 " : ""}${escHtml(entry.handle)}</a>
      <span class="rival-rating" style="color:${cfRatingColor(entry.rating || 0)}">${entry.rating || "—"}</span>
      <span class="rival-label">${cfRatingLabel(entry.rating || 0)}</span>
      ${diff !== null ? `<span class="rival-diff" style="color:${diff > 0 ? "var(--color-negative)" : "var(--color-positive)"}">${diff > 0 ? "+" : ""}${diff}</span>` : ""}
      ${!entry.isYou ? `<button class="rival-remove-btn" onclick="removeCFRival('${entry.handle}')">✕</button>` : ""}
    </div>`;
      })
      .join("")}</div>`;
  updateHeatmapRivalDropdown();
}

function initACRivals() {
  const panel = document.getElementById("ac-rivals-panel");
  if (panel) {
    panel.style.display = "";
    renderACRivals();
  }
}
async function addACRival() {
  const input = document.getElementById("ac-rival-input");
  const handle = (input?.value || "").trim();
  if (!handle) return;
  if (
    contestsState.acRivals.find(
      (r) => r.handle.toLowerCase() === handle.toLowerCase(),
    )
  ) {
    input.value = "";
    return;
  }
  input.value = "";
  const el = document.getElementById("ac-rivals-body");
  const lid = `acrl-${Date.now()}`;
  if (el)
    el.insertAdjacentHTML(
      "afterbegin",
      `<div class="rivals-loading" id="${lid}">⏳ Loading @${handle}…</div>`,
    );
  try {
    const hr = await fetch(
      `/api/contests-proxy?platform=ac-history&handle=${encodeURIComponent(handle)}`,
    );
    if (!hr.ok) throw new Error("Handle not found");
    const history = await hr.json();
    const rated = history.filter((h) => h.IsRated);
    const rating = rated.length ? rated[rated.length - 1].NewRating : 0;
    contestsState.acRivals.push({ handle, history, rating });
    const saved = JSON.parse(localStorage.getItem("ac_rivals") || "[]");
    if (!saved.find((r) => r.handle === handle)) saved.push({ handle });
    localStorage.setItem("ac_rivals", JSON.stringify(saved));
  } catch (e) {
    document.getElementById(lid)?.remove();
    if (el)
      el.insertAdjacentHTML(
        "afterbegin",
        `<div class="contests-error" style="font-size:12px;margin-bottom:8px">⚠️ @${handle}: ${e.message}</div>`,
      );
    return;
  }
  renderACRivals();
}
function removeACRival(handle) {
  contestsState.acRivals = contestsState.acRivals.filter(
    (r) => r.handle !== handle,
  );
  localStorage.setItem(
    "ac_rivals",
    JSON.stringify(
      JSON.parse(localStorage.getItem("ac_rivals") || "[]").filter(
        (r) => r.handle !== handle,
      ),
    ),
  );
  renderACRivals();
}
async function loadSavedACRivals() {
  if (contestsState.acRivalsLoaded) return;
  contestsState.acRivalsLoaded = true;
  const saved = JSON.parse(localStorage.getItem("ac_rivals") || "[]");
  for (const { handle } of saved) {
    if (contestsState.acRivals.find((r) => r.handle === handle)) continue;
    try {
      const hr = await fetch(
        `/api/contests-proxy?platform=ac-history&handle=${encodeURIComponent(handle)}`,
      );
      if (!hr.ok) continue;
      const history = await hr.json();
      const rated = history.filter((h) => h.IsRated);
      const rating = rated.length ? rated[rated.length - 1].NewRating : 0;
      contestsState.acRivals.push({ handle, history, rating });
      renderACRivals();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 300));
  }
  renderACRivals();
}
function renderACRivals() {
  const el = document.getElementById("ac-rivals-body");
  if (!el) return;
  const rated = contestsState.acContestHistory.filter((h) => h.IsRated);
  const myRating = rated.length ? rated[rated.length - 1].NewRating : 0;
  const colors = [
    "#4fc3f7",
    "#81c784",
    "#ffb74d",
    "#f06292",
    "#ce93d8",
    "#80cbc4",
  ];
  const me =
    state.acUsername && myRating
      ? [
          {
            handle: state.acUsername,
            rating: myRating,
            history: contestsState.acContestHistory,
            isYou: true,
          },
        ]
      : [];
  const all = [...me, ...contestsState.acRivals].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0),
  );
  if (!contestsState.acRivals.length && !me.length) {
    el.innerHTML = `<div class="contests-empty">Add a rival's AtCoder handle to compare side by side.</div>`;
    return;
  }
  const getRating = (h) => h.NewRating || h.newRating || 0;
  const allRatings = all
    .flatMap((e) =>
      (e.history || []).filter((h) => h.IsRated !== false).map(getRating),
    )
    .filter(Boolean);
  const maxR = allRatings.length ? Math.max(...allRatings) : 1600,
    minR = allRatings.length ? Math.min(...allRatings) : 400;
  const W = 500,
    H = 110,
    pad = 16;
  let svgLines = "";
  all.forEach((entry, i) => {
    const hist = (entry.history || []).filter((h) => getRating(h) > 0);
    if (hist.length < 2) return;
    const color = colors[i % colors.length];
    const pts = hist
      .map((h, j) => {
        const x = pad + (j / (hist.length - 1)) * (W - pad * 2);
        const y =
          H -
          pad -
          ((getRating(h) - minR) / Math.max(maxR - minR, 100)) * (H - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    svgLines += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${entry.isYou ? 2.5 : 1.5}" opacity="0.9" stroke-linejoin="round"/>`;
  });
  const graph = all.some((e) => (e.history || []).length >= 2)
    ? `<svg viewBox="0 0 ${W} ${H}" class="rivals-graph" preserveAspectRatio="none">${svgLines}</svg>`
    : "";
  el.innerHTML =
    graph +
    `<div class="rivals-list">${all
      .map((entry, i) => {
        const color = colors[i % colors.length];
        const diff = myRating && !entry.isYou ? entry.rating - myRating : null;
        return `<div class="rival-row">
      <span class="rival-color-dot" style="background:${color}"></span>
      <a href="https://atcoder.jp/users/${escHtml(entry.handle)}" target="_blank" class="rival-handle" onclick="event.stopPropagation()">${entry.isYou ? "👤 " : ""}${escHtml(entry.handle)}</a>
      <span class="rival-rating" style="color:${acDiffColor(entry.rating || 0)}">${entry.rating || "—"}</span>
      <span class="rival-label">${acDiffLabel(entry.rating || 0)}</span>
      ${diff !== null ? `<span class="rival-diff" style="color:${diff > 0 ? "var(--color-negative)" : "var(--color-positive)"}">${diff > 0 ? "+" : ""}${diff}</span>` : ""}
      ${!entry.isYou ? `<button class="rival-remove-btn" onclick="removeACRival('${escHtml(entry.handle)}')">✕</button>` : ""}
    </div>`;
      })
      .join("")}</div>`;
}

function getRivalActivity(handle) {
  const rival = contestsState.cfRivals.find((r) => r.handle === handle);
  if (!rival) return {};
  const activity = {};
  rival.history.forEach((h) => {
    const d = dateStr(new Date(h.ratingUpdateTimeSeconds * 1000));
    activity[d] = (activity[d] || 0) + 1;
  });
  return activity;
}

function updateHeatmapRivalDropdown() {
  const select = document.getElementById("heatmap-rival-select");
  if (!select) return;

  select.innerHTML = '<option value="">Compare with Rival...</option>';

  contestsState.cfRivals.forEach((rival) => {
    const opt = document.createElement("option");
    opt.value = rival.handle;
    opt.textContent = rival.handle;
    if (state.compareRival === rival.handle) opt.selected = true;
    select.appendChild(opt);
  });
}
