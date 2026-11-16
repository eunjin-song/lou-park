import type { MoveInput } from '../game/types.ts'
import { readStick } from './stick.ts'

const FORWARD_KEYS = ['KeyW', 'ArrowUp']
const BACK_KEYS = ['KeyS', 'ArrowDown']
const LEFT_KEYS = ['KeyA', 'ArrowLeft']
const RIGHT_KEYS = ['KeyD', 'ArrowRight']

function held(keys: ReadonlySet<string>, codes: readonly string[]): number {
  return codes.some((code) => keys.has(code)) ? 1 : 0
}

export function readMoveInput(keys: ReadonlySet<string>): MoveInput {
  return {
    forward: held(keys, FORWARD_KEYS) - held(keys, BACK_KEYS),
    strafe: held(keys, RIGHT_KEYS) - held(keys, LEFT_KEYS),
  }
}

/** The stick wins while it is out of the deadzone. Keyboard diagonal speed stays capped. */
export function readMovement(keys: ReadonlySet<string>): MoveInput {
  const stick = readStick()
  if (Math.hypot(stick.forward, stick.strafe) > 0) return stick
  return readMoveInput(keys)
}

export function isMoveKey(code: string): boolean {
  return (
    FORWARD_KEYS.includes(code) ||
    BACK_KEYS.includes(code) ||
    LEFT_KEYS.includes(code) ||
    RIGHT_KEYS.includes(code)
  )
}
