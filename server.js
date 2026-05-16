const fs = require("fs");
const envPath = require("path").join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

console.log("=== jadsapp server starting ===");
console.log(`  Node ${process.version} | PID ${process.pid}`);
console.log(`  CWD: ${process.cwd()}`);
console.log(`  DB_PATH: ${process.env.DB_PATH || "(default)"}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "(not set)"}`);
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "set" : "NOT SET"}`);
console.log(`  BLOG_API_KEY: ${process.env.BLOG_API_KEY ? "set" : "NOT SET"}`);

const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;
const rateLimit = require("express-rate-limit");
const { systemPrompt } = require("./server/systemPrompt");
console.log("  Loading database...");
const { getAllPosts, getPostBySlug } = require("./server/db");
console.log("  Database loaded OK");
const blogRoutes = require("./server/routes/blog");
const {
  SITE_URL,
  escapeHtml,
  renderBlogPost,
  renderBlogIndex,
} = require("./server/ssr");
console.log("  All modules loaded OK");

let blogContent = "";
let sitemapXml = "";
let feedXml = "";

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reloadBlogData() {
  try {
    const posts = getAllPosts();

    blogContent =
      "\n\nJEFF'S BLOG POSTS (use these to answer questions about Jeff's writing, opinions, and technical experience):\n\n" +
      posts.map((p) => `### ${p.title}\n${p.body}`).join("\n\n---\n\n");

    const today = new Date().toISOString().split("T")[0];
    const urls = [
      { loc: "/", priority: "1.0", changefreq: "monthly", lastmod: today },
      { loc: "/blog", priority: "0.8", changefreq: "weekly", lastmod: today },
      ...posts.map((p) => ({
        loc: `/blog/${p.slug}`,
        priority: "0.6",
        changefreq: "monthly",
        lastmod: p.updatedAt ? p.updatedAt.split(" ")[0] : p.date || today,
      })),
    ];
    sitemapXml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url>\n` +
            `    <loc>${SITE_URL}${u.loc}</loc>\n` +
            `    <lastmod>${u.lastmod}</lastmod>\n` +
            `    <changefreq>${u.changefreq}</changefreq>\n` +
            `    <priority>${u.priority}</priority>\n` +
            `  </url>`
        )
        .join("\n") +
      `\n</urlset>\n`;

    feedXml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
      `<channel>\n` +
      `  <title>Jads Blog - Jeff Adler</title>\n` +
      `  <link>${SITE_URL}/blog</link>\n` +
      `  <description>Engineering leadership, AI, agentic development, and technical deep dives by Jeff Adler, Director of Engineering at Dropbox.</description>\n` +
      `  <language>en-us</language>\n` +
      `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
      `  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>\n` +
      `  <image>\n` +
      `    <url>${SITE_URL}/jeff-adler.png</url>\n` +
      `    <title>Jads Blog - Jeff Adler</title>\n` +
      `    <link>${SITE_URL}/blog</link>\n` +
      `  </image>\n` +
      posts
        .slice(0, 20)
        .map(
          (p) =>
            `  <item>\n` +
            `    <title>${escapeXml(p.title)}</title>\n` +
            `    <link>${SITE_URL}/blog/${p.slug}</link>\n` +
            `    <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>\n` +
            `    <description>${escapeXml(p.description)}</description>\n` +
            (p.date
              ? `    <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>\n`
              : "") +
            p.tags
              .map((t) => `    <category>${escapeXml(t)}</category>\n`)
              .join("") +
            `  </item>`
        )
        .join("\n") +
      `\n</channel>\n</rss>\n`;

    console.log(
      `Loaded ${posts.length} blog posts (RAG: ${blogContent.length} chars, sitemap: ${urls.length} URLs)`
    );
  } catch (e) {
    console.error("Could not load blog data:", e.message);
    console.error("  Stack:", e.stack);
  }
}

global.reloadBlogData = reloadBlogData;
reloadBlogData();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(express.json());

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 200,
  message: { error: "Too many requests. Try again in a minute." },
});

let anthropic;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic();
} else {
  console.warn(
    "WARNING: ANTHROPIC_API_KEY not set. /api/chat will return errors."
  );
}

app.post("/api/chat", chatLimiter, async (req, res) => {
  if (!anthropic) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { messages, systemPrompt: customSystemPrompt } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  const trimmed = messages.slice(-20).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content),
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      temperature: 0.3,
      system: [
        {
          type: "text",
          text: customSystemPrompt || systemPrompt + blogContent,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: trimmed,
    });

    stream.on("text", (text) => {
      res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    });

    stream.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    req.on("close", () => {
      stream.abort();
    });
  } catch (err) {
    console.error("API error:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.use(blogRoutes);

app.get("/sitemap.xml", (req, res) => {
  res.set("Content-Type", "application/xml");
  res.send(sitemapXml);
});

app.get("/feed.xml", (req, res) => {
  res.set("Content-Type", "application/rss+xml");
  res.send(feedXml);
});

const indexHtmlPath = path.join(__dirname, "dist", "index.html");
let cachedIndexHtml = "";
try {
  cachedIndexHtml = fs.readFileSync(indexHtmlPath, "utf8");
} catch (e) {
  console.warn("Could not read dist/index.html:", e.message);
}

app.get("/blog", (req, res) => {
  const posts = getAllPosts();
  res.send(renderBlogIndex(cachedIndexHtml, posts));
});

app.get("/blog/from-tech-lead-to-director", (req, res) => {
  res.redirect(301, "/blog/staff-to-senior-manager-90-percent-same-job");
});

app.get("/blog/:slug", (req, res, next) => {
  if (!/^[a-z0-9-]+$/.test(req.params.slug)) return next();
  const post = getPostBySlug(req.params.slug);
  if (!post) return res.status(404).sendFile(indexHtmlPath);
  res.send(renderBlogPost(cachedIndexHtml, post));
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(indexHtmlPath);
});

app.listen(PORT, () => {
  console.log(`=== jadsapp server ready on port ${PORT} ===`);
});
