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
    <aside class="col left">
      <LayoutsSidebar />
      <Palette />
    </aside>
    <main class="canvas-wrap">
      <EditorCanvas />
    </main>
    <aside class="col right">
      <PropertyPanel />
    </aside>
    <TestPlayModal v-if="store.state.testPlayOpen" />
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  min-height: 100vh;
  background: #05050d;
  color: #ddd;
}
.col {
  display: flex;
  flex-direction: column;
}
.col.left {
  min-width: 200px;
  border-right: 1px solid #222;
}
.col.right {
  min-width: 220px;
  border-left: 1px solid #222;
}
.canvas-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  overflow: auto;
}
</style>
