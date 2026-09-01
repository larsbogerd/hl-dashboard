import react from '@vitejs/plugin-react'
import {defineConfig, loadEnv} from 'vite'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        server: {
            // One entry per wired-up service. /api/<name>/... is stripped
            // before forwarding, so paths match each app's real API.
            proxy: {
                '/api/sonarr': {
                    target: env.VITE_SONARR_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/sonarr/, ''),
                    headers: {'X-Api-Key': env.SONARR_API_KEY},
                },
                '/api/radarr': {
                    target: env.VITE_RADARR_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/radarr/, ''),
                    headers: {'X-Api-Key': env.RADARR_API_KEY},
                },
                '/api/prowlarr': {
                    target: env.VITE_PROWLARR_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/prowlarr/, ''),
                    headers: {'X-Api-Key': env.PROWLARR_API_KEY},
                },
            },
        },
    }
})
