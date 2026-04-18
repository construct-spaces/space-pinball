<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { EditorRenderer } from '../EditorRenderer'
import { useEditorStore } from '../EditorState'
import { snapPoint } from '../snap'
import { hitTest, hitTestDecor } from '../HitTest'
import type { Decor, DecorKind, Element, ElementKind } from '../types'
import { BALL_RADIUS } from '../../game/constants'

const DECOR_NAMES = new Set<string>(['light', 'text', 'emitter'])

function defaultDecor(kind: DecorKind, x: number, y: number): Decor {
  switch (kind) {
    case 'light':   return { id: crypto.randomUUID(), kind, x, y, r: 30, color: '#ff66cc', intensity: 0.6 }
    case 'text':    return { id: crypto.randomUUID(), kind, x, y, text: 'TILT', size: 18, color: '#9be7ff' }
    case 'emitter': return { id: crypto.randomUUID(), kind, x, y, count: 20, color: '#ffd166', spread: Math.PI, speed: 200 }
  }
}
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-vue-next'

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
    case 'teleport':     return { id: uid(), kind, x, y, r: 16 }
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
    const elementHit = hitTest(p, store.layout.elements)
    const decorHit = elementHit ? undefined : hitTestDecor(p, store.layout.decorations)
    const hit = elementHit ?? decorHit
    store.selectedId = hit?.id
    if (hit) {
      dragging = true
      if ('x' in hit) {
        dragOffset = { x: p.x - hit.x, y: p.y - hit.y }
      } else if (hit.kind === 'arcRail' || hit.kind === 'gateRail') {
        dragOffset = { x: p.x - hit.points[0].x, y: p.y - hit.points[0].y }
      }
    }
  } else if (typeof m === 'object' && m.kind === 'place') {
    if (DECOR_NAMES.has(m.elementKind as string)) {
      store.addDecor(defaultDecor(m.elementKind as unknown as DecorKind, p.x, p.y))
    } else {
      store.addElement(defaultElement(m.elementKind, p.x, p.y))
    }
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
  if (!sel) {
    const decorSel = store.layout.decorations?.find((d) => d.id === store.selectedId)
    if (decorSel) {
      store.updateDecor({ x: p.x - dragOffset.x, y: p.y - dragOffset.y } as Partial<Decor>)
    }
    return
  }

  if (sel.kind === 'arcRail' || sel.kind === 'gateRail') {
    const dx = p.x - dragOffset.x - sel.points[0].x
    const dy = p.y - dragOffset.y - sel.points[0].y
    if (dx !== 0 || dy !== 0) {
      const newPoints = sel.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }))
      store.updateSelected({ points: newPoints } as Partial<Element>)
    }
  } else {
    store.updateSelected({ x: p.x - dragOffset.x, y: p.y - dragOffset.y } as Partial<Element>)
  }
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
    if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return
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
  renderer.render(store.layout, store.selectedId, store.mode)
  window.addEventListener('keydown', onKey)
})

watch(
  () => [store.layout.elements.length, store.selectedId, JSON.stringify(store.layout), store.mode],
  () => renderer.render(store.layout, store.selectedId, store.mode),
  { deep: true }
)

onUnmounted(() => {
  renderer.destroy()
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="canvas-root">
    <div class="zoom-bar">
      <button class="zoom-btn" title="Zoom out (⌘-)" @click="zoomOut"><ZoomOut :size="16" /></button>
      <span class="zoom-val">{{ Math.round(zoom * 100) }}%</span>
      <button class="zoom-btn" title="Zoom in (⌘=)" @click="zoomIn"><ZoomIn :size="16" /></button>
      <button class="zoom-btn" title="Reset (⌘0)" @click="zoomReset"><RotateCcw :size="16" /></button>
    </div>
    <div v-if="typeof store.mode === 'object' && store.mode.kind === 'polyline'" class="mode-hint">
      Polyline Mode: Click to add points, Double-click to finish.
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
  gap: 12px;
  align-items: center;
}
.zoom-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #13131c;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #2a2a35;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  color: #a0a0b0;
}
.zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  color: #a0a0b0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.zoom-btn:hover {
  background: #2a2a35;
  color: #f8fafc;
}
.zoom-val {
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}
.mode-hint {
  background: rgba(0, 229, 255, 0.1);
  color: #00e5ff;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  font-size: 12px;
  font-weight: 600;
}
.canvas-host {
  border: 1px solid #2a2a35;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 10px -6px rgba(0, 0, 0, 0.8);
}
canvas {
  display: block;
  background: #05050d;
}
</style>
