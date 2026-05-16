const express = require("express");
const {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getPostHistory,
  getPostVersion,
} = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function validatePost(body) {
  const errors = [];
  if (!body.slug || !SLUG_RE.test(body.slug)) {
    errors.push("slug must match ^[a-z0-9][a-z0-9-]*[a-z0-9]$");
  }
  if (!body.title || typeof body.title !== "string") {
    errors.push("title is required");
  }
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push("date must be YYYY-MM-DD");
  }
  if (!body.description || typeof body.description !== "string") {
    errors.push("description is required");
  }
  if (!Array.isArray(body.tags) || body.tags.length === 0) {
    errors.push("tags must be a non-empty array");
  }
  if (!body.body || typeof body.body !== "string") {
    errors.push("body is required");
  }
  if (body.body && /—/.test(body.body)) {
    errors.push("body contains em dashes (use -- instead)");
  }
  return errors;
}

router.get("/api/posts", (req, res) => {
  const posts = getAllPosts().map(({ body, ...meta }) => meta);
  res.json(posts);
});

router.get("/api/posts/:slug", (req, res) => {
  const post = getPostBySlug(req.params.slug);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

router.post("/api/posts", requireAuth, (req, res) => {
  const errors = validatePost(req.body);
  if (errors.length) return res.status(400).json({ errors });
  if (getPostBySlug(req.body.slug)) {
    return res.status(409).json({ error: "Post already exists" });
  }
  const post = createPost(req.body);
  if (global.reloadBlogData) global.reloadBlogData();
  res.status(201).json(post);
});

router.put("/api/posts/:slug", requireAuth, (req, res) => {
  const existing = getPostBySlug(req.params.slug);
  if (!existing) return res.status(404).json({ error: "Post not found" });
  const data = { ...req.body, slug: req.params.slug };
  const errors = validatePost(data);
  if (errors.length) return res.status(400).json({ errors });
  const post = updatePost(req.params.slug, data);
  if (global.reloadBlogData) global.reloadBlogData();
  res.json(post);
});

router.delete("/api/posts/:slug", requireAuth, (req, res) => {
  const existing = getPostBySlug(req.params.slug);
  if (!existing) return res.status(404).json({ error: "Post not found" });
  deletePost(req.params.slug);
  if (global.reloadBlogData) global.reloadBlogData();
  res.json({ deleted: req.params.slug });
});

router.get("/api/posts/:slug/history", requireAuth, (req, res) => {
  const versions = getPostHistory(req.params.slug);
  res.json(versions);
});

router.get("/api/posts/:slug/history/:id", requireAuth, (req, res) => {
  const version = getPostVersion(parseInt(req.params.id, 10));
  if (!version || version.slug !== req.params.slug) {
    return res.status(404).json({ error: "Version not found" });
  }
  res.json(version);
});

router.post("/api/posts/:slug/restore/:id", requireAuth, (req, res) => {
  const version = getPostVersion(parseInt(req.params.id, 10));
  if (!version || version.slug !== req.params.slug) {
    return res.status(404).json({ error: "Version not found" });
  }
  const current = getPostBySlug(req.params.slug);
  let post;
  if (current) {
    post = updatePost(req.params.slug, version);
  } else {
    post = createPost(version);
  }
  if (global.reloadBlogData) global.reloadBlogData();
  res.json(post);
});

module.exports = router;
