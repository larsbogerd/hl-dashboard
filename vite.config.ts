import react from '@vitejs/plugin-react'
import {defineConfig, loadEnv} from 'vite'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        server: {
            // One entry per wired-up service. /api/sonarr/... is stripped
            // before forwarding, so paths below match Sonarr's real API.
            proxy: {
                '/api/sonarr': {
                    target: env.VITE_SONARR_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/sonarr/, ''),
                    headers: {'X-Api-Key': env.SONARR_API_KEY},
                },
            },
        },
    }
})
