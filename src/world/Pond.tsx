import { palette } from '../game/constants.ts'
import { pond } from './parkLayout.ts'

const pads = [
  { x: 1.15, z: 0.45, scale: 0.72 },
  { x: -0.85, z: 0.95, scale: 0.52 },
  { x: 0.25, z: -1.15, scale: 0.64 },
]

const reeds = [
  { x: -2.5, z: 1.7, height: 0.85 },
  { x: -2.15, z: 2.15, height: 1.05 },
  { x: -1.55, z: 2.45, height: 0.75 },
  { x: 2.35, z: -0.4, height: 0.95 },
  { x: 2.05, z: -0.9, height: 0.7 },
]

const stones = [
  { x: 2.7, z: 1.3, scale: 0.28 },
  { x: 2.2, z: 1.85, scale: 0.18 },
  { x: -2.85, z: -0.7, scale: 0.24 },
  { x: -1.9, z: -2.15, scale: 0.2 },
  { x: 0.4, z: 2.85, scale: 0.16 },
]

export function Pond() {
  return (
    <group position={[pond.x, 0, pond.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
        <ringGeometry args={[pond.radius - 0.08, pond.radius + 0.7, 48]} />
        <meshStandardMaterial color={palette.sand} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]} receiveShadow>
        <circleGeometry args={[pond.radius, 48]} />
        <meshStandardMaterial color={palette.water} roughness={0.22} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.45, 0.034, -0.25]}>
        <circleGeometry args={[pond.radius * 0.48, 32]} />
        <meshStandardMaterial color={palette.waterLight} roughness={0.18} />
      </mesh>

      {pads.map((pad) => (
        <group key={`${pad.x}:${pad.z}`} position={[pad.x, 0.04, pad.z]} scale={pad.scale}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.55, 12]} />
            <meshStandardMaterial color={palette.lily} flatShading roughness={1} />
          </mesh>
          <mesh position={[0.08, 0.04, 0.02]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial color={palette.lilyFlower} flatShading />
          </mesh>
        </group>
      ))}

      {reeds.map((reed) => (
        <group key={`${reed.x}:${reed.z}`} position={[reed.x, 0, reed.z]}>
          <mesh position={[0, reed.height / 2, 0]}>
            <cylinderGeometry args={[0.025, 0.035, reed.height, 5]} />
            <meshStandardMaterial color={palette.reed} flatShading />
          </mesh>
          <mesh position={[0.08, reed.height - 0.02, 0]} rotation={[0, 0, -0.8]}>
            <coneGeometry args={[0.08, 0.22, 5]} />
            <meshStandardMaterial color={palette.leafLight} flatShading />
          </mesh>
        </group>
      ))}

      {stones.map((stone) => (
        <mesh key={`${stone.x}:${stone.z}`} position={[stone.x, stone.scale * 0.45, stone.z]} castShadow>
          <icosahedronGeometry args={[stone.scale, 0]} />
          <meshStandardMaterial color={palette.stone} flatShading roughness={1} />
        </mesh>
      ))}

      <group position={[1.35, 0.08, -0.35]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial color={palette.duck} flatShading />
        </mesh>
        <mesh position={[0, 0.16, 0.16]} castShadow>
          <sphereGeometry args={[0.13, 8, 8]} />
          <meshStandardMaterial color={palette.duck} flatShading />
        </mesh>
        <mesh position={[0, 0.14, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.05, 0.12, 5]} />
          <meshStandardMaterial color={palette.duckBeak} flatShading />
        </mesh>
        <mesh position={[-0.05, 0.2, 0.24]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color={palette.eye} />
        </mesh>
      </group>
    </group>
  )
}
