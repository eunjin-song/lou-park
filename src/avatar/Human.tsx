import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { palette } from '../game/constants.ts'
import type { MutablePose } from '../game/types.ts'

export function Human({ pose }: { pose: MutablePose }) {
  const body = useRef<Group>(null)
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const swing = useRef(0)

  useFrame(({ clock }, dt) => {
    const sitting = pose.resting
    const target = sitting ? 1.05 : pose.moving ? Math.sin(clock.elapsedTime * 8) * 0.62 : 0
    const blend = 1 - Math.exp(-14 * dt)
    swing.current += (target - swing.current) * blend
    const bob = sitting ? -0.32 : pose.moving ? Math.abs(Math.sin(clock.elapsedTime * 8)) * 0.045 : 0
    if (body.current) body.current.position.y = bob
    if (leftLeg.current) leftLeg.current.rotation.x = swing.current
    if (rightLeg.current) rightLeg.current.rotation.x = sitting ? swing.current : -swing.current
    if (leftArm.current) leftArm.current.rotation.x = sitting ? 0.35 : -swing.current * 0.75
    if (rightArm.current) rightArm.current.rotation.x = sitting ? 0.35 : swing.current * 0.75
  })

  return (
    <group ref={body}>
      <group ref={leftLeg} position={[-0.14, 0.74, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.16, 0.58, 0.18]} />
          <meshStandardMaterial color={palette.pants} flatShading roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.66, 0.05]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.28]} />
          <meshStandardMaterial color={palette.shoe} roughness={0.7} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.14, 0.74, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.16, 0.58, 0.18]} />
          <meshStandardMaterial color={palette.pants} flatShading roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.66, 0.05]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.28]} />
          <meshStandardMaterial color={palette.shoe} roughness={0.7} />
        </mesh>
      </group>

      <RoundedBox args={[0.58, 0.56, 0.34]} radius={0.08} smoothness={2} position={[0, 1.04, 0]} castShadow>
        <meshStandardMaterial color={palette.shirt} roughness={0.78} />
      </RoundedBox>

      <group ref={leftArm} position={[-0.38, 1.24, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.13, 0.42, 0.13]} />
          <meshStandardMaterial color={palette.skin} flatShading roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.38, 1.24, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.13, 0.42, 0.13]} />
          <meshStandardMaterial color={palette.skin} flatShading roughness={0.8} />
        </mesh>
      </group>

      <group position={[0, 1.58, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.3, 16, 14]} />
          <meshStandardMaterial color={palette.skin} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.16, -0.02]} scale={[1.05, 0.62, 1.02]} castShadow>
          <sphereGeometry args={[0.3, 14, 12]} />
          <meshStandardMaterial color={palette.hair} roughness={0.8} />
        </mesh>
        <group position={[0.18, 0.16, 0.08]}>
          <mesh position={[-0.055, 0, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={palette.bow} />
          </mesh>
          <mesh position={[0.055, 0, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color={palette.bow} />
          </mesh>
        </group>
        <mesh position={[-0.1, 0.03, 0.26]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={palette.eye} />
        </mesh>
        <mesh position={[0.1, 0.03, 0.26]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={palette.eye} />
        </mesh>
        <mesh position={[-0.16, -0.06, 0.24]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={palette.blush} />
        </mesh>
        <mesh position={[0.16, -0.06, 0.24]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={palette.blush} />
        </mesh>
      </group>
    </group>
  )
}
