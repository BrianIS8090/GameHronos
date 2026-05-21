#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="/var/www/gamehronos"

mkdir -p "$TARGET"

rsync -a --delete \
  --include='/index.html' \
  --include='/css/***' \
  --include='/js/***' \
  --include='/assets/***' \
  --exclude='*' \
  "$ROOT_DIR"/ "$TARGET"/

nginx -t
nginx -s reload

echo "Deployed GameHronos to $TARGET"
