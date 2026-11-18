import { randomUUID } from 'node:crypto'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import { BAG_HINT, BAG_USE_RADIUS, BAG_BOXES, BIN_USE_RADIUS, PLAZA, POOP_DELAY_MS, POOP_PICKUP_RADIUS, SPAWN_RING, WASTE_BINS, nearAny } from '../shared/places.ts'
import { DOG_FOLLOW_DISTANCE, DOG_SIDE_OFFSET, SPAWN_YAW } from '../src/game/constants.ts'
import {
  CHAT_INTERVAL_MS,
  MAX_INVALID_MESSAGES,
  MAX_PLAYERS,
  MIN_STATE_INTERVAL_MS,
  PARK_WS_PATH,
  PARK_WS_PORT,
  PLAY_RADIUS_LIMIT,
  readClientMessage,
  type NetPlayer,
  type NetPose,
  type ParkPoop,
} from '../shared/protocol.ts'

type Visitor = {
  id: string
  slot: number
  socket: WebSocket
  pose: NetPlayer
  joined: boolean
  lastChatAt: number
  lastStateAt: number
  invalid: number
  joinedAt: number
  spawnedPoop: boolean
  poop: ParkPoop | null
  clean: boolean
  used: boolean
}

const visitors = new Map<WebSocket, Visitor>()

/** Second person stands across the path, in the first person's view. Later people spread around. */
const SLOT_ORDER = [0, 5, 1, 6, 2, 7, 3, 8, 4, 9]

function spawnForSlot(slot: number): NetPose {
  const angle = (SLOT_ORDER[slot] / MAX_PLAYERS) * Math.PI * 2
  const x = PLAZA.x + Math.sin(angle) * SPAWN_RING
  const z = PLAZA.z + Math.cos(angle) * SPAWN_RING
  const yaw = Math.atan2(Math.sin(SPAWN_YAW), Math.cos(SPAWN_YAW))
  const forwardX = Math.sin(yaw)
  const forwardZ = Math.cos(yaw)
  const rightX = Math.cos(yaw)
  const rightZ = -Math.sin(yaw)
  return {
    x,
    z,
    yaw,
    moving: false,
    dogX: x - forwardX * DOG_FOLLOW_DISTANCE + rightX * DOG_SIDE_OFFSET,
    dogZ: z - forwardZ * DOG_FOLLOW_DISTANCE + rightZ * DOG_SIDE_OFFSET,
    dogYaw: yaw,
    dogMoving: false,
    resting: false,
    dogPlaying: false,
  }
}

function readPoopDelay(): number {
  const raw = process.env.PARK_POOP_DELAY_MS
  if (raw === undefined || raw.trim() === '') return POOP_DELAY_MS
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 200 || value > POOP_DELAY_MS) return POOP_DELAY_MS
  return value
}

function clampInside(x: number, z: number) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return { x: 0, z: 0 }
  const distance = Math.hypot(x, z)
  if (distance <= PLAY_RADIUS_LIMIT) return { x, z }
  const scale = PLAY_RADIUS_LIMIT / distance
  return { x: x * scale, z: z * scale }
}

function listPoops(): ParkPoop[] {
  const poops: ParkPoop[] = []
  for (const visitor of visitors.values()) {
    if (visitor.joined && visitor.poop) poops.push(visitor.poop)
  }
  return poops
}

function freeSlot(): number | null {
  const used = new Set([...visitors.values()].map((visitor) => visitor.slot))
  for (let slot = 0; slot < MAX_PLAYERS; slot += 1) {
    if (!used.has(slot)) return slot
  }
  return null
}

function send(socket: WebSocket, message: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message))
}

function broadcast(message: unknown, except?: WebSocket) {
  const raw = JSON.stringify(message)
  for (const visitor of visitors.values()) {
    if (!visitor.joined || visitor.socket === except || visitor.socket.readyState !== visitor.socket.OPEN) continue
    visitor.socket.send(raw)
  }
}

function textOf(data: RawData): string | null {
  if (typeof data === 'string') return data
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8')
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8')
  return null
}

function removeVisitor(socket: WebSocket) {
  const visitor = visitors.get(socket)
  if (!visitor) return
  const hadPoop = visitor.poop !== null
  visitors.delete(socket)
  if (visitor.joined) {
    broadcast({ type: 'leave', id: visitor.id })
    if (hadPoop) broadcast({ type: 'poops', poops: listPoops() })
  }
  console.log(`[park] leave ${visitor.id.slice(0, 8)} (${visitors.size}/${MAX_PLAYERS})`)
}

