/** Shared park places. The server and the browser use these same spots. */

import { frameAt, inWater, insideGrounds, nearestLoopArc, onDeck, pointAtArc, type Pt } from './shore.ts'

export const POOP_DELAY_MS = 600_000
export const POOP_PICKUP_RADIUS = 1.8
export const BIN_USE_RADIUS = 2.2
export const BAG_USE_RADIUS = 2.2
export const REST_RADIUS = 2.2
export const BAG_HINT = '먼저 배변봉투함에서 봉투를 챙겨 주세요'
export const MOVE_LIMIT_MPS = 16

export const SPAWN_RING = 1.8
const south = frameAt(0)
export const PLAZA = { x: south.x + south.nx * 5.2, z: south.z + south.nz * 5.2 }
export const SPAWN = { x: PLAZA.x, z: PLAZA.z + SPAWN_RING, yaw: Math.PI }

function beside(distance: number, outward: number, along = 0): Pt {
  const frame = frameAt(distance + along)
  return { x: frame.x + frame.nx * outward, z: frame.z + frame.nz * outward }
}

const bagDistances = [760, 1540, 2280]
export const BAG_BOXES = [
  { x: south.x - south.tx * 5.2 + south.nx * 4.2, z: south.z + south.nz * 4.2 },
  ...bagDistances.map((distance) => beside(distance, 6.2)),
]

const binDistances = [790, 1570, 2310]
export const WASTE_BINS = [
  { x: south.x + south.tx * 5.4 + south.nx * 4.6, z: south.z + south.nz * 4.6 },
  ...binDistances.map((distance) => beside(distance, 6.2)),
]

const east = frameAt(2320)
export const PLAYGROUND = {
  x: east.x + east.nx * 26,
  z: east.z + east.nz * 26,
  radius: 5.2,
  fence: 5.5,
  dog: 4.15,
} as const
export const PLAY_GATE = 0.72
const gateSpan = Math.hypot(east.x - PLAYGROUND.x, east.z - PLAYGROUND.z) || 1
export const PLAY_GATE_DIR = {
  x: (east.x - PLAYGROUND.x) / gateSpan,
  z: (east.z - PLAYGROUND.z) / gateSpan,
} as const
export const PLAYGROUND_GATE = {
  x: PLAYGROUND.x + PLAY_GATE_DIR.x * (PLAYGROUND.fence - 0.15),
  z: PLAYGROUND.z + PLAY_GATE_DIR.z * (PLAYGROUND.fence - 0.15),
} as const
export const PLAYGROUND_BENCH = {
  x: PLAYGROUND.x + PLAY_GATE_DIR.x * 2.7,
  z: PLAYGROUND.z + PLAY_GATE_DIR.z * 2.7,
  yaw: Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z),
} as const
export const PLAYGROUND_SIGN = {
  x: PLAYGROUND.x + PLAY_GATE_DIR.x * (PLAYGROUND.fence + 1.15),
  z: PLAYGROUND.z + PLAY_GATE_DIR.z * (PLAYGROUND.fence + 1.15),
  yaw: Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z),
} as const

export const GUIDE_BOARD = {
  x: south.x + south.tx * 6.4 + south.nx * 3.4,
  z: south.z + south.nz * 3.4,
  yaw: 0,
} as const

function signYaw(distance: number): number {
  const frame = frameAt(distance)
  return Math.atan2(-frame.nx, -frame.nz)
}

export const DIRECTION_SIGNS = [
  { x: south.x - south.tx * 7.4 + south.nx * 2.4, z: south.z + south.nz * 2.4, yaw: 0, turn: 'right' as const },
  { x: beside(2140, 5.4).x, z: beside(2140, 5.4).z, yaw: signYaw(2140), turn: 'right' as const },
  { x: beside(2480, 5.4).x, z: beside(2480, 5.4).z, yaw: signYaw(2480), turn: 'left' as const },
] as const

export type CircleSpot = { x: number; z: number; r: number }

export const SOLIDS: readonly CircleSpot[] = [
  ...BAG_BOXES.map((spot) => ({ x: spot.x, z: spot.z, r: 0.55 })),
  ...WASTE_BINS.map((spot) => ({ x: spot.x, z: spot.z, r: 0.5 })),
  { x: GUIDE_BOARD.x, z: GUIDE_BOARD.z, r: 0.42 },
  { x: PLAYGROUND_SIGN.x, z: PLAYGROUND_SIGN.z, r: 0.4 },
  ...DIRECTION_SIGNS.map((sign) => ({ x: sign.x, z: sign.z, r: 0.34 })),
]

export { inWater, insideGrounds, onDeck, nearestLoopArc, pointAtArc }

export function nearAny(x: number, z: number, spots: readonly Pt[], radius: number): boolean {
  return spots.some((spot) => Math.hypot(x - spot.x, z - spot.z) <= radius)
}

export function playgroundFenceBlocks(x: number, z: number): boolean {
  const dx = x - PLAYGROUND.x
  const dz = z - PLAYGROUND.z
  const distance = Math.hypot(dx, dz)
  if (Math.abs(distance - PLAYGROUND.fence) > 0.45) return false
  const angle = Math.atan2(dx, dz)
  const gate = Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z)
  const delta = Math.atan2(Math.sin(angle - gate), Math.cos(angle - gate))
  return Math.abs(delta) > PLAY_GATE
}

export function blockedGround(x: number, z: number): boolean {
  if (playgroundFenceBlocks(x, z)) return true
  return SOLIDS.some((solid) => Math.hypot(x - solid.x, z - solid.z) < solid.r)
}

export function canStand(x: number, z: number): boolean {
  return insideGrounds(x, z) && !inWater(x, z) && !blockedGround(x, z)
}

export function nearestDry(x: number, z: number): Pt {
  if (canStand(x, z)) return { x, z }
  const arc = nearestLoopArc(x, z)
  const point = pointAtArc(arc)
  return point
}
