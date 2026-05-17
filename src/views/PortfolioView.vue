<template>
  <div class="portfolio">
    <BootSequence v-if="showBoot" @complete="onBootComplete" />

    <template v-if="!showBoot">
      <header>
        <div class="header-content">
          <h1 @mouseover="glitchEffect">Jeff Adler</h1>
          <nav>
            <a href="#about" @click.prevent="navigateTo('about')">About</a>
            <a href="#experience" @click.prevent="navigateTo('experience')"
              >Experience</a
            >
            <a href="#passions" @click.prevent="navigateTo('passions')"
              >Passions</a
            >
            <a href="#terminal" @click.prevent="navigateTo('terminal')"
              >Terminal</a
            >
            <router-link to="/blog">Blog</router-link>
          </nav>
        </div>
        <div class="header-actions">
          <button
            @click="openThemePicker"
            class="music-button"
            aria-label="Change theme"
          >
            <i class="fas fa-palette"></i>
          </button>
          <button
            @click="toggleWebamp"
            class="music-button"
            :class="{ active: showWebamp }"
            aria-label="Toggle music player"
          >
            <i class="fas fa-music"></i>
          </button>
        </div>
      </header>

      <main>
        <section id="about">
          <div class="hero">
            <div class="hero-photo">
              <img
                src="/jeff-adler.png"
                alt="Jeff Adler"
                class="profile-photo"
              />
            </div>
            <div class="hero-text">
              <div class="typing-animation">
                <p class="typewriter-line">
                  {{ typewriterText }}<span class="cursor">_</span>
                </p>
              </div>
              <p class="hero-summary">
                Engineering leader with a decade of building and scaling
                platforms at Google, Reddit, and Dropbox -- now directing AI
                product engineering at Dropbox. From iOS architecture to release
                systems to agentic orchestration, I build things that ship.
                Based in Denver, CO.
              </p>
              <div class="hero-links">
                <a
                  href="https://linkedin.com/in/jeff-adler-2bbb9828"
                  target="_blank"
                  class="contact-link"
                  @click="
                    trackEvent('outbound_link_clicked', {
                      destination: 'linkedin',
                    })
                  "
                  ><i class="fab fa-linkedin"></i> LinkedIn</a
                >
                <a
                  href="/resume.docx"
                  class="contact-link"
                  download
                  @click="
                    trackEvent('outbound_link_clicked', {
                      destination: 'resume',
                    })
                  "
                  ><i class="fas fa-file-alt"></i> Resume</a
                >
              </div>
            </div>
          </div>

          <ul class="hero-stats" aria-label="Career highlights">
            <li>
              <span class="stat-value">5</span>
              <span class="stat-label">teams led at Dropbox Dash</span>
            </li>
            <li>
              <span class="stat-value">100+</span>
              <span class="stat-label">engineers organized at Reddit</span>
            </li>
            <li>
              <span class="stat-value">12 yrs</span>
              <span class="stat-label"
                >shipping at Google, Reddit, Dropbox</span
              >
            </li>
          </ul>

          <section class="featured-writing" aria-labelledby="featured-heading">
            <div class="featured-header">
              <h2 id="featured-heading">FEATURED WRITING</h2>
              <router-link to="/blog" class="featured-all"
                >All posts &rarr;</router-link
              >
            </div>
            <div class="featured-grid">
              <router-link
                v-for="post in featuredPosts"
                :key="post.slug"
                :to="`/blog/${post.slug}`"
                class="featured-card"
                @click="
                  trackEvent('outbound_link_clicked', {
                    destination: `featured:${post.slug}`,
                  })
                "
              >
                <span class="featured-date">{{ post.date }}</span>
                <h3 class="featured-title">{{ post.title }}</h3>
                <p class="featured-desc">{{ post.description }}</p>
                <span class="featured-read">Read &rarr;</span>
              </router-link>
            </div>
          </section>

          <div id="terminal" class="terminal-section">
            <TerminalChat :inline="true" @launch-widget="handleWidgetLaunch" />
          </div>

          <h2>About Me</h2>
          <div class="about-details">
            <div class="about-block">
              <h3>What I Build</h3>
              <ul>
                <li>
                  AI-powered products from concept to scale using LLMs and ML —
                  taking ideas from zero to one and driving them through
                  product-market fit
                </li>
                <li>
                  Foundational platforms at massive scale, building and owning
                  core infrastructure used by hundreds of millions of users
                </li>
                <li>
                  Multi-surface platforms spanning web, desktop, mobile, and
                  browser extensions with shared-code architectures
                </li>
                <li>
                  Agentic development workflows powered by Claude and LLM
                  orchestration that fundamentally change how engineering teams
                  ship software
                </li>
              </ul>
            </div>
            <div class="about-block">
              <h3>How I Lead</h3>
              <ul>
                <li>
                  Transforming legacy engineering organizations to adopt agentic
                  coding practices, accelerating teams to build in the AI-native
                  era
                </li>
                <li>
                  Scaling engineering organizations through intentional org
                  design and hiring
                </li>
                <li>
                  Growing people by building career development systems and
                  creating environments where engineers get promoted
                </li>
                <li>
                  Disciplined execution through operating rhythms, portfolio
                  prioritization, and explicit cut lines
                </li>
                <li>
                  Conviction with humility, pushing hard on what matters while
                  staying genuinely open to better ideas
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="experience">
          <h2>Career Timeline</h2>
          <div class="timeline">
            <div
              v-for="(job, index) in jobHistory"
              :key="index"
              class="timeline-item"
              :class="{ active: activeJob === index }"
              :style="{ animationDelay: index * 0.4 + 's' }"
              role="button"
              tabindex="0"
              @click="setActiveJob(index)"
              @keydown.enter="setActiveJob(index)"
              @keydown.space.prevent="setActiveJob(index)"
            >
              <div class="timeline-content">
                <h3>{{ job.title }}</h3>
                <p class="timeline-meta">
                  {{ job.company }} | {{ job.duration }}
                </p>
                <p v-if="job.scope" class="timeline-scope">{{ job.scope }}</p>
                <ul v-if="activeJob === index">
                  <li v-for="(detail, idx) in job.details" :key="idx">
                    <span v-if="!detail.isLink">{{ detail }}</span>
                    <a
                      v-else
                      :href="detail.url"
                      target="_blank"
                      @click="
                        trackEvent('outbound_link_clicked', {
                          destination: detail.url,
                        })
                      "
                      >{{ detail.text }}</a
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="education">
            <h3>Education</h3>
            <p>
              Rutgers University, B.S. Computer & Electrical Engineering, Minor
              in CS
            </p>
          </div>
        </section>

        <section v-if="talks.length" id="talks" aria-labelledby="talks-heading">
          <h2 id="talks-heading">Talks &amp; Press</h2>
          <ul class="talks-list">
            <li v-for="(t, i) in talks" :key="i" class="talk-item">
              <span class="talk-date">{{ t.date }}</span>
              <a
                v-if="t.url"
                :href="t.url"
                target="_blank"
                rel="noopener noreferrer"
                class="talk-title"
                @click="
                  trackEvent('outbound_link_clicked', {
                    destination: `talk:${t.title}`,
                  })
                "
                >{{ t.title }} &nearr;</a
              >
              <span v-else class="talk-title">{{ t.title }}</span>
              <span v-if="t.venue" class="talk-venue">{{ t.venue }}</span>
            </li>
          </ul>
        </section>

        <section id="passions">
          <h2>Off the Clock</h2>
          <div class="passions-grid">
            <div
              v-for="(passion, index) in passions"
              :key="index"
              class="passion-item"
              :class="{ clickable: passion.action }"
              :style="{ animationDelay: index * 0.5 + 's' }"
              role="button"
              tabindex="0"
              @mouseover="activatePassion(index)"
              @mouseleave="deactivatePassion(index)"
              @click="activatePassionFeature(index)"
              @keydown.enter="activatePassionFeature(index)"
              @keydown.space.prevent="activatePassionFeature(index)"
            >
              <div
                class="passion-icon"
                :class="{ active: activePassion === index }"
              >
                <i :class="passion.icon"></i>
              </div>
              <h3>{{ passion.name }}</h3>
              <span v-if="passion.action === 'link'" class="play-hint link-hint"
                >Visit &nearr;</span
              >
              <span v-else-if="passion.action" class="play-hint"
                >&#9658; Play</span
              >
              <div v-if="passion.links" class="passion-links">
                <a
                  v-for="link in passion.links"
                  :key="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="passion-link"
                  @click.stop="
                    trackEvent('outbound_link_clicked', {
                      destination: `passion-link:${link.label}`,
                    })
                  "
                  >{{ link.label }} &nearr;</a
                >
              </div>
            </div>
          </div>
          <p class="passions-description">
            When not building AI products and engineering agentic workflows,
            Jeff is mountain biking Colorado trails, snowboarding at A-Basin,
            playing disc golf, or DJing drum &amp; bass.
          </p>
        </section>
      </main>

      <footer>
        <p>
          &copy; 2026 Jeff Adler (jadler / jads). All rights reserved. | System
          Version 2.0.0
        </p>
      </footer>

      <transition name="fade">
        <div v-if="showSnowboardGame" class="game-overlay">
          <SnowboardGame @close-game="closeGame('Snowboarding')" />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showMountainBikeGame" class="game-overlay">
          <MountainBikeGame @close="closeGame('Mountain Biking')" />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showDiscGolfGame" class="game-overlay">
          <DiscGolfGame @close-game="closeGame('Disc Golf')" />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showVolleyballGame" class="game-overlay">
          <SlimeVolleyball @close-game="closeGame('Volleyball')" />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showTabletopGame" class="game-overlay">
          <TabletopGame @close-game="closeGame('Tabletop Games')" />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showGuitarStrum" class="game-overlay">
          <GuitarStrum @close="closeGame('Guitar')" />
        </div>
      </transition>

      <transition name="fade">
        <SushiRain v-if="showSushiRain" @close="closeGame('Sushi')" />
      </transition>

      <WebampPlayer :isVisible="showWebamp" @close="showWebamp = false" />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import SnowboardGame from "../components/SnowboardGame.vue";
