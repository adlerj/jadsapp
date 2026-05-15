<template>
  <div
    class="tabletop-wrapper"
    @keydown.space.prevent="onSpace"
    tabindex="0"
    ref="wrapperRef"
  >
    <button class="close-btn" @click="$emit('close-game')">X</button>

    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'dice' }"
        @click="activeTab = 'dice'"
      >
        DICE ROLLER
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'score' }"
        @click="activeTab = 'score'"
      >
        SCORE COUNTER
      </button>
    </div>

    <!-- DICE ROLLER TAB -->
    <div v-if="activeTab === 'dice'" class="dice-tab" @click="rollDice">
      <div class="dice-sidebar">
        <button
          v-for="die in diceTypes"
          :key="die.sides"
          class="die-select-btn"
          :class="{ selected: selectedDie === die.sides }"
          @click.stop="selectedDie = die.sides"
        >
          d{{ die.sides }}
        </button>
      </div>

      <div class="dice-main">
        <div class="die-stage">
          <div
            class="die-shape"
            :class="[
              dieShapeClass,
              {
                rolling: isRolling,
                'crit-fail': isCritFail,
                'nat-max': isNatMax,
              },
            ]"
          >
            <span
              class="die-number"
              :class="{ 'crit-fail': isCritFail, 'nat-max': isNatMax }"
            >
              {{ displayNumber }}
            </span>
          </div>
        </div>

        <div class="crit-text" v-if="!isRolling && lastResult !== null">
          <span v-if="isCritFail" class="crit-fail-text">CRITICAL FAIL!</span>
          <span v-else-if="isNatMax" class="nat-max-text"
            >NATURAL {{ selectedDie }}!</span
          >
        </div>

        <p class="roll-instruction">Click or press Space to roll</p>

        <div class="roll-history" v-if="rollHistory.length > 0">
          <span class="history-label">Last rolls:</span>
          <span
            v-for="(entry, i) in rollHistory"
            :key="i"
            class="history-entry"
            :class="{
              'hist-fail': entry.value === 1,
              'hist-max': entry.value === entry.max,
            }"
          >
            {{ entry.value }}
          </span>
        </div>
      </div>
    </div>

    <!-- SCORE COUNTER TAB -->
    <div v-if="activeTab === 'score'" class="score-tab">
      <div class="score-controls">
        <div class="score-controls-row">
          <label class="target-label">
            Target:
            <input
              type="number"
              v-model.number="targetScore"
              class="target-input"
              min="1"
            />
          </label>
          <div class="step-selector">
            Step:
            <button
              v-for="s in [1, 5, 10]"
              :key="s"
              class="step-btn"
              :class="{ active: incrementStep === s }"
              @click="incrementStep = s"
            >
              {{ s }}
            </button>
          </div>
        </div>
        <div class="score-controls-row">
          <button
            class="ctrl-btn"
            @click="addPlayer"
            :disabled="players.length >= 8"
          >
            ADD PLAYER
          </button>
          <button class="ctrl-btn" @click="addRound">NEW ROUND</button>
          <button class="ctrl-btn danger" @click="resetScores">
            RESET SCORES
          </button>
          <button class="ctrl-btn danger" @click="clearAll">CLEAR ALL</button>
        </div>
      </div>

      <div class="score-table-wrapper" v-if="players.length > 0">
        <table class="score-table">
          <thead>
            <tr>
              <th class="player-col">Player</th>
              <th v-for="(_, ri) in rounds" :key="ri" class="round-col">
                R{{ ri + 1 }}
              </th>
              <th class="total-col">Total</th>
              <th class="action-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(player, pi) in players"
              :key="player.id"
              :class="{ winner: playerTotal(pi) >= targetScore }"
            >
              <td class="player-cell">
                <span class="avatar" @click.stop="cycleAvatar(pi)">{{
                  player.avatar
                }}</span>
                <input type="text" v-model="player.name" class="name-input" />
                <span v-if="playerTotal(pi) >= targetScore" class="winner-badge"
                  >WINNER!</span
                >
                <div class="quick-btns">
                  <button class="qbtn" @click="quickAdd(pi, incrementStep)">
                    +
                  </button>
                  <button class="qbtn" @click="quickAdd(pi, -incrementStep)">
                    -
                  </button>
                </div>
              </td>
              <td v-for="(_, ri) in rounds" :key="ri" class="round-cell">
                <input
                  type="number"
                  :value="getScore(pi, ri)"
                  @input="setScore(pi, ri, $event)"
                  class="score-input"
                />
              </td>
              <td class="total-cell">{{ playerTotal(pi) }}</td>
              <td class="remove-cell">
                <button class="remove-btn" @click="removePlayer(pi)">X</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty-msg">Add players to begin tracking scores.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";

