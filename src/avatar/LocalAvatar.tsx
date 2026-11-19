import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { PLAYGROUND, SPAWN } from '../../shared/places.ts'
import { INITIAL_FLAT_BASIS, integrateMovement, updateFlatBasis } from '../game/movement.ts'
import { isInputBlocked } from '../input/inputGate.ts'
import { bindRest, whereabouts } from '../input/parkActions.ts'
import { readMovement } from '../input/readMoveInput.ts'
import { useKeyboard } from '../input/useKeyboard.ts'
import { FollowCamera } from '../scene/FollowCamera.tsx'
import { createPresence } from '../session/presence.ts'
import { useParkRoom } from '../session/useParkRoom.ts'
import { PoopMarks } from '../world/PoopMarks.tsx'
import { AvatarView } from './AvatarView.tsx'
import { dogTarget, noteOwnerStep, type DogPose } from './followDog.ts'
import { RemoteAvatar } from './RemoteAvatar.tsx'

export function LocalAvatar({ nickname }: { nickname: string }) {
  const keys = useKeyboard()
  const [presence] = useState(() =>
    createPresence({
      id: 'local',
      x: SPAWN.x,
      z: SPAWN.z,
      yaw: SPAWN.yaw,
      moving: false,
      resting: false,
      dogPlaying: false,
    }),
  )
  const dogPose = useRef<DogPose>({
    ...dogTarget(presence.local),
    yaw: presence.local.yaw,
    moving: false,
  })
  const placeVersion = useRef(0)
  const basis = useRef({ ...INITIAL_FLAT_BASIS })
  const viewForward = useRef(new Vector3())
  const viewRight = useRef(new Vector3())
  const room = useParkRoom(presence.local, dogPose, placeVersion, nickname)
  const restRequested = useRef(false)

  useEffect(() => {
    bindRest(() => {
      restRequested.current = true
    })
    return () => bindRest(() => {})
  }, [])

  useFrame((state, dt) => {
    const camera = state.camera
    camera.getWorldDirection(viewForward.current)
    viewRight.current.set(1, 0, 0).applyQuaternion(camera.quaternion)
    updateFlatBasis(
      basis.current,
      viewForward.current.x,
      viewForward.current.z,
      viewRight.current.x,
      viewRight.current.z,
    )
    const input = isInputBlocked() ? { forward: 0, strafe: 0 } : readMovement(keys.current)
    const stepping = Math.hypot(input.forward, input.strafe) > 0
    if (stepping) presence.local.resting = false
    else if (restRequested.current) presence.local.resting = true
    restRequested.current = false
    integrateMovement(
      presence.local,
      presence.local.resting ? { forward: 0, strafe: 0 } : input,
      basis.current,
      Math.min(dt, 0.05),
    )
    presence.local.dogPlaying = Math.hypot(presence.local.x - PLAYGROUND.x, presence.local.z - PLAYGROUND.z) <= PLAYGROUND.radius
    noteOwnerStep(presence.local.x, presence.local.z)
    whereabouts.x = presence.local.x
    whereabouts.z = presence.local.z
    whereabouts.moving = presence.local.moving
    whereabouts.resting = presence.local.resting
  }, 2)

  useFrame(() => {
    room.send.current()
  }, -1)

  const { local } = presence

  return (
    <>
      <AvatarView
        pose={local}
        nickname={nickname}
        bubble={room.bubbles[room.selfId]}
        dogAnchor={placeVersion}
        onDog={(dog) => {
          dogPose.current.x = dog.x
          dogPose.current.z = dog.z
          dogPose.current.yaw = dog.yaw
          dogPose.current.moving = dog.moving
        }}
      />
      {room.roster.map((player) => (
        <RemoteAvatar key={player.id} player={player} targets={room.targets} bubble={room.bubbles[player.id]} />
      ))}
      <FollowCamera pose={local} />
      <PoopMarks />
    </>
  )
}
