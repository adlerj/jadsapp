<template>
  <div
    class="game-container"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    tabindex="0"
    ref="gameContainer"
  >
    <canvas ref="canvas"></canvas>
    <button class="close-button" @click="closeGame">✕</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "SnowboardGame",
  setup(props, { emit }) {
    const gameContainer = ref(null);
    const canvas = ref(null);
    let ctx = null;
    let animFrameId = null;
    let lastTime = 0;

    // Canvas dimensions
    const W = 800;
    const H = 600;

    // Pseudo-3D projection constants
    const HORIZON_Y = H * 0.25;
    const CAMERA_HEIGHT = 150;
    const DRAW_DISTANCE = 300;
    const ROAD_WIDTH = 6;

    // Game state
    const STATE_START = 0;
    const STATE_COUNTDOWN = 1;
    const STATE_PLAYING = 2;
    const STATE_GAMEOVER = 3;

    let state = STATE_START;
    let countdownTimer = 0;
    let countdownNumber = 3;

    // Player
    let playerX = 0;
    let playerTilt = 0;
    let playerSpeed = 0;
    let targetSpeed = 160;
    let playerJumpZ = 0;
    let playerJumpVel = 0;
    let isJumping = false;

    // World
    let distance = 0;
    let score = 0;
    let comboCount = 0;
    let comboTimer = 0;
    let lastComboText = "";
    let comboTextTimer = 0;
    let highScore = 0;

    // Input
    let keysDown = {};
    let touchStartX = null;
    let touchCurrentX = null;
    let touchActive = false;

    // Obstacles and objects
    let worldObjects = [];
    let nextSpawnDist = 50;
    const SPAWN_INTERVAL_BASE = 55;
    let spawnInterval = SPAWN_INTERVAL_BASE;

    // Snow particles
    let snowParticles = [];
    const MAX_SNOW = 80;

    // Spray particles (kicked up by snowboarder)
    let sprayParticles = [];

    // Difficulty
    let difficultyLevel = 1;

    function initSnowParticles() {
      snowParticles = [];
      for (let i = 0; i < MAX_SNOW; i++) {
        snowParticles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: Math.random() * 2.5 + 1,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.3,
        });
      }
    }

    function spawnSpray() {
      if (isJumping) return;
      const baseScreenX = W / 2 + playerX * 4;
      const baseScreenY = H - 60;
      for (let i = 0; i < 2; i++) {
        sprayParticles.push({
          x: baseScreenX + (Math.random() - 0.5) * 20,
          y: baseScreenY + Math.random() * 5,
          vx: (Math.random() - 0.5) * 3 + (playerTilt > 0 ? -1.5 : 1.5),
          vy: -(Math.random() * 2 + 1),
          life: 0.6,
          maxLife: 0.6,
          size: Math.random() * 3 + 1.5,
        });
      }
    }

    // Project world coords (x, z) to screen coords
    function projectPoint(worldX, worldZ) {
      if (worldZ <= 0) return null;
      const perspective = CAMERA_HEIGHT / worldZ;
      const screenX = W / 2 + worldX * perspective * 14;
      const screenY =
        HORIZON_Y +
        ((H - HORIZON_Y) * (DRAW_DISTANCE - worldZ)) / DRAW_DISTANCE;
      return { x: screenX, y: screenY, scale: perspective };
    }

    function spawnObject(dist) {
      const type = Math.random();
      const laneWidth = ROAD_WIDTH * 0.9;

      if (type < 0.3) {
        // Tree on left or right side
        const side = Math.random() < 0.5 ? -1 : 1;
        const offset =
          ROAD_WIDTH * 0.5 + Math.random() * ROAD_WIDTH * 0.6 + 1.5;
        worldObjects.push({
          type: "tree",
          x: side * offset,
          z: dist,
          height: 1.5 + Math.random() * 1.2,
          hit: false,
        });
      } else if (type < 0.5) {
        // Rock
        const xPos = (Math.random() - 0.5) * laneWidth;
        worldObjects.push({
          type: "rock",
          x: xPos,
          z: dist,
          size: 0.4 + Math.random() * 0.4,
          hit: false,
        });
      } else if (type < 0.62) {
        // Skier
        const xPos = (Math.random() - 0.5) * laneWidth;
        worldObjects.push({
          type: "skier",
          x: xPos,
          z: dist,
          speed: 0.8 + Math.random() * 0.6,
          direction: Math.random() < 0.5 ? 1 : -1,
          hit: false,
        });
      } else if (type < 0.82) {
        // Gate (two flags to pass through)
        const gateWidth = Math.max(3.0 - difficultyLevel * 0.08, 1.5);
        const gateCenterX = (Math.random() - 0.5) * (laneWidth * 0.5);
        worldObjects.push({
          type: "gate",
          x: gateCenterX,
          z: dist,
          width: gateWidth,
          passed: false,
          missed: false,
        });
      } else {
        // Tree pair (both sides)
        const offset = ROAD_WIDTH * 0.5 + Math.random() * ROAD_WIDTH * 0.4 + 1;
        const h = 1.5 + Math.random() * 1.2;
        worldObjects.push({
          type: "tree",
          x: -offset,
          z: dist,
          height: h,
          hit: false,
        });
        worldObjects.push({
          type: "tree",
          x: offset,
          z: dist,
          height: h * (0.8 + Math.random() * 0.4),
          hit: false,
        });
      }
    }

    function resetGame() {
      playerX = 0;
      playerTilt = 0;
      playerSpeed = 0;
      targetSpeed = 120;
      playerJumpZ = 0;
      playerJumpVel = 0;
      isJumping = false;
      distance = 0;
      score = 0;
      comboCount = 0;
      comboTimer = 0;
      comboTextTimer = 0;
      difficultyLevel = 1;
      spawnInterval = SPAWN_INTERVAL_BASE;
      worldObjects = [];
      sprayParticles = [];
      nextSpawnDist = 50;

      // Pre-spawn some scenery
      for (let d = 60; d < DRAW_DISTANCE + 100; d += 25 + Math.random() * 20) {
        spawnObject(d);
      }
    }

    // ==================== DRAWING ====================

    function drawSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 20);
      grad.addColorStop(0, "#87CEEB");
      grad.addColorStop(0.6, "#B8DFF0");
      grad.addColorStop(1, "#E8F4F8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, HORIZON_Y + 20);

      // Distant mountains
      ctx.fillStyle = "#C8D8E8";
      ctx.beginPath();
      ctx.moveTo(0, HORIZON_Y + 10);
      const peaks = [
        [80, -40],
        [180, -70],
        [300, -45],
        [420, -80],
        [540, -35],
        [650, -60],
        [750, -30],
        [800, -50],
      ];
      for (const [px, py] of peaks) {
        ctx.lineTo(px, HORIZON_Y + py);
      }
      ctx.lineTo(W, HORIZON_Y + 10);
      ctx.closePath();
      ctx.fill();

      // Slightly closer mountains
      ctx.fillStyle = "#D8E4EE";
      ctx.beginPath();
      ctx.moveTo(0, HORIZON_Y + 10);
      const peaks2 = [
        [50, -20],
        [150, -38],
        [260, -22],
        [370, -42],
        [480, -18],
        [580, -35],
        [700, -15],
        [800, -28],
      ];
      for (const [px, py] of peaks2) {
        ctx.lineTo(px, HORIZON_Y + py);
      }
      ctx.lineTo(W, HORIZON_Y + 10);
      ctx.closePath();
      ctx.fill();
    }

    function drawGround() {
      // Main snow ground
      const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
      grad.addColorStop(0, "#E8F0F8");
      grad.addColorStop(0.3, "#F0F5FA");
      grad.addColorStop(1, "#FAFCFF");
      ctx.fillStyle = grad;
      ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

      // Perspective slope lines
      const segmentCount = 40;
      const stripePhase = (distance * 2) % 2;

      for (let i = 0; i < segmentCount; i++) {
        const t0 = i / segmentCount;
        const t1 = (i + 1) / segmentCount;
        const y0 = HORIZON_Y + t0 * (H - HORIZON_Y);
        const y1 = HORIZON_Y + t1 * (H - HORIZON_Y);

        // Alternating stripes for motion illusion
        const stripeIndex = Math.floor(i + stripePhase * 4);
        if (stripeIndex % 2 === 0) {
          ctx.fillStyle = "rgba(200, 215, 235, 0.15)";
          ctx.fillRect(0, y0, W, y1 - y0);
        }
      }

      // Track/slope edge lines converging to vanishing point
      const vanishX = W / 2;
      const vanishY = HORIZON_Y;

      ctx.strokeStyle = "rgba(160, 185, 210, 0.3)";
      ctx.lineWidth = 1;

      // Edge lines
      for (let i = -3; i <= 3; i++) {
        const bottomX = vanishX + i * 140;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(bottomX, H);
        ctx.stroke();
      }

      // Horizontal depth lines
      for (let i = 1; i <= 12; i++) {
        const t = i / 12;
        const eased = t * t;
        const y = HORIZON_Y + eased * (H - HORIZON_Y);
        const halfWidth = eased * W * 0.7;

        // Add scroll offset to horizontal lines for motion
        const yOffset = ((distance * 3) % (H - HORIZON_Y)) * 0.05;
        const adjustedY = y - yOffset * eased;

        if (adjustedY > HORIZON_Y && adjustedY < H) {
          ctx.strokeStyle = `rgba(160, 185, 210, ${0.1 + eased * 0.15})`;
          ctx.beginPath();
          ctx.moveTo(vanishX - halfWidth, adjustedY);
          ctx.lineTo(vanishX + halfWidth, adjustedY);
          ctx.stroke();
        }
      }

      // Center trail/track marks
      ctx.strokeStyle = "rgba(180, 195, 210, 0.25)";
      ctx.lineWidth = 2;
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(vanishX + side * 30, H);
        ctx.stroke();
      }
    }

    function drawTree(screenX, screenY, scale, height) {
      const trunkW = 6 * scale;
      const trunkH = 20 * scale * height;
      const treeW = 30 * scale * height;
      const treeH = 45 * scale * height;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(
        screenX + 5 * scale,
        screenY,
        treeW * 0.6,
        6 * scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Trunk
      ctx.fillStyle = "#5D3A1A";
      ctx.fillRect(screenX - trunkW / 2, screenY - trunkH, trunkW, trunkH + 2);

      // Foliage layers (3 triangles stacked)
      const layers = 3;
      for (let l = 0; l < layers; l++) {
        const layerOffset = l * treeH * 0.28;
        const layerWidth = treeW * (1 - l * 0.2);
        const layerH = treeH * 0.5;
        const baseY = screenY - trunkH - layerOffset;

        // Darker back layer
        ctx.fillStyle = l === 0 ? "#1B5E20" : l === 1 ? "#2E7D32" : "#388E3C";
        ctx.beginPath();
        ctx.moveTo(screenX, baseY - layerH);
        ctx.lineTo(screenX - layerWidth / 2, baseY);
        ctx.lineTo(screenX + layerWidth / 2, baseY);
        ctx.closePath();
        ctx.fill();

        // Snow on top
        ctx.fillStyle = "rgba(240,248,255,0.7)";
        ctx.beginPath();
        ctx.moveTo(screenX, baseY - layerH);
        ctx.lineTo(screenX - layerWidth * 0.25, baseY - layerH * 0.55);
        ctx.lineTo(screenX + layerWidth * 0.25, baseY - layerH * 0.55);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawRock(screenX, screenY, scale, size) {
      const w = 22 * scale * size;
      const h = 16 * scale * size;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath();
      ctx.ellipse(
        screenX + 3 * scale,
        screenY,
        w * 0.8,
        4 * scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Rock body
      ctx.fillStyle = "#6B6B6B";
      ctx.beginPath();
      ctx.moveTo(screenX - w * 0.5, screenY);
      ctx.lineTo(screenX - w * 0.4, screenY - h * 0.7);
      ctx.lineTo(screenX - w * 0.1, screenY - h);
      ctx.lineTo(screenX + w * 0.3, screenY - h * 0.8);
      ctx.lineTo(screenX + w * 0.5, screenY - h * 0.3);
      ctx.lineTo(screenX + w * 0.4, screenY);
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(screenX - w * 0.1, screenY - h);
      ctx.lineTo(screenX + w * 0.15, screenY - h * 0.85);
      ctx.lineTo(screenX - w * 0.05, screenY - h * 0.5);
      ctx.closePath();
      ctx.fill();

      // Snow cap
      ctx.fillStyle = "rgba(240,248,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(screenX - w * 0.3, screenY - h * 0.65);
      ctx.lineTo(screenX - w * 0.1, screenY - h * 0.95);
      ctx.lineTo(screenX + w * 0.2, screenY - h * 0.75);
      ctx.quadraticCurveTo(
        screenX,
        screenY - h * 0.55,
        screenX - w * 0.3,
        screenY - h * 0.65
      );
      ctx.fill();
    }

    function drawGateFlag(screenX, screenY, scale, isLeft) {
      const poleH = 50 * scale;
      const flagW = 14 * scale;
      const flagH = 10 * scale;

      // Pole
      ctx.strokeStyle = "#D32F2F";
      ctx.lineWidth = Math.max(2 * scale, 1);
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX, screenY - poleH);
      ctx.stroke();

      // Flag
      ctx.fillStyle = isLeft ? "#F44336" : "#2196F3";
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - poleH);
      ctx.lineTo(
        screenX + (isLeft ? flagW : -flagW),
        screenY - poleH + flagH * 0.3
      );
      ctx.lineTo(screenX, screenY - poleH + flagH);
      ctx.closePath();
      ctx.fill();

      // Pole base
      ctx.fillStyle = "rgba(200,50,50,0.3)";
      ctx.beginPath();
      ctx.ellipse(screenX, screenY, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSkier(screenX, screenY, scale, direction) {
      const s = Math.min(scale, 1.8);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(screenX + 3 * s, screenY, 12 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // Skis
      ctx.fillStyle = "#222";
      ctx.fillRect(screenX - 10 * s, screenY - 2 * s, 20 * s, 3 * s);

      // Legs (dark pants)
      ctx.fillStyle = "#1A1A2E";
      ctx.fillRect(screenX - 4 * s, screenY - 14 * s, 3.5 * s, 12 * s);
      ctx.fillRect(screenX + 1 * s, screenY - 14 * s, 3.5 * s, 12 * s);

      // Body (red jacket)
      ctx.fillStyle = "#C62828";
      ctx.fillRect(screenX - 6 * s, screenY - 28 * s, 12 * s, 15 * s);

      // Arms
      ctx.strokeStyle = "#C62828";
      ctx.lineWidth = Math.max(2.5 * s, 1);
      ctx.beginPath();
      ctx.moveTo(screenX - 6 * s, screenY - 22 * s);
      ctx.lineTo(screenX - 14 * s * direction, screenY - 16 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screenX + 6 * s, screenY - 22 * s);
      ctx.lineTo(screenX + 14 * s * direction, screenY - 16 * s);
      ctx.stroke();

      // Head
      ctx.fillStyle = "#FFCCBC";
      ctx.beginPath();
      ctx.arc(screenX, screenY - 33 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();

      // Hat
      ctx.fillStyle = "#C62828";
      ctx.beginPath();
      ctx.arc(screenX, screenY - 35 * s, 5 * s, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    function drawGate(obj, relZ) {
      const leftX = obj.x - obj.width;
      const rightX = obj.x + obj.width;
      const projL = projectPoint(leftX, relZ);
      const projR = projectPoint(rightX, relZ);
      if (!projL || !projR) return;

      // Banner between flags
      if (projL.scale > 0.05) {
        const bannerY = Math.min(projL.y, projR.y) - 40 * projL.scale;
        ctx.strokeStyle = obj.passed
          ? "rgba(0,255,0,0.4)"
          : "rgba(255,200,0,0.4)";
        ctx.lineWidth = Math.max(2 * projL.scale, 0.5);
        ctx.setLineDash([4 * projL.scale, 3 * projL.scale]);
        ctx.beginPath();
        ctx.moveTo(projL.x, bannerY);
        ctx.lineTo(projR.x, bannerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      drawGateFlag(projL.x, projL.y, projL.scale, true);
      drawGateFlag(projR.x, projR.y, projR.scale, false);
    }

    function drawSnowboarder() {
      const cx = W / 2 + playerX * 4;
      const cy = H - 60 - playerJumpZ * 2;
      const tilt = playerTilt * 0.3;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);

      // Jump shadow
      if (isJumping) {
        const shadowScale = 1 + playerJumpZ * 0.02;
        ctx.fillStyle = `rgba(0,0,0,${0.15 - playerJumpZ * 0.002})`;
        ctx.beginPath();
        ctx.ellipse(
          0,
          playerJumpZ * 2 + 15,
          18 / shadowScale,
          5 / shadowScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        // Ground shadow
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.beginPath();
        ctx.ellipse(0, 15, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Board
      ctx.fillStyle = "#1A237E";
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 4, tilt * 0.5, 0, Math.PI * 2);
      ctx.fill();
      // Board edge highlight
      ctx.strokeStyle = "#3F51B5";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 4, tilt * 0.5, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Legs
      ctx.fillStyle = "#333";
      ctx.fillRect(-6, -4, 5, 14);
      ctx.fillRect(2, -4, 5, 14);

      // Body
      ctx.fillStyle = "#D32F2F";
      ctx.beginPath();
      ctx.roundRect(-8, -22, 16, 20, 3);
      ctx.fill();

      // Jacket stripe
      ctx.fillStyle = "#B71C1C";
      ctx.fillRect(-8, -14, 16, 4);

      // Arms (extended for balance, tilt-aware)
      ctx.strokeStyle = "#D32F2F";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7, -16);
      ctx.lineTo(-18 - tilt * 8, -10 + Math.abs(tilt) * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7, -16);
      ctx.lineTo(18 - tilt * 8, -10 + Math.abs(tilt) * 3);
      ctx.stroke();

      // Head
      ctx.fillStyle = "#FFCCBC";
      ctx.beginPath();
      ctx.arc(0, -28, 7, 0, Math.PI * 2);
      ctx.fill();

      // Helmet/goggles
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(0, -30, 7, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF6F00";
      ctx.fillRect(-5, -30, 10, 3);

      ctx.restore();
    }

    function drawSnowParticles() {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (const p of snowParticles) {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawSprayParticles() {
      for (const p of sprayParticles) {
        const alpha = (p.life / p.maxLife) * 0.6;
        ctx.fillStyle = `rgba(220,235,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawHUD() {
      ctx.save();
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = "#00ff00";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 6;

      const displaySpeed = Math.floor(playerSpeed * 1.2);
      const displayDist = Math.floor(distance);

      // Background panels
      ctx.fillStyle = "rgba(0, 10, 0, 0.6)";
      ctx.fillRect(10, 10, 170, 80);
      ctx.strokeStyle = "rgba(0,255,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 170, 80);

      ctx.fillStyle = "#00ff00";
      ctx.shadowBlur = 4;
      ctx.fillText(`SPEED: ${displaySpeed} km/h`, 20, 32);
      ctx.fillText(`DIST:  ${displayDist}m`, 20, 52);
      ctx.fillText(`SCORE: ${score}`, 20, 72);

      // Combo display
      if (comboCount > 1) {
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8;
        ctx.fillText(`COMBO x${comboCount}`, 20, 110);
      }

      // Combo text popup
      if (comboTextTimer > 0) {
        const alpha = Math.min(comboTextTimer * 2, 1);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = "#00ff00";
        ctx.shadowColor = "#00ff00";
        ctx.shadowBlur = 12;
        ctx.textAlign = "center";
        const popupY = H * 0.4 - (1 - comboTextTimer) * 40;
        ctx.fillText(lastComboText, W / 2, popupY);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function drawStartScreen() {
      // Darken
      ctx.fillStyle = "rgba(0,5,0,0.7)";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 20;

      // Title
      ctx.font = 'bold 48px "Courier New", monospace';
      ctx.fillStyle = "#00ff00";
      ctx.fillText("SHRED THE", W / 2, H * 0.28);
      ctx.fillText("MOUNTAIN", W / 2, H * 0.38);

      // Decorative line
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.25, H * 0.44);
      ctx.lineTo(W * 0.75, H * 0.44);
      ctx.stroke();

      // Subtitle
      ctx.shadowBlur = 6;
      ctx.font = '18px "Courier New", monospace';
      ctx.fillStyle = "#00cc00";
      ctx.fillText("A pseudo-3D snowboarding experience", W / 2, H * 0.52);

      // Controls
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = "#00aa00";
      const controls = [
        "LEFT/RIGHT or A/D - Steer",
        "SPACE - Jump over obstacles",
        "Pass through gates for bonus points",
      ];
      controls.forEach((line, i) => {
        ctx.fillText(line, W / 2, H * 0.62 + i * 22);
      });

      // High score
      if (highScore > 0) {
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8;
        ctx.fillText(`HIGH SCORE: ${highScore}`, W / 2, H * 0.78);
      }

      // Start prompt
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 10;
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = "#00ff00";
      const blink = Math.sin(Date.now() * 0.005) > 0;
      if (blink) {
        ctx.fillText("PRESS SPACE OR TAP TO START", W / 2, H * 0.88);
      }

      ctx.restore();
    }

    function drawCountdown() {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = 'bold 80px "Courier New", monospace';
      ctx.fillStyle = "#00ff00";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 25;
      const scale = 1 + (countdownTimer % 1) * 0.3;
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(scale, scale);
      const text = countdownNumber > 0 ? countdownNumber.toString() : "GO!";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    function drawGameOver() {
      ctx.fillStyle = "rgba(0,5,0,0.75)";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 15;

      ctx.font = 'bold 44px "Courier New", monospace';
      ctx.fillStyle = "#ff3333";
      ctx.shadowColor = "#ff3333";
      ctx.fillText("WIPEOUT!", W / 2, H * 0.28);

      ctx.shadowColor = "#00ff00";
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = "#00ff00";
      ctx.fillText(`DISTANCE: ${Math.floor(distance)}m`, W / 2, H * 0.42);
      ctx.fillText(`SCORE: ${score}`, W / 2, H * 0.48);

      if (score >= highScore && score > 0) {
        ctx.fillStyle = "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 10;
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillText("NEW HIGH SCORE!", W / 2, H * 0.56);
      }

      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 8;
      ctx.font = '18px "Courier New", monospace';
      ctx.fillStyle = "#00cc00";
      const blink = Math.sin(Date.now() * 0.005) > 0;
      if (blink) {
        ctx.fillText("PRESS SPACE OR TAP TO RESTART", W / 2, H * 0.72);
      }

      ctx.restore();
    }

    // ==================== UPDATE ====================

    function update(dt) {
      if (state === STATE_COUNTDOWN) {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
          countdownNumber--;
          if (countdownNumber < 0) {
            state = STATE_PLAYING;
          } else {
            countdownTimer = 1;
          }
        }
        // Slowly start speed during countdown
        playerSpeed += (30 - playerSpeed) * dt * 2;
        distance += playerSpeed * dt * 0.1;
        return;
      }

      if (state !== STATE_PLAYING) return;

      // Difficulty ramp
      difficultyLevel = 1 + Math.floor(distance / 200);
      targetSpeed = Math.min(160 + difficultyLevel * 8, 280);
      spawnInterval = Math.max(SPAWN_INTERVAL_BASE - difficultyLevel * 2.5, 12);

      // Speed
      playerSpeed += (targetSpeed - playerSpeed) * dt * 0.5;
      distance += playerSpeed * dt * 0.15;

      // Steering
      const steerSpeed = 50;
      const maxX = 55;
      let steerInput = 0;
      if (keysDown["ArrowLeft"] || keysDown["KeyA"]) steerInput = -1;
      if (keysDown["ArrowRight"] || keysDown["KeyD"]) steerInput = 1;

      // Touch steering
      if (touchActive && touchStartX !== null && touchCurrentX !== null) {
        const diff = touchCurrentX - touchStartX;
        steerInput = Math.max(-1, Math.min(1, diff / 60));
      }

      playerX += steerInput * steerSpeed * dt;
      playerX = Math.max(-maxX, Math.min(maxX, playerX));

      // Tilt smoothing
      const targetTilt = steerInput * 0.8;
      playerTilt += (targetTilt - playerTilt) * dt * 8;

      // Jump physics
      if (isJumping) {
        playerJumpVel -= 180 * dt;
        playerJumpZ += playerJumpVel * dt;
        if (playerJumpZ <= 0) {
          playerJumpZ = 0;
          playerJumpVel = 0;
          isJumping = false;
        }
      }

      // Combo timer decay
      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
          comboCount = 0;
        }
      }
      if (comboTextTimer > 0) comboTextTimer -= dt;

      // Spawn objects
      const frontDist = distance + DRAW_DISTANCE;
      while (nextSpawnDist < frontDist) {
        spawnObject(nextSpawnDist);
        nextSpawnDist += spawnInterval + Math.random() * spawnInterval * 0.5;
      }

      // Update skier positions
      for (const obj of worldObjects) {
        if (obj.type === "skier") {
          obj.x += obj.speed * obj.direction * dt;
          if (Math.abs(obj.x) > ROAD_WIDTH * 0.3) {
            obj.direction *= -1;
          }
        }
      }

      // Update objects and check collisions
      const playerWorldX = playerX * 0.12;
      const playerHitRadius = 0.4;
      const playerZ = 5;

      worldObjects = worldObjects.filter((obj) => {
        const relZ = obj.z - distance;

        if (relZ < -10) return false;

        // Collision zone
        if (relZ > playerZ - 2 && relZ < playerZ + 2) {
          if (obj.type === "tree" && !obj.hit) {
            const dist = Math.abs(obj.x - playerWorldX);
            if (dist < playerHitRadius + 0.5) {
              if (!isJumping || playerJumpZ < 8) {
                obj.hit = true;
                score = Math.max(0, score - 200);
                playerSpeed *= 0.4;
                comboCount = 0;
                comboTimer = 0;
                lastComboText = "TREE HIT -200";
                comboTextTimer = 1.2;
              }
            }
          } else if (obj.type === "rock" && !obj.hit) {
            const dist = Math.abs(obj.x - playerWorldX);
            if (dist < playerHitRadius + obj.size * 0.5) {
              if (!isJumping || playerJumpZ < 4) {
                obj.hit = true;
                triggerGameOver();
              }
            }
          } else if (obj.type === "skier" && !obj.hit) {
            const dist = Math.abs(obj.x - playerWorldX);
            if (dist < playerHitRadius + 0.5) {
              if (!isJumping || playerJumpZ < 6) {
                obj.hit = true;
                score = Math.max(0, score - 300);
                playerSpeed *= 0.3;
                comboCount = 0;
                comboTimer = 0;
                lastComboText = "SKIER HIT -300";
                comboTextTimer = 1.2;
              }
            }
          } else if (obj.type === "gate" && !obj.passed && !obj.missed) {
            if (relZ < playerZ) {
              const gateLeft = obj.x - obj.width;
              const gateRight = obj.x + obj.width;
              if (playerWorldX > gateLeft && playerWorldX < gateRight) {
                obj.passed = true;
                comboCount++;
                comboTimer = 3;
                const gatePoints = 100 * comboCount;
                score += gatePoints;
                lastComboText =
                  comboCount > 1
                    ? `GATE +${gatePoints} (x${comboCount})`
                    : `GATE +${gatePoints}`;
                comboTextTimer = 1.2;
              } else {
                obj.missed = true;
                comboCount = 0;
                comboTimer = 0;
              }
            }
          }
        }

        return true;
      });

      // Distance score
      score = Math.max(score, Math.floor(distance) * 1);

      // Snow particles
      for (const p of snowParticles) {
        p.x += p.speedX + playerTilt * -2;
        p.y += p.speedY + playerSpeed * 0.02;
        if (p.y > H) {
          p.y = -5;
          p.x = Math.random() * W;
        }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
      }

      // Spray particles
      if (state === STATE_PLAYING && Math.abs(steerInput) > 0.2) {
        spawnSpray();
      }
      sprayParticles = sprayParticles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 5 * dt;
        p.life -= dt;
        return p.life > 0;
      });
    }

    function triggerGameOver() {
      state = STATE_GAMEOVER;
      if (score > highScore) highScore = score;
    }

    // ==================== RENDER ====================

    function render() {
      ctx.clearRect(0, 0, W, H);

      drawSky();
      drawGround();

      // Sort objects by z-distance (far to near)
      const sortedObjects = worldObjects
        .map((obj) => ({ ...obj, relZ: obj.z - distance }))
        .filter((obj) => obj.relZ > 0 && obj.relZ < DRAW_DISTANCE)
        .sort((a, b) => b.relZ - a.relZ);

      for (const obj of sortedObjects) {
        if (obj.type === "tree") {
          const proj = projectPoint(obj.x, obj.relZ);
          if (proj && proj.y > HORIZON_Y - 20 && proj.y < H + 50) {
            drawTree(proj.x, proj.y, proj.scale, obj.height);
          }
        } else if (obj.type === "rock") {
          const proj = projectPoint(obj.x, obj.relZ);
          if (proj && proj.y > HORIZON_Y - 10 && proj.y < H + 20) {
            drawRock(proj.x, proj.y, proj.scale, obj.size);
          }
        } else if (obj.type === "skier") {
          const proj = projectPoint(obj.x, obj.relZ);
          if (proj && proj.y > HORIZON_Y - 10 && proj.y < H + 50) {
            drawSkier(proj.x, proj.y, proj.scale, obj.direction);
          }
        } else if (obj.type === "gate") {
          drawGate(obj, obj.relZ);
        }
      }

      drawSprayParticles();
      drawSnowboarder();
      drawSnowParticles();
      drawHUD();

      if (state === STATE_START) drawStartScreen();
      if (state === STATE_COUNTDOWN) drawCountdown();
      if (state === STATE_GAMEOVER) drawGameOver();
    }

    // ==================== GAME LOOP ====================

    function gameLoop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      update(dt);
      render();

      animFrameId = requestAnimationFrame(gameLoop);
    }

    // ==================== INPUT HANDLERS ====================

    const handleKeyDown = (e) => {
      keysDown[e.code] = true;

      if (e.code === "Space") {
        e.preventDefault();
        if (state === STATE_START) {
          startCountdown();
        } else if (state === STATE_PLAYING && !isJumping) {
          isJumping = true;
          playerJumpVel = 70;
        } else if (state === STATE_GAMEOVER) {
          startCountdown();
        }
      }

      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      keysDown[e.code] = false;
    };

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchCurrentX = touch.clientX;
      touchActive = true;

      if (state === STATE_START || state === STATE_GAMEOVER) {
        e.preventDefault();
        startCountdown();
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        touchCurrentX = e.touches[0].clientX;
      }
    };

    const handleTouchEnd = () => {
      // Detect tap (minimal movement) as jump
      if (
        state === STATE_PLAYING &&
        touchStartX !== null &&
        touchCurrentX !== null
      ) {
        const moved = Math.abs(touchCurrentX - touchStartX);
        if (moved < 10 && !isJumping) {
          isJumping = true;
          playerJumpVel = 70;
        }
      }
      touchActive = false;
      touchStartX = null;
      touchCurrentX = null;
    };

    function startCountdown() {
      resetGame();
      state = STATE_COUNTDOWN;
      countdownNumber = 3;
      countdownTimer = 1;
      initSnowParticles();
    }

    const closeGame = () => {
      emit("close-game");
    };

    // ==================== LIFECYCLE ====================

    onMounted(() => {
      const c = canvas.value;
      c.width = W;
      c.height = H;
      ctx = c.getContext("2d");

      initSnowParticles();
      resetGame();

      animFrameId = requestAnimationFrame(gameLoop);
      gameContainer.value.focus();

      // Prevent default touch scrolling
      const preventTouch = (e) => e.preventDefault();
      c.addEventListener("touchmove", preventTouch, { passive: false });
      c._preventTouch = preventTouch;
    });

    onUnmounted(() => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      const c = canvas.value;
      if (c && c._preventTouch) {
        c.removeEventListener("touchmove", c._preventTouch);
      }
    });

    return {
      gameContainer,
      canvas,
      handleKeyDown,
      handleKeyUp,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      closeGame,
    };
  },
};
</script>

<style scoped>
.game-container {
  position: relative;
  width: 800px;
  max-width: 100vw;
  margin: 0 auto;
  outline: none;
  border: 2px solid #00ff00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  background: #000;
}

canvas {
  display: block;
  width: 100%;
  height: auto;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 17, 0, 0.7);
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 4px 10px;
  font-family: "Courier New", monospace;
  font-size: 16px;
  cursor: pointer;
  z-index: 10;
  line-height: 1;
}

.close-button:hover {
  background: #00ff00;
  color: #001100;
}
</style>
