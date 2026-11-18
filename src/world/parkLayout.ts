import { FENCE_RADIUS, palette } from '../game/constants.ts'
import { BIG_LAKE, PLAYGROUND, SMALL_LAKE, inWater } from '../../shared/places.ts'

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

const placedTrees: TreeSpec[] = [
  { x: -6.4, z: 33.5, scale: 1.15, kind: 'round', rotation: 0.4 },
  { x: 6.8, z: 32.2, scale: 1.05, kind: 'blossom', rotation: 1.2 },
  { x: -8.2, z: 18.4, scale: 1.25, kind: 'tall', rotation: 0.2 },
  { x: -14.5, z: 16.2, scale: 1.18, kind: 'round', rotation: 1.4 },
  { x: -18.6, z: 12.4, scale: 1.3, kind: 'tall', rotation: 0.6 },
  { x: -22.4, z: 18.8, scale: 1.12, kind: 'blossom', rotation: 2.1 },
  { x: -16.2, z: 22.5, scale: 1.08, kind: 'round', rotation: 0.8 },
  { x: 16.5, z: 8.4, scale: 1.16, kind: 'round', rotation: 0.3 },
  { x: 12.2, z: -6.5, scale: 1.22, kind: 'tall', rotation: 1.1 },
  { x: -14.8, z: -8.2, scale: 1.18, kind: 'blossom', rotation: 2.4 },
  { x: -18.2, z: 0.6, scale: 1.1, kind: 'round', rotation: 0.5 },
  { x: 18.4, z: -4.2, scale: 1.2, kind: 'tall', rotation: 1.7 },
  { x: -8.5, z: -28.4, scale: 1.15, kind: 'blossom', rotation: 0.9 },
  { x: -2.4, z: -30.6, scale: 1.28, kind: 'tall', rotation: 1.5 },
  { x: 12.8, z: -30.2, scale: 1.12, kind: 'blossom', rotation: 0.4 },
  { x: 14.6, z: -38.4, scale: 1.24, kind: 'tall', rotation: 2.2 },
  { x: -1.2, z: -42.5, scale: 1.18, kind: 'round', rotation: 0.7 },
  { x: 9.4, z: -44.2, scale: 1.16, kind: 'blossom', rotation: 1.3 },
  { x: -12.5, z: -40.8, scale: 1.22, kind: 'round', rotation: 0.2 },
  { x: 18.8, z: -26.5, scale: 1.08, kind: 'tall', rotation: 1.8 },
  { x: -16.4, z: -22.6, scale: 1.14, kind: 'round', rotation: 2.6 },
  { x: 22.5, z: 22.4, scale: 1.1, kind: 'blossom', rotation: 0.6 },
  { x: -28.4, z: 8.2, scale: 1.2, kind: 'tall', rotation: 1.1 },
  { x: 24.2, z: -12.4, scale: 1.05, kind: 'round', rotation: 0.3 },
  { x: -24.6, z: -12.8, scale: 1.16, kind: 'blossom', rotation: 2.0 },
  { x: 8.4, z: 22.6, scale: 1.08, kind: 'round', rotation: 0.9 },
  { x: -10.2, z: 8.8, scale: 1.14, kind: 'tall', rotation: 1.6 },
]

function clearOfWater(tree: TreeSpec): boolean {
  if (inWater(tree.x, tree.z)) return false
  if (Math.hypot(tree.x - PLAYGROUND.x, tree.z - PLAYGROUND.z) < PLAYGROUND.fence + 1.2) return false
  if (BIG_LAKE.some((lake) => Math.hypot(tree.x - lake.x, tree.z - lake.z) < lake.r + 1.4)) return false
  if (Math.hypot(tree.x - SMALL_LAKE.x, tree.z - SMALL_LAKE.z) < SMALL_LAKE.r + 1.3) return false
  return Math.hypot(tree.x, tree.z) < FENCE_RADIUS - 2.2
}

export const trees: TreeSpec[] = placedTrees.filter(clearOfWater)

export const benches: BenchSpec[] = [
  { x: -8.6, z: 20.2, yaw: 0.4 },
  { x: -20.2, z: 15.4, yaw: 1.2 },
  { x: -15.4, z: 11.2, yaw: 2.4 },
  { x: 15.8, z: 4.6, yaw: -0.6 },
  { x: -16.8, z: -4.8, yaw: 0.8 },
  { x: -6.4, z: -27.2, yaw: 0.3 },
  { x: 13.6, z: -40.6, yaw: 1.5 },
  { x: 0.4, z: 28.4, yaw: Math.PI },
]

export const flowers: FlowerSpec[] = [
  { x: -4.2, z: -31.4, color: palette.blossom },
  { x: -6.2, z: -31.5, color: '#ffe38a' },
  { x: 13.9, z: -37.8, color: palette.blossomDeep },
  { x: 12.1, z: -36.1, color: '#d5c4f7' },
  { x: 13.3, z: -39.1, color: '#ffe38a' },
  { x: -9.4, z: -36.5, color: palette.blossom },
  { x: -10.2, z: -35.6, color: '#ffe38a' },
  { x: -18.4, z: 17.6, color: '#d5c4f7' },
  { x: -17.5, z: 18.4, color: palette.blossom },
  { x: -21.2, z: 13.8, color: '#ffe38a' },
  { x: 5.6, z: 30.4, color: palette.blossomDeep },
  { x: 6.4, z: 31.1, color: '#ffe38a' },
]

export const grassPatches: GrassPatch[] = [
  { x: 0, z: 43.2, radius: 7.2, color: '#f4e2c4' },
  { x: -18, z: 16, radius: 8.4, color: palette.grassLight },
  { x: 4, z: -38, radius: 7.6, color: palette.grassDark },
  { x: 20, z: 20, radius: 4.2, color: palette.grassLight },
]

export const fencePosts = Array.from({ length: 48 }, (_, index) => {
  const angle = (index / 48) * Math.PI * 2
  const next = ((index + 1) / 48) * Math.PI * 2
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
