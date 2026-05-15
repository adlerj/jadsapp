<template>
  <div class="slime-vb-wrapper" ref="wrapperRef">
    <canvas ref="canvasRef"></canvas>
    <button class="close-btn" @click="$emit('close-game')">X</button>
    <button
      class="chat-toggle"
      @click="toggleChat"
      :class="{ active: showChat }"
    >
      {{ showChat ? "✕" : "💬" }}
    </button>
    <div v-if="showChat" class="chat-panel">
      <div class="chat-header-bar">JEFF'S TRASH TALK</div>
      <div class="chat-messages" ref="chatMessagesRef">
        <div v-if="chatError" class="chat-system chat-error">
          {{ chatError }}
        </div>
        <div
          v-for="(msg, i) in chatMessages"
          :key="i"
          :class="['chat-msg', msg.role === 'user' ? 'chat-user' : 'chat-jeff']"
        >
          <span class="chat-prefix"
            >{{ msg.role === "user" ? "YOU" : "JEFF" }}&gt;</span
          >
          {{ msg.content }}
        </div>
        <div v-if="chatGenerating" class="chat-msg chat-jeff">
          <span class="chat-prefix">JEFF&gt;</span>
          <span class="cursor-blink">_</span>
        </div>
      </div>
      <div class="chat-input-row">
        <input
          v-model="chatInput"
          @keydown.enter.stop="sendChat"
          @keydown.stop
          placeholder="Talk trash..."
          class="chat-input"
          :disabled="chatGenerating"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

