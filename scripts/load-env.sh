#!/usr/bin/env bash

set -a

if [[ ! -f ".env" && ! -f ".env.local" ]]; then
  echo "WARN: nessun file .env o .env.local trovato nella root del progetto." >&2
fi

if [[ -f ".env" ]]; then
  # shellcheck disable=SC1091
  source ".env"
fi

if [[ -f ".env.local" ]]; then
  # shellcheck disable=SC1091
  source ".env.local"
fi

set +a
