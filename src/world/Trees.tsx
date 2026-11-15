import { palette } from '../game/constants.ts'
import type { TreeSpec } from './parkLayout.ts'
import { trees } from './parkLayout.ts'

function Tree({ x, z, scale, kind, rotation }: TreeSpec) {
  const leaf = kind === 'blossom' ? palette.blossom : kind === 'tall' ? palette.leafDeep : palette.leaf
  const accent = kind === 'blossom' ? palette.blossomDeep : palette.leafLight

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.1, 6]} />
        <meshStandardMaterial color={palette.trunk} flatShading roughness={1} />
      </mesh>
      {kind === 'tall' ? (
        <mesh position={[0, 1.85, 0]} castShadow>
          <coneGeometry args={[0.95, 2.05, 7]} />
          <meshStandardMaterial color={leaf} flatShading roughness={0.9} />
        </mesh>
      ) : (
        <group>
          <mesh position={[0, 1.5, 0]} castShadow>
            <icosahedronGeometry args={[0.82, 0]} />
            <meshStandardMaterial color={leaf} flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0.42, 1.2, 0.12]} castShadow>
            <icosahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color={accent} flatShading roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  )
}

export function Trees() {
  return (
    <group>
      {trees.map((tree) => (
        <Tree key={`${tree.x.toFixed(2)}:${tree.z.toFixed(2)}`} {...tree} />
      ))}
    </group>
  )
}
