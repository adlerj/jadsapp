<template>
  <div
    id="app"
    class="solaris-console"
    :class="[
      themeClass,
      {
        'has-scanlines': currentTheme.effects.scanlines,
        'has-flicker': currentTheme.effects.flicker,
        'has-crt': currentTheme.effects.crt,
        'has-neon-glow': currentTheme.effects.neonGlow,
        'has-blink': currentTheme.effects.blink,
        'has-marquee': currentTheme.effects.marquee,
        'has-rainbow-headers': currentTheme.effects.rainbowHeaders,
        'has-glitter': currentTheme.effects.glitter,
      },
    ]"
    :style="cursorStyle"
  >
    <ThemeBackground />
    <router-view @open-theme-picker="showThemePicker = true" />
    <ThemePicker :isOpen="showThemePicker" @close="showThemePicker = false" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import ThemeBackground from "./components/ThemeBackground.vue";
import ThemePicker from "./components/ThemePicker.vue";
import { useTheme } from "./composables/useTheme";

export default {
  name: "App",
  components: {
    ThemeBackground,
    ThemePicker,
  },

  setup() {
    const { currentTheme, currentThemeId, initTheme } = useTheme();
    const showThemePicker = ref(false);
    const themeClass = computed(() => `theme-${currentThemeId.value}`);
    const cursorStyle = computed(() => {
      const cs = currentTheme.value.effects.cursorStyle;
      return cs ? { cursor: cs } : {};
    });

    onMounted(() => {
      initTheme();
    });

    return { currentTheme, themeClass, showThemePicker, cursorStyle };
  },
};
</script>

<style>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary, #001100);
  transition: background-color 0.5s ease;
}

.solaris-console {
  font-family: var(--font-family, "Courier New", monospace);
  color: var(--text-primary, #00ff00);
  min-height: 100vh;
  padding: 20px;
  line-height: 1.6;
  overflow-y: auto;
  box-sizing: border-box;
  position: relative;
  transition: color 0.5s ease, font-family 0.3s ease;
}

.solaris-console.has-flicker {
  animation: flicker 4s infinite;
}

.solaris-console.has-scanlines::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    rgba(0, 0, 0, 0.03) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 2;
}

@keyframes flicker {
  0%,
  100% {
    opacity: 1;
  }
  3% {
    opacity: 0.97;
  }
  6% {
    opacity: 0.99;
  }
  9% {
    opacity: 1;
  }
  50% {
    opacity: 0.98;
  }
  53% {
    opacity: 0.96;
  }
}

#app {
  max-width: 1200px;
  margin: 0 auto;
}

