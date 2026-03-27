<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="tool-btn" @click="selectFolder" :title="t('toolbar.folder')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span>{{ t('toolbar.folder') }}</span>
      </button>
      <button class="tool-btn" @click="importPlants" :title="t('toolbar.plants')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>{{ t('toolbar.plants') }}</span>
      </button>
      <div class="divider" />
      <button
        class="tool-btn"
        :class="{ active: annotationStore.currentPlantName }"
        @click="toggleDrawMode"
        :title="t('toolbar.draw')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        </svg>
        <span>{{ t('toolbar.draw') }}</span>
      </button>
    </div>
    <div class="toolbar-center">
      <span v-if="imageStore.currentImage" class="image-info">
        {{ imageStore.currentImage.name }}
        <span class="size">{{ imageStore.currentImage.width }}x{{ imageStore.currentImage.height }}</span>
      </span>
    </div>
    <div class="toolbar-right">
      <span v-if="annotationStore.currentPlantName" class="current-plant">
        <span class="plant-dot" :style="{ background: getPlantColor(annotationStore.currentPlantName) }" />
        {{ annotationStore.currentPlantName }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '@/stores/imageStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { usePlantStore } from '@/stores/plantStore'
import { getPlantColor } from '@/utils/export'
import { t } from '@/utils/i18n'

const imageStore = useImageStore()
const annotationStore = useAnnotationStore()
const plantStore = usePlantStore()

async function selectFolder() {
  console.log('selectFolder called, electronAPI:', typeof window.electronAPI)
  const folderPath = await window.electronAPI.selectFolder()
  console.log('selected folder:', folderPath)
  if (folderPath) {
    await imageStore.loadFolder(folderPath)
    if (imageStore.images.length > 0) {
      await imageStore.loadImage(0)
    }
  }
}

async function importPlants() {
  const filePath = await window.electronAPI.selectFile([
    { name: 'Text Files', extensions: ['txt', 'csv'] },
  ])
  if (filePath) {
    await plantStore.loadFromFile(filePath)
  }
}

function toggleDrawMode() {
  if (annotationStore.currentPlantName) {
    annotationStore.currentPlantName = ''
  } else if (plantStore.plants.length > 0) {
    annotationStore.currentPlantName = plantStore.plants[0]
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  background: #1e1e38;
  border-bottom: 1px solid #333;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #999;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #2a2a4a;
  color: #ddd;
}

.tool-btn.active {
  background: #6366f1;
  color: #fff;
}

.divider {
  width: 1px;
  height: 20px;
  background: #333;
  margin: 0 4px;
}

.image-info {
  font-size: 12px;
  color: #999;
}

.size {
  color: #666;
  margin-left: 8px;
}

.current-plant {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ddd;
  background: #2a2a4a;
  padding: 4px 10px;
  border-radius: 12px;
}

.plant-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
