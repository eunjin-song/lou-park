import { Vector3, type Camera } from 'three'

export type LabelAnchor = {
  id: string
  nickname: string
  self: boolean
  bubble: string | null
  x: number
  y: number
  z: number
}

export type LabelView = {
  id: string
  nickname: string
  self: boolean
  bubble: string | null
}

const anchors = new Map<string, LabelAnchor>()
const point = new Vector3()
let camera: Camera | null = null
let snapshot: LabelView[] = []
const listeners = new Set<() => void>()

function contentKey(anchor: Pick<LabelAnchor, 'nickname' | 'self' | 'bubble'>): string {
  return `${anchor.self ? '1' : '0'}\n${anchor.nickname}\n${anchor.bubble ?? ''}`
}

function publish() {
  snapshot = [...anchors.values()].map((anchor) => ({
    id: anchor.id,
    nickname: anchor.nickname,
    self: anchor.self,
    bubble: anchor.bubble,
  }))
  for (const listener of listeners) listener()
}

export function bindLabelCamera(next: Camera | null) {
  camera = next
}

export function labelAnchors(): Map<string, LabelAnchor> {
  return anchors
}

export function projectLabel(anchor: LabelAnchor, width: number, height: number): { x: number; y: number } | null {
  if (!camera || width <= 0 || height <= 0) return null
  point.set(anchor.x, anchor.y, anchor.z).project(camera)
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.z < -1 || point.z > 1) return null
  return {
    x: (point.x * 0.5 + 0.5) * width,
    y: (-point.y * 0.5 + 0.5) * height,
  }
}

/** Moves the on-screen anchor. Notifies React only when the name or bubble changes. */
export function syncLabel(next: LabelAnchor) {
  const current = anchors.get(next.id)
  if (!current) {
    anchors.set(next.id, { ...next })
    publish()
    return
  }
  const changed = contentKey(current) !== contentKey(next)
  current.nickname = next.nickname
  current.self = next.self
  current.bubble = next.bubble
  current.x = next.x
  current.y = next.y
  current.z = next.z
  if (changed) publish()
}

export function removeLabel(id: string) {
  if (!anchors.delete(id)) return
  publish()
}

export function subscribeLabels(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getLabelSnapshot(): LabelView[] {
  return snapshot
}
