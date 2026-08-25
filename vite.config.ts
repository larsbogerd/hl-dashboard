import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.SONARR_URL,
          changeOrigin: true,
          headers: { 'X-Api-Key': env.SONARR_API_KEY },
        },
      },
    },
  }
})
