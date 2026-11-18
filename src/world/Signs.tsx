import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import {
  BAG_BOXES,
  BIG_LAKE,
  BRIDGE,
  CHANNEL,
  DECK,
  DIRECTION_SIGNS,
  GUIDE_BOARD,
  PLAYGROUND,
  PLAYGROUND_SIGN,
  PLAZA,
  SMALL_LAKE,
  SPAWN_RING,
  WASTE_BINS,
} from '../../shared/places.ts'
import { FENCE_RADIUS, PLAY_RADIUS, SPAWN_X, SPAWN_Z, palette } from '../game/constants.ts'
import { directionSignTexture, playgroundSignTexture } from './signTexture.ts'

function useGuideTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 640
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('guide')
    ctx.fillStyle = '#f7f1e4'
    ctx.fillRect(0, 0, 640, 640)
    ctx.strokeStyle = '#e7b7c6'
    ctx.lineWidth = 10
    ctx.strokeRect(16, 16, 608, 608)
    ctx.fillStyle = '#3d5c52'
    ctx.font = '700 42px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('LOU Park', 320, 62)
    const half = 250
    const point = (x: number, z: number) => ({
      px: 320 + (x / PLAY_RADIUS) * half,
      py: 340 + (z / PLAY_RADIUS) * half,
    })
    ctx.fillStyle = '#b7e7a6'
    ctx.beginPath()
    ctx.arc(320, 340, half * (FENCE_RADIUS / PLAY_RADIUS) * 0.96, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8fd0ea'
    for (const lake of BIG_LAKE) {
      const spot = point(lake.x, lake.z)
      ctx.beginPath()
      ctx.arc(spot.px, spot.py, (lake.r / PLAY_RADIUS) * half, 0, Math.PI * 2)
      ctx.fill()
    }
    const small = point(SMALL_LAKE.x, SMALL_LAKE.z)
    ctx.beginPath()
    ctx.arc(small.px, small.py, (SMALL_LAKE.r / PLAY_RADIUS) * half, 0, Math.PI * 2)
    ctx.fill()
    const channel = point(CHANNEL.x, CHANNEL.z)
    ctx.fillRect(
      channel.px - (CHANNEL.halfX / PLAY_RADIUS) * half,
      channel.py - (CHANNEL.halfZ / PLAY_RADIUS) * half,
      (CHANNEL.halfX * 2 / PLAY_RADIUS) * half,
      (CHANNEL.halfZ * 2 / PLAY_RADIUS) * half,
    )
    ctx.fillStyle = '#e8b08a'
    const bridge = point(BRIDGE.x, BRIDGE.z)
    ctx.fillRect(bridge.px - 18, bridge.py - 4, 36, 8)
    const deck = point(DECK.x, DECK.z)
    ctx.fillRect(deck.px - 5, deck.py - 8, 10, 16)
    ctx.fillStyle = '#f7c3d0'
    const yard = point(PLAYGROUND.x, PLAYGROUND.z)
    ctx.fillRect(yard.px - 14, yard.py - 14, 28, 28)
    ctx.fillStyle = '#8a5a3a'
    for (const box of BAG_BOXES) {
      const spot = point(box.x, box.z)
      ctx.fillRect(spot.px - 5, spot.py - 5, 10, 10)
    }
    ctx.fillStyle = '#2f6d58'
    for (const bin of WASTE_BINS) {
      const spot = point(bin.x, bin.z)
      ctx.beginPath()
      ctx.arc(spot.px, spot.py, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    const here = point(SPAWN_X, SPAWN_Z)
    ctx.fillStyle = '#ef86a8'
    ctx.beginPath()
    ctx.arc(here.px, here.py, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '700 28px "Malgun Gothic", "Segoe UI", sans-serif'
    ctx.fillText('현재 위치', here.px, here.py - 16)
    ctx.fillStyle = '#3d5c52'
    ctx.font = '600 24px "Malgun Gothic", "Segoe UI", sans-serif'
    const legend = point(SMALL_LAKE.x, SMALL_LAKE.z - SMALL_LAKE.r - 3)
    ctx.fillText('작은 호수', legend.px, legend.py)
    const big = point(0, -12)
    ctx.fillText('큰 호수', big.px, big.py)
    ctx.fillText('놀이터', yard.px, yard.py + 34)
    ctx.fillStyle = '#8a5a3a'
    ctx.fillText('봉투', 96, 600)
    ctx.fillStyle = '#2f6d58'
    ctx.fillText('휴지통', 210, 600)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [])
}

function Posts({ height }: { height: number }) {
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, height / 2, 0]} castShadow>
          <boxGeometry args={[0.08, height, 0.08]} />
          <meshStandardMaterial color={palette.trunk} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export function Signs() {
  const guide = useGuideTexture()
  const playground = useMemo(() => playgroundSignTexture(), [])
  const direction = useMemo(() => directionSignTexture(), [])
  return (
    <group>
      <group position={[GUIDE_BOARD.x, 0, GUIDE_BOARD.z]} rotation={[0, GUIDE_BOARD.yaw, 0]}>
        <Posts height={1.7} />
        <mesh position={[0, 1.45, 0]} castShadow>
          <planeGeometry args={[1.7, 1.7]} />
          <meshStandardMaterial map={guide} roughness={0.9} />
        </mesh>
      </group>
      <group position={[PLAYGROUND_SIGN.x, 0, PLAYGROUND_SIGN.z]} rotation={[0, PLAYGROUND_SIGN.yaw, 0]}>
        <Posts height={1.85} />
        <mesh position={[0, 1.55, 0.04]} castShadow>
          <planeGeometry args={[1.85, 0.92]} />
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
            <planeGeometry args={[1.15, 0.5]} />
            <meshStandardMaterial map={direction} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[PLAZA.x, 0.02, PLAZA.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SPAWN_RING + 1.4, SPAWN_RING + 1.7, 32]} />
        <meshStandardMaterial color="#f7c3d0" roughness={1} />
      </mesh>
    </group>
  )
}
