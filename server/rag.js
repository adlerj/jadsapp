const STOPWORDS = new Set([
  "the", "and", "for", "you", "how", "what", "his", "has", "are", "was",
  "did", "can", "with", "that", "this", "your", "from", "have", "they",
  "about", "jeff", "does", "get", "when", "why", "who", "use", "but", "not",
  "its", "our", "him", "her", "any", "all", "just", "one", "two", "now", "new",
]);

const SCORE_THRESHOLD = 3;
const MAX_POSTS = 1;

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function buildBlogMeta(posts) {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    bodyWords: new Set(tokenize(p.body)),
  }));
}

function scorePost(meta, queryTokens) {
  let score = 0;
  for (const token of queryTokens) {
    if (meta.title.toLowerCase().includes(token)) score += 4;
    if (meta.tags.some((t) => t.toLowerCase().includes(token))) score += 3;
    if (meta.description.toLowerCase().includes(token)) score += 2;
    if (meta.bodyWords.has(token)) score += 1;
  }
  return score;
}

// Queries asking "what has jeff written about X" don't need full post bodies --
// the blogIndex titles/descriptions are enough. Injecting full posts causes the
// model to summarize each one, producing verbose responses.
const LISTING_QUERY_RE = /\b(written|write|blog|post|article|piece|covered|published)\b/i;

function getRelevantPosts(query, meta, bodies) {
  if (LISTING_QUERY_RE.test(query)) return [];

  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return meta
    .map((m) => ({ slug: m.slug, score: scorePost(m, tokens) }))
    .filter((x) => x.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_POSTS)
    .map((x) => bodies.get(x.slug))
    .filter(Boolean);
}

module.exports = { buildBlogMeta, getRelevantPosts };
