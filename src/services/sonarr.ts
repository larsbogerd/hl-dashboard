import { formatAgo, formatBytes } from '../format'
import type { Service } from '../types'
import { get } from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/sonarr/api/v3'

type Series = {
    statistics?: { episodeFileCount: number; sizeOnDisk: number }
}

type QueueStatus = {
    totalCount: number
    errors: boolean
    warnings: boolean
}

type Page = { totalRecords: number }

type Task = { name: string; lastExecution: string }

/** Last run of a scheduled job — proves the scheduler is alive. */
export function taskRan(tasks: Task[], name: string): string {
    const task = tasks.find((t) => t.name.toLowerCase() === name.toLowerCase())
    return task ? formatAgo(task.lastExecution) : '—'
}

export async function fetchSonarr(): Promise<Service> {
    const [status, series, queue, missing, tasks] = await Promise.all([
        get<{ version: string }>(`${BASE}/system/status`),
        get<Series[]>(`${BASE}/series`),
        get<QueueStatus>(`${BASE}/queue/status`),
        get<Page>(`${BASE}/wanted/missing?pageSize=1`),
        get<Task[]>(`${BASE}/system/task`),
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
            { label: 'Series', value: String(series.length) },
            { label: 'Episodes', value: String(episodes) },
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
