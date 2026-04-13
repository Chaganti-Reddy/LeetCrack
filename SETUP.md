# AlgoTrack — Setup Guide

## How it works

- LeetCode questions are auto-loaded from all CSV files in `data/`
- Codeforces and AtCoder problems are loaded from metadata JSON files in `data/`
- Each user logs in with GitHub OAuth — progress is saved to **their own private GitHub Gist**
- No database, no backend storage — just GitHub's infrastructure
- You (the repo owner) create one OAuth App; every visitor just clicks "Login with GitHub"

---

## Local Development

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Create a GitHub OAuth App for local dev

Go to: https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**

| Field | Value |
|---|---|
| Application name | AlgoTrack Dev |
| Homepage URL | `http://localhost:8888` |
| Authorization callback URL | `http://localhost:8888/api/github-oauth` |

Click **Register application**, then generate a **Client Secret**.

### 3. Set up your .env file

```bash
cp .env.example .env
```

Edit `.env` with your dev OAuth app credentials:

```
GITHUB_CLIENT_ID=your_dev_client_id
GITHUB_CLIENT_SECRET=your_dev_client_secret
```

`.env` is gitignored — it will never be committed.

### 4. Run the dev server

```bash
./dev.sh
```

This script:
- Checks for `.env` and validates required vars
- Injects `GITHUB_CLIENT_ID` into `index.html` (restores original on exit)
- Regenerates `data/manifest.json` from `data/*.csv`
- Starts **Netlify Dev** at `http://localhost:8888` (functions + static)
- Starts **browser-sync** at `http://localhost:4000` (live reload proxy over `:8888`)
- Watches `data/*.csv` for changes and auto-regenerates the manifest

> Open `http://localhost:4000` for development. Use `:8888` if you just need the raw server without live reload.

### 5. Test the full flow

1. Open `http://localhost:4000`
2. Click **Login with GitHub**
3. Approve the OAuth prompt
4. Solve a question — check https://gist.github.com to confirm a private gist named `leetcode-tracker-progress.json` was created automatically

---

## Fetching Platform Metadata (one-time, run locally)

These scripts populate `data/` with problem metadata required for filtering, tags, and difficulty display. Run once and commit the output — they don't need to be re-run unless you want to refresh the data.

### LeetCode metadata

Fetches topic tags, slugs, and acceptance rates for all ~3000 public problems.

```bash
node fetch-leetcode-metadata.js           # fresh fetch (~25 min due to rate limiting)
node fetch-leetcode-metadata.js --update  # only fetch new problems not already cached
```

Output: `data/leetcode-meta.json`

> LeetCode rate-limits tag fetches, which is why this takes time. The `--update` flag skips already-cached problems and is much faster on subsequent runs.

### Codeforces metadata

Fetches all rated CF problems with ratings and algorithm tags via the public Codeforces API.

```bash
node fetch-cf-metadata.js
```

Output: `data/cf-meta.json`

### AtCoder metadata

Fetches all AtCoder problems with difficulty estimates via the AtCoder Problems public API (kenkoooo.com).

```bash
node fetch-atcoder-metadata.js
```

Output: `data/atcoder-meta.json`

> AtCoder problems don't have algorithm tags — only difficulty estimates and solve counts. This is a limitation of the data source, not the app.

After running any of these, commit the output:

```bash
git add data/
git commit -m "Update platform metadata"
git push
```

---

## Adding New Companies / Questions

Drop a new `.csv` file into `data/`. The filename format is:

```
companyname_timeframe.csv
```

Examples: `google_alltime.csv`, `stripe_1year.csv`, `amazon_6months.csv`

The CSV must have these columns (standard LeetCode company export format):
```
ID, Title, Acceptance, Difficulty, Frequency, Leetcode Question Link
```

Run the manifest generator, then commit:

```bash
node generate-manifest.js
git add data/
git commit -m "Add <company> CSV"
git push
```

`dev.sh` auto-regenerates the manifest on startup and watches for CSV changes during development, so manual runs are only needed outside of dev mode.

---

## LeetCode Sync Modes

The app supports two sync modes for LeetCode:

| Mode | Trigger | What it fetches | Auth required |
|------|---------|-----------------|---------------|
| Regular sync | `⟳ Sync` button or on page load | Last 20 accepted submissions | None (public profile) |
| Full history sync | One-time modal | Complete submission history | `LEETCODE_SESSION` cookie |

