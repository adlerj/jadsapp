<template>
  <div class="theme-bg">
    <MatrixRain v-if="effects.matrixRain" />
    <canvas
      v-if="effects.bgAnimation === 'rain'"
      ref="rainCanvas"
      class="bg-canvas"
    ></canvas>
    <canvas
      v-if="effects.bgAnimation === 'grid'"
      ref="gridCanvas"
      class="bg-canvas"
    ></canvas>
    <canvas
      v-if="effects.bgAnimation === 'stars'"
      ref="starsCanvas"
      class="bg-canvas"
    ></canvas>
    <canvas
      v-if="effects.bgAnimation === 'sparkles'"
      ref="sparklesCanvas"
      class="bg-canvas"
    ></canvas>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useTheme } from "../composables/useTheme";
import MatrixRain from "./MatrixRain.vue";

export default {
  name: "ThemeBackground",
  components: { MatrixRain },

  setup() {
    const { currentTheme } = useTheme();
    const effects = computed(() => currentTheme.value.effects);

    const rainCanvas = ref(null);
    const gridCanvas = ref(null);
    const starsCanvas = ref(null);
    const sparklesCanvas = ref(null);
    let animationId = null;
    let resizeHandler = null;

    const stopAnimation = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const startRain = () => {
      const canvas = rainCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const drops = [];
      for (let i = 0; i < 150; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 2 + Math.random() * 5,
          length: 10 + Math.random() * 30,
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(110, 160, 255, 0.3)";
        ctx.lineWidth = 1;

        for (const drop of drops) {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + 0.5, drop.y + drop.length);
          ctx.stroke();

          drop.y += drop.speed;
          if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
          }
        }
        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    const startGrid = () => {
      const canvas = gridCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      let offset = 0;
      const spacing = 60;

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(111, 239, 255, 0.06)";
        ctx.lineWidth = 1;

        for (
          let x = (offset % spacing) - spacing;
          x < canvas.width;
          x += spacing
        ) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        for (
          let y = (offset % spacing) - spacing;
          y < canvas.height;
          y += spacing
        ) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Pulse at intersections
        const pulseAlpha = 0.15 + 0.1 * Math.sin(offset * 0.02);
        ctx.fillStyle = `rgba(111, 239, 255, ${pulseAlpha})`;
        for (
          let x = (offset % spacing) - spacing;
          x < canvas.width;
          x += spacing
        ) {
          for (
            let y = (offset % spacing) - spacing;
            y < canvas.height;
            y += spacing
          ) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        offset += 0.3;
        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    const startStars = () => {
      const canvas = starsCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          twinkleSpeed: 0.005 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
        });
      }

      let time = 0;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const star of stars) {
          const alpha =
            0.3 +
            0.7 * Math.abs(Math.sin(time * star.twinkleSpeed + star.phase));
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        time++;
        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    const startSparkles = () => {
      const canvas = sparklesCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const sparkles = [];
      for (let i = 0; i < 80; i++) {
        sparkles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 1 + Math.random() * 3,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: -0.3 - Math.random() * 0.7,
          life: Math.random() * 100,
          maxLife: 60 + Math.random() * 80,
          hue: Math.random() > 0.5 ? 300 : 180,
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const s of sparkles) {
          s.life++;
          if (s.life > s.maxLife) {
            s.x = Math.random() * canvas.width;
            s.y = canvas.height + 10;
            s.life = 0;
          }

          s.x += s.speedX;
          s.y += s.speedY;

          const alpha = 1 - s.life / s.maxLife;
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.life * 0.05);

          ctx.fillStyle = `hsla(${s.hue}, 100%, 70%, ${alpha})`;
          // Draw a 4-point star
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(angle) * s.size, Math.sin(angle) * s.size);
            const midAngle = angle + Math.PI / 4;
            ctx.lineTo(
              Math.cos(midAngle) * s.size * 0.3,
              Math.sin(midAngle) * s.size * 0.3
            );
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    const startCurrentAnimation = () => {
      stopAnimation();
      const anim = effects.value.bgAnimation;
      if (anim === "rain") setTimeout(startRain, 50);
      else if (anim === "grid") setTimeout(startGrid, 50);
      else if (anim === "stars") setTimeout(startStars, 50);
      else if (anim === "sparkles") setTimeout(startSparkles, 50);
    };

    watch(() => effects.value.bgAnimation, startCurrentAnimation);

    onMounted(() => {
      startCurrentAnimation();
      resizeHandler = () => {
        startCurrentAnimation();
      };
      window.addEventListener("resize", resizeHandler);
    });

    onUnmounted(() => {
      stopAnimation();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    });

    return { effects, rainCanvas, gridCanvas, starsCanvas, sparklesCanvas };
  },
};
</script>

<style scoped>
.theme-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  .bg-canvas {
    display: none;
  }
}
</style>
