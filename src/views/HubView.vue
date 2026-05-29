<template>
  <div class="hub-page">
    <header class="hub-header">
      <nav class="hub-nav">
        <router-link to="/">&larr; Home</router-link>
        <router-link to="/blog">Blog</router-link>
      </nav>
    </header>

    <main v-if="hub">
      <h1>{{ hub.title }}</h1>
      <section class="hub-thesis">
        <p v-for="(para, i) in hub.thesis" :key="i">{{ para }}</p>
      </section>

      <section class="hub-reading">
        <h2>Reading path ({{ members.length }} posts)</h2>
        <ul class="hub-list">
          <li v-for="post in members" :key="post.slug">
            <router-link :to="`/blog/${post.slug}`">{{
              post.title
            }}</router-link>
            <span class="hub-date">{{ fmt(post.date) }}</span>
            <p class="hub-desc">{{ post.description }}</p>
          </li>
        </ul>
      </section>

      <section class="hub-faq">
        <h2>Frequently Asked Questions</h2>
        <div v-for="(item, i) in hub.faq" :key="i" class="faq-item">
          <h3>{{ item.q }}</h3>
          <p>{{ item.a }}</p>
        </div>
      </section>

      <p class="hub-cross">
        More topics:
        <template v-for="(h, i) in otherHubs" :key="h.slug">
          <router-link :to="`/writing/${h.slug}`">{{ h.title }}</router-link
          ><span v-if="i < otherHubs.length - 1"> | </span>
        </template>
        | <router-link to="/about">About Jeff Adler</router-link>
      </p>
    </main>

    <main v-else class="hub-missing">
      <h1>Topic not found</h1>
      <p>
        That topic does not exist.
        <router-link to="/blog">Browse all posts</router-link>.
      </p>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
// Shares server/hubs.js (pure data) with the server-rendered hub pages.
import hubs from "../../server/hubs";
import { fetchAllPosts, getAllPosts } from "../composables/useBlog";

export default {
  name: "HubView",
  setup() {
    const route = useRoute();
    const posts = ref(getAllPosts());
    const hub = computed(() => hubs.getHub(route.params.topic));
    const members = computed(() =>
      hub.value ? hubs.postsForHub(hub.value, posts.value) : []
    );
    const otherHubs = computed(() =>
      hubs.allHubs().filter((h) => !hub.value || h.slug !== hub.value.slug)
    );

    function applyMeta() {
      if (!hub.value) return;
      document.title = hub.value.pageTitle;
      const d = document.querySelector('meta[name="description"]');
      if (d) d.setAttribute("content", hub.value.description);
    }

    function fmt(date) {
      if (!date) return "";
      return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    onMounted(async () => {
      posts.value = await fetchAllPosts();
      applyMeta();
    });
    watch(() => route.params.topic, applyMeta);

    return { hub, members, otherHubs, fmt };
  },
};
</script>

<style scoped>
.hub-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.hub-nav {
  display: flex;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.hub-nav a {
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9rem;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.hub-nav a:hover {
  border-bottom-color: var(--link-color);
}

.hub-page h1 {
  font-size: 2.4rem;
  margin: 0 0 1.25rem;
  color: var(--text-primary);
  text-shadow: 0 0 12px var(--border-glow);
}

.hub-thesis p {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.hub-reading,
.hub-faq {
  margin-top: 2.5rem;
}

.hub-page h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-secondary);
  margin: 0 0 1rem;
}

.hub-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hub-list a {
  color: var(--link-color);
  text-decoration: none;
  font-size: 1.05rem;
  border-bottom: 1px dotted var(--link-color);
}

.hub-list a:hover {
  color: var(--link-hover);
}

.hub-date {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.hub-desc {
  margin: 0.25rem 0 0;
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.9rem;
}

.faq-item {
  margin-bottom: 1.25rem;
}

.faq-item h3 {
  color: var(--text-primary);
  font-size: 1.05rem;
  margin: 0 0 0.35rem;
}

.faq-item p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.55;
}

.hub-cross {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
  color: var(--text-secondary);
}

.hub-cross a {
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--link-color);
}
</style>
