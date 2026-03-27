import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlantStore = defineStore('plant', () => {
  const plants = ref<string[]>([])

  async function loadFromFile(filePath: string) {
    const content = await window.electronAPI.readTextFile(filePath)
    if (!content) return

    const ext = filePath.split('.').pop()?.toLowerCase()
    let names: string[] = []

    if (ext === 'csv') {
      const lines = content.split('\n')
      for (const line of lines) {
        const firstCol = line.split(',')[0].trim()
        if (firstCol && firstCol.length > 0) {
          names.push(firstCol)
        }
      }
    } else {
      names = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    }

    plants.value = [...new Set(names)]
  }

  function addPlant(name: string) {
    const trimmed = name.trim()
    if (trimmed && !plants.value.includes(trimmed)) {
      plants.value.push(trimmed)
    }
  }

  function removePlant(name: string) {
    plants.value = plants.value.filter(p => p !== name)
  }

  function updatePlant(oldName: string, newName: string) {
    const index = plants.value.indexOf(oldName)
    if (index >= 0) {
      plants.value[index] = newName.trim()
    }
  }

  return {
    plants,
    loadFromFile,
    addPlant,
    removePlant,
    updatePlant,
  }
})
