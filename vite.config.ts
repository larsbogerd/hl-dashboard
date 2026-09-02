import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const backend = `http://localhost:${env.SERVER_PORT ?? 3001}`

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': { target: backend, changeOrigin: true },
            },
        },
    }
})
