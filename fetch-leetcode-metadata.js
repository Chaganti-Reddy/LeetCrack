/**
 * fetch-metadata.js
 *
 * Fetches topic tags + metadata for all LeetCode problems
 * and saves to data/leetcode-meta.json
 *
 * Usage:
 *   node fetch-metadata.js           → fetch everything fresh
 *   node fetch-metadata.js --update  → only fetch IDs not already in the JSON
 *
 * Requirements: Node.js 18+ (uses native fetch)
 * On Node 16: npm install node-fetch  then add:  const fetch = require('node-fetch');
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "data", "leetcode-meta.json");
const DELAY_MS = 400;
const isUpdate = process.argv.includes("--update");

// ─── GraphQL helper ──────────────────────────────────────────────────────────

async function gql(query, variables = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com/problemset/",
          "Origin": "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 429) {
        const wait = 5000 * attempt;
        console.log(`\n   Rate limited — waiting ${wait / 1000}s before retry...`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error");
      return json.data;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000 * attempt);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── File helpers ────────────────────────────────────────────────────────────

function loadExisting() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
    } catch (_) {}
  }
  return {};
}

function save(data) {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf8");
}

function fmt(rate) {
  if (rate == null) return "-";
  const n = parseFloat(rate);
  return (n > 1 ? n.toFixed(1) : (n * 100).toFixed(1)) + "%";
}

// ─── Step 1: fetch full problem list ─────────────────────────────────────────

async function fetchProblemList() {
  // Attempt A: current API shape (works as of early 2025)
  try {
    console.log("   Trying questionList query...");
    const all = [];
    let skip = 0;
    const limit = 100;
    let total = null;

    while (true) {
      const data = await gql(
        `query($categorySlug: String, $skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
          questionList(categorySlug: $categorySlug, skip: $skip, limit: $limit, filters: $filters) {
            total: totalNum
            questions: data {
              questionFrontendId
              title
              titleSlug
              difficulty
              acRate
              isPaidOnly
            }
          }
        }`,
        { categorySlug: "", skip, limit, filters: {} }
      );

      const page = data?.questionList;
      if (!page?.questions?.length) break;
      if (total === null) {
        total = page.total;
        console.log(`   Total: ${total}`);
      }

      all.push(...page.questions);
      process.stdout.write(`\r   Fetching list: ${all.length}/${total}   `);

      if (all.length >= total) break;
      skip += limit;
      await sleep(200);
    }

    if (all.length > 0) { console.log(); return all; }
  } catch (err) {
    console.log(`   Attempt A failed: ${err.message}`);
  }

  // Attempt B: older query shape
  try {
    console.log("   Trying problemsetQuestionList query...");
    const all = [];
    let skip = 0;
    const limit = 100;
    let total = null;

    while (true) {
      const data = await gql(
        `query($skip: Int!, $limit: Int!) {
          problemsetQuestionList: questionList(
            categorySlug: "" limit: $limit skip: $skip filters: {}
          ) {
            total: totalNum
            questions: data {
              questionFrontendId title titleSlug difficulty acRate isPaidOnly
            }
          }
        }`,
        { skip, limit }
      );

      const page = data?.problemsetQuestionList;
      if (!page?.questions?.length) break;
      if (total === null) { total = page.total; console.log(`   Total: ${total}`); }

      all.push(...page.questions);
      process.stdout.write(`\r   Fetching list: ${all.length}/${total}   `);

      if (all.length >= total) break;
      skip += limit;
      await sleep(200);
    }

    if (all.length > 0) { console.log(); return all; }
  } catch (err) {
    console.log(`   Attempt B failed: ${err.message}`);
  }

  // Attempt C: allQuestions (legacy, returns everything at once)
  try {
    console.log("   Trying allQuestions query...");
    const data = await gql(
      `{ allQuestions { questionFrontendId title titleSlug difficulty acRate isPaidOnly } }`
    );
    const list = data?.allQuestions;
    if (list?.length) { console.log(`   Got ${list.length}`); return list; }
  } catch (err) {
    console.log(`   Attempt C failed: ${err.message}`);
  }

  return null;
}

// ─── Step 2: fetch tags for one problem ──────────────────────────────────────

async function fetchTags(titleSlug) {
  const data = await gql(
    `query($titleSlug: String!) {
      question(titleSlug: $titleSlug) { topicTags { name } }
    }`,
    { titleSlug }
  );
  return data?.question?.topicTags?.map((t) => t.name) || [];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("─".repeat(60));
  console.log("  LeetTrack — Metadata Fetcher");
  console.log("─".repeat(60));

  const existing = loadExisting();
  const existingCount = Object.keys(existing).length;

  console.log(
    isUpdate && existingCount > 0
      ? `\n📂 Update mode — ${existingCount} already cached`
      : "\n🚀 Fresh fetch"
  );

  console.log("\n⏳ Fetching problem list...");
  const allProblems = await fetchProblemList();

  if (!allProblems?.length) {
    console.error("\n❌ Could not fetch problem list. Possible causes:");
    console.error("   • Rate limited — wait 10 min and retry");
    console.error("   • LeetCode API changed — check github.com/alfaarghya/alfa-leetcode-api as alternative");
    console.error("   • No internet connection");
    process.exit(1);
  }

  console.log(`✅ ${allProblems.length} problems found`);

  const toFetch = allProblems.filter((p) => {
    if (p.isPaidOnly) return false;
    if (isUpdate && existing[String(p.questionFrontendId)]) return false;
    return true;
  });

  const premiumCount = allProblems.filter((p) => p.isPaidOnly).length;
  console.log(`📋 ${toFetch.length} to fetch  |  ${premiumCount} premium skipped  |  ${existingCount} cached`);

  if (toFetch.length === 0) {
    console.log("\n✨ All up to date!");
    process.exit(0);
  }

  const estMins = Math.ceil((toFetch.length * DELAY_MS) / 60000);
  console.log(`⏱  ~${estMins} minute${estMins !== 1 ? "s" : ""}\n`);

  const result = { ...existing };
  let success = 0;
  let failed = 0;

  for (let i = 0; i < toFetch.length; i++) {
    const p = toFetch[i];
    const id = String(p.questionFrontendId);

    const pct = Math.round(((i + 1) / toFetch.length) * 100);
    const filled = Math.floor(pct / 5);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    const slug = (p.titleSlug || "").substring(0, 28).padEnd(28);
    process.stdout.write(`\r  [${bar}] ${pct}%  ${i + 1}/${toFetch.length}  ${slug}`);

    let tags = [];
    try {
      tags = await fetchTags(p.titleSlug);
      success++;
    } catch (_) {
      failed++;
    }

    result[id] = {
      id: parseInt(id),
      slug: p.titleSlug,
      title: p.title,
      difficulty: p.difficulty,
      acceptance: fmt(p.acRate),
      tags,
      isPremium: false,
    };

    if ((i + 1) % 100 === 0) save(result);
    await sleep(DELAY_MS);
  }

  // add premium stubs
  for (const p of allProblems) {
    if (!p.isPaidOnly) continue;
    const id = String(p.questionFrontendId);
    if (!result[id]) {
      result[id] = {
        id: parseInt(p.questionFrontendId),
        slug: p.titleSlug,
        title: p.title,
        difficulty: p.difficulty,
        acceptance: fmt(p.acRate),
        tags: [],
        isPremium: true,
      };
    }
  }

  save(result);

  console.log("\n\n" + "─".repeat(60));
  console.log(`✅ ${success} fetched  |  ${failed} failed (empty tags)`);
  console.log(`📁 ${OUTPUT_FILE}`);
  console.log(`📊 ${Object.keys(result).length} total problems`);
  console.log("─".repeat(60));
  console.log("\n📌 Next:");
  console.log("   git add data/leetcode-meta.json");
  console.log('   git commit -m "Add LeetCode metadata"');
  console.log("   git push\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});