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
const helmet = require("helmet");
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
  renderHome,
  renderNow,
  renderAbout,
} = require("./server/ssr");
const bio = require("./server/bio");
console.log("  All modules loaded OK");

let blogIndex = "";
let blogPostBodies = new Map();
let blogPostMeta = [];
let sitemapXml = "";
let feedXml = "";
let llmsTxt = "";
let llmsFullTxt = "";

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let blogDataInitialized = false;

// Notify IndexNow (Bing, Yandex, etc.) that content changed so they recrawl
// quickly. No-op unless INDEXNOW_KEY is set; the key file must also be served
// at https://jads.app/<key>.txt (drop it in public/). Fire-and-forget.
function pingIndexNow(urls) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !urls.length) return;
  const body = JSON.stringify({
    host: "jads.app",
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: urls,
  });
  const req = require("https").request(
    {
      hostname: "api.indexnow.org",
      path: "/indexnow",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    (res) => {
      res.on("data", () => {});
      res.on("end", () => console.log(`IndexNow ping: ${res.statusCode}`));
    }
  );
  req.on("error", (e) => console.warn("IndexNow ping failed:", e.message));
  req.write(body);
  req.end();
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
    // Never advertise a future lastmod (the build clock can run a day ahead),
    // and prefer a post's real content updatedAt over a deploy timestamp.
    const clampDate = (d) => (d && d <= today ? d : today);
    const urls = [
      { loc: "/", priority: "1.0", changefreq: "monthly", lastmod: today },
      { loc: "/about", priority: "0.9", changefreq: "monthly", lastmod: today },
      { loc: "/blog", priority: "0.8", changefreq: "weekly", lastmod: today },
      { loc: "/now", priority: "0.5", changefreq: "monthly", lastmod: today },
      ...posts.map((p) => ({
        loc: `/blog/${p.slug}`,
        priority: "0.6",
        changefreq: "monthly",
        lastmod: clampDate(p.updatedAt ? p.updatedAt.split(" ")[0] : p.date),
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

    llmsTxt =
      `# Jeff Adler — jads.app\n\n` +
      `> Director of Engineering at Dropbox leading Dash, the AI-powered universal search product. ` +
      `Engineering leader with 12+ years building and scaling platforms at Google, Reddit, and Dropbox. ` +
      `Specializes in AI products, LLMs, Claude/Anthropic, agentic orchestration, mobile architecture, and engineering org design. ` +
      `Based in Denver, CO.\n\n` +
      `Disambiguation: this is Jeff Adler the software engineering leader at Dropbox (Dash), based in Denver, Colorado. ` +
      `He is not the CrossFit Games athlete, the actor, or the academics of the same name.\n\n` +
      `## Key Facts\n\n` +
      `- Full name: Jeff Adler (also goes by jadler, jads)\n` +
      `- Current role: Director of Engineering at Dropbox since 2025, leading the AI Experiences and Sync engineering orgs; owns Dash\n` +
      `- Prior roles: Senior Engineering Manager, Dropbox (2023-2025, Dash); Staff Engineer, Reddit (2021-2023, iOS tech lead for 100+ engineers, built SliceKit); Staff Engineer, Dropbox (2019-2021); Senior Engineer, Google (2016-2019, Google Drive iOS); Software Engineer, Maptext (2014-2016, mPilot aviation)\n` +
      `- Education: Rutgers University, B.S. Computer and Electrical Engineering\n` +
      `- Location: Denver, Colorado, USA\n` +
      `- Expertise: AI products, LLMs, Claude/Anthropic, agentic engineering and orchestration, machine learning, iOS architecture, engineering leadership\n` +
      `- Open source: Minerva, an iOS architecture framework (github.com/MinervaMobile)\n\n` +
      `## About\n\n` +
      `- [Portfolio](${SITE_URL}/): career, hobbies, and an embedded AI chat (Jadbot) that answers questions about Jeff\n` +
      `- [About / FAQ](${SITE_URL}/about): canonical bio and frequently asked questions about Jeff\n` +
      `- [Now](${SITE_URL}/now): what Jeff is focused on right now\n` +
      `- [LinkedIn](https://linkedin.com/in/jeff-adler-2bbb9828)\n` +
      `- [GitHub](https://github.com/adlerj): @adlerj\n` +
      `- [X / Twitter](https://x.com/JadlerOS): @JadlerOS\n` +
      `- [Wikidata](https://www.wikidata.org/wiki/Q139972437): entity Q139972437\n\n` +
      `## Blog\n\n` +
      `- [Jads Blog](${SITE_URL}/blog): essays on engineering leadership, AI, agentic development, and iOS architecture\n` +
      `- [RSS feed](${SITE_URL}/feed.xml)\n` +
      `- [Full post bodies for LLMs](${SITE_URL}/llms-full.txt): every post's complete text in one document\n\n` +
      `## Posts\n\n` +
      posts
        .map(
          (p) =>
            `- [${p.title}](${SITE_URL}/blog/${p.slug}) (${p.date}): ${p.description}`
        )
        .join("\n") +
      `\n`;

    // llms-full.txt: canonical bio + FAQ + the FULL text of every post in one
    // document, so an LLM can ingest the whole corpus in a single fetch and
    // attribute it to this Jeff Adler. Bodies are already in memory.
    llmsFullTxt =
      `# Jeff Adler — jads.app (full corpus)\n\n` +
      `> Director of Engineering at Dropbox leading Dash, the AI-powered universal search product. ` +
      `Based in Denver, CO. This document contains the canonical bio and the full text of every blog post.\n\n` +
      `## About Jeff Adler\n\n${bio.BIO_SHORT}\n\n${bio.DISAMBIGUATION}\n\n` +
      `## FAQ\n\n` +
      bio.FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n") +
      `\n\n## Full Posts\n\n` +
      posts
        .map(
          (p) =>
            `### ${p.title}\n${SITE_URL}/blog/${p.slug} (${p.date})\n\n${p.body}\n`
        )
        .join("\n---\n\n") +
      `\n`;

    console.log(
      `Loaded ${posts.length} blog posts (index: ${blogIndex.length} chars, sitemap: ${urls.length} URLs)`
    );

    // Ping IndexNow on content changes (not on initial boot) so search
    // engines recrawl mutated URLs promptly. Inert without INDEXNOW_KEY.
    if (blogDataInitialized) {
      pingIndexNow(urls.map((u) => `${SITE_URL}${u.loc}`));
    }
    blogDataInitialized = true;
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

// Security headers. CSP is intentionally disabled: SSR injects inline
// scripts for blog hydration (window.__SSR_POST__), the static index.html
// embeds JSON-LD blocks, and Vue dev/runtime relies on inline styles --
// adding CSP without nonces would break the SPA. Other helmet defaults
// (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
// Cross-Origin-Opener-Policy, etc.) ship as-is.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

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

app.get("/llms.txt", (req, res) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(llmsTxt);
});

app.get("/llms-full.txt", (req, res) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(llmsFullTxt);
});

const indexHtmlPath = path.join(__dirname, "dist", "index.html");
let cachedIndexHtml = "";
try {
  cachedIndexHtml = fs.readFileSync(indexHtmlPath, "utf8");
} catch (e) {
  console.warn("Could not read dist/index.html:", e.message);
}

app.get("/", (req, res) => {
  res.send(renderHome(cachedIndexHtml, getAllPosts()));
});

app.get("/now", (req, res) => {
  res.send(renderNow(cachedIndexHtml));
});

app.get("/about", (req, res) => {
  res.send(renderAbout(cachedIndexHtml));
});

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
  // Missing post: 404 + noindex so a dead slug never re-emits the homepage
  // Person/canonical under a soft-200.
  if (!post) {
    res.set("X-Robots-Tag", "noindex");
    return res.status(404).sendFile(indexHtmlPath);
  }
  res.send(renderBlogPost(cachedIndexHtml, post));
});

// The Jadbot chat UI is not search content -- serve it but keep it out of the
// index (it otherwise inherits the homepage canonical via the catch-all).
app.get("/terminal", (req, res) => {
  res.set("X-Robots-Tag", "noindex, follow");
  res.sendFile(indexHtmlPath);
});

app.use(express.static(path.join(__dirname, "dist")));

// Genuinely unknown paths: real 404 + noindex instead of a soft-404 that
// served the homepage shell (wrong canonical, HTTP 200) for any URL. All real
// SPA routes (/, /now, /blog, /blog/:slug, /about, /writing/*, /terminal) are
// handled above; anything reaching here does not exist.
app.get("*", (req, res) => {
  res.status(404).set("X-Robots-Tag", "noindex").sendFile(indexHtmlPath);
});

app.listen(PORT, () => {
  console.log(`=== jadsapp server ready on port ${PORT} ===`);
});
