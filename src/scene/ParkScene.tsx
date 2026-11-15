import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import type { Camera, Scene, WebGLRenderer } from 'three'
import { LocalAvatar } from '../avatar/LocalAvatar.tsx'
import { AvatarLabels } from '../ui/AvatarLabels.tsx'
import { bindLabelCamera } from '../ui/labelAnchors.ts'
import { CAMERA_FOV, CAMERA_OFFSET, SPAWN_X, SPAWN_Z, palette } from '../game/constants.ts'
import { Park } from '../world/Park.tsx'
import { Lights } from './Lights.tsx'
import { Sky } from './Sky.tsx'

export function ParkScene({ nickname }: { nickname: string }) {
  const present = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<WebGLRenderer | null>(null)
  const scene = useRef<Scene | null>(null)
  const camera = useRef<Camera | null>(null)

  useEffect(() => {
    let frame = 0

    const draw = () => {
      const gl = renderer.current
      const canvas = present.current
      const currentScene = scene.current
      const currentCamera = camera.current
      if (!gl || !canvas || !currentScene || !currentCamera) return

      gl.render(currentScene, currentCamera)
      const source = gl.domElement
      if (source.width === 0 || source.height === 0) return
      if (canvas.width !== source.width || canvas.height !== source.height) {
        canvas.width = source.width
        canvas.height = source.height
      }
      canvas.getContext('2d')?.drawImage(source, 0, 0)
    }

    const loop = () => {
      frame = requestAnimationFrame(loop)
      draw()
    }

    draw()
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      bindLabelCamera(null)
    }
  }, [])

  return (
    <div className="park-app">
      <div className="park-webgl-host">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          style={{ width: '100%', height: '100%' }}
          camera={{
            position: [SPAWN_X + CAMERA_OFFSET.x, CAMERA_OFFSET.y, SPAWN_Z + CAMERA_OFFSET.z],
            fov: CAMERA_FOV,
            near: 0.1,
            far: 320,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'default',
            preserveDrawingBuffer: true,
          }}
          onCreated={({ gl, scene: createdScene, camera: createdCamera }) => {
            renderer.current = gl
            scene.current = createdScene
            camera.current = createdCamera
            bindLabelCamera(createdCamera)
            gl.toneMapping = ACESFilmicToneMapping
            gl.toneMappingExposure = 1.08
            gl.shadowMap.type = PCFShadowMap
            createdCamera.lookAt(SPAWN_X, 1.05, SPAWN_Z)
          }}
        >
          <color attach="background" args={[palette.skyHorizon]} />
          <fog attach="fog" args={[palette.fog, 42, 110]} />
          <Sky />
          <Lights />
          <Park />
          <LocalAvatar nickname={nickname} />
        </Canvas>
      </div>
      <canvas ref={present} className="park-present" />
      <AvatarLabels />
    </div>
  )
}
