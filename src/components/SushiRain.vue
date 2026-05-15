<template>
  <div class="sushi-rain-overlay" @click="close">
    <canvas ref="canvasRef"></canvas>
    <button class="close-btn" @click.stop="close">X</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "SushiRain",
  emits: ["close"],
  setup(props, { emit }) {
    const canvasRef = ref(null);
    let animFrame = null;
    let autoCloseTimeout = null;
    const sushiEmojis = [
      "\u{1F363}",
      "\u{1F371}",
      "\u{1F359}",
      "\u{1F35C}",
      "\u{1F35B}",
      "\u{1F364}",
      "\u{1F365}",
      "\u{1F358}",
    ];

    const particles = [];

    const initParticles = (w, h) => {
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * w,
          y: -(Math.random() * h),
          speed: 1.5 + Math.random() * 3,
          drift: (Math.random() - 0.5) * 1.2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.05,
          emoji: sushiEmojis[Math.floor(Math.random() * sushiEmojis.length)],
        });
      }
    };

    const animate = () => {
      const canvas = canvasRef.value;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const p of particles) {
        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        if (p.y > h + 40) {
          p.y = -40;
          p.x = Math.random() * w;
        }
      }

      animFrame = requestAnimationFrame(animate);
    };

    const close = () => {
      emit("close");
    };

    onMounted(() => {
      const canvas = canvasRef.value;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
      animFrame = requestAnimationFrame(animate);
      autoCloseTimeout = setTimeout(() => {
        close();
      }, 6000);
    });

    onUnmounted(() => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
    });

    return {
      canvasRef,
      close,
    };
  },
};
</script>

<style scoped>
.sushi-rain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  cursor: pointer;
}

.sushi-rain-overlay canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: 1px solid #fff;
  font-family: "Courier New", monospace;
  font-size: 18px;
  font-weight: bold;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #fff;
  color: #000;
}
</style>
