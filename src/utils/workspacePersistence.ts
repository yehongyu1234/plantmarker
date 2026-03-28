import { useAnnotationStore } from '@/stores/annotationStore'
import { useImageStore } from '@/stores/imageStore'
import type { Annotation } from '@/types'
import { getPlantColor } from '@/utils/export'

const WORKSPACE_VERSION = 1 as const

let autosaveSuspended = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 600

export function setAutosaveSuspended(suspended: boolean) {
  autosaveSuspended = suspended
  if (suspended && debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

export function scheduleWorkspaceSave() {
  if (autosaveSuspended) return
  if (!useImageStore().folderPath) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void flushWorkspaceSave()
  }, DEBOUNCE_MS)
}

async function flushWorkspaceSave() {
  if (autosaveSuspended) return
  const folderPath = useImageStore().folderPath
  if (!folderPath) return

  const annotationStore = useAnnotationStore()
  const entries: Record<string, Annotation[]> = {}
  annotationStore.annotationsMap.forEach((anns, p) => {
    entries[p] = anns
  })

  const payload = {
    version: WORKSPACE_VERSION,
    savedAt: new Date().toISOString(),
    entries,
  }

  try {
    await window.electronAPI.writeWorkspaceFile(folderPath, JSON.stringify(payload))
  } catch (e) {
    console.error('workspace save failed', e)
  }
}

export async function loadWorkspaceForFolder(folderPath: string): Promise<void> {
  const raw = await window.electronAPI.readWorkspaceFile(folderPath)
  if (!raw) return

  let data: { version?: number; entries?: Record<string, unknown> }
  try {
    data = JSON.parse(raw)
  } catch {
    console.warn('Invalid workspace JSON')
    return
  }

  if (data.version !== 1 || !data.entries || typeof data.entries !== 'object') return

  const imageStore = useImageStore()
  const validPaths = new Set(imageStore.images.map(i => i.path))
  const map = new Map<string, Annotation[]>()

  for (const [imagePath, rawAnns] of Object.entries(data.entries)) {
    if (!validPaths.has(imagePath)) continue
    if (!Array.isArray(rawAnns)) continue

    const parsed: Annotation[] = []
    for (const item of rawAnns) {
      if (!item || typeof item !== 'object') continue
      const a = item as Partial<Annotation>
      const id = typeof a.id === 'string' ? a.id : ''
      const plantName = typeof a.plantName === 'string' ? a.plantName : ''
      const points = Array.isArray(a.points) ? a.points : []
      if (!id || !plantName || points.length < 3) continue

      const pts: { x: number; y: number }[] = []
      for (const p of points) {
        if (p && typeof p === 'object' && typeof (p as PointLike).x === 'number' && typeof (p as PointLike).y === 'number') {
          pts.push({ x: (p as PointLike).x, y: (p as PointLike).y })
        }
      }
      if (pts.length < 3) continue

      parsed.push({
        id,
        plantName,
        points: pts,
        color: getPlantColor(plantName),
      })
    }

    map.set(imagePath, parsed)
  }

  useAnnotationStore().replaceAnnotationsMap(map)
}

interface PointLike {
  x: number
  y: number
}
