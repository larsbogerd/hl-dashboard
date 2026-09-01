import type {Service} from '../types'
import {fetchRadarr} from './radarr'
import {fetchSonarr} from './sonarr'

type Connector = {
    name: string
    url: string
    fetch: () => Promise<Service>
}

/** Add a connector here and its card appears on the grid. */
export const CONNECTORS: Connector[] = [
    {name: 'Sonarr', url: import.meta.env.VITE_SONARR_URL, fetch: fetchSonarr},
    {name: 'Radarr', url: import.meta.env.VITE_RADARR_URL, fetch: fetchRadarr},
]
