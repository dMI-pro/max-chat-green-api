import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import { defineConfig } from 'vite'

/**
 * Dev-proxy: /green-api/<host>/waInstance... → https://<host>/waInstance...
 * Нужен, если браузер упирается в CORS при локальной разработке.
 */
const greenApiProxy: ProxyOptions = {
  target: 'https://3100.api.green-api.com',
  changeOrigin: true,
  secure: true,
  rewrite: (path) => path.replace(/^\/green-api\/[^/]+/, ''),
  // http-proxy-middleware supports router; Vite typings may omit it
  ...({
    router: (req: { url?: string }) => {
      const match = req.url?.match(/^\/green-api\/([^/?]+)/)
      return match ? `https://${match[1]}` : 'https://3100.api.green-api.com'
    },
  } as ProxyOptions),
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/green-api': greenApiProxy,
    },
  },
})
