import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { WebSocket } from 'ws'
import { BAG_BOXES, BAG_HINT, WASTE_BINS } from '../shared/places.ts'
import { readServerMessage } from '../shared/protocol.ts'

const url = `ws://127.0.0.1:${process.env.PARK_WS_PORT ?? 18789}`
const sockets: WebSocket[] = []
const box = BAG_BOXES[0]
const bin = WASTE_BINS[0]
if (!box || !bin) throw new Error('facilities missing')

function pose(over: Record<string, unknown> = {}) {
  return {
    type: 'state',
    x: box.x,
    z: box.z + 1.4,
    yaw: 0,
    moving: false,
    resting: false,
    dogPlaying: false,
    dogX: box.x + 0.3,
    dogZ: box.z + 1.7,
    dogYaw: 0,
    dogMoving: false,
    ...over,
  }
}

async function client(name: string) {
  const ws = new WebSocket(url)
  sockets.push(ws)
  const messages: Array<ReturnType<typeof readServerMessage>> = []
  ws.on('message', (raw) => {
    const message = readServerMessage(raw.toString())
    if (message) messages.push(message)
  })
  await new Promise<void>((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
  })
  ws.send(JSON.stringify({ type: 'hello', nickname: name }))
  return { ws, messages }
}

async function until(test: () => boolean, ticks = 250) {
  for (let i = 0; i < ticks; i += 1) {
    if (test()) return
    await delay(20)
  }
  throw new Error('Timed out waiting for server')
}

function latestPoops(messages: Array<ReturnType<typeof readServerMessage>>) {
  return [...messages].reverse().find((message) => message?.type === 'poops')
}

function latestBag(messages: Array<ReturnType<typeof readServerMessage>>) {
  return [...messages].reverse().find((message) => message?.type === 'bag')
}

try {
  const owner = await client('주인님')
  await until(() => owner.messages.some((message) => message?.type === 'welcome'))
  const welcome = owner.messages.find((message) => message?.type === 'welcome')
  if (welcome?.type !== 'welcome') throw new Error('welcome missing')
  assert.equal(welcome.clean, false)
  assert.equal(welcome.used, false)
  assert.equal(welcome.poops.length, 0)

  owner.ws.send(JSON.stringify(pose()))
  await until(() => owner.messages.some((message) => message?.type === 'poops' && message.poops.length === 1))
  const spawned = owner.messages.find((message) => message?.type === 'poops' && message.poops.length === 1)
  if (spawned?.type !== 'poops') throw new Error('poop missing')
  const pile = spawned.poops[0]
  assert.ok(pile)
  assert.equal(pile.ownerId, welcome.id)

  owner.ws.send(JSON.stringify(pose({ x: pile.x + 0.3, z: pile.z + 0.2, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  await until(() => owner.messages.some((message) => message?.type === 'error' && message.message === BAG_HINT))
  assert.equal(latestPoops(owner.messages)?.type === 'poops' && latestPoops(owner.messages)?.type === 'poops'
    ? (latestPoops(owner.messages) as { poops: unknown[] }).poops.length
    : -1, 1)

  owner.ws.send(JSON.stringify(pose({ x: 0, z: 30, dogX: 0.4, dogZ: 30.4 })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'draw' }))
  await delay(120)
  assert.equal(owner.messages.some((message) => message?.type === 'bag'), false)

  owner.ws.send(JSON.stringify(pose({ x: box.x + 0.4, z: box.z + 1.1, dogX: box.x, dogZ: box.z + 1.5 })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'draw' }))
  await until(() => latestBag(owner.messages)?.type === 'bag' && latestBag(owner.messages)?.type === 'bag' && (latestBag(owner.messages) as { clean: boolean }).clean)
  owner.ws.send(JSON.stringify({ type: 'draw' }))
  await delay(120)
  assert.equal(owner.messages.filter((message) => message?.type === 'bag').length, 1)

  const guest = await client('손님임')
  await until(() => guest.messages.some((message) => message?.type === 'welcome'))
  const guestWelcome = guest.messages.find((message) => message?.type === 'welcome')
  if (guestWelcome?.type !== 'welcome') throw new Error('guest welcome missing')
  assert.equal(guestWelcome.poops.length, 1)
  assert.equal(guestWelcome.clean, false)

  guest.ws.send(JSON.stringify(pose({ x: box.x, z: box.z + 1, dogX: box.x, dogZ: box.z + 1.4 })))
  await delay(80)
  guest.ws.send(JSON.stringify({ type: 'draw' }))
  await until(() => latestBag(guest.messages)?.type === 'bag')
  guest.ws.send(JSON.stringify(pose({ x: pile.x, z: pile.z, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  guest.ws.send(JSON.stringify({ type: 'scoop' }))
  await delay(160)
  assert.equal(latestPoops(owner.messages)?.type === 'poops' && (latestPoops(owner.messages) as { poops: unknown[] }).poops.length, 1)
  const guestBag = latestBag(guest.messages)
  assert.equal(guestBag?.type === 'bag' && (guestBag as { clean: boolean; used: boolean }).clean, true)
  assert.equal(guestBag?.type === 'bag' && (guestBag as { used: boolean }).used, false)

  owner.ws.send(JSON.stringify(pose({ x: pile.x + 6, z: pile.z, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  await delay(160)
  assert.equal(latestBag(owner.messages)?.type === 'bag' && (latestBag(owner.messages) as { clean: boolean; used: boolean }).clean, true)

  owner.ws.send(JSON.stringify(pose({ x: pile.x + 0.35, z: pile.z + 0.15, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  await until(() => {
    const bag = latestBag(owner.messages)
    return bag?.type === 'bag' && bag.clean === false && bag.used === true
  })
  await until(() => {
    const message = latestPoops(owner.messages)
    return message?.type === 'poops' && message.poops.length === 0
  })

  owner.ws.send(JSON.stringify({ type: 'bin' }))
  await delay(120)
  assert.equal((latestBag(owner.messages) as { used?: boolean })?.used, true)

  owner.ws.send(JSON.stringify(pose({ x: bin.x + 0.4, z: bin.z + 1.1, dogX: bin.x, dogZ: bin.z + 1.6 })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'bin' }))
  await until(() => {
    const bag = latestBag(owner.messages)
    return bag?.type === 'bag' && bag.used === false && bag.clean === false
  })

  await delay(1800)
  const afterWait = latestPoops(owner.messages)
  assert.equal(afterWait?.type === 'poops' && afterWait.poops.some((poop) => poop.ownerId === welcome.id), false)

  await until(() => {
    const message = latestPoops(owner.messages)
    return message?.type === 'poops' && message.poops.some((poop) => poop.ownerId === guestWelcome.id)
  })
  guest.ws.close()
  await until(() => {
    const message = latestPoops(owner.messages)
    return message?.type === 'poops' && message.poops.length === 0
  })

  const again = await client('손님임')
  await until(() => again.messages.some((message) => message?.type === 'welcome'))
  const againWelcome = again.messages.find((message) => message?.type === 'welcome')
  if (againWelcome?.type !== 'welcome') throw new Error('reconnect welcome missing')
  assert.notEqual(againWelcome.id, guestWelcome.id)
  assert.equal(againWelcome.poops.length, 0)
  assert.equal(againWelcome.clean, false)
  assert.equal(againWelcome.used, false)
  console.log('tidy tests passed')
} finally {
  for (const socket of sockets) socket.close()
  await delay(50)
}
