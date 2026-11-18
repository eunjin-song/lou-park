import { inWater } from './places.ts'

/** Messages shared by the park server and the browser. No rendering, no sockets. */

export const PARK_WS_PORT = 8787
export const PARK_WS_PATH = '/park'
export const MAX_PLAYERS = 10
export const PLAY_RADIUS_LIMIT = 55.45
export const MIN_STATE_INTERVAL_MS = 50
export const MAX_CLIENT_MESSAGE_CHARS = 2048
export const MAX_SERVER_MESSAGE_CHARS = 12000
export const MAX_INVALID_MESSAGES = 8

export const CHAT_DURATION_MS = 5000
export const CHAT_INTERVAL_MS = 1000
export const CHAT_MAX_LENGTH = 120

// Normalize once on both sides; reject invisible/control/bidi characters.
const forbidden = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u
export function readNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.normalize('NFC').trim()
  const length = Array.from(name).length
  return length >= 2 && length <= 12 && /^[\p{L}\p{M}\p{N} _-]+$/u.test(name) && !forbidden.test(name) ? name : null
}
export function readChat(value: unknown): string | null {
  if (typeof value !== 'string' || forbidden.test(value)) return null
  const text = value.normalize('NFC').trim()
  return text.length > 0 && Array.from(text).length <= CHAT_MAX_LENGTH ? text : null
}
export type ChatBubble = { text: string; expiresAt: number }

export type NetPose = {
  x: number
  z: number
  yaw: number
  moving: boolean
  resting: boolean
  dogX: number
  dogZ: number
  dogYaw: number
  dogMoving: boolean
  dogPlaying: boolean
}

export type ParkPoop = {
  id: string
  ownerId: string
  x: number
  z: number
}

export type NetPlayer = NetPose & {
  nickname: string
  id: string
}

export type ClientStateMessage = NetPose & {
  type: 'state'
}

export type BagCarry = { clean: boolean; used: boolean }

export type ClientMessage =
  | ClientStateMessage
  | { type: 'hello'; nickname: string }
  | { type: 'chat'; text: string }
  | { type: 'scoop' }
  | { type: 'bin' }
  | { type: 'draw' }

export type ServerMessage =
  | { type: 'chat'; id: string; text: string }
  | { type: 'error'; message: string }
  | { type: 'welcome'; id: string; spawn: NetPose; players: NetPlayer[]; poops: ParkPoop[] } & BagCarry
  | { type: 'join'; player: NetPlayer }
  | { type: 'state'; player: NetPlayer }
  | { type: 'leave'; id: string }
  | { type: 'full' }
  | { type: 'poops'; poops: ParkPoop[] }
  | ({ type: 'bag' } & BagCarry)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readFinite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readId(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[\w-]{8,64}$/.test(value)) return null
  return value
}

function readYaw(value: unknown): number | null {
  const yaw = readFinite(value)
  if (yaw === null || Math.abs(yaw) > 100) return null
  return Math.atan2(Math.sin(yaw), Math.cos(yaw))
}

function insidePark(x: number, z: number): boolean {
  return Math.hypot(x, z) <= PLAY_RADIUS_LIMIT && !inWater(x, z)
}

export function readPose(value: Record<string, unknown>): NetPose | null {
  const x = readFinite(value.x)
  const z = readFinite(value.z)
  const yaw = readYaw(value.yaw)
  const dogX = readFinite(value.dogX)
  const dogZ = readFinite(value.dogZ)
  const dogYaw = readYaw(value.dogYaw)
  if (
    x === null ||
    z === null ||
    yaw === null ||
    dogX === null ||
    dogZ === null ||
    dogYaw === null ||
    typeof value.moving !== 'boolean' ||
    typeof value.resting !== 'boolean' ||
    typeof value.dogMoving !== 'boolean' ||
    typeof value.dogPlaying !== 'boolean' ||
    !insidePark(x, z) ||
    !insidePark(dogX, dogZ)
  ) {
    return null
  }
  return {
    x,
    z,
    yaw,
    moving: value.moving,
    resting: value.resting,
    dogX,
    dogZ,
    dogYaw,
    dogMoving: value.dogMoving,
    dogPlaying: value.dogPlaying,
  }
}

