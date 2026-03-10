#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <api-base-url>"
  echo "Example: $0 https://doribharat-api-xxxxx.a.run.app"
  exit 1
fi

BASE_URL="${1%/}"

echo "Running API smoke checks against: $BASE_URL"

check() {
  local name="$1"
  local path="$2"
  local expected="$3"

  local status
  status=$(curl -s -o /tmp/doribharat-smoke-body.txt -w "%{http_code}" "$BASE_URL$path")

  if [ "$status" = "$expected" ]; then
    echo "[PASS] $name -> $path (HTTP $status)"
  else
    echo "[FAIL] $name -> $path (HTTP $status expected $expected)"
    echo "Body:"
    cat /tmp/doribharat-smoke-body.txt
    exit 1
  fi
}

check "health" "/health" "200"
check "root" "/" "200"
check "versioned orders route exists (auth expected)" "/v1/orders" "403"

echo "All smoke checks passed."
