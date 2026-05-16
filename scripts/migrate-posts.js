#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { getPostCount, createPost } = require("../server/db");

const BLOG_DIR =
  process.env.BLOG_SEED_DIR ||
  path.join(__dirname, "..", "src", "content", "blog");

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { meta: {}, content: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, content: raw };
  const block = raw.slice(3, end).trim();
  const meta = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (key === "tags") {
      meta[key] = value.split(",").map((t) => t.trim());
    } else if (key === "part") {
      meta[key] = parseInt(value, 10);
    } else {
      meta[key] = value;
    }
  }
  return { meta, content: raw.slice(end + 3).trim() };
}

function migrate() {
  const count = getPostCount();
  if (count > 0) {
    console.log(
      `Database already has ${count} posts, skipping seed migration.`
    );
    return;
  }

  if (!fs.existsSync(BLOG_DIR)) {
    console.log(`Blog seed directory not found: ${BLOG_DIR}`);
    return;
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  let migrated = 0;

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { meta, content } = parseFrontmatter(raw);
    const slug = file.replace(".md", "");

    createPost({
      slug,
      title: meta.title || slug,
      date: meta.date || "1970-01-01",
      description: meta.description || "",
      tags: meta.tags || [],
      series: meta.series || null,
      part: meta.part || null,
      body: content,
    });
    migrated++;
  }

  console.log(`Migrated ${migrated} posts from ${BLOG_DIR}`);
}

migrate();
