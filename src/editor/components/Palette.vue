<script setup lang="ts">
import { useEditorStore } from '../EditorState'
import type { ElementKind } from '../types'

const store = useEditorStore()

const kinds: ElementKind[] = [
  'wall', 'bumper', 'slingshot', 'peg', 'rollover',
  'drain', 'flipperLeft', 'flipperRight', 'arcRail', 'gateRail',
]

function pick(kind: ElementKind): void {
  if (kind === 'arcRail' || kind === 'gateRail') {
    store.mode = { kind: 'polyline', elementKind: kind, points: [] }
  } else {
    store.mode = { kind: 'place', elementKind: kind }
  }
}

function isActive(kind: ElementKind): boolean {
  const m = store.mode
  return typeof m === 'object' && m.elementKind === kind
}
</script>

<template>
  <aside class="palette">
    <h3>Palette</h3>
    <ul>
      <li v-for="k in kinds" :key="k">
        <button :class="{ active: isActive(k) }" @click="pick(k)">{{ k }}</button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.palette { padding: 8px; min-width: 140px; background: #111; color: #ddd; }
ul { list-style: none; padding: 0; }
button { width: 100%; text-align: left; padding: 6px 8px; background: #222; color: #ddd; border: 1px solid #333; cursor: pointer; }
button.active { background: #444; border-color: #00e5ff; }
button:hover { background: #333; }
</style>
