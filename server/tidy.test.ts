import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { WebSocket } from 'ws'
import { readServerMessage } from '../shared/protocol.ts'

const url = `ws://127.0.0.1:${process.env.PARK_WS_PORT ?? 18789}`
const sockets: WebSocket[] = []

function pose(over: Record<string, unknown> = {}) {
  return {
    type: 'state',
    x: 1,
    z: 1,
    yaw: 0,
    moving: false,
    resting: false,
    dogPlaying: false,
    dogX: 1.4,
    dogZ: 1.2,
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

try {
  const owner = await client('주인님')
  await until(() => owner.messages.some((message) => message?.type === 'welcome'))
  const welcome = owner.messages.find((message) => message?.type === 'welcome')
  assert.equal(welcome?.type, 'welcome')
  if (welcome?.type !== 'welcome') throw new Error('welcome missing')
  assert.equal(welcome.holding, false)
  assert.equal(welcome.poops.length, 0)

  owner.ws.send(JSON.stringify({ type: 'poop', x: 1, z: 1 }))
  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  owner.ws.send(JSON.stringify(pose()))
  await until(() => owner.messages.some((message) => message?.type === 'poops' && message.poops.length === 1))
  const spawned = owner.messages.find((message) => message?.type === 'poops' && message.poops.length === 1)
  if (spawned?.type !== 'poops') throw new Error('poop missing')
  const pile = spawned.poops[0]
  assert.ok(pile)
  assert.equal(pile.ownerId, welcome.id)
  assert.ok(Math.hypot(pile.x - 1.4, pile.z - 1.2) < 0.05)
  assert.equal(owner.messages.some((message) => message?.type === 'bag'), false)

  const guest = await client('손님임')
  await until(() => guest.messages.some((message) => message?.type === 'welcome'))
  const guestWelcome = guest.messages.find((message) => message?.type === 'welcome')
  if (guestWelcome?.type !== 'welcome') throw new Error('guest welcome missing')
  assert.equal(guestWelcome.poops.length, 1)
  assert.equal(guestWelcome.poops[0]?.id, pile.id)
  assert.notEqual(guestWelcome.id, welcome.id)

  guest.ws.send(JSON.stringify(pose({ x: pile.x, z: pile.z, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  guest.ws.send(JSON.stringify({ type: 'scoop' }))
  await delay(160)
  assert.equal(guest.messages.some((message) => message?.type === 'bag'), false)
  assert.equal(latestPoops(owner.messages)?.type === 'poops' && latestPoops(owner.messages)?.type === 'poops'
    ? (latestPoops(owner.messages) as { type: 'poops'; poops: unknown[] }).poops.length
    : -1, 1)

  owner.ws.send(JSON.stringify(pose({ x: pile.x + 6, z: pile.z, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  await delay(160)
  assert.equal(owner.messages.some((message) => message?.type === 'bag'), false)

  owner.ws.send(JSON.stringify(pose({ x: pile.x + 0.4, z: pile.z + 0.2, dogX: pile.x, dogZ: pile.z })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  await until(() => owner.messages.some((message) => message?.type === 'bag' && message.holding))
  await until(() => {
    const message = latestPoops(owner.messages)
    return message?.type === 'poops' && message.poops.length === 0
  })
  await until(() => {
    const message = latestPoops(guest.messages)
    return message?.type === 'poops' && message.poops.length === 0
  })

  owner.ws.send(JSON.stringify({ type: 'scoop' }))
  await delay(120)
  const stillHolding = [...owner.messages].reverse().find((message) => message?.type === 'bag')
  assert.equal(stillHolding?.type === 'bag' && stillHolding.holding, true)

  owner.ws.send(JSON.stringify({ type: 'bin' }))
  await delay(140)
  const stillBag = [...owner.messages].reverse().find((message) => message?.type === 'bag')
  assert.equal(stillBag?.type === 'bag' && stillBag.holding, true)

  owner.ws.send(JSON.stringify(pose({ x: -9.4, z: 17, dogX: -8.8, dogZ: 16.4 })))
  await delay(80)
  owner.ws.send(JSON.stringify({ type: 'bin' }))
  await until(() => {
    const message = [...owner.messages].reverse().find((entry) => entry?.type === 'bag')
    return message?.type === 'bag' && message.holding === false
  })

  await delay(1800)
  assert.equal(owner.messages.some((message) => message?.type === 'poops' && message.poops.some((poop) => poop.ownerId === welcome.id)), true)
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
  await until(() => owner.messages.some((message) => message?.type === 'leave'))

  const again = await client('손님임')
  await until(() => again.messages.some((message) => message?.type === 'welcome'))
  const againWelcome = again.messages.find((message) => message?.type === 'welcome')
  if (againWelcome?.type !== 'welcome') throw new Error('reconnect welcome missing')
  assert.notEqual(againWelcome.id, guestWelcome.id)
  assert.equal(againWelcome.poops.length, 0)
  assert.equal(againWelcome.holding, false)
  again.ws.send(JSON.stringify(pose({ x: 3, z: 3, dogX: 3.2, dogZ: 2.6 })))
  await until(() => again.messages.some((message) => message?.type === 'poops' && message.poops.length === 1))
  const fresh = again.messages.find((message) => message?.type === 'poops' && message.poops.length === 1)
  assert.equal(fresh?.type === 'poops' && fresh.poops[0]?.ownerId, againWelcome.id)
  console.log('tidy tests passed')
} finally {
  for (const socket of sockets) socket.close()
  await delay(50)
}
