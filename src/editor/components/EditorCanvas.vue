<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { EditorRenderer } from '../EditorRenderer'
import { useEditorStore } from '../EditorState'
import { snapPoint } from '../snap'
import { hitTest } from '../HitTest'
import type { Element, ElementKind } from '../types'
import { BALL_RADIUS } from '../../game/constants'

const BALL_START_ID = '__ballStart__'

const store = useEditorStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const renderer = new EditorRenderer()
const zoom = ref(1)
let dragging = false
let dragOffset = { x: 0, y: 0 }

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

function uid(): string { return crypto.randomUUID() }

function defaultElement(kind: ElementKind, x: number, y: number): Element {
  switch (kind) {
    case 'wall':         return { id: uid(), kind, x, y, w: 40, h: 8, angle: 0 }
    case 'slingshot':    return { id: uid(), kind, x, y, w: 90, h: 18, angle: 0.6 }
    case 'rollover':     return { id: uid(), kind, x, y, w: 28, h: 30, angle: 0 }
    case 'drain':        return { id: uid(), kind, x, y, w: 80, h: 8, angle: 0 }
    case 'bumper':       return { id: uid(), kind, x, y, r: 24 }
    case 'peg':          return { id: uid(), kind, x, y, r: 6 }
    case 'flipperLeft':
    case 'flipperRight': return { id: uid(), kind, x, y }
    case 'arcRail':
    case 'gateRail':     return { id: uid(), kind, points: [], thickness: 6 }
    case 'ballStart':    return { id: uid(), kind: 'wall', x, y, w: 0, h: 0, angle: 0 }
  }
}

// Convert pointer coords to playfield coords, accounting for CSS zoom.
function pointer(ev: PointerEvent): { x: number; y: number; force: boolean } {
  const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect()
  const scale = rect.width / store.layout.width
  const raw = {
    x: (ev.clientX - rect.left) / scale,
    y: (ev.clientY - rect.top) / scale,
  }
  const force = ev.shiftKey
  const snapped = snapPoint(raw, 10, force)
  return { x: snapped.x, y: snapped.y, force }
}

function distSq(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x, dy = a.y - b.y
  return dx * dx + dy * dy
}

function onPointerDown(ev: PointerEvent): void {
  const p = pointer(ev)
  const m = store.mode
  if (m === 'select') {
    // Ball-start marker takes priority — it's always drawn on top.
    const bs = store.layout.ballStart
    if (distSq(p, bs) <= BALL_RADIUS * BALL_RADIUS) {
      store.selectedId = BALL_START_ID
      dragging = true
      dragOffset = { x: p.x - bs.x, y: p.y - bs.y }
      return
    }
    const hit = hitTest(p, store.layout.elements)
    store.selectedId = hit?.id
    if (hit && 'x' in hit) {
      dragging = true
      dragOffset = { x: p.x - hit.x, y: p.y - hit.y }
    }
  } else if (typeof m === 'object' && m.kind === 'place') {
    store.addElement(defaultElement(m.elementKind, p.x, p.y))
    store.mode = 'select'
  } else if (typeof m === 'object' && m.kind === 'polyline') {
    m.points.push({ x: p.x, y: p.y })
  }
}

function onPointerMove(ev: PointerEvent): void {
  if (!dragging || !store.selectedId) return
  const p = pointer(ev)
  if (store.selectedId === BALL_START_ID) {
    store.updateSelected({ x: p.x - dragOffset.x, y: p.y - dragOffset.y } as Partial<Element>)
    return
  }
  const sel = store.layout.elements.find((e) => e.id === store.selectedId)
  if (!sel || sel.kind === 'arcRail' || sel.kind === 'gateRail') return
  store.updateSelected({ x: p.x - dragOffset.x, y: p.y - dragOffset.y } as Partial<Element>)
}

function onPointerUp(): void {
  dragging = false
}

function onDoubleClick(): void {
  const m = store.mode
  if (typeof m === 'object' && m.kind === 'polyline' && m.points.length >= 2) {
    store.addElement({ id: uid(), kind: m.elementKind, points: m.points, thickness: 6 })
    store.mode = 'select'
  }
}

function onWheel(ev: WheelEvent): void {
  if (!ev.ctrlKey && !ev.metaKey) return
  ev.preventDefault()
  const dir = ev.deltaY < 0 ? 1 : -1
  zoom.value = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.value + dir * ZOOM_STEP))
}

function zoomIn(): void {
  zoom.value = Math.min(ZOOM_MAX, zoom.value + ZOOM_STEP)
}
function zoomOut(): void {
  zoom.value = Math.max(ZOOM_MIN, zoom.value - ZOOM_STEP)
}
function zoomReset(): void {
  zoom.value = 1
}

function onKey(ev: KeyboardEvent): void {
  if (ev.key === 'Escape') {
    store.mode = 'select'
    store.selectedId = undefined
  } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
    store.deleteSelected()
  } else if ((ev.metaKey || ev.ctrlKey) && ev.key === 'z' && !ev.shiftKey) {
    ev.preventDefault()
    store.undo()
  } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'Z' || (ev.shiftKey && ev.key === 'z'))) {
    ev.preventDefault()
    store.redo()
  } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === '=' || ev.key === '+')) {
    ev.preventDefault()
    zoomIn()
  } else if ((ev.metaKey || ev.ctrlKey) && ev.key === '-') {
    ev.preventDefault()
    zoomOut()
  } else if ((ev.metaKey || ev.ctrlKey) && ev.key === '0') {
    ev.preventDefault()
    zoomReset()
  }
}

onMounted(async () => {
  if (!canvas.value) return
  await renderer.init(canvas.value, store.layout)
  renderer.render(store.layout, store.selectedId)
  window.addEventListener('keydown', onKey)
})

watch(
  () => [store.layout.elements.length, store.selectedId, JSON.stringify(store.layout)],
  () => renderer.render(store.layout, store.selectedId),
)

onUnmounted(() => {
  renderer.destroy()
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="canvas-root">
    <div class="zoom-bar">
      <button title="Zoom out (⌘-)" @click="zoomOut">−</button>
      <span class="zoom-val">{{ Math.round(zoom * 100) }}%</span>
      <button title="Zoom in (⌘=)" @click="zoomIn">+</button>
      <button title="Reset (⌘0)" @click="zoomReset">⟳</button>
    </div>
    <div class="canvas-host" :style="{ width: `${store.layout.width * zoom}px`, height: `${store.layout.height * zoom}px` }">
      <canvas
        ref="canvas"
        :style="{ width: `${store.layout.width * zoom}px`, height: `${store.layout.height * zoom}px` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @dblclick="onDoubleClick"
        @wheel="onWheel"
      />
    </div>
  </div>
</template>

<style scoped>
.canvas-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.zoom-bar {
  display: flex;
  gap: 4px;
  align-items: center;
  color: #ddd;
}
.zoom-bar button {
  width: 28px;
  height: 28px;
  background: #222;
  color: #ddd;
  border: 1px solid #333;
  cursor: pointer;
  font-size: 14px;
}
.zoom-bar button:hover {
  background: #333;
}
.zoom-val {
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.canvas-host {
  border: 1px solid #222;
}
canvas {
  display: block;
  background: #05050d;
}
</style>
