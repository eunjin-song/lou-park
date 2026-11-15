import { RoundedBox } from '@react-three/drei'
import { palette } from '../game/constants.ts'
import { benches } from './parkLayout.ts'

function Bench() {
  return (
    <group>
      <RoundedBox args={[1.45, 0.1, 0.48]} radius={0.04} smoothness={2} position={[0, 0.46, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.benchWood} roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 0.5, 0.02]} receiveShadow>
        <boxGeometry args={[1.2, 0.04, 0.36]} />
        <meshStandardMaterial color={palette.benchCushion} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.78, -0.2]} castShadow>
        <boxGeometry args={[1.45, 0.46, 0.08]} />
        <meshStandardMaterial color={palette.benchWood} roughness={0.85} />
      </mesh>
      {[
        [-0.58, 0.18],
        [0.58, 0.18],
        [-0.58, -0.16],
        [0.58, -0.16],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x ?? 0, 0.22, z ?? 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.08]} />
          <meshStandardMaterial color={palette.trunk} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export function Benches() {
  return (
    <group>
      {benches.map((bench) => (
        <group key={`${bench.x.toFixed(2)}:${bench.z.toFixed(2)}`} position={[bench.x, 0, bench.z]} rotation={[0, bench.yaw, 0]}>
          <Bench />
        </group>
      ))}
    </group>
  )
}
