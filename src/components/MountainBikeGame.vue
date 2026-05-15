<template>
  <div
    class="game-container"
    ref="gameContainer"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    tabindex="0"
  >
    <canvas ref="canvas"></canvas>

    <div class="ui-overlay">
      <div class="score-display">
        <span class="score-label">DIST</span>
        <span class="score-value">{{ displayScore }}m</span>
      </div>
      <div class="speed-display">
        <span class="score-label">SPD</span>
        <span class="score-value">{{ displaySpeed }}</span>
      </div>
      <div v-if="highScore > 0 && gameState !== 'playing'" class="high-score">
        BEST: {{ highScore }}m
      </div>
    </div>

    <div v-if="gameState === 'start'" class="overlay start-screen">
      <div class="overlay-box">
        <div class="title">MOUNTAIN BIKE</div>
        <div class="subtitle">TRAIL RUNNER</div>
        <div class="instructions">
          <p>SPACE or TAP to jump</p>
          <p>HOLD SPACE or LONG PRESS to duck</p>
          <p>Avoid rocks, logs, and gaps</p>
        </div>
        <button class="action-button" @click="startGame">START RIDE</button>
      </div>
    </div>

    <div v-if="gameState === 'gameover'" class="overlay gameover-screen">
      <div class="overlay-box">
        <div class="title">WIPEOUT!</div>
        <div class="final-score">{{ displayScore }}m</div>
        <div v-if="isNewHighScore" class="new-high">NEW BEST!</div>
        <button class="action-button" @click="startGame">RIDE AGAIN</button>
      </div>
    </div>

    <div
      v-if="gameState === 'playing'"
      class="controls-hint"
      :class="{ 'fade-out': score > 50 }"
    >
      SPACE/TAP: Jump &middot; HOLD/LONG PRESS: Duck
    </div>

    <button class="close-button" @click="closeGame">&times;</button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";

