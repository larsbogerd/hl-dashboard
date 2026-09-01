import { formatBytes } from '../format'
import type { Service } from '../types'
import { get } from './client'
import { taskRan } from './sonarr'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/radarr/api/v3'

type Movie = { hasFile: boolean; sizeOnDisk?: number }

type QueueStatus = { totalCount: number; errors: boolean }

type Page = { totalRecords: number }

export async function fetchRadarr(): Promise<Service> {
    const [status, movies, queue, missing, tasks] = await Promise.all([
        get<{ version: string }>(`${BASE}/system/status`),
        get<Movie[]>(`${BASE}/movie`),
        get<QueueStatus>(`${BASE}/queue/status`),
        get<Page>(`${BASE}/wanted/missing?pageSize=1`),
        get<{ name: string; lastExecution: string }[]>(`${BASE}/system/task`),
    ])

    const onDisk = movies.reduce((sum, m) => sum + (m.sizeOnDisk ?? 0), 0)

    return {
        name: 'Radarr',
        status: 'online',
        version: status.version,
        url: import.meta.env.VITE_RADARR_URL,
        stats: [
            { label: 'Movies', value: String(movies.length) },
            {
                label: 'Downloaded',
                value: String(movies.filter((m) => m.hasFile).length),
            },
            { label: 'On disk', value: formatBytes(onDisk) },
            {
                label: 'Queue',
                value: String(queue.totalCount),
                tone: queue.errors ? 'warn' : undefined,
            },
            { label: 'Missing', value: String(missing.totalRecords) },
            { label: 'RSS sync', value: taskRan(tasks, 'Rss Sync') },
        ],
    }
}
