import { PLAY_GATE, PLAY_GATE_DIR, PLAYGROUND, PLAYGROUND_BENCH } from '../../shared/places.ts'
import { palette } from '../game/constants.ts'

function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

export function Playground() {
  const gateAngle = Math.atan2(PLAY_GATE_DIR.x, PLAY_GATE_DIR.z)
  const posts: { x: number; z: number; angle: number }[] = []
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2
    if (Math.abs(angleDelta(gateAngle, angle)) < PLAY_GATE) continue
    posts.push({
      angle,
      x: PLAYGROUND.x + Math.sin(angle) * PLAYGROUND.fence,
      z: PLAYGROUND.z + Math.cos(angle) * PLAYGROUND.fence,
    })
  }

  return (
    <group name="playground">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLAYGROUND.x, 0.02, PLAYGROUND.z]} receiveShadow>
        <circleGeometry args={[PLAYGROUND.radius - 0.15, 28]} />
        <meshStandardMaterial color="#f3ddb8" roughness={1} />
      </mesh>
      {posts.map((post) => (
        <group key={post.angle.toFixed(3)} position={[post.x, 0, post.z]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.1, 0.56, 0.1]} />
            <meshStandardMaterial color={palette.fencePost} roughness={0.85} />
          </mesh>
        </group>
      ))}
      <group position={[PLAYGROUND_BENCH.x, 0, PLAYGROUND_BENCH.z]} rotation={[0, PLAYGROUND_BENCH.yaw, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, 0.1, 0.46]} />
          <meshStandardMaterial color={palette.benchWood} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.68, -0.18]} castShadow>
          <boxGeometry args={[1.35, 0.42, 0.08]} />
          <meshStandardMaterial color={palette.benchWood} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.48, 0.02]} receiveShadow>
          <boxGeometry args={[1.1, 0.04, 0.32]} />
          <meshStandardMaterial color={palette.benchCushion} roughness={0.95} />
        </mesh>
      </group>
      <group position={[PLAYGROUND.x - 0.4, 0, PLAYGROUND.z + 0.2]}>
        <mesh position={[-0.55, 0.28, 0]} castShadow>
          <boxGeometry args={[0.08, 0.56, 0.08]} />
          <meshStandardMaterial color="#f7c3d0" roughness={0.7} />
        </mesh>
        <mesh position={[0.55, 0.28, 0]} castShadow>
          <boxGeometry args={[0.08, 0.56, 0.08]} />
          <meshStandardMaterial color="#f7c3d0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[1.25, 0.08, 0.08]} />
          <meshStandardMaterial color="#ef86a8" roughness={0.6} />
        </mesh>
        <mesh position={[0.15, 0.16, 0.7]} castShadow>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshStandardMaterial color="#ffe38a" flatShading roughness={0.55} />
        </mesh>
      </group>
    </group>
  )
}
