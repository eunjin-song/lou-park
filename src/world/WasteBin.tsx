import { useMemo } from 'react'
import { WASTE_BINS } from '../../shared/places.ts'
import { palette } from '../game/constants.ts'
import { binLabelTexture } from './signTexture.ts'

export function WasteBin() {
  const label = useMemo(() => binLabelTexture(), [])
  return (
    <group>
      {WASTE_BINS.map((bin) => (
        <group key={`${bin.x}:${bin.z}`} name="waste-bin" position={[bin.x, 0, bin.z]}>
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <cylinderGeometry args={[0.42, 0.48, 0.08, 8]} />
            <meshStandardMaterial color={palette.stone} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.4, 0.7, 8]} />
            <meshStandardMaterial color="#d7efe4" flatShading roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.84, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.36, 0.1, 8]} />
            <meshStandardMaterial color="#2f6d58" flatShading roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.62, 0.36]}>
            <planeGeometry args={[0.7, 0.26]} />
            <meshStandardMaterial map={label} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
