import { MOVE_SPEED, PLAY_RADIUS } from './constants.ts'
import type { MoveInput, MutablePose } from './types.ts'

export function clampToRadius(x: number, z: number, radius: number): { x: number; z: number } {
  const distance = Math.hypot(x, z)
  if (distance <= radius || distance === 0) {
    return { x, z }
  }
  const scale = radius / distance
  return { x: x * scale, z: z * scale }
}

export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  const blend = 1 - Math.exp(-lambda * dt)
  return current + delta * blend
}

/** Horizontal view direction. The first frame matches a camera sitting on +Z and looking toward -Z. */
export type FlatBasis = {
  forwardX: number
  forwardZ: number
  rightX: number
  rightZ: number
}

export const INITIAL_FLAT_BASIS: FlatBasis = {
  forwardX: 0,
  forwardZ: -1,
  rightX: 1,
  rightZ: 0,
}

const FLAT_EPSILON = 1e-3

/**
 * Builds an orthonormal ground basis from the camera's projected forward and right.
 * A near-vertical view keeps the last stable basis instead of normalizing a tiny vector.
 */
export function updateFlatBasis(
  basis: FlatBasis,
  forwardX: number,
  forwardZ: number,
  rightX: number,
  rightZ: number,
): void {
  const forwardLength = Math.hypot(forwardX, forwardZ)
  const rightLength = Math.hypot(rightX, rightZ)
  const forwardOk = Number.isFinite(forwardLength) && forwardLength > FLAT_EPSILON
  const rightOk = Number.isFinite(rightLength) && rightLength > FLAT_EPSILON
  const aligned =
    forwardOk && forwardX * basis.forwardX + forwardZ * basis.forwardZ >= -forwardLength * 0.2

  let nextForwardX = basis.forwardX
  let nextForwardZ = basis.forwardZ
  let nextRightX = basis.rightX
  let nextRightZ = basis.rightZ

  if (forwardOk && aligned) {
    nextForwardX = forwardX / forwardLength
    nextForwardZ = forwardZ / forwardLength
    nextRightX = -nextForwardZ
    nextRightZ = nextForwardX
  } else if (rightOk) {
    nextRightX = rightX / rightLength
    nextRightZ = rightZ / rightLength
    nextForwardX = nextRightZ
    nextForwardZ = -nextRightX
  }

  if (
    !Number.isFinite(nextForwardX) ||
    !Number.isFinite(nextForwardZ) ||
    !Number.isFinite(nextRightX) ||
    !Number.isFinite(nextRightZ)
  ) {
    return
  }

  basis.forwardX = nextForwardX
  basis.forwardZ = nextForwardZ
  basis.rightX = nextRightX
  basis.rightZ = nextRightZ
}

/** Steps a pose in place from one input sample and the current camera basis. */
export function integrateMovement(
  pose: MutablePose,
  input: MoveInput,
  basis: FlatBasis,
  dt: number,
): void {
  let x = basis.rightX * input.strafe + basis.forwardX * input.forward
  let z = basis.rightZ * input.strafe + basis.forwardZ * input.forward
  const magnitude = Math.hypot(x, z)
  const moving = magnitude > 0 && Number.isFinite(magnitude)
  if (moving) {
    x /= magnitude
    z /= magnitude
    pose.x += x * MOVE_SPEED * dt
    pose.z += z * MOVE_SPEED * dt
    pose.yaw = Math.atan2(x, z)
  }

  const clamped = clampToRadius(pose.x, pose.z, PLAY_RADIUS)
  pose.x = clamped.x
  pose.z = clamped.z
  pose.moving = moving
}
