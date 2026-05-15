<template>
  <div class="disc-golf-wrapper" ref="wrapperRef">
    <canvas
      ref="canvasRef"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
      @touchstart.prevent="onTouchStart"
      @touchend.prevent="onTouchEnd"
      @touchmove.prevent="onTouchMove"
    ></canvas>
    <button class="close-btn" @click="$emit('close-game')">X</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "DiscGolfGame",
  emits: ["close-game"],
  setup() {
    const canvasRef = ref(null);
    const wrapperRef = ref(null);
    let ctx = null;
    let animFrame = null;
    let W = 800;
    let H = 600;

    // ─── Course data ───────────────────────────────────────────
    const holes = [
      {
        number: 1,
        par: 3,
        distance: 250,
        wind: { speed: 3, angle: 0 },
        trees: 4,
      },
      {
        number: 2,
        par: 3,
        distance: 300,
        wind: { speed: 5, angle: 45 },
        trees: 6,
      },
      {
        number: 3,
        par: 4,
        distance: 380,
        wind: { speed: 4, angle: 180 },
        trees: 8,
      },
      {
        number: 4,
        par: 4,
        distance: 420,
        wind: { speed: 7, angle: 270 },
        trees: 10,
      },
      {
        number: 5,
        par: 5,
        distance: 500,
        wind: { speed: 8, angle: 135 },
        trees: 12,
      },
    ];

    // ─── Game state ────────────────────────────────────────────
    const state = {
      phase: "intro", // intro, aiming, power, flight, landed, hole-done, scorecard
      currentHole: 0,
      throws: 0,
      scores: [], // strokes per hole
      aimAngle: 0, // radians, 0 = straight
      power: 0,
      powerDir: 1,
      powerHeld: false,

      // disc flight
      disc: { x: 0, y: 0, z: 0 },
      discVel: { x: 0, y: 0, z: 0 },
      flightTime: 0,
      landingPos: null,
      distanceFromBasket: 0,
      distanceFromTee: 0, // where disc currently is (for multi-throw)
      currentTeeX: 0,
      currentTeeZ: 0,

      // trees generated per hole
      treesLeft: [],
      treesRight: [],

      // intro timer
      introTimer: 0,
      landedTimer: 0,

      // input
      mouseX: 0,
      mouseY: 0,
      mouseDown: false,
      aimDragStart: null,
    };

    // ─── Helpers ───────────────────────────────────────────────
    const hole = () => holes[state.currentHole];

    const generateTrees = () => {
      const h = hole();
      state.treesLeft = [];
      state.treesRight = [];
      const count = h.trees;
      for (let i = 0; i < count; i++) {
        const z = 30 + Math.random() * (h.distance + 40);
        const offsetL = 60 + Math.random() * 80;
        const offsetR = 60 + Math.random() * 80;
        const heightL = 40 + Math.random() * 30;
        const heightR = 40 + Math.random() * 30;
        state.treesLeft.push({ z, offset: -offsetL, height: heightL });
        state.treesRight.push({ z, offset: offsetR, height: heightR });
      }
    };

    const scoreName = (strokes, par) => {
      const diff = strokes - par;
      if (strokes === 1) return "ACE!";
      if (diff <= -3) return "Albatross";
      if (diff === -2) return "Eagle";
      if (diff === -1) return "Birdie";
      if (diff === 0) return "Par";
      if (diff === 1) return "Bogey";
      if (diff === 2) return "Double Bogey";
      if (diff === 3) return "Triple Bogey";
      return `+${diff}`;
    };

    const startHole = () => {
      state.phase = "intro";
      state.throws = 0;
      state.introTimer = 2.5;
      state.aimAngle = 0;
      state.power = 0;
      state.currentTeeX = 0;
      state.currentTeeZ = 0;
      state.distanceFromTee = 0;
      state.landingPos = null;
      generateTrees();
    };

    const beginAiming = () => {
      state.phase = "aiming";
      state.power = 0;
      state.powerDir = 1;
    };

    const startPower = () => {
      state.phase = "power";
      state.power = 0;
      state.powerDir = 1;
      state.powerHeld = true;
    };

    const releasePower = () => {
      if (state.phase !== "power") return;
      state.powerHeld = false;
      launchDisc();
    };

    const launchDisc = () => {
      state.phase = "flight";
      state.throws++;
      const h = hole();
      const pwr = state.power / 100;
      const maxDist = 180 + pwr * 380; // ft range
      const speed = maxDist / 60; // units per frame (at 60fps ~ 1 sec flight)

      const ang = state.aimAngle;
      // Wind effect
      const windRad = (h.wind.angle * Math.PI) / 180;
      const windEffect = h.wind.speed * 0.4;

      state.disc = { x: state.currentTeeX, y: 0, z: state.currentTeeZ };
      state.discVel = {
        x: Math.sin(ang) * speed + Math.sin(windRad) * windEffect * 0.05,
        y: speed * 0.35, // upward
        z: Math.cos(ang) * speed + Math.cos(windRad) * windEffect * 0.05,
      };
      state.flightTime = 0;
    };

    const updateFlight = () => {
      const gravity = 0.25;
      const h = hole();
      const windRad = (h.wind.angle * Math.PI) / 180;
      const windPush = h.wind.speed * 0.003;

      state.disc.x += state.discVel.x;
      state.disc.y += state.discVel.y;
      state.disc.z += state.discVel.z;

      // Wind pushes laterally and along z
      state.discVel.x += Math.sin(windRad) * windPush;
      state.discVel.z += Math.cos(windRad) * windPush * 0.3;

      // Gravity
      state.discVel.y -= gravity;

      // Slight fade (disc curves left at end of flight)
      if (state.discVel.y < 0) {
        state.discVel.x -= 0.02;
      }

      // Slight turn at start
      if (state.flightTime < 15) {
        state.discVel.x += 0.008;
      }

      state.flightTime++;

      // Landed
      if (state.disc.y <= 0 && state.flightTime > 5) {
        state.disc.y = 0;
        // Rolling
        state.disc.z += state.discVel.z * 0.2;
        state.disc.x += state.discVel.x * 0.15;

        state.landingPos = { x: state.disc.x, z: state.disc.z };
        state.currentTeeX = state.disc.x;
        state.currentTeeZ = state.disc.z;

        // Distance from basket
        const bx = 0;
        const bz = h.distance;
        const dx = state.landingPos.x - bx;
        const dz = state.landingPos.z - bz;
        state.distanceFromBasket = Math.sqrt(dx * dx + dz * dz);

        if (state.distanceFromBasket < 15) {
          // In the basket!
          state.phase = "hole-done";
          state.scores.push(state.throws);
          state.landedTimer = 2.5;
        } else {
          state.phase = "landed";
          state.landedTimer = 1.5;
        }
      }
    };

    // ─── 3D Projection ────────────────────────────────────────
    const VP_Y = H * 0.35; // vanishing point Y
    const VP_X = () => W / 2; // vanishing point X

    const project3D = (wx, wy, wz, holeDist) => {
      // wx = lateral offset, wy = height, wz = depth (0=tee, holeDist=basket)
      const maxZ = holeDist + 80;
      const t = Math.min(wz / maxZ, 1.2);
      const perspective = Math.max(1 - t * 0.85, 0.01);

      const groundY = VP_Y + (H - VP_Y) * (1 - t);
      const screenX = VP_X() + wx * perspective * 3;
      const screenY = groundY - wy * perspective * 2.5;
      return { x: screenX, y: screenY, scale: perspective };
    };

    // ─── Drawing ──────────────────────────────────────────────
    const drawSky = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, VP_Y + 50);
      grad.addColorStop(0, "#1a3a5c");
      grad.addColorStop(0.5, "#3a7abd");
      grad.addColorStop(1, "#87ceeb");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, VP_Y + 50);

      // Clouds
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      const cloudPositions = [
        [W * 0.15, VP_Y * 0.3, 80, 25],
        [W * 0.55, VP_Y * 0.2, 100, 30],
        [W * 0.8, VP_Y * 0.45, 70, 20],
        [W * 0.35, VP_Y * 0.55, 60, 18],
      ];
      for (const [cx, cy, cw, ch] of cloudPositions) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawGround = () => {
      // Main ground
      const grad = ctx.createLinearGradient(0, VP_Y, 0, H);
      grad.addColorStop(0, "#2d5a1e");
      grad.addColorStop(0.3, "#3a7a28");
      grad.addColorStop(1, "#4a8a35");
      ctx.fillStyle = grad;
      ctx.fillRect(0, VP_Y - 5, W, H - VP_Y + 5);

      // Fairway - a lighter strip down the middle
      ctx.beginPath();
      // Vanishing point at top, wider at bottom
      const fairwayTopW = 30;
      const fairwayBotW = W * 0.45;
      ctx.moveTo(VP_X() - fairwayTopW, VP_Y);
      ctx.lineTo(VP_X() + fairwayTopW, VP_Y);
      ctx.lineTo(W / 2 + fairwayBotW, H);
      ctx.lineTo(W / 2 - fairwayBotW, H);
      ctx.closePath();
      const fGrad = ctx.createLinearGradient(0, VP_Y, 0, H);
      fGrad.addColorStop(0, "#3a7a30");
      fGrad.addColorStop(1, "#5aaa45");
      ctx.fillStyle = fGrad;
      ctx.fill();

      // Fairway stripes (mowed lines)
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const y = VP_Y + (H - VP_Y) * t;
        const halfW = fairwayTopW + (fairwayBotW - fairwayTopW) * t;
        if (i % 2 === 0) {
          ctx.fillStyle = "rgba(0,0,0,0.03)";
          const y2 = VP_Y + (H - VP_Y) * ((i + 1) / 20);
          const halfW2 =
            fairwayTopW + (fairwayBotW - fairwayTopW) * ((i + 1) / 20);
          ctx.beginPath();
          ctx.moveTo(VP_X() - halfW, y);
          ctx.lineTo(VP_X() + halfW, y);
          ctx.lineTo(VP_X() + halfW2, y2);
          ctx.lineTo(VP_X() - halfW2, y2);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Rough on the sides (darker)
      ctx.fillStyle = "rgba(0,40,0,0.15)";
      // Left rough
      ctx.beginPath();
      ctx.moveTo(0, VP_Y);
      ctx.lineTo(VP_X() - fairwayTopW, VP_Y);
      ctx.lineTo(W / 2 - fairwayBotW, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      // Right rough
      ctx.beginPath();
      ctx.moveTo(W, VP_Y);
      ctx.lineTo(VP_X() + fairwayTopW, VP_Y);
      ctx.lineTo(W / 2 + fairwayBotW, H);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    };

    const drawTeePad = () => {
      const h = hole();
      // Tee pad near the bottom of screen
      const tp = project3D(0, 0, 0, h.distance);
      const tp2 = project3D(0, 0, 5, h.distance);
      const padW = 60 * tp.scale;
      const padH = (tp.y - tp2.y) * 1.5;

      ctx.fillStyle = "#8a8a7a";
      ctx.fillRect(tp.x - padW, tp.y - padH, padW * 2, padH);
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.strokeRect(tp.x - padW, tp.y - padH, padW * 2, padH);
    };

    const drawTree = (wx, wz, treeHeight, holeDist) => {
      const base = project3D(wx, 0, wz, holeDist);
      const top = project3D(wx, treeHeight, wz, holeDist);

      if (base.x < -50 || base.x > W + 50) return;
      if (base.scale <= 0) return;

      // Trunk
      const trunkW = 4 * base.scale;
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(base.x - trunkW / 2, top.y, trunkW, base.y - top.y);

      // Foliage - layered circles
      const foliageR = 18 * base.scale;
      const colors = ["#1a5a1a", "#2a6a2a", "#1e6e1e"];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          base.x + (i - 1) * foliageR * 0.4,
          top.y + foliageR * 0.2 * i,
          foliageR * (1 - i * 0.15),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = colors[i];
        ctx.fill();
      }
    };

    const drawTrees = () => {
      const h = hole();
      const allTrees = [...state.treesLeft, ...state.treesRight];
      // Sort back to front
      allTrees.sort((a, b) => b.z - a.z);
      for (const t of allTrees) {
        drawTree(t.offset, t.z, t.height, h.distance);
      }
    };

    const drawBasket = () => {
      const h = hole();
      const base = project3D(0, 0, h.distance, h.distance);
      const poleTop = project3D(0, 25, h.distance, h.distance);
      const chainTop = project3D(0, 22, h.distance, h.distance);

      if (base.scale < 0.02) return;

      // Pole
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = Math.max(2 * base.scale, 1);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(poleTop.x, poleTop.y);
      ctx.stroke();

      // Basket top (deflector)
      const topR = 10 * base.scale;
      ctx.fillStyle = "#ddd";
      ctx.beginPath();
      ctx.ellipse(poleTop.x, poleTop.y, topR, topR * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Chains
      ctx.strokeStyle = "#bbb";
      ctx.lineWidth = Math.max(1, 1 * base.scale);
      const chainR = 8 * base.scale;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(poleTop.x, poleTop.y);
        ctx.lineTo(
          chainTop.x + Math.cos(angle) * chainR,
          chainTop.y + Math.abs(Math.sin(angle)) * chainR * 0.4 + chainR * 0.8
        );
        ctx.stroke();
      }

      // Tray
      const trayY = chainTop.y + chainR * 0.8 + chainR * 0.4;
      ctx.fillStyle = "#999";
      ctx.beginPath();
      ctx.ellipse(
        base.x,
        trayY,
        chainR * 1.2,
        chainR * 0.35,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = "#777";
      ctx.stroke();
    };

    const drawDisc = () => {
      if (state.phase !== "flight") return;
      const h = hole();
      const p = project3D(state.disc.x, state.disc.y, state.disc.z, h.distance);

      if (p.scale < 0.01) return;

      const r = Math.max(8 * p.scale, 2);

      // Disc shadow on ground
      const shadow = project3D(state.disc.x, 0, state.disc.z, h.distance);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(shadow.x, shadow.y, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Disc body
      ctx.fillStyle = "#ff4500";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#cc3700";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Disc highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.ellipse(
        p.x - r * 0.2,
        p.y - r * 0.15,
        r * 0.4,
        r * 0.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const drawLandingMarker = () => {
      if (!state.landingPos) return;
      if (
        state.phase !== "landed" &&
        state.phase !== "aiming" &&
        state.phase !== "power"
      )
        return;

      const h = hole();
      const p = project3D(
        state.landingPos.x,
        0,
        state.landingPos.z,
        h.distance
      );
      if (p.scale <= 0) return;
      const r = Math.max(6 * p.scale, 2);

      // Pulsing ring
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.5 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Mini disc on ground
      ctx.fillStyle = "#ff4500";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawAimArrow = () => {
      if (state.phase !== "aiming" && state.phase !== "power") return;

      const h = hole();
      // Draw aim direction from current tee position
      const startP = project3D(
        state.currentTeeX,
        3,
        state.currentTeeZ,
        h.distance
      );
      const aimDist = 40;
      const endX = state.currentTeeX + Math.sin(state.aimAngle) * aimDist;
      const endZ = state.currentTeeZ + Math.cos(state.aimAngle) * aimDist;
      const endP = project3D(endX, 3, endZ, h.distance);

      // Dashed line
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startP.x, startP.y);
      ctx.lineTo(endP.x, endP.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head
      const angle = Math.atan2(endP.y - startP.y, endP.x - startP.x);
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.moveTo(endP.x, endP.y);
      ctx.lineTo(
        endP.x - 10 * Math.cos(angle - 0.4),
        endP.y - 10 * Math.sin(angle - 0.4)
      );
      ctx.lineTo(
        endP.x - 10 * Math.cos(angle + 0.4),
        endP.y - 10 * Math.sin(angle + 0.4)
      );
      ctx.closePath();
      ctx.fill();

      // Player figure (simple)
      const playerP = project3D(
        state.currentTeeX,
        0,
        state.currentTeeZ,
        h.distance
      );
      const ps = playerP.scale;
      if (ps <= 0) return;
      // Body
      ctx.fillStyle = "#333";
      ctx.fillRect(playerP.x - 4 * ps, playerP.y - 30 * ps, 8 * ps, 20 * ps);
      // Head
      ctx.fillStyle = "#daa";
      ctx.beginPath();
      ctx.arc(playerP.x, playerP.y - 34 * ps, 5 * ps, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.strokeStyle = "#333";
      ctx.lineWidth = Math.max(2 * ps, 1);
      ctx.beginPath();
      ctx.moveTo(playerP.x, playerP.y - 10 * ps);
      ctx.lineTo(playerP.x - 5 * ps, playerP.y);
      ctx.moveTo(playerP.x, playerP.y - 10 * ps);
      ctx.lineTo(playerP.x + 5 * ps, playerP.y);
      ctx.stroke();
    };

    // ─── HUD ──────────────────────────────────────────────────
    const drawHUD = () => {
      const h = hole();
      ctx.save();

      // HUD background strip at top
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, W, 44);

      ctx.font = "bold 16px 'Courier New', monospace";
      ctx.fillStyle = "#00ff00";
      ctx.textBaseline = "middle";

      // Hole info
      ctx.textAlign = "left";
      ctx.fillText(`HOLE ${h.number}/5`, 12, 22);

      // Par
      ctx.fillText(`PAR ${h.par}`, 120, 22);

      // Distance
      const remaining =
        state.phase === "aiming" || state.phase === "power"
          ? Math.round(state.distanceFromBasket || h.distance)
          : state.phase === "flight"
          ? "..."
          : Math.round(state.distanceFromBasket || h.distance);
      ctx.fillText(`${remaining} ft`, 210, 22);

      // Throws
      ctx.fillText(`THROW ${state.throws}`, 310, 22);

      // Wind
      ctx.textAlign = "right";
      const windArrow = getWindArrow(h.wind.angle);
      ctx.fillText(`WIND ${h.wind.speed}mph ${windArrow}`, W - 12, 22);

      ctx.restore();
    };

    const getWindArrow = (angle) => {
      const arrows = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
      const idx = Math.round(angle / 45) % 8;
      return arrows[idx];
    };

    const drawPowerMeter = () => {
      if (state.phase !== "power" && state.phase !== "aiming") return;

      const meterX = W / 2 - 100;
      const meterY = H - 50;
      const meterW = 200;
      const meterH = 20;

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(meterX - 4, meterY - 4, meterW + 8, meterH + 8);

      // Meter background
      ctx.fillStyle = "#222";
      ctx.fillRect(meterX, meterY, meterW, meterH);

      // Power fill
      if (state.phase === "power") {
        const fillW = (state.power / 100) * meterW;
        const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
        grad.addColorStop(0, "#00ff00");
        grad.addColorStop(0.5, "#ffff00");
        grad.addColorStop(0.8, "#ff8800");
        grad.addColorStop(1, "#ff0000");
        ctx.fillStyle = grad;
        ctx.fillRect(meterX, meterY, fillW, meterH);
      }

      // Border
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(meterX, meterY, meterW, meterH);

      // Label
      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      if (state.phase === "aiming") {
        ctx.fillText("CLICK & HOLD TO THROW", W / 2, meterY + meterH + 8);
      } else {
        ctx.fillText("RELEASE TO THROW", W / 2, meterY + meterH + 8);
      }

      // Aim instructions
      if (state.phase === "aiming") {
        ctx.fillText("← / → or DRAG to aim", W / 2, meterY - 20);
      }
    };

    const drawIntro = () => {
      if (state.phase !== "intro") return;
      const h = hole();

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 36px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`HOLE ${h.number}`, W / 2, H / 2 - 50);

      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillText(`Par ${h.par}  |  ${h.distance} ft`, W / 2, H / 2 + 10);

      ctx.font = "16px 'Courier New', monospace";
      const windArrow = getWindArrow(h.wind.angle);
      ctx.fillText(`Wind: ${h.wind.speed} mph ${windArrow}`, W / 2, H / 2 + 50);
    };

    const drawHoleDone = () => {
      if (state.phase !== "hole-done") return;
      const h = hole();
      const name = scoreName(state.throws, h.par);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 32px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, W / 2, H / 2 - 30);

      ctx.font = "22px 'Courier New', monospace";
      ctx.fillText(
        `${state.throws} throw${state.throws > 1 ? "s" : ""} on a Par ${h.par}`,
        W / 2,
        H / 2 + 15
      );

      ctx.font = "16px 'Courier New', monospace";
      ctx.fillStyle = "#00cc00";
      ctx.fillText("Click to continue", W / 2, H / 2 + 55);
    };

    const drawScorecard = () => {
      if (state.phase !== "scorecard") return;

      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ROUND COMPLETE", W / 2, 60);

      // Table
      const startY = 110;
      const rowH = 36;
      ctx.font = "bold 16px 'Courier New', monospace";

      // Header
      ctx.textAlign = "center";
      ctx.fillText("HOLE", W / 2 - 140, startY);
      ctx.fillText("PAR", W / 2 - 40, startY);
      ctx.fillText("SCORE", W / 2 + 40, startY);
      ctx.fillText("RESULT", W / 2 + 150, startY);

      // Separator
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, startY + 15);
      ctx.lineTo(W / 2 + 210, startY + 15);
      ctx.stroke();

      ctx.font = "16px 'Courier New', monospace";
      let totalPar = 0;
      let totalScore = 0;

      for (let i = 0; i < state.scores.length; i++) {
        const y = startY + rowH * (i + 1);
        const h = holes[i];
        const s = state.scores[i];
        totalPar += h.par;
        totalScore += s;

        ctx.fillStyle = "#00ff00";
        ctx.fillText(`${h.number}`, W / 2 - 140, y);
        ctx.fillText(`${h.par}`, W / 2 - 40, y);

        // Color the score
        const diff = s - h.par;
        if (diff < 0) ctx.fillStyle = "#00ffff";
        else if (diff === 0) ctx.fillStyle = "#00ff00";
        else ctx.fillStyle = "#ff6600";

        ctx.fillText(`${s}`, W / 2 + 40, y);
        ctx.fillText(scoreName(s, h.par), W / 2 + 150, y);
      }

      // Total
      const totalY = startY + rowH * (state.scores.length + 1) + 10;
      ctx.strokeStyle = "#00ff00";
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, totalY - 15);
      ctx.lineTo(W / 2 + 210, totalY - 15);
      ctx.stroke();

      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillStyle = "#00ff00";
      ctx.fillText("TOTAL", W / 2 - 140, totalY);
      ctx.fillText(`${totalPar}`, W / 2 - 40, totalY);

      const totalDiff = totalScore - totalPar;
      if (totalDiff < 0) ctx.fillStyle = "#00ffff";
      else if (totalDiff === 0) ctx.fillStyle = "#00ff00";
      else ctx.fillStyle = "#ff6600";

      ctx.fillText(`${totalScore}`, W / 2 + 40, totalY);
      const diffStr =
        totalDiff === 0
          ? "EVEN"
          : totalDiff > 0
          ? `+${totalDiff}`
          : `${totalDiff}`;
      ctx.fillText(diffStr, W / 2 + 150, totalY);

      ctx.fillStyle = "#00ff00";
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillText("Click to play again", W / 2, H - 60);
    };

    // ─── Main loop ────────────────────────────────────────────
    let lastTime = 0;

    const gameLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 16.67, 3); // normalize to ~60fps
      lastTime = timestamp;

      // Update
      if (state.phase === "intro") {
        state.introTimer -= dt * 0.016;
        if (state.introTimer <= 0) {
          beginAiming();
          // Calculate initial distance
          const h = hole();
          state.distanceFromBasket = h.distance;
        }
      }

      if (state.phase === "power" && state.powerHeld) {
        state.power += state.powerDir * 1.2 * dt;
        if (state.power >= 100) {
          state.power = 100;
          state.powerDir = -1;
        }
        if (state.power <= 0) {
          state.power = 0;
          state.powerDir = 1;
        }
      }

      if (state.phase === "flight") {
        updateFlight(dt);
      }

      if (state.phase === "landed") {
        state.landedTimer -= dt * 0.016;
        if (state.landedTimer <= 0) {
          state.aimAngle = 0;
          beginAiming();
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H);
      drawSky();
      drawGround();
      drawTeePad();
      drawTrees();
      drawBasket();
      drawLandingMarker();
      drawAimArrow();
      drawDisc();
      drawHUD();
      drawPowerMeter();
      drawIntro();
      drawHoleDone();
      drawScorecard();

      animFrame = requestAnimationFrame(gameLoop);
    };

    // ─── Input handlers ───────────────────────────────────────
    let keysDown = {};

    const onKeyDown = (e) => {
      keysDown[e.key] = true;
      if (state.phase === "aiming" || state.phase === "power") {
        if (e.key === "ArrowLeft" || e.key === "a") {
          state.aimAngle -= 0.04;
        }
        if (e.key === "ArrowRight" || e.key === "d") {
          state.aimAngle += 0.04;
        }
        state.aimAngle = Math.max(
          -Math.PI * 0.9,
          Math.min(Math.PI * 0.9, state.aimAngle)
        );
      }
    };

    const onKeyUp = (e) => {
      keysDown[e.key] = false;
    };

    const getCanvasPos = (clientX, clientY) => {
      if (!canvasRef.value) return { x: 0, y: 0 };
      const rect = canvasRef.value.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * W,
        y: ((clientY - rect.top) / rect.height) * H,
      };
    };

    const onMouseDown = (e) => {
      state.mouseDown = true;
      const pos = getCanvasPos(e.clientX, e.clientY);
      state.mouseX = pos.x;
      state.mouseY = pos.y;
      handlePointerDown(pos);
    };

    const onMouseUp = () => {
      state.mouseDown = false;
      handlePointerUp();
    };

    const onMouseMove = (e) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      handlePointerMove(pos);
    };

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      state.mouseDown = true;
      const pos = getCanvasPos(touch.clientX, touch.clientY);
      state.mouseX = pos.x;
      state.mouseY = pos.y;
      handlePointerDown(pos);
    };

    const onTouchEnd = () => {
      state.mouseDown = false;
      handlePointerUp();
    };

    const onTouchMove = (e) => {
      const touch = e.touches[0];
      const pos = getCanvasPos(touch.clientX, touch.clientY);
      handlePointerMove(pos);
    };

    const handlePointerDown = (pos) => {
      if (state.phase === "aiming") {
        state.aimDragStart = pos.x;
        startPower();
      } else if (state.phase === "hole-done") {
        if (state.currentHole < holes.length - 1) {
          state.currentHole++;
          startHole();
        } else {
          state.phase = "scorecard";
        }
      } else if (state.phase === "scorecard") {
        // Restart
        state.currentHole = 0;
        state.scores = [];
        startHole();
      }
    };

    const handlePointerUp = () => {
      if (state.phase === "power") {
        releasePower();
      }
      state.aimDragStart = null;
    };

    const handlePointerMove = (pos) => {
      state.mouseX = pos.x;
      state.mouseY = pos.y;

      if (
        state.aimDragStart !== null &&
        (state.phase === "power" || state.phase === "aiming")
      ) {
        const dx = pos.x - state.aimDragStart;
        state.aimAngle = Math.max(
          -Math.PI * 0.9,
          Math.min(Math.PI * 0.9, dx * 0.005)
        );
      }
    };

    // ─── Lifecycle ────────────────────────────────────────────
    const resizeCanvas = () => {
      if (!canvasRef.value || !wrapperRef.value) return;
      const wrapper = wrapperRef.value;
      const rect = wrapper.getBoundingClientRect();
      // Maintain aspect ratio
      const aspect = 4 / 3;
      let cw = rect.width;
      let ch = cw / aspect;
      if (ch > rect.height) {
        ch = rect.height;
        cw = ch * aspect;
      }
      canvasRef.value.style.width = cw + "px";
      canvasRef.value.style.height = ch + "px";
      canvasRef.value.width = W;
      canvasRef.value.height = H;
    };

    onMounted(() => {
      ctx = canvasRef.value.getContext("2d");
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      startHole();
      lastTime = performance.now();
      animFrame = requestAnimationFrame(gameLoop);
    });

    onUnmounted(() => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    });

    return {
      canvasRef,
      wrapperRef,
      onMouseDown,
      onMouseUp,
      onMouseMove,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
    };
  },
};
</script>

<style scoped>
.disc-golf-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.disc-golf-wrapper canvas {
  display: block;
  cursor: crosshair;
  image-rendering: pixelated;
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
