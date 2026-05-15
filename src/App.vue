<template>
  <div
    id="app"
    class="solaris-console"
    :class="[
      themeClass,
      {
        'has-scanlines': currentTheme.effects.scanlines,
        'has-flicker': currentTheme.effects.flicker,
      },
    ]"
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

    onMounted(() => {
      initTheme();
    });

    return { currentTheme, themeClass, showThemePicker };
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

/* Win95 theme: chunky beveled UI */
.theme-win95 .terminal-window,
.theme-win95 .timeline-item,
.theme-win95 .passion-item,
.theme-win95 .about-block,
.theme-win95 .education {
  border: 2px outset #dfdfdf;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080;
  animation: none;
}

.theme-win95 .chat-header {
  background: #000080;
  color: #ffffff;
}

.theme-win95 .chat-header h1 {
  color: #ffffff;
  text-shadow: none;
}

.theme-win95 .header-btn {
  border: 2px outset #dfdfdf;
  background: #c0c0c0;
  color: #000000;
}

.theme-win95 .header-btn:hover {
  border-style: inset;
}
</style>
