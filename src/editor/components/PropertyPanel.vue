<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../EditorState'
import { RECT_KINDS, CIRCLE_KINDS, FLIPPER_KINDS, POLYLINE_KINDS } from '../types'

const store = useEditorStore()
const sel = computed(() => store.selected)

function update(field: string, value: number): void {
  store.updateSelected({ [field]: value } as Record<string, number>)
}

const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

function updateAngleDeg(deg: number): void {
  store.updateSelected({ angle: deg * DEG_TO_RAD } as Record<string, number>)
}

function angleDeg(rad: number): string {
  return (rad * RAD_TO_DEG).toFixed(1)
}

function del(): void {
  store.deleteSelected()
}

defineExpose({ RECT_KINDS, CIRCLE_KINDS, FLIPPER_KINDS, POLYLINE_KINDS })
</script>

<template>
  <div v-if="sel" class="props">
    <strong>{{ sel.kind }}</strong>
    <template v-if="RECT_KINDS.has(sel.kind)">
      <label>x <input type="number" :value="(sel as any).x" @change="update('x', +($event.target as HTMLInputElement).value)" /></label>
      <label>y <input type="number" :value="(sel as any).y" @change="update('y', +($event.target as HTMLInputElement).value)" /></label>
      <label>w <input type="number" :value="(sel as any).w" @change="update('w', +($event.target as HTMLInputElement).value)" /></label>
      <label>h <input type="number" :value="(sel as any).h" @change="update('h', +($event.target as HTMLInputElement).value)" /></label>
      <label>angle° <input type="number" step="1" :value="angleDeg((sel as any).angle)" @change="updateAngleDeg(+($event.target as HTMLInputElement).value)" /></label>
    </template>
    <template v-else-if="CIRCLE_KINDS.has(sel.kind)">
      <label>x <input type="number" :value="(sel as any).x" @change="update('x', +($event.target as HTMLInputElement).value)" /></label>
      <label>y <input type="number" :value="(sel as any).y" @change="update('y', +($event.target as HTMLInputElement).value)" /></label>
      <label>r <input type="number" :value="(sel as any).r" @change="update('r', +($event.target as HTMLInputElement).value)" /></label>
    </template>
    <template v-else-if="FLIPPER_KINDS.has(sel.kind)">
      <label>x <input type="number" :value="(sel as any).x" @change="update('x', +($event.target as HTMLInputElement).value)" /></label>
      <label>y <input type="number" :value="(sel as any).y" @change="update('y', +($event.target as HTMLInputElement).value)" /></label>
    </template>
    <template v-else-if="POLYLINE_KINDS.has(sel.kind)">
      <span>polyline ({{ (sel as any).points.length }} points)</span>
    </template>
    <button class="del" @click="del">Delete</button>
  </div>
  <div v-else class="props">
    <em>(select an element)</em>
  </div>
</template>

<style scoped>
.props { padding: 8px; background: #111; color: #ddd; display: flex; flex-direction: column; gap: 4px; }
label { display: flex; gap: 6px; align-items: center; }
input { width: 80px; }
.del { background: #4a1f1f; color: #fff; border: 0; padding: 6px 10px; cursor: pointer; }
</style>
