<script setup lang="ts">
import EditorCanvas from '../editor/components/EditorCanvas.vue'
import Palette from '../editor/components/Palette.vue'
import PropertyPanel from '../editor/components/PropertyPanel.vue'
import LayoutsSidebar from '../editor/components/LayoutsSidebar.vue'
</script>

<template>
  <div class="editor">
    <LayoutsSidebar />
    <div class="canvas-wrap">
      <EditorCanvas />
      <PropertyPanel />
    </div>
    <Palette />
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  min-height: 100vh;
  background: #05050d;
  color: #ddd;
}
.canvas-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  gap: 8px;
}
</style>
