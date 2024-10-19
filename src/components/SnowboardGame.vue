<template>
  <div
    class="game-container"
    @keydown="handleKeyDown"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    tabindex="0"
    ref="gameContainer"
  >
    <div class="slope"></div>
    <div
      class="snowboarder"
      :style="{ left: snowboarderX + 'px', top: snowboarderY + 'px' }"
    >
      <i class="fas fa-snowboarding"></i>
    </div>
    <div
      v-for="(patroller, index) in patrollers"
      :key="index"
      class="patroller"
      :style="{ left: patroller.x + 'px', top: patroller.y + 'px' }"
    >
      <i class="fas fa-skiing"></i>
    </div>
    <div class="score">Score: {{ score }}</div>
    <div v-if="gameOver" class="game-over">
      Game Over! Your score: {{ score }}
      <button @click="restartGame">Play Again</button>
    </div>
    <button class="close-button" @click="closeGame">Close Game</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "SnowboardGame",
  setup(props, { emit }) {
    const snowboarderX = ref(200);
    const snowboarderY = ref(500);
    const patrollers = ref([]);
    const score = ref(0);
    const gameOver = ref(false);
    const gameLoop = ref(null);
    const gameContainer = ref(null);
    const touchStartX = ref(null);

    const handleKeyDown = (e) => {
      if (gameOver.value) return;
      if (e.key === "ArrowLeft" && snowboarderX.value > 0) {
        snowboarderX.value -= 10;
      } else if (e.key === "ArrowRight" && snowboarderX.value < 380) {
        snowboarderX.value += 10;
      }
    };

    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling
      if (gameOver.value || touchStartX.value === null) return;

      const touchEndX = e.touches[0].clientX;
      const diff = touchEndX - touchStartX.value;

      if (diff < 0 && snowboarderX.value > 0) {
        snowboarderX.value = Math.max(0, snowboarderX.value + diff * 0.5);
      } else if (diff > 0 && snowboarderX.value < 380) {
        snowboarderX.value = Math.min(380, snowboarderX.value + diff * 0.5);
      }

      touchStartX.value = touchEndX;
    };

    const handleTouchEnd = () => {
      touchStartX.value = null;
    };

    const createPatroller = () => {
      patrollers.value.push({
        x: Math.random() * 380,
        y: -50,
      });
    };

    const movePatrollers = () => {
      patrollers.value = patrollers.value.filter((patroller) => {
        patroller.y += 5;
        if (patroller.y > 600) {
          score.value++;
          return false;
        }
        return true;
      });
    };

    const checkCollision = () => {
      patrollers.value.forEach((patroller) => {
        if (
          snowboarderX.value < patroller.x + 20 &&
          snowboarderX.value + 20 > patroller.x &&
          snowboarderY.value < patroller.y + 20 &&
          snowboarderY.value + 20 > patroller.y
        ) {
          gameOver.value = true;
          clearInterval(gameLoop.value);
        }
      });
    };

    const gameUpdate = () => {
      movePatrollers();
      checkCollision();
      if (Math.random() < 0.02) {
        createPatroller();
      }
    };

    const startGame = () => {
      gameLoop.value = setInterval(gameUpdate, 50);
      gameContainer.value.focus();
    };

    const restartGame = () => {
      snowboarderX.value = 200;
      patrollers.value = [];
      score.value = 0;
      gameOver.value = false;
      startGame();
    };

    const closeGame = () => {
      emit("close-game");
    };

    onMounted(() => {
      startGame();
      // Prevent default touch behavior to avoid scrolling
      gameContainer.value.addEventListener(
        "touchmove",
        (e) => e.preventDefault(),
        { passive: false }
      );
    });

    onUnmounted(() => {
      clearInterval(gameLoop.value);
      if (gameContainer.value) {
        gameContainer.value.removeEventListener("touchmove", (e) =>
          e.preventDefault()
        );
      }
    });

    return {
      snowboarderX,
      snowboarderY,
      patrollers,
      score,
      gameOver,
      handleKeyDown,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      restartGame,
      closeGame,
      gameContainer,
    };
  },
};
</script>

<style scoped>
.game-container {
  width: 400px;
  height: 600px;
  background-color: #001100;
  border: 2px solid #00ff00;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.slope {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200%;
  background: repeating-linear-gradient(
    45deg,
    #001100,
    #001100 10px,
    #002200 10px,
    #002200 20px
  );
  animation: slide 20s linear infinite;
}

@keyframes slide {
  0% {
    transform: translateY(-50%);
  }
  100% {
    transform: translateY(0);
  }
}

.snowboarder,
.patroller {
  position: absolute;
  font-size: 30px;
  color: #00ff00;
}

.patroller {
  color: #ff0000;
}

.score {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 20px;
  color: #00ff00;
}

.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 17, 0, 0.8);
  color: #00ff00;
  padding: 20px;
  text-align: center;
  border: 2px solid #00ff00;
}

.close-button,
.game-over button {
  background-color: #00ff00;
  color: #001100;
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
