import { palette } from '../game/constants.ts'
import { fencePosts } from './parkLayout.ts'

export function Boundary() {
  return (
    <group>
      {fencePosts.map((post) => (
        <group key={`${post.x.toFixed(2)}:${post.z.toFixed(2)}`}>
          <mesh position={[post.x, 0.55, post.z]} castShadow>
            <boxGeometry args={[0.14, 1.1, 0.14]} />
            <meshStandardMaterial color={palette.fencePost} roughness={0.9} />
          </mesh>
          <mesh position={[post.x, 1.14, post.z]} castShadow>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={palette.blossom} flatShading />
          </mesh>
          <mesh position={[post.midX, 0.82, post.midZ]} rotation={[0, post.yaw, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, post.length]} />
            <meshStandardMaterial color={palette.fenceRail} roughness={0.95} />
          </mesh>
          <mesh position={[post.midX, 0.4, post.midZ]} rotation={[0, post.yaw, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, post.length]} />
            <meshStandardMaterial color={palette.fenceRail} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
