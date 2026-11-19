import { hills } from './parkLayout.ts'
import { palette } from '../game/constants.ts'

export function Hills() {
  return (
    <group>
      {hills.map((hill) => (
        <mesh key={`${hill.x}:${hill.z}`} position={[hill.x, hill.height * 0.15, hill.z]} scale={[1, hill.height / hill.radius, 1]}>
          <sphereGeometry args={[hill.radius, 10, 8]} />
          <meshStandardMaterial color={palette.hill} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