import MountainBikeGame from "../components/MountainBikeGame.vue";
import DiscGolfGame from "../components/DiscGolfGame.vue";
import SlimeVolleyball from "../components/SlimeVolleyball.vue";
import TabletopGame from "../components/TabletopGame.vue";
import GuitarStrum from "../components/GuitarStrum.vue";
import SushiRain from "../components/SushiRain.vue";
import WebampPlayer from "../components/WebampPlayer.vue";
import BootSequence from "../components/BootSequence.vue";
import TerminalChat from "../views/TerminalChat.vue";
import { trackEvent } from "../composables/useAnalytics";

export default {
  name: "PortfolioView",
  components: {
    SnowboardGame,
    MountainBikeGame,
    DiscGolfGame,
    SlimeVolleyball,
    TabletopGame,
    GuitarStrum,
    SushiRain,
    WebampPlayer,
    BootSequence,
    TerminalChat,
  },
  emits: ["open-theme-picker"],

  setup(_, { emit }) {
    const typewriterText = ref("");
    const phrases = [
      "Director of Engineering",
      "AI Product Builder",
      "Engineering Leader",
      "Zero to One Builder",
      "Denver, Colorado",
    ];
    const activeJob = ref(null);
    const activePassion = ref(null);
    const showSnowboardGame = ref(false);
    const showMountainBikeGame = ref(false);
    const showDiscGolfGame = ref(false);
    const showVolleyballGame = ref(false);
    const showTabletopGame = ref(false);
    const showGuitarStrum = ref(false);
    const showSushiRain = ref(false);
    const showWebamp = ref(false);
    const showBoot = ref(!sessionStorage.getItem("bootComplete"));
    let typewriterTimeout = null;

    const jobHistory = [
      {
        title: "Director of Engineering",
        company: "Dropbox",
        duration: "May 2023 - Present",
        scope:
          "5 teams · Dropbox Dash AI product · $1M ARR · 300K+ enterprise accounts",
        details: [
          "Directing engineering orgs across 5 teams owning Dropbox's flagship AI product, Dash.",
          "Scaled the organization through intentional hiring and org design.",
          "Took the product from early prototype to $1M ARR with 300K+ enterprise accounts.",
          "Led the transition to agentic development with 80%+ AI-generated code across all teams.",
          "End-to-end ownership: product strategy, engineering, QA, compliance, and release management.",
          {
            isLink: true,
            url: "https://blog.dropbox.com/topics/company/dash-for-business-launch-2024",
            text: "Meet Dash for Business, AI-powered universal search for teams",
          },
        ],
      },
      {
        title: "Staff Software Engineer",
        company: "Reddit",
        duration: "Nov 2021 - May 2023",
        scope: "iOS platform tech lead for 100+ engineer consumer org",
        details: [
          "iOS platform tech lead for a 100+ engineer consumer product organization.",
          "Architected SliceKit, a declarative presentation framework adopted across Reddit iOS.",
          "Re-architected media infrastructure, reducing video playback errors by 22%.",
          {
            isLink: true,
            url: "https://www.reddit.com/r/RedditEng/comments/v3hpns/the_slicekit_series_introducing_our_new_ios/",
            text: "The SliceKit Series: Introducing Our New iOS Presentation Framework.",
          },
        ],
      },
      {
        title: "Staff Software Engineer",
        company: "Dropbox",
        duration: "Apr 2019 - Nov 2021",
        scope:
          "Led HelloSign Mobile, Dropbox Scan, File Transfers, Family Plan",
        details: [
          "Led development and launch for HelloSign Mobile, Dropbox Scan, File Transfers, and Family Plan.",
          "Defined reusable mobile architectures that became the standard for new apps at Dropbox.",
        ],
      },
      {
        title: "Senior Software Engineer",
        company: "Google",
        duration: "Jul 2016 - Apr 2019",
        scope:
          "Google Drive iOS tech lead · Material Design 2 redesign · on-device ML",
        details: [
          "Technical lead for Google Drive iOS, leading the Material Design 2 redesign and on-device ML integration.",
          "Re-architected core navigation and network layers of Google Search iOS.",
        ],
      },
      {
        title: "Software Engineer",
        company: "TrackVia & Maptext",
        duration: "2014 - 2016",
        scope: "iOS platform · mPilot IFR navigation used by 70+ airlines",
        details: [
          "iOS platform engineering at TrackVia (enterprise low-code platform).",
          "Built mPilot, an IFR navigation app used by 70+ major airlines.",
        ],
      },
    ];

    // Talks, podcasts, press, external features.
    // Add entries to make the "Talks & Press" section appear on the homepage.
    // Schema: { date: "Mar 2026", title: "...", venue: "Podcast/Conference name", url: "https://..." }
    // url is optional; if omitted the title renders as plain text.
    const talks = [];

    const featuredPosts = [
      {
        slug: "the-manager-layer-is-next",
        title: "The Manager Layer is Next",
        date: "May 2026",
        description:
          "AI isn't replacing managers. It's exposing which ones were never load-bearing to begin with.",
      },
      {
        slug: "tokenmaxxing-is-what-happens-when-you-measure-ai-adoption-wrong",
        title: "Tokenmaxxing Is What Happens When You Measure Wrong",
        date: "May 2026",
        description:
          "Mandating AI tool usage is correct. Measuring it is a trap. The right move is to measure outcomes, not inputs.",
      },
    ];

    const passions = [
      { name: "Snowboarding", icon: "fas fa-snowboarding", action: "game" },
      {
        name: "Mountain Biking",
        icon: "fas fa-biking",
        action: "game",
        links: [
          {
            label: "Strava",
            url: "https://www.strava.com/athletes/17328901",
          },
        ],
      },
      { name: "Disc Golf", icon: "fas fa-compact-disc", action: "game" },
      { name: "Volleyball", icon: "fas fa-volleyball-ball", action: "game" },
      { name: "DJing", icon: "fas fa-headphones-alt", action: "music" },
      { name: "Live Music", icon: "fas fa-guitar", action: "guitar" },
      { name: "Food", icon: "fas fa-utensils", action: "sushi" },
      {
        name: "Tabletop Games",
        icon: "fas fa-dice-d20",
        action: "game",
      },
      {
        name: "Photography",
        icon: "fas fa-camera",
        action: "link",
        url: "https://www.instagram.com/jads.pics/",
      },
      {
        name: "Travel",
        icon: "fas fa-plane",
        action: "link",
        url: "https://www.youtube.com/watch?v=oejb-Y3TIRY",
      },
    ];

    const typeWriter = () => {
      let currentPhraseIndex = 0;
      let currentCharIndex = 0;
      let isDeleting = false;

      const type = () => {
        const currentPhrase = phrases[currentPhraseIndex];

        if (isDeleting) {
          typewriterText.value = currentPhrase.substring(
            0,
            currentCharIndex - 1
          );
          currentCharIndex--;
        } else {
          typewriterText.value = currentPhrase.substring(
            0,
            currentCharIndex + 1
          );
          currentCharIndex++;
        }

        if (!isDeleting && currentCharIndex === currentPhrase.length) {
          isDeleting = true;
          typewriterTimeout = setTimeout(type, 2000);
        } else if (isDeleting && currentCharIndex === 0) {
          isDeleting = false;
          currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
          typewriterTimeout = setTimeout(type, 500);
        } else {
          typewriterTimeout = setTimeout(type, isDeleting ? 50 : 100);
        }
      };

      type();
    };

    onUnmounted(() => {
      if (typewriterTimeout) clearTimeout(typewriterTimeout);
      if (sectionObserver) sectionObserver.disconnect();
    });

    const setActiveJob = (index) => {
      activeJob.value = activeJob.value === index ? null : index;
      if (activeJob.value !== null) {
        trackEvent("timeline_clicked", { company: jobHistory[index].company });
      }
    };

    const activatePassion = (index) => {
      activePassion.value = index;
    };

    const deactivatePassion = () => {
      activePassion.value = null;
    };

    const glitchEffect = (event) => {
      event.target.classList.add("glitch");
      setTimeout(() => {
        event.target.classList.remove("glitch");
      }, 500);
    };

    const navigateTo = (section) => {
      trackEvent("section_navigated", { section });
      document.getElementById(section).scrollIntoView({ behavior: "smooth" });
    };

    let gameOpenedAt = null;

    const onBootComplete = () => {
      showBoot.value = false;
      trackEvent("boot_completed");
      nextTick(setupSectionObserver);
    };

    const gameRefMap = {
      Snowboarding: showSnowboardGame,
      "Mountain Biking": showMountainBikeGame,
      "Disc Golf": showDiscGolfGame,
      Volleyball: showVolleyballGame,
      "Tabletop Games": showTabletopGame,
      Guitar: showGuitarStrum,
      Sushi: showSushiRain,
    };

    const closeGame = (game) => {
      const gameRef = gameRefMap[game];
      if (gameRef) gameRef.value = false;
      const duration = gameOpenedAt
        ? Math.round((Date.now() - gameOpenedAt) / 1000)
        : 0;
      gameOpenedAt = null;
      trackEvent("game_closed", { game, duration_seconds: duration });
    };

    const activatePassionFeature = (index) => {
      const passion = passions[index];
      if (!passion) return;
      if (passion.action === "link" && passion.url) {
        trackEvent("outbound_link_clicked", {
          destination: `passion:${passion.name}`,
        });
        window.open(passion.url, "_blank", "noopener,noreferrer");
        return;
      }
      gameOpenedAt = Date.now();
      trackEvent("game_opened", { game: passion.name || passion.action });
      if (passion.name === "Snowboarding") showSnowboardGame.value = true;
      else if (passion.name === "Mountain Biking")
        showMountainBikeGame.value = true;
      else if (passion.name === "Disc Golf") showDiscGolfGame.value = true;
      else if (passion.name === "Volleyball") showVolleyballGame.value = true;
      else if (passion.name === "Tabletop Games") showTabletopGame.value = true;
      else if (passion.action === "music") showWebamp.value = true;
      else if (passion.action === "guitar") showGuitarStrum.value = true;
      else if (passion.action === "sushi") showSushiRain.value = true;
    };

    const toggleWebamp = () => {
      if (!showWebamp.value) trackEvent("webamp_opened");
      showWebamp.value = !showWebamp.value;
    };

    const openThemePicker = () => {
      emit("open-theme-picker");
    };

    const handleWidgetLaunch = (type) => {
      const widgetMap = {
        snowboard: showSnowboardGame,
        bike: showMountainBikeGame,
        discgolf: showDiscGolfGame,
        volleyball: showVolleyballGame,
        tabletop: showTabletopGame,
        guitar: showGuitarStrum,
        sushi: showSushiRain,
        webamp: showWebamp,
      };
      const target = widgetMap[type];
      if (target) target.value = true;
    };

    const seenSections = new Set();
    let sectionObserver = null;

    function setupSectionObserver() {
      const sections = document.querySelectorAll("main > section[id]");
      if (!sections.length) return;
      sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !seenSections.has(entry.target.id)) {
              seenSections.add(entry.target.id);
              trackEvent("section_viewed", { section: entry.target.id });
            }
          });
        },
        { threshold: 0.3 }
      );
      sections.forEach((s) => sectionObserver.observe(s));
    }

    onMounted(() => {
      if (!showBoot.value) {
        typeWriter();
        nextTick(setupSectionObserver);
      }
    });

    return {
      typewriterText,
      jobHistory,
      passions,
      featuredPosts,
      talks,
      activeJob,
      activePassion,
      showSnowboardGame,
      showMountainBikeGame,
      showDiscGolfGame,
      showVolleyballGame,
      showTabletopGame,
      showGuitarStrum,
      showSushiRain,
      showWebamp,
      showBoot,
      setActiveJob,
      activatePassion,
      deactivatePassion,
      glitchEffect,
      navigateTo,
      activatePassionFeature,
      toggleWebamp,
      openThemePicker,
      handleWidgetLaunch,
      typeWriter,
      onBootComplete,
      closeGame,
      trackEvent,
    };
  },

  watch: {
    showBoot(val) {
      if (!val) {
        this.typeWriter();
      }
    },
  },
};
</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-primary);
}

