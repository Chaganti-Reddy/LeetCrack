#!/usr/bin/env node
/**
 * generate-manifest.js
 * Scans data/*.csv and writes data/manifest.json.
 * Skips regeneration if the manifest is already up-to-date (same files, same order).
 *
 * Run manually when adding new CSV files:
 *   node generate-manifest.js
 *
 * On Netlify: called via netlify.toml build command.
 */

const fs   = require("fs");
const path = require("path");

const dataDir      = path.join(__dirname, "data");
const manifestPath = path.join(dataDir, "manifest.json");

const files = fs.readdirSync(dataDir)
  .filter((f) => f.endsWith(".csv"))
  .sort();

if (fs.existsSync(manifestPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (JSON.stringify(existing) === JSON.stringify(files)) {
      console.log(`✓ manifest.json already up-to-date (${files.length} CSV files). Skipping.`);
      process.exit(0);
    }
  } catch (_) { /* corrupt manifest — regenerate */ }
}

fs.writeFileSync(manifestPath, JSON.stringify(files, null, 2));
console.log(`✓ manifest.json updated with ${files.length} CSV files:`);
files.forEach((f) => console.log(`  · ${f}`));
