/** Shared tuneables. Gameplay and visuals read the same boundary so they cannot drift. */
export const PLAY_RADIUS = 55.2
export const FENCE_RADIUS = 57.6
export const PATH_INNER = 10.8
export const PATH_OUTER = 14.6

export const MOVE_SPEED = 5
export const DOG_FOLLOW_DISTANCE = 1.35
export const DOG_SIDE_OFFSET = 0.48
export const DOG_SPEED = 5.6

export const SPAWN_X = 0
export const SPAWN_Z = 46.6
export const SPAWN_YAW = Math.PI

export const CAMERA_OFFSET = { x: 0, y: 11, z: 13 }
export const CAMERA_FOV = 40
export const CAMERA_LOOK_Y = 1.15
export const CAMERA_MIN_Y = 0.6
export const CAMERA_MIN_DISTANCE = 6
export const CAMERA_MAX_DISTANCE = 46
export const CAMERA_MAX_PITCH = 1.15

export const palette = {
  skyTop: '#b7e3ff',
  skyHorizon: '#fff1dc',
  fog: '#f7f1e6',
  meadow: '#c6e4ae',
  grass: '#8ed18a',
  grassLight: '#b7e7a6',
  grassDark: '#69b974',
  path: '#f6d7b4',
  pathEdge: '#e4bc96',
  sand: '#f6e2c6',
  water: '#8fd0ea',
  waterLight: '#d7f5fc',
  trunk: '#c48b62',
  leaf: '#7dcf8e',
  leafDeep: '#5eae78',
  leafLight: '#b5e49a',
  blossom: '#f7b7c9',
  blossomDeep: '#f09ab4',
  benchWood: '#e8b08a',
  benchCushion: '#f7c3d0',
  fencePost: '#f4e4cc',
  fenceRail: '#e7d3b4',
  skin: '#f6c9aa',
  hair: '#6d4c3d',
  shirt: '#f48fb0',
  pants: '#7aa4e8',
  shoe: '#fff7f1',
  bow: '#f472a4',
  dog: '#f3d2a6',
  dogLight: '#ffe8cc',
  dogEar: '#e3b184',
  nose: '#5c463f',
  eye: '#3e3734',
  blush: '#f5a3b6',
  collar: '#f27aa5',
  reed: '#8dcc88',
  lily: '#6fb56f',
  lilyFlower: '#f7d0e0',
  stone: '#e5dbd2',
  cloud: '#fffaf6',
  sun: '#fff4c4',
  duck: '#f6d15a',
  duckBeak: '#f0a04a',
} as const
