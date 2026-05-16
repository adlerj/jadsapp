<template>
  <div class="blog-index">
    <header class="blog-header">
      <h1>Jads Blog</h1>
      <nav class="blog-nav">
        <router-link to="/">Home</router-link>
      </nav>
    </header>

    <div class="blog-layout">
      <aside class="timeline-nav">
        <div
          v-for="year in years"
          :key="year"
          class="timeline-year"
          :class="{ active: activeYear === year }"
        >
          <button class="year-btn" @click="scrollToYear(year)">
            {{ year }}
            <span class="post-count">{{ postsByYear[year].length }}</span>
          </button>
          <div v-if="activeYear === year" class="month-list">
            <button
              v-for="month in monthsForYear(year)"
              :key="month"
              class="month-btn"
              @click="scrollToMonth(year, month)"
            >
              {{ monthName(month) }}
            </button>
          </div>
        </div>
      </aside>

      <div class="post-list" ref="postListRef">
        <div
          v-for="year in years"
          :key="year"
          class="year-group"
          :id="'year-' + year"
          :ref="(el) => setYearRef(year, el)"
        >
          <h2 class="year-header">{{ year }}</h2>
          <router-link
            v-for="post in postsByYear[year]"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="post-card"
            :id="'post-' + post.slug"
          >
            <div class="post-meta">
              <time :datetime="post.date">{{ formatDate(post.date) }}</time>
              <span v-if="post.series" class="series-badge"
                >{{ post.series }}
                <template v-if="post.part"> Pt. {{ post.part }}</template></span
              >
            </div>
            <h3>{{ post.title }}</h3>
            <p>{{ post.description }}</p>
            <div v-if="post.tags" class="tags">
              <span v-for="tag in post.tags" :key="tag" class="tag">{{
                tag
              }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { getPostsByYear } from "../composables/useBlog";

export default {
  name: "BlogIndex",
  setup() {
    const postsByYear = computed(() => getPostsByYear());
    const years = computed(() =>
      Object.keys(postsByYear.value).sort((a, b) => b.localeCompare(a))
    );
    const activeYear = ref(null);
    const yearRefs = {};
    let observer = null;

    function setYearRef(year, el) {
      if (el) yearRefs[year] = el;
    }

    function monthsForYear(year) {
      const posts = postsByYear.value[year] || [];
      const months = new Set(
        posts.map((p) => (p.date ? p.date.slice(5, 7) : "01"))
      );
      return [...months].sort((a, b) => b.localeCompare(a));
    }

    function monthName(m) {
      const names = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return names[parseInt(m, 10) - 1] || m;
    }

    function scrollToYear(year) {
      const el = yearRefs[year];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function scrollToMonth(year, month) {
      const posts = postsByYear.value[year] || [];
      const matchesMonth = (p) => p.date && p.date.slice(5, 7) === month;
      const post = posts.find(matchesMonth);
      if (post) {
        const el = document.getElementById("post-" + post.slug);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function formatDate(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    onMounted(() => {
      nextTick(() => {
        if (years.value.length) activeYear.value = years.value[0];

        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                const year = entry.target.id.replace("year-", "");
                activeYear.value = year;
              }
            }
          },
          { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
        );

        for (const year of years.value) {
          const el = yearRefs[year];
          if (el) observer.observe(el);
        }
      });
    });

    onUnmounted(() => {
      if (observer) observer.disconnect();
    });

    return {
      postsByYear,
      years,
      activeYear,
      setYearRef,
      monthsForYear,
      monthName,
      scrollToYear,
      scrollToMonth,
      formatDate,
    };
  },
};
</script>

<style scoped>
.blog-index {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.blog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.blog-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
}

.blog-nav a {
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.blog-nav a:hover {
  color: var(--link-hover);
}

.blog-layout {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 2.5rem;
}

/* Timeline sidebar */
.timeline-nav {
  position: sticky;
  top: 2rem;
  height: fit-content;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  padding-right: 1rem;
  scrollbar-width: thin;
}

.timeline-year {
  margin-bottom: 0.25rem;
}

.year-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  border-left: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
}

.year-btn:hover {
  color: var(--text-primary);
  border-left-color: var(--border-primary);
}

.timeline-year.active .year-btn {
  color: var(--link-color);
  border-left-color: var(--link-color);
  text-shadow: 0 0 8px var(--glow-color, transparent);
}

.post-count {
  font-size: 0.7rem;
  opacity: 0.5;
  min-width: 1.2rem;
  text-align: right;
}

.month-list {
  overflow: hidden;
  animation: expandMonths 0.3s ease;
}

@keyframes expandMonths {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 300px;
    opacity: 1;
  }
}

.month-btn {
  display: block;
  width: 100%;
  padding: 0.25rem 0.75rem 0.25rem 1.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s;
}

.month-btn:hover {
  color: var(--link-color);
}

/* Post list */
.year-group {
  margin-bottom: 2rem;
}

.year-header {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
  letter-spacing: 0.05em;
}

.post-card {
  display: block;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-secondary);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.post-card:hover {
  border-color: var(--link-color);
  box-shadow: 0 0 12px var(--glow-color, rgba(255, 255, 255, 0.1));
  transform: translateY(-1px);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.post-meta time {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.series-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: var(--link-color);
  color: var(--bg-primary);
  font-weight: 600;
  letter-spacing: 0.03em;
}

.post-card h3 {
  color: var(--text-primary);
  font-size: 1.15rem;
  margin: 0 0 0.4rem;
}

.post-card p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  font-size: 0.9rem;
}

.tags {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.6rem;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: var(--bg-primary);
  color: var(--link-color);
  border: 1px solid var(--border-primary);
}

/* Mobile */
@media (max-width: 768px) {
  .blog-layout {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .timeline-nav {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: 0;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: none;
    padding: 0.5rem 0;
    margin-bottom: 1.5rem;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-primary);
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .timeline-nav::-webkit-scrollbar {
    display: none;
  }

  .timeline-year {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .year-btn {
    padding: 0.4rem 0.75rem;
    border-left: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    font-size: 0.85rem;
  }

  .year-btn:hover {
    border-left: none;
    border-bottom-color: var(--border-primary);
  }

  .timeline-year.active .year-btn {
    border-left: none;
    border-bottom-color: var(--link-color);
  }

  .month-list {
    display: none;
  }

  .post-count {
    display: none;
  }
}
</style>