export default {
  name: "SlimeVolleyball",
  emits: ["close-game"],
  setup() {
    const canvasRef = ref(null);
    const wrapperRef = ref(null);
    let ctx = null;
    let animFrame = null;
    let W = 800;
    let H = 500;

    // ─── Constants ─────────────────────────────────────────────
    const GRAVITY = 0.6;
    const SLIME_RADIUS = 50;
    const BALL_RADIUS = 18;
    const NET_WIDTH = 6;
    const NET_HEIGHT_RATIO = 0.4;
    const GROUND_Y_OFFSET = 40;
    const WIN_SCORE = 7;
    const POINT_PAUSE = 1500;
    const SLIME_SPEED = 7;
    const JUMP_FORCE = -13;
    const BALL_BOUNCE_DAMPING = 0.75;
    const BALL_MAX_SPEED = 14;

    // ─── Colors ────────────────────────────────────────────────
    const BG_COLOR = "#001100";
    const PLAYER_COLOR = "#00ff00";
    const AI_COLOR = "#008800";
    const BALL_COLOR = "#00ff00";
    const NET_COLOR = "#004400";
    const GROUND_COLOR = "#003300";
    const TEXT_COLOR = "#00ff00";

    // ─── Game state ────────────────────────────────────────────
    const state = {
      phase: "start", // start, playing, scored, gameover
      playerScore: 0,
      aiScore: 0,
      lastScorer: null, // 'player' or 'ai'
      pauseTimer: 0,

      // Player slime
      player: { x: 0, y: 0, vy: 0, onGround: true },
      // AI slime
      ai: { x: 0, y: 0, vy: 0, onGround: true },
      // Ball
      ball: { x: 0, y: 0, vx: 0, vy: 0, trail: [] },

      // Input
      keys: {},
      touchLeft: false,
      touchRight: false,
      touchJump: false,
    };

    // ─── AI avatar image ────────────────────────────────────────
    const aiAvatar = new Image();
    let aiAvatarLoaded = false;
    aiAvatar.onload = () => {
      aiAvatarLoaded = true;
    };
    aiAvatar.onerror = () => {
      aiAvatarLoaded = false;
    };
    aiAvatar.src = "/jeff-adler.png";

    // ─── Derived measurements ──────────────────────────────────
    let groundY = 0;
    let netX = 0;
    let netTop = 0;

    function recalcDimensions() {
      groundY = H - GROUND_Y_OFFSET;
      netX = W / 2;
      netTop = groundY - groundY * NET_HEIGHT_RATIO;
    }

    function resetPositions(serverSide) {
      state.player.x = W * 0.25;
      state.player.y = groundY;
      state.player.vy = 0;
      state.player.onGround = true;

      state.ai.x = W * 0.75;
      state.ai.y = groundY;
      state.ai.vy = 0;
      state.ai.onGround = true;

      if (serverSide === "player") {
        state.ball.x = W * 0.25;
      } else {
        state.ball.x = W * 0.75;
      }
      state.ball.y = groundY - SLIME_RADIUS * 3;
      state.ball.vx = 0;
      state.ball.vy = 0;
      state.ball.trail = [];
    }

    function startGame() {
      state.playerScore = 0;
      state.aiScore = 0;
      state.lastScorer = null;
      state.phase = "playing";
      resetPositions("player");
    }

    // ─── Physics ───────────────────────────────────────────────
    function clampSpeed(ball) {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > BALL_MAX_SPEED) {
        ball.vx = (ball.vx / speed) * BALL_MAX_SPEED;
        ball.vy = (ball.vy / speed) * BALL_MAX_SPEED;
      }
    }

    function updateBall(step) {
      const ball = state.ball;

      // Gravity
      ball.vy += GRAVITY * step;

      // Move
      ball.x += ball.vx * step;
      ball.y += ball.vy * step;

      // Trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();

      // Wall bounces
      if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.vx = Math.abs(ball.vx) * BALL_BOUNCE_DAMPING;
      }
      if (ball.x + BALL_RADIUS > W) {
        ball.x = W - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * BALL_BOUNCE_DAMPING;
      }

      // Ceiling bounce
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy = Math.abs(ball.vy) * BALL_BOUNCE_DAMPING;
      }

      // Net collision
      if (
        ball.y + BALL_RADIUS > netTop &&
        ball.x + BALL_RADIUS > netX - NET_WIDTH / 2 &&
        ball.x - BALL_RADIUS < netX + NET_WIDTH / 2
      ) {
        // Ball hitting top of net
        if (ball.y - BALL_RADIUS < netTop && ball.vy > 0) {
          ball.y = netTop - BALL_RADIUS;
          ball.vy = -Math.abs(ball.vy) * BALL_BOUNCE_DAMPING;
        } else if (ball.x < netX) {
          // Left side of net
          ball.x = netX - NET_WIDTH / 2 - BALL_RADIUS;
          ball.vx = -Math.abs(ball.vx) * BALL_BOUNCE_DAMPING;
        } else {
          // Right side of net
          ball.x = netX + NET_WIDTH / 2 + BALL_RADIUS;
          ball.vx = Math.abs(ball.vx) * BALL_BOUNCE_DAMPING;
        }
      }

      // Ground collision - scoring
      if (ball.y + BALL_RADIUS >= groundY) {
        ball.y = groundY - BALL_RADIUS;
        if (ball.x < netX) {
          // Ball hit ground on player's side - AI scores
          scorePoint("ai");
        } else {
          // Ball hit ground on AI's side - player scores
          scorePoint("player");
        }
      }

      clampSpeed(ball);
    }

    function collideSlimeBall(slime) {
      const ball = state.ball;
      const dx = ball.x - slime.x;
      const dy = ball.y - slime.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = SLIME_RADIUS + BALL_RADIUS;

      if (dist < minDist && dy <= 0) {
        // Ball is touching slime's semicircle (top half only)
        const angle = Math.atan2(dy, dx);
        // Push ball out
        ball.x = slime.x + Math.cos(angle) * minDist;
        ball.y = slime.y + Math.sin(angle) * minDist;

        // Reflect velocity based on contact angle
        const normalX = Math.cos(angle);
        const normalY = Math.sin(angle);

        // Relative velocity
        const relVx = ball.vx - (slime === state.player ? getPlayerVx() : 0);
        const relVy = ball.vy - slime.vy;

        const dot = relVx * normalX + relVy * normalY;

        ball.vx = ball.vx - 2 * dot * normalX;
        ball.vy = ball.vy - 2 * dot * normalY;

        // Add a boost
        ball.vx += normalX * 2;
        ball.vy += normalY * 2;

        // Minimum upward velocity on hit
        if (ball.vy > -3) ball.vy = -3;

        clampSpeed(ball);
      }
    }

    function getPlayerVx() {
      let vx = 0;
      if (state.keys["ArrowLeft"] || state.keys["KeyA"] || state.touchLeft)
        vx -= SLIME_SPEED;
      if (state.keys["ArrowRight"] || state.keys["KeyD"] || state.touchRight)
        vx += SLIME_SPEED;
      return vx;
    }

    function updatePlayer(step) {
      const p = state.player;
      let vx = getPlayerVx();

      p.x += vx * step;

      // Constrain to left side
      if (p.x - SLIME_RADIUS < 0) p.x = SLIME_RADIUS;
      if (p.x + SLIME_RADIUS > netX - NET_WIDTH / 2)
        p.x = netX - NET_WIDTH / 2 - SLIME_RADIUS;

      // Jump
      if (
        (state.keys["ArrowUp"] ||
          state.keys["KeyW"] ||
          state.keys["Space"] ||
          state.touchJump) &&
        p.onGround
      ) {
        p.vy = JUMP_FORCE;
        p.onGround = false;
      }

      // Gravity
      if (!p.onGround) {
        p.vy += GRAVITY * step;
        p.y += p.vy * step;
        if (p.y >= groundY) {
          p.y = groundY;
          p.vy = 0;
          p.onGround = true;
        }
      }
    }

    // ─── AI ────────────────────────────────────────────────────
    let aiTargetX = 0;
    let aiReactionDelay = 0;

    function updateAI(step) {
      const ai = state.ai;
      const ball = state.ball;

      // AI tracks ball with some lag
      aiReactionDelay++;
      if (aiReactionDelay > 0) {
        aiReactionDelay = 0;
        if (ball.x > netX && ball.vx >= 0) {
          aiTargetX = ball.x + ball.vx * 10 + (Math.random() - 0.5) * 6;
        } else if (ball.x > netX) {
          aiTargetX = ball.x + (Math.random() - 0.5) * 5;
        } else {
          aiTargetX = W * 0.75 + (Math.random() - 0.5) * 20;
        }
      }

      // Move toward target
      const dx = aiTargetX - ai.x;
      const aiSpeed = SLIME_SPEED * 1.1;
      if (Math.abs(dx) > aiSpeed) {
        ai.x += dx > 0 ? aiSpeed * step : -aiSpeed * step;
      } else {
        ai.x += dx * 0.5 * step;
      }

      // Constrain to right side
      if (ai.x - SLIME_RADIUS < netX + NET_WIDTH / 2)
        ai.x = netX + NET_WIDTH / 2 + SLIME_RADIUS;
      if (ai.x + SLIME_RADIUS > W) ai.x = W - SLIME_RADIUS;

      // Jump logic - jump when ball is above and close
      const ballDist = Math.sqrt((ball.x - ai.x) ** 2 + (ball.y - ai.y) ** 2);
      const shouldJump =
        ball.x > netX &&
        ball.y < groundY - SLIME_RADIUS * 1.5 &&
        ballDist < SLIME_RADIUS * 6 &&
        ball.vy < 8 &&
        Math.random() > 0.05;

      if (shouldJump && ai.onGround) {
        ai.vy = JUMP_FORCE * 1.0;
        ai.onGround = false;
      }

      // Gravity
      if (!ai.onGround) {
        ai.vy += GRAVITY * step;
        ai.y += ai.vy * step;
        if (ai.y >= groundY) {
          ai.y = groundY;
          ai.vy = 0;
          ai.onGround = true;
        }
      }
    }

    // ─── Scoring ───────────────────────────────────────────────
    function scorePoint(scorer) {
      if (state.phase !== "playing") return;

      if (scorer === "player") {
        state.playerScore++;
      } else {
        state.aiScore++;
      }

      state.lastScorer = scorer;

      if (showChat.value) {
        if (scorer === "ai") {
          generateTaunt(
            `You just scored! Score is now Jeff ${state.aiScore} - Player ${state.playerScore}. Taunt them!`
          );
        } else {
          generateTaunt(
            `Player scored on you. Score is now Jeff ${state.aiScore} - Player ${state.playerScore}. React!`
          );
        }
      }

      if (state.playerScore >= WIN_SCORE || state.aiScore >= WIN_SCORE) {
        state.phase = "gameover";
        if (showChat.value) {
          const jeffWon = state.aiScore >= WIN_SCORE;
          generateTaunt(
            jeffWon
              ? `You won ${state.aiScore}-${state.playerScore}! Celebrate!`
              : `They beat you ${state.playerScore}-${state.aiScore}. React!`
          );
        }
        return;
      }

      state.phase = "scored";
      state.pauseTimer = POINT_PAUSE;
    }

    // ─── Rendering ─────────────────────────────────────────────
    function drawSlime(x, y, radius, color, ball, useImage = null) {
      // Semicircle body
      ctx.beginPath();
      ctx.arc(x, y, radius, Math.PI, 0, false);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw avatar image clipped to semicircle
      if (useImage && aiAvatarLoaded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, Math.PI, 0, false);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(useImage, x - radius, y - radius, radius * 2, radius);
        ctx.restore();
      }

      // Flat bottom
      ctx.beginPath();
      ctx.moveTo(x - radius, y);
      ctx.lineTo(x + radius, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eye
      const eyeX = x + radius * 0.2;
      const eyeY = y - radius * 0.4;
      const eyeRadius = radius * 0.2;

      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Pupil tracks ball
      const angleToBall = Math.atan2(ball.y - eyeY, ball.x - eyeX);
      const pupilDist = eyeRadius * 0.4;
      const pupilX = eyeX + Math.cos(angleToBall) * pupilDist;
      const pupilY = eyeY + Math.sin(angleToBall) * pupilDist;

      ctx.beginPath();
      ctx.arc(pupilX, pupilY, eyeRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();
    }

    function drawBall() {
      const ball = state.ball;

      // Trail/glow
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = (i / ball.trail.length) * 0.3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_RADIUS * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.fill();
      }

      // Main ball with glow
      ctx.shadowColor = BALL_COLOR;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = BALL_COLOR;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function drawNet() {
      ctx.fillStyle = NET_COLOR;
      ctx.fillRect(netX - NET_WIDTH / 2, netTop, NET_WIDTH, groundY - netTop);

      // Net top cap
      ctx.beginPath();
      ctx.arc(netX, netTop, NET_WIDTH, 0, Math.PI * 2);
      ctx.fillStyle = NET_COLOR;
      ctx.fill();
    }

    function drawCourt() {
      // Ground line
      ctx.strokeStyle = GROUND_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // Subtle grid lines
      ctx.strokeStyle = "#001a00";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, groundY + GROUND_Y_OFFSET);
        ctx.stroke();
      }
    }

    function drawHUD() {
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(`${state.playerScore}  -  ${state.aiScore}`, W / 2, 35);

      ctx.font = "12px monospace";
      ctx.fillStyle = "#006600";
      ctx.textAlign = "left";
      ctx.fillText("YOU", 20, 35);
      ctx.textAlign = "right";
      ctx.fillText("JEFF", W - 20, 35);
    }

    function drawStartScreen() {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, W, H);

      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText("SLIME VOLLEYBALL", W / 2, H * 0.25);

      ctx.font = "14px monospace";
      ctx.fillStyle = "#008800";
      ctx.fillText("← → or A/D to move", W / 2, H * 0.42);
      ctx.fillText("↑ or W or SPACE to jump", W / 2, H * 0.48);
      ctx.fillText("First to 7 wins!", W / 2, H * 0.56);

      // Start button
      const btnW = 160;
      const btnH = 44;
      const btnX = W / 2 - btnW / 2;
      const btnY = H * 0.65;

      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.font = "bold 20px monospace";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText("[ START ]", W / 2, btnY + btnH / 2 + 7);

      // Draw decorative slimes
      drawSlime(W * 0.3, H * 0.88, 30, PLAYER_COLOR, {
        x: W / 2,
        y: H * 0.7,
      });
      drawSlime(
        W * 0.7,
        H * 0.88,
        30,
        AI_COLOR,
        { x: W / 2, y: H * 0.7 },
        aiAvatar
      );
    }

    function drawScoredScreen() {
      const msg =
        state.lastScorer === "player" ? "POINT - YOU!" : "POINT - JEFF";
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = state.lastScorer === "player" ? TEXT_COLOR : AI_COLOR;
      ctx.fillText(msg, W / 2, H * 0.4);
    }

    function drawGameOver() {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, W, H);

      const playerWon = state.playerScore >= WIN_SCORE;
      const title = playerWon ? "YOU WIN!" : "JEFF WINS!";

      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = playerWon ? TEXT_COLOR : "#ff3333";
      ctx.fillText(title, W / 2, H * 0.3);

      ctx.font = "24px monospace";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(`${state.playerScore} - ${state.aiScore}`, W / 2, H * 0.45);

      // Play Again button
      const btnW = 200;
      const btnH = 44;
      const btnX = W / 2 - btnW / 2;
      const btnY = H * 0.58;

      ctx.strokeStyle = TEXT_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.font = "bold 18px monospace";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText("[ PLAY AGAIN ]", W / 2, btnY + btnH / 2 + 6);
    }

    // ─── Game loop ─────────────────────────────────────────────
    let lastTime = 0;

    function gameLoop(timestamp) {
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, W, H);

      if (state.phase === "start") {
        drawStartScreen();
      } else if (state.phase === "playing") {
        const step = Math.min(dt / 16.67, 3);
        updatePlayer(step);
        updateAI(step);
        updateBall(step);
        collideSlimeBall(state.player);
        collideSlimeBall(state.ai);

        drawCourt();
        drawNet();
        drawSlime(
          state.player.x,
          state.player.y,
          SLIME_RADIUS,
          PLAYER_COLOR,
          state.ball
        );
        drawSlime(
          state.ai.x,
          state.ai.y,
          SLIME_RADIUS,
          AI_COLOR,
          state.ball,
          aiAvatar
        );
        drawBall();
        drawHUD();
      } else if (state.phase === "scored") {
        state.pauseTimer -= dt;

        drawCourt();
        drawNet();
        drawSlime(
          state.player.x,
          state.player.y,
          SLIME_RADIUS,
          PLAYER_COLOR,
          state.ball
        );
        drawSlime(
          state.ai.x,
          state.ai.y,
          SLIME_RADIUS,
          AI_COLOR,
          state.ball,
          aiAvatar
        );
        drawHUD();
        drawScoredScreen();

        if (state.pauseTimer <= 0) {
          state.phase = "playing";
          resetPositions(state.lastScorer);
        }
      } else if (state.phase === "gameover") {
        drawGameOver();
      }

      animFrame = requestAnimationFrame(gameLoop);
    }

    // ─── Input handling ────────────────────────────────────────
    function onKeyDown(e) {
      state.keys[e.code] = true;
      if (e.code === "Space") e.preventDefault();
    }

    function onKeyUp(e) {
      state.keys[e.code] = false;
    }

    function handleClick(e) {
      const rect = canvasRef.value.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);

      if (state.phase === "start") {
        // Check start button
        const btnW = 160;
        const btnH = 44;
        const btnX = W / 2 - btnW / 2;
        const btnY = H * 0.65;
        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
          startGame();
        }
      } else if (state.phase === "gameover") {
        // Check play again button
        const btnW = 200;
        const btnH = 44;
        const btnX = W / 2 - btnW / 2;
        const btnY = H * 0.58;
        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
          startGame();
        }
      }
    }

    function onTouchStart(e) {
      e.preventDefault();
      const rect = canvasRef.value.getBoundingClientRect();

      // Check for button clicks first
      if (e.touches.length > 0) {
        const touch = e.touches[0];

        if (state.phase === "start" || state.phase === "gameover") {
          handleClick({ clientX: touch.clientX, clientY: touch.clientY });
          return;
        }
      }

      // Game controls
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const x = (touch.clientX - rect.left) / rect.width;
        const y = (touch.clientY - rect.top) / rect.height;

        if (y < 0.5) {
          state.touchJump = true;
        } else if (x < 0.33) {
          state.touchLeft = true;
        } else if (x > 0.66) {
          state.touchRight = true;
        } else {
          state.touchJump = true;
        }
      }
    }

    function onTouchEnd(e) {
      e.preventDefault();
      state.touchLeft = false;
      state.touchRight = false;
      state.touchJump = false;
    }

    // ─── Resize ────────────────────────────────────────────────
    function resize() {
      if (!wrapperRef.value || !canvasRef.value) return;
      const wrapper = wrapperRef.value;
      const aspect = 800 / 500;
      let w = wrapper.clientWidth;
      let h = w / aspect;
      if (h > wrapper.clientHeight) {
        h = wrapper.clientHeight;
        w = h * aspect;
      }
      canvasRef.value.style.width = w + "px";
      canvasRef.value.style.height = h + "px";
      canvasRef.value.width = W;
      canvasRef.value.height = H;
    }

    // ─── Lifecycle ─────────────────────────────────────────────
    onMounted(() => {
      ctx = canvasRef.value.getContext("2d");
      recalcDimensions();
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      canvasRef.value.addEventListener("click", handleClick);
      canvasRef.value.addEventListener("touchstart", onTouchStart, {
        passive: false,
      });
      canvasRef.value.addEventListener("touchend", onTouchEnd, {
        passive: false,
      });
      lastTime = performance.now();
      animFrame = requestAnimationFrame(gameLoop);
    });

    onUnmounted(() => {
      if (animFrame) cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (canvasRef.value) {
        canvasRef.value.removeEventListener("click", handleClick);
        canvasRef.value.removeEventListener("touchstart", onTouchStart);
        canvasRef.value.removeEventListener("touchend", onTouchEnd);
      }
    });

    // ─── Chat state ──────────────────────────────────────────
    const showChat = ref(true);
    const chatMessages = ref([
      { role: "assistant", content: "Ready to get destroyed? Let's go!" },
    ]);
    const chatInput = ref("");
    const chatGenerating = ref(false);
    const chatError = ref(null);
    const chatMessagesRef = ref(null);

    const TRASH_TALK_PROMPT = `You are Jeff, trash-talking during a slime volleyball game. You're competitive and funny. Keep every response under 15 words. Be playful, not mean. Use gaming/sports trash talk. Never break character.`;

    const scrollChat = () => {
      nextTick(() => {
        if (chatMessagesRef.value) {
          chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
        }
      });
    };

    const toggleChat = () => {
      showChat.value = !showChat.value;
      if (showChat.value && chatMessages.value.length === 0) {
        chatMessages.value.push({
          role: "assistant",
          content: "Ready to get destroyed? Let's go!",
        });
        scrollChat();
      }
    };

    const fetchChat = async (messages) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          systemPrompt: TRASH_TALK_PROMPT,
        }),
      });
      if (!response.ok) throw new Error("API error");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (done) break;
        const value = chunk.value;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) result += parsed.content;
          } catch {
            // skip
          }
        }
      }
      return result;
    };

    const generateTaunt = async (context) => {
      if (chatGenerating.value) return;
      chatGenerating.value = true;
      scrollChat();
      try {
        const text = await fetchChat([{ role: "user", content: context }]);
        if (text.trim()) {
          chatMessages.value.push({ role: "assistant", content: text.trim() });
          scrollChat();
        }
      } catch {
        // silently ignore taunt failures
      }
      chatGenerating.value = false;
    };

    const sendChat = async () => {
      const msg = chatInput.value.trim();
      if (!msg || chatGenerating.value) return;
      chatInput.value = "";
      chatMessages.value.push({ role: "user", content: msg });
      scrollChat();
      chatGenerating.value = true;
      try {
        const recentMsgs = chatMessages.value
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));
        const text = await fetchChat(recentMsgs);
        chatMessages.value.push({
          role: "assistant",
          content: text.trim() || "...",
        });
        scrollChat();
      } catch {
        chatMessages.value.push({ role: "assistant", content: "..." });
      }
      chatGenerating.value = false;
    };

    return {
      canvasRef,
      wrapperRef,
      showChat,
      chatMessages,
      chatInput,
      chatGenerating,
      chatError,
      chatMessagesRef,
      toggleChat,
      sendChat,
    };
  },
};
</script>

