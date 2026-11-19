import { useLayoutEffect, useRef } from 'react'
import { Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { PARK } from '../../shared/shore.ts'
import { palette } from '../game/constants.ts'

const posts = PARK.filter((_, index) => index % 5 === 0)

export function Boundary() {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const current = mesh.current
    if (!current) return
    const dummy = new Object3D()
    posts.forEach((post, index) => {
      dummy.position.set(post.x, 0.42, post.z)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      current.setMatrixAt(index, dummy.matrix)
    })
    current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, posts.length]} frustumCulled={false}>
      <cylinderGeometry args={[0.08, 0.1, 0.84, 5]} />
      <meshStandardMaterial color={palette.fencePost} roughness={1} />
    </instancedMesh>
  )
}
