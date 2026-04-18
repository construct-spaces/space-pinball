<script setup lang="ts">
import { useEditorStore } from '../EditorState'
import type { ElementKind, DecorKind } from '../types'
import { DECOR_KINDS } from '../types'

const store = useEditorStore()

const tools: ElementKind[] = [
  'wall', 'bumper', 'slingshot', 'peg', 'rollover',
  'drain', 'flipperLeft', 'flipperRight', 'arcRail', 'gateRail', 'teleport',
]

function pickTool(kind: ElementKind): void {
  if (kind === 'arcRail' || kind === 'gateRail') {
    store.mode = { kind: 'polyline', elementKind: kind, points: [] }
  } else {
    store.mode = { kind: 'place', elementKind: kind }
  }
}

function pickDecor(kind: DecorKind): void {
  store.mode = { kind: 'place', elementKind: kind as unknown as ElementKind }
}

function isActive(kind: string): boolean {
  const m = store.mode
  return typeof m === 'object' && (m as { elementKind: string }).elementKind === kind
}
</script>

<template>
  <aside class="palette">
    <div class="tabs">
      <button :class="{ active: store.state.paletteTab === 'tools' }" @click="store.state.paletteTab = 'tools'">Tools</button>
      <button :class="{ active: store.state.paletteTab === 'beauty' }" @click="store.state.paletteTab = 'beauty'">Beauty</button>
    </div>
    <ul v-if="store.state.paletteTab === 'tools'">
      <li v-for="k in tools" :key="k">
        <button :class="{ active: isActive(k) }" @click="pickTool(k)">{{ k }}</button>
      </li>
    </ul>
    <ul v-else>
      <li v-for="k in DECOR_KINDS" :key="k">
        <button :class="{ active: isActive(k) }" @click="pickDecor(k)">{{ k }}</button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.palette { padding: 8px; min-width: 140px; background: #111; color: #ddd; }
.tabs { display: flex; gap: 4px; margin-bottom: 8px; }
.tabs button {
  flex: 1; padding: 6px; background: #222; color: #ddd; border: 1px solid #333; cursor: pointer;
}
.tabs button.active { background: #444; border-color: #00e5ff; color: #fff; }
ul { list-style: none; padding: 0; margin: 0; }
li button {
  width: 100%; text-align: left; padding: 6px 8px;
  background: #222; color: #ddd; border: 1px solid #333; cursor: pointer; margin-top: 2px;
}
li button.active { background: #444; border-color: #00e5ff; }
li button:hover { background: #333; }
</style>
