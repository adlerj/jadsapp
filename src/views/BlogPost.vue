<template>
  <div class="blog-post" v-if="post">
    <header class="post-header">
      <nav class="post-nav">
        <router-link to="/blog">Back to Jads Blog</router-link>
      </nav>
      <h1>{{ post.title }}</h1>
      <div class="header-nav-arrows" v-if="adjacent.prev || adjacent.next">
        <router-link
          v-if="adjacent.prev"
          :to="`/blog/${adjacent.prev.slug}`"
          class="nav-arrow nav-prev"
          :title="adjacent.prev.title"
          >&larr; Older</router-link
        >
        <router-link
          v-if="adjacent.next"
          :to="`/blog/${adjacent.next.slug}`"
          class="nav-arrow nav-next"
          :title="adjacent.next.title"
          >Newer &rarr;</router-link
        >
      </div>
      <div class="post-meta-row">
        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        <span v-if="post.series" class="series-label"
          >{{ post.series }}
          <template v-if="post.part"> — Part {{ post.part }}</template></span
        >
      </div>
      <div v-if="post.tags" class="tags">
        <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>

    <nav v-if="seriesPosts.length > 1" class="series-nav">
      <div class="series-title">{{ post.series }}</div>
      <div class="series-parts">
        <router-link
          v-for="sp in seriesPosts"
          :key="sp.slug"
          :to="`/blog/${sp.slug}`"
          class="series-part"
          :class="{ current: sp.slug === post.slug }"
          @click="trackNav('series', sp.slug)"
        >
          Part {{ sp.part }}<span class="part-title">{{ sp.title }}</span>
        </router-link>
      </div>
    </nav>

    <article
      class="post-content"
      ref="postContent"
      v-html="renderedContent"
    ></article>
    <div ref="scrollSentinel" class="scroll-sentinel"></div>

    <footer class="post-footer">
      <div v-if="related.length" class="related-posts">
        <h3>Related Posts</h3>
        <div class="related-list">
          <router-link
            v-for="rp in related"
            :key="rp.slug"
            :to="`/blog/${rp.slug}`"
            class="related-card"
            @click="trackNav('related', rp.slug)"
          >
            <span class="related-title">{{ rp.title }}</span>
            <time>{{ formatDate(rp.date) }}</time>
          </router-link>
        </div>
      </div>

      <nav class="adjacent-nav">
        <router-link
          v-if="adjacent.prev"
          :to="`/blog/${adjacent.prev.slug}`"
          class="adj-link adj-prev"
          @click="trackNav('adjacent', adjacent.prev.slug)"
        >
          <span class="adj-label">Older</span>
          <span class="adj-title">{{ adjacent.prev.title }}</span>
        </router-link>
        <router-link
          v-if="adjacent.next"
          :to="`/blog/${adjacent.next.slug}`"
          class="adj-link adj-next"
          @click="trackNav('adjacent', adjacent.next.slug)"
        >
          <span class="adj-label">Newer</span>
          <span class="adj-title">{{ adjacent.next.title }}</span>
        </router-link>
      </nav>
    </footer>
  </div>

  <div class="blog-post not-found" v-else-if="!loading">
    <h1>Post not found</h1>
    <router-link to="/blog">Back to Jads Blog</router-link>
  </div>
</template>

