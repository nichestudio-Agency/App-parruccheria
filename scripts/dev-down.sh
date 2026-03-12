#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
WEB_PID_FILE="$RUNTIME_DIR/web.pid"
MOBILE_PID_FILE="$RUNTIME_DIR/mobile.pid"

export PATH="/opt/homebrew/bin:$PATH"

mkdir -p "$RUNTIME_DIR"

source "$ROOT_DIR/scripts/load-env.sh"

stop_pid_file() {
  local pid_file="$1"
  local label="$2"
  local port="${3:-}"

  if [[ ! -f "$pid_file" ]]; then
    if [[ -n "$port" ]]; then
      local port_pid
      port_pid="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
      if [[ -n "$port_pid" ]]; then
        echo "==> Arresto $label via porta $port (pid $port_pid)"
        kill "$port_pid" >/dev/null 2>&1 || true
      else
        echo "==> $label non attivo"
      fi
    else
      echo "==> $label non attivo"
    fi
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "==> Arresto $label (pid $pid)"
    kill "$pid" >/dev/null 2>&1 || true
  else
    if [[ -n "$port" ]]; then
      local port_pid
      port_pid="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
      if [[ -n "$port_pid" ]]; then
        echo "==> Arresto $label via porta $port (pid $port_pid)"
        kill "$port_pid" >/dev/null 2>&1 || true
      else
        echo "==> $label gia fermo"
      fi
    else
      echo "==> $label gia fermo"
    fi
  fi

  rm -f "$pid_file"
}

cd "$ROOT_DIR"

stop_pid_file "$WEB_PID_FILE" "web" "3000"
stop_pid_file "$MOBILE_PID_FILE" "mobile" "8081"

echo "==> Arresto Supabase locale"
supabase stop
