import { useFeed } from '../session/worldFeed.ts'

/** Piles created by the server. This view never decides when one appears. */
export function PoopMarks() {
  const { poops } = useFeed()
  return (
    <group>
      {poops.map((poop) => (
        <group key={poop.id} name={`poop-${poop.id}`} position={[poop.x, 0.08, poop.z]}>
          <mesh castShadow>
            <sphereGeometry args={[0.16, 7, 6]} />
            <meshStandardMaterial color="#8a5a3a" flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0.1, 0.04, 0.05]} castShadow>
            <sphereGeometry args={[0.1, 6, 5]} />
            <meshStandardMaterial color="#a56b45" flatShading roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
