import { BAG_BOXES, PLAYGROUND, SPAWN, WASTE_BINS } from '../../shared/places.ts'
import { LAKE, LOOP, PARK_BOUNDS, type Pt } from '../../shared/shore.ts'

export function paintParkMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  you?: { x: number; z: number },
) {
  ctx.fillStyle = '#f7f1e4'
  ctx.fillRect(0, 0, width, height)
  const pad = 28
  const spanX = PARK_BOUNDS.maxX - PARK_BOUNDS.minX
  const spanZ = PARK_BOUNDS.maxZ - PARK_BOUNDS.minZ
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanZ)
  const originX = (width - spanX * scale) / 2
  const originY = (height - spanZ * scale) / 2
  const project = (point: Pt) => ({
    x: originX + (point.x - PARK_BOUNDS.minX) * scale,
    y: originY + (PARK_BOUNDS.maxZ - point.z) * scale,
  })
  const strokeLoop = (points: readonly Pt[], color: string, line: number) => {
    const first = points[0]
    if (!first) return
    ctx.beginPath()
    const start = project(first)
    ctx.moveTo(start.x, start.y)
    for (const point of points.slice(1)) {
      const next = project(point)
      ctx.lineTo(next.x, next.y)
    }
    ctx.closePath()
    ctx.strokeStyle = color
    ctx.lineWidth = line
    ctx.stroke()
  }
  const fillLoop = (points: readonly Pt[], color: string) => {
    const first = points[0]
    if (!first) return
    ctx.beginPath()
    const start = project(first)
    ctx.moveTo(start.x, start.y)
    for (const point of points.slice(1)) {
      const next = project(point)
      ctx.lineTo(next.x, next.y)
    }
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }
  fillLoop(LAKE, '#8fd4d4')
  strokeLoop(LOOP, '#e7d3ae', Math.max(3, 7 * scale))
  ctx.fillStyle = '#3d5c52'
  ctx.font = '700 22px "Malgun Gothic", "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  const entrance = project(SPAWN)
  ctx.fillStyle = '#ef86a8'
  ctx.beginPath()
  ctx.arc(entrance.x, entrance.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3d5c52'
  ctx.fillText('입구', entrance.x + 8, entrance.y - 8)
  const yard = project(PLAYGROUND)
  ctx.fillStyle = '#f7c3d0'
  ctx.fillRect(yard.x - 7, yard.y - 7, 14, 14)
  ctx.fillStyle = '#3d5c52'
  ctx.fillText('놀이터', yard.x + 10, yard.y + 4)
  ctx.fillStyle = '#8a5a3a'
  for (const box of BAG_BOXES) {
    const spot = project(box)
    ctx.fillRect(spot.x - 3, spot.y - 3, 6, 6)
  }
  ctx.fillStyle = '#2f6d58'
  for (const bin of WASTE_BINS) {
    const spot = project(bin)
    ctx.beginPath()
    ctx.arc(spot.x, spot.y, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
  if (you) {
    const here = project(you)
    ctx.fillStyle = '#ef5d86'
    ctx.beginPath()
    ctx.arc(here.x, here.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3d5c52'
    ctx.fillText('현재 위치', here.x + 10, here.y - 10)
  }
  ctx.font = '600 16px "Malgun Gothic", "Segoe UI", sans-serif'
  ctx.fillStyle = '#8a5a3a'
  ctx.fillText('봉투', 16, height - 16)
  ctx.fillStyle = '#2f6d58'
  ctx.fillText('휴지통', 78, height - 16)
}
