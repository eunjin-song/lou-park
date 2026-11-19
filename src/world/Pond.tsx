import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide } from 'three'
import { LAKE, WETLAND, type Pt } from '../../shared/shore.ts'
import { palette } from '../game/constants.ts'

function fanGeometry(points: readonly Pt[], y: number): BufferGeometry {
  const geometry = new BufferGeometry()
  if (points.length < 3) return geometry
  let cx = 0
  let cz = 0
  for (const point of points) {
    cx += point.x
    cz += point.z
  }
  cx /= points.length
  cz /= points.length
  const positions = new Float32Array((points.length + 1) * 3)
  positions[0] = cx
  positions[1] = y
  positions[2] = cz
  points.forEach((point, index) => {
    positions[(index + 1) * 3] = point.x
    positions[(index + 1) * 3 + 1] = y
    positions[(index + 1) * 3 + 2] = point.z
  })
  const indices: number[] = []
  for (let index = 0; index < points.length; index += 1) {
    indices.push(0, index + 1, ((index + 1) % points.length) + 1)
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  return geometry
}

export function Pond() {
  const water = useMemo(() => fanGeometry(LAKE, 0.03), [])
  const reeds = useMemo(() => (WETLAND.length > 3 ? fanGeometry(WETLAND, 0.018) : null), [])
  return (
    <group>
      {reeds && (
        <mesh geometry={reeds}>
          <meshBasicMaterial color={palette.wetland} side={DoubleSide} />
        </mesh>
      )}
      <mesh geometry={water}>
        <meshBasicMaterial color={palette.water} side={DoubleSide} />
      </mesh>
    </group>
  )
}
