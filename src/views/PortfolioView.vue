<template>
  <div class="portfolio">
    <BootSequence v-if="showBoot" @complete="showBoot = false" />

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
            <router-link to="/chat" class="nav-link">Terminal</router-link>
          </nav>
        </div>
        <button
          @click="toggleWebamp"
          class="music-button"
          :class="{ active: showWebamp }"
          aria-label="Toggle music player"
        >
          <i class="fas fa-music"></i>
        </button>
      </header>

      <main>
        <section id="about">
          <h2>System Info</h2>
          <div class="typing-animation">
            <h3>{{ typewriterText }}<span class="cursor">_</span></h3>
          </div>
          <p>
            Status: Directing AI Experiences at Dropbox. Building agentic
            systems. Mountain life in Colorado.
          </p>
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
                <p>{{ job.company }} | {{ job.duration }}</p>
                <ul v-if="activeJob === index">
                  <li v-for="(detail, idx) in job.details" :key="idx">
                    <span v-if="!detail.isLink">{{ detail }}</span>
                    <a v-else :href="detail.url" target="_blank">{{
                      detail.text
                    }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="education">
            <h3>Education</h3>
            <p>
              Rutgers University — B.S. Computer & Electrical Engineering, Minor
              in CS
            </p>
          </div>
        </section>

        <section id="passions">
          <h2>Personal Modules</h2>
          <div class="passions-grid">
            <div
              v-for="(passion, index) in passions"
              :key="index"
              class="passion-item"
              :style="{ animationDelay: index * 0.7 + 's' }"
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
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>
          &copy; 2026 Jeff Adler. All rights reserved. | System Version 2.0.0
        </p>
      </footer>

      <transition name="fade">
        <SnowboardGame
          v-if="showSnowboardGame"
          @close-game="showSnowboardGame = false"
        />
      </transition>

      <transition name="fade">
        <MountainBikeGame
          v-if="showMountainBikeGame"
          @close="showMountainBikeGame = false"
        />
      </transition>

      <transition name="fade">
        <DiscGolfGame
          v-if="showDiscGolfGame"
          @close-game="showDiscGolfGame = false"
        />
      </transition>

      <WebampPlayer :isVisible="showWebamp" @close="showWebamp = false" />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import SnowboardGame from "../components/SnowboardGame.vue";
import MountainBikeGame from "../components/MountainBikeGame.vue";
import DiscGolfGame from "../components/DiscGolfGame.vue";
import WebampPlayer from "../components/WebampPlayer.vue";
import BootSequence from "../components/BootSequence.vue";

export default {
  name: "PortfolioView",
  components: {
    SnowboardGame,
    MountainBikeGame,
    DiscGolfGame,
    WebampPlayer,
    BootSequence,
  },

  setup() {
    const typewriterText = ref("");
    const phrases = [
      "Director of Engineering",
      "AI Experiences Leader",
      "Agentic Systems Builder",
      "Mountain Biker",
      "Snowboarding shredder",
      "Disc golf ripper",
    ];
    const activeJob = ref(null);
    const activePassion = ref(null);
    const showSnowboardGame = ref(false);
    const showMountainBikeGame = ref(false);
    const showDiscGolfGame = ref(false);
    const showWebamp = ref(false);
    const showBoot = ref(!sessionStorage.getItem("bootComplete"));
    let typewriterTimeout = null;

    const jobHistory = [
      {
        title: "Director of Engineering, AI Experiences",
        company: "Dropbox",
        duration: "Jul 2025 - Present",
        details: [
          "Directing Dropbox's AI Experiences org — 30+ person cross-functional team spanning iOS, Android, Web, Desktop, and ML.",
          "Dash hit $1M ARR in its first year with 300K+ Dropbox Teams accounts.",
          "Converted all engineering teams to agentic development — 80%+ AI-generated code.",
          "End-to-end ownership: roadmap, engineering, QA, release, SOC 2 & HIPAA compliance.",
          {
            isLink: true,
            url: "https://blog.dropbox.com/topics/company/dash-for-business-launch-2024",
            text: "Meet Dash for Business, AI-powered universal search for teams",
          },
        ],
      },
      {
        title: "Senior Engineering Manager, AI Experiences",
        company: "Dropbox",
        duration: "Aug 2023 - Jul 2025",
        details: [
          "Founded the AI Experiences engineering organization from scratch, scaling from 6 to 30+ engineers across 5 teams.",
          "Shipped Dash for Business from pilot to GA — 20K+ self-serve users.",
          "Led multi-surface AI platform: web, desktop, mobile, browser extensions.",
          "Drove shared component architecture for Dash.ai & Desktop.",
        ],
      },
      {
        title: "Staff Software Engineer",
        company: "Dropbox",
        duration: "May 2023 - Aug 2023",
        details: [
          "IC bridge role building the initial Dash client architecture before transitioning to management.",
        ],
      },
      {
        title: "Staff Software Engineer",
        company: "Reddit, Inc.",
        duration: "Nov 2021 - May 2023",
        details: [
          "Technical lead for iOS platform supporting 100+ engineer consumer product organization.",
          "Modernized the full iOS development stack across Reddit.",
          "Architected SliceKit, a declarative MVVM-C presentation framework adopted broadly across Reddit iOS.",
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
        details: [
          "Led development and launch for HelloSign Mobile Apps, Dropbox Scan, File Transfers, Family Plan.",
          "Defined reusable mobile architectures that became the adopted standard for building new apps at Dropbox.",
        ],
      },
      {
        title: "Senior Software Engineer",
        company: "Google",
        duration: "Jul 2016 - Apr 2019",
        details: [
          "Technical lead for Google Drive iOS — Material Design 2 redesign and core ML integration.",
          "Re-architected core app navigation and network/data/view layers of Google Search iOS app.",
        ],
      },
      {
        title: "Software Engineer",
        company: "TrackVia & Maptext",
        duration: "2014 - 2016",
        details: [
          "iOS platform engineering at TrackVia (enterprise low-code platform).",
          "Built mPilot, an IFR navigation app used by Lufthansa and 70+ major airlines.",
        ],
      },
    ];

    const passions = [
      { name: "Snowboarding", icon: "fas fa-snowboarding" },
      { name: "Mountain Biking", icon: "fas fa-biking" },
      { name: "Disc Golf", icon: "fas fa-compact-disc" },
      { name: "Live Music", icon: "fas fa-music" },
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
    });

    const setActiveJob = (index) => {
      activeJob.value = activeJob.value === index ? null : index;
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
      document.getElementById(section).scrollIntoView({ behavior: "smooth" });
    };

    const activatePassionFeature = (index) => {
      if (index === 0) {
        showSnowboardGame.value = true;
      } else if (index === 1) {
        showMountainBikeGame.value = true;
      } else if (index === 2) {
        showDiscGolfGame.value = true;
      } else if (index === 3) {
        showWebamp.value = true;
      }
    };

    const toggleWebamp = () => {
      showWebamp.value = !showWebamp.value;
    };

    onMounted(() => {
      if (!showBoot.value) {
        typeWriter();
      }
    });

    return {
      typewriterText,
      jobHistory,
      passions,
      activeJob,
      activePassion,
      showSnowboardGame,
      showMountainBikeGame,
      showDiscGolfGame,
      showWebamp,
      showBoot,
      setActiveJob,
      activatePassion,
      deactivatePassion,
      glitchEffect,
      navigateTo,
      activatePassionFeature,
      toggleWebamp,
      typeWriter,
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
  border-bottom: 1px solid #00ff00;
}

.header-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

nav {
  margin-left: 20px;
}

nav a,
nav .nav-link {
  margin-left: 20px;
  text-decoration: none;
  color: #00ff00;
  font-weight: bold;
  transition: all 0.3s ease;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 5px;
}

nav a:hover,
nav .nav-link:hover {
  color: #001100;
  background-color: #00ff00;
  border-color: #00ff00;
}

.music-button {
  background-color: transparent;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 10px;
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.music-button:hover,
.music-button.active {
  background-color: #00ff00;
  color: #001100;
}

h1,
h2 {
  font-weight: 700;
  text-transform: uppercase;
  text-shadow: 0 0 10px #00ff00, 0 0 20px rgba(0, 255, 0, 0.5);
}

.typing-animation {
  font-size: 1.5em;
  margin: 20px 0;
  min-height: 1.6em;
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

.timeline {
  position: relative;
  padding: 20px 0;
}

.timeline-item {
  padding: 20px;
  border: 1px solid #00ff00;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: glow-pulse 3s ease-in-out infinite;
}

.timeline-item:hover,
.timeline-item.active {
  background-color: #002200;
}

.timeline-item h3 {
  margin: 0;
}

.timeline-content a {
  color: #00ffff;
  border-bottom: 1px solid #00ffff;
  transition: all 0.3s ease;
}

.timeline-content a:hover {
  color: #ffff00;
  border-bottom-color: #ffff00;
  text-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
}

@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.3),
      inset 0 0 5px rgba(0, 255, 0, 0.05);
  }
  50% {
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.6), 0 0 30px rgba(0, 255, 0, 0.2),
      inset 0 0 10px rgba(0, 255, 0, 0.1);
  }
}

.education {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #00ff00;
  animation: glow-pulse 3s ease-in-out infinite;
}

.education h3 {
  margin: 0 0 10px 0;
  text-transform: uppercase;
}

.passions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.passion-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #00ff00;
  transition: all 0.3s ease;
  cursor: pointer;
  animation: glow-pulse 3s ease-in-out infinite;
}

.passion-icon {
  font-size: 3em;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.passion-icon.active {
  transform: scale(1.2);
  color: #ffff00;
  text-shadow: 0 0 15px rgba(255, 255, 0, 0.7);
}

footer {
  margin-top: 50px;
  text-align: center;
  font-size: 0.9em;
  border-top: 1px solid #00ff00;
  padding-top: 20px;
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
  }

  nav a,
  nav .nav-link {
    margin-left: 10px;
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
</style>
