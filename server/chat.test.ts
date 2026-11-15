import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { WebSocket } from 'ws'
import { readNickname, readChat, readClientMessage, readServerMessage } from '../shared/protocol.ts'

// Run against a separate server: PARK_WS_PORT=18787 node server/index.ts
const url = `ws://127.0.0.1:${process.env.PARK_WS_PORT ?? 18787}`
const sockets: WebSocket[] = []
async function client(name: string) {
  const ws = new WebSocket(url)
  sockets.push(ws)
  const messages: any[] = []
  ws.on('message', raw => messages.push(JSON.parse(raw.toString())))
  await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject) })
  ws.send(JSON.stringify({ type: 'hello', nickname: name }))
  return { ws, messages }
}
async function until(test: () => boolean) {
  for (let i = 0; i < 150; i++) { if (test()) return; await delay(20) }
  throw new Error('Timed out waiting for server')
}
try {
  assert.equal(readNickname('  은진  '), '은진')
  for (const value of ['', 'a', 'a'.repeat(13), '<script>', 'a\u200bb', 42]) assert.equal(readNickname(value), null)
  assert.equal(readChat('  안녕하세요 <b>hi</b>  '), '안녕하세요 <b>hi</b>')
  for (const value of ['', '   ', 'x'.repeat(121), 'a\nb', 'a\u202eb', {}, null]) assert.equal(readChat(value), null)
  assert.equal(readClientMessage('{'), null)
  const a = await client('  산책가  ')
  await until(() => a.messages.some(m => m.type === 'welcome'))
  const aid = a.messages.find(m => m.type === 'welcome').id
  const b = await client('강아지친구')
  await until(() => b.messages.some(m => m.type === 'welcome') && a.messages.some(m => m.type === 'join'))
  const welcome = b.messages.find(m => m.type === 'welcome')
  assert.equal(welcome.players[0].nickname, '산책가')
  assert.ok(readServerMessage(JSON.stringify(welcome)))
  const text = '<img src=x onerror=alert(1)> 안녕'
  a.ws.send(JSON.stringify({ type: 'chat', id: 'spoofed-id', text }))
  await until(() => a.messages.some(m => m.type === 'chat') && b.messages.some(m => m.type === 'chat'))
  assert.equal(b.messages.find(m => m.type === 'chat').id, aid)
  assert.equal(a.messages.find(m => m.type === 'chat').text, text)
  a.ws.send(JSON.stringify({ type: 'chat', text: '빠른 중복' }))
  await until(() => a.messages.some(m => m.type === 'error'))
  await delay(100)
  assert.equal(b.messages.filter(m => m.type === 'chat').length, 1)
  b.ws.send(JSON.stringify({ type: 'chat', text: '반가워요' }))
  await until(() => a.messages.filter(m => m.type === 'chat').length === 2)
  await delay(1000)
  a.ws.send(JSON.stringify({ type: 'chat', text: '새 말풍선' }))
  await until(() => b.messages.filter(m => m.type === 'chat').length === 3)
  a.ws.send(JSON.stringify({ type: 'chat', text: 'x'.repeat(121) }))
  a.ws.send(JSON.stringify({ type: 'state', ...welcome.players[0], x: 999 }))
  await delay(100)
  assert.equal(b.messages.filter(m => m.type === 'chat').length, 3)
  assert.equal(b.messages.filter(m => m.type === 'state').length, 0)
  a.ws.send(JSON.stringify({ type: 'state', ...welcome.players[0], x: 1, z: 1 }))
  await until(() => b.messages.some(m => m.type === 'state'))
  assert.equal(b.messages.find(m => m.type === 'state').player.nickname, '산책가')
  for (let i = 2; i < 10; i++) {
    const other = await client(`산책${i}`)
    await until(() => other.messages.some(m => m.type === 'welcome'))
  }
  const full = await client('열한번째')
  await until(() => full.messages.some(m => m.type === 'full'))
  a.ws.close()
  await until(() => b.messages.some(m => m.type === 'leave' && m.id === aid))
  const reconnect = await client('산책가')
  await until(() => reconnect.messages.some(m => m.type === 'welcome'))
  const again = reconnect.messages.find(m => m.type === 'welcome')
  assert.notEqual(again.id, aid)
  assert.equal(again.players.length, 9)
  assert.ok(!again.players.some((p: any) => p.id === aid))
  // Invalid formats cannot be hidden by alternating with valid position updates.
  for (let i = 0; i < 8; i++) reconnect.ws.send('{')
  await until(() => reconnect.ws.readyState === WebSocket.CLOSED)
  console.log('PASS: validation, trim, roster, self echo, bidirectional chat, sender identity, rate limit, replacement, pose/nickname preservation, invalid pose, 10-player cap, leave, reconnect, malformed-message closure')
} finally {
  for (const ws of sockets) ws.close()
}
