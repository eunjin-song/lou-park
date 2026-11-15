import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { SPAWN_X, SPAWN_YAW, SPAWN_Z } from '../game/constants.ts'
import { INITIAL_FLAT_BASIS, integrateMovement, updateFlatBasis } from '../game/movement.ts'
import { readMoveInput } from '../input/readMoveInput.ts'
import { useKeyboard } from '../input/useKeyboard.ts'
import { FollowCamera } from '../scene/FollowCamera.tsx'
import { createPresence } from '../session/presence.ts'
import { useParkRoom } from '../session/useParkRoom.ts'
import { AvatarView } from './AvatarView.tsx'
import { dogTarget, type DogPose } from './followDog.ts'
import { RemoteAvatar } from './RemoteAvatar.tsx'

export function LocalAvatar({ nickname }: { nickname: string }) {
  const keys = useKeyboard()
  const [presence] = useState(() =>
    createPresence({
      id: 'local',
      x: SPAWN_X,
      z: SPAWN_Z,
      yaw: SPAWN_YAW,
      moving: false,
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
    integrateMovement(presence.local, readMoveInput(keys.current), basis.current, Math.min(dt, 0.05))
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
    </>
  )
}