.header-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

nav {
  margin-left: 20px;
}

nav a,
nav .nav-link {
  margin-left: 20px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: bold;
  transition: all 0.3s ease;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 5px;
}

nav a:hover,
nav .nav-link:hover {
  color: var(--btn-hover-text);
  background-color: var(--btn-hover-bg);
  border-color: var(--border-primary);
}

.music-button {
  background-color: var(--btn-bg);
  border: 2px solid var(--border-primary);
  color: var(--text-primary);
  padding: 10px;
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-family);
}

.music-button:hover,
.music-button.active {
  background-color: var(--btn-hover-bg);
  color: var(--btn-hover-text);
}

h1,
h2 {
  font-weight: 700;
  text-transform: uppercase;
  text-shadow: 0 0 10px var(--border-glow);
}

.hero {
  display: flex;
  align-items: flex-start;
  gap: 30px;
  margin: 20px 0 30px;
}

.hero-photo {
  flex-shrink: 0;
}

.profile-photo {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 2px solid var(--border-primary);
  box-shadow: 0 0 20px var(--border-glow);
  filter: saturate(0.7) brightness(1.1);
  transition: all 0.3s ease;
}

.profile-photo:hover {
  filter: saturate(1) brightness(1.2);
  box-shadow: 0 0 30px var(--border-glow);
}

