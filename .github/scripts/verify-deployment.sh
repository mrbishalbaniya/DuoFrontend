#!/usr/bin/env bash
set -euo pipefail
URL="${1:-}"
MAX_ATTEMPTS="${2:-12}"
SLEEP_SECONDS="${3:-10}"
if [[ -z "$URL" ]]; then echo "Usage: verify-deployment.sh <url>"; exit 1; fi
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  if curl -fsS -o /dev/null "$URL"; then
    echo "Deployment verified on attempt ${attempt}"
    exit 0
  fi
  echo "Attempt ${attempt}/${MAX_ATTEMPTS} failed"
  sleep "$SLEEP_SECONDS"
done
exit 1
