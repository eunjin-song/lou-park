import { FENCE_RADIUS, PATH_OUTER, PLAY_RADIUS, palette } from '../game/constants.ts'

export type TreeKind = 'round' | 'tall' | 'blossom'

export type TreeSpec = {
  x: number
  z: number
  scale: number
  kind: TreeKind
  rotation: number
}

export type BenchSpec = {
  x: number
  z: number
  yaw: number
}

export type FlowerSpec = {
  x: number
  z: number
  color: string
}

export type GrassPatch = {
  x: number
  z: number
  radius: number
  color: string
}

export const pond = {
  x: -6.2,
  z: 3.5,
  radius: 3.2,
} as const

const BENCH_RADIUS = 15.75
const BENCH_ANGLES = [0.42, 1.62, 2.75, 3.9, 5.3]

export const benches: BenchSpec[] = BENCH_ANGLES.map((angle) => ({
  x: Math.sin(angle) * BENCH_RADIUS,
  z: Math.cos(angle) * BENCH_RADIUS,
  yaw: angle + Math.PI,
}))

export const flowers: FlowerSpec[] = [
  { x: 1.15, z: 9.15, color: palette.blossom },
  { x: 1.85, z: 8.55, color: '#ffe38a' },
  { x: 0.85, z: 8.35, color: palette.blossomDeep },
  { x: -3.1, z: 8.7, color: '#d5c4f7' },
  { x: -3.75, z: 8.15, color: '#ffe38a' },
  { x: 6.4, z: 4.7, color: palette.blossom },
  { x: 5.85, z: 4.15, color: '#ffe38a' },
  { x: 4.6, z: -2.4, color: '#d5c4f7' },
  { x: -1.4, z: -4.8, color: '#ffe38a' },
  { x: -2.1, z: -4.2, color: palette.blossom },
  { x: 13.4, z: 16.2, color: palette.blossomDeep },
  { x: -15.2, z: 6.4, color: '#d5c4f7' },
  { x: 11.2, z: -12.4, color: '#ffe38a' },
  { x: -12.6, z: -11.5, color: palette.blossom },
]

export const grassPatches: GrassPatch[] = [
  { x: 3.2, z: 6.4, radius: 2.4, color: palette.grassLight },
  { x: -2.4, z: 7.2, radius: 1.8, color: palette.grassDark },
  { x: 6.2, z: -1.5, radius: 2.1, color: palette.grassLight },
  { x: -1.2, z: -3.4, radius: 2.6, color: palette.grassDark },
  { x: 16.5, z: 8, radius: 2.8, color: palette.grassLight },
  { x: -14, z: 14, radius: 2.3, color: palette.grassDark },
  { x: 8, z: -16, radius: 2.5, color: palette.grassLight },
]

const featuredTrees: TreeSpec[] = [
  { x: 2.6, z: 5.8, scale: 1.12, kind: 'round', rotation: 0.4 },
  { x: -1.8, z: 7.1, scale: 1.02, kind: 'blossom', rotation: 1.1 },
  { x: 5.5, z: 3.5, scale: 0.95, kind: 'round', rotation: 2.2 },
  { x: 0.4, z: -5.4, scale: 1.25, kind: 'tall', rotation: 0.6 },
  { x: 7.5, z: -3.1, scale: 1.08, kind: 'blossom', rotation: 1.8 },
  { x: -7.6, z: -5.2, scale: 1.16, kind: 'round', rotation: 0.2 },
  { x: 16.8, z: 9.4, scale: 1.22, kind: 'tall', rotation: 0.5 },
  { x: -14.6, z: 13.4, scale: 1.18, kind: 'blossom', rotation: 1.4 },
  { x: 18.2, z: -5.6, scale: 1.1, kind: 'round', rotation: 2.4 },
  { x: -3.4, z: -18.2, scale: 1.28, kind: 'tall', rotation: 0.8 },
  { x: 7.2, z: 20.4, scale: 1.15, kind: 'round', rotation: 1.6 },
  { x: -20.2, z: 2.4, scale: 1.2, kind: 'blossom', rotation: 0.3 },
]

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function tooClose(x: number, z: number, points: readonly { x: number; z: number }[], min: number): boolean {
  return points.some((point) => Math.hypot(point.x - x, point.z - z) < min)
}

function blocked(x: number, z: number): boolean {
  const distance = Math.hypot(x, z)
  if (distance < PATH_OUTER + 1.3 || distance > PLAY_RADIUS - 1.4) {
    return true
  }
  return Math.hypot(x - pond.x, z - pond.z) < pond.radius + 1.6
}

function scatterTrees(existing: readonly TreeSpec[]): TreeSpec[] {
  const random = mulberry32(20261115)
  const kinds: TreeKind[] = ['round', 'round', 'tall', 'blossom']
  const trees = [...existing]

  for (let attempt = 0; attempt < 80 && trees.length < 24; attempt += 1) {
    const angle = random() * Math.PI * 2
    const distance = PATH_OUTER + 1.8 + random() * (FENCE_RADIUS - PATH_OUTER - 4.2)
    const x = Math.sin(angle) * distance
    const z = Math.cos(angle) * distance
    if (blocked(x, z) || tooClose(x, z, trees, 3.2) || tooClose(x, z, benches, 2.1)) {
      continue
    }
    const kind = kinds[Math.floor(random() * kinds.length)] ?? 'round'
    trees.push({
      x,
      z,
      scale: 0.9 + random() * 0.45,
      kind,
      rotation: random() * Math.PI * 2,
    })
  }

  return trees
}

export const trees: TreeSpec[] = scatterTrees(featuredTrees)

export const fencePosts = Array.from({ length: 32 }, (_, index) => {
  const angle = (index / 32) * Math.PI * 2
  const next = ((index + 1) / 32) * Math.PI * 2
  const x = Math.sin(angle) * FENCE_RADIUS
  const z = Math.cos(angle) * FENCE_RADIUS
  const nextX = Math.sin(next) * FENCE_RADIUS
  const nextZ = Math.cos(next) * FENCE_RADIUS
  return {
    x,
    z,
    midX: (x + nextX) / 2,
    midZ: (z + nextZ) / 2,
    length: Math.hypot(nextX - x, nextZ - z),
    yaw: Math.atan2(nextX - x, nextZ - z),
  }
})