a.content-link,
.timeline-content a,
.fallback-faq a {
  color: var(--link-color, #00ffff);
  text-decoration: none;
  border-bottom: 1px solid var(--link-color, #00ffff);
  transition: all 0.3s ease;
}

a.content-link:hover,
.timeline-content a:hover,
.fallback-faq a:hover {
  color: var(--link-hover, #ffff00);
  border-bottom-color: var(--link-hover, #ffff00);
  text-shadow: 0 0 5px var(--border-glow, rgba(255, 255, 0, 0.5));
}

a {
  color: inherit;
  text-decoration: none;
}

:focus-visible {
  outline: 2px solid var(--border-primary, #00ff00);
  outline-offset: 2px;
  box-shadow: 0 0 10px var(--border-glow, rgba(0, 255, 0, 0.5));
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track, #001100);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #004400);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-primary, #00ff00);
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, #004400)
    var(--scrollbar-track, #001100);
}

@media (prefers-reduced-motion: reduce) {
  .solaris-console {
    animation: none;
  }

  .solaris-console.has-scanlines::after {
    display: none;
  }
}

/* ============================================
   EFFECT CLASSES
   ============================================ */

/* CRT vignette + phosphor glow */
.has-crt::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0, 0, 0, 0.5) 100%
  );
  pointer-events: none;
  z-index: 3;
}

.has-crt.has-scanlines::after {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08) 0px,
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 3px
  );
}

/* Neon glow on headings */
.has-neon-glow h1,
.has-neon-glow h2,
.has-neon-glow h3 {
  animation: neon-pulse 2s ease-in-out infinite;
}

@keyframes neon-pulse {
  0%,
  100% {
    text-shadow: 0 0 7px var(--text-accent), 0 0 20px var(--text-accent),
      0 0 40px var(--border-glow);
  }
  50% {
    text-shadow: 0 0 4px var(--text-accent), 0 0 10px var(--text-accent),
      0 0 20px var(--border-glow);
  }
}

/* Blink effect for taglines and hints */
.has-blink .version,
.has-blink .play-hint,
.has-blink .tagline {
  animation: blink-text 1s step-end infinite;
}

@keyframes blink-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Marquee scroll on footer */
.has-marquee footer::after {
  content: "";
  display: block;
  overflow: hidden;
  white-space: nowrap;
  animation: marquee-scroll 15s linear infinite;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* Rainbow gradient headers */
.has-rainbow-headers h1,
.has-rainbow-headers h2,
.has-rainbow-headers .section-title {
  background: linear-gradient(
    90deg,
    #ff0000,
    #ff8800,
    #ffff00,
    #00ff00,
    #0088ff,
    #8800ff,
    #ff0088,
    #ff0000
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: rainbow-shift 3s linear infinite;
}

@keyframes rainbow-shift {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* Glitter cursor */
.has-glitter {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ctext x='2' y='14' font-size='14'%3E✨%3C/text%3E%3C/svg%3E")
      10 10,
    auto;
}

/* ============================================
   TERMINAL THEME — Full CRT immersion
   ============================================ */
.theme-terminal {
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.4);
}

.theme-terminal h1,
.theme-terminal h2,
.theme-terminal h3 {
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.6), 0 0 20px rgba(0, 255, 0, 0.3);
}

.theme-terminal .profile-photo,
.theme-terminal .hero-photo img {
  border-color: #00ff00;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
}

.theme-terminal li::marker {
  content: "$ ";
  color: #00cc00;
}

.theme-terminal .terminal-window {
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 17, 0, 0.5);
}

/* ============================================
   BLADE RUNNER THEME — Neon noir maximalism
   ============================================ */
.theme-bladerunner h1,
.theme-bladerunner h2,
.theme-bladerunner h3 {
  text-shadow: 0 0 10px #ff6ec7, 0 0 30px #ff6ec7,
    0 0 60px rgba(255, 110, 199, 0.3);
  animation: neon-flicker-br 4s ease-in-out infinite;
}

@keyframes neon-flicker-br {
  0%,
  100% {
    opacity: 1;
    text-shadow: 0 0 10px #ff6ec7, 0 0 30px #ff6ec7,
      0 0 60px rgba(255, 110, 199, 0.3);
  }
  8% {
    opacity: 0.85;
  }
  10% {
    opacity: 1;
  }
  50% {
    text-shadow: 0 0 5px #ff6ec7, 0 0 15px #ff6ec7,
      0 0 30px rgba(255, 110, 199, 0.2);
  }
  52% {
    text-shadow: 0 0 15px #ff6ec7, 0 0 40px #ff6ec7,
      0 0 80px rgba(255, 110, 199, 0.4);
  }
  54% {
    text-shadow: 0 0 10px #ff6ec7, 0 0 30px #ff6ec7,
      0 0 60px rgba(255, 110, 199, 0.3);
  }
}

.theme-bladerunner::before {
  content: "";
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(255, 110, 199, 0.05), transparent);
  pointer-events: none;
  z-index: 1;
}

.theme-bladerunner .profile-photo,
.theme-bladerunner .hero-photo img {
  filter: saturate(0.5) contrast(1.2);
  box-shadow: 0 0 20px rgba(255, 110, 199, 0.5),
    0 0 40px rgba(255, 110, 199, 0.2);
}

