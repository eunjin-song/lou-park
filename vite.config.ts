import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { PARK_WS_PORT, PARK_WS_PATH } from './shared/protocol.ts'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      [PARK_WS_PATH]: {
        target: `ws://127.0.0.1:${process.env.PARK_WS_PORT ?? PARK_WS_PORT}`,
        ws: true,
      },
    },
  },
})
