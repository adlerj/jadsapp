<template>
  <canvas ref="canvas" class="matrix-rain"></canvas>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "MatrixRain",

  setup() {
    const canvas = ref(null);
    let animationId = null;
    let resizeHandler = null;

    onMounted(() => {
      const ctx = canvas.value.getContext("2d");
      let width = (canvas.value.width = window.innerWidth);
      let height = (canvas.value.height = window.innerHeight);

      const chars =
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";
      const fontSize = 16;
      const columns = Math.floor(width / fontSize);
      const drops = Array(columns).fill(1);

      const draw = () => {
        ctx.fillStyle = "rgba(0, 17, 0, 0.08)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgba(0, 255, 0, 0.08)";
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }

        animationId = requestAnimationFrame(draw);
      };

      resizeHandler = () => {
        if (!canvas.value) return;
        width = canvas.value.width = window.innerWidth;
        height = canvas.value.height = window.innerHeight;
      };

      window.addEventListener("resize", resizeHandler);
      draw();
    });

    onUnmounted(() => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    });

    return { canvas };
  },
};
</script>

<style scoped>
.matrix-rain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  opacity: 0.35;
}

@media (prefers-reduced-motion: reduce) {
  .matrix-rain {
    display: none;
  }
}
</style>
