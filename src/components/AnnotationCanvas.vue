<template>
  <div class="canvas-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @dblclick="onDoubleClick"
      @wheel="onWheel"
      @contextmenu.prevent
    />
    <div v-if="!imageStore.currentImage" class="empty-state">
      <span>{{ t('empty.selectFolder') }}</span>
    </div>
    <div v-if="hintsState === 'open'" class="canvas-hints" role="region" :aria-label="t('canvas.hintsTitle')">
      <div class="canvas-hints-header">
        <span class="canvas-hints-title">{{ t('canvas.hintsTitle') }}</span>
        <div class="canvas-hints-actions" @mousedown.stop @click.stop>
          <button type="button" class="hint-btn" @click="collapseHints">{{ t('canvas.hintsCollapse') }}</button>
          <button type="button" class="hint-btn hint-btn-close" @click="closeHints">{{ t('canvas.hintsClose') }}</button>
        </div>
      </div>
      <ul class="canvas-hints-list">
        <li>{{ t('canvas.pan') }}</li>
        <li>{{ t('canvas.zoom') }}</li>
        <li>{{ t('canvas.selectMode') }}</li>
        <li>{{ t('canvas.drawStroke') }}</li>
        <li>{{ t('canvas.drawPan') }}</li>
        <li>{{ t('canvas.pointMode') }}</li>
        <li class="canvas-hints-autosave">{{ t('canvas.autosave') }}</li>
        <li class="canvas-hints-keys">{{ t('canvas.keys') }}</li>
      </ul>
    </div>
    <button
      v-else-if="hintsState === 'collapsed'"
      type="button"
      class="canvas-hints-trigger"
      :title="t('canvas.hintsShow')"
      @click="expandHints"
    >
      {{ t('canvas.hintsTitle') }}
    </button>
    <button
      v-else
      type="button"
      class="canvas-hints-trigger canvas-hints-trigger-minimal"
      :title="t('canvas.hintsShow')"
      @click="expandHints"
    >
      ?
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useImageStore } from '@/stores/imageStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { usePlantStore } from '@/stores/plantStore'
import type { Point, Annotation } from '@/types'
import { rdpSimplify } from '@/utils/simplify'
import { isPointInPolygon, snapToStart, distance } from '@/utils/geometry'
import { t } from '@/utils/i18n'

const imageStore = useImageStore()
const annotationStore = useAnnotationStore()

const HINTS_STORAGE_KEY = 'plantmarker-canvas-hints'

type HintsState = 'open' | 'collapsed' | 'hidden'

function readHintsState(): HintsState {
  try {
    const v = localStorage.getItem(HINTS_STORAGE_KEY)
    if (v === 'collapsed' || v === 'hidden' || v === 'open') return v
  } catch {
    /* ignore */
  }
  return 'open'
}

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hintsState = ref<HintsState>(readHintsState())

function collapseHints() {
  hintsState.value = 'collapsed'
}

function closeHints() {
  hintsState.value = 'hidden'
}

function expandHints() {
  hintsState.value = 'open'
}

let ctx: CanvasRenderingContext2D | null = null
let image: HTMLImageElement | null = null
let scale = 1
let offsetX = 0
let offsetY = 0
let isPanning = false
let isDrawing = false
let lastPanX = 0
let lastPanY = 0
let drawingPoints: Point[] = []
let pointModePoints: Point[] = []

function resizeCanvas() {
  if (!canvasRef.value || !containerRef.value) return
  canvasRef.value.width = containerRef.value.clientWidth
  canvasRef.value.height = containerRef.value.clientHeight
  render()
}

function loadImage() {
  if (!imageStore.currentImage?.base64) {
    image = null
    render()
    return
  }

  image = new Image()
  image.onload = () => {
    fitImage()
    render()
  }
  image.src = imageStore.currentImage.base64
}

function fitImage() {
  if (!image || !canvasRef.value) return
  const cw = canvasRef.value.width
  const ch = canvasRef.value.height
  const iw = image.width
  const ih = image.height
  scale = Math.min(cw / iw, ch / ih) * 0.9
  offsetX = (cw - iw * scale) / 2
  offsetY = (ch - ih * scale) / 2
}

