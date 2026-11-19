import { BufferAttribute, BufferGeometry } from 'three'
import type { Pt } from '../../shared/shore.ts'

function addPair(positions: number[], point: Pt, nx: number, nz: number, half: number, y: number) {
  positions.push(point.x + nx * half, y, point.z + nz * half, point.x - nx * half, y, point.z - nz * half)
}

export function ribbonGeometry(points: readonly Pt[], width: number, y = 0.04, closed = true): BufferGeometry {
  const positions: number[] = []
  const count = points.length
  for (let index = 0; index < count; index += 1) {
    const point = points[index]
    const prev = points[(index - 1 + count) % count]
    const next = points[(index + 1) % count]
    if (!point || !prev || !next) continue
    let tx = next.x - prev.x
    let tz = next.z - prev.z
    if (!closed && (index === 0 || index === count - 1)) {
      const other = index === 0 ? next : prev
      tx = index === 0 ? other.x - point.x : point.x - other.x
      tz = index === 0 ? other.z - point.z : point.z - other.z
    }
    const span = Math.hypot(tx, tz) || 1
    addPair(positions, point, -tz / span, tx / span, width / 2, y)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  const indices: number[] = []
  const segments = closed ? count : count - 1
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2
    const b = a + 1
    const c = ((index + 1) % count) * 2
    const d = c + 1
    indices.push(a, c, b, b, c, d)
  }
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
