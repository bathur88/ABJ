#!/usr/bin/env bash
# Imports a JUnit XML report into Xray Cloud as a Test Execution.
#
# Required env: XRAY_CLIENT_ID, XRAY_CLIENT_SECRET, XRAY_PROJECT_KEY
# Optional env: XRAY_TEST_PLAN_KEY, XRAY_TEST_ENVIRONMENT, XRAY_REVISION
#               XRAY_BASE_URL (default https://xray.cloud.getxray.app; use the
#               regional host such as https://eu.xray.cloud.getxray.app if needed)
set -euo pipefail

REPORT="${1:-reports/junit.xml}"
BASE_URL="${XRAY_BASE_URL:-https://xray.cloud.getxray.app}"

: "${XRAY_CLIENT_ID:?XRAY_CLIENT_ID is not set}"
: "${XRAY_CLIENT_SECRET:?XRAY_CLIENT_SECRET is not set}"
: "${XRAY_PROJECT_KEY:?XRAY_PROJECT_KEY is not set}"

if [[ ! -f "$REPORT" ]]; then
  echo "Report not found: $REPORT" >&2
  exit 1
fi

echo "Authenticating with Xray..."
TOKEN=$(curl -sS --fail-with-body -X POST "$BASE_URL/api/v2/authenticate" \
  -H 'Content-Type: application/json' \
  -d "{\"client_id\":\"$XRAY_CLIENT_ID\",\"client_secret\":\"$XRAY_CLIENT_SECRET\"}" | tr -d '"')
echo "::add-mask::$TOKEN" 2>/dev/null || true

QUERY="projectKey=${XRAY_PROJECT_KEY}"
[[ -n "${XRAY_TEST_PLAN_KEY:-}" ]]     && QUERY+="&testPlanKey=${XRAY_TEST_PLAN_KEY}"
[[ -n "${XRAY_TEST_ENVIRONMENT:-}" ]]  && QUERY+="&testEnvironments=${XRAY_TEST_ENVIRONMENT}"
[[ -n "${XRAY_REVISION:-}" ]]          && QUERY+="&revision=${XRAY_REVISION}"

echo "Uploading $REPORT to project $XRAY_PROJECT_KEY..."
RESPONSE=$(curl -sS --fail-with-body -X POST "$BASE_URL/api/v2/import/execution/junit?$QUERY" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: text/xml' \
  --data-binary @"$REPORT")

echo "Xray response: $RESPONSE"
KEY=$(echo "$RESPONSE" | sed -n 's/.*"key":"\([^"]*\)".*/\1/p')
if [[ -n "$KEY" && -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "### Xray Test Execution created: \`$KEY\`" >> "$GITHUB_STEP_SUMMARY"
fi