export default {
  name: "TabletopGame",
  emits: ["close-game"],
  setup() {
    const wrapperRef = ref(null);
    const activeTab = ref("dice");

    // ──────────────────────────────
    // DICE ROLLER STATE
    // ──────────────────────────────
    const diceTypes = [
      { sides: 4 },
      { sides: 6 },
      { sides: 8 },
      { sides: 10 },
      { sides: 12 },
      { sides: 20 },
    ];
    const selectedDie = ref(20);
    const displayNumber = ref(20);
    const lastResult = ref(null);
    const isRolling = ref(false);
    const rollHistory = ref([]);

    let rollTimer = null;

    const isCritFail = computed(
      () => !isRolling.value && lastResult.value === 1
    );
    const isNatMax = computed(
      () =>
        !isRolling.value &&
        lastResult.value !== null &&
        lastResult.value === selectedDie.value
    );

    const dieShapeClass = computed(() => "shape-d" + selectedDie.value);

    // Web Audio API (lazy init like GuitarStrum)
    let audioCtx = null;
    const getAudioCtx = () => {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    };

    const playRattleSound = () => {
      const ctx = getAudioCtx();
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 3000;
      filter.Q.value = 1;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      source.stop(ctx.currentTime + 0.12);
    };

    const playThudSound = () => {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    };

    const rollDice = () => {
      if (isRolling.value) return;
      isRolling.value = true;
      lastResult.value = null;

      playRattleSound();

      const max = selectedDie.value;
      const totalDuration = 1200;
      const startTime = performance.now();
      let lastCycleTime = 0;

      const cycle = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= totalDuration) {
          // Land
          const finalValue = Math.floor(Math.random() * max) + 1;
          displayNumber.value = finalValue;
          lastResult.value = finalValue;
          isRolling.value = false;
          rollHistory.value.push({ value: finalValue, max });
          if (rollHistory.value.length > 5) rollHistory.value.shift();
          playThudSound();
          return;
        }
        // Interval increases as we approach the end (slowing down)
        const progress = elapsed / totalDuration;
        const interval = 40 + progress * 200;
        if (elapsed - lastCycleTime >= interval) {
          displayNumber.value = Math.floor(Math.random() * max) + 1;
          lastCycleTime = elapsed;
        }
        rollTimer = requestAnimationFrame(cycle);
      };
      rollTimer = requestAnimationFrame(cycle);
    };

    const onSpace = () => {
      if (activeTab.value === "dice") rollDice();
    };

    // ──────────────────────────────
    // SCORE COUNTER STATE
    // ──────────────────────────────
    const avatarOptions = ["🎲", "⚔️", "🛡️", "🧙", "🐉", "👑", "💎", "🃏"];
    let playerIdCounter = 0;
    const players = ref([]);
    const rounds = ref(0);
    const scores = ref({}); // keyed by `${playerId}-${roundIndex}`
    const targetScore = ref(200);
    const incrementStep = ref(1);

    const addPlayer = () => {
      if (players.value.length >= 8) return;
      const id = ++playerIdCounter;
      players.value.push({
        id,
        name: "Player " + players.value.length + 1,
        // Fix: use template literal to avoid string concat issue
        avatar: avatarOptions[players.value.length % avatarOptions.length],
        avatarIndex: players.value.length % avatarOptions.length,
      });
      // Fix the name properly
      players.value[players.value.length - 1].name =
        "Player " + players.value.length;
    };

    const removePlayer = (pi) => {
      const player = players.value[pi];
      // Clean up scores for this player
      for (let r = 0; r < rounds.value; r++) {
        delete scores.value[player.id + "-" + r];
      }
      players.value.splice(pi, 1);
    };

    const cycleAvatar = (pi) => {
      const player = players.value[pi];
      player.avatarIndex = (player.avatarIndex + 1) % avatarOptions.length;
      player.avatar = avatarOptions[player.avatarIndex];
    };

    const addRound = () => {
      rounds.value++;
    };

    const getScore = (pi, ri) => {
      const key = players.value[pi].id + "-" + ri;
      return scores.value[key] || 0;
    };

    const setScore = (pi, ri, event) => {
      const key = players.value[pi].id + "-" + ri;
      const val = parseInt(event.target.value) || 0;
      scores.value[key] = val;
    };

    const playerTotal = (pi) => {
      const player = players.value[pi];
      let total = 0;
      for (let r = 0; r < rounds.value; r++) {
        total += scores.value[player.id + "-" + r] || 0;
      }
      return total;
    };

    const quickAdd = (pi, amount) => {
      // Add to the latest round, create one if none exist
      if (rounds.value === 0) rounds.value = 1;
      const ri = rounds.value - 1;
      const key = players.value[pi].id + "-" + ri;
      scores.value[key] = (scores.value[key] || 0) + amount;
    };

    const resetScores = () => {
      if (!window.confirm("Reset all scores? This cannot be undone.")) return;
      scores.value = {};
      rounds.value = 0;
    };

    const clearAll = () => {
      if (
        !window.confirm("Remove all players and scores? This cannot be undone.")
      )
        return;
      players.value = [];
      scores.value = {};
      rounds.value = 0;
      playerIdCounter = 0;
    };

    onMounted(() => {
      nextTick(() => {
        if (wrapperRef.value) wrapperRef.value.focus();
      });
    });

    onUnmounted(() => {
      if (rollTimer) cancelAnimationFrame(rollTimer);
      if (audioCtx) audioCtx.close();
    });

    return {
      wrapperRef,
      activeTab,
      // Dice
      diceTypes,
      selectedDie,
      displayNumber,
      lastResult,
      isRolling,
      rollHistory,
      isCritFail,
      isNatMax,
      dieShapeClass,
      rollDice,
      onSpace,
      // Score
      players,
      rounds,
      targetScore,
      incrementStep,
      avatarOptions,
      addPlayer,
      removePlayer,
      cycleAvatar,
      addRound,
      getScore,
      setScore,
      playerTotal,
      quickAdd,
      resetScores,
      clearAll,
    };
  },
};
</script>

