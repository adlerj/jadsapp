<template>
  <div
    class="game-container"
    @mousedown="startThrow"
    @mousemove="adjustThrow"
    @mouseup="releaseThrow"
    @touchstart="startThrow"
    @touchmove="adjustThrow"
    @touchend="releaseThrow"
    ref="gameContainer"
  >
    <div class="background"></div>
    <div
      v-for="basket in baskets"
      :key="basket.id"
      class="basket"
      :style="{ left: basket.x + 'px', top: basket.y + 'px' }"
    >
      <i class="fas fa-bullseye"></i>
    </div>
    <div class="disc" :style="{ left: discX + 'px', top: discY + 'px' }">
      <i class="fas fa-compact-disc"></i>
    </div>
    <div v-if="isAiming" class="aim-line" :style="aimLineStyle"></div>
    <div class="score">Score: {{ score }} / {{ totalBaskets }}</div>
    <div class="power-meter">
      <div class="power-bar" :style="{ width: throwPower + '%' }"></div>
    </div>
    <div v-if="gameOver" class="game-over">
      Game Over! Your score: {{ score }} / {{ totalBaskets }}
      <button @click="restartGame">Play Again</button>
    </div>
    <button class="close-button" @click="closeGame">Close Game</button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";

export default {
  name: "DiscGolfGame",
  setup(props, { emit }) {
    const gameContainer = ref(null);
    const discX = ref(50);
    const discY = ref(550);
    const isAiming = ref(false);
    const throwAngle = ref(0);
    const throwPower = ref(0);
    const score = ref(0);
    const gameOver = ref(false);
    const totalBaskets = 5;
    const baskets = ref([]);
    const discInFlight = ref(false);
    const flightInterval = ref(null);

    const generateBaskets = () => {
      baskets.value = Array(totalBaskets)
        .fill()
        .map((_, index) => ({
          id: index,
          x: 50 + Math.floor(Math.random() * 330),
          y: 50 + Math.random() * 400,
          hit: false,
        }));
    };

    const startThrow = (event) => {
      if (discInFlight.value) return;
      isAiming.value = true;
      updateAimAngle(event);
    };

    const adjustThrow = (event) => {
      if (!isAiming.value) return;
      updateAimAngle(event);
      throwPower.value = Math.min((throwPower.value + 2) % 100, 100);
    };

    const updateAimAngle = (event) => {
      const rect = gameContainer.value.getBoundingClientRect();
      const x = event.clientX
        ? event.clientX - rect.left
        : event.touches[0].clientX - rect.left;
      const y = event.clientY
        ? event.clientY - rect.top
        : event.touches[0].clientY - rect.top;
      throwAngle.value = Math.atan2(y - discY.value, x - discX.value);
    };

    const releaseThrow = () => {
      if (!isAiming.value) return;
      isAiming.value = false;
      discInFlight.value = true;
      const speed = throwPower.value / 5;
      const dx = Math.cos(throwAngle.value) * speed;
      const dy = Math.sin(throwAngle.value) * speed;

      flightInterval.value = setInterval(() => {
        discX.value += dx;
        discY.value += dy;
        checkCollision();

        if (
          discX.value < 0 ||
          discX.value > 400 ||
          discY.value < 0 ||
          discY.value > 600
        ) {
          endThrow();
        }
      }, 20);
    };

    const checkCollision = () => {
      baskets.value.forEach((basket) => {
        if (
          !basket.hit &&
          Math.abs(discX.value - basket.x) < 20 &&
          Math.abs(discY.value - basket.y) < 20
        ) {
          basket.hit = true;
          score.value++;
          endThrow();
          if (score.value === totalBaskets) {
            gameOver.value = true;
          }
        }
      });
    };

    const endThrow = () => {
      clearInterval(flightInterval.value);
      discInFlight.value = false;
      discX.value = 50;
      discY.value = 550;
      throwPower.value = 0;
    };

    const aimLineStyle = computed(() => ({
      left: discX.value + "px",
      top: discY.value + "px",
      width: throwPower.value + "px",
      transform: `rotate(${throwAngle.value}rad)`,
    }));

    const startGame = () => {
      generateBaskets();
    };

    const restartGame = () => {
      score.value = 0;
      gameOver.value = false;
      generateBaskets();
      endThrow();
    };

    const closeGame = () => {
      emit("close-game");
    };

    onMounted(() => {
      startGame();
    });

    onUnmounted(() => {
      clearInterval(flightInterval.value);
    });

    return {
      gameContainer,
      discX,
      discY,
      isAiming,
      throwPower,
      score,
      totalBaskets,
      gameOver,
      baskets,
      aimLineStyle,
      startThrow,
      adjustThrow,
      releaseThrow,
      restartGame,
      closeGame,
    };
  },
};
</script>

<style scoped>
.game-container {
  width: 400px;
  height: 600px;
  background-color: #90ee90;
  border: 2px solid #228b22;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, #228b22 0%, #228b22 20%, #90ee90 20%);
}

.disc {
  position: absolute;
  font-size: 24px;
  color: #ff4500;
}

.basket {
  position: absolute;
  font-size: 30px;
  color: #ffd700;
}

.aim-line {
  position: absolute;
  height: 2px;
  background-color: #ff0000;
  transform-origin: left center;
}

.score {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 20px;
  color: #ffffff;
  text-shadow: 2px 2px 4px #000000;
}

.power-meter {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 100px;
  height: 10px;
  background-color: #ffffff;
  border: 1px solid #000000;
}

.power-bar {
  height: 100%;
  background-color: #ff0000;
}

.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 20px;
  text-align: center;
  border: 2px solid #228b22;
}

.close-button,
.game-over button {
  background-color: #228b22;
  color: #ffffff;
  border: none;
  padding: 5px 10px;
  margin-top: 10px;
  cursor: pointer;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
