<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../EditorState'
import { Play, Plus, Edit2, Copy, Trash2 } from 'lucide-vue-next'

const store = useEditorStore()
const items = ref(store.listLayouts())

function refresh(): void {
  items.value = store.listLayouts()
}

function newLayout(): void {
  store.newLayout()
  refresh()
}

function load(ev: Event): void {
  const id = (ev.target as HTMLSelectElement).value
  store.loadLayout(id)
}

function dup(): void {
  store.duplicate(store.layout.id)
  refresh()
}

function remove(): void {
  if (confirm('Are you sure you want to delete this layout?')) {
    store.remove(store.layout.id)
    refresh()
  }
}

function rename(): void {
  const next = prompt('New name', store.layout.name)
  if (next) {
    store.rename(next)
    refresh()
  }
}
</script>

<template>
  <div class="layouts-toolbar">
    <div class="layout-selector">
      <select :value="store.layout.id" class="select-layout" @change="load">
        <option v-for="l in items" :key="l.id" :value="l.id">{{ l.name }}</option>
      </select>
    </div>
    <div class="actions">
      <button class="icon-btn" title="New Layout" @click="newLayout"><Plus :size="18" /></button>
      <button class="icon-btn" title="Rename Layout" @click="rename"><Edit2 :size="18" /></button>
      <button class="icon-btn" title="Duplicate Layout" @click="dup"><Copy :size="18" /></button>
      <button class="icon-btn danger" title="Delete Layout" :disabled="items.length <= 1" @click="remove"><Trash2 :size="18" /></button>
    </div>
    <div class="divider" />
    <button class="primary-btn" @click="store.testPlay()"><Play :size="16" class="icon" /> Test Play</button>
  </div>
</template>

<style scoped>
.layouts-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.layout-selector {
  position: relative;
}
.select-layout {
  appearance: none;
  background: #1a1a24;
  border: 1px solid #3a3a4a;
  color: #fff;
  padding: 6px 32px 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  min-width: 160px;
}
.select-layout:focus {
  border-color: #00e5ff;
}
.actions {
  display: flex;
  gap: 4px;
}
.icon-btn {
  background: transparent;
  border: none;
  color: #a0a0b0;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: #2a2a35;
  color: #fff;
}
.icon-btn.danger:hover {
  background: #ff4757;
  color: #fff;
}
.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.divider {
  width: 1px;
  height: 24px;
  background: #2a2a35;
  margin: 0 4px;
}
.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #00e5ff;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.primary-btn:hover {
  background: #00c4db;
}
.primary-btn .icon {
  fill: currentColor;
}
</style>
