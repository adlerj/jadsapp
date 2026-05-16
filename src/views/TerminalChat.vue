<template>
  <div :class="inline ? 'terminal-inline' : 'terminal-page'">
    <div class="terminal-window">
      <header class="chat-header">
        <div class="header-left">
          <h1>JADBOT TERMINAL</h1>
          <span class="version">v4.0</span>
        </div>
        <div class="header-right">
          <button @click="resetChat" class="header-btn" aria-label="Clear chat">
            CLEAR
          </button>
          <router-link v-if="!inline" to="/" class="header-btn"
            >BACK</router-link
          >
        </div>
      </header>

      <div class="terminal-body" ref="terminalBody">
        <!-- Error -->
        <div v-if="error" class="error-section">
          <p class="system-line error">&gt; ERROR: CONNECTION FAILED</p>
          <p class="system-line">&gt; {{ error }}</p>
        </div>

        <!-- Chat Messages -->
        <div v-else class="messages">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="message"
            :class="msg.role"
          >
            <span class="prompt-prefix"
              >{{ msg.role === "user" ? "USER" : "JADBOT" }}&gt;
            </span>
            <span
              class="message-content"
              v-html="formatMessage(msg.content)"
            ></span>
          </div>
          <div v-if="isGenerating" class="generating">
            <span class="cursor-blink">_</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-section" v-if="!error">
        <span class="input-prompt">&gt;</span>
        <input
          ref="inputField"
          v-model="userInput"
          @keydown.enter="handleSend"
          :disabled="isGenerating"
          placeholder="Ask about Jeff..."
          class="terminal-input"
          autofocus
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch, onMounted, onUnmounted } from "vue";
import { marked } from "marked";
import { useChat } from "../composables/useChat";
import { useTheme } from "../composables/useTheme";
import { WIDGET_CATALOG } from "../constants/widgets";
import { trackEvent } from "../composables/useAnalytics";

export default {
  name: "TerminalChat",
  props: {
    inline: { type: Boolean, default: false },
  },
  emits: ["launch-widget"],

  setup(props, { emit }) {
    const { messages, isReady, error, isGenerating, sendMessage, reset } =
      useChat();
    const { setTheme, themes } = useTheme();

    const userInput = ref("");
    const terminalBody = ref(null);
    const inputField = ref(null);

    const handleSend = () => {
      const msg = userInput.value.trim();
      if (!msg || isGenerating.value) return;
      trackEvent("jadbot_message");
      userInput.value = "";
      sendMessage(msg);
      nextTick(() => inputField.value?.focus());
    };

    const resetChat = () => {
      trackEvent("jadbot_chat_cleared");
      reset();
    };

    const renderer = new marked.Renderer();
    renderer.link = ({ href, text }) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

    marked.setOptions({
      breaks: true,
      gfm: true,
      renderer,
    });

    const formatMessage = (content) => {
      if (!content) return "";
      let text = content;
      if (isGenerating.value) {
        text = text.replace(/\[WIDGET:[^\]]*$/, "");
        text = text.replace(/\[THEME:[^\]]*$/, "");
      }
      text = text.replace(/\[WIDGET:(\w+)\]/g, (_, type) => {
        const w = WIDGET_CATALOG[type];
        if (!w) return "";
        return `<button class="widget-btn" data-widget="${type}">${w.icon} ${w.label}</button>`;
      });
      text = text.replace(/\[THEME:(\w+)\]/g, (_, id) => {
        const t = themes[id];
        if (!t) return "";
        return `<button class="widget-btn theme-btn" data-theme="${id}">${t.icon} Switch to ${t.name}</button>`;
      });
      return marked.parse(text);
    };

    const handleInteraction = (e) => {
      const widgetBtn = e.target.closest("[data-widget]");
      if (widgetBtn) {
        trackEvent("jadbot_widget_clicked", {
          widget: widgetBtn.dataset.widget,
        });
        emit("launch-widget", widgetBtn.dataset.widget);
        return;
      }
      const themeBtn = e.target.closest("[data-theme]");
      if (themeBtn) {
        trackEvent("jadbot_theme_clicked", { theme: themeBtn.dataset.theme });
        setTheme(themeBtn.dataset.theme);
      }
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (terminalBody.value) {
          terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
        }
      });
    };

    watch(messages, scrollToBottom, { deep: true });
    watch(isGenerating, (generating) => {
      if (!generating) {
        nextTick(() => inputField.value?.focus());
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          const themeMatch = lastMsg.content.match(/\[THEME:(\w+)\]/);
          if (themeMatch) setTheme(themeMatch[1]);
        }
      }
    });

    onMounted(() => {
      nextTick(() => inputField.value?.focus());
      terminalBody.value?.addEventListener("click", handleInteraction);
    });

    onUnmounted(() => {
      terminalBody.value?.removeEventListener("click", handleInteraction);
    });

    return {
      messages,
      isReady,
      error,
      isGenerating,
      userInput,
      terminalBody,
      inputField,
      handleSend,
      resetChat,
      formatMessage,
    };
  },
};
</script>

