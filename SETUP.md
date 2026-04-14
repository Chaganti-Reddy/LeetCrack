# AlgoTrack — Setup Guide

## How it works

- **LeetCode questions** are auto-loaded from CSV files in `data/`.
- **Codeforces and AtCoder** problems are loaded from metadata JSON files in `data/`.
- **User Progress Sync**: Progress is saved to a **Supabase Database**. 
- **Authentication**: Uses **Supabase Auth** (configured with GitHub). This allows cross-device sync and permanent storage without relying on browser `localStorage` or private Gists.
- **Contest Tracking**: A dedicated dashboard pulls upcoming/past contests from all three platforms via a serverless proxy.

---

## 1. Supabase Setup (Database & Auth)

Before running the app, you need a Supabase project.

1. **Create Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Initialize Schema**: 
   - Go to the **SQL Editor** in the Supabase dashboard.
   - Copy the contents of `supabase-schema.sql` from this repo and run it. 
   - This creates the `user_progress` and `user_settings` tables.
3. **Configure Auth**:
   - Go to **Authentication** -> **Providers** -> **GitHub**.
   - Enable it. You will need to create a GitHub OAuth App (see below) and paste the **Client ID** and **Client Secret** into Supabase.
   - **Important**: In your GitHub OAuth App, set the "Authorization callback URL" to the one provided by Supabase (e.g., `https://your-project.supabase.co/auth/v1/callback`).
   - Add https://localhost:8888 to redirect URLs in your Supabase OAuth App.

---

## 2. Local Development

### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Set up your .env file
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials found in **Project Settings -> API**:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run the dev server
```bash
./dev.sh
```
This script:
- Injects Supabase keys into `index.html` at runtime.
- Regenerates `data/manifest.json`.
- Starts **Netlify Dev** (functions) at `:8888` and **browser-sync** (UI) at `:4000`.

---

## 3. Fetching Platform Metadata

Run these once to populate problem metadata (tags, difficulty, ratings).

```bash
node fetch-leetcode-metadata.js           # ~25 min (rate-limited)
node fetch-leetcode-metadata.js --update  # update only new problems
node fetch-cf-metadata.js                 # Fast
node fetch-atcoder-metadata.js            # Fast
```
*Commit the resulting `.json` files in the `data/` folder.*

---

## 4. Adding New Companies / Questions

1. Drop a new `.csv` file into `data/` (e.g., `uber_6months.csv`).
2. Format must match: `ID, Title, Acceptance, Difficulty, Frequency, Leetcode Question Link`.
3. Run `node generate-manifest.js`.
4. Commit and push.

---

## 5. LeetCode Sync Modes

| Mode | Trigger | Storage |
|------|---------|---------|
| **Regular Sync** | `⟳ Sync` button | Fetches last 20 accepted solves via GraphQL. |
| **Full History** | One-time modal | Requires `LEETCODE_SESSION` cookie; imports entire history. |

**All synced data is automatically pushed to Supabase** if you are logged in.

---

## 6. Production Deployment (Netlify)

### 1. Push to GitHub
Ensure your repo is updated with all `data/*.json` metadata and the `manifest.json`.

### 2. Connect to Netlify
1. Create a new site from your GitHub repo.
2. Build settings are handled by `netlify.toml`.

### 3. Set Environment Variables
In Netlify **Site settings → Environment variables**:

| Key | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key |

*Note: The build script automatically injects these into your HTML so the frontend can initialize the Supabase client.*

---

## 7. Serverless Functions

| Function | Route | Purpose |
|---|---|---|
| `lc-sync.js` | `/api/lc-sync` | Proxies LeetCode GraphQL (handles CORS + cookies). |
| `ac-sync.js` | `/api/ac-sync` | Proxies AtCoder (kenkoooo) submission API. |
| `contests-proxy.js` | `/api/contests-proxy` | Aggregates contest schedules from multiple platforms. |

---

## File Structure

```
/
├── app.js                     # Frontend logic (Supabase client, Auth, UI)
├── index.html                 # App shell (Env vars injected here during build)
├── supabase-schema.sql        # Database tables & RLS policies
├── netlify/functions/
│   ├── contests-proxy.js      # NEW: Fetches contest data
│   ├── lc-sync.js             # Proxies LC submissions
│   └── ac-sync.js             # Proxies AtCoder submissions
├── data/
│   ├── manifest.json          # List of active company CSVs
│   ├── leetcode-meta.json     # LC problem database
│   ├── cf-meta.json           # CF problem database
│   └── atcoder-meta.json      # AC problem database
└── ...
```