<script>
import { ref, computed, watchEffect, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {
  getPost,
  fetchPost,
  fetchAllPosts,
  renderMarkdown,
  getPostsBySeries,
  getAdjacentPosts,
  getRelatedPosts,
} from "../composables/useBlog";
import { trackEvent } from "../composables/useAnalytics";

export default {
  name: "BlogPost",
  setup() {
    const route = useRoute();
    const post = ref(null);
    const loading = ref(true);

    async function loadPost(slug) {
      loading.value = true;
      post.value = null;
      await fetchAllPosts();
      await fetchPost(slug);
      post.value = getPost(slug);
      loading.value = false;
      if (post.value) {
        trackEvent("blog_post_viewed", { slug, title: post.value.title });
      }
    }

    loadPost(route.params.slug);
    watch(
      () => route.params.slug,
      (slug) => {
        if (slug) loadPost(slug);
      }
    );

    const renderedContent = computed(() => {
      if (!post.value) return "";
      return renderMarkdown(post.value.body);
    });

    const seriesPosts = computed(() => {
      if (!post.value || !post.value.series) return [];
      return getPostsBySeries(post.value.series);
    });

    const adjacent = computed(() => {
      if (!post.value) return { prev: null, next: null };
      return getAdjacentPosts(route.params.slug);
    });

    const related = computed(() => {
      if (!post.value) return [];
      return getRelatedPosts(route.params.slug, 3);
    });

    function setMeta(attr, key, content) {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    function setLink(rel, href) {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    }

    watchEffect(() => {
      if (post.value) {
        const title = `${post.value.title} - Jeff Adler`;
        const desc = post.value.description || "";
        const url = `https://jads.app/blog/${route.params.slug}`;
        const wordCount = (post.value.body || "")
          .split(/\s+/)
          .filter(Boolean).length;

        document.title = title;
        setMeta("name", "description", desc);

        setMeta("property", "og:title", post.value.title);
        setMeta("property", "og:description", desc);
        setMeta("property", "og:url", url);
        setMeta("property", "og:type", "article");
        setMeta("property", "og:site_name", "Jeff Adler — jads.app");
        setMeta("property", "og:image", "https://jads.app/jeff-adler.png");
        setMeta("property", "og:locale", "en_US");
        if (post.value.date) {
          setMeta("property", "article:published_time", post.value.date);
        }
        const modifiedDate = post.value.updatedAt
          ? post.value.updatedAt.split(" ")[0]
          : post.value.date;
        if (modifiedDate) {
          setMeta("property", "article:modified_time", modifiedDate);
        }
        setMeta("property", "article:author", "https://jads.app/");
        if (post.value.tags) {
          post.value.tags.forEach((tag) => {
            let el = document.querySelector(
              `meta[property="article:tag"][content="${tag}"]`
            );
            if (!el) {
              el = document.createElement("meta");
              el.setAttribute("property", "article:tag");
              el.setAttribute("content", tag);
              document.head.appendChild(el);
            }
          });
        }

        setMeta("name", "twitter:card", "summary");
        setMeta("name", "twitter:title", post.value.title);
        setMeta("name", "twitter:description", desc);
        setMeta("name", "twitter:image", "https://jads.app/jeff-adler.png");
        setMeta("name", "twitter:site", "@JadlerOS");
        setMeta("name", "twitter:creator", "@JadlerOS");

        setLink("canonical", url);

        let ld = document.querySelector("script[data-blog-ld]");
        if (!ld) {
          ld = document.createElement("script");
          ld.setAttribute("type", "application/ld+json");
          ld.setAttribute("data-blog-ld", "true");
          document.head.appendChild(ld);
        }
        ld.textContent = JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.value.title,
            description: desc,
            datePublished: post.value.date,
            dateModified: post.value.updatedAt
              ? post.value.updatedAt.split(" ")[0]
              : post.value.date,
            wordCount: wordCount,
            url: url,
            author: {
              "@type": "Person",
              name: "Jeff Adler",
              url: "https://jads.app",
              jobTitle: "Director of Engineering",
              worksFor: { "@type": "Organization", name: "Dropbox" },
            },
            publisher: {
              "@type": "Person",
              name: "Jeff Adler",
              url: "https://jads.app",
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            image: "https://jads.app/jeff-adler.png",
            inLanguage: "en-US",
            keywords: (post.value.tags || []).join(", "),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://jads.app",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: "https://jads.app/blog",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.value.title,
                item: url,
              },
            ],
          },
        ]);
      }
    });

    function formatDate(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    function trackNav(type, target) {
      trackEvent("blog_nav_clicked", { type, target });
    }

    const postContent = ref(null);
    const scrollSentinel = ref(null);
    const firedDepths = new Set();
    let scrollObserver = null;

    function setupScrollDepth() {
      firedDepths.clear();
      if (scrollObserver) scrollObserver.disconnect();
      if (!postContent.value) return;
      const thresholds = [0.25, 0.5, 0.75, 1.0];
      scrollObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || !post.value) return;
            const ratio = entry.intersectionRatio;
            for (const t of thresholds) {
              const depth = Math.round(t * 100);
              if (ratio >= t && !firedDepths.has(depth)) {
                firedDepths.add(depth);
                trackEvent("blog_scroll_depth", {
                  slug: route.params.slug,
                  depth,
                });
              }
            }
          });
        },
        { threshold: thresholds }
      );
      scrollObserver.observe(postContent.value);
    }

    watch(renderedContent, () => {
      if (renderedContent.value) {
        setTimeout(setupScrollDepth, 100);
      }
    });

    onMounted(() => {
      if (postContent.value) setupScrollDepth();
    });

    onUnmounted(() => {
      if (scrollObserver) scrollObserver.disconnect();
    });

    return {
      post,
      loading,
      renderedContent,
      seriesPosts,
      adjacent,
      related,
      formatDate,
      trackNav,
      postContent,
      scrollSentinel,
    };
  },
};
</script>

