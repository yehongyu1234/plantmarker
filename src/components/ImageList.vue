<template>
  <div class="image-list">
    <div class="list-header">
      <span>{{ t('imageList.title') }}</span>
      <span class="count">{{ imageStore.images.length }}</span>
    </div>
    <div class="scroll-container">
      <div
        v-for="(img, index) in imageStore.images"
        :key="img.path"
        class="image-item"
        :class="{ active: index === imageStore.currentIndex }"
        @click="onSelect(index)"
      >
        <div class="thumbnail-container">
          <img
            v-if="thumbnails[index]"
            :src="thumbnails[index]"
            class="thumbnail"
          />
          <div v-else class="thumbnail placeholder" />
          <div v-if="isAnnotated(img.path)" class="annotated-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div v-if="getAnnotationCount(img.path) > 0" class="annotation-count">
            {{ getAnnotationCount(img.path) }}
          </div>
        </div>
        <div class="image-name">{{ img.name }}</div>
        <div class="image-size">{{ img.width }}x{{ img.height }}</div>
      </div>
      <div v-if="imageStore.images.length === 0" class="empty">
        {{ t('imageList.noImages') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useImageStore } from '@/stores/imageStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { t } from '@/utils/i18n'

const imageStore = useImageStore()
const annotationStore = useAnnotationStore()

const thumbnails = ref<Record<number, string>>({})

async function loadThumbnails() {
  thumbnails.value = {}
  for (let i = 0; i < imageStore.images.length; i++) {
    const base64 = await window.electronAPI.readImageBase64(imageStore.images[i].path)
    if (base64) {
      thumbnails.value[i] = base64
    }
  }
}

function onSelect(index: number) {
  imageStore.selectImage(index)
  imageStore.loadImage(index)
}

function isAnnotated(path: string): boolean {
  return annotationStore.annotatedImagePaths.has(path)
}

function getAnnotationCount(path: string): number {
  return annotationStore.annotationsMap.get(path)?.length || 0
}

watch(() => imageStore.images, () => {
  loadThumbnails()
}, { deep: true })

onMounted(() => {
  if (imageStore.images.length > 0) {
    loadThumbnails()
  }
})
</script>

<style scoped>
.image-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #333;
}

.count {
  background: #333;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.image-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
}

.image-item:hover {
  background: #2a2a4a;
}

.image-item.active {
  background: #3a3a5a;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1a2e;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail.placeholder {
  background: #2a2a3e;
}

.annotated-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #22c55e;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.annotation-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.image-name {
  margin-top: 4px;
  font-size: 11px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-size {
  font-size: 10px;
  color: #666;
}

.empty {
  text-align: center;
  color: #666;
  padding: 20px;
  font-size: 13px;
}
</style>
