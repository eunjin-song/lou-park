import { BAG_BOXES, BAG_HINT, BAG_USE_RADIUS, BIN_USE_RADIUS, PLAYGROUND_BENCH, POOP_PICKUP_RADIUS, REST_RADIUS, WASTE_BINS, nearAny } from '../../shared/places.ts'
import type { ParkPoop } from '../../shared/protocol.ts'
import { isInputBlocked } from './inputGate.ts'

export const whereabouts = { x: 0, z: 0, moving: false, resting: false }

let scoop = () => {}
let bin = () => {}
let draw = () => {}
let rest = () => {}
let goHome = () => {}

export function bindTidy(next: { scoop: () => void; bin: () => void; draw: () => void }) {
  scoop = next.scoop
  bin = next.bin
  draw = next.draw
}

export function bindRest(next: () => void) {
  rest = next
}

export function bindReturn(next: () => void) {
  goHome = next
}

export function requestReturn() {
  if (isInputBlocked()) return
  goHome()
}

export function requestScoop() {
  scoop()
}

export function requestBin() {
  bin()
}

export function requestDraw() {
  draw()
}

export function actionOffer(poops: readonly ParkPoop[], selfId: string, clean: boolean, used: boolean) {
  const pile = poops.find((item) => item.ownerId === selfId)
  const nearPile = pile !== undefined && Math.hypot(whereabouts.x - pile.x, whereabouts.z - pile.z) <= POOP_PICKUP_RADIUS
  const nearBin = nearAny(whereabouts.x, whereabouts.z, WASTE_BINS, BIN_USE_RADIUS)
  const nearBox = nearAny(whereabouts.x, whereabouts.z, BAG_BOXES, BAG_USE_RADIUS)
  const nearBench = !whereabouts.resting && !whereabouts.moving && Math.hypot(whereabouts.x - PLAYGROUND_BENCH.x, whereabouts.z - PLAYGROUND_BENCH.z) <= REST_RADIUS
  const hint = nearPile && !clean && !used ? BAG_HINT : nearPile && used ? '사용한 봉투를 휴지통에 먼저 버려 주세요' : ''
  if (nearPile && clean && !used) return { action: 'scoop' as const, hint }
  if (nearBin && used) return { action: 'bin' as const, hint }
  if (nearBox && !clean && !used) return { action: 'draw' as const, hint }
  if (nearBench) return { action: 'rest' as const, hint }
  return { action: 'none' as const, hint }
}

export function requestRest() {
  if (isInputBlocked() || whereabouts.moving || whereabouts.resting) return
  if (Math.hypot(whereabouts.x - PLAYGROUND_BENCH.x, whereabouts.z - PLAYGROUND_BENCH.z) > REST_RADIUS) return
  rest()
}
