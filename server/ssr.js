const { marked } = require("marked");
const fs = require("fs");
const path = require("path");
const bio = require("./bio");
const hubs = require("./hubs");

const SITE_URL = "https://jads.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Returns the per-post OG image URL if a custom card exists at
// public/og/<slug>.png, otherwise the site-wide default.
function ogImageFor(post) {
  if (post && post.slug) {
    const customPath = path.join(PUBLIC_DIR, "og", `${post.slug}.png`);
    if (fs.existsSync(customPath)) {
      return `${SITE_URL}/og/${post.slug}.png`;
    }
  }
  return DEFAULT_OG_IMAGE;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMetaTags(meta) {
  const tags = [];
  tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  tags.push(
    `<meta name="description" content="${escapeHtml(meta.description)}">`
  );
  tags.push(`<link rel="canonical" href="${meta.url}">`);
  tags.push(
    `<meta property="og:title" content="${escapeHtml(
      meta.ogTitle || meta.title
    )}">`
  );
  tags.push(
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`
  );
  tags.push(`<meta property="og:url" content="${meta.url}">`);
  tags.push(`<meta property="og:type" content="${meta.ogType || "website"}">`);
  tags.push(`<meta property="og:site_name" content="Jeff Adler — jads.app">`);
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
  tags.push(`<meta property="og:image" content="${ogImage}">`);
  tags.push(`<meta property="og:image:width" content="1200">`);
  tags.push(`<meta property="og:image:height" content="630">`);
  tags.push(`<meta property="og:locale" content="en_US">`);
  if (meta.ogType === "article") {
    if (meta.publishedTime) {
      tags.push(
        `<meta property="article:published_time" content="${meta.publishedTime}">`
      );
    }
    if (meta.modifiedTime) {
      tags.push(
        `<meta property="article:modified_time" content="${meta.modifiedTime}">`
      );
    }
    tags.push(`<meta property="article:author" content="${SITE_URL}/">`);
  }
  if (meta.articleTags) {
    for (const tag of meta.articleTags) {
      tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}">`);
    }
  }
  const twitterCardType =
    meta.ogType === "article" ? "summary_large_image" : "summary";
  tags.push(`<meta name="twitter:card" content="${twitterCardType}">`);
  tags.push(`<meta name="twitter:site" content="@JadlerOS">`);
  tags.push(`<meta name="twitter:creator" content="@JadlerOS">`);
  tags.push(
    `<meta name="twitter:title" content="${escapeHtml(
      meta.ogTitle || meta.title
    )}">`
  );
  tags.push(
    `<meta name="twitter:description" content="${escapeHtml(
      meta.description
    )}">`
  );
  tags.push(`<meta name="twitter:image" content="${ogImage}">`);
  if (meta.jsonLd) {
    const safeJson = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c");
    const ldAttr =
      meta.ogType === "article"
        ? ' data-blog-ld="true"'
        : ' data-blog-index-ld="true"';
    tags.push(
      `<script type="application/ld+json"${ldAttr}>${safeJson}</script>`
    );
  }
  return tags.join("\n    ");
}

function stripBaseMeta(html) {
  return html
    .replace(/<title>[^<]*<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<link rel="canonical"[^>]*>/, "")
    .replace(/<meta property="og:[^"]*"[^>]*>/g, "")
    .replace(/<meta property="article:[^"]*"[^>]*>/g, "")
    .replace(/<meta property="profile:[^"]*"[^>]*>/g, "")
    .replace(/<meta name="twitter:[^"]*"[^>]*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace(/\n\s*\n/g, "\n");
}

function injectMeta(html, meta) {
  const injected = buildMetaTags(meta);
  return stripBaseMeta(html).replace("</head>", `    ${injected}\n  </head>`);
}

