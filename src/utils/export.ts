import type { Annotation, ImageInfo, ImageExport, JsonlItem, AnnotationExport } from '@/types'

export function getPlantColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}

export function getPlantColorAlpha(name: string, alpha: number = 0.4): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsla(${hue}, 70%, 50%, ${alpha})`
}

export function exportAnnotationJson(
  image: ImageInfo,
  annotations: Annotation[]
): ImageExport {
  const annotationExports: AnnotationExport[] = annotations.map(ann => {
    const normalized = ann.points.map(p => [
      Math.round((p.x / image.width) * 1000) / 1000,
      Math.round((p.y / image.height) * 1000) / 1000,
    ] as [number, number])

    const pixel = ann.points.map(p => [Math.round(p.x), Math.round(p.y)] as [number, number])

    const xs = ann.points.map(p => p.x / image.width)
    const ys = ann.points.map(p => p.y / image.height)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    let area = 0
    const n = normalized.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += normalized[i][0] * normalized[j][1]
      area -= normalized[j][0] * normalized[i][1]
    }
    area = Math.abs(area) / 2

    return {
      id: ann.id,
      plant_name: ann.plantName,
      polygon: { normalized, pixel },
      area_normalized: Math.round(area * 10000) / 10000,
      bbox_normalized: [
        Math.round(minX * 1000) / 1000,
        Math.round(minY * 1000) / 1000,
        Math.round((maxX - minX) * 1000) / 1000,
        Math.round((maxY - minY) * 1000) / 1000,
      ],
    }
  })

  return {
    image: {
      filename: image.name,
      width: image.width,
      height: image.height,
    },
    annotations: annotationExports,
    metadata: {
      created_at: new Date().toISOString(),
      tool_version: '1.0.0',
    },
  }
}

export function exportJsonlItem(
  image: ImageInfo,
  annotations: Annotation[]
): JsonlItem {
  return {
    image: image.name,
    width: image.width,
    height: image.height,
    annotations: annotations.map(ann => {
      const normalized = ann.points.map(p => [
        Math.round((p.x / image.width) * 1000) / 1000,
        Math.round((p.y / image.height) * 1000) / 1000,
      ] as [number, number])

      const xs = normalized.map(p => p[0])
      const ys = normalized.map(p => p[1])

      return {
        plant_name: ann.plantName,
        polygon_normalized: normalized,
        bbox_normalized: [
          Math.round(Math.min(...xs) * 1000) / 1000,
          Math.round(Math.min(...ys) * 1000) / 1000,
          Math.round((Math.max(...xs) - Math.min(...xs)) * 1000) / 1000,
          Math.round((Math.max(...ys) - Math.min(...ys)) * 1000) / 1000,
        ],
      }
    }),
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
