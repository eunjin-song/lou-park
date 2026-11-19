import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { flowers, reeds } from './parkLayout.ts'
import { palette } from '../game/constants.ts'

const SHOW_DISTANCE = 150
const BLOSSOM_COLORS = [palette.blossom, '#ffe38a'] as const

function ColoredStems({
  spots,
  stem,
  head,
  colors,
}: {
  spots: readonly { x: number; z: number; scale?: number; rotation?: number; color?: string }[]
  stem: readonly [number, number, number]
  head: readonly [number, number, number]
  colors?: readonly string[]
}) {
  const stems = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const dummy = useRef(new Object3D())

  const write = (cameraX: number, cameraZ: number) => {
    const marker = dummy.current
    spots.forEach((spot, index) => {
      const scale = Math.hypot(cameraX - spot.x, cameraZ - spot.z) > SHOW_DISTANCE ? 0 : (spot.scale ?? 1)
      marker.rotation.set(0, spot.rotation ?? 0, 0)
      marker.scale.set(scale, scale, scale)
      marker.position.set(spot.x, stem[1] * scale, spot.z)
      marker.updateMatrix()
      stems.current?.setMatrixAt(index, marker.matrix)
      marker.position.set(spot.x, head[1] * scale, spot.z)
      marker.updateMatrix()
      heads.current?.setMatrixAt(index, marker.matrix)
    })
    if (stems.current) stems.current.instanceMatrix.needsUpdate = true
    if (heads.current) {
      heads.current.instanceMatrix.needsUpdate = true
      if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true
    }
  }

  useLayoutEffect(() => {
    const mesh = heads.current
    if (!colors || !mesh) return
    spots.forEach((spot, index) => {
      mesh.setColorAt(index, new Color(spot.color ?? colors[index % colors.length] ?? palette.blossom))
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [spots, colors])

  useFrame(({ camera }) => {
    write(camera.position.x, camera.position.z)
  })

  if (spots.length === 0) return null
  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <cylinderGeometry args={[stem[0], stem[0], stem[2], 4]} />
        <meshStandardMaterial color={palette.reed} flatShading />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <sphereGeometry args={[head[0], 6, 5]} />
        <meshStandardMaterial color={colors ? '#ffffff' : palette.reed} flatShading />
      </instancedMesh>
    </group>
  )
}

export function Flowers() {
  return (
    <group>
      <ColoredStems spots={flowers} stem={[0.025, 0.14, 0.28]} head={[0.09, 0.3, 0]} colors={BLOSSOM_COLORS} />
      <ColoredStems spots={reeds} stem={[0.04, 0.55, 1.1]} head={[0.08, 1.15, 0]} />
    </group>
  )
}
