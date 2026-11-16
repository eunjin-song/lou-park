import { BIN_USE_RADIUS, PLAYGROUND_BENCH, POOP_PICKUP_RADIUS, REST_RADIUS, WASTE_BIN } from '../../shared/places.ts'
import type { ParkPoop } from '../../shared/protocol.ts'
import { isInputBlocked } from './inputGate.ts'

export const whereabouts = { x: 0, z: 0, moving: false, resting: false }

let scoop = () => {}
let bin = () => {}
let rest = () => {}

export function bindTidy(next: { scoop: () => void; bin: () => void }) {
  scoop = next.scoop
  bin = next.bin
}

export function bindRest(next: () => void) {
  rest = next
}

export function requestScoop() {
  scoop()
}

export function requestBin() {
  bin()
}

export function actionOffer(poops: readonly ParkPoop[], selfId: string, holding: boolean) {
  const pile = poops.find((item) => item.ownerId === selfId)
  return {
    scoop: !holding && pile !== undefined && Math.hypot(whereabouts.x - pile.x, whereabouts.z - pile.z) <= POOP_PICKUP_RADIUS,
    bin: holding && Math.hypot(whereabouts.x - WASTE_BIN.x, whereabouts.z - WASTE_BIN.z) <= BIN_USE_RADIUS,
    rest: !whereabouts.resting && !whereabouts.moving && Math.hypot(whereabouts.x - PLAYGROUND_BENCH.x, whereabouts.z - PLAYGROUND_BENCH.z) <= REST_RADIUS,
  }
}

export function requestRest() {
  if (isInputBlocked() || whereabouts.moving || whereabouts.resting) return
  if (Math.hypot(whereabouts.x - PLAYGROUND_BENCH.x, whereabouts.z - PLAYGROUND_BENCH.z) > REST_RADIUS) return
  rest()
}