.hero-text {
  flex: 1;
}

.typing-animation {
  font-size: clamp(1.1em, 4.5vw, 1.5em);
  margin: 0 0 15px;
  min-height: 1.6em;
}

.typewriter-line {
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.hero-summary {
  font-size: 1.05em;
  line-height: 1.7;
  margin: 0 0 15px;
  opacity: 0.9;
}

.hero-links {
  display: flex;
  gap: 15px;
}

.hero-stats {
  list-style: none;
  display: flex;
  gap: 0;
  padding: 18px 0;
  margin: 25px 0 30px;
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: 0 0 12px var(--border-glow);
}

.hero-stats li {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 12px;
  position: relative;
}

.hero-stats li + li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10%;
  height: 80%;
  width: 1px;
  background: var(--border-primary);
  opacity: 0.6;
}

.hero-stats .stat-value {
  font-size: 1.8em;
  font-weight: bold;
  color: var(--text-primary);
  text-shadow: 0 0 10px var(--border-glow);
  line-height: 1.1;
}

.hero-stats .stat-label {
  font-size: 0.78em;
  opacity: 0.75;
  margin-top: 6px;
  letter-spacing: 0.02em;
}

@media (max-width: 560px) {
  .hero-stats {
    flex-direction: column;
    gap: 14px;
    padding: 18px 12px;
  }
  .hero-stats li + li::before {
    left: 10%;
    right: 10%;
    width: auto;
    height: 1px;
    top: -7px;
  }
  .hero-stats .stat-value {
    font-size: 1.6em;
  }
}

