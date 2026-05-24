#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[test-db] Stopping and removing test database..."
docker compose -f "$ROOT_DIR/compose.test.yml" down -v

echo "[test-db] Test database cleaned up."
