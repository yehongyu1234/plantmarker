import type { Point } from '@/types'
import { pointToLineDistance } from './geometry'

export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points

  let maxDistance = 0
  let maxIndex = 0
  const end = points.length - 1

  for (let i = 1; i < end; i++) {
    const dist = pointToLineDistance(points[i], points[0], points[end])
    if (dist > maxDistance) {
      maxDistance = dist
      maxIndex = i
    }
  }

  if (maxDistance > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon)
    const right = rdpSimplify(points.slice(maxIndex), epsilon)
    return left.slice(0, -1).concat(right)
  }

  return [points[0], points[end]]
}

export function resamplePoints(points: Point[], count: number): Point[] {
  if (points.length <= count) return points

  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0
    return sum + Math.sqrt((p.x - points[i - 1].x) ** 2 + (p.y - points[i - 1].y) ** 2)
  }, 0)

  const interval = totalLength / (count - 1)
  const result: Point[] = [points[0]]
  let accDist = 0

  for (let i = 1; i < points.length && result.length < count; i++) {
    const dist = Math.sqrt((points[i].x - points[i - 1].x) ** 2 + (points[i].y - points[i - 1].y) ** 2)
    accDist += dist
    if (accDist >= interval) {
      result.push(points[i])
      accDist = 0
    }
  }

  if (result.length < count) {
    result.push(points[points.length - 1])
  }

  return result
}
