<script setup lang="ts">
import EditorCanvas from '../editor/components/EditorCanvas.vue'
import Palette from '../editor/components/Palette.vue'
import PropertyPanel from '../editor/components/PropertyPanel.vue'
import LayoutsSidebar from '../editor/components/LayoutsSidebar.vue'
import TestPlayModal from '../editor/components/TestPlayModal.vue'
import { useEditorStore } from '../editor/EditorState'

const store = useEditorStore()
</script>

<template>
  <div class="editor">
    <div class="top-bar">
      <div class="brand">
        <span class="logo">🚀</span>
        <h1>Space Pinball Editor</h1>
      </div>
      <div class="layouts-section">
        <LayoutsSidebar />
      </div>
    </div>
    <div class="main-workspace">
      <aside class="col left">
        <Palette />
      </aside>
      <main class="canvas-wrap">
        <EditorCanvas />
      </main>
      <aside class="col right">
        <PropertyPanel />
      </aside>
    </div>
    <TestPlayModal v-if="store.state.testPlayOpen" />
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0a0a0f;
  color: #e2e8f0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #13131c;
  border-bottom: 1px solid #2a2a35;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 24px;
}

.brand h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #fff;
}

.layouts-section {
  display: flex;
  align-items: center;
}

.main-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.col {
  display: flex;
  flex-direction: column;
  background: #13131c;
  overflow-y: auto;
}

.col.left {
  width: 240px;
  border-right: 1px solid #2a2a35;
}

.col.right {
  width: 300px;
  border-left: 1px solid #2a2a35;
}

.canvas-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
  background: radial-gradient(circle at center, #1a1a24 0%, #0a0a0f 100%);
}
</style>
