/** One upstream service the dashboard proxies to. */
export type Upstream = {
    url: string
    /** Attached to every forwarded request. Never leaves this process. */
    headers: Record<string, string>
}

function env(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`Missing ${name} — see .env.example`)
    return value
}

const qbittorrent = env('VITE_QBITTORRENT_URL')

export const UPSTREAMS: Record<string, Upstream> = {
    sonarr: {
        url: env('VITE_SONARR_URL'),
        headers: { 'X-Api-Key': env('SONARR_API_KEY') },
    },
    radarr: {
        url: env('VITE_RADARR_URL'),
        headers: { 'X-Api-Key': env('RADARR_API_KEY') },
    },
    prowlarr: {
        url: env('VITE_PROWLARR_URL'),
        headers: { 'X-Api-Key': env('PROWLARR_API_KEY') },
    },
    bazarr: {
        url: env('VITE_BAZARR_URL'),
        headers: { 'X-API-KEY': env('BAZARR_API_KEY') },
    },
    seerr: {
        url: env('VITE_SEERR_URL'),
        headers: { 'X-Api-Key': env('SEERR_API_KEY') },
    },
    truenas: {
        url: env('VITE_TRUENAS_URL'),
        headers: { Authorization: `Bearer ${env('TRUENAS_API_KEY')}` },
    },
    // No key — auth is bypassed for the LAN subnet. Origin/Referer must
    // match or qBittorrent's CSRF check answers 401.
    qbittorrent: {
        url: qbittorrent,
        headers: { Origin: qbittorrent, Referer: qbittorrent },
    },
    // No key either. Without the Accept header Plex answers in XML.
    plex: {
        url: env('VITE_PLEX_URL'),
        headers: { Accept: 'application/json' },
    },
}
