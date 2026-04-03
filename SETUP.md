# LeetTrack — Setup Guide

## How it works

- Questions are auto-loaded from all CSV files in `data/`
- Each user logs in with GitHub OAuth — their progress is saved to **their own private GitHub Gist**
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
| Application name | LeetTrack Dev |
| Homepage URL | `http://localhost:8888` |
| Authorization callback URL | `http://localhost:8888/api/github-oauth` |

Click **Register application**, then generate a **Client Secret**.

### 3. Set up your .env file

```bash
cp .env.example .env
```

Edit `.env` and fill in your dev OAuth app credentials:

```
GITHUB_CLIENT_ID=your_dev_client_id
GITHUB_CLIENT_SECRET=your_dev_client_secret
```

`.env` is gitignored — it will never be committed.

### 4. Run the dev server

```bash
./dev.sh
```

This will:
- Inject your `GITHUB_CLIENT_ID` into the HTML
- Start Netlify Dev at `http://localhost:8888`
- Restore `index.html` to its original state when you stop the server

### 5. Test the full flow

1. Open `http://localhost:8888`
2. Click **Login with GitHub**
3. Approve the OAuth prompt
4. You're redirected back and logged in
5. Solve a question (check the checkbox)
6. Check https://gist.github.com — you'll see a private gist named `leetcode-tracker-progress.json` created automatically

---

## Adding New Companies / Questions

Just drop a new `.csv` file into the `data/` folder. The filename format is:

```
companyname_timeframe.csv
```

Examples: `google_alltime.csv`, `stripe_1year.csv`, `amazon_6months.csv`

The CSV must have these columns (same format as LeetCode company exports):
```
ID, Title, Acceptance, Difficulty, Frequency, Leetcode Question Link
```

On next deploy (or `./dev.sh`), the manifest is auto-regenerated and the new questions appear automatically. No other changes needed.

---

## Production Deployment (Netlify)

### 1. Create a GitHub OAuth App for production

Go to: https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**

| Field | Value |
|---|---|
| Application name | LeetTrack |
| Homepage URL | `https://your-site.netlify.app` |
| Authorization callback URL | `https://your-site.netlify.app/api/github-oauth` |

> Use your actual Netlify domain. You can update this after the first deploy.

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/leetcode-tracker.git
git push -u origin main
```

### 3. Connect to Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**
2. Connect your GitHub repo
3. Build settings are auto-detected from `netlify.toml` — no changes needed

### 4. Set environment variables in Netlify

Go to: **Site settings** → **Environment variables** → **Add a variable**

| Key | Value |
|---|---|
| `GITHUB_CLIENT_ID` | Your production OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Your production OAuth App Client Secret |

### 5. Deploy

Trigger a deploy (or just push a commit). Netlify will:
1. Run `node generate-manifest.js` — scans `data/` and builds the manifest
2. Inject your `GITHUB_CLIENT_ID` into `index.html`
3. Deploy everything

Your site is live. Share the URL — anyone can click "Login with GitHub" and start tracking.

---

## Environment Variables Summary

| Variable | Where | Purpose |
|---|---|---|
| `GITHUB_CLIENT_ID` | `.env` (local) + Netlify env vars | Public OAuth app identifier — injected into HTML at build time |
| `GITHUB_CLIENT_SECRET` | `.env` (local) + Netlify env vars | Secret used by the serverless function to exchange OAuth codes — never exposed to browser |

---

## File Structure

```
/
├── index.html                          # Main app shell
├── app.js                              # All frontend logic
├── style.css                           # Styles
├── netlify.toml                        # Build config + redirects
├── generate-manifest.js                # Scans data/ and writes manifest.json
├── dev.sh                              # Local dev helper script
├── .env.example                        # Template for local env vars
├── .gitignore
├── SETUP.md                            # This file
├── netlify/
│   └── functions/
│       └── github-oauth.js             # Serverless function: OAuth token exchange
└── data/
    ├── manifest.json                   # Auto-generated — lists all CSV files
    ├── microsoft_alltime.csv
    ├── netflix_alltime.csv
    └── ...                             # Drop more CSVs here anytime
```
