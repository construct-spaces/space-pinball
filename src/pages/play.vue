<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { navigateToSpace } from '@construct-space/sdk'
import { PinballGame } from '../game/PinballGame'
import { useGameSession } from '../composables/useGameSession'
import { useHighScores } from '../composables/useHighScores'
import Hud from '../components/Hud.vue'
import GameOverModal from '../components/GameOverModal.vue'
import LeaderboardTable from '../components/LeaderboardTable.vue'

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')
const stageRef = useTemplateRef<HTMLDivElement>('stageRef')

const session = useGameSession()
const paused = ref(false)
const submitted = ref(false)
const submitErrorMsg = ref<string | null>(null)
const gameStarted = ref(false)

const { submit, submitting, topScores, usingLocal } = useHighScores('classic', 10)

let game: PinballGame | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  if (!canvasRef.value) return
  game = new PinballGame({
    onScoreChanged: (score, multiplier) => {
      session.score.value = score
      session.multiplier.value = multiplier
    },
    onComboChanged: (combo) => {
      session.combo.value = combo
    },
    onChargeChanged: (charge) => {
      session.charge.value = charge
    },
    onBallsChanged: (balls) => {
      session.balls.value = balls
    },
    onGameOver: (finalScore, ballsUsed, durationMs) => {
      session.finalScore.value = finalScore
      session.ballsUsed.value = ballsUsed
      session.durationMs.value = durationMs
      session.gameOver.value = true
    },
  })
  await game.mount(canvasRef.value)
  fitCanvas()

  if (stageRef.value) {
    resizeObserver = new ResizeObserver(() => fitCanvas())
    resizeObserver.observe(stageRef.value)
    // Grab keyboard focus so keys reach us (important inside the host iframe)
    stageRef.value.focus()
  }
})

function handleStart() {
  if (!game) return
  game.launch()
  gameStarted.value = true
  stageRef.value?.focus()
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  game?.destroy()
  game = null
})

function fitCanvas() {
  if (!stageRef.value || !game) return
  const rect = stageRef.value.getBoundingClientRect()
  // Leave room for HUD above
  game.fit(rect.width - 20, rect.height - 20)
}

function handlePause() {
  game?.togglePause()
  paused.value = !paused.value
}

function handleRestart() {
  if (!game) return
  game.restart()
  session.reset()
  paused.value = false
  submitted.value = false
  submitErrorMsg.value = null
  gameStarted.value = false
  stageRef.value?.focus()
}

async function handleSubmit(payload: { name: string }) {
  if (!game) return
  submitErrorMsg.value = null
  const ok = await submit({
    score: session.finalScore.value,
    balls: session.ballsUsed.value,
    duration: Math.floor(session.durationMs.value),
    playerName: payload.name,
  })
  if (ok) {
    submitted.value = true
  } else {
    submitErrorMsg.value = 'Could not save score. Try again?'
  }
}

function handleClose() {
  void navigateToSpace({ spaceId: 'pinball', page: '' })
}
</script>

<template>
  <div class="play-page">
    <div class="hud-wrap">
      <Hud
        :score="session.score.value"
        :multiplier="session.multiplier.value"
        :combo="session.combo.value"
        :balls="session.balls.value"
        :charge="session.charge.value"
        :paused="paused"
        @pause="handlePause"
        @restart="handleRestart"
      />
    </div>

    <div
      ref="stageRef"
      class="stage"
      tabindex="0"
      @click="stageRef?.focus()"
    >
      <canvas ref="canvasRef" class="pinball-canvas" />
      <div v-if="!gameStarted" class="start-overlay" @click.stop="handleStart">
        <div class="start-card">
          <h2>Ready?</h2>
          <p>Press <kbd>Space</kbd> or click to launch</p>
          <p class="controls">
            <span><kbd>←</kbd> <kbd>→</kbd> flippers</span>
            <span><kbd>P</kbd> pause · <kbd>R</kbd> restart</span>
          </p>
          <button class="start-btn" @click.stop="handleStart">Launch Ball</button>
        </div>
      </div>
    </div>

    <aside class="side-panel">
      <div class="panel-head">
        <h3>Top Scores</h3>
        <span v-if="usingLocal" class="local-badge">LOCAL</span>
      </div>
      <LeaderboardTable
        :scores="topScores"
        :limit="10"
        empty="No scores yet. Go set one."
      />
    </aside>

    <GameOverModal
      v-if="session.gameOver.value"
      :final-score="session.finalScore.value"
      :duration-ms="session.durationMs.value"
      :submitting="submitting"
      :submitted="submitted"
      :submit-error="submitErrorMsg"
      @submit="handleSubmit"
      @restart="handleRestart"
      @close="handleClose"
    />
  </div>
