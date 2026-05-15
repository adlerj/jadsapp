<template>
  <div class="guitar-strum-wrapper">
    <canvas
      ref="canvasRef"
      @mousemove="onMouseMove"
      @touchmove.prevent="onTouchMove"
    ></canvas>
    <button class="close-btn" @click="$emit('close')">X</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "GuitarStrum",
  emits: ["close"],
  setup() {
    const canvasRef = ref(null);
    let ctx = null;
    let animFrame = null;
    let W = 800;
    let H = 500;

    const strings = [
      { label: "E", thickness: 5 },
      { label: "A", thickness: 4.2 },
      { label: "D", thickness: 3.5 },
      { label: "G", thickness: 2.8 },
      { label: "B", thickness: 2.2 },
      { label: "e", thickness: 1.8 },
    ];

    const stringStates = strings.map(() => ({
      vibrating: false,
      amplitude: 0,
      startTime: 0,
      frequency: 3 + Math.random() * 2,
    }));

    const getStringY = (index) => {
      const padding = 80;
      const spacing = (H - padding * 2) / (strings.length - 1);
      return padding + index * spacing;
    };

    // Web Audio API – lazy init to comply with autoplay policy
    let audioCtx = null;
    const getAudioCtx = () => {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    };

    const playNote = (index) => {
      const ctx = getAudioCtx();
      const frequencies = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle"; // warm guitar-like tone
      osc.frequency.value = frequencies[index];

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    };

    let lastMouseY = null;

    const checkStringCross = (currentY) => {
      if (lastMouseY === null) {
        lastMouseY = currentY;
        return;
      }
      for (let i = 0; i < strings.length; i++) {
        const sy = getStringY(i);
        if (
          (lastMouseY < sy && currentY >= sy) ||
          (lastMouseY > sy && currentY <= sy)
        ) {
          stringStates[i].vibrating = true;
          stringStates[i].amplitude = 12;
          stringStates[i].startTime = performance.now();
          playNote(i);
        }
      }
      lastMouseY = currentY;
    };

    const getCanvasY = (clientX, clientY) => {
      const rect = canvasRef.value.getBoundingClientRect();
      return ((clientY - rect.top) / rect.height) * H;
    };

    const onMouseMove = (e) => {
      const y = getCanvasY(e.clientX, e.clientY);
      checkStringCross(y);
    };

    const onTouchMove = (e) => {
      const touch = e.touches[0];
      const y = getCanvasY(touch.clientX, touch.clientY);
      checkStringCross(y);
    };

    const draw = () => {
      ctx.fillStyle = "#001100";
      ctx.fillRect(0, 0, W, H);

      // Title
      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("STRUM", W / 2, 30);

      // Instructions
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillStyle = "#007700";
      ctx.fillText("Drag across strings to play", W / 2, H - 20);

      const now = performance.now();

      for (let i = 0; i < strings.length; i++) {
        const sy = getStringY(i);
        const s = strings[i];
        const state = stringStates[i];

        // Label
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(s.label, 40, sy);

        // Decay
        let currentAmplitude = 0;
        if (state.vibrating) {
          const elapsed = (now - state.startTime) / 1000;
          const decay = Math.exp(-elapsed * 2.5);
          currentAmplitude = state.amplitude * decay;
          if (currentAmplitude < 0.1) {
            state.vibrating = false;
            currentAmplitude = 0;
          }
        }

        // Draw string
        ctx.beginPath();
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = s.thickness;

        if (currentAmplitude > 0) {
          // Glow effect
          ctx.save();
          ctx.shadowColor = "#00ff00";
          ctx.shadowBlur = 15;

          const startX = 60;
          const endX = W - 30;
          ctx.moveTo(startX, sy);
          for (let x = startX; x <= endX; x += 3) {
            const t = (x - startX) / (endX - startX);
            const envelope = Math.sin(t * Math.PI);
            const elapsed = (now - state.startTime) / 1000;
            const wave =
              Math.sin(x * 0.05 * state.frequency + elapsed * 30) *
              currentAmplitude *
              envelope;
            ctx.lineTo(x, sy + wave);
          }
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.moveTo(60, sy);
          ctx.lineTo(W - 30, sy);
          ctx.stroke();
        }
      }

      animFrame = requestAnimationFrame(draw);
    };

    onMounted(() => {
      const canvas = canvasRef.value;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      animFrame = requestAnimationFrame(draw);
    });

    onUnmounted(() => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (audioCtx) audioCtx.close();
    });

    return {
      canvasRef,
      onMouseMove,
      onTouchMove,
    };
  },
};
</script>

<style scoped>
.guitar-strum-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #001100;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.guitar-strum-wrapper canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  cursor: pointer;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: "Courier New", monospace;
  font-size: 16px;
  font-weight: bold;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-btn:hover {
  background: #00ff00;
  color: #000;
}
</style>
