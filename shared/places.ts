/** Shared park places. The server and the browser must use the same spots. */

export const POOP_DELAY_MS = 600_000
export const POOP_PICKUP_RADIUS = 1.8
export const BIN_USE_RADIUS = 2.2
export const BAG_USE_RADIUS = 2.2
export const REST_RADIUS = 2.2
export const BAG_HINT = '먼저 배변봉투함에서 봉투를 챙겨 주세요'

export const PLAZA = { x: 0, z: 44.8 }
export const SPAWN_RING = 1.8

export const BAG_BOXES = [
  { x: 2.35, z: 39.5 },
  { x: 11.4, z: 36.2 },
] as const

export const WASTE_BINS = [
  { x: -2.45, z: 39.7 },
  { x: 18.6, z: 31.4 },
] as const

export const PLAYGROUND = { x: 14, z: 34, radius: 5.2, fence: 5.5, dog: 4.15 } as const
export const PLAY_GATE = 0.72

const gateSpan = Math.hypot(PLAZA.x - PLAYGROUND.x, PLAZA.z - PLAYGROUND.z) || 1
export const PLAY_GATE_DIR = {
  x: (PLAZA.x - PLAYGROUND.x) / gateSpan,
  z: (PLAZA.z - PLAYGROUND.z) / gateSpan,
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
  x: PLAYGROUND.x + PLAY_GATE_DIR.x * (PLAYGROUND.fence + 1.05),
  z: PLAYGROUND.z + PLAY_GATE_DIR.z * (PLAYGROUND.fence + 1.05),
  yaw: Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z),
} as const

export const GUIDE_BOARD = { x: -3.15, z: 37.4, yaw: 0 } as const

export const DIRECTION_SIGNS = [
  { x: 2.7, z: 35.6, yaw: 0, turn: 'right' as const },
  { x: 7.2, z: 36.6, yaw: Math.atan2(-0.84, 0.54), turn: 'right' as const },
] as const

export type CircleSpot = { x: number; z: number; r: number }

/** Big southern lake. Collision radius stays inside the sandy shore. */
export const BIG_LAKE: readonly CircleSpot[] = [
  { x: 0, z: 2, r: 12.4 },
  { x: -5.4, z: -0.6, r: 6.1 },
  { x: 5.4, z: 5.6, r: 5.1 },
]

/** Quiet northern lake. */
export const SMALL_LAKE: CircleSpot = { x: 4, z: -34, r: 8.2 }

export const CHANNEL = { x: 1, z: -18.5, halfX: 1.7, halfZ: 8.3 } as const
/** Short bridge across the narrow channel. halfX reaches both banks. */
export const BRIDGE = { x: 1, z: -18.5, halfX: 4.5, halfZ: 1.9 } as const
/** Waterside deck: the south end sits on the bank, the north end reaches over the big lake. */
export const DECK = { x: -5.4, z: -8.2, halfX: 1.35, halfZ: 2.6 } as const

export const SOLIDS: readonly CircleSpot[] = [
  ...BAG_BOXES.map((spot) => ({ x: spot.x, z: spot.z, r: 0.62 })),
  ...WASTE_BINS.map((spot) => ({ x: spot.x, z: spot.z, r: 0.58 })),
  { x: GUIDE_BOARD.x, z: GUIDE_BOARD.z, r: 0.48 },
  { x: PLAYGROUND_SIGN.x, z: PLAYGROUND_SIGN.z, r: 0.42 },
  ...DIRECTION_SIGNS.map((sign) => ({ x: sign.x, z: sign.z, r: 0.36 })),
]

export function onBridge(x: number, z: number): boolean {
  const on = (spot: { x: number; z: number; halfX: number; halfZ: number }) =>
    Math.abs(x - spot.x) <= spot.halfX && Math.abs(z - spot.z) <= spot.halfZ
  return on(BRIDGE) || on(DECK)
}

export function inWater(x: number, z: number): boolean {
  if (onBridge(x, z)) return false
  if (Math.abs(x - CHANNEL.x) <= CHANNEL.halfX && Math.abs(z - CHANNEL.z) <= CHANNEL.halfZ) return true
  if (Math.hypot(x - SMALL_LAKE.x, z - SMALL_LAKE.z) <= SMALL_LAKE.r) return true
  return BIG_LAKE.some((lake) => Math.hypot(x - lake.x, z - lake.z) <= lake.r)
}

export function nearAny(x: number, z: number, spots: readonly { x: number; z: number }[], radius: number): boolean {
  return spots.some((spot) => Math.hypot(x - spot.x, z - spot.z) <= radius)
}

export function playgroundFenceBlocks(x: number, z: number): boolean {
  const dx = x - PLAYGROUND.x
  const dz = z - PLAYGROUND.z
  const dist = Math.hypot(dx, dz)
  if (Math.abs(dist - PLAYGROUND.fence) > 0.45) return false
  const angle = Math.atan2(dx, dz)
  const gate = Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z)
  const delta = Math.atan2(Math.sin(angle - gate), Math.cos(angle - gate))
  return Math.abs(delta) > PLAY_GATE
}

export function blockedGround(x: number, z: number): boolean {
  if (inWater(x, z) || playgroundFenceBlocks(x, z)) return true
  return SOLIDS.some((solid) => Math.hypot(x - solid.x, z - solid.z) < solid.r)
}
