import { PLAYGROUND } from '../../shared/places.ts'
import { frameAt, inWater, insideGrounds, LOOP_LENGTH, type Frame } from '../../shared/shore.ts'
import { palette } from '../game/constants.ts'

export type TreeKind = 'round' | 'tall' | 'blossom'

export type TreeSpec = { x: number; z: number; scale: number; kind: TreeKind; rotation: number }
export type BenchSpec = { x: number; z: number; yaw: number }
export type FlowerSpec = { x: number; z: number; color: string }
export type ReedSpec = { x: number; z: number; scale: number; rotation: number }
export type HillSpec = { x: number; z: number; radius: number; height: number }

function hash(seed: number): number {
  const value = Math.sin(seed * 127.1) * 43758.5453
  return value - Math.floor(value)
}

function place(frame: Frame, outward: number) {
  return { x: frame.x + frame.nx * outward, z: frame.z + frame.nz * outward }
}

function open(x: number, z: number): boolean {
  if (!insideGrounds(x, z) || inWater(x, z)) return false
  return Math.hypot(x - PLAYGROUND.x, z - PLAYGROUND.z) > PLAYGROUND.fence + 3
}

const trees: TreeSpec[] = []
for (let distance = 24; distance < LOOP_LENGTH; distance += 36) {
  const frame = frameAt(distance)
  const outward = 13 + hash(distance) * 16
  const spot = place(frame, outward)
  if (!open(spot.x, spot.z)) continue
  const roll = hash(distance + 4)
  const kind: TreeKind = roll > 0.72 ? 'blossom' : roll > 0.38 ? 'tall' : 'round'
  trees.push({
    x: spot.x,
    z: spot.z,
    scale: 0.9 + hash(distance + 8) * 0.45,
    kind,
    rotation: hash(distance + 2) * Math.PI * 2,
  })
}
for (let index = 0; index < 42; index += 1) {
  const frame = frameAt(1380 + index * 7)
  const spot = place(frame, 8 + hash(index + 20) * 22)
  if (!open(spot.x, spot.z)) continue
  trees.push({
    x: spot.x,
    z: spot.z,
    scale: 0.85 + hash(index + 30) * 0.5,
    kind: hash(index + 9) > 0.6 ? 'tall' : 'round',
    rotation: hash(index) * 6,
  })
}

export { trees }

export const benches: BenchSpec[] = []
for (let distance = 180; distance < LOOP_LENGTH; distance += 260) {
  const frame = frameAt(distance)
  const onDeck = frame.nx < -0.72 && distance > 160 && distance < 1260
  const spot = place(frame, onDeck ? -3.2 : 5.4)
  if (!open(spot.x, spot.z)) continue
  benches.push({ x: spot.x, z: spot.z, yaw: Math.atan2(-frame.nx, -frame.nz) })
}

const flowerColors = [palette.blossom, palette.blossomDeep, '#ffe38a', '#d5c4f7']
export const flowers: FlowerSpec[] = []
for (const distance of [420, 880, 1760, 2460]) {
  const frame = frameAt(distance)
  for (let index = 0; index < 7; index += 1) {
    const spot = place(frame, 8 + hash(distance + index) * 4)
    const side = (hash(distance + index + 2) - 0.5) * 6
    const x = spot.x + frame.tx * side
    const z = spot.z + frame.tz * side
    if (!open(x, z)) continue
    flowers.push({ x, z, color: flowerColors[index % flowerColors.length] ?? palette.blossom })
  }
}

export const reeds: ReedSpec[] = []
for (let distance = 1320; distance < 1760; distance += 9) {
  const frame = frameAt(distance)
  for (const side of [7, 15, 23]) {
    const spot = place(frame, side)
    if (!open(spot.x, spot.z)) continue
    reeds.push({
      x: spot.x + frame.tx * (hash(distance + side) - 0.5) * 4,
      z: spot.z + frame.tz * (hash(distance + side) - 0.5) * 4,
      scale: 0.8 + hash(distance * side) * 0.7,
      rotation: hash(distance + side * 3) * Math.PI,
    })
  }
}

export const hills: HillSpec[] = []
for (const distance of [360, 980, 1680, 2060, 2740]) {
  const frame = frameAt(distance)
  const spot = place(frame, 32)
  if (!open(spot.x, spot.z)) continue
  hills.push({ x: spot.x, z: spot.z, radius: 16 + hash(distance) * 8, height: 1.05 + hash(distance + 1) * 0.45 })
}