export default {
  name: "MountainBikeGame",
  emits: ["close"],

  setup(props, { emit }) {
    const canvas = ref(null);
    const gameContainer = ref(null);
    const gameState = ref("start");
    const score = ref(0);
    const highScore = ref(
      parseInt(localStorage.getItem("mtbHighScore") || "0")
    );
    const isNewHighScore = ref(false);
    const speed = ref(0);

    const displayScore = computed(() => Math.floor(score.value));
    const displaySpeed = computed(() => {
      const mph = Math.floor(speed.value * 3);
      return mph + "mph";
    });

    let ctx = null;
    let animFrame = null;
    let lastTime = 0;

    // Game constants
    const GRAVITY = 1800;
    const JUMP_FORCE = -620;
    const GROUND_Y_RATIO = 0.78;
    const BIKER_X_RATIO = 0.15;

    // Game state variables
    let gameWidth = 800;
    let gameHeight = 600;
    let groundY = 0;
    let bikerX = 0;

    let biker = {
      y: 0,
      vy: 0,
      width: 40,
      height: 50,
      jumping: false,
      ducking: false,
      wheelAngle: 0,
      onGround: true,
      hitboxShrink: 4,
    };

    let obstacles = [];
    let terrain = [];
    let clouds = [];
    let treesBack = [];
    let treesFront = [];
    let mountains = [];
    let particles = [];
    let dustParticles = [];
    let stars = [];

    let currentSpeed = 4;
    let distanceTraveled = 0;
    let nextObstacleDistance = 0;
    let minObstacleGap = 250;
    let difficultyTimer = 0;

    let spaceDown = false;
    let touchDown = false;
    let duckTimer = 0;
    const DUCK_THRESHOLD = 180; // ms held before ducking

    // Color palette
    const COLORS = {
      skyTop: "#1a0a2e",
      skyMid: "#16213e",
      skyBot: "#0f3460",
      sunGlow: "#e94560",
      mountain1: "#1a1a2e",
      mountain2: "#16213e",
      mountain3: "#0f3460",
      ground: "#1a1a2e",
      groundLight: "#222244",
      trail: "#444466",
      trailEdge: "#333355",
      tree: "#0a3a0a",
      treeDark: "#062806",
      treeTrunk: "#3d2b1f",
      cloud: "rgba(255,255,255,0.08)",
      green: "#00ff00",
      greenDim: "#00aa00",
      greenDark: "#005500",
      bikerFrame: "#cccccc",
      bikerWheel: "#999999",
      rock: "#667788",
      rockDark: "#445566",
      log: "#5c3d2e",
      logDark: "#3d2b1f",
      logRing: "#7a5c4f",
      branch: "#4a3728",
      branchLeaf: "#1a6a1a",
      warning: "#ff4444",
      dust: "#887766",
    };

    function initGame() {
      const rect = gameContainer.value.getBoundingClientRect();
      gameWidth = rect.width;
      gameHeight = rect.height;
      groundY = gameHeight * GROUND_Y_RATIO;
      bikerX = gameWidth * BIKER_X_RATIO;

      biker.y = groundY - biker.height;
      biker.vy = 0;
      biker.jumping = false;
      biker.ducking = false;
      biker.onGround = true;
      biker.wheelAngle = 0;

      obstacles = [];
      particles = [];
      dustParticles = [];
      currentSpeed = 4;
      distanceTraveled = 0;
      nextObstacleDistance = 400;
      minObstacleGap = 250;
      difficultyTimer = 0;
      score.value = 0;
      speed.value = currentSpeed;
      duckTimer = 0;

      generateBackground();
      generateTerrain();
    }

    function generateBackground() {
      // Stars
      stars = [];
      for (let i = 0; i < 60; i++) {
        stars.push({
          x: Math.random() * gameWidth,
          y: Math.random() * gameHeight * 0.5,
          size: Math.random() * 1.5 + 0.5,
          twinkle: Math.random() * Math.PI * 2,
          speed: Math.random() * 2 + 1,
        });
      }

      // Mountains - 3 layers
      mountains = [];
      // Far mountains
      for (let i = 0; i < 6; i++) {
        mountains.push({
          x: i * (gameWidth / 3) - gameWidth * 0.2,
          baseY: gameHeight * 0.45,
          width: gameWidth * 0.5 + Math.random() * gameWidth * 0.2,
          height: gameHeight * 0.25 + Math.random() * gameHeight * 0.1,
          layer: 0,
          speedFactor: 0.05,
          color: COLORS.mountain1,
          snow: true,
        });
      }
      // Mid mountains
      for (let i = 0; i < 5; i++) {
        mountains.push({
          x: i * (gameWidth / 2.5) - gameWidth * 0.15,
          baseY: gameHeight * 0.55,
          width: gameWidth * 0.4 + Math.random() * gameWidth * 0.15,
          height: gameHeight * 0.2 + Math.random() * gameHeight * 0.08,
          layer: 1,
          speedFactor: 0.12,
          color: COLORS.mountain2,
          snow: true,
        });
      }
      // Near mountains/hills
      for (let i = 0; i < 6; i++) {
        mountains.push({
          x: i * (gameWidth / 2) - gameWidth * 0.1,
          baseY: gameHeight * 0.65,
          width: gameWidth * 0.35 + Math.random() * gameWidth * 0.1,
          height: gameHeight * 0.12 + Math.random() * gameHeight * 0.06,
          layer: 2,
          speedFactor: 0.25,
          color: COLORS.mountain3,
          snow: false,
        });
      }

      // Clouds
      clouds = [];
      for (let i = 0; i < 5; i++) {
        clouds.push({
          x: Math.random() * gameWidth * 1.5,
          y: gameHeight * 0.08 + Math.random() * gameHeight * 0.2,
          width: 80 + Math.random() * 120,
          height: 20 + Math.random() * 25,
          speedFactor: 0.08 + Math.random() * 0.06,
        });
      }

      // Back trees
      treesBack = [];
      for (let i = 0; i < 15; i++) {
        treesBack.push({
          x: Math.random() * gameWidth * 2,
          baseY: gameHeight * 0.68 + Math.random() * gameHeight * 0.02,
          height: 30 + Math.random() * 40,
          width: 18 + Math.random() * 14,
          speedFactor: 0.4,
        });
      }

      // Front trees (near trail)
      treesFront = [];
      for (let i = 0; i < 10; i++) {
        treesFront.push({
          x: Math.random() * gameWidth * 2,
          baseY: groundY - 5 + Math.random() * 8,
          height: 50 + Math.random() * 50,
          width: 22 + Math.random() * 18,
          speedFactor: 0.7,
        });
      }
    }

    function generateTerrain() {
      terrain = [];
      const segments = 200;
      const segWidth = (gameWidth * 3) / segments;
      for (let i = 0; i < segments; i++) {
        const x = i * segWidth;
        const undulation =
          Math.sin(i * 0.15) * 6 +
          Math.sin(i * 0.07) * 10 +
          Math.sin(i * 0.3) * 3;
        terrain.push({
          x,
          y: groundY + undulation,
          width: segWidth + 1,
        });
      }
    }

    function spawnObstacle() {
      const types = ["rock", "log", "gap", "branch"];
      // Weight the selection - branches only appear at higher speeds
      let weights;
      if (currentSpeed < 6) {
        weights = [0.4, 0.4, 0.2, 0];
      } else if (currentSpeed < 8) {
        weights = [0.3, 0.3, 0.2, 0.2];
      } else {
        weights = [0.25, 0.25, 0.2, 0.3];
      }

      let r = Math.random();
      let type;
      let cumulative = 0;
      for (let i = 0; i < types.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) {
          type = types[i];
          break;
        }
      }
      if (!type) type = "rock";

      const obs = {
        x: gameWidth + 50,
        type,
        passed: false,
      };

      if (type === "rock") {
        const size = 18 + Math.random() * 16;
        obs.width = size;
        obs.height = size * 0.8;
        obs.y = groundY - obs.height;
        obs.variant = Math.floor(Math.random() * 3);
      } else if (type === "log") {
        obs.width = 50 + Math.random() * 30;
        obs.height = 18 + Math.random() * 8;
        obs.y = groundY - obs.height;
      } else if (type === "gap") {
        obs.width = 60 + Math.random() * 40;
        obs.height = 80;
        obs.y = groundY;
      } else if (type === "branch") {
        obs.width = 70 + Math.random() * 40;
        obs.height = 18;
        obs.y = groundY - biker.height - 10; // overhead
      }

      obstacles.push(obs);
    }

    function jump() {
      if (biker.onGround && !biker.ducking) {
        biker.vy = JUMP_FORCE;
        biker.jumping = true;
        biker.onGround = false;

        // Jump dust burst
        for (let i = 0; i < 6; i++) {
          dustParticles.push({
            x: bikerX + biker.width / 2 + (Math.random() - 0.5) * 20,
            y: groundY,
            vx: (Math.random() - 0.5) * 80,
            vy: -Math.random() * 60 - 20,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.4 + Math.random() * 0.3,
            size: 3 + Math.random() * 4,
          });
        }
      }
    }

    function duck(ducking) {
      if (biker.onGround) {
        biker.ducking = ducking;
      }
    }

    function handleKeyDown(e) {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState.value !== "playing") return;
        if (!spaceDown) {
          spaceDown = true;
          duckTimer = 0;
          jump();
        }
      }
    }

    function handleKeyUp(e) {
      if (e.code === "Space") {
        e.preventDefault();
        spaceDown = false;
        duckTimer = 0;
        duck(false);
      }
    }

    function handleTouchStart(e) {
      e.preventDefault();
      if (gameState.value !== "playing") return;
      if (!touchDown) {
        touchDown = true;
        duckTimer = 0;
        jump();
      }
    }

    function handleTouchEnd(e) {
      e.preventDefault();
      touchDown = false;
      duckTimer = 0;
      duck(false);
    }

    function checkCollisions() {
      const bx = bikerX + biker.hitboxShrink;
      const by = biker.y + biker.hitboxShrink;
      const bw = biker.width - biker.hitboxShrink * 2;
      let bh = biker.height - biker.hitboxShrink * 2;

      if (biker.ducking) {
        bh = bh * 0.5;
        // Move hitbox down when ducking
      }

      for (const obs of obstacles) {
        if (obs.type === "gap") {
          // Fall into gap if on ground and overlapping
          if (
            biker.onGround &&
            bx + bw > obs.x + 10 &&
            bx < obs.x + obs.width - 10
          ) {
            return true;
          }
        } else if (obs.type === "branch") {
          // Branch hits if not ducking and overlapping
          if (!biker.ducking) {
            const ox = obs.x;
            const oy = obs.y;
            if (
              bx + bw > ox &&
              bx < ox + obs.width &&
              by < oy + obs.height &&
              by + bh > oy
            ) {
              return true;
            }
          }
        } else {
          // Standard collision for rocks and logs
          const ox = obs.x;
          const oy = obs.y;
          if (
            bx + bw > ox + 4 &&
            bx < ox + obs.width - 4 &&
            by + bh > oy + 4 &&
            by < oy + obs.height - 4
          ) {
            return true;
          }
        }
      }
      return false;
    }

    function spawnCrashParticles() {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: bikerX + biker.width / 2,
          y: biker.y + biker.height / 2,
          vx: (Math.random() - 0.5) * 300,
          vy: (Math.random() - 0.8) * 250,
          life: 0.5 + Math.random() * 0.8,
          maxLife: 0.5 + Math.random() * 0.8,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? COLORS.green : COLORS.bikerFrame,
        });
      }
    }

    function update(dt) {
      if (gameState.value !== "playing") return;

      // Handle hold-to-duck
      if (spaceDown || touchDown) {
        duckTimer += dt * 1000;
        if (duckTimer > DUCK_THRESHOLD && biker.onGround) {
          duck(true);
        }
      }

      // Increase difficulty
      difficultyTimer += dt;
      if (difficultyTimer > 3) {
        difficultyTimer = 0;
        if (currentSpeed < 14) {
          currentSpeed += 0.15;
        }
        if (minObstacleGap > 140) {
          minObstacleGap -= 3;
        }
      }

      speed.value = currentSpeed;

      // Update distance / score
      distanceTraveled += currentSpeed * dt * 60;
      score.value = distanceTraveled / 15;

      // Gravity & vertical movement
      if (!biker.onGround) {
        biker.vy += GRAVITY * dt;
        biker.y += biker.vy * dt;

        if (biker.y >= groundY - biker.height) {
          biker.y = groundY - biker.height;
          biker.vy = 0;
          biker.onGround = true;
          biker.jumping = false;

          // Landing dust
          for (let i = 0; i < 4; i++) {
            dustParticles.push({
              x: bikerX + biker.width / 2 + (Math.random() - 0.5) * 16,
              y: groundY,
              vx: (Math.random() - 0.5) * 60,
              vy: -Math.random() * 40 - 10,
              life: 0.3 + Math.random() * 0.2,
              maxLife: 0.3 + Math.random() * 0.2,
              size: 2 + Math.random() * 3,
            });
          }
        }
      }

      // When ducking while on ground, release ducking when key is released
      // (handled in keyup/touchend)

      // Scroll obstacles
      const scrollSpeed = currentSpeed * dt * 60;
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= scrollSpeed;
        if (obstacles[i].x + obstacles[i].width < -50) {
          obstacles.splice(i, 1);
        }
      }

      // Spawn obstacles
      nextObstacleDistance -= scrollSpeed;
      if (nextObstacleDistance <= 0) {
        spawnObstacle();
        nextObstacleDistance =
          minObstacleGap + Math.random() * (minObstacleGap * 0.8);
      }

      // Wheel rotation
      biker.wheelAngle += currentSpeed * dt * 25;

      // Trail dust while riding
      if (biker.onGround && Math.random() < 0.3) {
        dustParticles.push({
          x: bikerX + 5 + Math.random() * 10,
          y: groundY - 2,
          vx: -currentSpeed * 8 + (Math.random() - 0.5) * 20,
          vy: -Math.random() * 20 - 5,
          life: 0.3 + Math.random() * 0.3,
          maxLife: 0.3 + Math.random() * 0.3,
          size: 1.5 + Math.random() * 2.5,
        });
      }

      // Update particles
      for (let i = dustParticles.length - 1; i >= 0; i--) {
        const p = dustParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 60 * dt;
        p.life -= dt;
        if (p.life <= 0) {
          dustParticles.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += GRAVITY * 0.3 * dt;
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Check collisions
      if (checkCollisions()) {
        gameOver();
      }
    }

    function gameOver() {
      gameState.value = "gameover";
      spawnCrashParticles();

      if (Math.floor(score.value) > highScore.value) {
        highScore.value = Math.floor(score.value);
        localStorage.setItem("mtbHighScore", String(highScore.value));
        isNewHighScore.value = true;
      } else {
        isNewHighScore.value = false;
      }
    }

    // ---- DRAWING ----

    function drawSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, groundY);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.5, COLORS.skyMid);
      grad.addColorStop(1, COLORS.skyBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, gameWidth, groundY);
    }

    function drawStars(time) {
      for (const star of stars) {
        const twinkle = Math.sin(time * star.speed + star.twinkle);
        const alpha = 0.3 + twinkle * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawSun() {
      const sunX = gameWidth * 0.75;
      const sunY = gameHeight * 0.18;

      // Glow
      const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 100);
      glow.addColorStop(0, "rgba(233,69,96,0.4)");
      glow.addColorStop(0.5, "rgba(233,69,96,0.1)");
      glow.addColorStop(1, "rgba(233,69,96,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sunX - 100, sunY - 100, 200, 200);

      // Sun disc
      ctx.fillStyle = COLORS.sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Horizon lines through sun (vaporwave aesthetic)
      ctx.strokeStyle = COLORS.skyTop;
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        const ly = sunY + i * 8;
        if (Math.abs(i) > 1) {
          ctx.beginPath();
          ctx.moveTo(sunX - 30, ly);
          ctx.lineTo(sunX + 30, ly);
          ctx.stroke();
        }
      }
    }

    function drawClouds() {
      const scrollOffset = distanceTraveled;
      for (const cloud of clouds) {
        const cx =
          ((cloud.x - scrollOffset * cloud.speedFactor) %
            (gameWidth + cloud.width * 2)) -
          cloud.width;
        ctx.fillStyle = COLORS.cloud;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cloud.y,
          cloud.width / 2,
          cloud.height / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(
          cx - cloud.width * 0.25,
          cloud.y + 5,
          cloud.width * 0.3,
          cloud.height * 0.4,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(
          cx + cloud.width * 0.25,
          cloud.y + 3,
          cloud.width * 0.35,
          cloud.height * 0.45,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    function drawMountains() {
      const scrollOffset = distanceTraveled;
      // Sort by layer
      const sorted = [...mountains].sort((a, b) => a.layer - b.layer);

      for (const m of sorted) {
        const mx =
          ((m.x - scrollOffset * m.speedFactor) % (gameWidth + m.width)) -
          m.width * 0.3;

        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(mx, m.baseY);
        ctx.lineTo(mx + m.width * 0.5, m.baseY - m.height);
        ctx.lineTo(mx + m.width, m.baseY);
        ctx.closePath();
        ctx.fill();

        // Snow caps
        if (m.snow) {
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.beginPath();
          const peakX = mx + m.width * 0.5;
          const peakY = m.baseY - m.height;
          const snowLine = m.height * 0.25;
          ctx.moveTo(peakX, peakY);
          ctx.lineTo(peakX - m.width * 0.08, peakY + snowLine);
          ctx.lineTo(peakX + m.width * 0.1, peakY + snowLine);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    function drawTree(x, baseY, h, w, dark) {
      // Trunk
      ctx.fillStyle = COLORS.treeTrunk;
      ctx.fillRect(x - 3, baseY - h * 0.3, 6, h * 0.3 + 5);

      // Canopy layers
      const color = dark ? COLORS.treeDark : COLORS.tree;
      ctx.fillStyle = color;

      for (let i = 0; i < 3; i++) {
        const layerY = baseY - h + i * (h * 0.25);
        const layerW = w * (0.5 + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(x, layerY);
        ctx.lineTo(x - layerW / 2, layerY + h * 0.35);
        ctx.lineTo(x + layerW / 2, layerY + h * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawTrees() {
      const scrollOffset = distanceTraveled;

      // Back trees
      for (const t of treesBack) {
        const wrapWidth = gameWidth * 2;
        const tx =
          ((((t.x - scrollOffset * t.speedFactor) % wrapWidth) + wrapWidth) %
            wrapWidth) -
          gameWidth * 0.2;
        drawTree(tx, t.baseY, t.height, t.width, true);
      }

      // Front trees
      for (const t of treesFront) {
        const wrapWidth = gameWidth * 2;
        const tx =
          ((((t.x - scrollOffset * t.speedFactor) % wrapWidth) + wrapWidth) %
            wrapWidth) -
          gameWidth * 0.2;
        drawTree(tx, t.baseY, t.height, t.width, false);
      }
    }

    function drawGround() {
      // Main ground
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, groundY, gameWidth, gameHeight - groundY);

      // Trail surface
      const trailTop = groundY - 3;
      const trailBottom = groundY + 25;

      // Trail gradient
      const tGrad = ctx.createLinearGradient(0, trailTop, 0, trailBottom);
      tGrad.addColorStop(0, COLORS.trailEdge);
      tGrad.addColorStop(0.3, COLORS.trail);
      tGrad.addColorStop(1, COLORS.ground);
      ctx.fillStyle = tGrad;
      ctx.fillRect(0, trailTop, gameWidth, trailBottom - trailTop);

      // Trail dashes (center line)
      ctx.strokeStyle = "rgba(100,100,120,0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([15, 20]);
      const dashOffset = (distanceTraveled * 0.8) % 35;
      ctx.lineDashOffset = -dashOffset;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 10);
      ctx.lineTo(gameWidth, groundY + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gravel texture dots
      ctx.fillStyle = "rgba(80,80,100,0.2)";
      const gravelSeed = Math.floor(distanceTraveled * 0.1);
      for (let i = 0; i < 30; i++) {
        const gx = (i * 47 + gravelSeed * 7) % gameWidth;
        const gy = groundY + 2 + ((i * 31 + gravelSeed * 3) % 18);
        ctx.fillRect(gx, gy, 2, 1);
      }

      // Ground below trail
      const belowGrad = ctx.createLinearGradient(0, trailBottom, 0, gameHeight);
      belowGrad.addColorStop(0, COLORS.ground);
      belowGrad.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = belowGrad;
      ctx.fillRect(0, trailBottom, gameWidth, gameHeight - trailBottom);
    }

    function drawObstacles() {
      for (const obs of obstacles) {
        if (obs.type === "rock") {
          drawRock(obs);
        } else if (obs.type === "log") {
          drawLog(obs);
        } else if (obs.type === "gap") {
          drawGap(obs);
        } else if (obs.type === "branch") {
          drawBranch(obs);
        }
      }
    }

    function drawRock(obs) {
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(cx + 3, groundY, obs.width * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rock body
      ctx.fillStyle = COLORS.rock;
      ctx.beginPath();
      if (obs.variant === 0) {
        // Rounded rock
        ctx.moveTo(obs.x + 3, groundY);
        ctx.lineTo(obs.x, cy + 3);
        ctx.quadraticCurveTo(obs.x + 2, obs.y - 2, cx, obs.y);
        ctx.quadraticCurveTo(
          obs.x + obs.width - 2,
          obs.y - 1,
          obs.x + obs.width,
          cy + 2
        );
        ctx.lineTo(obs.x + obs.width - 2, groundY);
      } else if (obs.variant === 1) {
        // Angular rock
        ctx.moveTo(obs.x + 2, groundY);
        ctx.lineTo(obs.x, cy);
        ctx.lineTo(cx - 3, obs.y);
        ctx.lineTo(cx + 5, obs.y + 3);
        ctx.lineTo(obs.x + obs.width, cy + 2);
        ctx.lineTo(obs.x + obs.width - 3, groundY);
      } else {
        // Double rock
        ctx.moveTo(obs.x + 2, groundY);
        ctx.lineTo(obs.x, cy + 4);
        ctx.quadraticCurveTo(obs.x + 3, obs.y, cx - 4, obs.y + 3);
        ctx.lineTo(cx + 2, obs.y);
        ctx.quadraticCurveTo(
          obs.x + obs.width,
          obs.y + 2,
          obs.x + obs.width,
          cy + 3
        );
        ctx.lineTo(obs.x + obs.width - 2, groundY);
      }
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = COLORS.rockDark;
      ctx.beginPath();
      ctx.moveTo(cx, obs.y + 4);
      ctx.lineTo(obs.x + obs.width - 4, cy + 3);
      ctx.lineTo(obs.x + obs.width - 3, groundY);
      ctx.lineTo(cx + 2, groundY);
      ctx.closePath();
      ctx.fill();
    }

    function drawLog(obs) {
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(
        obs.x + obs.width / 2 + 3,
        groundY + 2,
        obs.width * 0.45,
        4,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Log body
      ctx.fillStyle = COLORS.log;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      // Bark lines
      ctx.strokeStyle = COLORS.logDark;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const lx = obs.x + (obs.width / 5) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(lx, obs.y + 2);
        ctx.lineTo(lx + 2, obs.y + obs.height - 2);
        ctx.stroke();
      }

      // Log end (cross-section circle)
      ctx.fillStyle = COLORS.logRing;
      ctx.beginPath();
      ctx.ellipse(
        obs.x + obs.width,
        obs.y + obs.height / 2,
        obs.height / 2,
        obs.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Rings
      ctx.strokeStyle = COLORS.logDark;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(
        obs.x + obs.width,
        obs.y + obs.height / 2,
        obs.height * 0.25,
        obs.height * 0.25,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(obs.x + obs.width, obs.y + obs.height / 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Top highlight
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height * 0.3);
    }

    function drawGap(obs) {
      // Dark pit
      const gGrad = ctx.createLinearGradient(0, obs.y, 0, obs.y + obs.height);
      gGrad.addColorStop(0, "#0a0a0a");
      gGrad.addColorStop(1, "#000000");
      ctx.fillStyle = gGrad;
      ctx.fillRect(obs.x, obs.y - 3, obs.width, obs.height + 3);

      // Crumbling edges
      ctx.fillStyle = COLORS.ground;
      // Left edge
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y - 3);
      ctx.lineTo(obs.x + 8, obs.y - 3);
      ctx.lineTo(obs.x + 5, obs.y + 10);
      ctx.lineTo(obs.x, obs.y + 6);
      ctx.closePath();
      ctx.fill();
      // Right edge
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width, obs.y - 3);
      ctx.lineTo(obs.x + obs.width - 8, obs.y - 3);
      ctx.lineTo(obs.x + obs.width - 5, obs.y + 10);
      ctx.lineTo(obs.x + obs.width, obs.y + 6);
      ctx.closePath();
      ctx.fill();

      // Warning marks
      ctx.fillStyle = "rgba(255,68,68,0.4)";
      ctx.fillRect(obs.x + 2, obs.y - 5, 3, 3);
      ctx.fillRect(obs.x + obs.width - 5, obs.y - 5, 3, 3);
    }

    function drawBranch(obs) {
      // Main branch
      ctx.strokeStyle = COLORS.branch;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(obs.x - 10, obs.y + obs.height / 2 - 8);
      ctx.lineTo(obs.x + obs.width + 10, obs.y + obs.height / 2 + 3);
      ctx.stroke();

      // Sub-branches
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const bx = obs.x + (obs.width / 4) * i + 10;
        const by = obs.y + obs.height / 2 - 5 + i * 1.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 8, by + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 5, by);
        ctx.lineTo(bx - 5, by - 10);
        ctx.stroke();
      }

      // Leaves
      ctx.fillStyle = COLORS.branchLeaf;
      for (let i = 0; i < 6; i++) {
        const lx = obs.x + (obs.width / 5) * i;
        const ly = obs.y + (i % 2 === 0 ? -5 : obs.height + 2);
        ctx.beginPath();
        ctx.ellipse(lx, ly, 8, 5, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Duck warning indicator
      ctx.fillStyle = "rgba(255,255,0,0.3)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("DUCK!", obs.x + obs.width / 2, obs.y - 8);
    }

    function drawBiker(time) {
      const x = bikerX;
      let y = biker.y;
      const w = biker.width;
      const h = biker.height;

      ctx.save();

      // Bob animation while riding on ground
      if (biker.onGround && !biker.ducking) {
        y += Math.sin(time * 12) * 1.5;
      }

      const bikerCenterX = x + w / 2;
      const bikerBottomY = y + h;

      // Tilt when jumping/ducking
      let tilt = 0;
      if (biker.jumping && biker.vy < 0) {
        tilt = -0.15; // Nose up on ascent
      } else if (biker.jumping && biker.vy > 100) {
        tilt = 0.1; // Nose down on descent
      }
      if (biker.ducking) {
        tilt = 0.05;
      }

      ctx.translate(bikerCenterX, bikerBottomY);
      ctx.rotate(tilt);
      ctx.translate(-bikerCenterX, -bikerBottomY);

      const wheelRadius = 9;
      const rearWheelX = x + 8;
      const frontWheelX = x + w - 8;
      const wheelY = bikerBottomY - wheelRadius;

      // Shadows
      if (biker.onGround) {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(bikerCenterX, groundY, w * 0.4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wheels
      ctx.strokeStyle = COLORS.bikerWheel;
      ctx.lineWidth = 2;

      // Rear wheel
      ctx.beginPath();
      ctx.arc(rearWheelX, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.stroke();
      // Spokes
      for (let i = 0; i < 4; i++) {
        const angle = biker.wheelAngle + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(
          rearWheelX + Math.cos(angle) * 2,
          wheelY + Math.sin(angle) * 2
        );
        ctx.lineTo(
          rearWheelX + Math.cos(angle) * (wheelRadius - 1),
          wheelY + Math.sin(angle) * (wheelRadius - 1)
        );
        ctx.stroke();
      }

      // Front wheel
      ctx.beginPath();
      ctx.arc(frontWheelX, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const angle = biker.wheelAngle + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(
          frontWheelX + Math.cos(angle) * 2,
          wheelY + Math.sin(angle) * 2
        );
        ctx.lineTo(
          frontWheelX + Math.cos(angle) * (wheelRadius - 1),
          wheelY + Math.sin(angle) * (wheelRadius - 1)
        );
        ctx.stroke();
      }

      // Frame
      ctx.strokeStyle = COLORS.bikerFrame;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const seatX = bikerCenterX - 4;
      const seatY = wheelY - 18;
      const bbX = bikerCenterX;
      const bbY = wheelY - 2;

      // Seat tube
      ctx.beginPath();
      ctx.moveTo(seatX, seatY);
      ctx.lineTo(bbX, bbY);
      ctx.stroke();

      // Down tube
      ctx.beginPath();
      ctx.moveTo(seatX + 8, seatY + 2);
      ctx.lineTo(frontWheelX, wheelY - wheelRadius + 2);
      ctx.stroke();

      // Chain stay
      ctx.beginPath();
      ctx.moveTo(bbX, bbY);
      ctx.lineTo(rearWheelX, wheelY);
      ctx.stroke();

      // Seat stay
      ctx.beginPath();
      ctx.moveTo(seatX, seatY);
      ctx.lineTo(rearWheelX, wheelY);
      ctx.stroke();

      // Fork
      ctx.beginPath();
      ctx.moveTo(seatX + 8, seatY + 2);
      ctx.lineTo(frontWheelX, wheelY);
      ctx.stroke();

      // Handlebars
      ctx.beginPath();
      ctx.moveTo(seatX + 8, seatY + 2);
      ctx.lineTo(seatX + 14, seatY - 3);
      ctx.stroke();

      // Seat
      ctx.fillStyle = COLORS.bikerFrame;
      ctx.fillRect(seatX - 5, seatY - 2, 10, 3);

      // Rider body
      const bodyScale = biker.ducking ? 0.65 : 1;
      const riderBaseY = seatY - 2;

      // Torso
      ctx.strokeStyle = COLORS.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(seatX, riderBaseY);
      ctx.lineTo(seatX + 5, riderBaseY - 16 * bodyScale);
      ctx.stroke();

      // Head
      const headY = riderBaseY - 16 * bodyScale - 5;
      ctx.fillStyle = "#ffcc88";
      ctx.beginPath();
      ctx.arc(seatX + 5, headY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Helmet
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.arc(seatX + 5, headY - 1, 5.5, Math.PI, 0);
      ctx.fill();

      // Arms reaching to handlebars
      ctx.strokeStyle = "#ffcc88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(seatX + 5, riderBaseY - 12 * bodyScale);
      ctx.lineTo(seatX + 14, seatY - 3);
      ctx.stroke();

      // Legs to pedals (with pedaling animation)
      const pedalAngle = biker.onGround ? time * 8 : 0;
      const pedalRadius = 5;
      const pedalX1 = bbX + Math.cos(pedalAngle) * pedalRadius;
      const pedalY1 = bbY + Math.sin(pedalAngle) * pedalRadius;
      const pedalX2 = bbX + Math.cos(pedalAngle + Math.PI) * pedalRadius;
      const pedalY2 = bbY + Math.sin(pedalAngle + Math.PI) * pedalRadius;

      ctx.strokeStyle = "#336699";
      ctx.lineWidth = 2.5;
      // Leg 1
      ctx.beginPath();
      ctx.moveTo(seatX, riderBaseY);
      ctx.lineTo(pedalX1, pedalY1);
      ctx.stroke();
      // Leg 2
      ctx.beginPath();
      ctx.moveTo(seatX, riderBaseY);
      ctx.lineTo(pedalX2, pedalY2);
      ctx.stroke();

      ctx.restore();
    }

    function drawParticles() {
      // Dust particles
      for (const p of dustParticles) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(136,119,102,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crash particles
      for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle =
          p.color === COLORS.green
            ? `rgba(0,255,0,${alpha})`
            : `rgba(200,200,200,${alpha})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    function draw(time) {
      if (!ctx) return;

      ctx.clearRect(0, 0, gameWidth, gameHeight);

      drawSky();
      drawStars(time);
      drawSun();
      drawClouds();
      drawMountains();
      drawTrees();
      drawGround();
      drawObstacles();
      drawDustParticles();
      drawBiker(time);
      drawParticles();
    }

    function drawDustParticles() {
      for (const p of dustParticles) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(136,119,102,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function gameLoop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap at 50ms
      lastTime = timestamp;

      update(dt);
      draw(timestamp / 1000);

      animFrame = requestAnimationFrame(gameLoop);
    }

    function resizeCanvas() {
      if (!canvas.value || !gameContainer.value) return;
      const container = gameContainer.value;
      const rect = container.getBoundingClientRect();

      // Use device pixel ratio for sharpness
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = rect.height;

      canvas.value.width = w * dpr;
      canvas.value.height = h * dpr;
      canvas.value.style.width = w + "px";
      canvas.value.style.height = h + "px";

      ctx = canvas.value.getContext("2d");
      ctx.scale(dpr, dpr);

      gameWidth = w;
      gameHeight = h;
      groundY = gameHeight * GROUND_Y_RATIO;
      bikerX = gameWidth * BIKER_X_RATIO;

      if (biker.onGround) {
        biker.y = groundY - biker.height;
      }

      generateBackground();
      generateTerrain();
    }

    function startGame() {
      gameState.value = "playing";
      spaceDown = false;
      touchDown = false;
      initGame();
      lastTime = 0;
      nextTick(() => {
        if (gameContainer.value) {
          gameContainer.value.focus();
        }
      });
    }

    function closeGame() {
      emit("close");
    }

    onMounted(() => {
      resizeCanvas();

      // Start render loop (renders even on start screen for background)
      animFrame = requestAnimationFrame(gameLoop);

      window.addEventListener("resize", resizeCanvas);

      nextTick(() => {
        if (gameContainer.value) {
          gameContainer.value.focus();
        }
      });

      // Initialize background for start screen
      initGame();
      gameState.value = "start";
    });

    onUnmounted(() => {
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
      window.removeEventListener("resize", resizeCanvas);
    });

    return {
      canvas,
      gameContainer,
      gameState,
      score,
      highScore,
      isNewHighScore,
      displayScore,
      displaySpeed,
      handleKeyDown,
      handleKeyUp,
      handleTouchStart,
      handleTouchEnd,
      startGame,
      closeGame,
    };
  },
};
</script>

<style scoped>
.game-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: #0a0a1a;
  outline: none;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.ui-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  z-index: 10;
  pointer-events: none;
}

.score-display,
.speed-display {
  font-family: "Courier New", monospace;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.score-label {
  font-size: 10px;
  color: #00aa00;
  letter-spacing: 2px;
}

.score-value {
  font-size: 22px;
  color: #00ff00;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.6);
  font-weight: bold;
}

.high-score {
  position: absolute;
  top: 60px;
  left: 0;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #00aa00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  background: rgba(0, 0, 0, 0.5);
}

.overlay-box {
  text-align: center;
  font-family: "Courier New", monospace;
  color: #00ff00;
  padding: 40px;
  border: 2px solid #00ff00;
  background: rgba(0, 10, 0, 0.9);
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.2),
    inset 0 0 30px rgba(0, 255, 0, 0.05);
  max-width: 90vw;
}

.title {
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
  letter-spacing: 4px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #00aa00;
  letter-spacing: 8px;
  margin-bottom: 30px;
}

.instructions {
  margin-bottom: 30px;
  line-height: 2;
}

.instructions p {
  margin: 0;
  font-size: 13px;
  color: #00cc00;
}

.final-score {
  font-size: 48px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
  margin: 15px 0;
}

.new-high {
  font-size: 16px;
  color: #ffff00;
  text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
  margin-bottom: 20px;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}

.action-button {
  font-family: "Courier New", monospace;
  font-size: 16px;
  font-weight: bold;
  color: #001100;
  background: #00ff00;
  border: none;
  padding: 12px 32px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.action-button:hover {
  background: #00cc00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  transform: scale(1.05);
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #00aa00;
  opacity: 0.7;
  z-index: 10;
  pointer-events: none;
  transition: opacity 1s ease;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.controls-hint.fade-out {
  opacity: 0;
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 30;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #00ff00;
  background: rgba(0, 10, 0, 0.8);
  color: #00ff00;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  line-height: 1;
}

.close-button:hover {
  background: #00ff00;
  color: #001100;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
}

@media (max-width: 600px) {
  .title {
    font-size: 24px;
    letter-spacing: 2px;
  }

  .subtitle {
    font-size: 11px;
    letter-spacing: 4px;
  }

  .instructions p {
    font-size: 11px;
  }

  .overlay-box {
    padding: 25px;
  }

  .score-value {
    font-size: 18px;
  }

  .final-score {
    font-size: 36px;
  }
}
</style>
