<template>
  <div class="about-page">
    <header class="about-header">
      <nav class="about-nav">
        <router-link to="/">&larr; Back to Home</router-link>
      </nav>
      <h1>About Jeff Adler</h1>
    </header>

    <main>
      <p class="lead">{{ bio.BIO_SHORT }}</p>
      <p class="disambig">{{ bio.DISAMBIGUATION }}</p>

      <section class="about-section">
        <h2>Experience</h2>
        <ul class="career">
          <li v-for="(role, i) in bio.CAREER" :key="i">
            <strong>{{ role.title }}</strong>
            <span class="period">({{ role.period }})</span>
            <p>{{ role.detail }}</p>
          </li>
        </ul>
      </section>

      <section class="about-section">
        <h2>Education</h2>
        <p>{{ bio.EDUCATION }}</p>
      </section>

      <section class="about-section">
        <h2>Frequently Asked Questions</h2>
        <div v-for="(item, i) in bio.FAQ" :key="i" class="faq-item">
          <h3>{{ item.q }}</h3>
          <p>{{ item.a }}</p>
        </div>
      </section>

      <p class="about-links">
        <router-link to="/blog">Blog</router-link>
        &middot;
        <router-link to="/now">Now</router-link>
        &middot;
        <router-link to="/terminal">Ask Jadbot</router-link>
      </p>
    </main>
  </div>
</template>

<script>
// Shares server/bio.js (pure data) with the server-rendered /about page so the
// human-facing and crawler-facing versions never drift.
import bio from "../../server/bio";

export default {
  name: "AboutView",
  setup() {
    return { bio };
  },
};
</script>

<style scoped>
.about-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.about-nav {
  margin-bottom: 1.5rem;
}

.about-nav a {
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9rem;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.about-nav a:hover {
  border-bottom-color: var(--link-color);
}

.about-header h1 {
  font-size: 2.4rem;
  margin: 0 0 1rem;
  color: var(--text-primary);
  text-shadow: 0 0 12px var(--border-glow);
}

.lead {
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.disambig {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0 0 2rem;
}

.about-section {
  margin-bottom: 2.25rem;
}

.about-section h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-secondary);
  margin: 0 0 1rem;
}

.career {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.career strong {
  color: var(--text-primary);
}

.career .period {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-left: 0.35rem;
}

.career p {
  margin: 0.25rem 0 0;
  color: var(--text-secondary);
  line-height: 1.55;
  font-size: 0.95rem;
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

.about-links {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
  color: var(--text-secondary);
}

.about-links a {
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--link-color);
}

.about-links a:hover {
  color: var(--link-hover);
}
</style>