function screenToImage(x: number, y: number): Point {
  return {
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale,
  }
}

function imageToScreen(x: number, y: number): Point {
  return {
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  }
}

function render() {
  if (!ctx || !canvasRef.value) return
  const cw = canvasRef.value.width
  const ch = canvasRef.value.height

  ctx.clearRect(0, 0, cw, ch)
  ctx.fillStyle = '#2a2a3e'
  ctx.fillRect(0, 0, cw, ch)

  if (image) {
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)
    ctx.drawImage(image, 0, 0)
    ctx.restore()

    drawAnnotations()
    drawCurrentDrawing()
  }
}

function drawAnnotations() {
  if (!ctx) return

  for (const ann of annotationStore.currentAnnotations) {
    const isSelected = ann.id === annotationStore.selectedAnnotationId
    drawPolygon(ann.points, ann.plantName, isSelected, ann.id)
  }
}

function drawPolygon(points: Point[], plantName: string, selected: boolean, id: string) {
  if (!ctx || points.length < 3) return

  const fillColor = annotationStore.getAnnotationColor(plantName, selected)
  const borderColor = annotationStore.getAnnotationBorderColor(plantName)
  const lineWidth = selected ? 3 / scale : 2 / scale

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = borderColor
  ctx.lineWidth = lineWidth
  ctx.stroke()

  const labelX = points[0].x
  const labelY = points[0].y - 16 / scale
  ctx.font = `${14 / scale}px sans-serif`
  ctx.fillStyle = borderColor
  ctx.fillText(plantName, labelX, labelY)

  ctx.restore()
}

function drawCurrentDrawing() {
  if (!ctx) return
  const points = annotationStore.currentPlantName === 'point' ? pointModePoints : drawingPoints
  if (points.length === 0) return

  const fillColor = annotationStore.getAnnotationColor(
    annotationStore.currentPlantName || 'default',
    false
  )
  const borderColor = annotationStore.getAnnotationBorderColor(
    annotationStore.currentPlantName || 'default'
  )

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  if (points.length >= 3) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2 / scale
    ctx.stroke()
  } else if (points.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2 / scale
    ctx.stroke()
  }

  for (const p of points) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4 / scale, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1 / scale
    ctx.stroke()
  }

  ctx.restore()
}

function onMouseDown(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
    isPanning = true
    lastPanX = x
    lastPanY = y
    return
  }

  if (e.button === 0 && !annotationStore.currentPlantName) {
    const imgPoint = screenToImage(x, y)
    const clicked = findAnnotationAtPoint(imgPoint)
    annotationStore.selectAnnotation(clicked?.id || null)
    render()
    return
  }

  if (e.button === 0 && annotationStore.currentPlantName) {
    if (e.shiftKey) {
      isPanning = true
      lastPanX = x
      lastPanY = y
      return
    }

    isDrawing = true
    const imgPoint = screenToImage(x, y)
    drawingPoints = [imgPoint]
    render()
  }
}

function onMouseMove(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (isPanning) {
    offsetX += x - lastPanX
    offsetY += y - lastPanY
    lastPanX = x
    lastPanY = y
    render()
    return
  }

  if (isDrawing) {
    const imgPoint = screenToImage(x, y)
    drawingPoints.push(imgPoint)
    render()
  }
}

function onMouseUp(e: MouseEvent) {
  if (isPanning) {
    isPanning = false
    return
  }

  if (isDrawing && drawingPoints.length > 2) {
    const simplified = rdpSimplify(drawingPoints, annotationStore.simplifyEpsilon)
    if (simplified.length >= 3) {
      annotationStore.addAnnotation(simplified)
    }
    drawingPoints = []
    isDrawing = false
    render()
  } else {
    drawingPoints = []
    isDrawing = false
    render()
  }
}

