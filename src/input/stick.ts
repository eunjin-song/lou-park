import type { MoveInput } from '../game/types.ts'

const DEADZONE = 0.18

const stick = { x: 0, y: 0 }
let pointerId: number | null = null

export function stickPointerId(): number | null {
  return pointerId
}

export function setStickPointer(id: number | null) {
  pointerId = id
}

/** x and y are -1..1 from the stick center. Screen y grows downward. */
export function setStick(x: number, y: number) {
  const length = Math.hypot(x, y)
  if (!Number.isFinite(length) || length <= 0) {
    stick.x = 0
    stick.y = 0
    return
  }
  const scale = Math.min(1, length) / length
  stick.x = x * scale
  stick.y = y * scale
}

export function clearStick() {
  stick.x = 0
  stick.y = 0
  pointerId = null
}

/** Camera-relative stick intent. Small jitters stay at zero, and the length never exceeds 1. */
export function readStick(): MoveInput {
  const length = Math.hypot(stick.x, stick.y)
  if (length < DEADZONE) return { forward: 0, strafe: 0 }
  const scale = Math.min(1, length) / length
  return { forward: -stick.y * scale, strafe: stick.x * scale }
}
