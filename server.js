const fs = require("fs");
const envPath = require("path").join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;
const rateLimit = require("express-rate-limit");
const { systemPrompt } = require("./server/systemPrompt");

const SITE_URL = "https://jads.app";
const blogDir = path.join(__dirname, "src/content/blog");
let blogContent = "";
let sitemapXml = "";

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { frontmatter: "", body: raw };
  const fmEnd = raw.indexOf("---", 3);
  if (fmEnd === -1) return { frontmatter: "", body: raw };
  return {
    frontmatter: raw.slice(3, fmEnd),
    body: raw.slice(fmEnd + 3).trim(),
  };
}

function getFmField(fm, field) {
  const match = fm.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?`, "m"));
  return match ? match[1].trim() : null;
}

function reloadBlogData() {
  try {
    const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));
    const posts = blogFiles.map((file) => {
      const raw = fs.readFileSync(path.join(blogDir, file), "utf8");
      const { frontmatter, body } = parseFrontmatter(raw);
      const title = getFmField(frontmatter, "title") || file.replace(".md", "");
      const date = getFmField(frontmatter, "date");
      const slug = file.replace(".md", "");
      return { title, date, slug, body };
    });

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
        lastmod: p.date || today,
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

    console.log(
      `Loaded ${posts.length} blog posts (RAG: ${blogContent.length} chars, sitemap: ${urls.length} URLs)`
    );
  } catch (e) {
    console.warn("Could not load blog data:", e.message);
  }
}

reloadBlogData();

let reloadTimer = null;
fs.watch(blogDir, { persistent: false }, () => {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    console.log("Blog content changed, reloading...");
    reloadBlogData();
  }, 500);
});

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

app.get("/sitemap.xml", (req, res) => {
  res.set("Content-Type", "application/xml");
  res.send(sitemapXml);
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