.theme-bladerunner .terminal-window,
.theme-bladerunner .timeline-item,
.theme-bladerunner .passion-item,
.theme-bladerunner .about-block {
  border-color: #ff6ec7;
  box-shadow: inset 0 0 15px rgba(255, 110, 199, 0.1),
    0 0 10px rgba(255, 110, 199, 0.15);
}

.theme-bladerunner li::marker {
  content: "// ";
  color: #a090cc;
}

/* ============================================
   WINDOWS 95 THEME — Full desktop simulation
   ============================================ */
.theme-win95 {
  text-shadow: none !important;
}

.theme-win95 * {
  animation: none !important;
}

.theme-win95 .terminal-window,
.theme-win95 .timeline-item,
.theme-win95 .passion-item,
.theme-win95 .about-block,
.theme-win95 .education {
  border: 2px outset #dfdfdf;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080;
  background: #c0c0c0;
}

.theme-win95 .chat-header,
.theme-win95 .section-title {
  background: linear-gradient(90deg, #000080, #1084d0);
  color: #ffffff;
  padding: 4px 8px;
}

.theme-win95 .chat-header h1,
.theme-win95 .section-title {
  color: #ffffff;
  text-shadow: none;
  font-weight: bold;
}

.theme-win95 .header-btn,
.theme-win95 .nav-link,
.theme-win95 .header-actions button {
  border: 2px outset #dfdfdf;
  background: #c0c0c0;
  color: #000000;
  font-family: "MS Sans Serif", "Courier New", sans-serif;
}

.theme-win95 .header-btn:hover,
.theme-win95 .nav-link:hover,
.theme-win95 .header-actions button:hover {
  border-style: inset;
}

.theme-win95 .profile-photo,
.theme-win95 .hero-photo img {
  border-radius: 0;
  border: 2px inset #808080;
  box-shadow: none;
  filter: none;
}

.theme-win95 footer {
  background: #c0c0c0;
  border-top: 2px outset #dfdfdf;
  padding: 4px 8px;
}

.theme-win95 footer::before {
  content: "🪟 Start";
  display: inline-block;
  background: #c0c0c0;
  border: 2px outset #dfdfdf;
  padding: 2px 10px;
  font-weight: bold;
  font-family: "MS Sans Serif", sans-serif;
  margin-right: 10px;
  color: #000000;
}

.theme-win95::-webkit-scrollbar {
  width: 16px;
}

.theme-win95::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border: 2px outset #dfdfdf;
  border-radius: 0;
}

.theme-win95::-webkit-scrollbar-track {
  background: #808080;
}

/* ============================================
   TRON THEME — Electric grid maximalism
   ============================================ */
.theme-tron {
  letter-spacing: 1px;
}

.theme-tron h1,
.theme-tron h2,
.theme-tron h3 {
  text-shadow: 0 0 10px #6fefff, 0 0 30px rgba(111, 239, 255, 0.5);
  letter-spacing: 4px;
  text-transform: uppercase;
}

.theme-tron .terminal-window,
.theme-tron .timeline-item,
.theme-tron .passion-item,
.theme-tron .about-block {
  border-color: #6fefff;
  animation: tron-border-pulse 3s ease-in-out infinite;
}

@keyframes tron-border-pulse {
  0%,
  100% {
    border-color: rgba(111, 239, 255, 0.3);
    box-shadow: 0 0 5px rgba(111, 239, 255, 0.1);
  }
  50% {
    border-color: rgba(111, 239, 255, 0.8);
    box-shadow: 0 0 15px rgba(111, 239, 255, 0.3);
  }
}

.theme-tron .profile-photo,
.theme-tron .hero-photo img {
  clip-path: polygon(
    30% 0%,
    70% 0%,
    100% 30%,
    100% 70%,
    70% 100%,
    30% 100%,
    0% 70%,
    0% 30%
  );
  box-shadow: 0 0 20px rgba(111, 239, 255, 0.5);
  border: none;
}

