<template>
  <transition name="picker-fade">
    <div v-if="isOpen" class="theme-picker-overlay" @click.self="close">
      <div class="theme-picker">
        <header class="picker-header">
          <h2>Choose Your Universe</h2>
          <button @click="close" class="close-btn" aria-label="Close">
            &times;
          </button>
        </header>
        <div class="theme-grid">
          <button
            v-for="id in themeIds"
            :key="id"
            class="theme-card"
            :class="{ active: currentThemeId === id }"
            @click="selectTheme(id)"
          >
            <span class="theme-icon">{{ themes[id].icon }}</span>
            <span class="theme-name">{{ themes[id].name }}</span>
            <span class="theme-tagline">{{ themes[id].tagline }}</span>
            <span v-if="currentThemeId === id" class="active-badge"
              >Active</span
            >
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { useTheme } from "../composables/useTheme";
import { trackEvent } from "../composables/useAnalytics";

export default {
  name: "ThemePicker",
  props: {
    isOpen: { type: Boolean, default: false },
  },
  emits: ["close"],

  setup(_, { emit }) {
    const { currentThemeId, themes, themeIds, setTheme } = useTheme();

    const selectTheme = (id) => {
      trackEvent("theme_changed", { theme: id });
      setTheme(id);
    };

    const close = () => emit("close");

    return { currentThemeId, themes, themeIds, selectTheme, close };
  },
};
</script>

<style scoped>
.theme-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.theme-picker {
  background: var(--bg-primary);
  border: 2px solid var(--border-primary);
  box-shadow: 0 0 30px var(--border-glow), inset 0 0 20px var(--bg-overlay);
  padding: 30px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 15px;
}

.picker-header h2 {
  margin: 0;
  font-family: var(--font-family);
  color: var(--text-primary);
  text-shadow: 0 0 10px var(--border-glow);
  font-size: 1.3em;
}

.close-btn {
  background: transparent;
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  font-size: 1.5em;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-family: var(--font-family);
}

.close-btn:hover {
  background: var(--btn-hover-bg);
  color: var(--btn-hover-text);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 15px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  font-family: var(--font-family);
  color: var(--text-primary);
}

.theme-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 20px var(--border-glow);
}

.theme-card.active {
  border-width: 2px;
  box-shadow: 0 0 25px var(--border-glow), inset 0 0 10px var(--bg-overlay);
}

.theme-icon {
  font-size: 2em;
  margin-bottom: 4px;
}

.theme-name {
  font-weight: bold;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.theme-tagline {
  font-size: 0.7em;
  opacity: 0.7;
  text-align: center;
  font-style: italic;
  line-height: 1.3;
}

.active-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.6em;
  background: var(--btn-hover-bg);
  color: var(--btn-hover-text);
  padding: 2px 6px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.3s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .theme-grid {
    grid-template-columns: 1fr 1fr;
  }

  .theme-picker {
    padding: 20px;
  }
}
</style>
