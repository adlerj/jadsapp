const { marked } = require("marked");

const SITE_URL = "https://jads.app";

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
    if (meta.modifiedTime) {
      tags.push(
        `<meta property="article:modified_time" content="${meta.modifiedTime}">`
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
    const ldAttr = meta.ogType === "article" ? ' data-blog-ld="true"' : ' data-blog-index-ld="true"';
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
      dateModified: post.updatedAt
        ? post.updatedAt.split(" ")[0]
        : post.date,
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
        name: "Jeff Adler",
        url: SITE_URL,
        jobTitle: "Director of Engineering",
        worksFor: { "@type": "Organization", name: "Dropbox" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      hasPart: posts.slice(0, 20).map((p) => ({
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
  const ssrData = `<script>window.__SSR_POST__=${JSON.stringify(post).replace(/</g, "\\u003c")}</script>`;
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
    publishedTime: post.date,
    modifiedTime: modifiedDate,
    articleTags: post.tags,
    jsonLd: postJsonLd(post, url),
  });
  const ssrContent = `<div id="ssr-content" style="display:none"><article><h1>${escapeHtml(post.title)}</h1>${renderedBody}</article></div>`;
  return rendered
    .replace("</head>", `    ${ssrData}\n  </head>`)
    .replace('<div id="app">', `${ssrContent}\n    <div id="app">`);
}

function renderBlogIndex(html, posts) {
  const url = `${SITE_URL}/blog`;
  const desc =
    "Jeff Adler's engineering blog. AI, agentic engineering, leadership, iOS architecture, and technical deep dives from Google, Dropbox, and Reddit.";
  const postsWithoutBody = posts.map(({ body, ...meta }) => meta);
  const ssrData = `<script>window.__SSR_POSTS__=${JSON.stringify(postsWithoutBody).replace(/</g, "\\u003c")}</script>`;
  const rendered = injectMeta(html, {
    title:
      "Jads Blog - Jeff Adler | Engineering Leadership, AI, Agentic Development",
    ogTitle: "Jads Blog - Jeff Adler",
    description: desc,
    url: url,
    jsonLd: blogIndexJsonLd(posts, url, desc),
  });
  return rendered.replace("</head>", `    ${ssrData}\n  </head>`);
}

module.exports = {
  SITE_URL,
  escapeHtml,
  injectMeta,
  renderBlogPost,
  renderBlogIndex,
  postJsonLd,
  blogIndexJsonLd,
};
