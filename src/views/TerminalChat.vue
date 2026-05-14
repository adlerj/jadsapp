<template>
  <div class="terminal-chat">
    <header class="chat-header">
      <div class="header-left">
        <h1>SOLARIS TERMINAL</h1>
        <span class="version">v2.0</span>
      </div>
      <div class="header-right">
        <button @click="resetChat" class="header-btn" aria-label="Clear chat">
          CLEAR
        </button>
        <router-link to="/" class="header-btn">BACK</router-link>
      </div>
    </header>

    <div class="terminal-body" ref="terminalBody">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-section">
        <p class="system-line">&gt; INITIALIZING NEURAL CORE...</p>
        <p class="system-line">&gt; MODEL: {{ modelName }}</p>
        <div class="progress-bar">
          <p class="system-line">
            &gt; DOWNLOADING: [{{ progressBar }}] {{ loadingPercent }}%
          </p>
        </div>
        <p class="system-line status-text">&gt; {{ loadingProgress }}</p>
      </div>

      <!-- WebGPU Not Supported -->
      <div v-else-if="error === 'NO_WEBGPU'" class="error-section">
        <p class="system-line error">&gt; ERROR: WebGPU NOT AVAILABLE</p>
        <p class="system-line">&gt; This terminal requires WebGPU support.</p>
        <p class="system-line">&gt; Recommended: Chrome 113+, Edge 113+</p>
        <div class="fallback-faq">
          <p class="system-line">&gt; LOADING STATIC BRIEFING...</p>
          <br />
          <p class="faq-item">
            <strong>Q: Who is Jeff Adler?</strong><br />
            A: Director of Engineering at Dropbox, leading the AI Experiences
            org (30+ engineers). Previously Staff Engineer at Reddit and Google.
          </p>
          <p class="faq-item">
            <strong>Q: What is Dash?</strong><br />
            A: Dropbox's flagship AI product — universal search across SaaS
            tools. Hit $1M ARR in year one, used by 300K+ Teams accounts.
          </p>
          <p class="faq-item">
            <strong>Q: What are his interests?</strong><br />
            A: Snowboarding, mountain biking, disc golf, and live music. Based
            in Denver, CO.
          </p>
          <p class="faq-item">
            <strong>Q: Technical expertise?</strong><br />
            A: AI/ML (RAG, agentic systems), full-stack client platforms (iOS,
            Android, web, desktop), engineering leadership, and infrastructure.
          </p>
        </div>
      </div>

      <!-- Load Failed -->
      <div v-else-if="error === 'LOAD_FAILED'" class="error-section">
        <p class="system-line error">&gt; ERROR: MODEL LOAD FAILED</p>
        <p class="system-line">&gt; {{ loadingProgress }}</p>
        <button @click="retryLoad" class="retry-btn">RETRY</button>
      </div>

      <!-- Chat Messages -->
      <div v-else-if="isReady" class="messages">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="message"
          :class="msg.role"
        >
          <span class="prompt-prefix"
            >{{ msg.role === "user" ? "USER" : "SOLARIS" }}&gt;
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
    <div class="input-section" v-if="isReady && !error">
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
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useWebLLM } from "../composables/useWebLLM";

export default {
  name: "TerminalChat",

  setup() {
    const {
      messages,
      isLoading,
      isReady,
      loadingProgress,
      loadingPercent,
      error,
      isGenerating,
      initialize,
      sendMessage,
      reset,
    } = useWebLLM();

    const userInput = ref("");
    const terminalBody = ref(null);
    const inputField = ref(null);
    const modelName = "Llama-3.2-1B-Instruct";

    const progressBar = computed(() => {
      const filled = Math.floor(loadingPercent.value / 5);
      const empty = 20 - filled;
      return "■".repeat(filled) + "·".repeat(empty);
    });

    const handleSend = () => {
      const msg = userInput.value.trim();
      if (!msg || isGenerating.value) return;
      userInput.value = "";
      sendMessage(msg);
    };

    const resetChat = () => {
      reset();
    };

    const retryLoad = () => {
      error.value = null;
      initialize();
    };

    const formatMessage = (content) => {
      return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (terminalBody.value) {
          terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
        }
      });
    };

    watch(messages, scrollToBottom, { deep: true });
    watch(isReady, (ready) => {
      if (ready) {
        nextTick(() => inputField.value?.focus());
      }
    });

    onMounted(() => {
      initialize();
    });

    return {
      messages,
      isLoading,
      isReady,
      loadingProgress,
      loadingPercent,
      error,
      isGenerating,
      userInput,
      terminalBody,
      inputField,
      modelName,
      progressBar,
      handleSend,
      resetChat,
      retryLoad,
      formatMessage,
    };
  },
};
</script>

<style scoped>
.terminal-chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  max-width: 900px;
  margin: 0 auto;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #00ff00;
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
  text-shadow: 0 0 10px #00ff00, 0 0 20px rgba(0, 255, 0, 0.5);
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
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 5px 12px;
  font-family: "Courier New", monospace;
  font-size: 0.85em;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background: #00ff00;
  color: #001100;
  border-bottom: 1px solid #00ff00;
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  scroll-behavior: smooth;
}

.system-line {
  margin: 4px 0;
  font-size: 0.9em;
  opacity: 0.8;
}

.system-line.error {
  color: #ff4444;
}

.status-text {
  opacity: 0.6;
  font-size: 0.85em;
}

.progress-bar {
  margin: 8px 0;
}

.fallback-faq {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #00ff00;
}

.faq-item {
  margin: 15px 0;
  line-height: 1.5;
}

.faq-item strong {
  color: #ffff00;
}

.retry-btn {
  margin-top: 15px;
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 8px 20px;
  font-family: "Courier New", monospace;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #00ff00;
  color: #001100;
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
  color: #00ffff;
}

.message.assistant .prompt-prefix {
  color: #ffff00;
}

.message.user .message-content {
  color: #00ffff;
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
  padding: 15px 0;
  border-top: 1px solid #00ff00;
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
  color: #00ff00;
  font-family: "Courier New", monospace;
  font-size: 1em;
  outline: none;
  caret-color: #00ff00;
}

.terminal-input::placeholder {
  color: rgba(0, 255, 0, 0.3);
}

.terminal-input:disabled {
  opacity: 0.5;
}

.loading-section,
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
  .chat-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .terminal-chat {
    height: calc(100vh - 60px);
  }
}
</style>
