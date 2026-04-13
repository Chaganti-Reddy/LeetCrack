# AlgoTrack

Multi-platform competitive programming tracker with GitHub OAuth progress sync.
Supports **LeetCode**, **Codeforces**, and **AtCoder** — all in one place.

## Project Structure

```
/
├── index.html                        # Main UI
├── app.js                            # All frontend logic
├── style.css                         # Styles
├── generate-manifest.js              # Run after adding new CSVs
├── netlify.toml                      # Netlify build config + redirects
├── dev.sh                            # Local dev helper (Windows Git Bash compatible)
├── .env.example                      # Template for local env vars
├── fetch-leetcode-metadata.js        # One-time: fetches LC tags/slugs → data/leetcode-meta.json
├── fetch-cf-metadata.js              # One-time: fetches CF ratings/tags → data/cf-meta.json
├── fetch-atcoder-metadata.js         # One-time: fetches AC difficulties → data/atcoder-meta.json
├── netlify/functions/
│   ├── github-oauth.js               # OAuth token exchange (serverless)
│   ├── lc-sync.js                    # LeetCode submission proxy (serverless)
│   └── ac-sync.js                    # AtCoder submission proxy via kenkoooo (serverless)
└── data/
    ├── manifest.json                 # Auto-generated list of CSV files
    ├── leetcode-meta.json            # LC problem metadata (tags, slugs, acceptance)
    ├── cf-meta.json                  # CF problem metadata (ratings, tags)
    ├── atcoder-meta.json             # AC problem metadata (difficulty estimates)
    ├── google_alltime.csv
    └── ... (add more company CSVs here)
```

---

## Quick Setup

### 1. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Homepage URL**: `https://your-site.netlify.app`
   - **Authorization callback URL**: `https://your-site.netlify.app/api/github-oauth`
3. Copy the **Client ID** and generate a **Client Secret**

### 2. Fetch platform metadata (one-time)

These scripts populate the `data/` folder with problem metadata needed for tags, difficulty, and filtering. Run each once and commit the output.

```bash
node fetch-leetcode-metadata.js     # → data/leetcode-meta.json  (~3000 problems, takes ~25 min)
node fetch-cf-metadata.js           # → data/cf-meta.json        (fast, single API call)
node fetch-atcoder-metadata.js      # → data/atcoder-meta.json   (fast, single API call)
```

### 3. Deploy to Netlify

Push to GitHub and connect the repo in the Netlify dashboard, or use the CLI:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 4. Set environment variables in Netlify

In **Site settings → Environment variables**, add:

| Key | Value |
|-----|-------|
| `GITHUB_CLIENT_ID` | Your OAuth app Client ID |
| `GITHUB_CLIENT_SECRET` | Your OAuth app Client Secret |

`GITHUB_CLIENT_ID` is automatically injected into `index.html` at build time — no manual HTML edits needed.

---

## Adding More Companies / CSVs

1. Drop the `.csv` file into `data/`
2. Run `node generate-manifest.js`
3. Commit and push — done

CSV format (standard LeetCode company export):
```
ID,Title,Acceptance,Difficulty,Frequency,Leetcode Question Link
1,Two Sum,45.6%,Easy,3.69,...
```

---

## How Progress Sync Works

| State | Storage |
|-------|---------|
| Logged in with GitHub | Private GitHub Gist (syncs across devices) |
| Not logged in | `localStorage` (browser only) |

The Gist is created automatically on first solve. LC question data (CSVs + metadata) is cached in `localStorage` after the first load and only re-fetched when the manifest changes — so subsequent loads are near-instant.

---

## LeetCode Sync Modes

| Mode | How | What you get |
|------|-----|-------------|
| Regular sync (`⟳ Sync`) | Public GraphQL API, no auth | Last 20 accepted submissions |
| Full history sync (one-time) | `LEETCODE_SESSION` cookie | Complete submission history |

Run the full sync once to bootstrap all your historical solves. After that, regular sync keeps new solves up to date — and everything is persisted in your Gist, so you never need the cookie again unless you want to re-bootstrap.

---

## Local Development

See [SETUP.md](SETUP.md) for the full local dev walkthrough.

```bash
./dev.sh    # starts Netlify Dev at :8888 + browser-sync with live reload at :4000
```