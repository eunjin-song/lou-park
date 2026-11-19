import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { DIRECTION_SIGNS, GUIDE_BOARD, PLAYGROUND_SIGN, SPAWN_RING, PLAZA } from '../../shared/places.ts'
import { palette } from '../game/constants.ts'
import { paintParkMap } from './paintMap.ts'
import { directionSignTexture, playgroundSignTexture } from './signTexture.ts'

function useGuideTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 860
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('guide')
    ctx.fillStyle = '#f7f1e4'
    ctx.fillRect(0, 0, 640, 860)
    paintParkMap(ctx, 640, 860, { x: PLAZA.x, z: PLAZA.z })
    ctx.fillStyle = '#3d5c52'
    ctx.font = '700 36px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('LOU Park', 320, 36)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [])
}

export function Signs() {
  const guide = useGuideTexture()
  const playground = useMemo(() => playgroundSignTexture(), [])
  const right = useMemo(() => directionSignTexture('right'), [])
  const left = useMemo(() => directionSignTexture('left'), [])
  return (
    <group>
      <group position={[GUIDE_BOARD.x, 0, GUIDE_BOARD.z]} rotation={[0, GUIDE_BOARD.yaw, 0]}>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 0.9, 0]} castShadow>
            <boxGeometry args={[0.08, 1.8, 0.08]} />
            <meshStandardMaterial color={palette.trunk} roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, 1.55, 0]} castShadow>
          <planeGeometry args={[1.55, 2.05]} />
          <meshStandardMaterial map={guide} roughness={0.9} />
        </mesh>
      </group>
      <group position={[PLAYGROUND_SIGN.x, 0, PLAYGROUND_SIGN.z]} rotation={[0, PLAYGROUND_SIGN.yaw, 0]}>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.85, 0]} castShadow>
            <boxGeometry args={[0.08, 1.7, 0.08]} />
            <meshStandardMaterial color={palette.trunk} roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, 1.45, 0.04]} castShadow>
          <planeGeometry args={[1.9, 0.95]} />
          <meshStandardMaterial map={playground} roughness={0.88} />
        </mesh>
      </group>
      {DIRECTION_SIGNS.map((sign) => (
        <group key={`${sign.x}:${sign.z}`} position={[sign.x, 0, sign.z]} rotation={[0, sign.yaw, 0]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.08, 1.4, 0.08]} />
            <meshStandardMaterial color={palette.trunk} roughness={1} />
          </mesh>
          <mesh position={[0, 1.25, 0.04]} castShadow>
            <planeGeometry args={[1.35, 0.58]} />
            <meshStandardMaterial map={sign.turn === 'left' ? left : right} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[PLAZA.x, 0.02, PLAZA.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SPAWN_RING + 1.2, SPAWN_RING + 1.55, 28]} />
        <meshStandardMaterial color="#f7c3d0" roughness={1} />
      </mesh>
    </group>
  )
}