.theme-tron li::marker {
  color: #ff8800;
}

.theme-tron li {
  text-shadow: none;
}

.theme-tron a.content-link,
.theme-tron .timeline-content a {
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* ============================================
   MYSPACE THEME — 2005 internet chaos
   ============================================ */
.theme-myspace h1,
.theme-myspace h2,
.theme-myspace h3 {
  font-family: "Comic Sans MS", cursive;
}

.theme-myspace header::before {
  content: "🎵 Jeff's MySpace 🎵 | 📬 Leave a Comment!";
  display: block;
  text-align: center;
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff);
  color: #000000;
  padding: 6px;
  font-weight: bold;
  font-size: 0.9em;
  margin-bottom: 10px;
  animation: rainbow-shift 3s linear infinite;
  background-size: 200% auto;
}

.theme-myspace footer::before {
  content: "🎶 Now Playing: Darude - Sandstorm 🎶";
  display: block;
  text-align: center;
  color: #00ffff;
  font-weight: bold;
  margin-bottom: 5px;
  overflow: hidden;
  white-space: nowrap;
  animation: marquee-scroll 12s linear infinite;
}

.theme-myspace .terminal-window,
.theme-myspace .timeline-item,
.theme-myspace .passion-item,
.theme-myspace .about-block {
  border: 2px dashed #ff00ff;
  border-radius: 10px;
  box-shadow: 4px 4px 0 #ff00ff, -2px -2px 0 #00ffff;
}

.theme-myspace .profile-photo,
.theme-myspace .hero-photo img {
  border-radius: 0;
  filter: contrast(1.3) saturate(1.5);
  box-shadow: 5px 5px 0 #ff00ff, -3px -3px 0 #00ffff;
  border: 3px solid #00ffff;
}

/* ============================================
   GEOCITIES THEME — 1998 homepage chaos
   ============================================ */
.theme-geocities {
  cursor: crosshair;
}

.theme-geocities h1,
.theme-geocities h2,
.theme-geocities h3 {
  font-family: "Times New Roman", serif;
  text-decoration: underline;
}

.theme-geocities .terminal-window,
.theme-geocities .timeline-item,
.theme-geocities .passion-item,
.theme-geocities .about-block,
.theme-geocities .education {
  border: 3px ridge #ffff00;
  box-shadow: none;
}

.theme-geocities footer::before {
  content: "🚧 UNDER CONSTRUCTION 🚧 | You are visitor #007,342";
  display: block;
  text-align: center;
  color: #ff0000;
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 5px;
  animation: blink-text 1.2s step-end infinite;
}

.theme-geocities footer::after {
  content: "Best viewed in Netscape Navigator 4.0 at 800×600";
  display: block;
  text-align: center;
  color: #ffcc00;
  font-size: 0.8em;
  font-style: italic;
  margin-top: 5px;
}

.theme-geocities .profile-photo,
.theme-geocities .hero-photo img {
  border-radius: 0;
  border: 4px double #ffff00;
  box-shadow: 5px 5px 0 #ff00ff;
}

.theme-geocities .nav-link,
.theme-geocities .header-btn,
.theme-geocities .header-actions button {
  border: 2px outset #0000ff;
  background: #000080;
  color: #ffff00;
  font-weight: bold;
}

.theme-geocities .nav-link:hover,
.theme-geocities .header-btn:hover,
.theme-geocities .header-actions button:hover {
  background: #ffff00;
  color: #000080;
  border-style: inset;
}

.theme-geocities li::marker {
  content: "★ ";
  color: #ffff00;
}

.theme-geocities .chat-header {
  background: #000080;
  border-bottom: 3px ridge #ffff00;
}

.theme-geocities .chat-header h1 {
  color: #ffff00;
  text-shadow: 2px 2px #ff0000;
}

.theme-geocities a.content-link,
.theme-geocities .timeline-content a {
  color: #00ff00;
  border-bottom-color: #00ff00;
  text-decoration: underline;
}
</style>
