<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { PinballGame } from '../../game/PinballGame'
import { useEditorStore } from '../EditorState'

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
        <span class="title">Testing: {{ store.layout.name }}</span>
        <span class="score">Score: {{ score }}</span>
        <span class="balls">Balls: {{ balls }}</span>
        <button class="close" @click="handleClose">✕ Close (Esc)</button>
      </header>
      <div ref="stageRef" class="stage" tabindex="0" @click="stageRef?.focus()">
        <canvas ref="canvasRef" />
        <div v-if="!gameStarted" class="overlay" @click.stop="handleStart">
          <div class="card">
            <h2>Ready?</h2>
            <p>Click or press Space to launch</p>
            <button class="btn" @click.stop="handleStart">Launch</button>
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #0b0b12;
  border: 1px solid #333;
  border-radius: 12px;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: #111;
  border-bottom: 1px solid #222;
  color: #ddd;
}
.title {
  font-weight: 600;
  flex: 1;
}
.score, .balls {
  font-variant-numeric: tabular-nums;
  color: #9be7ff;
}
.close {
  background: #4a1f1f;
  color: #fff;
  border: 0;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
}
.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  outline: none;
}
canvas {
  display: block;
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(108, 92, 231, 0.3);
}
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 11, 18, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.card {
  background: #1c1c2a;
  border: 1px solid rgba(108, 92, 231, 0.4);
  border-radius: 12px;
  padding: 24px 40px;
  text-align: center;
  color: #f5f5fa;
}
.btn {
  margin-top: 12px;
  background: #6c5ce7;
  color: white;
  border: 0;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>