<style scoped>
.terminal-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 40px);
  padding: 20px 0;
}

.terminal-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  max-height: calc(100vh - 80px);
  border: 1px solid var(--border-primary);
  box-shadow: 0 0 15px var(--border-glow), inset 0 0 15px var(--bg-overlay);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-overlay);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.chat-header h1 {
  font-size: 1.2em;
  margin: 0;
  text-shadow: 0 0 10px var(--border-glow);
}

.version {
  font-size: 0.8em;
  opacity: 0.6;
}

.header-right {
  display: flex;
  gap: 10px;
}

.header-btn {
  background: transparent;
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 5px 12px;
  font-family: var(--font-family);
  font-size: 0.85em;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background: var(--btn-hover-bg);
  color: var(--btn-hover-text);
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  min-height: 200px;
}

.system-line {
  margin: 4px 0;
  font-size: 0.9em;
  opacity: 0.8;
}

.system-line.error {
  color: #ff4444;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  line-height: 1.5;
  word-wrap: break-word;
}

.message .prompt-prefix {
  font-weight: bold;
}

.message.user .prompt-prefix {
  color: var(--text-accent2);
}

.message.assistant .prompt-prefix {
  color: var(--text-accent);
}

.message.user .message-content {
  color: var(--text-accent2);
}

.message-content :deep(p) {
  margin: 0 0 0.5em 0;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(strong) {
  color: var(--text-accent);
  font-weight: bold;
}

.message-content :deep(em) {
  font-style: italic;
  opacity: 0.9;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0.3em 0;
  padding-left: 1.5em;
}

.message-content :deep(li) {
  margin: 0.2em 0;
}

.message-content :deep(a) {
  color: var(--bg-primary);
  background: var(--link-color);
  padding: 4px 12px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.9em;
  border-radius: 2px;
  display: inline-block;
  margin: 4px 0;
  transition: all 0.3s ease;
}

.message-content :deep(a:hover) {
  background: var(--btn-hover-bg);
  box-shadow: 0 0 10px var(--border-glow);
}

.message-content :deep(code) {
  background: var(--bg-overlay);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3) {
  font-size: 1em;
  color: var(--text-accent);
  margin: 0.5em 0 0.3em 0;
}

.message.user .message-content :deep(strong) {
  color: var(--text-accent2);
}

.message-content :deep(.widget-btn) {
  display: inline-block;
  background: transparent;
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 8px 16px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
  font-weight: bold;
  cursor: pointer;
  margin: 8px 4px 4px 0;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.message-content :deep(.widget-btn:hover) {
  background: #00ffff;
  color: #001100;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.generating {
  padding: 5px 0;
}

.cursor-blink {
  animation: cursorBlink 0.6s step-end infinite;
  font-weight: bold;
}

@keyframes cursorBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.input-section {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-overlay);
  flex-shrink: 0;
}

.input-prompt {
  font-weight: bold;
  margin-right: 10px;
  font-size: 1.1em;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 1em;
  outline: none;
  caret-color: var(--text-primary);
}

.terminal-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.4;
}

.terminal-input:disabled {
  opacity: 0.5;
}

.error-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .terminal-page {
    padding: 0;
    align-items: stretch;
    min-height: calc(100vh - 40px);
  }

  .terminal-window {
    max-height: none;
    height: calc(100vh - 40px);
    border-left: none;
    border-right: none;
    box-shadow: none;
  }

  .chat-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .terminal-body {
    padding: 15px;
  }

  .input-section {
    padding: 12px 15px;
  }
}

.terminal-inline {
  width: 100%;
}

.terminal-inline .terminal-window {
  max-width: none;
  max-height: 500px;
}
</style>
