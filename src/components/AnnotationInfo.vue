<template>
  <div class="annotation-info">
    <div class="section">
      <div class="section-header">{{ t('annotation.current') }}</div>
      <div v-if="annotationStore.selectedAnnotation" class="info-card">
        <div class="info-row">
          <span class="label">{{ t('annotation.plant') }}</span>
          <div class="select-wrapper">
            <input
              v-model="plantSearchQuery"
              class="select-search"
              :placeholder="t('plantList.searchPlaceholder')"
              @focus="showDropdown = true"
              @keydown="onDropdownKeyDown"
            />
            <div v-if="showDropdown && filteredPlants.length > 0" class="dropdown">
              <div
                v-for="p in filteredPlants"
                :key="p"
                class="dropdown-item"
                :class="{ active: p === annotationStore.selectedAnnotation?.plantName }"
                @mousedown.prevent="selectPlant(p)"
              >
                {{ p }}
              </div>
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="label">{{ t('annotation.points') }}</span>
          <span class="value">{{ annotationStore.selectedAnnotation.points.length }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ t('annotation.color') }}</span>
          <span class="color-preview" :style="{ background: annotationStore.selectedAnnotation.color }" />
        </div>
        <button class="delete-btn" @click="onDelete">{{ t('annotation.delete') }}</button>
      </div>
      <div v-else class="no-selection">
        {{ t('annotation.selectAnnotation') }}
      </div>
    </div>

    <div class="section">
      <div class="section-header">{{ t('annotation.list') }} ({{ annotationStore.currentAnnotations.length }})</div>
      <div class="annotation-list">
        <div
          v-for="ann in annotationStore.currentAnnotations"
          :key="ann.id"
          class="annotation-item"
          :class="{ active: ann.id === annotationStore.selectedAnnotationId }"
          @click="annotationStore.selectAnnotation(ann.id)"
        >
          <span class="dot" :style="{ background: ann.color }" />
          <span class="name">{{ ann.plantName }}</span>
          <span class="points">{{ ann.points.length }} pts</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">{{ t('annotation.simplifyTolerance') }}</div>
      <div class="slider-row">
        <input
          type="range"
          min="1"
          max="20"
          v-model.number="annotationStore.simplifyEpsilon"
        />
        <span class="slider-value">{{ annotationStore.simplifyEpsilon }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAnnotationStore } from '@/stores/annotationStore'
import { usePlantStore } from '@/stores/plantStore'
import { t } from '@/utils/i18n'
import { toPinyin, toPinyinInitials } from '@/utils/pinyin'

const annotationStore = useAnnotationStore()
const plantStore = usePlantStore()

const plantSearchQuery = ref('')
const showDropdown = ref(false)

const filteredPlants = computed(() => {
  if (!plantSearchQuery.value.trim()) return plantStore.plants
  const query = plantSearchQuery.value.trim().toLowerCase()
  const queryPinyin = toPinyin(query)
  const queryInitials = toPinyinInitials(query)

  return plantStore.plants.filter(plant => {
    const plantLower = plant.toLowerCase()
    const plantPinyin = toPinyin(plant)
    const plantInitials = toPinyinInitials(plant)

    return plantLower.includes(query) ||
           plantPinyin.includes(queryPinyin) ||
           plantInitials.includes(queryInitials)
  })
})

watch(() => annotationStore.selectedAnnotation, (ann) => {
  if (ann) {
    plantSearchQuery.value = ann.plantName
  } else {
    plantSearchQuery.value = ''
  }
  showDropdown.value = false
})

function selectPlant(plant: string) {
  if (annotationStore.selectedAnnotationId) {
    annotationStore.updateAnnotationPlantName(annotationStore.selectedAnnotationId, plant)
  }
  plantSearchQuery.value = plant
  showDropdown.value = false
}

function onDropdownKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    showDropdown.value = false
  }
  if (e.key === 'Enter' && filteredPlants.value.length > 0) {
    selectPlant(filteredPlants.value[0])
  }
}

function onDelete() {
  if (annotationStore.selectedAnnotationId) {
    annotationStore.deleteAnnotation(annotationStore.selectedAnnotationId)
  }
}
</script>

<style scoped>
.annotation-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section {
  background: #252540;
  border-radius: 6px;
  overflow: visible;
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

.info-card {
  padding: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 12px;
  color: #888;
}

.value {
  font-size: 13px;
  color: #ddd;
}

.select-wrapper {
  position: relative;
  flex: 1;
  margin-left: 8px;
}

.select-search {
  width: 100%;
  background: #2a2a4a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 2px 6px;
  color: #ddd;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.select-search:focus {
  border-color: #6366f1;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #252540;
  border: 1px solid #444;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  padding: 4px 8px;
  font-size: 12px;
  color: #ddd;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #2a2a4a;
}

.dropdown-item.active {
  background: #3a3a5a;
}

.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.delete-btn {
  width: 100%;
  background: #dc2626;
  border: none;
  border-radius: 4px;
  color: #fff;
  padding: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 4px;
}

.delete-btn:hover {
  background: #b91c1c;
}

.no-selection {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.annotation-list {
  max-height: 150px;
  overflow-y: auto;
}

.annotation-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 8px;
}

.annotation-item:hover {
  background: #2a2a4a;
}

.annotation-item.active {
  background: #3a3a5a;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.name {
  flex: 1;
  font-size: 12px;
  color: #ddd;
}

.points {
  font-size: 11px;
  color: #666;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.slider-row input {
  flex: 1;
}

.slider-value {
  font-size: 12px;
  color: #ddd;
  min-width: 20px;
  text-align: right;
}
</style>
