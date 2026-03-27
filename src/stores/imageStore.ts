import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ImageInfo } from '@/types'

export const useImageStore = defineStore('image', () => {
  const images = ref<ImageInfo[]>([])
  const currentIndex = ref(-1)
  const folderPath = ref('')

  const currentImage = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < images.value.length) {
      return images.value[currentIndex.value]
    }
    return null
  })

  async function loadFolder(path: string) {
    folderPath.value = path
    const files = await window.electronAPI.readDirectory(path)
    const imageList: ImageInfo[] = []

    for (const file of files) {
      const size = await window.electronAPI.getImageSize(file.path)
      if (size) {
        imageList.push({
          name: file.name,
          path: file.path,
          width: size.width,
          height: size.height,
        })
      }
    }

    images.value = imageList
    currentIndex.value = imageList.length > 0 ? 0 : -1
  }

  async function loadImage(index: number) {
    if (index < 0 || index >= images.value.length) return
    currentIndex.value = index
    if (!images.value[index].base64) {
      const base64 = await window.electronAPI.readImageBase64(images.value[index].path)
      if (base64) {
        images.value[index].base64 = base64
      }
    }
  }

  function selectImage(index: number) {
    if (index >= 0 && index < images.value.length) {
      currentIndex.value = index
    }
  }

  function nextImage() {
    if (currentIndex.value < images.value.length - 1) {
      selectImage(currentIndex.value + 1)
    }
  }

  function prevImage() {
    if (currentIndex.value > 0) {
      selectImage(currentIndex.value - 1)
    }
  }

  return {
    images,
    currentIndex,
    folderPath,
    currentImage,
    loadFolder,
    loadImage,
    selectImage,
    nextImage,
    prevImage,
  }
})
