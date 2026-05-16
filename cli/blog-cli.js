#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const API_URL = process.env.BLOG_API_URL || "https://jads.app";
const API_KEY = process.env.BLOG_API_KEY || "";

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

const apiUrl = process.env.BLOG_API_URL || API_URL;
const apiKey = process.env.BLOG_API_KEY || API_KEY;

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("---", 3);
  if (end === -1) return null;
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
  meta.body = raw.slice(end + 3).trim();
  return meta;
}

async function apiFetch(endpoint, options = {}) {
  const url = `${apiUrl}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (options.auth) {
    if (!apiKey) {
      console.error("Error: BLOG_API_KEY not set");
      process.exit(1);
    }
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Error ${res.status}:`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

async function list() {
  const posts = await apiFetch("/api/posts");
  const maxSlug = Math.max(...posts.map((p) => p.slug.length), 4);
  const maxTitle = Math.max(...posts.map((p) => p.title.length), 5);
  console.log(
    "DATE".padEnd(12) +
      "SLUG".padEnd(maxSlug + 2) +
      "TITLE".padEnd(maxTitle + 2) +
      "TAGS"
  );
  console.log("-".repeat(12 + maxSlug + 2 + maxTitle + 2 + 20));
  for (const p of posts) {
    console.log(
      (p.date || "").padEnd(12) +
        p.slug.padEnd(maxSlug + 2) +
        p.title.padEnd(maxTitle + 2) +
        (p.tags || []).join(", ")
    );
  }
  console.log(`\n${posts.length} posts`);
}

async function get(slug) {
  if (!slug) {
    console.error("Usage: blog get <slug>");
    process.exit(1);
  }
  const post = await apiFetch(`/api/posts/${slug}`);
  const tags = (post.tags || []).join(", ");
  const fm = [
    "---",
    `title: ${post.title}`,
    `date: ${post.date}`,
    `description: ${post.description}`,
    `tags: ${tags}`,
  ];
  if (post.series) fm.push(`series: ${post.series}`);
  if (post.part) fm.push(`part: ${post.part}`);
  fm.push("---");
  console.log(fm.join("\n") + "\n\n" + post.body);
}

async function push(filePath) {
  if (!filePath) {
    console.error("Usage: blog push <file.md>");
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const meta = parseFrontmatter(raw);
  if (!meta) {
    console.error("Error: Could not parse frontmatter");
    process.exit(1);
  }
  const slug =
    meta.slug || path.basename(filePath, ".md");
  const data = {
    slug,
    title: meta.title,
    date: meta.date,
    description: meta.description,
    tags: meta.tags || [],
    series: meta.series || null,
    part: meta.part || null,
    body: meta.body,
  };

  let existing = null;
  try {
    existing = await apiFetch(`/api/posts/${slug}`);
  } catch {
    // 404 means create
  }

  if (existing && existing.slug) {
    const result = await apiFetch(`/api/posts/${slug}`, {
      method: "PUT",
      body: JSON.stringify(data),
      auth: true,
    });
    console.log(`Updated: ${result.slug} (${result.title})`);
  } else {
    const result = await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
      auth: true,
    });
    console.log(`Created: ${result.slug} (${result.title})`);
  }
}

async function remove(slug) {
  if (!slug) {
    console.error("Usage: blog delete <slug>");
    process.exit(1);
  }
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) =>
    rl.question(`Delete "${slug}"? (y/N) `, resolve)
  );
  rl.close();
  if (answer.toLowerCase() !== "y") {
    console.log("Cancelled");
    return;
  }
  const result = await apiFetch(`/api/posts/${slug}`, {
    method: "DELETE",
    auth: true,
  });
  console.log(`Deleted: ${result.deleted}`);
}

function verify(filePath) {
  if (!filePath) {
    console.error("Usage: blog verify <file.md>");
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const meta = parseFrontmatter(raw);
  if (!meta) {
    console.error("FAIL: Could not parse frontmatter");
    process.exit(1);
  }
  const errors = [];
  const slug = meta.slug || path.basename(filePath, ".md");
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    errors.push("slug must match ^[a-z0-9][a-z0-9-]*[a-z0-9]$");
  }
  if (!meta.title) errors.push("missing title");
  if (!meta.date || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    errors.push("date must be YYYY-MM-DD");
  }
  if (!meta.description) errors.push("missing description");
  if (!meta.tags || !Array.isArray(meta.tags) || meta.tags.length === 0) {
    errors.push("tags must be a non-empty array");
  }
  if (!meta.body) errors.push("missing body");
  if (meta.body && /—/.test(meta.body)) {
    errors.push("body contains em dashes");
  }
  if (meta.title && meta.title.length > 60) {
    errors.push(`title too long: ${meta.title.length} chars (max 60)`);
  }
  if (meta.description && meta.description.length > 160) {
    errors.push(
      `description too long: ${meta.description.length} chars (max 160)`
    );
  }

  if (errors.length) {
    console.error("VALIDATION ERRORS:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`OK: ${slug} (${meta.title})`);
}

async function history(slug) {
  if (!slug) {
    console.error("Usage: blog history <slug>");
    process.exit(1);
  }
  const versions = await apiFetch(`/api/posts/${slug}/history`, { auth: true });
  if (versions.length === 0) {
    console.log("No version history (post has not been updated yet).");
    return;
  }
  console.log("ID".padEnd(8) + "DATE".padEnd(14) + "ACTION".padEnd(10) + "SAVED AT".padEnd(22) + "TITLE");
  console.log("-".repeat(80));
  for (const v of versions) {
    console.log(
      String(v.id).padEnd(8) +
        (v.date || "").padEnd(14) +
        v.action.padEnd(10) +
        v.version_at.padEnd(22) +
        v.title
    );
  }
  console.log(`\n${versions.length} version(s)`);
}

async function restore(slug, versionId) {
  if (!slug || !versionId) {
    console.error("Usage: blog restore <slug> <version-id>");
    process.exit(1);
  }
  const version = await apiFetch(`/api/posts/${slug}/history/${versionId}`, { auth: true });
  console.log(`Restoring version ${version.id} from ${version.versionAt}:`);
  console.log(`  Title: ${version.title}`);
  console.log(`  Date: ${version.date}`);
  console.log(`  Action that replaced it: ${version.action}`);

  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) =>
    rl.question("Restore this version? (y/N) ", resolve)
  );
  rl.close();
  if (answer.toLowerCase() !== "y") {
    console.log("Cancelled");
    return;
  }
  const post = await apiFetch(`/api/posts/${slug}/restore/${versionId}`, {
    method: "POST",
    auth: true,
  });
  console.log(`Restored: ${post.slug} (${post.title})`);
}

const [, , command, ...args] = process.argv;

switch (command) {
  case "list":
  case "ls":
    list();
    break;
  case "get":
    get(args[0]);
    break;
  case "push":
    push(args[0]);
    break;
  case "delete":
  case "rm":
    remove(args[0]);
    break;
  case "verify":
    verify(args[0]);
    break;
  case "history":
    history(args[0]);
    break;
  case "restore":
    restore(args[0], args[1]);
    break;
  default:
    console.log(`Usage: blog <command>

Commands:
  list (ls)              List all posts
  get <slug>             Get a post as markdown
  push <file.md>         Create or update a post
  delete (rm) <slug>     Delete a post
  verify <file.md>       Validate locally without pushing
  history <slug>         Show version history for a post
  restore <slug> <id>    Restore a previous version

Environment:
  BLOG_API_URL    API base URL (default: https://jads.app)
  BLOG_API_KEY    API key for write operations`);
}
