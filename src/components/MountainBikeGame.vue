<template>
  <div
    class="game-container"
    @keydown="handleKeyDown"
    tabindex="0"
    ref="gameContainer"
  >
    <div
      class="background"
      :style="{ transform: `translateX(${-cameraX}px)` }"
    ></div>
    <div
      v-for="(ramp, index) in ramps"
      :key="index"
      class="ramp"
      :style="{ left: `${ramp.x - cameraX}px`, bottom: '0px' }"
    ></div>
    <div
      class="biker"
      :style="{
        left: `${bikerX - cameraX}px`,
        top: `${bikerY}px`,
        transform: `rotate(${rotation}deg)`,
      }"
    >
      <i class="fas fa-bicycle"></i>
    </div>
    <div class="score">Score: {{ score }}</div>
    <div class="trick" v-if="currentTrick">{{ currentTrick }}</div>
    <div v-if="gameOver" class="game-over">
      Game Over! Your score: {{ score }}
      <button @click="restartGame">Play Again</button>
    </div>
    <div class="mobile-controls" v-if="isMobile">
      <button class="jump-button" @touchstart="jump" @mousedown="jump">
        Jump
      </button>
      <button
        class="left-trick"
        @touchstart="performLeftTrick"
        @mousedown="performLeftTrick"
      >
        Left Trick
      </button>
      <button
        class="right-trick"
        @touchstart="performRightTrick"
        @mousedown="performRightTrick"
      >
        Right Trick
      </button>
    </div>
    <button class="close-button" @click="closeGame">Close Game</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "MountainBikeGame",
  setup(props, { emit }) {
    const bikerX = ref(50);
    const bikerY = ref(400);
    const velocityX = ref(5);
    const velocityY = ref(0);
    const rotation = ref(0);
    const score = ref(0);
    const gameOver = ref(false);
    const gameLoop = ref(null);
    const gameContainer = ref(null);
    const inAir = ref(false);
    const currentTrick = ref("");
    const ramps = ref([
      { x: 0, width: 150 },
      { x: 800, width: 150 },
      { x: 1600, width: 150 },
    ]);
    const cameraX = ref(0);
    const isMobile = ref(false);

    const tricks = [
      "360 Spin",
      "Backflip",
      "Tailwhip",
      "Bar Spin",
      "No Hander",
    ];

    const handleKeyDown = (e) => {
      if (gameOver.value) return;
      if (e.key === "ArrowUp" && !inAir.value) {
        jump();
      } else if (e.key === "ArrowLeft" && inAir.value) {
        performLeftTrick();
      } else if (e.key === "ArrowRight" && inAir.value) {
        performRightTrick();
      }
    };

    const jump = () => {
      if (inAir.value) return;
      velocityY.value = -15;
      inAir.value = true;
    };

    const performLeftTrick = () => {
      if (inAir.value) {
        rotation.value -= 45;
        performTrick();
      }
    };

    const performRightTrick = () => {
      if (inAir.value) {
        rotation.value += 45;
        performTrick();
      }
    };

    const performTrick = () => {
      if (!currentTrick.value) {
        currentTrick.value = tricks[Math.floor(Math.random() * tricks.length)];
        setTimeout(() => {
          score.value += 100;
          currentTrick.value = "";
        }, 1000);
      }
    };

    const gameUpdate = () => {
      bikerX.value += velocityX.value;
      cameraX.value = bikerX.value - 200;

      if (inAir.value) {
        velocityY.value += 0.5; // Gravity
        bikerY.value += velocityY.value;

        // Check for landing
        const currentRamp = ramps.value.find(
          (ramp) =>
            bikerX.value >= ramp.x && bikerX.value <= ramp.x + ramp.width
        );
        if (currentRamp && bikerY.value >= 400) {
          bikerY.value = 400;
          inAir.value = false;
          if (Math.abs(rotation.value) > 180) {
            gameOver.value = true;
            clearInterval(gameLoop.value);
          }
          rotation.value = 0;
        }
      } else {
        // Check if we're off a ramp
        const currentRamp = ramps.value.find(
          (ramp) =>
            bikerX.value >= ramp.x && bikerX.value <= ramp.x + ramp.width
        );
        if (!currentRamp) {
          inAir.value = true;
        }
      }

      // Generate new ramps
      if (bikerX.value > ramps.value[ramps.value.length - 1].x - 800) {
        const lastRamp = ramps.value[ramps.value.length - 1];
        ramps.value.push({
          x: lastRamp.x + 800 + Math.random() * 400,
          width: 150,
        });
      }

      // Remove old ramps
      if (ramps.value.length > 5) {
        ramps.value.shift();
      }

      // Check for game over
      if (bikerY.value > 600) {
        gameOver.value = true;
        clearInterval(gameLoop.value);
      }
    };

    const startGame = () => {
      gameLoop.value = setInterval(gameUpdate, 20);
      gameContainer.value.focus();
    };

    const restartGame = () => {
      bikerX.value = 50;
      bikerY.value = 400;
      velocityX.value = 5;
      velocityY.value = 0;
      rotation.value = 0;
      score.value = 0;
      gameOver.value = false;
      inAir.value = false;
      currentTrick.value = "";
      cameraX.value = 0;
      ramps.value = [
        { x: 0, width: 150 },
        { x: 800, width: 150 },
        { x: 1600, width: 150 },
      ];
      startGame();
    };

    const closeGame = () => {
      emit("close-game");
    };

    onMounted(() => {
      startGame();
      isMobile.value =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
    });

    onUnmounted(() => {
      clearInterval(gameLoop.value);
    });

    return {
      bikerX,
      bikerY,
      rotation,
      score,
      gameOver,
      currentTrick,
      ramps,
      cameraX,
      isMobile,
      handleKeyDown,
      jump,
      performLeftTrick,
      performRightTrick,
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
  background-color: #87ceeb;
  border: 2px solid #4caf50;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 10000px; /* Extended background */
  height: 100%;
  background: linear-gradient(0deg, #4caf50 0%, #4caf50 60%, #87ceeb 60%);
}

.ramp {
  position: absolute;
  bottom: 0;
  width: 150px;
  height: 200px;
  background-color: #8b4513;
  clip-path: polygon(0 100%, 100% 0, 100% 100%);
}

.biker {
  position: absolute;
  font-size: 30px;
  color: #ff5722;
}

.score,
.trick {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 20px;
  color: #ffffff;
  text-shadow: 2px 2px 4px #000000;
  z-index: 10;
}

.trick {
  top: 40px;
  font-weight: bold;
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
  border: 2px solid #4caf50;
  z-index: 20;
}

.close-button,
.game-over button {
  background-color: #4caf50;
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
  z-index: 20;
}

.mobile-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  z-index: 20;
}

.mobile-controls button {
  background-color: rgba(76, 175, 80, 0.7);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
}
</style>
