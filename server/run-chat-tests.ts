import { spawn } from 'node:child_process'
const server = spawn(process.execPath, ['server/index.ts'], { env: { ...process.env, PARK_WS_PORT: '18788' }, stdio: ['ignore', 'pipe', 'pipe'] })
try {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 5000)
    server.stdout.once('data', () => { clearTimeout(timeout); resolve() })
    server.once('error', reject)
    server.once('exit', code => reject(new Error(`Server exited: ${code}`)))
  })
  process.env.PARK_WS_PORT = '18788'
  await import('./chat.test.ts')
} finally {
  server.kill()
}
