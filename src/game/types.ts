/**
 * Plain snapshot of one visitor.
 * Local input writes it today. A future room can broadcast the same shape
 * and mount one AvatarView per remote snapshot.
 */
export type AvatarSnapshot = {
  id: string
  x: number
  z: number
  yaw: number
  moving: boolean
}

export type MutablePose = AvatarSnapshot

/** Device-agnostic movement intent. Keyboard and a future net client both produce this. */
export type MoveInput = {
  /** 1 moves with the camera's horizontal view. -1 moves against it. */
  forward: number
  /** 1 moves to the camera's horizontal right. -1 moves left. */
  strafe: number
}
