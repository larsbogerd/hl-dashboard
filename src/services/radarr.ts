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

    const issues: string[] = []
    if (queue.errors) {
        issues.push('Download queue has errors')
    }

    // Same bar as Sonarr: how much of what you want is on disk.
    const downloaded = movies.filter((m) => m.hasFile).length
    const wanted = downloaded + missing.totalRecords
    const percent = wanted > 0 ? (downloaded / wanted) * 100 : 100

    return {
        name: 'Radarr',
        status: 'online',
        version: status.version,
        headline: { label: 'movies', value: movies.length.toLocaleString() },
        meter: {
            percent,
            label: `${Math.floor(percent)}% on disk, ${missing.totalRecords} missing`,
        },
        stats: [
            { label: 'On disk', value: formatBytes(onDisk) },
            {
                label: 'Queue',
                value: String(queue.totalCount),
                tone: queue.errors ? 'warn' : undefined,
            },
            { label: 'RSS sync', value: taskRan(tasks, 'Rss Sync') },
        ],
        issues,
        activity:
            queue.totalCount > 0 ? `${queue.totalCount} in queue` : undefined,
    }
}
