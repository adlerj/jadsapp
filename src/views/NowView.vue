<template>
  <div class="now-page">
    <header class="now-header">
      <nav class="now-nav">
        <router-link to="/">&larr; Back to Home</router-link>
      </nav>
      <h1>Now</h1>
      <p class="now-meta">
        What I'm focused on right now. Last updated
        <time :datetime="lastUpdated">{{ formatDate(lastUpdated) }}</time
        >. Inspired by
        <a
          href="https://nownownow.com"
          target="_blank"
          rel="noopener noreferrer"
          >nownownow.com</a
        >.
      </p>
    </header>

    <main>
      <section
        v-for="block in sections"
        :key="block.heading"
        class="now-section"
      >
        <h2>{{ block.heading }}</h2>
        <ul class="now-list">
          <li v-for="(item, i) in block.items" :key="i">
            <span v-if="item.label" class="now-label">{{ item.label }}:</span>
            <template v-if="item.url">
              <a :href="item.url" target="_blank" rel="noopener noreferrer"
                >{{ item.text }} &nearr;</a
              >
            </template>
            <template v-else>{{ item.text }}</template>
          </li>
        </ul>
      </section>
    </main>

    <footer class="now-footer">
      <p>
        This page changes irregularly. If something here matters to you, check
        back. Or
        <router-link to="/terminal">ask Jadbot</router-link>.
      </p>
    </footer>
  </div>
</template>

<script>
export default {
  name: "NowView",
  setup() {
    // Edit this file when your focus shifts.
    // Keep it short and current. The honesty is the point.
    const lastUpdated = "2026-05-17";

    const sections = [
      {
        heading: "Working on",
        items: [
          {
            text: "Leading engineering for Dropbox Dash, our AI-powered universal search product. Five teams, end-to-end ownership.",
          },
          {
            text: "Thinking about 0 to 1 in an agentic-native world.",
          },
        ],
      },
      {
        heading: "Writing",
        items: [
          {
            label: "Latest",
            text: "The Manager Layer is Next",
            url: "/blog/the-manager-layer-is-next",
          },
          {
            label: "Recent",
            text: "Tokenmaxxing Is What Happens When You Measure Wrong",
            url: "/blog/tokenmaxxing-is-what-happens-when-you-measure-ai-adoption-wrong",
          },
          {
            text: "Drafting more on what engineering orgs look like when most of the code is agent-written.",
          },
        ],
      },
      {
        heading: "Reading",
        items: [
          {
            text: "The War of Art, by Steven Pressfield.",
          },
          {
            text: "The One Thing, by Gary Keller and Jay Papasan.",
          },
          {
            text: "The Art of Possibility, by Rosamund and Benjamin Zander.",
          },
        ],
      },
      {
        heading: "Outside",
        items: [
          {
            label: "Snow",
            text: "A-Basin season with the condo crew.",
          },
          {
            label: "Bikes",
            text: "Colorado trails. Strava if you want to chase me down.",
            url: "https://www.strava.com/athletes/17328901",
          },
          {
            label: "Photo",
            text: "Posting on Instagram",
            url: "https://www.instagram.com/jads.pics/",
          },
        ],
      },
    ];

    function formatDate(iso) {
      const d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return { sections, lastUpdated, formatDate };
  },
};
</script>

<style scoped>
.now-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.now-nav {
  margin-bottom: 1.5rem;
}

.now-nav a {
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9rem;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.now-nav a:hover {
  border-bottom-color: var(--link-color);
}

.now-header h1 {
  font-size: 2.4rem;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  text-shadow: 0 0 12px var(--border-glow);
  letter-spacing: 0.02em;
}

.now-meta {
  margin: 0 0 2.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.now-meta a {
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--link-color);
}

.now-section {
  margin-bottom: 2.25rem;
}

.now-section h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

.now-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.now-list li {
  line-height: 1.55;
}

.now-label {
  font-weight: bold;
  color: var(--text-accent);
  margin-right: 6px;
  letter-spacing: 0.02em;
}

.now-list a {
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--link-color);
  transition: all 0.3s ease;
}

.now-list a:hover {
  color: var(--link-hover);
  border-bottom-color: var(--link-hover);
  text-shadow: 0 0 5px var(--border-glow);
}

.now-footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.now-footer a {
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--link-color);
}
</style>
