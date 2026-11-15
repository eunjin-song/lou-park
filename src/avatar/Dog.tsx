import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { palette } from '../game/constants.ts'
import type { DogPose } from './followDog.ts'

export function Dog({ pose }: { pose: DogPose }) {
  const body = useRef<Group>(null)
  const tail = useRef<Group>(null)
  const frontLeft = useRef<Group>(null)
  const frontRight = useRef<Group>(null)
  const backLeft = useRef<Group>(null)
  const backRight = useRef<Group>(null)

  useFrame(({ clock }) => {
    const wave = Math.sin(clock.elapsedTime * (pose.moving ? 13 : 5.5))
    const leg = pose.moving ? wave * 0.75 : 0
    if (body.current) body.current.position.y = pose.moving ? Math.abs(wave) * 0.04 : 0
    if (tail.current) tail.current.rotation.y = wave * (pose.moving ? 0.75 : 0.4)
    if (frontLeft.current) frontLeft.current.rotation.x = leg
    if (backRight.current) backRight.current.rotation.x = leg
    if (frontRight.current) frontRight.current.rotation.x = -leg
    if (backLeft.current) backLeft.current.rotation.x = -leg
  })

  return (
    <group ref={body}>
      <mesh position={[0, 0.34, 0.02]} scale={[0.82, 0.68, 1.15]} castShadow>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color={palette.dog} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.42, 0.32]} castShadow>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshStandardMaterial color={palette.dog} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.36, 0.46]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={palette.dogLight} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.37, 0.52]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color={palette.nose} />
      </mesh>
      <mesh position={[-0.07, 0.48, 0.42]}>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshStandardMaterial color={palette.eye} />
      </mesh>
      <mesh position={[0.07, 0.48, 0.42]}>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshStandardMaterial color={palette.eye} />
      </mesh>
      <mesh position={[-0.1, 0.56, 0.3]} rotation={[0, 0, 0.45]} castShadow>
        <coneGeometry args={[0.06, 0.16, 5]} />
        <meshStandardMaterial color={palette.dogEar} flatShading />
      </mesh>
      <mesh position={[0.1, 0.56, 0.3]} rotation={[0, 0, -0.45]} castShadow>
        <coneGeometry args={[0.06, 0.16, 5]} />
        <meshStandardMaterial color={palette.dogEar} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.022, 6, 12]} />
        <meshStandardMaterial color={palette.collar} roughness={0.5} />
      </mesh>

      <group ref={tail} position={[0, 0.4, -0.26]}>
        <mesh position={[0, 0.06, -0.1]} rotation={[0.7, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.2]} />
          <meshStandardMaterial color={palette.dogEar} flatShading />
        </mesh>
      </group>

      <group ref={frontLeft} position={[-0.1, 0.24, 0.16]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.07]} />
          <meshStandardMaterial color={palette.dogLight} flatShading />
        </mesh>
      </group>
      <group ref={frontRight} position={[0.1, 0.24, 0.16]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.07]} />
          <meshStandardMaterial color={palette.dogLight} flatShading />
        </mesh>
      </group>
      <group ref={backLeft} position={[-0.1, 0.24, -0.14]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.07]} />
          <meshStandardMaterial color={palette.dog} flatShading />
        </mesh>
      </group>
      <group ref={backRight} position={[0.1, 0.24, -0.14]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.07]} />
          <meshStandardMaterial color={palette.dog} flatShading />
        </mesh>
      </group>
    </group>
  )
}
