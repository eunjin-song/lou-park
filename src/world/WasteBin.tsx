import { palette } from '../game/constants.ts'
import { WASTE_BIN } from '../../shared/places.ts'

export function WasteBin() {
  return (
    <group name="waste-bin" position={[WASTE_BIN.x, 0, WASTE_BIN.z]}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.08, 8]} />
        <meshStandardMaterial color={palette.stone} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.62, 8]} />
        <meshStandardMaterial color="#d7efe4" flatShading roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.76, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.36, 0.08, 8]} />
        <meshStandardMaterial color="#8fbfa8" flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.46, 0.34]} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.06]} />
        <meshStandardMaterial color="#ef86a8" roughness={0.6} />
      </mesh>
    </group>
  )
}
