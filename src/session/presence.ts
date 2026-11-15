import type { MutablePose } from '../game/types.ts'

/**
 * Who is in the park right now.
 * `local` is driven by this browser. `others` stays empty until a room exists.
 * Joining or leaving should update React state so a new AvatarView mounts.
 * Walking only mutates the snapshot fields, so remote ticks do not need a re-render.
 */
export type ParkPresence = {
  local: MutablePose
  others: MutablePose[]
}

export function createPresence(local: MutablePose): ParkPresence {
  return { local, others: [] }
}
