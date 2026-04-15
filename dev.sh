#!/bin/bash
# Local dev (Windows Git Bash compatible):
#   - netlify dev  → functions + static at :8888
#   - browser-sync → proxies :8888, live reload at :4000
#
# Required .env vars: SUPABASE_URL, SUPABASE_ANON

if [ ! -f .env ]; then
  echo ".env file not found. Copy .env.example to .env and fill in your values."
  exit 1
fi

export $(grep -v '^#' .env | tr -d '\r' | xargs)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON" ]; then
  echo "SUPABASE_URL or SUPABASE_ANON not set in .env"
  exit 1
fi

if ! command -v browser-sync &>/dev/null; then
  echo "⚙  Installing browser-sync globally…"
  npm install -g browser-sync
fi

cleanup() {
  echo ""
  kill $NETLIFY_PID 2>/dev/null
}
trap cleanup EXIT

echo "Starting Netlify Dev (functions) at http://localhost:8888"
netlify dev --port 8888 2>&1 | sed 's/^/[netlify] /' &
NETLIFY_PID=$!

echo "⏳ Waiting for Netlify Dev to be ready…"
for i in $(seq 1 30); do
  if curl -s http://localhost:8888 &>/dev/null; then break; fi
  sleep 1
done

echo "Starting browser-sync with live reload at http://localhost:4000"
browser-sync start \
  --proxy "localhost:8888" \
  --files "index.html, style.css, app.js" \
  --port 4000 \
  --no-notify \
  --no-open