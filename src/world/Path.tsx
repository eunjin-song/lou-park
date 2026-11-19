import { useMemo } from 'react'
import { LOOP, frameAt, type Pt } from '../../shared/shore.ts'
import { palette } from '../game/constants.ts'
import { ribbonGeometry } from './ribbon.ts'

function deckLine(): Pt[] {
  const points: Pt[] = []
  for (let distance = 150; distance <= 1260; distance += 4) {
    const frame = frameAt(distance)
    if (frame.nx > -0.72) continue
    points.push({ x: frame.x - frame.nx * 11, z: frame.z - frame.nz * 11 })
  }
  return points
}

export function Path() {
  const path = useMemo(() => ribbonGeometry(LOOP, 7.2, 0.035, true), [])
  const edge = useMemo(() => ribbonGeometry(LOOP, 8.4, 0.028, true), [])
  const deck = useMemo(() => ribbonGeometry(deckLine(), 34, 0.06, false), [])
  return (
    <group>
      <mesh geometry={edge} receiveShadow>
        <meshStandardMaterial color={palette.pathEdge} roughness={1} />
      </mesh>
      <mesh geometry={path} receiveShadow>
        <meshStandardMaterial color={palette.path} roughness={1} />
      </mesh>
      <mesh geometry={deck} receiveShadow>
        <meshStandardMaterial color={palette.benchWood} roughness={0.86} />
      </mesh>
    </group>
  )
}
