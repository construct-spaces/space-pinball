<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { PinballGame } from '../../game/PinballGame'
import { useEditorStore } from '../EditorState'
import { X, Trophy, Disc3, Rocket } from 'lucide-vue-next'

const store = useEditorStore()
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')
const stageRef = useTemplateRef<HTMLDivElement>('stageRef')
const score = ref(0)
const balls = ref(3)
const gameStarted = ref(false)

let game: PinballGame | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  if (!canvasRef.value) return
  game = new PinballGame({
    onScoreChanged: (s) => { score.value = s },
    onBallsChanged: (b) => { balls.value = b },
  })
  await game.mount(canvasRef.value, store.layout)
  fit()
  if (stageRef.value) {
    resizeObserver = new ResizeObserver(() => fit())
    resizeObserver.observe(stageRef.value)
    stageRef.value.focus()
  }
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  game?.destroy()
  game = null
  window.removeEventListener('keydown', onKey)
})

function fit(): void {
  if (!stageRef.value || !game) return
  const rect = stageRef.value.getBoundingClientRect()
  game.fit(rect.width - 40, rect.height - 40)
}

function onKey(ev: KeyboardEvent): void {
  if (ev.key === 'Escape') {
    store.closeTestPlay()
  }
}

function handleStart(): void {
  if (!game) return
  game.launch()
  gameStarted.value = true
  stageRef.value?.focus()
}

function handleClose(): void {
  store.closeTestPlay()
}
</script>

<template>
  <div class="modal-root" @click.self="handleClose">
    <div class="modal">
      <header class="bar">
        <div class="title-group">
          <span class="title">Testing: {{ store.layout.name }}</span>
        </div>
        <div class="stats-group">
          <div class="stat-badge">
            <Trophy :size="16" class="stat-icon" />
            <span class="stat-label">Score</span>
            <span class="stat-value">{{ score }}</span>
          </div>
          <div class="stat-badge">
            <Disc3 :size="16" class="stat-icon" />
            <span class="stat-label">Balls</span>
            <span class="stat-value">{{ balls }}</span>
          </div>
        </div>
        <button class="close-btn" @click="handleClose">
          <X :size="16" /> Close <span class="esc-hint">Esc</span>
        </button>
      </header>
      <div ref="stageRef" class="stage" tabindex="0" @click="stageRef?.focus()">
        <canvas ref="canvasRef" />
        <div v-if="!gameStarted" class="overlay" @click.stop="handleStart">
          <div class="launch-card">
            <div class="icon-wrap">
              <Rocket :size="32" class="launch-icon" />
            </div>
            <h2>Ready for Launch</h2>
            <p>Click or press Space to start the game</p>
            <button class="launch-btn" @click.stop="handleStart">Launch Ball</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #0a0a0f;
  border: 1px solid #2a2a35;
  border-radius: 12px;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #13131c;
  border-bottom: 1px solid #2a2a35;
  color: #e2e8f0;
}
.title-group {
  flex: 1;
}
.title {
  font-weight: 600;
  font-size: 15px;
  color: #f8fafc;
}
.stats-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: 24px;
}
.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e1e2d;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #2a2a35;
}
.stat-icon {
  color: #00e5ff;
}
.stat-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-value {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #f8fafc;
}
.close-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid transparent;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: 500;
}
.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}
.esc-hint {
  font-size: 10px;
  background: #2a2a35;
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: 4px;
}
.close-btn:hover .esc-hint {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  outline: none;
  background: radial-gradient(circle at center, #1a1a24 0%, #0a0a0f 100%);
}
canvas {
  display: block;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #00e5ff, 0 0 20px rgba(0, 229, 255, 0.2);
}
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.launch-card {
  background: #13131c;
  border: 1px solid #2a2a35;
  border-radius: 16px;
  padding: 32px 48px;
  text-align: center;
  color: #f8fafc;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.icon-wrap {
  width: 64px;
  height: 64px;
  background: rgba(0, 229, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.launch-icon {
  color: #00e5ff;
}
.launch-card h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}
.launch-card p {
  margin: 0;
  color: #94a3b8;
}
.launch-btn {
  margin-top: 8px;
  background: #00e5ff;
  color: #000;
  border: 0;
  padding: 12px 32px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s;
  box-shadow: 0 4px 14px 0 rgba(0, 229, 255, 0.39);
}
.launch-btn:hover {
  background: #00c4db;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 229, 255, 0.4);
}
.launch-btn:active {
  transform: translateY(1px);
}
</style>
