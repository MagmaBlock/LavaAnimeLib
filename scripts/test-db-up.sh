#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[test-db] Cleaning up previous test database..."
docker compose -f "$ROOT_DIR/compose.test.yml" down -v 2>/dev/null || true
echo "[test-db] Starting test database..."
docker compose -f "$ROOT_DIR/compose.test.yml" up -d

echo "[test-db] Waiting for database to be healthy..."
for i in $(seq 1 30); do
  CONTAINER_ID="$(docker compose -f "$ROOT_DIR/compose.test.yml" ps -q mariadb-test 2>/dev/null)"
  if [ -n "$CONTAINER_ID" ]; then
    HEALTH="$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "")"
    if [ "$HEALTH" = "healthy" ]; then
      echo "[test-db] Test database is ready."
      exit 0
    fi
  fi
  sleep 2
done

echo "[test-db] Timeout waiting for database to become healthy"
exit 1
