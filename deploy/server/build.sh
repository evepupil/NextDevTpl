#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELEASE_DIR="${RELEASE_DIR:-$ROOT_DIR/.release}"

if [[ "$RELEASE_DIR" == "/" || "$RELEASE_DIR" == "$ROOT_DIR" ]]; then
  echo "Refusing unsafe RELEASE_DIR: $RELEASE_DIR" >&2
  exit 1
fi

cd "$ROOT_DIR"
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build

rm -rf -- "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/.next"
cp -R .next/standalone/. "$RELEASE_DIR/"
cp -R .next/static "$RELEASE_DIR/.next/static"
cp -R public "$RELEASE_DIR/public"
cp deploy/server/start.sh "$RELEASE_DIR/start.sh"

echo "Standalone release created at $RELEASE_DIR"
