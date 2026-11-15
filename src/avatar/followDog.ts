import { DOG_FOLLOW_DISTANCE, DOG_SIDE_OFFSET, DOG_SPEED, PLAY_RADIUS } from '../game/constants.ts'
import { clampToRadius, dampAngle } from '../game/movement.ts'

export type DogPose = {
  x: number
  z: number
  yaw: number
  moving: boolean
}

export function dogTarget(owner: { x: number; z: number; yaw: number }): { x: number; z: number } {
  const forwardX = Math.sin(owner.yaw)
  const forwardZ = Math.cos(owner.yaw)
  const rightX = Math.cos(owner.yaw)
  const rightZ = -Math.sin(owner.yaw)
  return {
    x: owner.x - forwardX * DOG_FOLLOW_DISTANCE + rightX * DOG_SIDE_OFFSET,
    z: owner.z - forwardZ * DOG_FOLLOW_DISTANCE + rightZ * DOG_SIDE_OFFSET,
  }
}

/** Puts a dog back beside its person. Used when the park assigns a new starting spot. */
export function placeDog(dog: DogPose, owner: { x: number; z: number; yaw: number }): void {
  const next = dogTarget(owner)
  dog.x = next.x
  dog.z = next.z
  dog.yaw = owner.yaw
  dog.moving = false
}

/** Each avatar owns one dog. Remote visitors can run the same follow locally. */
export function integrateDog(
  dog: DogPose,
  owner: { x: number; z: number; yaw: number },
  dt: number,
): void {
  const target = dogTarget(owner)
  const dx = target.x - dog.x
  const dz = target.z - dog.z
  const distance = Math.hypot(dx, dz)
  const startX = dog.x
  const startZ = dog.z

  if (distance > 0.08) {
    const speed = distance > 1.6 ? DOG_SPEED * 1.65 : DOG_SPEED
    const step = Math.min(distance, speed * dt)
    dog.x += (dx / distance) * step
    dog.z += (dz / distance) * step
    dog.yaw = dampAngle(dog.yaw, Math.atan2(dx, dz), 12, dt)
  } else {
    dog.yaw = dampAngle(dog.yaw, owner.yaw, 6, dt)
  }

  const clamped = clampToRadius(dog.x, dog.z, PLAY_RADIUS)
  dog.x = clamped.x
  dog.z = clamped.z
  dog.moving = Math.hypot(dog.x - startX, dog.z - startZ) > 0.004
}