function postJsonLd(post, url) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updatedAt ? post.updatedAt.split(" ")[0] : post.date,
      url: url,
      wordCount: post.wordCount,
      author: {
        "@type": "Person",
        "@id": bio.PERSON_ID,
        name: bio.NAME,
        url: SITE_URL,
        jobTitle: bio.JOB_TITLE,
        worksFor: { "@type": "Organization", name: "Dropbox" },
        sameAs: bio.SAME_AS,
      },
      publisher: {
        "@type": "Person",
        "@id": bio.PERSON_ID,
        name: bio.NAME,
        url: SITE_URL,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
        isPartOf: { "@id": bio.WEBSITE_ID },
      },
      image: ogImageFor(post),
      inLanguage: "en-US",
      keywords: post.tags.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE_URL}/blog`,
        },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
}

function blogIndexJsonLd(posts, url, desc) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jads Blog",
      description: desc,
      url: url,
      author: {
        "@type": "Person",
        "@id": bio.PERSON_ID,
        name: bio.NAME,
        url: SITE_URL,
        jobTitle: bio.JOB_TITLE,
        worksFor: { "@type": "Organization", name: "Dropbox" },
        sameAs: bio.SAME_AS,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
        isPartOf: { "@id": bio.WEBSITE_ID },
      },
      hasPart: posts.map((p) => ({
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
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: url },
      ],
    },
  ];
}

function renderBlogPost(html, post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const ssrData = `<script>window.__SSR_POST__=${JSON.stringify(post).replace(
    /</g,
    "\\u003c"
  )}</script>`;
  const renderedBody = marked.parse(post.body, { gfm: true, breaks: true });
  const modifiedDate = post.updatedAt
    ? post.updatedAt.split(" ")[0]
    : post.date;
  const rendered = injectMeta(html, {
    title: `${post.title} - Jeff Adler`,
    ogTitle: post.title,
    description: post.description,
    url: url,
    ogType: "article",
    ogImage: ogImageFor(post),
    publishedTime: post.date,
    modifiedTime: modifiedDate,
    articleTags: post.tags,
    jsonLd: postJsonLd(post, url),
  });
  const ssrContent = `<article id="ssr-content"><h1>${escapeHtml(
    post.title
  )}</h1>${renderedBody}</article>`;
  return rendered
    .replace("</head>", `    ${ssrData}\n  </head>`)
    .replace('<div id="app">', `<div id="app">${ssrContent}`);
}

function renderBlogIndex(html, posts) {
  const url = `${SITE_URL}/blog`;
  const desc =
    "Jeff Adler's engineering blog. AI, agentic engineering, leadership, iOS architecture, and technical deep dives from Google, Dropbox, and Reddit.";
  const postsWithoutBody = posts.map(({ body, ...meta }) => meta);
  const ssrData = `<script>window.__SSR_POSTS__=${JSON.stringify(
    postsWithoutBody
  ).replace(/</g, "\\u003c")}</script>`;
  const rendered = injectMeta(html, {
    title:
      "Jads Blog - Jeff Adler | Engineering Leadership, AI, Agentic Development",
    ogTitle: "Jads Blog - Jeff Adler",
    description: desc,
    url: url,
    jsonLd: blogIndexJsonLd(posts, url, desc),
  });
  // Server-render a crawlable index of EVERY post so non-JS crawlers and LLMs
  // can discover and follow the full corpus (Vue replaces this on hydration).
  const items = posts
    .map(
      (p) =>
        `<li><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a>` +
        (p.date ? ` <time datetime="${p.date}">${p.date}</time>` : "") +
        (p.description ? ` -- ${escapeHtml(p.description)}` : "") +
        `</li>`
    )
    .join("");
  const ssrContent =
    `<nav id="ssr-content" aria-label="All blog posts">` +
    `<h1>Jads Blog</h1><p>${escapeHtml(desc)}</p>` +
    `<ul>${items}</ul></nav>`;
  return rendered
    .replace("</head>", `    ${ssrData}\n  </head>`)
    .replace('<div id="app">', `<div id="app">${ssrContent}`);
}

// Server-render the homepage portfolio content so crawlers and LLMs that don't
// run JS get the full bio, career, and crawlable internal links -- not an empty
// shell. The static index.html already carries the correct homepage head
// (title, canonical, OG, Person JSON-LD), so we leave the head untouched and
// only inject body content; Vue replaces #ssr-content on hydration.
function renderHome(html, posts) {
  const career = bio.CAREER.map(
    (r) =>
      `<li><strong>${escapeHtml(r.title)}</strong> (${escapeHtml(
        r.period
      )}) -- ${escapeHtml(r.detail)}</li>`
  ).join("");
  const featuredLinks = posts
    .slice(0, 6)
    .map((p) => `<li><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a></li>`)
    .join("");
  const ssrContent =
    `<article id="ssr-content">` +
    `<h1>${escapeHtml(bio.NAME)}</h1>` +
    `<p>${escapeHtml(bio.THESIS)}</p>` +
    `<h2>About</h2><p>${escapeHtml(bio.BIO_SHORT)}</p>` +
    `<h2>Experience</h2><ul>${career}</ul>` +
    `<h2>Education</h2><p>${escapeHtml(bio.EDUCATION)}</p>` +
    `<h2>Expertise</h2><p>${escapeHtml(bio.EXPERTISE.join(", "))}</p>` +
    `<h2>Writing</h2><ul>${featuredLinks}</ul>` +
    `<p><a href="/blog">All blog posts</a> | <a href="/about">About Jeff Adler</a> | ` +
    `<a href="/now">Now</a> | <a href="/terminal">Ask Jadbot</a></p>` +
    `</article>`;
  return html.replace('<div id="app">', `<div id="app">${ssrContent}`);
}

// Server-render /now with its own correct title/description/canonical (it
// previously fell through to the homepage shell -- wrong canonical + no
// content). Keep the section content in sync with src/views/NowView.vue.
function renderNow(html) {
  const url = `${SITE_URL}/now`;
  const desc =
    "What Jeff Adler is focused on right now: current work at Dropbox Dash, writing, reading, and life outside work.";
  const rendered = injectMeta(html, {
    title: "Now - Jeff Adler",
    ogTitle: "Now - Jeff Adler",
    description: desc,
    url,
  });
  const ssrContent =
    `<article id="ssr-content">` +
    `<h1>Now</h1>` +
    `<p>What Jeff Adler is focused on right now.</p>` +
    `<h2>Working on</h2><ul>` +
    `<li>Leading engineering for Dropbox Dash, the AI-powered universal search product. Five teams, end-to-end ownership.</li>` +
    `<li>Thinking about 0 to 1 in an agentic-native world.</li></ul>` +
    `<h2>Writing</h2><ul>` +
    `<li><a href="/blog/the-manager-layer-is-next">The Manager Layer is Next</a></li>` +
    `<li><a href="/blog/tokenmaxxing-is-what-happens-when-you-measure-ai-adoption-wrong">Tokenmaxxing Is What Happens When You Measure Wrong</a></li>` +
    `<li>Drafting more on what engineering orgs look like when most of the code is agent-written.</li></ul>` +
    `<h2>Reading</h2><ul>` +
    `<li>The War of Art, by Steven Pressfield.</li>` +
    `<li>The One Thing, by Gary Keller and Jay Papasan.</li>` +
    `<li>The Art of Possibility, by Rosamund and Benjamin Zander.</li></ul>` +
    `<h2>Outside</h2><ul>` +
    `<li>Snowboarding A-Basin with the condo crew.</li>` +
    `<li>Mountain biking Colorado trails.</li>` +
    `<li>Shooting photos around Denver.</li></ul>` +
    `<p><a href="/">Home</a> | <a href="/blog">Blog</a> | <a href="/about">About</a></p>` +
    `</article>`;
  return rendered.replace('<div id="app">', `<div id="app">${ssrContent}`);
}

// Server-render /about: the canonical bio + FAQ destination for the "who is
// Jeff Adler" query, wrapped in ProfilePage + FAQPage schema (top GEO signals
// for LLM citation). Content is sourced from server/bio.js; the client
// AboutView imports the same module, so server and client never drift.
function aboutJsonLd(url) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${url}#webpage`,
      url: url,
      name: "About Jeff Adler",
      isPartOf: { "@id": bio.WEBSITE_ID },
      about: { "@id": bio.PERSON_ID },
      mainEntity: {
        "@type": "Person",
        "@id": bio.PERSON_ID,
        name: bio.NAME,
        jobTitle: bio.JOB_TITLE,
        url: SITE_URL,
        worksFor: { "@type": "Organization", name: bio.EMPLOYER },
        description: bio.BIO_SHORT,
        disambiguatingDescription: bio.DISAMBIGUATION,
        sameAs: bio.SAME_AS,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: bio.FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "About", item: url },
      ],
    },
  ];
}

