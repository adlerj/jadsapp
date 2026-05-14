<template>
  <div class="boot-sequence" :class="{ fading: fading }">
    <div class="boot-lines">
      <p v-for="(line, i) in visibleLines" :key="i" :class="line.class">
        {{ line.text }}
      </p>
      <span class="boot-cursor" v-if="!done">_</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  name: "BootSequence",
  emits: ["complete"],

  setup(_, { emit }) {
    const visibleLines = ref([]);
    const done = ref(false);
    const fading = ref(false);

    const bootLines = [
      { text: "", delay: 300 },
      { text: "SOLARIS OS v2.0 [BUILD 2026.05]", delay: 400 },
      { text: "═══════════════════════════════════════════", delay: 200 },
      { text: "", delay: 200 },
      { text: "BIOS CHECK.............. OK", delay: 300 },
      { text: "MEMORY TEST: 2048MB..... OK", delay: 250 },
      { text: "NETWORK: CONNECTED...... OK", delay: 300 },
      { text: "", delay: 200 },
      { text: "LOADING MODULES:", delay: 400 },
      { text: "  [■■■■■■■■■■] career", delay: 200 },
      { text: "  [■■■■■■■■■■] passions", delay: 200 },
      { text: "  [■■■■■■■■■■] games", delay: 200 },
      { text: "  [■■■■■■■■■■] music", delay: 200 },
      { text: "  [■■■■■■■■■■] terminal_ai", delay: 300 },
      { text: "", delay: 200 },
      { text: "ALL SYSTEMS OPERATIONAL.", delay: 400 },
      { text: "WELCOME, VISITOR.", class: "highlight", delay: 800 },
    ];

    onMounted(() => {
      let i = 0;
      const showNext = () => {
        if (i < bootLines.length) {
          visibleLines.value.push(bootLines[i]);
          const delay = bootLines[i].delay;
          i++;
          setTimeout(showNext, delay);
        } else {
          done.value = true;
          fading.value = true;
          sessionStorage.setItem("bootComplete", "1");
          setTimeout(() => emit("complete"), 500);
        }
      };
      showNext();
    });

    return { visibleLines, done, fading };
  },
};
</script>

<style scoped>
.boot-sequence {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  padding-top: 40px;
  transition: opacity 0.5s ease;
}

.boot-sequence.fading {
  opacity: 0;
}

.boot-lines {
  width: 100%;
}

.boot-lines p {
  margin: 2px 0;
  font-size: 0.9em;
  opacity: 0;
  animation: lineAppear 0.1s forwards;
}

.boot-lines p.highlight {
  color: #ffff00;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
}

.boot-cursor {
  animation: cursorBlink 0.6s step-end infinite;
}

@keyframes lineAppear {
  to {
    opacity: 1;
  }
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
</style>
