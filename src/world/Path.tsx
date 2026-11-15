import { PATH_INNER, PATH_OUTER, palette } from '../game/constants.ts'

export function Path() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[PATH_INNER - 0.32, PATH_OUTER + 0.32, 96]} />
        <meshStandardMaterial color={palette.pathEdge} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} receiveShadow>
        <ringGeometry args={[PATH_INNER, PATH_OUTER, 96]} />
        <meshStandardMaterial color={palette.path} roughness={1} />
      </mesh>
    </group>
  )
}
