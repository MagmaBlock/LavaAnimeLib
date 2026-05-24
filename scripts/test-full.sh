#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  LavaAnime Full Test Suite"
echo "========================================"
echo ""

bash "$SCRIPT_DIR/test-db-up.sh"

echo ""
echo "[test-full] Running tests..."
cd "$ROOT_DIR"
set +e
pnpm --filter @lavaanime/server test
TEST_EXIT_CODE=$?
set -e

echo ""
bash "$SCRIPT_DIR/test-db-down.sh"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "========================================"
  echo "  All tests passed!"
  echo "========================================"
else
  echo ""
  echo "========================================"
  echo "  Tests failed with exit code $TEST_EXIT_CODE"
  echo "========================================"
  exit $TEST_EXIT_CODE
fi
