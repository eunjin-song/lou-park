import { LOOP_LENGTH, nearestLoopArc, pointAtArc, segmentTouchesWater } from '../../shared/shore.ts'
import { PLAY_GATE, PLAY_GATE_DIR, PLAYGROUND } from '../../shared/places.ts'
import { DOG_FOLLOW_DISTANCE, DOG_SIDE_OFFSET, DOG_SPEED } from '../game/constants.ts'
import { dampAngle, resolveStep } from '../game/movement.ts'

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

const trail: { x: number; z: number }[] = []

/** Remembers where the person actually walked so the dog does not cut across the lake. */
export function noteOwnerStep(x: number, z: number): void {
  const last = trail[trail.length - 1]
  if (!last || Math.hypot(x - last.x, z - last.z) >= 1.25) {
    trail.push({ x, z })
    if (trail.length > 80) trail.shift()
  }
}

export function clearTrail(): void {
  trail.length = 0
}

function heel(owner: { x: number; z: number }): { x: number; z: number } | null {
  if (trail.length === 0) return null
  let remain = DOG_FOLLOW_DISTANCE
  for (let index = trail.length - 1; index > 0; index -= 1) {
    const newer = trail[index]
    const older = trail[index - 1]
    if (!newer || !older) continue
    const span = Math.hypot(newer.x - older.x, newer.z - older.z)
    if (span >= remain) {
      const t = remain / span
      return { x: newer.x + (older.x - newer.x) * t, z: newer.z + (older.z - newer.z) * t }
    }
    remain -= span
  }
  return trail[0] ?? { x: owner.x, z: owner.z }
}

/** Puts a dog back beside its person. Used when the park assigns a new starting spot. */
export function placeDog(dog: DogPose, owner: { x: number; z: number; yaw: number }): void {
  clearTrail()
  const next = dogTarget(owner)
  dog.x = next.x
  dog.z = next.z
  dog.yaw = owner.yaw
  dog.moving = false
}

/** Leaves the playground through the gate instead of crossing the fence. */
function leaveYard(dog: DogPose, dt: number): boolean {
  const dx = dog.x - PLAYGROUND.x
  const dz = dog.z - PLAYGROUND.z
  const fromCenter = Math.hypot(dx, dz)
  if (fromCenter > PLAYGROUND.fence + 0.35) return false
  const exitX = PLAYGROUND.x + PLAY_GATE_DIR.x * (PLAYGROUND.fence + 0.85)
  const exitZ = PLAYGROUND.z + PLAY_GATE_DIR.z * (PLAYGROUND.fence + 0.85)
  const toX = exitX - dog.x
  const toZ = exitZ - dog.z
  const distance = Math.hypot(toX, toZ) || 1
  const move = Math.min(distance, 4.2 * dt)
  let nextX = dog.x + (toX / distance) * move
  let nextZ = dog.z + (toZ / distance) * move
  const nextDist = Math.hypot(nextX - PLAYGROUND.x, nextZ - PLAYGROUND.z)
  const gateAngle = Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z)
  const nextAngle = Math.atan2(nextX - PLAYGROUND.x, nextZ - PLAYGROUND.z)
  if (nextDist < PLAYGROUND.fence + 0.28 && Math.abs(angleDelta(gateAngle, nextAngle)) > PLAY_GATE) {
    const dogAngle = Math.atan2(dx, dz)
    const delta = angleDelta(gateAngle, dogAngle)
    const sign = delta > 0 ? -1 : 1
    const orbit = Math.max(PLAYGROUND.fence - 0.55, 0.4)
    const turned = dogAngle + sign * Math.min(Math.abs(delta), 1.6 * dt)
    nextX = PLAYGROUND.x + Math.sin(turned) * orbit
    nextZ = PLAYGROUND.z + Math.cos(turned) * orbit
  }
  dog.yaw = dampAngle(dog.yaw, Math.atan2(nextX - dog.x, nextZ - dog.z), 10, dt)
  const resolved = resolveStep(dog.x, dog.z, nextX, nextZ)
  dog.x = resolved.x
  dog.z = resolved.z
  dog.moving = true
  return true
}

