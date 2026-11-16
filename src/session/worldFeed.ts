import { useSyncExternalStore } from 'react'
import type { ParkPoop } from '../../shared/protocol.ts'

export type WorldFeed = {
  poops: ParkPoop[]
  selfId: string
  holding: boolean
}

let feed: WorldFeed = { poops: [], selfId: '', holding: false }
const listeners = new Set<() => void>()

function samePoops(left: readonly ParkPoop[], right: readonly ParkPoop[]) {
  return left.length === right.length && left.every((poop, index) => {
    const other = right[index]
    return other !== undefined && poop.id === other.id && poop.x === other.x && poop.z === other.z && poop.ownerId === other.ownerId
  })
}

export function publishFeed(next: Partial<WorldFeed>) {
  const poops = next.poops ?? feed.poops
  const selfId = next.selfId ?? feed.selfId
  const holding = next.holding ?? feed.holding
  if (samePoops(poops, feed.poops) && selfId === feed.selfId && holding === feed.holding) return
  feed = { poops, selfId, holding }
  for (const listener of listeners) listener()
}

export function useFeed(): WorldFeed {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => feed,
    () => feed,
  )
}
