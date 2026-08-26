import {formatBytes, formatUptime} from '../format'
import type {Service} from '../types'
import {get} from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/sonarr/api/v3'

type SystemStatus = {
    appName: string
    version: string
    isDocker: boolean
    osName: string
    startTime: string
}

type Series = {
    id: number
    title: string
    statistics?: {
        episodeFileCount: number
        episodeCount: number
        sizeOnDisk: number
    }
}

type QueuePage = {
    totalRecords: number
}

type HealthIssue = {
    source: string
    type: string
    message: string
}


export async function fetchSonarr(): Promise<Service> {
    const [status, series, queue, health] = await Promise.all([
        get<SystemStatus>(`${BASE}/system/status`),
        get<Series[]>(`${BASE}/series`),
        get<QueuePage>(`${BASE}/queue`),
        get<HealthIssue[]>(`${BASE}/health`),
    ])

    const episodes = series.reduce(
        (sum, s) => sum + (s.statistics?.episodeFileCount ?? 0),
        0,
    )
    const onDisk = series.reduce(
        (sum, s) => sum + (s.statistics?.sizeOnDisk ?? 0),
        0,
    )

    return {
        name: 'Sonarr',
        status: 'online',
        version: status.version,
        url: import.meta.env.VITE_SONARR_URL,
        stats: [
            {label: 'Series', value: String(series.length)},
            {label: 'Episodes', value: String(episodes)},
            {label: 'On disk', value: formatBytes(onDisk)},
            {label: 'Queue', value: String(queue.totalRecords)},
            {
                label: 'Health',
                value: health.length === 0 ? 'OK' : `${health.length} warn`,
            },
            {label: 'Uptime', value: formatUptime(status.startTime)},
        ],
    }
}
