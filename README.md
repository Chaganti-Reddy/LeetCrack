# LeetCode Tracker

Company-wise LeetCode tracker with GitHub OAuth progress sync.

## Project Structure

```
/
├── index.html                   # Main UI
├── app.js                       # All frontend logic
├── style.css                    # Styles
├── generate-manifest.js         # Run after adding new CSVs
├── netlify.toml                 # Netlify config
├── netlify/functions/
│   └── github-oauth.js          # OAuth token exchange (serverless)
└── data/
    ├── manifest.json            # Auto-generated list of CSV files
    ├── microsoft_alltime.csv
    └── ... (add more CSVs here)
```

---

## Setup (one-time)

### 1. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: LeetCode Tracker (or anything)
   - **Homepage URL**: `https://your-site.netlify.app`
   - **Authorization callback URL**: `https://your-site.netlify.app/api/github-oauth`
3. Click **Register application**
4. Copy the **Client ID** and generate a **Client Secret**

---

### 2. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

Or push to GitHub and connect repo to Netlify dashboard (recommended).

---

### 3. Set Environment Variables in Netlify

In Netlify dashboard → **Site settings** → **Environment variables**, add:

| Key | Value |
|-----|-------|
| `GITHUB_CLIENT_ID` | your OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | your OAuth app client secret |

---

### 4. Update Client ID in index.html

In `index.html`, replace:
```html
<script>window.GITHUB_CLIENT_ID = "YOUR_CLIENT_ID_HERE";</script>
```
with your actual Client ID (the client ID is safe to expose in the frontend).

---

## Adding More Companies / CSVs

1. Drop the new `.csv` file into the `data/` folder
2. Run `node generate-manifest.js`
3. Commit and push — done. The frontend auto-detects everything.

CSV format expected (standard LeetCode company export):
```
ID,Title,Acceptance,Difficulty,Frequency,Leetcode Question Link
1,Two Sum,45.6%,Easy,3.69,...
```

---

## How Progress Sync Works

- **Logged in**: Progress saved to a private GitHub Gist under the user's account. Works across devices.
- **Not logged in**: Progress saved to localStorage (browser only, no account needed).

The Gist is created automatically on first solve — no manual setup needed.

---

## Local Development

```bash
# Install Netlify CLI for local function testing
npm install -g netlify-cli

# Run locally (serves functions + frontend together)
netlify dev
```

Then open http://localhost:8888

For OAuth to work locally, add `http://localhost:8888/api/github-oauth` as an additional callback URL in your GitHub OAuth app settings.
