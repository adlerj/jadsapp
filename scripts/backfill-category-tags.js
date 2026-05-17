#!/usr/bin/env node
// One-off: backfill the `tech` category tag onto every existing post.
// Idempotent. Delete this script after a successful run.
//
// Usage:
//   BLOG_API_KEY=<key> node scripts/backfill-category-tags.js
//   BLOG_API_KEY=<key> BLOG_API_URL=http://localhost:3000 node scripts/backfill-category-tags.js
//   BLOG_API_KEY=<key> node scripts/backfill-category-tags.js --dry-run

const path = require("path");
const fs = require("fs");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const match = line.match(/^(\w+)=(.+)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  }
}

loadEnv();

const API_URL = process.env.BLOG_API_URL || "https://jads.app";
const API_KEY = process.env.BLOG_API_KEY;
const CATEGORY = "tech";
const DRY_RUN = process.argv.includes("--dry-run");

if (!API_KEY) {
  console.error("ERROR: BLOG_API_KEY env var is required.");
  process.exit(1);
}

async function getJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${opts.method || "GET"} ${url} -> ${res.status}: ${body}`);
  }
  return res.json();
}

async function main() {
  console.log(`Target: ${API_URL}`);
  console.log(`Mode:   ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log("");

  const posts = await getJson(`${API_URL}/api/posts`);
  console.log(`Found ${posts.length} posts`);
  console.log("");

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const meta of posts) {
    const slug = meta.slug;
    try {
      const post = await getJson(`${API_URL}/api/posts/${slug}`);
      const tags = Array.isArray(post.tags) ? post.tags : [];
      if (tags.includes(CATEGORY)) {
        console.log(`SKIP  ${slug} (already tagged)`);
        skipped += 1;
        continue;
      }
      if (DRY_RUN) {
        console.log(`WOULD ${slug} (would add '${CATEGORY}')`);
        added += 1;
        continue;
      }
      const updated = { ...post, tags: [...tags, CATEGORY] };
      await getJson(`${API_URL}/api/posts/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(updated),
      });
      console.log(`OK    ${slug}`);
      added += 1;
    } catch (err) {
      console.error(`FAIL  ${slug}: ${err.message}`);
      failed += 1;
    }
  }

  console.log("");
  console.log(`Summary: ${added} updated, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
