#!/usr/bin/env zsh
set -euo pipefail

# Entity-consistency guard. The whole SEO/GEO strategy depends on ONE consistent
# "Jeff Adler" entity: one job title everywhere, one canonical Person @id, a
# real sameAs set, and live routes that aren't soft-404s. This script fails the
# build if any of that silently regresses.
#
# Static checks (Section A) need only the repo + node and run in CI.
# Dynamic checks (Section B) run only when BASE_URL is set, e.g.:
#   npm run build && PORT=3100 npm start &
#   BASE_URL=http://localhost:3100 bash scripts/verify-entity.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ERRORS=0
CANONICAL_TITLE="Director of Engineering"

echo "=== Entity Consistency Verification ==="
echo ""

# --- A1: bio.js is the source of truth for the title ---
echo "--- A1: server/bio.js JOB_TITLE === '$CANONICAL_TITLE' ---"
if grep -q "JOB_TITLE = \"$CANONICAL_TITLE\"" server/bio.js; then
  echo "PASS"
else
  echo "FAIL: server/bio.js JOB_TITLE is not '$CANONICAL_TITLE'"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# --- A2: no surface hardcodes a CONFLICTING current job title ---
echo "--- A2: every literal jobTitle assignment is '$CANONICAL_TITLE' ---"
BAD_TITLES=$(grep -rnE '"?jobTitle"?[[:space:]]*:[[:space:]]*"' \
  public/index.html src/ server/ 2>/dev/null \
  | grep -v "bio.JOB_TITLE" \
  | grep -v "$CANONICAL_TITLE" || true)
if [ -n "$BAD_TITLES" ]; then
  echo "FAIL: a jobTitle is set to something other than '$CANONICAL_TITLE':"
  echo "$BAD_TITLES"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# --- A3: canonical Person @id present on the homepage ---
echo "--- A3: public/index.html anchors the #person entity ---"
if grep -q '"@id": "https://jads.app/#person"' public/index.html; then
  echo "PASS"
else
  echo "FAIL: homepage is missing the canonical Person @id (#person)"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# --- A4: homepage JSON-LD @graph parses ---
echo "--- A4: homepage JSON-LD parses and is an @graph ---"
if node -e '
  const fs = require("fs");
  const html = fs.readFileSync("public/index.html", "utf8");
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) { console.error("no JSON-LD block"); process.exit(1); }
  const j = JSON.parse(m[1]);
  if (!j["@graph"] || !Array.isArray(j["@graph"])) { console.error("not an @graph"); process.exit(1); }
' 2>/dev/null; then
  echo "PASS"
else
  echo "FAIL: homepage JSON-LD is missing, invalid, or not an @graph"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# --- A5: sameAs has a real set of profiles (>= 4) ---
echo "--- A5: server/bio.js sameAs has >= 4 profiles ---"
SAMEAS_COUNT=$(node -e 'console.log((require("./server/bio").SAME_AS || []).length)' 2>/dev/null || echo 0)
if [ "$SAMEAS_COUNT" -ge 4 ]; then
  echo "PASS ($SAMEAS_COUNT profiles)"
else
  echo "FAIL: only $SAMEAS_COUNT sameAs profiles (want >= 4 for disambiguation)"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# --- A6: blog JSON-LD still references the canonical @id (no re-fragmentation) ---
echo "--- A6: server/ssr.js references bio.PERSON_ID ---"
if grep -q 'bio.PERSON_ID' server/ssr.js; then
  echo "PASS"
else
  echo "FAIL: server/ssr.js no longer references bio.PERSON_ID (entity may be re-fragmented)"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# --- Section B: live checks (only when BASE_URL is set) ---
if [ -n "${BASE_URL:-}" ]; then
  echo "=== Live checks against $BASE_URL ==="
  echo ""

  echo "--- B1: unknown URL returns 404 (no soft-404) ---"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/this-page-does-not-exist-xyz")
  if [ "$CODE" = "404" ]; then echo "PASS"; else
    echo "FAIL: unknown URL returned $CODE (want 404)"; ERRORS=$((ERRORS + 1)); fi
  echo ""

  echo "--- B2: /now self-canonicalizes to /now ---"
  if curl -s "$BASE_URL/now" | grep -q '<link rel="canonical" href="https://jads.app/now">'; then
    echo "PASS"; else
    echo "FAIL: /now canonical is not https://jads.app/now"; ERRORS=$((ERRORS + 1)); fi
  echo ""

  echo "--- B3: homepage is server-rendered (#ssr-content) ---"
  if curl -s "$BASE_URL/" | grep -q 'id="ssr-content"'; then
    echo "PASS"; else
    echo "FAIL: homepage has no server-rendered content"; ERRORS=$((ERRORS + 1)); fi
  echo ""

  echo "--- B4: /about exposes FAQPage schema ---"
  if curl -s "$BASE_URL/about" | grep -q '"@type":"FAQPage"'; then
    echo "PASS"; else
    echo "FAIL: /about is missing FAQPage schema"; ERRORS=$((ERRORS + 1)); fi
  echo ""

  echo "--- B5: /blog links every post (anchor count === llms.txt post count) ---"
  ANCHORS=$(curl -s "$BASE_URL/blog" | grep -o '<a href="/blog/[^"]*"' | sort -u | wc -l | tr -d ' ')
  POSTS=$(curl -s "$BASE_URL/llms.txt" | grep -cE '^- \[.*\]\(https://jads.app/blog/')
  if [ "$ANCHORS" = "$POSTS" ]; then echo "PASS ($ANCHORS posts)"; else
    echo "FAIL: /blog shows $ANCHORS anchors but llms.txt lists $POSTS posts"; ERRORS=$((ERRORS + 1)); fi
  echo ""
else
  echo "(Skipping live checks -- set BASE_URL to run Section B)"
  echo ""
fi

echo "=== Done ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED with $ERRORS error(s)"
  exit 1
fi
echo "All entity checks passed."
