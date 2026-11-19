/**
 * Woncheon-inspired LOU Park.
 * This is not a survey of the real lake. 1 world unit is 1 meter.
 * South is +Z. The loop below is the walkable path centerline.
 *
 * Plan, clockwise from the south plaza:
 * - South: entrance plaza, guide, bag box, bin, first view of the lake.
 * - West: long wooden deck along a straighter shore, benches facing the water.
 * - North: the lake narrows into reeds and a quiet tree walk.
 * - East: open lawn, then the dog playground off the loop.
 * The centerline is scaled so its length is about 3,000m.
 */

export type Pt = { x: number; z: number }

const TARGET_LOOP_M = 3000

function design(t: number): Pt {
  const angle = t * Math.PI * 2
  const south = Math.cos(angle)
  const west = Math.sin(angle)
  let x = -230 * west
  let z = 690 * south
  const east = Math.max(0, -west)
  const southSide = Math.max(0, south)
  x += 110 * east * (0.4 + southSide)
  if (west > 0.15) {
    const straight = -205 - 8 * south
    const blend = Math.min(1, (west - 0.15) / 0.55)
    x = x * (1 - blend * 0.62) + straight * blend * 0.62
  }
  const north = Math.max(0, -south)
  x *= 1 - 0.48 * north * north
  z -= 55 * north
  return { x, z }
}

function lengthOf(points: readonly Pt[]): number {
  let total = 0
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]
    const b = points[(index + 1) % points.length]
    if (!a || !b) continue
    total += Math.hypot(b.x - a.x, b.z - a.z)
  }
  return total
}

function resample(points: readonly Pt[], spacing: number): Pt[] {
  const out: Pt[] = []
  let carry = 0
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]
    const b = points[(index + 1) % points.length]
    if (!a || !b) continue
    let remain = Math.hypot(b.x - a.x, b.z - a.z)
    let walked = 0
    while (carry + (remain - walked) >= spacing) {
      const need = spacing - carry
      walked += need
      const t = walked / remain
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
      carry = 0
    }
    carry += remain - walked
  }
  return out
}

function buildLoop(): Pt[] {
  const raw: Pt[] = []
  for (let index = 0; index < 240; index += 1) raw.push(design(index / 240))
  const scale = TARGET_LOOP_M / lengthOf(raw)
  const scaled = raw.map((point) => ({ x: point.x * scale, z: point.z * scale }))
  let south = 0
  for (let index = 1; index < scaled.length; index += 1) {
    const current = scaled[index]
    const best = scaled[south]
    if (current && best && current.z > best.z) south = index
  }
  const rotated = scaled.slice(south).concat(scaled.slice(0, south))
  const next = rotated[1]
  const first = rotated[0]
  const ordered = next && first && next.x > first.x ? [first, ...rotated.slice(1).reverse()] : rotated
  return resample(ordered, 4)
}

export const LOOP: readonly Pt[] = buildLoop()
export const LOOP_LENGTH = lengthOf(LOOP)

function centroid(points: readonly Pt[]): Pt {
  let x = 0
  let z = 0
  for (const point of points) {
    x += point.x
    z += point.z
  }
  return { x: x / points.length, z: z / points.length }
}

const CENTER = centroid(LOOP)

export type Frame = Pt & { tx: number; tz: number; nx: number; nz: number; distance: number }

function frameOf(index: number): Frame {
  const count = LOOP.length
  const point = LOOP[index] ?? CENTER
  const prev = LOOP[(index - 1 + count) % count] ?? point
  const next = LOOP[(index + 1) % count] ?? point
  let tx = next.x - prev.x
  let tz = next.z - prev.z
  const span = Math.hypot(tx, tz) || 1
  tx /= span
  tz /= span
  let nx = -tz
  let nz = tx
  if (nx * (point.x - CENTER.x) + nz * (point.z - CENTER.z) < 0) {
    nx = -nx
    nz = -nz
  }
  return { x: point.x, z: point.z, tx, tz, nx, nz, distance: index * 4 }
}