function onDoubleClick(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const imgPoint = screenToImage(x, y)

  if (pointModePoints.length >= 3 && snapToStart([...pointModePoints, imgPoint])) {
    const simplified = rdpSimplify(pointModePoints, annotationStore.simplifyEpsilon)
    if (simplified.length >= 3) {
      annotationStore.addAnnotation(simplified)
    }
    pointModePoints = []
    render()
    return
  }

  if (annotationStore.currentPlantName) {
    pointModePoints.push(imgPoint)
    render()
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(20, scale * zoomFactor))

  offsetX = x - (x - offsetX) * (newScale / scale)
  offsetY = y - (y - offsetY) * (newScale / scale)
  scale = newScale

  render()
}

function findAnnotationAtPoint(point: Point): Annotation | null {
  for (let i = annotationStore.currentAnnotations.length - 1; i >= 0; i--) {
    const ann = annotationStore.currentAnnotations[i]
    if (isPointInPolygon(point, ann.points)) {
      return ann
    }
  }
  return null
}

/** 焦点在可编辑控件上时不拦截快捷键，避免 Backspace/Delete 删字时误删标注 */
function isEditableKeyTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  if (el.closest('[contenteditable="true"]')) return true
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type
    const nonText = new Set([
      'button',
      'checkbox',
      'radio',
      'submit',
      'reset',
      'range',
      'file',
      'color',
      'image',
      'hidden',
    ])
    return !nonText.has(type)
  }
  return false
}

function handleKeyDown(e: KeyboardEvent) {
  if (isEditableKeyTarget(e)) return

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (annotationStore.selectedAnnotationId) {
      annotationStore.deleteAnnotation(annotationStore.selectedAnnotationId)
      render()
    }
  }
  if (e.key === 'z' && e.ctrlKey) {
    annotationStore.undo()
    render()
  }
  if (e.key === 'Escape') {
    drawingPoints = []
    pointModePoints = []
    isDrawing = false
    annotationStore.selectAnnotation(null)
    render()
  }
  if (e.key >= '1' && e.key <= '9') {
    const index = parseInt(e.key) - 1
    const plantStore = usePlantStore()
    if (index < plantStore.plants.length) {
      annotationStore.currentPlantName = plantStore.plants[index]
    }
  }
}

watch(() => imageStore.currentImage, () => {
  nextTick(() => {
    loadImage()
    annotationStore.selectAnnotation(null)
    drawingPoints = []
    pointModePoints = []
  })
})

watch(() => imageStore.currentImage?.base64, () => {
  loadImage()
})

watch(() => annotationStore.currentAnnotations, () => {
  render()
}, { deep: true })

watch(() => annotationStore.selectedAnnotationId, () => {
  render()
})

watch(hintsState, state => {
  try {
    localStorage.setItem(HINTS_STORAGE_KEY, state)
  } catch {
    /* ignore */
  }
})

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') || null
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
}

canvas {
  display: block;
  cursor: crosshair;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 16px;
  pointer-events: none;
}

.canvas-hints {
  position: absolute;
  right: 10px;
  bottom: 10px;
  max-width: min(320px, calc(100% - 20px));
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.45;
  color: #9a9ab8;
  text-align: right;
  pointer-events: auto;
  background: rgba(21, 21, 40, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

.canvas-hints-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.canvas-hints-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #6b6b8a;
  text-transform: uppercase;
  flex: 1;
  text-align: left;
}

.canvas-hints-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.hint-btn {
  padding: 2px 6px;
  font-size: 10px;
  color: #9a9ab8;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.hint-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #c4c4e0;
}

.hint-btn-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.canvas-hints-trigger {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 6px 10px;
  font-size: 11px;
  color: #8b8ba8;
  background: rgba(21, 21, 40, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: background 0.15s, color 0.15s;
}

.canvas-hints-trigger:hover {
  background: rgba(42, 42, 74, 0.95);
  color: #c8c8e0;
}

.canvas-hints-trigger-minimal {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-hints-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.canvas-hints-list li + li {
  margin-top: 3px;
}

.canvas-hints-autosave {
  margin-top: 4px;
  font-size: 10px;
  color: #7a8a9e;
  line-height: 1.4;
}

.canvas-hints-keys {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #7c7c9a;
  font-size: 10px;
}
</style>
