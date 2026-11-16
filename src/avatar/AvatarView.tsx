import type { ChatBubble } from '../../shared/protocol.ts'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { dampAngle } from '../game/movement.ts'
import type { MutablePose } from '../game/types.ts'
import { removeLabel, syncLabel } from '../ui/labelAnchors.ts'
import { Dog } from './Dog.tsx'
import { PLAYGROUND } from '../../shared/places.ts'
import { dogTarget, integrateDog, integratePlay, placeDog, type DogPose, type PlayWander } from './followDog.ts'
import { Human } from './Human.tsx'

/**
 * Renders one person and one dog.
 * Local visitors simulate their own dog. Remote visitors pass the dog pose they received.
 */
export function AvatarView({
  pose,
  nickname,
  bubble,
  syncedDog,
  dogAnchor,
  onDog,
}: {
  nickname: string
  bubble?: ChatBubble
  pose: MutablePose
  syncedDog?: DogPose
  dogAnchor?: RefObject<number>
  onDog?: (dog: DogPose) => void
}) {
  const person = useRef<Group>(null)
  const dogGroup = useRef<Group>(null)
  const displayedYaw = useRef(pose.yaw)
  const appliedPlace = useRef(0)
  const [dog] = useState<DogPose>(() =>
    syncedDog
      ? { ...syncedDog }
      : {
          ...dogTarget(pose),
          yaw: pose.yaw,
          moving: false,
        },
  )
  const shownDog = syncedDog ?? dog
  const alive = useRef(true)
  const playing = useRef(false)
  const wander = useRef<PlayWander>({ x: PLAYGROUND.x, z: PLAYGROUND.z, pause: 0 })

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      removeLabel(pose.id)
    }
  }, [pose.id])

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05)
    if (dogAnchor && dogAnchor.current !== appliedPlace.current) {
      appliedPlace.current = dogAnchor.current
      placeDog(dog, pose)
      displayedYaw.current = pose.yaw
    }

    displayedYaw.current = dampAngle(displayedYaw.current, pose.yaw, 10, step)
    if (person.current) {
      person.current.position.set(pose.x, 0, pose.z)
      person.current.rotation.y = displayedYaw.current
    }

    if (!syncedDog) {
      if (pose.dogPlaying) {
        if (!playing.current) {
          playing.current = true
          wander.current.pause = 0
          wander.current.x = PLAYGROUND.x
          wander.current.z = PLAYGROUND.z
        }
        integratePlay(dog, wander.current, step)
      } else {
        playing.current = false
        integrateDog(dog, pose, step)
      }
    }
    onDog?.(shownDog)
    if (dogGroup.current) {
      dogGroup.current.position.set(shownDog.x, 0, shownDog.z)
      dogGroup.current.rotation.y = shownDog.yaw
    }

    if (alive.current) {
      syncLabel({
        id: pose.id,
        nickname,
        self: pose.id === 'local',
        bubble: bubble?.text ?? null,
        status: pose.resting ? '쉬는 중' : null,
        x: pose.x,
        y: 2.22,
        z: pose.z,
      })
    }
  }, 1)

  return (
    <group>
      <group ref={person} name={pose.id === 'local' ? 'local-player' : `player-${pose.id}`}>
        <Human pose={pose} />
      </group>
      <group ref={dogGroup} name={pose.id === 'local' ? 'local-dog' : `dog-${pose.id}`}>
        <Dog pose={shownDog} />
      </group>
    </group>
  )
}