<style scoped>
.slime-vb-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #001100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slime-vb-wrapper canvas {
  display: block;
  image-rendering: pixelated;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  font-family: monospace;
  font-size: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #003300;
}

.chat-toggle {
  position: absolute;
  top: 56px;
  right: 12px;
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  font-size: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}
.chat-toggle:hover,
.chat-toggle.active {
  background: #003300;
}
.chat-panel {
  position: absolute;
  top: 10px;
  right: 56px;
  width: 280px;
  max-height: 350px;
  background: rgba(0, 17, 0, 0.95);
  border: 1px solid #00ff00;
  display: flex;
  flex-direction: column;
  z-index: 20;
  font-family: "Courier New", monospace;
  font-size: 12px;
}
.chat-header-bar {
  padding: 6px 10px;
  border-bottom: 1px solid #004400;
  color: #00ff00;
  font-weight: bold;
  font-size: 11px;
  text-align: center;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: 260px;
  min-height: 100px;
}
.chat-msg {
  margin: 4px 0;
  line-height: 1.4;
  word-break: break-word;
}
.chat-user .chat-prefix {
  color: #00ffff;
}
.chat-jeff .chat-prefix {
  color: #ffff00;
}
.chat-user {
  color: #00ffff;
}
.chat-jeff {
  color: #00ff00;
}
.chat-system {
  color: #006600;
  font-style: italic;
  margin: 4px 0;
}
.chat-error {
  color: #ff4444;
}
.chat-prefix {
  font-weight: bold;
  margin-right: 4px;
}
.chat-input-row {
  border-top: 1px solid #004400;
  padding: 6px;
}
.chat-input {
  width: 100%;
  background: transparent;
  border: 1px solid #004400;
  color: #00ff00;
  font-family: "Courier New", monospace;
  font-size: 12px;
  padding: 4px 6px;
  outline: none;
  box-sizing: border-box;
}
.chat-input::placeholder {
  color: rgba(0, 255, 0, 0.3);
}
.chat-input:disabled {
  opacity: 0.4;
}
.cursor-blink {
  animation: chatCursorBlink 0.6s step-end infinite;
}
@keyframes chatCursorBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
@media (max-width: 600px) {
  .chat-panel {
    width: 200px;
    max-height: 250px;
    right: 50px;
    top: 50px;
    font-size: 11px;
  }
}
</style>