/** Each avatar owns one dog. Remote visitors can run the same follow locally. */
export function integrateDog(
  dog: DogPose,
  owner: { x: number; z: number; yaw: number },
  dt: number,
): void {
  const target = heel(owner) ?? dogTarget(owner)
  const dx = target.x - dog.x
  const dz = target.z - dog.z
  const distance = Math.hypot(dx, dz)
  const startX = dog.x
  const startZ = dog.z

  if (leaveYard(dog, dt)) {
    dog.moving = true
    return
  }

  if (distance > 0.08 && !segmentTouchesWater(dog.x, dog.z, target.x, target.z)) {
    const speed = distance > 8 ? 14 : distance > 1.6 ? DOG_SPEED * 1.65 : DOG_SPEED
    const step = Math.min(distance, speed * dt)
    dog.x += (dx / distance) * step
    dog.z += (dz / distance) * step
    dog.yaw = dampAngle(dog.yaw, Math.atan2(dx, dz), 12, dt)
  } else if (distance > 0.08) {
    const from = nearestLoopArc(dog.x, dog.z)
    const to = nearestLoopArc(target.x, target.z)
    let delta = to - from
    if (delta > LOOP_LENGTH / 2) delta -= LOOP_LENGTH
    if (delta < -LOOP_LENGTH / 2) delta += LOOP_LENGTH
    const speed = distance > 8 ? 14 : DOG_SPEED * 1.4
    const anchor = pointAtArc(from)
    const gap = Math.hypot(anchor.x - dog.x, anchor.z - dog.z)
    const along = pointAtArc(from + Math.sign(delta || 1) * Math.min(Math.abs(delta), speed * dt))
    const goal = gap > 1.4 ? anchor : along
    const gx = goal.x - dog.x
    const gz = goal.z - dog.z
    const glen = Math.hypot(gx, gz) || 1
    const step = Math.min(glen, speed * dt)
    let nextX = dog.x + (gx / glen) * step
    let nextZ = dog.z + (gz / glen) * step
    if (segmentTouchesWater(dog.x, dog.z, nextX, nextZ)) {
      const ahead = pointAtArc(from + Math.sign(delta || 1))
      const tx = ahead.x - anchor.x
      const tz = ahead.z - anchor.z
      const tlen = Math.hypot(tx, tz) || 1
      nextX = dog.x + (tx / tlen) * step
      nextZ = dog.z + (tz / tlen) * step
    }
    dog.yaw = dampAngle(dog.yaw, Math.atan2(nextX - dog.x, nextZ - dog.z), 12, dt)
    dog.x = nextX
    dog.z = nextZ
  } else {
    dog.yaw = dampAngle(dog.yaw, owner.yaw, 6, dt)
  }

  const resolved = resolveStep(startX, startZ, dog.x, dog.z)
  dog.x = resolved.x
  dog.z = resolved.z
  dog.moving = Math.hypot(dog.x - startX, dog.z - startZ) > 0.004
}

export type PlayWander = {
  x: number
  z: number
  pause: number
}

const PLAY_SPEED = 1.55

function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

function pickPlayTarget(wander: PlayWander) {
  const angle = Math.random() * Math.PI * 2
  const reach = Math.sqrt(Math.random()) * (PLAYGROUND.dog - 0.3)
  wander.x = PLAYGROUND.x + Math.sin(angle) * reach
  wander.z = PLAYGROUND.z + Math.cos(angle) * reach
}

/** Walks to the gate without crossing the fence, then wanders inside it. */
export function integratePlay(dog: DogPose, wander: PlayWander, dt: number) {
  const step = Math.min(dt, 0.05)
  const startX = dog.x
  const startZ = dog.z
  const fromCenter = Math.hypot(dog.x - PLAYGROUND.x, dog.z - PLAYGROUND.z)
  const gateAngle = Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z)

  if (fromCenter > PLAYGROUND.dog) {
    const entryX = PLAYGROUND.x + PLAY_GATE_DIR.x * (PLAYGROUND.dog * 0.55)
    const entryZ = PLAYGROUND.z + PLAY_GATE_DIR.z * (PLAYGROUND.dog * 0.55)
    const dx = entryX - dog.x
    const dz = entryZ - dog.z
    const distance = Math.hypot(dx, dz) || 1
    const move = Math.min(distance, PLAY_SPEED * 1.15 * step)
    let nextX = dog.x + (dx / distance) * move
    let nextZ = dog.z + (dz / distance) * move
    const nextDist = Math.hypot(nextX - PLAYGROUND.x, nextZ - PLAYGROUND.z)
    const nextAngle = Math.atan2(nextX - PLAYGROUND.x, nextZ - PLAYGROUND.z)
    if (nextDist < PLAYGROUND.fence + 0.28 && Math.abs(angleDelta(gateAngle, nextAngle)) > PLAY_GATE) {
      const dogAngle = Math.atan2(dog.x - PLAYGROUND.x, dog.z - PLAYGROUND.z)
      const delta = angleDelta(gateAngle, dogAngle)
      const sign = delta > 0 ? -1 : 1
      const orbit = Math.max(PLAYGROUND.fence + 0.4, fromCenter)
      const turned = dogAngle + sign * Math.min(Math.abs(delta), 1.35 * step)
      nextX = PLAYGROUND.x + Math.sin(turned) * orbit
      nextZ = PLAYGROUND.z + Math.cos(turned) * orbit
    }
    dog.yaw = dampAngle(dog.yaw, Math.atan2(nextX - dog.x, nextZ - dog.z), 8, step)
    dog.x = nextX
    dog.z = nextZ
    dog.moving = true
  } else if (wander.pause > 0) {
    wander.pause -= step
    dog.moving = false
  } else {
    const dx = wander.x - dog.x
    const dz = wander.z - dog.z
    const distance = Math.hypot(dx, dz)
    if (distance < 0.28) {
      dog.moving = false
      wander.pause = 0.8 + Math.random() * 1.1
      pickPlayTarget(wander)
    } else {
      const move = Math.min(distance, PLAY_SPEED * step)
      dog.x += (dx / distance) * move
      dog.z += (dz / distance) * move
      dog.yaw = dampAngle(dog.yaw, Math.atan2(dx, dz), 8, step)
      dog.moving = true
    }
    const ox = dog.x - PLAYGROUND.x
    const oz = dog.z - PLAYGROUND.z
    const ring = Math.hypot(ox, oz)
    if (ring > PLAYGROUND.dog) {
      dog.x = PLAYGROUND.x + (ox / ring) * PLAYGROUND.dog
      dog.z = PLAYGROUND.z + (oz / ring) * PLAYGROUND.dog
    }
  }

  const parked = resolveStep(startX, startZ, dog.x, dog.z)
  dog.x = parked.x
  dog.z = parked.z
}
