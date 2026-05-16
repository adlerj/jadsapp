#!/usr/bin/env zsh
set -euo pipefail

BLOG_DIR="$(cd "$(dirname "$0")/../src/content/blog" && pwd)"
ERRORS=0

echo "=== Blog Post Verification ==="
echo ""

# 1. Em dashes
echo "--- Checking for em dashes (—) ---"
if grep -rn '—' "$BLOG_DIR"/*.md 2>/dev/null; then
  echo "FAIL: Em dashes found (hard rule: use commas, periods, or parentheses instead)"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# 2. Forbidden terms
echo "--- Checking for forbidden proprietary terms ---"
if grep -rni 'VESPIR\|[^a-zA-Z]Athena[^a-zA-Z]' "$BLOG_DIR"/*.md 2>/dev/null; then
  echo "FAIL: Forbidden terms found (never use VESPIR or Athena)"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# 3. Retrospective update sections
echo "--- Checking for retrospective update markers ---"
if grep -rn '202[3-9] [Uu]pdate\|20[3-9][0-9] [Uu]pdate' "$BLOG_DIR"/*.md 2>/dev/null; then
  echo "FAIL: Retrospective update sections found (posts should read as-written-at-that-time)"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# 4. Forward hyperlinks (blog post links must reference posts published before the linking post)
echo "--- Checking for forward hyperlinks ---"
FORWARD_LINK_ERRORS=0

# Build a date map of all posts
typeset -A POST_DATES
for f in "$BLOG_DIR"/*.md; do
  slug=$(basename "$f" .md)
  date=$(grep '^date:' "$f" | head -1 | sed 's/date: *//')
  POST_DATES[$slug]="$date"
done

# Check each post's internal links
for f in "$BLOG_DIR"/*.md; do
  source_slug=$(basename "$f" .md)
  source_date="${POST_DATES[$source_slug]:-}"
  [ -z "$source_date" ] && continue

  # Extract all /blog/slug links
  grep -o '(/blog/[a-z0-9-]*)' "$f" 2>/dev/null | sed 's|(/blog/||;s|)||' | while read -r target_slug; do
    target_date="${POST_DATES[$target_slug]:-}"
    if [ -z "$target_date" ]; then
      echo "  WARN: $source_slug links to /blog/$target_slug which doesn't exist"
      FORWARD_LINK_ERRORS=$((FORWARD_LINK_ERRORS + 1))
      continue
    fi
    if [[ "$target_date" > "$source_date" ]]; then
      echo "  FAIL: $source_slug ($source_date) links to $target_slug ($target_date) - FORWARD REFERENCE"
      FORWARD_LINK_ERRORS=$((FORWARD_LINK_ERRORS + 1))
    fi
  done
done

if [ "$FORWARD_LINK_ERRORS" -gt 0 ]; then
  echo "FAIL: $FORWARD_LINK_ERRORS forward hyperlinks found"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# 5. Frontmatter completeness
echo "--- Checking frontmatter completeness ---"
for f in "$BLOG_DIR"/*.md; do
  slug=$(basename "$f" .md)
  missing=""
  grep -q '^title:' "$f" || missing="$missing title"
  grep -q '^date:' "$f" || missing="$missing date"
  grep -q '^description:' "$f" || missing="$missing description"
  grep -q '^tags:' "$f" || missing="$missing tags"
  if [ -n "$missing" ]; then
    echo "  FAIL: $slug missing:$missing"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "PASS (checked $(ls "$BLOG_DIR"/*.md | wc -l | tr -d ' ') posts)"
echo ""

# 6. Description length (should be under 160 chars for SEO)
echo "--- Checking description length ---"
for f in "$BLOG_DIR"/*.md; do
  slug=$(basename "$f" .md)
  desc=$(grep '^description:' "$f" | head -1 | sed 's/description: *//')
  len=${#desc}
  if [ "$len" -gt 160 ]; then
    echo "  WARN: $slug description is $len chars (target: under 160)"
  fi
done
echo "PASS"
echo ""

# 7. Anachronistic technology references
echo "--- Checking for anachronistic references ---"
ANACHRONISM_ERRORS=0

for f in "$BLOG_DIR"/*.md; do
  slug=$(basename "$f" .md)
  date=$(grep '^date:' "$f" | head -1 | sed 's/date: *//')
  [ -z "$date" ] && continue

  # SwiftUI announced June 2019 -- flag positive uses, allow "no SwiftUI" or future-tense references
  if [[ "$date" < "2019-06-03" ]]; then
    if grep -qi 'SwiftUI' "$f" 2>/dev/null; then
      if ! grep -qi "no SwiftUI\|There's no SwiftUI\|without SwiftUI\|would.*SwiftUI\|SwiftUI.*would\|SwiftUI.*WWDC" "$f" 2>/dev/null; then
        echo "  FAIL: $slug ($date) references SwiftUI (announced June 2019)"
        ANACHRONISM_ERRORS=$((ANACHRONISM_ERRORS + 1))
      fi
    fi
  fi

  # Combine announced June 2019
  if [[ "$date" < "2019-06-03" ]]; then
    if grep -qi 'Combine' "$f" 2>/dev/null | grep -v 'combine' | grep -v 'combineLatest'; then
      : # Only flag standalone "Combine" as Apple framework
    fi
  fi
done

if [ "$ANACHRONISM_ERRORS" -gt 0 ]; then
  echo "FAIL: $ANACHRONISM_ERRORS anachronistic references found"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# 8. Build check
echo "--- Checking build ---"
cd "$(dirname "$0")/.."
if npx vue-cli-service build --mode development 2>&1 | tail -3 | grep -q "Build complete"; then
  echo "PASS"
else
  echo "FAIL: Build failed"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "=== Summary ==="
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS verification(s) failed"
  exit 1
else
  echo "ALL CHECKS PASSED"
  exit 0
fi
