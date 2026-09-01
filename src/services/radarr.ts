import {formatBytes, formatUptime} from '../format'
import type {Service} from '../types'
import {get} from './client'

const BASE = '/api/radarr/api/v3'

type SystemStatus = {
    version: string
    startTime: string
}

type Movie = {
    id: number
    title: string
    hasFile: boolean
    sizeOnDisk?: number
}

type QueuePage = {
    totalRecords: number
}

type HealthIssue = {
    source: string
    type: string
    message: string
}

export async function fetchRadarr(): Promise<Service> {
    const [status, movies, queue, health] = await Promise.all([
        get<SystemStatus>(`${BASE}/system/status`),
        get<Movie[]>(`${BASE}/movie`),
        get<QueuePage>(`${BASE}/queue`),
        get<HealthIssue[]>(`${BASE}/health`),
    ])

    const downloaded = movies.filter((m) => m.hasFile).length
    const onDisk = movies.reduce((sum, m) => sum + (m.sizeOnDisk ?? 0), 0)

    return {
        name: 'Radarr',
        status: 'online',
        version: status.version,
        url: import.meta.env.VITE_RADARR_URL,
        stats: [
            {label: 'Movies', value: String(movies.length)},
            {label: 'Downloaded', value: String(downloaded)},
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
