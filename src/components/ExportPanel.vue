<template>
  <div class="export-panel">
    <div class="section">
      <div class="section-header">{{ t('export.title') }}</div>
      <div class="export-buttons">
        <button class="export-btn" @click="exportJson" :disabled="!imageStore.currentImage">
          {{ t('export.exportJson') }}
        </button>
        <button class="export-btn batch" @click="exportJsonl">
          {{ t('export.exportJsonl') }}
        </button>
        <button class="export-btn clear" @click="clearAnnotations" :disabled="!imageStore.currentImage">
          {{ t('export.clearCurrent') }}
        </button>
      </div>
    </div>

    <div class="section">
      <div class="section-header">{{ t('export.status') }}</div>
      <div class="status-info">
        <div class="status-row">
          <span>{{ t('export.totalImages') }}</span>
          <span>{{ imageStore.images.length }}</span>
        </div>
        <div class="status-row">
          <span>{{ t('export.annotated') }}</span>
          <span>{{ annotationStore.annotatedImagePaths.size }}</span>
        </div>
        <div class="status-row">
          <span>{{ t('export.currentAnnotations') }}</span>
          <span>{{ annotationStore.currentAnnotations.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '@/stores/imageStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { exportAnnotationJson, exportJsonlItem } from '@/utils/export'
import { t } from '@/utils/i18n'

const imageStore = useImageStore()
const annotationStore = useAnnotationStore()

async function exportJson() {
  if (!imageStore.currentImage) return

  const data = exportAnnotationJson(imageStore.currentImage, annotationStore.currentAnnotations)
  const jsonStr = JSON.stringify(data, null, 2)

  const filePath = await window.electronAPI.saveFile(
    `${imageStore.currentImage.name.replace(/\.[^.]+$/, '')}.json`,
    [{ name: 'JSON', extensions: ['json'] }]
  )

  if (filePath) {
    await window.electronAPI.writeFile(filePath, jsonStr)
  }
}

async function exportJsonl() {
  const filePath = await window.electronAPI.saveFile('annotations.jsonl', [
    { name: 'JSONL', extensions: ['jsonl'] },
  ])

  if (!filePath) return

  const lines: string[] = []

  for (const img of imageStore.images) {
    const annotations = annotationStore.annotationsMap.get(img.path) || []
    if (annotations.length > 0) {
      const item = exportJsonlItem(img, annotations)
      lines.push(JSON.stringify(item))
    }
  }

  if (lines.length > 0) {
    await window.electronAPI.writeFile(filePath, lines.join('\n'))
  }
}

function clearAnnotations() {
  if (confirm(t('export.confirmClear'))) {
    annotationStore.clearCurrentAnnotations()
  }
}
</script>

<style scoped>
.export-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section {
  background: #252540;
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #1e1e38;
}

.export-buttons {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-btn {
  width: 100%;
  background: #6366f1;
  border: none;
  border-radius: 4px;
  color: #fff;
  padding: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
}

.export-btn:hover:not(:disabled) {
  background: #5558e6;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn.batch {
  background: #0ea5e9;
}

.export-btn.batch:hover:not(:disabled) {
  background: #0284c7;
}

.export-btn.clear {
  background: #374151;
}

.export-btn.clear:hover:not(:disabled) {
  background: #4b5563;
}

.status-info {
  padding: 8px 12px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.status-row span:first-child {
  color: #888;
}

.status-row span:last-child {
  color: #ddd;
}
</style>