const publicMode = process.env.PARK_PUBLIC === '1'
const host = publicMode ? '0.0.0.0' : '127.0.0.1'
const port = Number(process.env.PORT ?? process.env.PARK_WS_PORT ?? PARK_WS_PORT)
const distRoot = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('[park] PORT 또는 PARK_WS_PORT 가 올바른 포트 번호가 아니에요.')
  process.exit(1)
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

function headerValue(req: IncomingMessage, name: string): string {
  const value = req.headers[name]
  return (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim() ?? ''
}

function allowedOrigins(req: IncomingMessage): Set<string> {
  const allowed = new Set<string>()
  for (const item of (process.env.PARK_ALLOWED_ORIGINS ?? '').split(',')) {
    const origin = item.trim().replace(/\/$/, '')
    if (origin) allowed.add(origin)
  }
  for (const name of ['host', 'x-forwarded-host']) {
    const value = headerValue(req, name)
    if (!value) continue
    allowed.add(`https://${value}`)
    allowed.add(`http://${value}`)
    const withoutDefaultPort = value.replace(/:(443|80)$/, '')
    allowed.add(`https://${withoutDefaultPort}`)
    allowed.add(`http://${withoutDefaultPort}`)
  }
  return allowed
}

/** Browsers must come from this park. Local tests omit Origin and stay allowed. */
function originAllowed(origin: string | undefined, req: IncomingMessage): boolean {
  if (!origin) return !publicMode
  if (!publicMode) {
    try {
      const url = new URL(origin)
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true
    } catch {
      return false
    }
  }
  return allowedOrigins(req).has(origin.replace(/\/$/, ''))
}

function fileInDist(pathname: string): string | null {
  let decoded = pathname
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^[/\\]+/, '')
  const file = resolve(distRoot, relative)
  if (file !== distRoot && !file.startsWith(distRoot + sep)) return null
  return file
}

function servePage(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    res.end()
    return
  }
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end('ok')
    return
  }
  const file = fileInDist(pathname)
  const asset = pathname !== '/' && (pathname.split('/').pop() ?? '').includes('.')
  const target = file && existsSync(file) && statSync(file).isFile() ? file : asset ? null : fileInDist('/index.html')
  if (!target || !existsSync(target)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }
  const hashed = pathname.startsWith('/assets/')
  res.writeHead(200, {
    'Content-Type': types[extname(target)] ?? 'application/octet-stream',
    'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(target).pipe(res)
}

if (publicMode && !existsSync(join(distRoot, 'index.html'))) {
  console.error('[park] dist/index.html 이 없어요. 먼저 npm run build 를 실행해 주세요.')
  process.exit(1)
}

const page = publicMode ? createServer(servePage) : undefined
const wss = new WebSocketServer({
  ...(page ? { server: page, path: PARK_WS_PATH } : { port, host }),
  maxPayload: 8192,
  verifyClient: (info: { origin: string; secure: boolean; req: IncomingMessage }) => originAllowed(info.origin, info.req),
})

if (page) {
  page.listen(port, host, () => {
    console.log(`LOU Park가 http://${host}:${port} 에서 기다리고 있어요. WebSocket 경로는 ${PARK_WS_PATH} 입니다.`)
  })
}

// Reclaim slots after a dead connection, including a browser that lost its network.
const alive = new Set<WebSocket>()
const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (!alive.delete(socket)) { socket.terminate(); continue }
    socket.ping()
  }
}, 15000)
const poopDelayMs = readPoopDelay()
if (poopDelayMs !== POOP_DELAY_MS) console.log(`[park] poop delay override ${poopDelayMs}ms`)
const poopClock = setInterval(() => {
  let changed = false
  const now = Date.now()
  for (const visitor of visitors.values()) {
    if (!visitor.joined || visitor.spawnedPoop || now - visitor.joinedAt < poopDelayMs) continue
    visitor.spawnedPoop = true
    const placed = clampInside(visitor.pose.dogX, visitor.pose.dogZ)
    visitor.poop = { id: visitor.id, ownerId: visitor.id, x: placed.x, z: placed.z }
    changed = true
  }
  if (changed) broadcast({ type: 'poops', poops: listPoops() })
}, 200)
wss.on('close', () => {
  clearInterval(heartbeat)
  clearInterval(poopClock)
})

