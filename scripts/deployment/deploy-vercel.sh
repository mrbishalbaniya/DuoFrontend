#!/usr/bin/env bash
set -euo pipefail
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"
: "${VERCEL_ORG_ID:?Set VERCEL_ORG_ID}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID}"
npx vercel@latest pull --yes --environment=production --token="$VERCEL_TOKEN"
npx vercel@latest build --prod --token="$VERCEL_TOKEN"
npx vercel@latest deploy --prebuilt --prod --token="$VERCEL_TOKEN"
