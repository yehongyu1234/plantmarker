<template>
  <div class="app">
    <TitleBar v-if="false" />
    <ToolBar />
    <div class="main-content">
      <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
        <ImageList />
        <PlantList />
      </div>
      <div class="resize-handle" @mousedown="startResizeSidebar" />
      <AnnotationCanvas />
      <div class="resize-handle" @mousedown="startResizeRightPanel" />
      <div class="right-panel" :style="{ width: rightPanelWidth + 'px' }">
        <AnnotationInfo />
        <ExportPanel />
      </div>
    </div>
    <div class="status-bar">
      <span>{{ t('app.statusScale') }}: {{ Math.round(scale * 100) }}%</span>
      <span>{{ t('app.statusAnnotations') }}: {{ annotationStore.currentAnnotations.length }}</span>
      <span>{{ t('app.statusMode') }}: {{ annotationStore.currentPlantName ? t('app.modeDraw') : t('app.modeSelect') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import TitleBar from '@/components/TitleBar.vue'
import ToolBar from '@/components/ToolBar.vue'
import AnnotationCanvas from '@/components/AnnotationCanvas.vue'
import ImageList from '@/components/ImageList.vue'
import PlantList from '@/components/PlantList.vue'
import AnnotationInfo from '@/components/AnnotationInfo.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import { useAnnotationStore } from '@/stores/annotationStore'
import { t } from '@/utils/i18n'

const annotationStore = useAnnotationStore()
const scale = ref(1)
const sidebarWidth = ref(200)
const rightPanelWidth = ref(240)

let isResizingSidebar = false
let isResizingRightPanel = false
let startX = 0
let startWidth = 0

provide('canvasScale', scale)

function startResizeSidebar(e: MouseEvent) {
  isResizingSidebar = true
  startX = e.clientX
  startWidth = sidebarWidth.value
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function startResizeRightPanel(e: MouseEvent) {
  isResizingRightPanel = true
  startX = e.clientX
  startWidth = rightPanelWidth.value
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onMouseMove(e: MouseEvent) {
  if (isResizingSidebar) {
    const delta = e.clientX - startX
    sidebarWidth.value = Math.max(150, Math.min(400, startWidth + delta))
  }
  if (isResizingRightPanel) {
    const delta = startX - e.clientX
    rightPanelWidth.value = Math.max(180, Math.min(400, startWidth + delta))
  }
}

function onMouseUp() {
  isResizingSidebar = false
  isResizingRightPanel = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: #20203a;
  overflow: hidden;
}

.sidebar > :first-child {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar > :last-child {
  flex-shrink: 0;
  border-top: 1px solid #333;
}

.resize-handle {
  width: 4px;
  background: #333;
  cursor: col-resize;
  transition: background 0.15s;
  flex-shrink: 0;
}

.resize-handle:hover {
  background: #6366f1;
}

.right-panel {
  display: flex;
  flex-direction: column;
  background: #20203a;
  padding: 12px;
  gap: 12px;
  overflow-y: auto;
}

.status-bar {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 16px;
  background: #151528;
  border-top: 1px solid #333;
  font-size: 11px;
  color: #666;
}
</style>
