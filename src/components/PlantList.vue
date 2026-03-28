<template>
  <div class="plant-list">
    <div class="list-header">
      <span>{{ t('plantList.title') }}</span>
      <span class="count">{{ plantStore.plants.length }}</span>
    </div>
    <div class="search-box">
      <input
        v-model="searchQuery"
        :placeholder="t('plantList.searchPlaceholder')"
        class="search-input"
        @keydown="onSearchKeyDown"
      />
      <div v-if="searchQuery && filteredPlants.length > 0" class="search-results">
        <div
          v-for="(plant, index) in filteredPlants"
          :key="plant"
          class="search-item"
          :class="{ active: plant === annotationStore.currentPlantName }"
          @click="onSelect(plant)"
        >
          <div class="color-dot" :style="{ background: getColor(plant) }" />
          <span class="plant-name">{{ plant }}</span>
        </div>
      </div>
    </div>
    <div class="scroll-container">
      <div
        v-for="(plant, index) in plantStore.plants"
        :key="plant"
        class="plant-item"
        :class="{ active: plant === annotationStore.currentPlantName }"
        @click="onSelect(plant)"
      >
        <div class="color-dot" :style="{ background: getColor(plant) }" />
        <span class="plant-name">{{ plant }}</span>
        <span class="shortcut" v-if="index < 9">{{ index + 1 }}</span>
        <button class="delete-btn" @click.stop="plantStore.removePlant(plant)">x</button>
      </div>
      <div v-if="plantStore.plants.length === 0" class="empty">
        {{ t('plantList.noPlants') }}
      </div>
    </div>
    <div class="add-plant">
      <input
        v-model="newPlantName"
        :placeholder="t('plantList.addPlaceholder')"
        @keyup.enter="addPlant"
      />
      <button @click="addPlant">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlantStore } from '@/stores/plantStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { getPlantColor } from '@/utils/export'
import { t } from '@/utils/i18n'
import { toPinyin, toPinyinInitials } from '@/utils/pinyin'

const plantStore = usePlantStore()
const annotationStore = useAnnotationStore()

const newPlantName = ref('')
const searchQuery = ref('')

const filteredPlants = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.trim().toLowerCase()
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

function getColor(name: string): string {
  return getPlantColor(name)
}

function onSelect(plant: string) {
  annotationStore.currentPlantName = plant
  searchQuery.value = ''
}

function onSearchKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && filteredPlants.value.length > 0) {
    onSelect(filteredPlants.value[0])
  }
  if (e.key === 'Escape') {
    searchQuery.value = ''
  }
  if (e.key >= '1' && e.key <= '9' && filteredPlants.value.length > 0) {
    const index = parseInt(e.key) - 1
    if (index < filteredPlants.value.length) {
      onSelect(filteredPlants.value[index])
    }
  }
}

function addPlant() {
  if (newPlantName.value.trim()) {
    plantStore.addPlant(newPlantName.value.trim())
    newPlantName.value = ''
  }
}
</script>

<style scoped>
.plant-list {
  width: 100%;
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

.search-box {
  position: relative;
  padding: 6px 8px;
  border-bottom: 1px solid #333;
}

.search-input {
  width: 100%;
  background: #2a2a4a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  color: #ddd;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #6366f1;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 8px;
  right: 8px;
  background: #252540;
  border: 1px solid #444;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.search-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 8px;
}

.search-item:hover {
  background: #2a2a4a;
}

.search-item.active {
  background: #3a3a5a;
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
  padding: 4px;
}

.plant-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 8px;
}

.plant-item:hover {
  background: #2a2a4a;
}

.plant-item.active {
  background: #3a3a5a;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.plant-name {
  flex: 1;
  font-size: 13px;
  color: #ddd;
}

.shortcut {
  font-size: 10px;
  color: #666;
  background: #333;
  padding: 1px 5px;
  border-radius: 3px;
}

.delete-btn {
  opacity: 0;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;
}

.plant-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ef4444;
}

.add-plant {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid #333;
}

.add-plant input {
  flex: 1;
  background: #2a2a4a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  color: #ddd;
  font-size: 12px;
  outline: none;
}

.add-plant input:focus {
  border-color: #6366f1;
}

.add-plant button {
  background: #6366f1;
  border: none;
  border-radius: 4px;
  color: #fff;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 14px;
}

.add-plant button:hover {
  background: #5558e6;
}

.empty {
  text-align: center;
  color: #666;
  padding: 20px;
  font-size: 13px;
}
</style>