function renderAbout(html) {
  const url = `${SITE_URL}/about`;
  const desc =
    "Jeff Adler is Director of Engineering at Dropbox (Dash) in Denver, Colorado. Bio, career, and FAQ. Formerly Reddit and Google.";
  const rendered = injectMeta(html, {
    title: "About Jeff Adler - Director of Engineering at Dropbox",
    ogTitle: "About Jeff Adler",
    description: desc,
    url,
  });
  const ldScript =
    `<script type="application/ld+json" data-about-ld="true">` +
    `${JSON.stringify(aboutJsonLd(url)).replace(/</g, "\\u003c")}</script>`;
  const career = bio.CAREER.map(
    (r) =>
      `<li><strong>${escapeHtml(r.title)}</strong> (${escapeHtml(
        r.period
      )}) -- ${escapeHtml(r.detail)}</li>`
  ).join("");
  const faq = bio.FAQ.map(
    (f) =>
      `<div><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`
  ).join("");
  const ssrContent =
    `<article id="ssr-content">` +
    `<h1>About Jeff Adler</h1>` +
    `<p>${escapeHtml(bio.BIO_SHORT)}</p>` +
    `<p>${escapeHtml(bio.DISAMBIGUATION)}</p>` +
    `<h2>Experience</h2><ul>${career}</ul>` +
    `<h2>Education</h2><p>${escapeHtml(bio.EDUCATION)}</p>` +
    `<h2>Frequently Asked Questions</h2>${faq}` +
    `<p><a href="/">Home</a> | <a href="/blog">Blog</a> | <a href="/now">Now</a></p>` +
    `</article>`;
  return rendered
    .replace("</head>", `    ${ldScript}\n  </head>`)
    .replace('<div id="app">', `<div id="app">${ssrContent}`);
}

