import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { SPAWN_X, SPAWN_Z } from '../game/constants.ts'
import type { MutablePose } from '../game/types.ts'
import { CHAT_DURATION_MS, PARK_WS_PATH, readChat, readServerMessage, type ChatBubble, type NetPlayer } from '../../shared/protocol.ts'
import { dogTarget, type DogPose } from '../avatar/followDog.ts'
import { bindTidy } from '../input/parkActions.ts'
import { publishConnection } from './connection.ts'
import { bindChatSender, publishChatError } from './chatChannel.ts'
import { publishFeed } from './worldFeed.ts'

const SEND_INTERVAL_MS = 100
const HEARTBEAT_MS = 1000

export type RemoteTargets = Map<string, NetPlayer>

function socketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${PARK_WS_PATH}`
}

function changedEnough(local: MutablePose, dog: DogPose, sent: NetPlayer | null): boolean {
  if (!sent) return true
  const yawGap = Math.atan2(Math.sin(local.yaw - sent.yaw), Math.cos(local.yaw - sent.yaw))
  const dogYawGap = Math.atan2(Math.sin(dog.yaw - sent.dogYaw), Math.cos(dog.yaw - sent.dogYaw))
  return (
    Math.hypot(local.x - sent.x, local.z - sent.z) > 0.02 ||
    Math.abs(yawGap) > 0.02 ||
    local.moving !== sent.moving ||
    local.resting !== sent.resting ||
    local.dogPlaying !== sent.dogPlaying ||
    Math.hypot(dog.x - sent.dogX, dog.z - sent.dogZ) > 0.02 ||
    Math.abs(dogYawGap) > 0.02 ||
    dog.moving !== sent.dogMoving
  )
}

/**
 * Keeps this browser in the shared park.
 * Remote poses live in a mutable map so walking does not re-render the scene.
 */
export function useParkRoom(local: MutablePose, dog: RefObject<DogPose>, placeVersion: RefObject<number>, nickname: string) {
  const [bubbles, setBubbles] = useState<Record<string, ChatBubble>>({})
  const [selfId, setSelfId] = useState('')
  const chatSender = useRef<(text: string) => boolean>(() => false)
  const targets = useRef<RemoteTargets>(new Map())
  const [roster, setRoster] = useState<NetPlayer[]>([])
  const send = useRef<(force?: boolean) => void>(() => {})

  useEffect(() => {
    let socket: WebSocket | null = null
    let closed = false
    let retryMs = 400
    let reconnectTimer = 0
    let netId: string | null = null
    let lastSentAt = 0
    let lastSent: NetPlayer | null = null
    let holdForFull = false

    const publishPeople = (status: 'connected') => {
      publishConnection({ status, people: targets.current.size + 1 })
    }

    const showRoster = () => {
      setRoster([...targets.current.values()])
      publishPeople('connected')
    }

    const replaceRoster = (players: NetPlayer[]) => {
      targets.current.clear()
      for (const player of players) {
        if (player.id === netId) continue
        targets.current.set(player.id, { ...player })
      }
      showRoster()
    }

    const remember = (player: NetPlayer) => {
      if (player.id === netId) return
      const existing = targets.current.get(player.id)
      if (existing) {
        existing.x = player.x
        existing.z = player.z
        existing.yaw = player.yaw
        existing.moving = player.moving
        existing.resting = player.resting
        existing.dogPlaying = player.dogPlaying
        existing.dogX = player.dogX
        existing.dogZ = player.dogZ
        existing.dogYaw = player.dogYaw
        existing.dogMoving = player.dogMoving
        return
      }
      targets.current.set(player.id, { ...player })
      showRoster()
    }

    const sendState = (force = false) => {
      if (!socket || socket.readyState !== WebSocket.OPEN || !netId) return
      const pet = dog.current
      if (!pet) return
      const now = performance.now()
      const due = now - lastSentAt >= SEND_INTERVAL_MS
      const heartbeat = now - lastSentAt >= HEARTBEAT_MS
      if (!force && !due) return
      if (!force && !heartbeat && !changedEnough(local, pet, lastSent)) return
      const message: NetPlayer = {
        id: netId,
        nickname,
        x: local.x,
        z: local.z,
        yaw: local.yaw,
        moving: local.moving,
        resting: local.resting,
        dogPlaying: local.dogPlaying,
        dogX: pet.x,
        dogZ: pet.z,
        dogYaw: pet.yaw,
        dogMoving: pet.moving,
      }
      socket.send(
        JSON.stringify({
          type: 'state',
          x: message.x,
          z: message.z,
          yaw: message.yaw,
          moving: message.moving,
          resting: message.resting,
          dogPlaying: message.dogPlaying,
          dogX: message.dogX,
          dogZ: message.dogZ,
          dogYaw: message.dogYaw,
          dogMoving: message.dogMoving,
        }),
      )
      lastSentAt = now
      lastSent = message
    }

    send.current = sendState
    chatSender.current = (raw) => {
      const text = readChat(raw)
      if (!text || !socket || socket.readyState !== WebSocket.OPEN || !netId) {
        publishChatError('연결 후 1~120자의 메시지를 보내 주세요.')
        return false
      }
      publishChatError('')
      socket.send(JSON.stringify({ type: 'chat', text }))
      return true
    }
    bindChatSender(text => chatSender.current(text))
    bindTidy({
      scoop: () => {
        if (!socket || socket.readyState !== WebSocket.OPEN || !netId) return
        socket.send(JSON.stringify({ type: 'scoop' }))
      },
      bin: () => {
        if (!socket || socket.readyState !== WebSocket.OPEN || !netId) return
        socket.send(JSON.stringify({ type: 'bin' }))
      },
      draw: () => {
        if (!socket || socket.readyState !== WebSocket.OPEN || !netId) return
        socket.send(JSON.stringify({ type: 'draw' }))
      },
    })

    const connect = () => {
      if (closed) return
      publishConnection({ status: 'connecting', people: 0 })
      const ws = new WebSocket(socketUrl())
      socket = ws
      ws.onopen = () => { if (!closed) ws.send(JSON.stringify({ type: 'hello', nickname })) }

      ws.onmessage = (event) => {
        if (closed || socket !== ws) return
        if (typeof event.data !== 'string') return
        const message = readServerMessage(event.data)
        if (!message) return
        if (message.type === 'error') {
          publishChatError(message.message)
          if (message.message.includes('봉투')) publishFeed({ hint: message.message })
          return
        }
        if (message.type === 'chat') {
          if (message.id === netId || targets.current.has(message.id)) {
            setBubbles(current => ({ ...current, [message.id]: { text: message.text, expiresAt: Date.now() + CHAT_DURATION_MS } }))
          }
          return
        }
        if (message.type === 'full') {
          holdForFull = true
          publishConnection({ status: 'full', people: 0 })
          return
        }
        if (message.type === 'welcome') {
          retryMs = 400
          holdForFull = false
          netId = message.id
          setSelfId(message.id)
          publishChatError('')
          const atStart = Math.hypot(local.x - SPAWN_X, local.z - SPAWN_Z) < 0.25 && !local.moving
          if (atStart) {
            local.x = message.spawn.x
            local.z = message.spawn.z
            local.yaw = message.spawn.yaw
            local.moving = false
            placeVersion.current += 1
            const pet = dog.current
            if (pet) {
              const beside = dogTarget(local)
              pet.x = beside.x
              pet.z = beside.z
              pet.yaw = local.yaw
              pet.moving = false
            }
          }
          replaceRoster(message.players)
          publishFeed({ poops: message.poops, selfId: message.id, clean: message.clean, used: message.used, hint: '' })
          sendState(true)
          return
        }
        if (message.type === 'poops') {
          publishFeed({ poops: message.poops })
          return
        }
        if (message.type === 'bag') {
          publishFeed({ clean: message.clean, used: message.used, hint: '' })
          return
        }
        if (message.type === 'join' || message.type === 'state') {
          remember(message.player)
          return
        }
        setBubbles(current => { const next = { ...current }; delete next[message.id]; return next })
        if (targets.current.delete(message.id)) showRoster()
      }

      ws.onerror = () => {
        ws.close()
      }

      ws.onclose = () => {
        if (closed || socket !== ws) return
        if (socket === ws) socket = null
        netId = null
        setSelfId('')
        setBubbles({})
        publishFeed({ poops: [], selfId: '', clean: false, used: false, hint: '' })
        lastSent = null
        targets.current.clear()
        setRoster([])
        if (!closed) {
          publishConnection({ status: holdForFull ? 'full' : 'disconnected', people: 0 })
          const delay = holdForFull ? 5000 : retryMs
          retryMs = Math.min(retryMs * 2, 5000)
          holdForFull = false
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = 0
            connect()
          }, delay)
        }
      }
    }

    connect()

    return () => {
      closed = true
      send.current = () => {}
      chatSender.current = () => false
      bindChatSender(() => false)
      bindTidy({ scoop: () => {}, bin: () => {}, draw: () => {} })
      publishFeed({ poops: [], selfId: '', clean: false, used: false, hint: '' })
      window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [dog, local, placeVersion, nickname])

  useEffect(() => {
    const timer = window.setInterval(() => setBubbles(current => {
      const entries = Object.entries(current).filter(([, bubble]) => bubble.expiresAt > Date.now())
      return entries.length === Object.keys(current).length ? current : Object.fromEntries(entries)
    }), 100)
    return () => window.clearInterval(timer)
  }, [])
  return { roster, targets, send, bubbles, selfId }
}
