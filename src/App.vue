<template>
  <div class="app">
    <TitleBar />
    <ToolBar />
    <div class="main-content">
      <div class="sidebar">
        <ImageList />
        <PlantList />
      </div>
      <AnnotationCanvas />
      <div class="right-panel">
        <AnnotationInfo />
        <ExportPanel />
      </div>
    </div>
    <div class="status-bar">
      <span>{{ t('app.statusScale') }}: {{ Math.round(scale * 100) }}%</span>
      <span>{{ t('app.statusAnnotations') }}: {{ annotationStore.currentAnnotations.length }}</span>
      <span>{{ t('app.statusMode') }}: {{ annotationStore.currentPlantName ? t('app.modeDraw') : t('app.modeSelect') }}</span>
      <span>{{ t('app.shortcuts') }}</span>
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

provide('canvasScale', scale)
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
  width: 200px;
  display: flex;
  flex-direction: column;
  background: #20203a;
  border-right: 1px solid #333;
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

.right-panel {
  width: 240px;
  display: flex;
  flex-direction: column;
  background: #20203a;
  border-left: 1px solid #333;
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
