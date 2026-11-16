import { spawn } from 'node:child_process'

const server = spawn(process.execPath, ['server/index.ts'], {
  env: { ...process.env, PARK_WS_PORT: '18789', PARK_POOP_DELAY_MS: '2500' },
  stdio: ['ignore', 'pipe', 'pipe'],
})

try {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 5000)
    const listen = (chunk: Buffer) => {
      if (!chunk.toString().includes('poop delay override')) return
      clearTimeout(timeout)
      resolve()
    }
    server.stdout.on('data', listen)
    server.stderr.on('data', (chunk) => process.stderr.write(chunk))
    server.once('error', reject)
    server.once('exit', (code) => reject(new Error(`Server exited: ${code}`)))
  })
  process.env.PARK_WS_PORT = '18789'
  await import('./tidy.test.ts')
} finally {
  server.kill()
}
