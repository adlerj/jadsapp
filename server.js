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
let feedXml = "";
let blogPosts = [];

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

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function reloadBlogData() {
  try {
    const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));
    const posts = blogFiles
      .map((file) => {
        const raw = fs.readFileSync(path.join(blogDir, file), "utf8");
        const { frontmatter, body } = parseFrontmatter(raw);
        const title =
          getFmField(frontmatter, "title") || file.replace(".md", "");
        const date = getFmField(frontmatter, "date");
        const description = getFmField(frontmatter, "description") || "";
        const tagsRaw = getFmField(frontmatter, "tags");
        const tags = tagsRaw
          ? tagsRaw.split(",").map((t) => t.trim())
          : [];
        const slug = file.replace(".md", "");
        const wordCount = body.split(/\s+/).filter(Boolean).length;
        return { title, date, description, tags, slug, body, wordCount };
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    blogPosts = posts;

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
            p.tags.map((t) => `    <category>${escapeXml(t)}</category>\n`).join("") +
            `  </item>`
        )
        .join("\n") +
      `\n</channel>\n</rss>\n`;

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

app.get("/feed.xml", (req, res) => {
  res.set("Content-Type", "application/rss+xml");
  res.send(feedXml);
});

app.use(express.static(path.join(__dirname, "dist")));

const indexHtmlPath = path.join(__dirname, "dist", "index.html");
let cachedIndexHtml = "";
try {
  cachedIndexHtml = fs.readFileSync(indexHtmlPath, "utf8");
} catch (e) {
  console.warn("Could not read dist/index.html:", e.message);
}

function injectMeta(html, meta) {
  const tags = [];
  tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  tags.push(
    `<meta name="description" content="${escapeHtml(meta.description)}">`
  );
  tags.push(`<link rel="canonical" href="${meta.url}">`);
  tags.push(
    `<meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title)}">`
  );
  tags.push(
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`
  );
  tags.push(`<meta property="og:url" content="${meta.url}">`);
  tags.push(`<meta property="og:type" content="${meta.ogType || "website"}">`);
  tags.push(
    `<meta property="og:site_name" content="Jeff Adler — jads.app">`
  );
  tags.push(
    `<meta property="og:image" content="${SITE_URL}/jeff-adler.png">`
  );
  tags.push(`<meta property="og:locale" content="en_US">`);
  if (meta.ogType === "article") {
    if (meta.publishedTime) {
      tags.push(
        `<meta property="article:published_time" content="${meta.publishedTime}">`
      );
    }
    tags.push(`<meta property="article:author" content="${SITE_URL}/">`);
  }
  if (meta.articleTags) {
    for (const tag of meta.articleTags) {
      tags.push(
        `<meta property="article:tag" content="${escapeHtml(tag)}">`
      );
    }
  }
  tags.push(`<meta name="twitter:card" content="summary">`);
  tags.push(`<meta name="twitter:site" content="@JadlerOS">`);
  tags.push(`<meta name="twitter:creator" content="@JadlerOS">`);
  tags.push(
    `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle || meta.title)}">`
  );
  tags.push(
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`
  );
  tags.push(
    `<meta name="twitter:image" content="${SITE_URL}/jeff-adler.png">`
  );
  if (meta.jsonLd) {
    const safeJson = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c");
    tags.push(
      `<script type="application/ld+json">${safeJson}</script>`
    );
  }
  const injected = tags.join("\n    ");
  return html
    .replace(/<title>[^<]*<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<link rel="canonical"[^>]*>/, "")
    .replace(/<meta property="og:[^"]*"[^>]*>/g, "")
    .replace(/<meta property="article:[^"]*"[^>]*>/g, "")
    .replace(/<meta property="profile:[^"]*"[^>]*>/g, "")
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace("</head>", `    ${injected}\n  </head>`);
}

app.get("*", (req, res) => {
  const reqPath = req.path.replace(/\/+$/, "") || "/";

  const blogPostMatch = reqPath.match(/^\/blog\/([a-z0-9-]+)$/);
  if (blogPostMatch) {
    const slug = blogPostMatch[1];
    const post = blogPosts.find((p) => p.slug === slug);
    if (post) {
      const url = `${SITE_URL}/blog/${slug}`;
      const jsonLd = [
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          url: url,
          wordCount: post.wordCount,
          author: {
            "@type": "Person",
            name: "Jeff Adler",
            url: SITE_URL,
            jobTitle: "Director of Engineering",
            worksFor: { "@type": "Organization", name: "Dropbox" },
          },
          publisher: {
            "@type": "Person",
            name: "Jeff Adler",
            url: SITE_URL,
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          image: `${SITE_URL}/jeff-adler.png`,
          inLanguage: "en-US",
          keywords: post.tags.join(", "),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: `${SITE_URL}/blog`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: post.title,
              item: url,
            },
          ],
        },
      ];
      return res.send(
        injectMeta(cachedIndexHtml, {
          title: `${post.title} - Jeff Adler`,
          ogTitle: post.title,
          description: post.description,
          url: url,
          ogType: "article",
          publishedTime: post.date,
          articleTags: post.tags,
          jsonLd: jsonLd,
        })
      );
    }
  }

  if (reqPath === "/blog") {
    const url = `${SITE_URL}/blog`;
    const desc =
      "Jeff Adler's engineering blog. AI, agentic engineering, leadership, iOS architecture, and technical deep dives from Google, Dropbox, and Reddit.";
    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Jads Blog",
        description: desc,
        url: url,
        author: {
          "@type": "Person",
          name: "Jeff Adler",
          url: SITE_URL,
          jobTitle: "Director of Engineering",
          worksFor: { "@type": "Organization", name: "Dropbox" },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        hasPart: blogPosts.slice(0, 20).map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_URL}/blog/${p.slug}`,
          datePublished: p.date,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: url,
          },
        ],
      },
    ];
    return res.send(
      injectMeta(cachedIndexHtml, {
        title: "Jads Blog - Jeff Adler | Engineering Leadership, AI, Agentic Development",
        ogTitle: "Jads Blog - Jeff Adler",
        description: desc,
        url: url,
        jsonLd: jsonLd,
      })
    );
  }

  res.sendFile(indexHtmlPath);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
