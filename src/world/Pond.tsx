import { palette } from '../game/constants.ts'
import { BIG_LAKE, BRIDGE, CHANNEL, DECK, SMALL_LAKE } from '../../shared/places.ts'

function Shore({ x, z, radius }: { x: number; z: number; radius: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow>
        <circleGeometry args={[radius + 0.85, 40]} />
        <meshStandardMaterial color={palette.sand} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color={palette.water} roughness={0.25} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[radius * 0.18, 0.034, -radius * 0.08]}>
        <circleGeometry args={[radius * 0.42, 28]} />
        <meshStandardMaterial color={palette.waterLight} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Lilies({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.045, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 10]} />
        <meshStandardMaterial color={palette.lily} roughness={1} />
      </mesh>
      <mesh position={[0.08, 0.03, 0.04]}>
        <sphereGeometry args={[0.08, 7, 6]} />
        <meshStandardMaterial color={palette.lilyFlower} flatShading />
      </mesh>
    </group>
  )
}

export function Pond() {
  return (
    <group>
      {BIG_LAKE.map((lake) => (
        <Shore key={`${lake.x}:${lake.z}`} x={lake.x} z={lake.z} radius={lake.r} />
      ))}
      <Shore x={SMALL_LAKE.x} z={SMALL_LAKE.z} radius={SMALL_LAKE.r} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CHANNEL.x, 0.026, CHANNEL.z]}>
        <planeGeometry args={[CHANNEL.halfX * 2, CHANNEL.halfZ * 2]} />
        <meshStandardMaterial color={palette.water} roughness={0.25} />
      </mesh>
      <group position={[BRIDGE.x, 0, BRIDGE.z]}>
        <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
          <boxGeometry args={[BRIDGE.halfX * 2, 0.08, BRIDGE.halfZ * 2]} />
          <meshStandardMaterial color={palette.benchWood} roughness={0.85} />
        </mesh>
        {[-1.4, 0, 1.4].map((x) => (
          <mesh key={x} position={[x, 0.14, 0]}>
            <boxGeometry args={[0.16, 0.06, BRIDGE.halfZ * 2 - 0.2]} />
            <meshStandardMaterial color="#f0c7a4" roughness={0.8} />
          </mesh>
        ))}
      </group>
      <group position={[DECK.x, 0, DECK.z]}>
        <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
          <boxGeometry args={[DECK.halfX * 2, 0.08, DECK.halfZ * 2]} />
          <meshStandardMaterial color={palette.benchWood} roughness={0.85} />
        </mesh>
      </group>
      <Lilies x={-2.2} z={3.4} />
      <Lilies x={3.1} z={0.6} />
      <Lilies x={6.2} z={-32.4} />
      <Lilies x={2.4} z={-36.8} />
      <Lilies x={5.5} z={-30.6} />
      <group position={[4.8, 0.08, 1.2]}>
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
      </group>
    </group>
  )
}
