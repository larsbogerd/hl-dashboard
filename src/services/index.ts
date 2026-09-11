import type { Service } from '../types'
import { fetchBazarr } from './bazarr'
import { fetchPlex } from './plex'
import { fetchProwlarr } from './prowlarr'
import { fetchSeerr } from './seerr'
import { fetchQbittorrent } from './qbittorrent'
import { fetchRadarr } from './radarr'
import { fetchSonarr } from './sonarr'

type Connector = {
    name: string
    id: string
    fetch: () => Promise<Service>
    interval?: number
}

export const CONNECTORS: Connector[] = [
    {
        name: 'Sonarr',
        id: 'sonarr',
        fetch: fetchSonarr,
    },
    {
        name: 'Radarr',
        id: 'radarr',
        fetch: fetchRadarr,
        interval: 600_000,
    },
    {
        name: 'Prowlarr',
        id: 'prowlarr',
        fetch: fetchProwlarr,
    },
    {
        name: 'Bazarr',
        id: 'bazarr',
        fetch: fetchBazarr,
    },
    {
        name: 'qBittorrent',
        id: 'qbittorrent',
        fetch: fetchQbittorrent,
        interval: 2_000,
    },
    { name: 'Plex', id: 'plex', fetch: fetchPlex },
    { name: 'Seerr', id: 'seerr', fetch: fetchSeerr },
]
