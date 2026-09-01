import {formatUptime} from '../format'
import type {Service} from '../types'
import {get} from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/prowlarr/api/v1'

type SystemStatus = {
    version: string
    startTime: string
}

type Indexer = {
    id: number
    name: string
    enable: boolean
}

type HealthIssue = {
    source: string
    type: string
    message: string
}

export async function fetchProwlarr(): Promise<Service> {
    const [status, indexers, health] = await Promise.all([
        get<SystemStatus>(`${BASE}/system/status`),
        get<Indexer[]>(`${BASE}/indexer`),
        get<HealthIssue[]>(`${BASE}/health`),
    ])

    const enabled = indexers.filter((i) => i.enable).length

    return {
        name: 'Prowlarr',
        status: 'online',
        version: status.version,
        url: import.meta.env.VITE_PROWLARR_URL,
        stats: [
            {label: 'Indexers', value: String(indexers.length)},
            {label: 'Enabled', value: String(enabled)},
            {
                label: 'Health',
                value: health.length === 0 ? 'OK' : `${health.length} warn`,
            },
            {label: 'Uptime', value: formatUptime(status.startTime)},
        ],
    }
}