.featured-writing {
  margin: 30px 0;
}

.featured-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.featured-header h2 {
  margin: 0;
}

.featured-all {
  font-size: 0.9em;
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.featured-all:hover {
  border-bottom-color: var(--link-color);
  text-shadow: 0 0 5px var(--border-glow);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.featured-card {
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  box-shadow: 0 0 6px var(--border-glow);
}

.featured-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 18px var(--border-glow);
  border-color: var(--link-color);
}

.featured-date {
  font-size: 0.78em;
  opacity: 0.7;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.featured-title {
  font-size: 1.15em;
  margin: 8px 0 10px;
  color: var(--text-primary);
  text-shadow: 0 0 6px var(--border-glow);
}

.featured-desc {
  margin: 0 0 14px;
  font-size: 0.95em;
  line-height: 1.55;
  opacity: 0.88;
  flex: 1;
}

.featured-read {
  font-size: 0.85em;
  color: var(--link-color);
  letter-spacing: 0.02em;
  align-self: flex-start;
}

@media (max-width: 760px) {
  .featured-grid {
    grid-template-columns: 1fr;
  }
}

.contact-link {
  color: var(--link-color);
  border: 1px solid var(--link-color);
  padding: 6px 14px;
  font-family: var(--font-family);
  font-size: 0.85em;
  transition: all 0.3s ease;
  text-decoration: none;
}

.contact-link:hover {
  background: var(--link-color);
  color: var(--bg-primary);
}

.contact-link i {
  margin-right: 6px;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.about-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.about-block {
  padding: 20px;
  border: 1px solid var(--border-primary);
  animation: glow-pulse 3s ease-in-out infinite;
}

.about-block h3 {
  margin: 0 0 12px 0;
  text-transform: uppercase;
  font-size: 0.95em;
  color: var(--text-accent);
  text-shadow: 0 0 8px var(--border-glow);
}

.about-block ul {
  margin: 0;
  padding-left: 18px;
  list-style: none;
}

.about-block li {
  position: relative;
  padding-left: 0;
  margin-bottom: 8px;
  font-size: 0.9em;
  line-height: 1.5;
}

.about-block li::before {
  content: ">";
  position: absolute;
  left: -18px;
  color: var(--text-primary);
  opacity: 0.6;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero-links {
    justify-content: center;
  }

  .about-details {
    grid-template-columns: 1fr;
  }
}

.timeline {
  position: relative;
  padding: 20px 0;
}

.timeline-item {
  padding: 20px;
  border: 1px solid var(--border-primary);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: glow-pulse 3s ease-in-out infinite;
}

.timeline-item:hover,
.timeline-item.active {
  background-color: var(--bg-secondary);
}

.timeline-item h3 {
  margin: 0;
}

.timeline-meta {
  margin: 4px 0 0;
}

.timeline-scope {
  margin: 6px 0 0;
  font-size: 0.92em;
  opacity: 0.78;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.timeline-content a {
  color: var(--link-color);
  border-bottom: 1px solid var(--link-color);
  transition: all 0.3s ease;
}

.timeline-content a:hover {
  color: var(--link-hover);
  border-bottom-color: var(--link-hover);
  text-shadow: 0 0 5px var(--border-glow);
}

@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 5px var(--border-glow), inset 0 0 5px var(--bg-overlay);
  }
  50% {
    box-shadow: 0 0 15px var(--border-glow), 0 0 30px var(--bg-overlay),
      inset 0 0 10px var(--bg-overlay);
  }
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.education {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid var(--border-primary);
  animation: glow-pulse 3s ease-in-out infinite;
}

.education h3 {
  margin: 0 0 10px 0;
  text-transform: uppercase;
}

.passions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

#talks {
  margin-top: 50px;
}

.talks-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.talk-item {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 16px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-primary);
}

.talk-item:last-child {
  border-bottom: none;
}

.talk-date {
  font-size: 0.82em;
  opacity: 0.65;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.talk-title {
  color: var(--text-primary);
  text-decoration: none;
  border-bottom: 1px dotted transparent;
  transition: all 0.3s ease;
}

a.talk-title:hover {
  color: var(--link-hover);
  border-bottom-color: var(--link-hover);
  text-shadow: 0 0 5px var(--border-glow);
}

.talk-venue {
  display: block;
  font-size: 0.85em;
  opacity: 0.7;
  margin-top: 2px;
}

@media (max-width: 560px) {
  .talk-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.passions-description {
  margin-top: 20px;
  font-size: 0.9em;
  color: var(--text-secondary);
  text-align: center;
}

.passion-item {
  text-align: center;
  padding: 20px 10px;
  border: 1px solid var(--border-primary);
  transition: all 0.3s ease;
  animation: glow-pulse 3s ease-in-out infinite;
  position: relative;
}

.passion-item.clickable {
  cursor: pointer;
}

.passion-item.clickable:hover {
  background-color: var(--bg-secondary);
}

.play-hint {
  display: inline-block;
  font-size: 0.62em;
  opacity: 0.55;
  color: var(--text-accent);
  margin-top: 8px;
  padding: 2px 7px;
  border: 1px solid var(--text-accent);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: opacity 0.3s ease;
}

.play-hint.link-hint {
  color: var(--link-color);
  border-color: var(--link-color);
}

.passion-item.clickable:hover .play-hint {
  opacity: 1;
}

.passion-links {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.passion-link {
  display: inline-block;
  min-height: 28px;
  line-height: 28px;
  padding: 4px 10px;
  font-size: 0.72em;
  text-decoration: none;
  color: var(--link-color);
  border: 1px dotted var(--link-color);
  letter-spacing: 0.04em;
  transition: all 0.3s ease;
}

.passion-link:hover {
  color: var(--link-hover);
  border-color: var(--link-hover);
  text-shadow: 0 0 5px var(--border-glow);
}

.passion-item h3 {
  font-size: 0.85em;
  margin: 0;
}

.passion-icon {
  font-size: 2.5em;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.passion-icon.active {
  transform: scale(1.15);
  color: var(--text-accent);
  text-shadow: 0 0 15px var(--border-glow);
}

footer {
  margin-top: 50px;
  text-align: center;
  font-size: 0.9em;
  border-top: 1px solid var(--border-primary);
  padding-top: 20px;
}

.game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
}

@keyframes glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-5px, 5px);
  }
  40% {
    transform: translate(-5px, -5px);
  }
  60% {
    transform: translate(5px, 5px);
  }
  80% {
    transform: translate(5px, -5px);
  }
  100% {
    transform: translate(0);
  }
}

.glitch {
  animation: glitch 0.5s linear;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  header {
    flex-direction: column;
    gap: 15px;
  }

  .header-content {
    flex-direction: column;
    gap: 10px;
  }

  nav {
    margin-left: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  nav a,
  nav .nav-link {
    margin-left: 0;
  }

  .passions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .terminal-section {
    padding: 20px 0 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .timeline-item,
  .passion-item,
  .education {
    animation: none;
  }

  .cursor {
    animation: none;
    opacity: 1;
  }

  .glitch {
    animation: none;
  }
}

.terminal-section {
  padding: 40px 0 50px;
}

.terminal-section h2 {
  text-align: center;
  margin-bottom: 5px;
}

.terminal-section .section-subtitle {
  text-align: center;
  opacity: 0.6;
  margin-bottom: 20px;
  font-size: 0.9em;
}
</style>
