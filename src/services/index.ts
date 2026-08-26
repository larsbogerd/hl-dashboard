import type {Service} from '../types'

export {fetchSonarr} from './sonarr'

/** Not wired up yet — links only, stats stubbed. Blank env = no link. */
const PLACEHOLDERS: {name: string; url: string}[] = [
    {name: 'Radarr', url: import.meta.env.VITE_RADARR_URL},
    {name: 'Prowlarr', url: import.meta.env.VITE_PROWLARR_URL},
    {name: 'Bazarr', url: import.meta.env.VITE_BAZARR_URL},
    {name: 'qBittorrent', url: import.meta.env.VITE_QBITTORRENT_URL},
    {name: 'Plex', url: import.meta.env.VITE_PLEX_URL},
]

export const PLACEHOLDER_SERVICES: Service[] = PLACEHOLDERS.map(
    ({name, url}) => ({
        name,
        status: 'offline',
        url: url || undefined,
        stats: [
            {label: 'Items', value: '-'},
            {label: 'Queue', value: '-'},
            {label: 'On disk', value: '-'},
            {label: 'Health', value: '-'},
        ],
    }),
)
