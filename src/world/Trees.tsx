import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { palette } from '../game/constants.ts'
import { trees, type TreeKind, type TreeSpec } from './parkLayout.ts'

const SHOW_DISTANCE = 165

function Foliage({ kind, list }: { kind: TreeKind; list: TreeSpec[] }) {
  const trunk = useRef<InstancedMesh>(null)
  const crown = useRef<InstancedMesh>(null)
  const accent = useRef<InstancedMesh>(null)
  const dummy = useRef(new Object3D())
  const leaf = kind === 'blossom' ? palette.blossom : kind === 'tall' ? palette.leafDeep : palette.leaf
  const accentColor = kind === 'blossom' ? palette.blossomDeep : palette.leafLight

  const write = (cameraX: number, cameraZ: number) => {
    const marker = dummy.current
    list.forEach((tree, index) => {
      const far = Math.hypot(cameraX - tree.x, cameraZ - tree.z) > SHOW_DISTANCE
      const scale = far ? 0 : tree.scale
      marker.rotation.set(0, tree.rotation, 0)
      marker.scale.set(scale, scale, scale)
      marker.position.set(tree.x, 0.55 * scale, tree.z)
      marker.updateMatrix()
      trunk.current?.setMatrixAt(index, marker.matrix)
      marker.position.set(tree.x, (kind === 'tall' ? 1.85 : 1.5) * scale, tree.z)
      marker.updateMatrix()
      crown.current?.setMatrixAt(index, marker.matrix)
      if (kind !== 'tall') {
        marker.position.set(tree.x + Math.cos(tree.rotation) * 0.42 * scale, 1.2 * scale, tree.z + Math.sin(tree.rotation) * 0.12 * scale)
        marker.updateMatrix()
        accent.current?.setMatrixAt(index, marker.matrix)
      }
    })
    if (trunk.current) trunk.current.instanceMatrix.needsUpdate = true
    if (crown.current) crown.current.instanceMatrix.needsUpdate = true
    if (accent.current) accent.current.instanceMatrix.needsUpdate = true
  }

  useFrame(({ camera }) => {
    write(camera.position.x, camera.position.z)
  })

  if (list.length === 0) return null
  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, list.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.12, 0.2, 1.1, 5]} />
        <meshStandardMaterial color={palette.trunk} flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, list.length]} frustumCulled={false}>
        {kind === 'tall' ? <coneGeometry args={[0.95, 2.05, 6]} /> : <icosahedronGeometry args={[0.82, 0]} />}
        <meshStandardMaterial color={leaf} flatShading roughness={0.9} />
      </instancedMesh>
      {kind !== 'tall' && (
        <instancedMesh ref={accent} args={[undefined, undefined, list.length]} frustumCulled={false}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color={accentColor} flatShading roughness={0.9} />
        </instancedMesh>
      )}
    </group>
  )
}

export function Trees() {
  const groups: Record<TreeKind, TreeSpec[]> = { round: [], tall: [], blossom: [] }
  for (const tree of trees) groups[tree.kind].push(tree)
  return (
    <group>
      <Foliage kind="round" list={groups.round} />
      <Foliage kind="tall" list={groups.tall} />
      <Foliage kind="blossom" list={groups.blossom} />
    </group>
  )
}
