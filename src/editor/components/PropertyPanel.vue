<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../EditorState'
import { RECT_KINDS, CIRCLE_KINDS, FLIPPER_KINDS, POLYLINE_KINDS } from '../types'

const store = useEditorStore()
const sel = computed(() => store.selected)

const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

function getVal(field: string): number {
  const s = sel.value as unknown as Record<string, number> | undefined
  return s ? (s[field] ?? 0) : 0
}

function setVal(field: string, v: number): void {
  store.updateSelected({ [field]: v } as Record<string, number>)
}

function bump(field: string, step: number): void {
  setVal(field, getVal(field) + step)
}

function angleDeg(): number {
  return Math.round(getVal('angle') * RAD_TO_DEG * 10) / 10
}
function setAngleDeg(deg: number): void {
  setVal('angle', deg * DEG_TO_RAD)
}
function bumpAngleDeg(step: number): void {
  setAngleDeg(angleDeg() + step)
}

function del(): void {
  store.deleteSelected()
}
</script>

<template>
  <div v-if="sel" class="props">
    <strong class="kind">{{ sel.kind }}</strong>

    <template v-if="RECT_KINDS.has(sel.kind)">
      <div class="row">
        <span class="lbl">x</span>
        <button class="step" @click="bump('x', -10)">−</button>
        <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('x', 10)">+</button>
      </div>
      <div class="row">
        <span class="lbl">y</span>
        <button class="step" @click="bump('y', -10)">−</button>
        <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('y', 10)">+</button>
      </div>
      <div class="row">
        <span class="lbl">w</span>
        <button class="step" @click="bump('w', -5)">−</button>
        <input type="number" :value="getVal('w')" @change="setVal('w', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('w', 5)">+</button>
      </div>
      <div class="row">
        <span class="lbl">h</span>
        <button class="step" @click="bump('h', -5)">−</button>
        <input type="number" :value="getVal('h')" @change="setVal('h', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('h', 5)">+</button>
      </div>
      <div class="row">
        <span class="lbl">∠°</span>
        <button class="step" @click="bumpAngleDeg(-5)">−</button>
        <input type="number" step="1" :value="angleDeg()" @change="setAngleDeg(+($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bumpAngleDeg(5)">+</button>
      </div>
    </template>

    <template v-else-if="CIRCLE_KINDS.has(sel.kind)">
      <div class="row">
        <span class="lbl">x</span>
        <button class="step" @click="bump('x', -10)">−</button>
        <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('x', 10)">+</button>
      </div>
      <div class="row">
        <span class="lbl">y</span>
        <button class="step" @click="bump('y', -10)">−</button>
        <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('y', 10)">+</button>
      </div>
      <div class="row">
        <span class="lbl">r</span>
        <button class="step" @click="bump('r', -2)">−</button>
        <input type="number" :value="getVal('r')" @change="setVal('r', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('r', 2)">+</button>
      </div>
    </template>

    <template v-else-if="FLIPPER_KINDS.has(sel.kind)">
      <div class="row">
        <span class="lbl">x</span>
        <button class="step" @click="bump('x', -10)">−</button>
        <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('x', 10)">+</button>
      </div>
      <div class="row">
        <span class="lbl">y</span>
        <button class="step" @click="bump('y', -10)">−</button>
        <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
        <button class="step" @click="bump('y', 10)">+</button>
      </div>
    </template>

    <template v-else-if="POLYLINE_KINDS.has(sel.kind)">
      <span class="hint">polyline ({{ (sel as any).points.length }} points)</span>
    </template>

    <button class="del" @click="del">Delete</button>
  </div>
  <div v-else class="props">
    <em>(select an element)</em>
  </div>
</template>

<style scoped>
.props {
  padding: 10px;
  background: #111;
  color: #ddd;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kind {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #9be7ff;
}
.row {
  display: grid;
  grid-template-columns: 28px 28px 1fr 28px;
  gap: 4px;
  align-items: center;
}
.lbl {
  font-family: ui-monospace, monospace;
  color: #aaa;
  text-align: right;
  padding-right: 2px;
}
input {
  width: 100%;
  padding: 4px 6px;
  background: #1a1a26;
  color: #eee;
  border: 1px solid #333;
  font-variant-numeric: tabular-nums;
}
.step {
  height: 28px;
  background: #222;
  color: #ddd;
  border: 1px solid #333;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}
.step:hover {
  background: #333;
}
.del {
  margin-top: 6px;
  background: #4a1f1f;
  color: #fff;
  border: 0;
  padding: 6px 10px;
  cursor: pointer;
}
.hint {
  color: #888;
  font-size: 12px;
}
</style>
