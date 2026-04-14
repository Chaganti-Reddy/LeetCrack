# AlgoTrack

Multi-platform competitive programming tracker with **Supabase** sync.
Supports **LeetCode**, **Codeforces**, and **AtCoder** — all in one place.

## Project Structure

```
/
├── index.html                        # Main UI
├── app.js                            # All frontend logic + Supabase integration
├── style.css                         # Styles
├── generate-manifest.js              # Run after adding new CSVs
├── netlify.toml                      # Netlify build config + redirects
├── dev.sh                            # Local dev helper (Windows Git Bash compatible)
├── .env.example                      # Template for local env vars
├── supabase-schema.sql               # Database schema for Supabase
├── fetch-leetcode-metadata.js        # Fetches LC tags/slugs → data/leetcode-meta.json
├── fetch-cf-metadata.js              # Fetches CF ratings/tags → data/cf-meta.json
├── fetch-atcoder-metadata.js         # Fetches AC difficulties → data/atcoder-meta.json
├── netlify/functions/
│   ├── lc-sync.js                    # LeetCode submission proxy
│   ├── ac-sync.js                    # AtCoder submission proxy
│   └── contests-proxy.js             # Fetches upcoming/past contests
└── data/
    ├── manifest.json                 # Auto-generated list of CSV files
    ├── leetcode-meta.json            # LC problem metadata
    ├── cf-meta.json                  # CF problem metadata
    ├── atcoder-meta.json             # AC problem metadata
    └── ... (company CSVs)
```

---

## Quick Setup

### 0. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Homepage URL**: `https://your-site.netlify.app`
   - **Authorization callback URL**: `https://your-site.netlify.app/api/github-oauth`
3. Copy the **Client ID** and generate a **Client Secret**

### 1. Supabase Setup (Database & Auth)

1. Create a new project at [Supabase](https://supabase.com/).
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`. This creates the necessary tables for user progress and contest tracking.
3. Go to **Authentication** -> **Providers** and enable **GitHub** (or your preferred provider).

### 2. Fetch Platform Metadata

These scripts populate the `data/` folder with problem metadata. Run each once and commit the output.

```bash
node fetch-leetcode-metadata.js     # ~25 min
node fetch-cf-metadata.js           # Fast
node fetch-atcoder-metadata.js      # Fast
```

### 3. Set Environment Variables

In your Netlify dashboard (**Site settings → Environment variables**), add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase Anon/Public Key |

*The build process will automatically inject these into your frontend.*

### 4. Deploy

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Features & Progress Sync

### Contest Tracking
The new **Contests** dashboard pulls upcoming and recent contests from LeetCode, Codeforces, and AtCoder via `netlify/functions/contests-proxy.js`. It helps you stay updated on the competitive calendar.

### Progress Persistence
| State | Storage |
|-------|---------|
| **Logged In** | **Supabase Database** (Permanent, cross-device sync) |
| **Guest** | `localStorage` (Browser only) |

When you log in, your local progress is automatically merged with your Supabase account.

---

## Adding More Companies / CSVs

1. Drop the `.csv` file into `data/`
2. Run `node generate-manifest.js`
3. Commit and push.

The app will detect the new file and update the company filter automatically.

---

## LeetCode Sync Modes

| Mode | How | Benefit |
|------|-----|-------------|
| **Regular Sync** | GraphQL Proxy | Syncs last 20 accepted submissions instantly. |
| **Full History** | `LEETCODE_SESSION` | One-time bootstrap to import your entire LC history into Supabase. |

---

## Local Development

See [SETUP.md](SETUP.md) for the full local dev walkthrough.

```bash
./dev.sh    # starts Netlify Dev at :8888 + browser-sync with live reload at :4000
```
*Requires Netlify CLI for serverless function emulation.*