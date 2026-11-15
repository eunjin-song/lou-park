import { FENCE_RADIUS, PLAY_RADIUS, palette } from '../game/constants.ts'
import { grassPatches } from './parkLayout.ts'

export function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[72, 72]} />
        <meshStandardMaterial color={palette.meadow} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[FENCE_RADIUS - 0.15, 80]} />
        <meshStandardMaterial color={palette.grass} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
        <ringGeometry args={[PLAY_RADIUS - 0.4, FENCE_RADIUS - 0.2, 72]} />
        <meshStandardMaterial color={palette.grassDark} roughness={1} />
      </mesh>
      {grassPatches.map((patch) => (
        <mesh
          key={`${patch.x}:${patch.z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[patch.x, 0.01, patch.z]}
          receiveShadow
        >
          <circleGeometry args={[patch.radius, 24]} />
          <meshStandardMaterial color={patch.color} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