// Server-render a topic hub at /writing/<slug>: a citable pillar page (thesis +
// CollectionPage/ItemList + FAQPage) that links every post in the cluster, so
// crawlers get an anchor-dense topic page and every clustered post gains an
// inbound link. Shares server/hubs.js with the client HubView.
function hubJsonLd(hub, url, members) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      url: url,
      name: hub.title,
      description: hub.description,
      isPartOf: { "@id": bio.WEBSITE_ID },
      about: { "@id": bio.PERSON_ID },
      author: { "@id": bio.PERSON_ID },
      mainEntity: { "@id": `${url}#list` },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${url}#list`,
      numberOfItems: members.length,
      itemListElement: members.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: hub.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: hub.title, item: url },
      ],
    },
  ];
}

function renderHub(html, hub, posts) {
  const url = `${SITE_URL}/writing/${hub.slug}`;
  const members = hubs.postsForHub(hub, posts);
  const rendered = injectMeta(html, {
    title: hub.pageTitle,
    ogTitle: hub.title,
    description: hub.description,
    url,
  });
  const ldScript =
    `<script type="application/ld+json" data-hub-ld="true">` +
    `${JSON.stringify(hubJsonLd(hub, url, members)).replace(
      /</g,
      "\\u003c"
    )}</script>`;
  const thesis = hub.thesis.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const items = members
    .map(
      (p) =>
        `<li><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a>` +
        (p.date ? ` <time datetime="${p.date}">${p.date}</time>` : "") +
        (p.description ? ` -- ${escapeHtml(p.description)}` : "") +
        `</li>`
    )
    .join("");
  const faq = hub.faq
    .map((f) => `<div><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`)
    .join("");
  const others = hubs
    .allHubs()
    .filter((h) => h.slug !== hub.slug)
    .map((h) => `<a href="/writing/${h.slug}">${escapeHtml(h.title)}</a>`)
    .join(" | ");
  const ssrContent =
    `<article id="ssr-content">` +
    `<h1>${escapeHtml(hub.title)}</h1>` +
    thesis +
    `<h2>Reading path (${members.length} posts)</h2><ul>${items}</ul>` +
    `<h2>Frequently Asked Questions</h2>${faq}` +
    `<p>More topics: ${others} | <a href="/blog">All posts</a> | <a href="/about">About Jeff Adler</a></p>` +
    `</article>`;
  return rendered
    .replace("</head>", `    ${ldScript}\n  </head>`)
    .replace('<div id="app">', `<div id="app">${ssrContent}`);
}

module.exports = {
  SITE_URL,
  escapeHtml,
  injectMeta,
  renderBlogPost,
  renderBlogIndex,
  renderHome,
  renderNow,
  renderAbout,
  renderHub,
  postJsonLd,
  blogIndexJsonLd,
};
