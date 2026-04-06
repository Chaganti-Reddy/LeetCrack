#!/usr/bin/env node
/**
 * fetch-cf-metadata.js
 *
 * Fetches all Codeforces problems with ratings and tags
 * and saves to data/cf-meta.json
 *
 * Usage:
 *   node fetch-cf-metadata.js
 *
 * Requirements: Node.js 18+
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "data", "cf-meta.json");

async function main() {
  console.log("─".repeat(60));
  console.log("  LeetTrack — Codeforces Metadata Fetcher");
  console.log("─".repeat(60));

  console.log("\n⏳ Fetching problems from Codeforces API...");

  const res = await fetch("https://codeforces.com/api/problemset.problems");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (data.status !== "OK") throw new Error(data.comment || "API error");

  const { problems, problemStatistics } = data.result;

  // Build solveCount map from statistics
  const solveCount = {};
  for (const s of problemStatistics || []) {
    solveCount[`${s.contestId}_${s.index}`] = s.solvedCount;
  }

  // Filter: only rated problems (skip unrated/gym)
  const rated = problems.filter(p => p.rating && p.contestId < 100000);

  const result = {};
  for (const p of rated) {
    const key = `${p.contestId}_${p.index}`;
    result[key] = {
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags || [],
      solvedCount: solveCount[key] || 0,
    };
  }

  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8");

  console.log(`✅ ${rated.length} rated problems saved`);
  console.log(`📁 ${OUTPUT_FILE}`);
  console.log("\n📌 Next:");
  console.log("   git add data/cf-meta.json");
  console.log('   git commit -m "Add Codeforces metadata"');
  console.log("   git push\n");
}

main().catch(err => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});