**Recommended flow:**
1. Connect your LeetCode username
2. Run **Full History Sync** once (paste your `LEETCODE_SESSION` cookie from browser DevTools)
3. All historical solves are imported and saved to your GitHub Gist
4. From then on, regular sync keeps new solves up to date — the cookie is never needed again

> LeetCode's public API hard-caps at 20 submissions. The cookie-based full sync is the only way to access complete history — this is a LeetCode API limitation, not an app limitation.

---

## Question Cache

After the first load, LeetCode question data (CSV merges + metadata) is cached in `localStorage` and keyed to a hash of `manifest.json`. Subsequent loads are near-instant — no CSV fetches happen unless you've added or removed CSV files.

To force a cache refresh from the browser console:

```js
clearLCCache()   // then reload the page
```

---

## Production Deployment (Netlify)

### 1. Create a GitHub OAuth App for production

Go to: https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**

| Field | Value |
|---|---|
| Application name | AlgoTrack |
| Homepage URL | `https://your-site.netlify.app` |
| Authorization callback URL | `https://your-site.netlify.app/api/github-oauth` |

> Use your actual Netlify domain. You can update this after the first deploy.

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/algotrack.git
git push -u origin main
```

### 3. Connect to Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**
2. Connect your GitHub repo
3. Build settings are auto-detected from `netlify.toml` — no changes needed

### 4. Set environment variables in Netlify

Go to: **Site settings → Environment variables → Add a variable**

| Key | Value |
|---|---|
| `GITHUB_CLIENT_ID` | Your production OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Your production OAuth App Client Secret |

### 5. Deploy

Trigger a deploy (or push a commit). Netlify will automatically:

1. Run `node generate-manifest.js` — scans `data/` and builds the manifest
2. Inject `GITHUB_CLIENT_ID` into `index.html`
3. Deploy all functions (`github-oauth`, `lc-sync`, `ac-sync`) and static assets

Your site is live. Share the URL — anyone can click "Login with GitHub" and start tracking.

---

## Serverless Functions

| Function | Route | Purpose |
|---|---|---|
| `github-oauth.js` | `/api/github-oauth` | Exchanges GitHub OAuth code for access token |
| `lc-sync.js` | (called by frontend directly) | Proxies LeetCode GraphQL — handles both public (last 20) and cookie-based (full history) sync |
| `ac-sync.js` | `/api/ac-sync` | Proxies kenkoooo.com AtCoder submission API (blocked for browser CORS) |

---

## Environment Variables Summary

| Variable | Where | Purpose |
|---|---|---|
| `GITHUB_CLIENT_ID` | `.env` + Netlify env vars | Injected into `index.html` at build/dev time — safe to expose |
| `GITHUB_CLIENT_SECRET` | `.env` + Netlify env vars | Used server-side only by `github-oauth.js` — never sent to browser |

---

## File Structure

```
/
├── index.html                          # Main app shell
├── app.js                              # All frontend logic
├── style.css                           # Styles
├── netlify.toml                        # Build config + function redirects
├── generate-manifest.js                # Scans data/ and writes manifest.json
├── dev.sh                              # Local dev script (cross-platform, Git Bash compatible)
├── .env.example                        # Template for local env vars
├── .gitignore
├── fetch-leetcode-metadata.js          # One-time: LC tags/slugs → data/leetcode-meta.json
├── fetch-cf-metadata.js                # One-time: CF ratings/tags → data/cf-meta.json
├── fetch-atcoder-metadata.js           # One-time: AC difficulties → data/atcoder-meta.json
├── SETUP.md                            # This file
├── README.md                           # Quick overview and setup summary
├── netlify/
│   └── functions/
│       ├── github-oauth.js             # Serverless: OAuth token exchange
│       ├── lc-sync.js                  # Serverless: LeetCode submission proxy
│       └── ac-sync.js                  # Serverless: AtCoder submission proxy
└── data/
    ├── manifest.json                   # Auto-generated — lists all CSV files
    ├── leetcode-meta.json              # LC metadata (tags, slugs, difficulty, acceptance)
    ├── cf-meta.json                    # CF metadata (ratings, tags, solve counts)
    ├── atcoder-meta.json               # AC metadata (difficulty estimates, solve counts)
    ├── google_alltime.csv
    ├── amazon_6months.csv
    └── ...                             # Drop more company CSVs here anytime
```