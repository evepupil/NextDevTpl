#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV=production
export PORT="${PORT:-3000}"

cd "$APP_DIR"
exec node server.js