wss.on('connection', (socket) => {
  alive.add(socket)
  socket.on('pong', () => alive.add(socket))
  socket.on('close', () => alive.delete(socket))
  const slot = freeSlot()
  if (slot === null) {
    send(socket, { type: 'full' })
    socket.close(1008, 'full')
    return
  }

  const id = randomUUID()
  const spawn = spawnForSlot(slot)
  const visitor: Visitor = {
    id,
    slot,
    socket,
    pose: { id, nickname: '', ...spawn },
    joined: false,
    lastChatAt: 0,
    lastStateAt: 0,
    invalid: 0,
    joinedAt: 0,
    spawnedPoop: false,
    poop: null,
    clean: false,
    used: false,
  }
  visitors.set(socket, visitor)
  const helloTimer = setTimeout(() => { if (!visitor.joined) socket.close(1008, 'hello timeout') }, 5000)
  socket.on('close', () => clearTimeout(helloTimer))
  console.log(`[park] join ${id.slice(0, 8)} (${visitors.size}/${MAX_PLAYERS})`)

  socket.on('message', (data, isBinary) => {
    if (isBinary) {
      visitor.invalid += 1
    } else {
      const raw = textOf(data)
      const message = raw === null ? null : readClientMessage(raw)
      if (!message) {
        visitor.invalid += 1
        send(socket, { type: 'error', message: '닉네임 또는 메시지 형식을 확인해 주세요.' })
      } else {
        const now = Date.now()
        if (message.type === 'hello' && !visitor.joined) {
          visitor.pose.nickname = message.nickname
          visitor.joined = true
          visitor.joinedAt = Date.now()
          clearTimeout(helloTimer)
          const alreadyHere = [...visitors.values()].filter(v => v.joined && v !== visitor).map(v => v.pose)
          send(socket, { type: 'welcome', id, spawn, players: alreadyHere, poops: listPoops(), clean: false, used: false })
          broadcast({ type: 'join', player: visitor.pose }, socket)
          return
        }
        if (!visitor.joined || message.type === 'hello') {
          send(socket, { type: 'error', message: '올바른 닉네임으로 다시 입장해 주세요.' })
          socket.close(1008, 'hello required')
          return
        }
        if (message.type === 'chat') {
          if (now - visitor.lastChatAt < CHAT_INTERVAL_MS) {
            send(socket, { type: 'error', message: '메시지는 1초에 한 번 보낼 수 있어요.' })
            return
          }
          visitor.lastChatAt = now
          broadcast({ type: 'chat', id: visitor.id, text: message.text })
          return
        }
        if (message.type === 'draw') {
          if (visitor.clean || visitor.used) return
          if (!nearAny(visitor.pose.x, visitor.pose.z, BAG_BOXES, BAG_USE_RADIUS)) return
          visitor.clean = true
          send(socket, { type: 'bag', clean: true, used: false })
          return
        }
        if (message.type === 'scoop') {
          const pile = visitor.poop
          if (!pile || visitor.used) return
          if (!visitor.clean) {
            send(socket, { type: 'error', message: BAG_HINT })
            return
          }
          if (Math.hypot(visitor.pose.x - pile.x, visitor.pose.z - pile.z) > POOP_PICKUP_RADIUS) return
          visitor.poop = null
          visitor.clean = false
          visitor.used = true
          broadcast({ type: 'poops', poops: listPoops() })
          send(socket, { type: 'bag', clean: false, used: true })
          return
        }
        if (message.type === 'bin') {
          if (!visitor.used) return
          if (!nearAny(visitor.pose.x, visitor.pose.z, WASTE_BINS, BIN_USE_RADIUS)) return
          visitor.used = false
          send(socket, { type: 'bag', clean: false, used: false })
          return
        }
        if (message.type !== 'state') return
        if (now - visitor.lastStateAt < MIN_STATE_INTERVAL_MS) return
        visitor.lastStateAt = now
        visitor.pose = {
          id: visitor.id,
          nickname: visitor.pose.nickname,
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
        }
        broadcast({ type: 'state', player: visitor.pose }, socket)
        return
      }
    }
    if (visitor.invalid >= MAX_INVALID_MESSAGES) {
      console.log(`[park] closed ${visitor.id.slice(0, 8)} after invalid messages`)
      socket.close(1008, 'invalid')
    }
  })

  socket.on('close', () => {
    removeVisitor(socket)
  })

  socket.on('error', () => {
    socket.close()
  })
})

wss.on('listening', () => {
  if (!publicMode) console.log(`LOU Park 실시간 서버가 ws://127.0.0.1:${port} 에서 기다리고 있어요.`)
})

wss.on('error', (error) => {
  console.error('[park] 서버를 시작하지 못했습니다.', error)
  process.exit(1)
})
