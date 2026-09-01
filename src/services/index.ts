import type {Service} from '../types'
import {fetchBazarr} from './bazarr'
import {fetchPlex} from './plex'
import {fetchProwlarr} from './prowlarr'
import {fetchQbittorrent} from './qbittorrent'
import {fetchRadarr} from './radarr'
import {fetchSonarr} from './sonarr'

type Connector = {
    name: string
    url: string
    fetch: () => Promise<Service>
}

export const CONNECTORS: Connector[] = [
    {name: 'Sonarr', url: import.meta.env.VITE_SONARR_URL, fetch: fetchSonarr},
    {name: 'Radarr', url: import.meta.env.VITE_RADARR_URL, fetch: fetchRadarr},
    {name: 'Prowlarr', url: import.meta.env.VITE_PROWLARR_URL, fetch: fetchProwlarr},
    {name: 'Bazarr', url: import.meta.env.VITE_BAZARR_URL, fetch: fetchBazarr},
    {name: 'qBittorrent', url: import.meta.env.VITE_QBITTORRENT_URL, fetch: fetchQbittorrent},
    {name: 'Plex', url: import.meta.env.VITE_PLEX_URL, fetch: fetchPlex},
]