export function frameAt(distance: number): Frame {
  const wrapped = ((distance % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH
  const index = Math.round(wrapped / 4) % LOOP.length
  const frame = frameOf(index)
  return { ...frame, distance: wrapped }
}

export function pointAtArc(distance: number): Pt {
  const wrapped = ((distance % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH
  const scaled = wrapped / 4
  const index = Math.floor(scaled) % LOOP.length
  const nextIndex = (index + 1) % LOOP.length
  const start = LOOP[index]
  const end = LOOP[nextIndex]
  if (!start || !end) return { x: 0, z: 0 }
  const blend = scaled - Math.floor(scaled)
  return { x: start.x + (end.x - start.x) * blend, z: start.z + (end.z - start.z) * blend }
}

export function nearestLoopArc(x: number, z: number): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  for (let index = 0; index < LOOP.length; index += 1) {
    const start = LOOP[index]
    const end = LOOP[(index + 1) % LOOP.length]
    if (!start || !end) continue
    const sx = end.x - start.x
    const sz = end.z - start.z
    const span = sx * sx + sz * sz || 1
    const t = Math.min(1, Math.max(0, ((x - start.x) * sx + (z - start.z) * sz) / span))
    const distance = Math.hypot(x - (start.x + sx * t), z - (start.z + sz * t))
    if (distance < bestDistance) {
      bestDistance = distance
      best = index * 4 + t * 4
    }
  }
  return best
}

function offsetLoop(meters: number, outward: boolean): Pt[] {
  return LOOP.map((_, index) => {
    const frame = frameOf(index)
    const sign = outward ? 1 : -1
    return { x: frame.x + frame.nx * meters * sign, z: frame.z + frame.nz * meters * sign }
  })
}

function pushSouth(points: Pt[], extra: number): Pt[] {
  let maxZ = -Infinity
  for (const point of points) maxZ = Math.max(maxZ, point.z)
  return points.map((point) => (point.z > maxZ - 36 ? { x: point.x, z: point.z + extra * ((point.z - (maxZ - 36)) / 36) } : point))
}

export const LAKE: readonly Pt[] = offsetLoop(14, false)
export const PARK: readonly Pt[] = pushSouth(offsetLoop(48, true), 26)

function deckPolygon(): Pt[] {
  const inner: Pt[] = []
  const outer: Pt[] = []
  for (let index = 0; index < LOOP.length; index += 1) {
    const frame = frameOf(index)
    if (frame.nx > -0.72) continue
    if (frame.distance < 140 || frame.distance > 1280) continue
    inner.push({ x: frame.x - frame.nx * 30, z: frame.z - frame.nz * 30 })
    outer.push({ x: frame.x + frame.nx * 8, z: frame.z + frame.nz * 8 })
  }
  return inner.concat(outer.reverse())
}

export const DECK: readonly Pt[] = deckPolygon()

function wetlandPolygon(): Pt[] {
  const band: Pt[] = []
  for (let index = 0; index < LOOP.length; index += 1) {
    const frame = frameOf(index)
    if (frame.z > CENTER.z - 280) continue
    if (frame.nz > -0.2 && frame.z > CENTER.z - 520) continue
    band.push({ x: frame.x + frame.nx * 16, z: frame.z + frame.nz * 16 })
  }
  if (band.length < 4) return []
  const tip = band.reduce((best, point) => (point.z < best.z ? point : best), band[0] ?? CENTER)
  return [...band, { x: tip.x, z: tip.z - 34 }]
}

export const WETLAND: readonly Pt[] = wetlandPolygon()

export const PARK_BOUNDS = PARK.reduce(
  (bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minZ: Math.min(bounds.minZ, point.z),
    maxZ: Math.max(bounds.maxZ, point.z),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
)

export function pointInPolygon(x: number, z: number, polygon: readonly Pt[]): boolean {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index]
    const b = polygon[previous]
    if (!a || !b) continue
    const crosses = (a.z > z) !== (b.z > z)
    if (!crosses) continue
    const edge = (b.x - a.x) * (z - a.z) / ((b.z - a.z) || 1e-9) + a.x
    if (x < edge) inside = !inside
  }
  return inside
}

export function onDeck(x: number, z: number): boolean {
  return DECK.length > 3 && pointInPolygon(x, z, DECK)
}

export function inWater(x: number, z: number): boolean {
  if (onDeck(x, z)) return false
  return pointInPolygon(x, z, LAKE)
}

export function insideGrounds(x: number, z: number): boolean {
  return pointInPolygon(x, z, PARK)
}

export function segmentTouchesWater(ax: number, az: number, bx: number, bz: number): boolean {
  const distance = Math.hypot(bx - ax, bz - az)
  const steps = Math.max(1, Math.ceil(distance / 6))
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps
    if (inWater(ax + (bx - ax) * t, az + (bz - az) * t)) return true
  }
  return false
}
