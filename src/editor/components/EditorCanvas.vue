<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { EditorRenderer } from '../EditorRenderer'
import { useEditorStore } from '../EditorState'
import { snapPoint } from '../snap'
import { hitTest } from '../HitTest'
import type { Element, ElementKind } from '../types'

const store = useEditorStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const renderer = new EditorRenderer()
let dragging = false
let dragOffset = { x: 0, y: 0 }

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
  }
}

function pointer(ev: PointerEvent): { x: number; y: number; force: boolean } {
  const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect()
  const raw = { x: ev.clientX - rect.left, y: ev.clientY - rect.top }
  const force = ev.shiftKey
  const snapped = snapPoint(raw, 10, force)
  return { x: snapped.x, y: snapped.y, force }
}

function onPointerDown(ev: PointerEvent): void {
  const p = pointer(ev)
  const m = store.mode
  if (m === 'select') {
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
  <canvas
    ref="canvas"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @dblclick="onDoubleClick"
  />
</template>

<style scoped>
canvas { display: block; background: #05050d; }
</style>
