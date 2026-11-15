import { flowers } from './parkLayout.ts'

function Flower({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.28, 5]} />
        <meshStandardMaterial color="#7dba72" flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.09, 7, 6]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0.05]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#fff6d4" />
      </mesh>
    </group>
  )
}

export function Flowers() {
  return (
    <group>
      {flowers.map((flower) => (
        <Flower key={`${flower.x}:${flower.z}`} x={flower.x} z={flower.z} color={flower.color} />
      ))}
    </group>
  )
}