function readPoop(value: unknown): ParkPoop | null {
  if (!isRecord(value)) return null
  const id = readId(value.id)
  const ownerId = readId(value.ownerId)
  const x = readFinite(value.x)
  const z = readFinite(value.z)
  if (!id || !ownerId || x === null || z === null || !insidePark(x, z)) return null
  return { id, ownerId, x, z }
}

function readPoops(value: unknown): ParkPoop[] | null {
  if (!Array.isArray(value) || value.length > MAX_PLAYERS) return null
  const poops: ParkPoop[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    const poop = readPoop(entry)
    if (!poop || seen.has(poop.id)) return null
    seen.add(poop.id)
    poops.push(poop)
  }
  return poops
}

export function readClientMessage(raw: string): ClientMessage | null {
  if (raw.length === 0 || raw.length > MAX_CLIENT_MESSAGE_CHARS) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data)) return null
  if (data.type === 'hello') {
    const nickname = readNickname(data.nickname)
    return nickname ? { type: 'hello', nickname } : null
  }
  if (data.type === 'chat') {
    const text = readChat(data.text)
    return text ? { type: 'chat', text } : null
  }
  if (data.type === 'scoop') return { type: 'scoop' }
  if (data.type === 'bin') return { type: 'bin' }
  if (data.type === 'draw') return { type: 'draw' }
  if (data.type !== 'state') return null
  const pose = readPose(data)
  if (!pose) return null
  return { type: 'state', ...pose }
}

function readBag(value: Record<string, unknown>): BagCarry | null {
  if (typeof value.clean !== 'boolean' || typeof value.used !== 'boolean') return null
  if (value.clean && value.used) return null
  return { clean: value.clean, used: value.used }
}

function readPlayer(value: unknown): NetPlayer | null {
  if (!isRecord(value)) return null
  const id = readId(value.id)
  const pose = readPose(value)
  const nickname = readNickname(value.nickname)
  if (!id || !pose || !nickname) return null
  return { id, nickname, ...pose }
}

export function readServerMessage(raw: string): ServerMessage | null {
  if (raw.length === 0 || raw.length > MAX_SERVER_MESSAGE_CHARS) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data)) return null

  if (data.type === 'chat') {
    const id = readId(data.id)
    const text = readChat(data.text)
    return id && text ? { type: 'chat', id, text } : null
  }
  if (data.type === 'error') {
    return typeof data.message === 'string' && data.message.length <= 120 ? { type: 'error', message: data.message } : null
  }
  if (data.type === 'full') return { type: 'full' }

  if (data.type === 'leave') {
    const id = readId(data.id)
    return id ? { type: 'leave', id } : null
  }

  if (data.type === 'join' || data.type === 'state') {
    const player = readPlayer(data.player)
    return player ? { type: data.type, player } : null
  }

  if (data.type === 'poops') {
    const poops = readPoops(data.poops)
    return poops ? { type: 'poops', poops } : null
  }

  if (data.type === 'bag') {
    const bag = readBag(data)
    return bag ? { type: 'bag', ...bag } : null
  }

  if (data.type === 'welcome') {
    const id = readId(data.id)
    if (!id || !isRecord(data.spawn) || !Array.isArray(data.players)) return null
    const spawn = readPose(data.spawn)
    const poops = data.poops === undefined ? [] : readPoops(data.poops)
    const bag = readBag(data)
    if (!spawn || !poops || !bag || data.players.length > MAX_PLAYERS) return null
    const players: NetPlayer[] = []
    for (const entry of data.players) {
      const player = readPlayer(entry)
      if (!player || player.id === id) return null
      players.push(player)
    }
    return { type: 'welcome', id, spawn, players, poops, clean: bag.clean, used: bag.used }
  }

  return null
}
