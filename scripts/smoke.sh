#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${SMOKE_BACKEND_PORT:-25342}"
SMOKE_DIR="$ROOT/tmp/smoke"
SLIDE_DIR="$SMOKE_DIR/slides"
APP_PORT="${SMOKE_APP_PORT:-$("$ROOT/.venv/bin/python" - <<'PY'
import socket

with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
PY
)}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

mkdir -p "$SLIDE_DIR"
"$ROOT/.venv/bin/python" "$ROOT/scripts/write-demo-slide.py" "$SLIDE_DIR/demo.png"

wait_for_url() {
  local url="$1"
  local name="$2"
  local ready=0
  for _ in {1..40}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 0.25
  done
  if [[ "$ready" -ne 1 ]]; then
    echo "$name did not become ready at $url"
    if [[ -f /tmp/openslide-stardist-viewer-preview.log ]]; then
      cat /tmp/openslide-stardist-viewer-preview.log
    fi
    exit 1
  fi
}

unset FORCE_COLOR
npm run build

(
  cd "$ROOT/backend"
  SLIDE_VIEWER_SLIDE_DIR="$SLIDE_DIR" \
  SLIDE_VIEWER_RESULT_DIR="$SMOKE_DIR/results" \
  SLIDE_VIEWER_ALLOWED_ORIGINS="http://127.0.0.1:$APP_PORT,http://localhost:$APP_PORT" \
  SLIDE_VIEWER_SEGMENTATION_BACKEND="fallback" \
  ../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

wait_for_url "http://127.0.0.1:$BACKEND_PORT/healthz" "backend health"
curl -fsS "http://127.0.0.1:$BACKEND_PORT/readyz" >/dev/null

npx vite preview --host 127.0.0.1 --port "$APP_PORT" --strictPort >/tmp/openslide-stardist-viewer-preview.log 2>&1 &
FRONTEND_PID=$!
sleep 0.25
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
  cat /tmp/openslide-stardist-viewer-preview.log
  exit 1
fi
wait_for_url "http://127.0.0.1:$APP_PORT/openslide-stardist-viewer/" "frontend preview"

SMOKE_APP_URL="http://127.0.0.1:$APP_PORT/openslide-stardist-viewer/" npx playwright test
