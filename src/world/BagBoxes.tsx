import { useMemo } from 'react'
import { BAG_BOXES } from '../../shared/places.ts'
import { palette } from '../game/constants.ts'
import { bagLabelTexture } from './signTexture.ts'

export function BagBoxes() {
  const label = useMemo(() => bagLabelTexture(), [])
  return (
    <group>
      {BAG_BOXES.map((box) => (
        <group key={`${box.x}:${box.z}`} name="bag-box" position={[box.x, 0, box.z]}>
          <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.78, 1.15, 0.46]} />
            <meshStandardMaterial color="#f6e4d2" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.22, 0]} castShadow>
            <boxGeometry args={[0.86, 0.1, 0.52]} />
            <meshStandardMaterial color="#efb0c4" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.78, 0.24]}>
            <planeGeometry args={[0.62, 0.24]} />
            <meshStandardMaterial map={label} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.22, 0.18]} castShadow>
            <boxGeometry args={[0.28, 0.34, 0.06]} />
            <meshStandardMaterial color="#fffdf8" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.18, 0.22]}>
            <boxGeometry args={[0.16, 0.08, 0.04]} />
            <meshStandardMaterial color={palette.blossomDeep} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
