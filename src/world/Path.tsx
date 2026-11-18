import { palette } from '../game/constants.ts'

type PathRun = { x: number; z: number; yaw: number; length: number; width: number }
type PathRing = { x: number; z: number; inner: number; outer: number }

const runs: PathRun[] = [
  { x: 0, z: 32.5, yaw: 0, length: 28, width: 3.4 },
  { x: 6.2, z: 36.4, yaw: Math.atan2(6.8, 1.6), length: 9.2, width: 2.8 },
  { x: 16, z: 6, yaw: 0, length: 18, width: 2.8 },
  { x: -16, z: 6, yaw: 0, length: 18, width: 2.8 },
  { x: 0, z: 18, yaw: Math.PI / 2, length: 30, width: 2.8 },
  { x: 9, z: -12.2, yaw: Math.PI / 2, length: 10, width: 2.8 },
  { x: -8, z: -12.2, yaw: Math.PI / 2, length: 10, width: 2.8 },
  { x: -5.4, z: -12.6, yaw: 0, length: 5, width: 2.4 },
  { x: -7.2, z: -18.5, yaw: Math.PI / 2, length: 6.4, width: 2.6 },
  { x: 8.4, z: -18.5, yaw: Math.PI / 2, length: 6.4, width: 2.6 },
  { x: 4.2, z: -26.2, yaw: 0, length: 7.2, width: 2.6 },
]

const rings: PathRing[] = [
  { x: 4, z: -34, inner: 10.4, outer: 12.6 },
]

function Paved({ run }: { run: PathRun }) {
  return (
    <group position={[run.x, 0, run.z]} rotation={[0, run.yaw, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[run.width + 0.55, run.length + 0.4]} />
        <meshStandardMaterial color={palette.pathEdge} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} receiveShadow>
        <planeGeometry args={[run.width, run.length]} />
        <meshStandardMaterial color={palette.path} roughness={1} />
      </mesh>
    </group>
  )
}

export function Path() {
  return (
    <group>
      {rings.map((ring) => (
        <group key={`${ring.x}:${ring.z}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ring.x, 0.02, ring.z]} receiveShadow>
            <ringGeometry args={[ring.inner - 0.28, ring.outer + 0.28, 72]} />
            <meshStandardMaterial color={palette.pathEdge} roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ring.x, 0.035, ring.z]} receiveShadow>
            <ringGeometry args={[ring.inner, ring.outer, 72]} />
            <meshStandardMaterial color={palette.path} roughness={1} />
          </mesh>
        </group>
      ))}
      {runs.map((run) => (
        <Paved key={`${run.x}:${run.z}`} run={run} />
      ))}
    </group>
  )
}
