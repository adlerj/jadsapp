import { marked } from "marked";

const blogContext = require.context("../content/blog", false, /\.md$/);

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { meta: {}, content: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, content: raw };

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

  const content = raw.slice(end + 3).trim();
  return { meta, content };
}

function loadPosts() {
  return blogContext
    .keys()
    .map((key) => {
      const raw = blogContext(key);
      const { meta, content } = parseFrontmatter(raw);
      const slug = key.replace("./", "").replace(".md", "");
      return { slug, ...meta, body: content };
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

let cachedPosts = null;

export function getAllPosts() {
  if (!cachedPosts) cachedPosts = loadPosts();
  return cachedPosts;
}

export function getPost(slug) {
  return getAllPosts().find((p) => p.slug === slug) || null;
}

export function getPostsByYear() {
  const grouped = {};
  for (const post of getAllPosts()) {
    const year = post.date ? post.date.slice(0, 4) : "undated";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(post);
  }
  return grouped;
}

export function getPostsBySeries(seriesName) {
  return getAllPosts()
    .filter((p) => p.series === seriesName)
    .sort((a, b) => (a.part || 0) - (b.part || 0));
}

export function getAdjacentPosts(slug) {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    prev: idx < posts.length - 1 ? posts[idx + 1] : null,
    next: idx > 0 ? posts[idx - 1] : null,
  };
}

export function getRelatedPosts(slug, limit = 3) {
  const post = getPost(slug);
  if (!post || !post.tags) return [];
  const tags = new Set(post.tags);
  return getAllPosts()
    .filter((p) => p.slug !== slug && p.tags && p.tags.some((t) => tags.has(t)))
    .slice(0, limit);
}

export function renderMarkdown(content) {
  const renderer = new marked.Renderer();
  const originalLink = renderer.link.bind(renderer);
  renderer.link = function (args) {
    const html = originalLink(args);
    if (args.href && args.href.startsWith("/")) return html;
    return html.replace("<a ", '<a target="_blank" rel="noopener" ');
  };

  renderer.image = function (args) {
    return `<img src="${args.href}" alt="${args.text || ""}" ${
      args.title ? `title="${args.title}"` : ""
    } loading="lazy" style="max-width: 100%; height: auto; border-radius: 6px; margin: 1rem 0;" />`;
  };

  return marked.parse(content, {
    renderer,
    gfm: true,
    breaks: true,
  });
}
