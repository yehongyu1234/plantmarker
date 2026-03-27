import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Annotation, Point } from '@/types'
import { getPlantColor, getPlantColorAlpha, generateId } from '@/utils/export'
import { useImageStore } from './imageStore'

export const useAnnotationStore = defineStore('annotation', () => {
  const annotationsMap = ref<Map<string, Annotation[]>>(new Map())
  const selectedAnnotationId = ref<string | null>(null)
  const currentPlantName = ref('')
  const simplifyEpsilon = ref(5)
  const history = ref<{ imageKey: string; annotations: Annotation[] }[]>([])
  const historyIndex = ref(-1)

  const imageStore = useImageStore()

  const currentAnnotations = computed(() => {
    if (!imageStore.currentImage) return []
    return annotationsMap.value.get(imageStore.currentImage.path) || []
  })

  const selectedAnnotation = computed(() => {
    if (!selectedAnnotationId.value) return null
    return currentAnnotations.value.find(a => a.id === selectedAnnotationId.value) || null
  })

  const annotatedImagePaths = computed(() => {
    const paths = new Set<string>()
    annotationsMap.value.forEach((anns, path) => {
      if (anns.length > 0) paths.add(path)
    })
    return paths
  })

  function addAnnotation(points: Point[]) {
    if (!imageStore.currentImage || !currentPlantName.value || points.length < 3) return null

    const annotation: Annotation = {
      id: generateId(),
      plantName: currentPlantName.value,
      points: [...points],
      color: getPlantColor(currentPlantName.value),
    }

    const key = imageStore.currentImage.path
    const existing = annotationsMap.value.get(key) || []
    saveHistory(key)
    annotationsMap.value.set(key, [...existing, annotation])
    selectedAnnotationId.value = annotation.id
    return annotation
  }

  function deleteAnnotation(id: string) {
    if (!imageStore.currentImage) return
    const key = imageStore.currentImage.path
    const existing = annotationsMap.value.get(key) || []
    saveHistory(key)
    annotationsMap.value.set(key, existing.filter(a => a.id !== id))
    if (selectedAnnotationId.value === id) {
      selectedAnnotationId.value = null
    }
  }

  function updateAnnotationPlantName(id: string, plantName: string) {
    if (!imageStore.currentImage) return
    const key = imageStore.currentImage.path
    const existing = annotationsMap.value.get(key) || []
    const index = existing.findIndex(a => a.id === id)
    if (index >= 0) {
      saveHistory(key)
      existing[index] = {
        ...existing[index],
        plantName,
        color: getPlantColor(plantName),
      }
      annotationsMap.value.set(key, [...existing])
    }
  }

  function selectAnnotation(id: string | null) {
    selectedAnnotationId.value = id
  }

  function getAnnotationColor(plantName: string, selected: boolean = false): string {
    const alpha = selected ? 0.6 : 0.4
    return getPlantColorAlpha(plantName, alpha)
  }

  function getAnnotationBorderColor(plantName: string): string {
    return getPlantColor(plantName)
  }

  function saveHistory(key: string) {
    const existing = annotationsMap.value.get(key) || []
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push({ imageKey: key, annotations: JSON.parse(JSON.stringify(existing)) })
    historyIndex.value = history.value.length - 1
  }

  function undo() {
    if (historyIndex.value < 0) return
    const entry = history.value[historyIndex.value]
    annotationsMap.value.set(entry.imageKey, JSON.parse(JSON.stringify(entry.annotations)))
    historyIndex.value--
  }

  function clearCurrentAnnotations() {
    if (!imageStore.currentImage) return
    const key = imageStore.currentImage.path
    saveHistory(key)
    annotationsMap.value.set(key, [])
    selectedAnnotationId.value = null
  }

  return {
    annotationsMap,
    selectedAnnotationId,
    currentPlantName,
    simplifyEpsilon,
    currentAnnotations,
    selectedAnnotation,
    annotatedImagePaths,
    addAnnotation,
    deleteAnnotation,
    updateAnnotationPlantName,
    selectAnnotation,
    getAnnotationColor,
    getAnnotationBorderColor,
    undo,
    clearCurrentAnnotations,
  }
})
