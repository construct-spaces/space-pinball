<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../EditorState'

const store = useEditorStore()
const items = ref(store.listLayouts())

function refresh(): void {
  items.value = store.listLayouts()
}

function newLayout(): void {
  store.newLayout()
  refresh()
}

function load(id: string): void {
  store.loadLayout(id)
}

function dup(id: string): void {
  store.duplicate(id)
  refresh()
}

function remove(id: string): void {
  store.remove(id)
  refresh()
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
  <aside class="sidebar">
    <h3>Layouts</h3>
    <button @click="newLayout">+ New</button>
    <ul>
      <li v-for="l in items" :key="l.id" :class="{ active: l.id === store.layout.id }">
        <a href="#" @click.prevent="load(l.id)">{{ l.name }}</a>
        <button @click="dup(l.id)">&#x2398;</button>
        <button @click="remove(l.id)">&#x2715;</button>
      </li>
    </ul>
    <hr />
    <button @click="rename">Rename</button>
    <button @click="store.testPlay()">&#x25B6; Test</button>
  </aside>
</template>

<style scoped>
.sidebar { padding: 8px; background: #111; color: #ddd; min-width: 180px; }
ul { list-style: none; padding: 0; }
li { display: flex; align-items: center; gap: 4px; padding: 4px; }
li.active { background: #222; }
a { color: #ddd; flex: 1; text-decoration: none; }
button { background: #222; color: #ddd; border: 1px solid #333; padding: 4px 6px; cursor: pointer; }
button:hover { background: #333; }
</style>