<style scoped>
/* ── BASE ── */
.tabletop-wrapper {
  width: 100%;
  height: 100%;
  background: #001100;
  color: #00ff00;
  font-family: "Courier New", monospace;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  outline: none;
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
  z-index: 20;
}
.close-btn:hover {
  background: #00ff00;
  color: #000;
}

/* ── TAB BAR ── */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #00ff00;
  flex-shrink: 0;
}
.tab-btn {
  flex: 1;
  padding: 12px 0;
  background: transparent;
  color: #00ff00;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: "Courier New", monospace;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover {
  background: rgba(0, 255, 0, 0.08);
}
.tab-btn.active {
  background: #00ff00;
  color: #001100;
  border-bottom-color: #00ff00;
}

/* ── DICE TAB ── */
.dice-tab {
  flex: 1;
  display: flex;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
}

.dice-sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 10px;
  border-right: 1px solid #00550055;
  flex-shrink: 0;
  width: 64px;
  align-items: center;
  justify-content: center;
}

.die-select-btn {
  width: 48px;
  height: 40px;
  background: transparent;
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: "Courier New", monospace;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s;
}
.die-select-btn:hover {
  background: rgba(0, 255, 0, 0.15);
}
.die-select-btn.selected {
  background: #00ff00;
  color: #001100;
}

