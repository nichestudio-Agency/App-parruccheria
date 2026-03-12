#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"
WEB_PID_FILE="$RUNTIME_DIR/web.pid"
MOBILE_PID_FILE="$RUNTIME_DIR/mobile.pid"

mkdir -p "$LOG_DIR"

export PATH="/opt/homebrew/bin:$PATH"

cd "$ROOT_DIR"

# Load local environment variables before starting Supabase and app runtimes.
# `.env.local` overrides `.env` when both exist.
source "$ROOT_DIR/scripts/load-env.sh"

start_supabase() {
  echo "==> Avvio Supabase locale"
  supabase start
}

is_running() {
  local pid_file="$1"

  if [[ ! -f "$pid_file" ]]; then
    return 1
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -z "$pid" ]]; then
    return 1
  fi

  kill -0 "$pid" >/dev/null 2>&1
}

port_pid() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

ensure_running() {
  local pid_file="$1"
  local port="${2:-}"

  if is_running "$pid_file"; then
    return 0
  fi

  if [[ -n "$port" ]]; then
    local existing_pid
    existing_pid="$(port_pid "$port")"
    if [[ -n "$existing_pid" ]]; then
      echo "$existing_pid" >"$pid_file"
      return 0
    fi
  fi

  return 1
}

start_detached() {
  local pid_file="$1"
  local log_file="$2"
  local workdir="$3"
  local port="${4:-}"
  shift 4
  local command=("$@")
  local extra_args=()

  if [[ -n "$port" ]]; then
    extra_args=(--port "$port")
  fi

  if ! python3 "$ROOT_DIR/scripts/run-detached.py" \
    --pid-file "$pid_file" \
    --log-file "$log_file" \
    --cwd "$workdir" \
    "${extra_args[@]}" \
    -- "${command[@]}"; then
    echo "==> Avvio fallito. Controlla il log: $log_file"
    return 1
  fi
}

start_web() {
  if ensure_running "$WEB_PID_FILE" "3000"; then
    echo "==> Web gia attivo (pid $(cat "$WEB_PID_FILE"))"
    return
  fi

  echo "==> Avvio pannello web su http://localhost:3000"
  start_detached "$WEB_PID_FILE" "$LOG_DIR/web.log" "$ROOT_DIR/apps/web" "3000" ./node_modules/.bin/next dev
}

start_mobile() {
  if ensure_running "$MOBILE_PID_FILE" "8081"; then
    echo "==> Mobile gia attivo (pid $(cat "$MOBILE_PID_FILE"))"
    return
  fi

  echo "==> Avvio Expo mobile"
  export HOME="$ROOT_DIR"
  start_detached "$MOBILE_PID_FILE" "$LOG_DIR/mobile.log" "$ROOT_DIR/apps/mobile" "8081" ./node_modules/.bin/expo start --offline
}

start_supabase
start_web
start_mobile

echo
echo "Ambiente locale avviato."
echo "Web:    http://localhost:3000/login"
echo "Salon:  http://localhost:3000/salon/login"
echo "Studio: http://127.0.0.1:54323"
echo
echo "Log:"
echo "  $LOG_DIR/web.log"
echo "  $LOG_DIR/mobile.log"
