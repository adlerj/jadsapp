<template>
  <div id="app" class="solaris-console">
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
        </nav>
      </div>
      <button
        @click="toggleWebamp"
        class="music-button"
        :class="{ active: showWebamp }"
      >
        <i class="fas fa-music"></i>
      </button>
    </header>

    <main>
      <section id="about">
        <h2>System Info</h2>
        <div class="typing-animation">
          <h3>{{ typewriterText }}</h3>
        </div>
        <p>
          Status: Building AI-powered experiences and enjoying mountain life in
          Colorado.
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
            @click="setActiveJob(index)"
          >
            <div class="timeline-content">
              <h3>{{ job.title }}</h3>
              <p>{{ job.company }} | {{ job.duration }}</p>
              <ul v-if="activeJob === index">
                <li v-for="(detail, idx) in job.details" :key="idx">
                  <span v-if="!detail.isLink" v-html="detail"></span>
                  <a v-else :href="detail.url" target="_blank">{{
                    detail.text
                  }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="passions">
        <h2>Personal Modules</h2>
        <div class="passions-grid">
          <div
            v-for="(passion, index) in passions"
            :key="index"
            class="passion-item"
            @mouseover="activatePassion(index)"
            @mouseleave="deactivatePassion(index)"
            @click="activatePassionFeature(index)"
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
      <p>© 2024 Jeff Adler. All rights reserved. | System Version 1.0.0</p>
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
        @close-game="showMountainBikeGame = false"
      />
    </transition>

    <transition name="fade">
      <DiscGolfGame
        v-if="showDiscGolfGame"
        @close-game="showDiscGolfGame = false"
      />
    </transition>

    <WebampPlayer :isVisible="showWebamp" @close="showWebamp = false" />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import SnowboardGame from "./components/SnowboardGame.vue";
import MountainBikeGame from "./components/MountainBikeGame.vue";
import DiscGolfGame from "./components/DiscGolfGame.vue";
import WebampPlayer from "./components/WebampPlayer.vue";

console.log("WebampModule:", WebampPlayer);

export default {
  name: "App",
  components: {
    SnowboardGame,
    MountainBikeGame,
    DiscGolfGame,
    WebampPlayer,
  },

  setup() {
    const typewriterText = ref("");
    const phrases = [
      "Engineering Leader",
      "AI Product Innovator",
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

    const jobHistory = [
      {
        title: "Senior Engineering Manager, Dash",
        company: "Dropbox",
        duration: "May 2023 - Present",
        details: [
          "Tech lead manager bringing Dropbox Dash's new applications from 0 to 1.",
          "Leading Client Product Development across iOS, Android, MacOS, Windows, and Web Infra.",
          "Partnering closely with stakeholders and partners to deliver industry-leading AI productivity experiences.",
          "Driving the shared component architecture for Dash.ai & Desktop.",
          "Driving Search & Answers experience development.",
          {
            isLink: true,
            url: "https://blog.dropbox.com/topics/company/dash-for-business-launch-2024",
            text: "Meet Dash for Business, AI-powered universal search for teams",
          },
        ],
      },
      {
        title: "Staff Software Engineer",
        company: "Reddit, Inc.",
        duration: "Nov 2021 - May 2023",
        details: [
          "Responsible for all consumer surfaces in Reddit’s iOS app, supporting a team of 100+ iOS Devs",
          "Modernized the full iOS development stack across Reddit.",
          "Introduced the CoreStack to consolidate the many different ways features are built.",
          "Architected and led a team to build SliceKit, a declarative, unidirectional, MVVM-C UI Framework.",
          "Rearchitected media handling across our stack for better video performance.",
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
          "Led development and the launch for HelloSign Mobile Apps, Dropbox Scan, File Transfers, Family Plan, the Mobile Labs and Mobile Expansion teams.",
          "Conceptualized and strategically drove adoption of reusable app architectures which influenced company roadmaps to enable multi product development. This framework was used in mobile apps such as Passwords, Dropbox Scan, HelloSign and has become the adopted standard in EPD for building new mobile apps.",
        ],
      },
      {
        title: "Senior Software Engineer",
        company: "Google",
        duration: "Jul 2016 - Apr 2019",
        details: [
          "Led full app rearchitectures of iOS Google Search app, Google Drive App",
          "Led projects to bring ML into Google Apps",
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
          setTimeout(type, 2000); // Wait before starting to delete
        } else if (isDeleting && currentCharIndex === 0) {
          isDeleting = false;
          currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
          setTimeout(type, 500); // Wait before typing next phrase
        } else {
          setTimeout(type, isDeleting ? 50 : 100);
        }
      };

      type();
    };

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
      typeWriter();
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
      setActiveJob,
      activatePassion,
      deactivatePassion,
      glitchEffect,
      navigateTo,
      activatePassionFeature,
      toggleWebamp,
    };
  },
};
</script>

<style>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css");

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: #001100;
}

.solaris-console {
  font-family: "Courier New", monospace;
  color: #00ff00;
  min-height: 100vh;
  padding: 20px;
  line-height: 1.6;
  overflow-y: auto;
  box-sizing: border-box;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
}

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
}

nav {
  margin-left: 20px;
}

nav a {
  margin-left: 20px;
  text-decoration: none;
  color: #00ff00;
  font-weight: bold;
  transition: all 0.3s ease;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 5px;
}

nav a:hover {
  color: #001100;
  background-color: #00ff00;
  border-color: #00ff00;
}

a {
  color: #00ffff;
  text-decoration: none;
  border-bottom: 1px solid #00ffff;
  transition: all 0.3s ease;
}

a:hover {
  color: #ffff00;
  border-bottom-color: #ffff00;
  text-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
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
}

.typing-animation {
  font-size: 1.5em;
  margin: 20px 0;
  height: 1.2em;
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
}

.timeline-item:hover,
.timeline-item.active {
  background-color: #002200;
}

.timeline-item h3 {
  margin: 0;
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
}

.passion-icon {
  font-size: 3em;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.passion-icon.active {
  transform: scale(1.2);
  color: #ffff00;
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
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
