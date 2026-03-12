#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
WEB_PID_FILE="$RUNTIME_DIR/web.pid"
MOBILE_PID_FILE="$RUNTIME_DIR/mobile.pid"

export PATH="/opt/homebrew/bin:$PATH"

mkdir -p "$RUNTIME_DIR"

source "$ROOT_DIR/scripts/load-env.sh"

port_status() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

print_pid_status() {
  local pid_file="$1"
  local label="$2"
  local port="${3:-}"

  if [[ ! -f "$pid_file" ]]; then
    if [[ -n "$port" ]]; then
      local port_pid
      port_pid="$(port_status "$port")"
      if [[ -n "$port_pid" ]]; then
        echo "$label: attivo (porta $port, pid $port_pid)"
        return
      fi
    fi
    echo "$label: fermo"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "$label: attivo (pid $pid)"
  else
    rm -f "$pid_file"
    if [[ -n "$port" ]]; then
      local port_pid
      port_pid="$(port_status "$port")"
      if [[ -n "$port_pid" ]]; then
        echo "$label: attivo (porta $port, pid $port_pid)"
        return
      fi
    fi
    echo "$label: fermo (pid file obsoleto)"
  fi
}

cd "$ROOT_DIR"

echo "==> Supabase"
supabase status || true
echo
echo "==> Processi applicativi"
print_pid_status "$WEB_PID_FILE" "web" "3000"
print_pid_status "$MOBILE_PID_FILE" "mobile" "8081"
