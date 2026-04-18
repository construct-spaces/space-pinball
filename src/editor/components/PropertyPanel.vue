<script setup lang="ts">
import { useEditorStore } from '../EditorState'
import { RECT_KINDS, CIRCLE_KINDS, FLIPPER_KINDS, POLYLINE_KINDS } from '../types'
import { Trash2, Minus, Plus } from 'lucide-vue-next'

const store = useEditorStore()
const sel = store.selected

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
  <div v-if="sel" class="props-panel">
    <div class="panel-header">
      <h3>Properties</h3>
      <strong class="kind-badge">{{ sel.kind }}</strong>
    </div>

    <div class="props-form">
      <template v-if="RECT_KINDS.has(sel.kind as never)">
        <div class="prop-row">
          <span class="prop-lbl">X</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('x', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('x', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">Y</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('y', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('y', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">W</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('w', -5)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('w')" @change="setVal('w', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('w', 5)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">H</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('h', -5)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('h')" @change="setVal('h', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('h', 5)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">∠°</span>
          <div class="number-input">
            <button class="step-btn" @click="bumpAngleDeg(-5)"><Minus :size="14" /></button>
            <input type="number" step="1" :value="angleDeg()" @change="setAngleDeg(+($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bumpAngleDeg(5)"><Plus :size="14" /></button>
          </div>
        </div>
      </template>

      <template v-else-if="CIRCLE_KINDS.has(sel.kind as never)">
        <div class="prop-row">
          <span class="prop-lbl">X</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('x', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('x', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">Y</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('y', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('y', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">R</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('r', -2)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('r')" @change="setVal('r', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('r', 2)"><Plus :size="14" /></button>
          </div>
        </div>
      </template>

      <template v-else-if="FLIPPER_KINDS.has(sel.kind as never)">
        <div class="prop-row">
          <span class="prop-lbl">X</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('x', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('x', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">Y</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('y', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('y', 10)"><Plus :size="14" /></button>
          </div>
        </div>
      </template>

      <template v-else-if="POLYLINE_KINDS.has(sel.kind as never)">
        <div class="prop-row">
          <span class="prop-lbl">T</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('thickness', -2)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('thickness')" @change="setVal('thickness', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('thickness', 2)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="info-box">
          <span class="hint">Polyline ({{ (sel as any).points.length }} points)</span>
        </div>
      </template>

      <template v-else-if="sel.kind === 'ballStart'">
        <div class="prop-row">
          <span class="prop-lbl">X</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('x', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('x')" @change="setVal('x', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('x', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-lbl">Y</span>
          <div class="number-input">
            <button class="step-btn" @click="bump('y', -10)"><Minus :size="14" /></button>
            <input type="number" :value="getVal('y')" @change="setVal('y', +($event.target as HTMLInputElement).value)" />
            <button class="step-btn" @click="bump('y', 10)"><Plus :size="14" /></button>
          </div>
        </div>
        <div class="info-box">
          <span class="hint">Ball spawn point — cannot delete</span>
        </div>
      </template>
    </div>

    <button v-if="sel.kind !== 'ballStart'" class="del-btn" @click="del">
      <Trash2 :size="16" />
      Delete Element
    </button>
  </div>
  <div v-else class="empty-state">
    <div class="empty-box">
      <span>Select an element</span>
    </div>
  </div>
</template>

<style scoped>
.props-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kind-badge {
  font-size: 10px;
  background: rgba(0, 229, 255, 0.1);
  color: #00e5ff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.props-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prop-lbl {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #94a3b8;
  width: 24px;
  font-weight: 600;
}

.number-input {
  display: flex;
  align-items: center;
  background: #1e1e2d;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  overflow: hidden;
  flex: 1;
}

.number-input input {
  flex: 1;
  width: 100%;
  padding: 6px;
  background: transparent;
  color: #f8fafc;
  border: none;
  text-align: center;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  outline: none;
  -moz-appearance: textfield;
}
.number-input input::-webkit-outer-spin-button,
.number-input input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.step-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.step-btn:hover {
  background: #2a2a35;
  color: #f8fafc;
}

.del-btn {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.del-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.info-box {
  background: #1e1e2d;
  border: 1px solid #2a2a35;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.hint {
  color: #6b7280;
  font-size: 12px;
}

.empty-state {
  padding: 16px;
  height: 100%;
  display: flex;
}

.empty-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #2a2a35;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  height: 120px;
}
</style>