<style scoped>
.blog-post {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.post-nav a {
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.post-nav a:hover {
  color: var(--link-hover);
}

.post-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.post-header h1 {
  color: var(--text-primary);
  font-size: 2rem;
  margin: 1rem 0 0.5rem;
}

.post-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.post-meta-row time {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.series-label {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: var(--link-color);
  color: var(--bg-primary);
  font-weight: 600;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--link-color);
  border: 1px solid var(--border-primary);
}

/* Series navigation */
.series-nav {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.series-title {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.series-parts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.series-part {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: background 0.2s;
}

.series-part:hover {
  background: var(--bg-primary);
}

.series-part.current {
  color: var(--link-color);
  background: var(--bg-primary);
  font-weight: 600;
}

.part-title {
  font-size: 0.8rem;
  opacity: 0.7;
}

.header-nav-arrows {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0;
}

.nav-arrow {
  color: var(--link-color);
  font-size: 0.85rem;
  text-decoration: none;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.nav-arrow:hover {
  background: var(--link-color);
  color: var(--bg-primary);
}

/* Post content */
.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
  color: var(--text-primary);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.post-content :deep(h1) {
  display: none;
}

.post-content :deep(p) {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

.post-content :deep(a) {
  color: var(--link-color);
  text-decoration: underline;
}

.post-content :deep(a:hover) {
  color: var(--link-hover);
}

.post-content :deep(ul),
.post-content :deep(ol) {
  color: var(--text-secondary);
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.post-content :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.post-content :deep(strong) {
  color: var(--text-primary);
}

.post-content :deep(code) {
  background: var(--bg-secondary);
  color: var(--link-color);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9em;
}

.post-content :deep(pre) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.post-content :deep(pre code) {
  background: none;
  padding: 0;
}

.post-content :deep(blockquote) {
  border-left: 3px solid var(--link-color);
  margin: 1.5rem 0;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0 6px 6px 0;
}

.post-content :deep(blockquote p) {
  margin-bottom: 0;
}

.post-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-primary);
  margin: 2rem 0;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1rem 0;
}

/* Footer: related + adjacent */
.post-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-primary);
}

.related-posts {
  margin-bottom: 2rem;
}

.related-posts h3 {
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.related-card {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  text-decoration: none;
  transition: border-color 0.2s;
}

.related-card:hover {
  border-color: var(--link-color);
}

.related-title {
  color: var(--text-primary);
  font-size: 0.9rem;
}

.related-card time {
  color: var(--text-secondary);
  font-size: 0.75rem;
  flex-shrink: 0;
  margin-left: 1rem;
}

.adjacent-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.adj-link {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  text-decoration: none;
  transition: border-color 0.2s;
}

.adj-link:hover {
  border-color: var(--link-color);
}

.adj-next {
  text-align: right;
  grid-column: 2;
}

.adj-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.adj-title {
  color: var(--link-color);
  font-size: 0.9rem;
}

/* Not found */
.not-found {
  text-align: center;
  padding-top: 4rem;
}

.not-found h1 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.not-found a {
  color: var(--link-color);
}

@media (max-width: 768px) {
  .adjacent-nav {
    grid-template-columns: 1fr;
  }

  .adj-next {
    text-align: left;
    grid-column: 1;
  }
}

.scroll-sentinel {
  height: 1px;
  visibility: hidden;
}
</style>
