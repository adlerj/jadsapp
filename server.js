const fs = require("fs");
const envPath = require("path").join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const Sentry = require("@sentry/node");
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
  });
}

console.log("=== jadsapp server starting ===");
console.log(`  Node ${process.version} | PID ${process.pid}`);
console.log(`  CWD: ${process.cwd()}`);
console.log(`  DB_PATH: ${process.env.DB_PATH || "(default)"}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "(not set)"}`);
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "set" : "NOT SET"}`);
console.log(`  BLOG_API_KEY: ${process.env.BLOG_API_KEY ? "set" : "NOT SET"}`);
console.log(`  SENTRY_DSN: ${process.env.SENTRY_DSN ? "set" : "NOT SET"}`);

const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;
const rateLimit = require("express-rate-limit");
const { systemPrompt } = require("./server/systemPrompt");
console.log("  Loading database...");
const { getAllPosts, getPostBySlug } = require("./server/db");
const { buildBlogMeta, getRelevantPosts } = require("./server/rag");
console.log("  Database loaded OK");
const blogRoutes = require("./server/routes/blog");
const {
  SITE_URL,
  escapeHtml,
  renderBlogPost,
  renderBlogIndex,
} = require("./server/ssr");
console.log("  All modules loaded OK");

let blogIndex = "";
let blogPostBodies = new Map();
let blogPostMeta = [];
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

    blogIndex =
      "\n\nJEFF'S BLOG (topics Jeff has written about):\n" +
      posts
        .map((p) => `- ${p.title} [${p.tags.join(", ")}] -- ${p.description}`)
        .join("\n");
    blogPostBodies = new Map(
      posts.map((p) => [p.slug, `### ${p.title}\n${p.body}`])
    );
    blogPostMeta = buildBlogMeta(posts);

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
      `Loaded ${posts.length} blog posts (index: ${blogIndex.length} chars, sitemap: ${urls.length} URLs)`
    );
  } catch (e) {
    console.error("Could not load blog data:", e.message);
    console.error("  Stack:", e.stack);
  }
}

global.reloadBlogData = reloadBlogData;
reloadBlogData();

process.on("unhandledRejection", (reason) => {
  if (process.env.SENTRY_DSN) Sentry.captureException(reason);
  console.error("Unhandled rejection:", reason);
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

  let responded = false;
  function sendError(err) {
    if (responded) return;
    responded = true;
    const isRateLimit = err.status === 429 || err.message?.includes("rate limit");
    const msg = isRateLimit
      ? "Jadbot is getting too many requests right now. Try again in a minute."
      : err.message || "Something went wrong";
    console.error("Chat error:", err.status || "", err.message);
    if (process.env.SENTRY_DSN && !isRateLimit) Sentry.captureException(err);
    try {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    } catch (_) {}
  }

  try {
    const userQuery =
      [...trimmed].reverse().find((m) => m.role === "user")?.content || "";
    const relevantBodies = customSystemPrompt
      ? ""
      : getRelevantPosts(userQuery, blogPostMeta, blogPostBodies)
          .map((b) => "\n\n---\n" + b)
          .join("");
    const finalSystem =
      customSystemPrompt || systemPrompt + blogIndex + relevantBodies;

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      temperature: 0.3,
      system: [
        {
          type: "text",
          text: finalSystem,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: trimmed,
    });

    // Suppress unhandled rejection on the SDK's internal promise -- errors
    // are handled via the "error" event below.
    stream.done().catch(() => {});

    stream.on("text", (text) => {
      if (!responded) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    });

    stream.on("end", () => {
      if (responded) return;
      responded = true;
      res.write("data: [DONE]\n\n");
      res.end();
    });

    stream.on("error", sendError);

    req.on("close", () => {
      stream.abort();
    });
  } catch (err) {
    sendError(err);
  }
});

app.use(blogRoutes);

// Umami analytics proxy -- keeps Umami internal and bypasses ad blockers
const UMAMI_URL = process.env.UMAMI_URL;
if (UMAMI_URL) {
  const http = require(UMAMI_URL.startsWith("https") ? "https" : "http");

  app.get("/u/script.js", (req, res) => {
    http
      .get(`${UMAMI_URL}/script.js`, (upstream) => {
        if (upstream.statusCode !== 200) {
          console.error(`Umami script.js returned ${upstream.statusCode}`);
          return res.status(upstream.statusCode).end();
        }
        res.set("Content-Type", "application/javascript");
        res.set("Cache-Control", "public, max-age=86400");
        upstream.pipe(res);
      })
      .on("error", (err) => {
        console.error("Umami script.js proxy error:", err.message);
        res.status(502).end();
      });
  });

  app.post("/u/api/send", (req, res) => {
    const payload = JSON.stringify(req.body);
    const url = new URL(`${UMAMI_URL}/api/send`);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "User-Agent": req.headers["user-agent"] || "",
      },
    };
    const proxy = http.request(opts, (upstream) => {
      res.status(upstream.statusCode);
      upstream.pipe(res);
    });
    proxy.on("error", (err) => {
      console.error("Umami send proxy error:", err.message);
      res.status(502).end();
    });
    proxy.end(payload);
  });

  app.get("/u/health", (req, res) => {
    http
      .get(`${UMAMI_URL}/api/heartbeat`, (upstream) => {
        let body = "";
        upstream.on("data", (c) => (body += c));
        upstream.on("end", () => {
          res.json({
            status: upstream.statusCode === 200 ? "ok" : "error",
            umamiUrl: UMAMI_URL,
            umamiStatus: upstream.statusCode,
            umamiResponse: body.slice(0, 200),
          });
        });
      })
      .on("error", (err) => {
        res.json({
          status: "unreachable",
          umamiUrl: UMAMI_URL,
          error: err.message,
        });
      });
  });

  console.log(`  Umami proxy enabled -> ${UMAMI_URL}`);
} else {
  console.log("  UMAMI_URL not set, analytics proxy disabled");
}

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
