import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { DirectionalLight } from 'three'
import { whereabouts } from '../input/parkActions.ts'
import { palette } from '../game/constants.ts'

export function Lights() {
  const sun = useRef<DirectionalLight>(null)
  const fill = useRef<DirectionalLight>(null)
  useFrame(() => {
    const light = sun.current
    if (light) {
      light.position.set(whereabouts.x + 10, 18, whereabouts.z + 6)
      light.target.position.set(whereabouts.x, 0, whereabouts.z)
      light.target.updateMatrixWorld()
    }
    fill.current?.position.set(whereabouts.x - 8, 10, whereabouts.z + 12)
  })
  return (
    <>
      <hemisphereLight color="#fff6e6" groundColor={palette.grass} intensity={0.72} />
      <ambientLight color="#fffaf4" intensity={0.32} />
      <directionalLight
        ref={sun}
        position={[18, 26, 12]}
        intensity={1.35}
        color="#fff1dc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <directionalLight ref={fill} position={[-14, 8, 18]} intensity={0.38} color="#d9ecff" />
    </>
  )
}