.dice-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 12px;
}

/* ── DIE SHAPE ── */
.die-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
}

.die-shape {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #00ff00;
  background: #001a00;
  position: relative;
  transition: clip-path 0.3s;
}

/* Approximate polygon shapes per die type */
.shape-d4 {
  clip-path: polygon(50% 5%, 5% 95%, 95% 95%);
}
.shape-d6 {
  clip-path: none;
  border-radius: 8px;
}
.shape-d8 {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
.shape-d10 {
  clip-path: polygon(50% 0%, 93% 38%, 80% 95%, 20% 95%, 7% 38%);
}
.shape-d12 {
  clip-path: polygon(
    50% 0%,
    84% 15%,
    100% 50%,
    84% 85%,
    50% 100%,
    16% 85%,
    0% 50%,
    16% 15%
  );
}
.shape-d20 {
  clip-path: polygon(
    50% 0%,
    79% 10%,
    100% 38%,
    100% 62%,
    79% 90%,
    50% 100%,
    21% 90%,
    0% 62%,
    0% 38%,
    21% 10%
  );
}

/* Rolling animation */
.die-shape.rolling {
  animation: die-bounce 1.2s ease-out;
}

@keyframes die-bounce {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  15% {
    transform: translateY(-50px) rotate(45deg);
  }
  30% {
    transform: translateY(-25px) rotate(120deg);
  }
  45% {
    transform: translateY(-40px) rotate(200deg);
  }
  60% {
    transform: translateY(-10px) rotate(300deg);
  }
  75% {
    transform: translateY(-20px) rotate(350deg);
  }
  90% {
    transform: translateY(-5px) rotate(358deg);
  }
  100% {
    transform: translateY(0) rotate(360deg);
  }
}

.die-shape.crit-fail {
  border-color: #ff3333;
  box-shadow: 0 0 20px rgba(255, 51, 51, 0.6),
    inset 0 0 15px rgba(255, 51, 51, 0.15);
}
.die-shape.nat-max {
  border-color: #ffd700;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.7),
    inset 0 0 15px rgba(255, 215, 0, 0.15);
}

.die-number {
  font-size: 48px;
  font-weight: bold;
  color: #00ff00;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  z-index: 1;
}
.die-number.crit-fail {
  color: #ff3333;
  text-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
}
.die-number.nat-max {
  color: #ffd700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
}

.crit-text {
  height: 28px;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}
.crit-fail-text {
  color: #ff3333;
  text-shadow: 0 0 8px rgba(255, 51, 51, 0.5);
}
.nat-max-text {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.roll-instruction {
  color: #007700;
  font-size: 13px;
  margin: 0;
}

.roll-history {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.history-label {
  color: #005500;
  font-size: 13px;
}
.history-entry {
  font-size: 18px;
  font-weight: bold;
  color: #00aa00;
}
.history-entry.hist-fail {
  color: #ff3333;
}
.history-entry.hist-max {
  color: #ffd700;
}

/* ── SCORE TAB ── */
.score-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 12px;
  overflow: hidden;
}

.score-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.score-controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.target-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.target-input {
  width: 64px;
  background: transparent;
  border: 1px solid #00ff00;
  color: #00ff00;
  font-family: "Courier New", monospace;
  font-size: 14px;
  padding: 4px 6px;
  caret-color: #00ff00;
  text-align: center;
}

.step-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.step-btn {
  background: transparent;
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: "Courier New", monospace;
  font-size: 12px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.step-btn:hover {
  background: rgba(0, 255, 0, 0.15);
}
.step-btn.active {
  background: #00ff00;
  color: #001100;
}

.ctrl-btn {
  background: transparent;
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: bold;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.ctrl-btn:hover:not(:disabled) {
  background: #00ff00;
  color: #001100;
}
.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.ctrl-btn.danger {
  border-color: #ff3333;
  color: #ff3333;
}
.ctrl-btn.danger:hover {
  background: #ff3333;
  color: #001100;
}

/* ── SCORE TABLE ── */
.score-table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid #00550055;
}

/* Custom scrollbar */
.score-table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.score-table-wrapper::-webkit-scrollbar-track {
  background: #001a00;
}
.score-table-wrapper::-webkit-scrollbar-thumb {
  background: #005500;
  border-radius: 3px;
}

.score-table {
  border-collapse: collapse;
  min-width: 100%;
  font-size: 13px;
}

.score-table th,
.score-table td {
  border: 1px solid #00550055;
  padding: 6px 8px;
  text-align: center;
  white-space: nowrap;
}

.score-table th {
  background: #002200;
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: bold;
  font-size: 12px;
}

.player-col {
  text-align: left;
  min-width: 180px;
  position: sticky;
  left: 0;
  z-index: 3 !important;
  background: #002200 !important;
}

.player-cell {
  text-align: left;
  position: sticky;
  left: 0;
  background: #001100;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.avatar {
  cursor: pointer;
  font-size: 18px;
  user-select: none;
  flex-shrink: 0;
}

.name-input {
  background: transparent;
  border: 1px solid transparent;
  color: #00ff00;
  font-family: "Courier New", monospace;
  font-size: 13px;
  padding: 2px 4px;
  width: 80px;
  caret-color: #00ff00;
}
.name-input:focus {
  border-color: #00ff00;
  outline: none;
}

.winner-badge {
  color: #ffd700;
  font-weight: bold;
  font-size: 10px;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  flex-shrink: 0;
}

.quick-btns {
  display: flex;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}
.qbtn {
  background: transparent;
  color: #00ff00;
  border: 1px solid #00ff00;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: bold;
  width: 22px;
  height: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.qbtn:hover {
  background: #00ff00;
  color: #001100;
}

.round-col {
  min-width: 56px;
}

.score-input {
  background: transparent;
  border: 1px solid transparent;
  color: #00ff00;
  font-family: "Courier New", monospace;
  font-size: 13px;
  width: 44px;
  text-align: center;
  padding: 2px;
  caret-color: #00ff00;
}
.score-input:focus {
  border-color: #00ff00;
  outline: none;
}

/* Remove number input spinners */
.score-input::-webkit-inner-spin-button,
.score-input::-webkit-outer-spin-button,
.target-input::-webkit-inner-spin-button,
.target-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.score-input,
.target-input {
  -moz-appearance: textfield;
}

.total-col {
  min-width: 56px;
}
.total-cell {
  font-weight: bold;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.action-col {
  width: 32px;
}

.remove-btn {
  background: transparent;
  color: #ff3333;
  border: 1px solid #ff3333;
  font-family: "Courier New", monospace;
  font-size: 11px;
  font-weight: bold;
  width: 22px;
  height: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.remove-btn:hover {
  background: #ff3333;
  color: #001100;
}

/* Winner row glow */
tr.winner td {
  box-shadow: inset 0 0 12px rgba(255, 215, 0, 0.15);
}
tr.winner {
  outline: 1px solid rgba(255, 215, 0, 0.4);
}

.empty-msg {
  color: #005500;
  text-align: center;
  margin-top: 40px;
  font-size: 14px;
}

/* ── SCROLLBARS ── */
.score-tab::-webkit-scrollbar,
.tabletop-wrapper::-webkit-scrollbar {
  width: 6px;
}
.score-tab::-webkit-scrollbar-track,
.tabletop-wrapper::-webkit-scrollbar-track {
  background: #001a00;
}
.score-tab::-webkit-scrollbar-thumb,
.tabletop-wrapper::-webkit-scrollbar-thumb {
  background: #005500;
  border-radius: 3px;
}

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .dice-sidebar {
    width: 48px;
    padding: 8px 4px;
  }
  .die-select-btn {
    width: 38px;
    height: 34px;
    font-size: 12px;
  }
  .die-shape {
    width: 120px;
    height: 120px;
  }
  .die-number {
    font-size: 36px;
  }
  .score-controls-row {
    gap: 6px;
  }
}
</style>
