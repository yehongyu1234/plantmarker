export interface Point {
  x: number
  y: number
}

export interface ImageInfo {
  name: string
  path: string
  width: number
  height: number
  base64?: string
}

export interface Annotation {
  id: string
  plantName: string
  points: Point[]
  color: string
}

export interface AnnotationExport {
  id: string
  plant_name: string
  polygon: {
    normalized: [number, number][]
    pixel: [number, number][]
  }
  area_normalized: number
  bbox_normalized: [number, number, number, number]
}

export interface ImageExport {
  image: {
    filename: string
    width: number
    height: number
  }
  annotations: AnnotationExport[]
  metadata: {
    created_at: string
    tool_version: string
  }
}

export interface JsonlItem {
  image: string
  width: number
  height: number
  annotations: {
    plant_name: string
    polygon_normalized: [number, number][]
    bbox_normalized: [number, number, number, number]
  }[]
}

export type DrawMode = 'free' | 'point'
