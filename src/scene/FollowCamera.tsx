import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import {
  CAMERA_LOOK_Y,
  CAMERA_MAX_DISTANCE,
  CAMERA_MAX_PITCH,
  CAMERA_MIN_DISTANCE,
  CAMERA_MIN_Y,
  CAMERA_OFFSET,
} from '../game/constants.ts'
import { isInputBlocked } from '../input/inputGate.ts'
import { stickPointerId } from '../input/stick.ts'
import { dampAngle } from '../game/movement.ts'
import type { MutablePose } from '../game/types.ts'

const INITIAL_HEIGHT = CAMERA_OFFSET.y - CAMERA_LOOK_Y
const INITIAL_DISTANCE = Math.hypot(INITIAL_HEIGHT, CAMERA_OFFSET.z)
const INITIAL_PITCH = Math.atan2(INITIAL_HEIGHT, CAMERA_OFFSET.z)
const YAW_SPEED = 0.005
const PITCH_SPEED = 0.004

function lowestPitch(distance: number): number {
  const sine = (CAMERA_MIN_Y - CAMERA_LOOK_Y) / Math.max(distance, 0.001)
  return Math.asin(Math.min(1, Math.max(-1, sine)))
}

function clampPitch(pitch: number, distance: number): number {
  return Math.min(CAMERA_MAX_PITCH, Math.max(lowestPitch(distance), pitch))
}

function clampDistance(distance: number): number {
  return Math.min(CAMERA_MAX_DISTANCE, Math.max(CAMERA_MIN_DISTANCE, distance))
}

/** One third-person camera. Movement reads this camera after the orbit step. */
export function FollowCamera({ pose }: { pose: MutablePose }) {
  const look = useRef(new Vector3(pose.x, CAMERA_LOOK_Y, pose.z))
  const yaw = useRef(0)
  const pitch = useRef(INITIAL_PITCH)
  const distance = useRef(INITIAL_DISTANCE)
  const yawTarget = useRef(0)
  const pitchTarget = useRef(INITIAL_PITCH)
  const distanceTarget = useRef(INITIAL_DISTANCE)
  const mouseDrag = useRef(false)
  const touchId = useRef<number | null>(null)
  const mousePoint = useRef({ x: 0, y: 0 })
  const touchPoint = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const overPark = (target: EventTarget | null) =>
      target instanceof Element && target.closest('.park-app') !== null
    const isControl = (target: EventTarget | null) =>
      target instanceof Element && target.closest('.park-control, .chat-panel, .hud, button, input, textarea, select, a') !== null

    const stopAll = () => {
      mouseDrag.current = false
      touchId.current = null
    }

    const onContextMenu = (event: MouseEvent) => {
      if (overPark(event.target)) event.preventDefault()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (isInputBlocked() || isControl(event.target) || event.pointerId === stickPointerId()) return
      if (event.pointerType === 'touch') {
        if (event.clientX < window.innerWidth * 0.42 || !overPark(event.target)) return
        touchId.current = event.pointerId
        touchPoint.current.x = event.clientX
        touchPoint.current.y = event.clientY
        event.preventDefault()
        return
      }
      if (event.button !== 2 || !overPark(event.target)) return
      mouseDrag.current = true
      mousePoint.current.x = event.clientX
      mousePoint.current.y = event.clientY
      event.preventDefault()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (isInputBlocked()) {
        stopAll()
        return
      }
      const touch = event.pointerId === touchId.current
      const mouse = mouseDrag.current && event.pointerType !== 'touch'
      if (!touch && !mouse) return
      if (mouse && (event.buttons & 2) === 0) {
        mouseDrag.current = false
        return
      }
      const last = touch ? touchPoint.current : mousePoint.current
      const dx = event.clientX - last.x
      const dy = event.clientY - last.y
      last.x = event.clientX
      last.y = event.clientY
      yawTarget.current -= dx * YAW_SPEED
      pitchTarget.current = clampPitch(pitchTarget.current + dy * PITCH_SPEED, distanceTarget.current)
      if (touch) event.preventDefault()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === touchId.current) touchId.current = null
      if (event.pointerType !== 'touch' && event.button === 2) mouseDrag.current = false
    }

    const onHide = () => {
      if (document.visibilityState === 'hidden') stopAll()
    }

    const onWheel = (event: WheelEvent) => {
      if (isInputBlocked() || !overPark(event.target)) return
      event.preventDefault()
      const delta = Math.max(-2.4, Math.min(2.4, event.deltaY * 0.012))
      distanceTarget.current = clampDistance(distanceTarget.current + delta)
      pitchTarget.current = clampPitch(pitchTarget.current, distanceTarget.current)
    }

    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('blur', stopAll)
    window.addEventListener('pagehide', stopAll)
    window.addEventListener('park-input-reset', stopAll)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('blur', stopAll)
      window.removeEventListener('pagehide', stopAll)
      window.removeEventListener('park-input-reset', stopAll)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  useFrame((state, dt) => {
    if (isInputBlocked()) return
    const step = Math.min(dt, 0.05)
    const follow = 1 - Math.exp(-5 * step)
    look.current.x += (pose.x - look.current.x) * follow
    look.current.z += (pose.z - look.current.z) * follow
    look.current.y = CAMERA_LOOK_Y

    yaw.current = dampAngle(yaw.current, yawTarget.current, 12, step)
    const distanceBlend = 1 - Math.exp(-8 * step)
    distance.current += (distanceTarget.current - distance.current) * distanceBlend
    const pitched = clampPitch(pitchTarget.current, distance.current)
    pitch.current += (pitched - pitch.current) * (1 - Math.exp(-12 * step))

    const horizontal = Math.cos(pitch.current) * distance.current
    const raised = look.current.y + Math.sin(pitch.current) * distance.current
    state.camera.position.set(
      look.current.x + Math.sin(yaw.current) * horizontal,
      Math.max(CAMERA_MIN_Y, raised),
      look.current.z + Math.cos(yaw.current) * horizontal,
    )
    state.camera.lookAt(look.current)
  }, 3)

  return null
}
