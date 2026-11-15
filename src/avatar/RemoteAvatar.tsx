import { useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import { dampAngle } from '../game/movement.ts'
import type { MutablePose } from '../game/types.ts'
import type { RemoteTargets } from '../session/useParkRoom.ts'
import type { ChatBubble, NetPlayer } from '../../shared/protocol.ts'
import { AvatarView } from './AvatarView.tsx'
import type { DogPose } from './followDog.ts'

const FOLLOW = 14
const SNAP_DISTANCE = 8

function approach(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function easePose(pose: MutablePose, dog: DogPose, next: NetPlayer, dt: number) {
  const distance = Math.hypot(next.x - pose.x, next.z - pose.z)
  if (distance > SNAP_DISTANCE) {
    pose.x = next.x
    pose.z = next.z
    pose.yaw = next.yaw
    dog.x = next.dogX
    dog.z = next.dogZ
    dog.yaw = next.dogYaw
  } else {
    pose.x = approach(pose.x, next.x, FOLLOW, dt)
    pose.z = approach(pose.z, next.z, FOLLOW, dt)
    pose.yaw = dampAngle(pose.yaw, next.yaw, FOLLOW, dt)
    dog.x = approach(dog.x, next.dogX, FOLLOW, dt)
    dog.z = approach(dog.z, next.dogZ, FOLLOW, dt)
    dog.yaw = dampAngle(dog.yaw, next.dogYaw, FOLLOW, dt)
  }
  pose.moving = next.moving
  dog.moving = next.dogMoving
}

/** Shows someone else's person and dog. It never reads the keyboard or moves the camera. */
export function RemoteAvatar({
  player,
  targets,
  bubble,
}: {
  bubble?: ChatBubble
  player: NetPlayer
  targets: RefObject<RemoteTargets>
}) {
  const [pose] = useState<MutablePose>(() => ({
    id: player.id,
    x: player.x,
    z: player.z,
    yaw: player.yaw,
    moving: player.moving,
  }))
  const [dog] = useState<DogPose>(() => ({
    x: player.dogX,
    z: player.dogZ,
    yaw: player.dogYaw,
    moving: player.dogMoving,
  }))

  useFrame((_, dt) => {
    const next = targets.current.get(player.id)
    if (!next) return
    easePose(pose, dog, next, Math.min(dt, 0.05))
  }, 2)

  return <AvatarView pose={pose} nickname={player.nickname} bubble={bubble} syncedDog={dog} />
}
