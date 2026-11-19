import { useMemo } from 'react'
import { Shape, ShapeGeometry } from 'three'
import { PARK, type Pt } from '../../shared/shore.ts'
import { palette } from '../game/constants.ts'

function parkShape(points: readonly Pt[]): ShapeGeometry {
  const shape = new Shape()
  const first = points[0]
  if (!first) return new ShapeGeometry()
  shape.moveTo(first.x, -first.z)
  for (const point of points.slice(1)) shape.lineTo(point.x, -point.z)
  shape.closePath()
  return new ShapeGeometry(shape)
}

export function Ground() {
  const grass = useMemo(() => parkShape(PARK), [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[4200, 4200]} />
        <meshStandardMaterial color={palette.meadow} roughness={1} />
      </mesh>
      <mesh geometry={grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color={palette.grass} roughness={1} />
      </mesh>
    </group>
  )
}
