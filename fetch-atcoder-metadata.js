#!/usr/bin/env node
/**
 * fetch-atcoder-metadata.js
 *
 * Fetches all AtCoder problems with difficulty estimates and tags
 * via the AtCoder Problems public API (kenkoooo.com) and saves to
 * data/atcoder-meta.json
 *
 * Usage:
 *   node fetch-atcoder-metadata.js
 *
 * Requirements: Node.js 18+
 */

const fs   = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "data", "atcoder-meta.json");

const AC_BASE = "https://kenkoooo.com/atcoder";

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "AlgoTrack/1.0 fetch-atcoder-metadata" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

async function main() {
  console.log("─".repeat(60));
  console.log("  AlgoTrack — AtCoder Metadata Fetcher");
  console.log("─".repeat(60));

  console.log("\n⏳ Fetching problem list…");
  const problems = await fetchJSON(`${AC_BASE}/resources/problems.json`);
  console.log(`   ${problems.length} problems found`);

  console.log("⏳ Fetching difficulty estimates…");
  const difficulties = await fetchJSON(`${AC_BASE}/resources/problem-models.json`);
  console.log(`   ${Object.keys(difficulties).length} difficulty estimates found`);

  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const result = {};
  let withDiff = 0;

  for (const p of problems) {
    const model = difficulties[p.id];
    const difficulty = model?.difficulty != null
      ? Math.round(model.difficulty)
      : null;
    const isFast = model?.is_experimental ?? false;

    if (difficulty != null) withDiff++;

    result[p.id] = {
      id: p.id,
      contestId: p.contest_id,
      title: p.title,
      difficulty,  
      isExperimental: isFast,
      solvedCount: 0,
    };
  }

  console.log("⏳ Fetching merged problem data (solve counts)…");
  try {
    const merged = await fetchJSON(`${AC_BASE}/resources/merged-problems.json`);
    for (const p of merged) {
      if (result[p.id]) {
        result[p.id].solvedCount = p.solver_count ?? 0;
        if (result[p.id].difficulty == null && p.difficulty != null) {
          result[p.id].difficulty = Math.round(p.difficulty);
          withDiff++;
        }
      }
    }
    console.log(`   Solve counts applied`);
  } catch (err) {
    console.log(`   ⚠  Could not fetch merged problems: ${err.message}`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8");

  console.log("\n" + "─".repeat(60));
  console.log(`✅ ${Object.keys(result).length} problems saved`);
  console.log(`📊 ${withDiff} with difficulty estimates`);
  console.log(`📁 ${OUTPUT_FILE}`);
  console.log("─".repeat(60));
  console.log("\n📌 Next:");
  console.log("   git add data/atcoder-meta.json");
  console.log('   git commit -m "Add AtCoder metadata"');
  console.log("   git push\n");
}

main().catch(err => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});