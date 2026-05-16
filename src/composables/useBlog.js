import { marked } from "marked";
import { ref } from "vue";

const postsCache = ref([]);
const postCache = ref({});
let indexFetched = false;

function hydrateFromSSR() {
  if (window.__SSR_POSTS__ && !indexFetched) {
    postsCache.value = window.__SSR_POSTS__;
    indexFetched = true;
  }
  if (window.__SSR_POST__) {
    const p = window.__SSR_POST__;
    postCache.value[p.slug] = p;
  }
}

hydrateFromSSR();

export async function fetchAllPosts() {
  if (indexFetched && postsCache.value.length) return postsCache.value;
  try {
    const res = await fetch("/api/posts");
    if (!res.ok) throw new Error(res.statusText);
    postsCache.value = await res.json();
    indexFetched = true;
  } catch (e) {
    console.warn("Failed to fetch posts:", e.message);
  }
  return postsCache.value;
}

export async function fetchPost(slug) {
  if (postCache.value[slug]) return postCache.value[slug];
  try {
    const res = await fetch(`/api/posts/${slug}`);
    if (!res.ok) throw new Error(res.statusText);
    const post = await res.json();
    postCache.value[slug] = post;
    return post;
  } catch (e) {
    console.warn("Failed to fetch post:", e.message);
    return null;
  }
}

export function getAllPosts() {
  return postsCache.value;
}

export function getPost(slug) {
  return (
    postCache.value[slug] ||
    postsCache.value.find((p) => p.slug === slug) ||
    null
  );
}

export function getPostsByYear() {
  const grouped = {};
  for (const post of postsCache.value) {
    const year = post.date ? post.date.slice(0, 4) : "undated";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(post);
  }
  return grouped;
}

export function getPostsBySeries(seriesName) {
  return postsCache.value
    .filter((p) => p.series === seriesName)
    .sort((a, b) => (a.part || 0) - (b.part || 0));
}

export function getAdjacentPosts(slug) {
  const posts = postsCache.value;
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
  return postsCache.value
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