</template>

<style scoped>
.play-page {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(108, 92, 231, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse at top, #1a1a2e 0%, #0b0b12 70%);
  box-sizing: border-box;
}
.hud-wrap {
  width: 100%;
  max-width: 720px;
  display: flex;
  justify-content: center;
}
.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  position: relative;
  width: 100%;
}

/* Landscape: HUD becomes a sidebar next to the playfield so we stop wasting
   all the horizontal real-estate. */
@media (min-aspect-ratio: 5/4) and (min-width: 900px) {
  .play-page {
    flex-direction: row;
    align-items: stretch;
    gap: 20px;
    padding: 20px 24px;
  }
  .hud-wrap {
    max-width: 260px;
    flex: 0 0 260px;
    justify-content: stretch;
    align-items: stretch;
  }
  .hud-wrap :deep(.pinball-hud) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px 18px;
    width: 100%;
  }
  .hud-wrap :deep(.hud-group),
  .hud-wrap :deep(.charge-group) {
    min-width: 0;
    width: 100%;
  }
  .hud-wrap :deep(.hud-actions) {
    margin-left: 0;
    margin-top: auto;
    flex-direction: column;
  }
  .hud-wrap :deep(.hud-btn) {
    width: 100%;
    padding: 10px;
    font-size: 13px;
  }
  .hud-wrap :deep(.charge-bar) {
    width: 100%;
  }
  .hud-wrap :deep(.hud-value) {
    font-size: 28px;
  }
  .hud-wrap :deep(.combo-pill) {
    align-self: flex-start;
  }
  .stage {
    flex: 1;
    min-width: 0;
  }
  .pinball-canvas {
    max-height: calc(100vh - 40px);
  }
  .side-panel {
    display: flex;
    flex-direction: column;
    flex: 0 0 320px;
    max-width: 320px;
    background: linear-gradient(180deg, rgba(28, 28, 42, 0.92) 0%, rgba(19, 19, 31, 0.92) 100%);
    border: 1px solid rgba(108, 92, 231, 0.3);
    border-radius: 12px;
    padding: 16px 0 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .side-panel .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px 12px;
    border-bottom: 1px solid rgba(108, 92, 231, 0.15);
  }
  .side-panel h3 {
    margin: 0;
    font-size: 13px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #a0a0bf;
    font-weight: 700;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  }
  .local-badge {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    padding: 3px 7px;
    border-radius: 999px;
    background: rgba(255, 209, 102, 0.15);
    border: 1px solid rgba(255, 209, 102, 0.4);
    color: #ffd166;
    font-weight: 700;
  }
}
.stage:focus {
  outline: none;
}
.pinball-canvas {
  display: block;
  border-radius: 14px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(108, 92, 231, 0.35),
    0 0 40px rgba(108, 92, 231, 0.15);
}
.side-panel {
  display: none;
}
.start-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(11, 11, 18, 0.7);
  backdrop-filter: blur(4px);
  cursor: pointer;
  z-index: 5;
}
.start-card {
  background: linear-gradient(180deg, #1c1c2a 0%, #141421 100%);
  border: 1px solid rgba(108, 92, 231, 0.4);
  border-radius: 12px;
  padding: 32px 40px;
  text-align: center;
  color: #f5f5fa;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.start-card h2 {
  margin: 0 0 8px;
  font-size: 28px;
  letter-spacing: 2px;
  color: #ffd166;
}
.start-card p {
  margin: 4px 0;
  color: #c8c8d8;
}
.start-card .controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
  font-size: 13px;
}
.start-card kbd {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background: #2a2a3a;
  border: 1px solid #3a3a50;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #fff;
  margin: 0 2px;
}
.start-btn {
  margin-top: 16px;
  background: linear-gradient(180deg, #6c5ce7, #5b4bd1);
  color: white;
  border: 0;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(108, 92, 231, 0.5);
}
.start-btn:hover {
  filter: brightness(1.1);
}
</style>
