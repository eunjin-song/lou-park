/** Shared park places. The server and the browser must use the same spots. */

export const POOP_DELAY_MS = 600_000
export const POOP_PICKUP_RADIUS = 1.8
export const BIN_USE_RADIUS = 2.2
export const REST_RADIUS = 2.2

export const WASTE_BIN = { x: -9.5, z: 17.2 } as const

export const PLAYGROUND = { x: 17, z: -15, radius: 4, fence: 4.2, dog: 3.35 } as const
export const PLAY_GATE = 0.62

const originDistance = Math.hypot(PLAYGROUND.x, PLAYGROUND.z) || 1
export const PLAY_GATE_DIR = {
  x: -PLAYGROUND.x / originDistance,
  z: -PLAYGROUND.z / originDistance,
} as const

export const PLAYGROUND_GATE = {
  x: PLAYGROUND.x + PLAY_GATE_DIR.x * (PLAYGROUND.radius - 0.2),
  z: PLAYGROUND.z + PLAY_GATE_DIR.z * (PLAYGROUND.radius - 0.2),
} as const

export const PLAYGROUND_BENCH = {
  x: PLAYGROUND.x + PLAY_GATE_DIR.x * 2.55,
  z: PLAYGROUND.z + PLAY_GATE_DIR.z * 2.55,
  yaw: Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z),
} as const
