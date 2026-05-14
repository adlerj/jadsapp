<template>
  <div id="app" class="solaris-console">
    <MatrixRain />
    <router-view />
  </div>
</template>

<script>
import MatrixRain from "./components/MatrixRain.vue";

export default {
  name: "App",
  components: {
    MatrixRain,
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
  position: relative;
  animation: flicker 4s infinite;
}

.solaris-console::after {
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
  color: #00ffff;
  text-decoration: none;
  border-bottom: 1px solid #00ffff;
  transition: all 0.3s ease;
}

a.content-link:hover,
.timeline-content a:hover,
.fallback-faq a:hover {
  color: #ffff00;
  border-bottom-color: #ffff00;
  text-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
}

a {
  color: inherit;
  text-decoration: none;
}

:focus-visible {
  outline: 2px solid #00ff00;
  outline-offset: 2px;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #001100;
}

::-webkit-scrollbar-thumb {
  background: #004400;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #00ff00;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #004400 #001100;
}

@media (prefers-reduced-motion: reduce) {
  .solaris-console {
    animation: none;
  }

  .solaris-console::after {
    display: none;
  }
}
</style>
