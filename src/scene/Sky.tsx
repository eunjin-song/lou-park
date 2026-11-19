import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BackSide, BufferAttribute, Color, SphereGeometry } from 'three'
import type { Group } from 'three'
import { palette } from '../game/constants.ts'

function createSkyGeometry(): SphereGeometry {
  const geometry = new SphereGeometry(240, 28, 18)
  const position = geometry.attributes.position
  if (!position) {
    return geometry
  }
  const colors = new Float32Array(position.count * 3)
  const top = new Color(palette.skyTop)
  const horizon = new Color(palette.skyHorizon)
  const scratch = new Color()
  for (let index = 0; index < position.count; index += 1) {
    const height = Math.min(Math.max(position.getY(index) / 240, 0), 1)
    scratch.copy(horizon).lerp(top, height)
    colors[index * 3] = scratch.r
    colors[index * 3 + 1] = scratch.g
    colors[index * 3 + 2] = scratch.b
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

const skyGeometry = createSkyGeometry()

const clouds = [
  { position: [14, 16, -8] as const, scale: 1.3 },
  { position: [-18, 15, 6] as const, scale: 1.6 },
  { position: [8, 18, 22] as const, scale: 1.15 },
  { position: [-6, 17, -22] as const, scale: 1.4 },
]

function Cloud({ position, scale }: { position: readonly [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.1, 8, 6]} />
        <meshBasicMaterial color={palette.cloud} />
      </mesh>
      <mesh position={[0.95, -0.12, 0.1]}>
        <sphereGeometry args={[0.75, 8, 6]} />
        <meshBasicMaterial color={palette.cloud} />
      </mesh>
      <mesh position={[-0.85, -0.08, 0]}>
        <sphereGeometry args={[0.68, 8, 6]} />
        <meshBasicMaterial color={palette.cloud} />
      </mesh>
    </group>
  )
}

export function Sky() {
  const group = useRef<Group>(null)
  useFrame(({ camera }) => {
    group.current?.position.set(camera.position.x, 0, camera.position.z)
  })
  return (
    <group ref={group}>
      <mesh geometry={skyGeometry} frustumCulled={false}>
        <meshBasicMaterial vertexColors side={BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[42, 32, 18]}>
        <sphereGeometry args={[5.5, 16, 16]} />
        <meshBasicMaterial color={palette.sun} fog={false} />
      </mesh>
      {clouds.map((cloud) => (
        <Cloud key={cloud.position.join(':')} position={cloud.position} scale={cloud.scale} />
      ))}
    </group>
  )
}
