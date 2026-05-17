#!/bin/bash
# Dev script for v2 (React+Vite)
# Runs netlify dev (functions at :8888) + Vite dev server (app at :5173, proxied via :8888)
#
# Required: .env in repo root with SUPABASE_URL, SUPABASE_ANON

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo ".env file not found. Copy .env.example to .env and fill in your values."
  exit 1
fi

export $(grep -v '^#' .env | tr -d '\r' | xargs)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON" ]; then
  echo "SUPABASE_URL or SUPABASE_ANON not set in .env"
  exit 1
fi

cleanup() {
  echo ""
  kill $NETLIFY_PID 2>/dev/null
}
trap cleanup EXIT

echo "Starting Netlify Dev (functions + Vite) at http://localhost:8888"
cd v2 && netlify dev 2>&1 | sed 's/^/[netlify] /'
NETLIFY_PID=$!
wait $NETLIFY_PID
