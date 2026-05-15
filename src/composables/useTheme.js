import { ref, watch, computed } from "vue";
import { THEMES, DEFAULT_THEME, THEME_IDS } from "../themes";

const currentThemeId = ref(
  localStorage.getItem("portfolio-theme") || DEFAULT_THEME
);

const currentTheme = computed(
  () => THEMES[currentThemeId.value] || THEMES[DEFAULT_THEME]
);

function applyTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  root.style.setProperty("--font-family", theme.font);
  root.setAttribute("data-theme", themeId);
}

function setTheme(themeId) {
  if (!THEMES[themeId]) return false;
  currentThemeId.value = themeId;
  localStorage.setItem("portfolio-theme", themeId);
  applyTheme(themeId);
  return true;
}

function initTheme() {
  applyTheme(currentThemeId.value);
}

watch(currentThemeId, (id) => applyTheme(id));

export function useTheme() {
  return {
    currentThemeId,
    currentTheme,
    themes: THEMES,
    themeIds: THEME_IDS,
    setTheme,
    initTheme,
  };
}
