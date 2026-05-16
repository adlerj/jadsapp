const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "blog.db");

let db = null;

function getDb() {
  if (db) return db;
  const fs = require("fs");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      series TEXT,
      part INTEGER,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
  `);
  return db;
}

function rowToPost(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    description: row.description,
    tags: JSON.parse(row.tags),
    series: row.series || null,
    part: row.part || null,
    body: row.body,
    wordCount: row.body.split(/\s+/).filter(Boolean).length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getAllPosts() {
  const rows = getDb().prepare("SELECT * FROM posts ORDER BY date DESC").all();
  return rows.map(rowToPost);
}

function getPostBySlug(slug) {
  const row = getDb().prepare("SELECT * FROM posts WHERE slug = ?").get(slug);
  return rowToPost(row);
}

function createPost(data) {
  getDb()
    .prepare(
      `INSERT INTO posts (slug, title, date, description, tags, series, part, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.slug,
      data.title,
      data.date,
      data.description,
      JSON.stringify(data.tags),
      data.series || null,
      data.part || null,
      data.body
    );
  return getPostBySlug(data.slug);
}

function updatePost(slug, data) {
  getDb()
    .prepare(
      `UPDATE posts SET title = ?, date = ?, description = ?, tags = ?,
       series = ?, part = ?, body = ?, updated_at = datetime('now')
       WHERE slug = ?`
    )
    .run(
      data.title,
      data.date,
      data.description,
      JSON.stringify(data.tags),
      data.series || null,
      data.part || null,
      data.body,
      slug
    );
  return getPostBySlug(slug);
}

function deletePost(slug) {
  const result = getDb().prepare("DELETE FROM posts WHERE slug = ?").run(slug);
  return result.changes > 0;
}

function getPostCount() {
  return getDb().prepare("SELECT COUNT(*) as count FROM posts").get().count;
}

module.exports = {
  getDb,
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getPostCount,
};
