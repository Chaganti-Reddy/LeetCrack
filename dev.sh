#!/bin/bash
# Local dev (Windows Git Bash compatible):
#   - netlify dev  → functions + static at :8888
#   - browser-sync → proxies :8888, live reload at :4000

if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example to .env and fill in your values."
  exit 1
fi

# Load .env — tr -d '\r' handles Windows CRLF line endings
export $(grep -v '^#' .env | tr -d '\r' | xargs)

if [ -z "$GITHUB_CLIENT_ID" ]; then
  echo "❌ GITHUB_CLIENT_ID not set in .env"
  exit 1
fi

# Check browser-sync
if ! command -v browser-sync &>/dev/null; then
  echo "⚙  Installing browser-sync globally…"
  npm install -g browser-sync
fi

# Always regenerate manifest on startup
node generate-manifest.js

# Inject client ID using Node — avoids sed -i portability issues on Windows
node -e "
  const fs = require('fs');
  const original = fs.readFileSync('index.html', 'utf8');
  fs.writeFileSync('index.html.bak', original);
  const injected = original.replace(/REPLACE_GITHUB_CLIENT_ID/g, process.env.GITHUB_CLIENT_ID);
  fs.writeFileSync('index.html', injected);
  console.log('✓ Client ID injected');
"

# Watch data/*.csv using Node — cross-platform, no fswatch/inotifywait needed
node -e "
  const fs  = require('fs');
  const dir = require('path').join(process.cwd(), 'data');
  let debounce = null;
  fs.watch(dir, (_, filename) => {
    if (!filename || !filename.endsWith('.csv')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log('⚙  CSV change detected — regenerating manifest…');
      require('child_process').execSync('node generate-manifest.js', { stdio: 'inherit' });
    }, 300);
  });
  console.log('👀 Watching data/*.csv for changes…');
  process.stdin.resume();
" &
WATCHER_PID=$!

# Cleanup on exit — restore original index.html, kill background processes
cleanup() {
  echo ""
  if [ -f index.html.bak ]; then
    mv index.html.bak index.html
    echo "✓ index.html restored"
  fi
  kill $WATCHER_PID 2>/dev/null
  kill $NETLIFY_PID 2>/dev/null
}
trap cleanup EXIT

# Start netlify dev in background (functions + static server)
echo "✓ Starting Netlify Dev (functions) at http://localhost:8888"
netlify dev --port 8888 2>&1 | sed 's/^/[netlify] /' &
NETLIFY_PID=$!

# Wait for netlify dev to be ready
echo "⏳ Waiting for Netlify Dev to be ready…"
for i in $(seq 1 30); do
  if curl -s http://localhost:8888 &>/dev/null; then break; fi
  sleep 1
done

# Start browser-sync proxying netlify dev, open at :4000
echo "✓ Starting browser-sync with live reload at http://localhost:4000"
browser-sync start \
  --proxy "localhost:8888" \
  --files "index.html, style.css, app.js, data/manifest.json" \
  --port 4000 \
  --no-notify \
  --no-open