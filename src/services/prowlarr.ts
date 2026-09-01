import type {Service} from '../types'
import {get} from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/prowlarr/api/v1'

type Indexer = {enable: boolean}

/** One entry per currently-failing indexer. */
type IndexerStatus = {indexerId: number; disabledTill: string | null}

type IndexerStats = {
    indexers: {
        numberOfQueries: number
        numberOfGrabs: number
        numberOfFailedQueries: number
        numberOfFailedGrabs: number
        numberOfRssQueries: number
        numberOfFailedRssQueries: number
    }[]
}

function sum(stats: IndexerStats, pick: (i: IndexerStats['indexers'][0]) => number) {
    return stats.indexers.reduce((total, i) => total + pick(i), 0)
}

export async function fetchProwlarr(): Promise<Service> {
    // indexerstats returns all-time totals unless given a window.
    const end = new Date()
    const start = new Date(end.getTime() - 86_400_000)
    const window = `startDate=${start.toISOString()}&endDate=${end.toISOString()}`

    const [status, indexers, failing, stats, health] = await Promise.all([
        get<{version: string}>(`${BASE}/system/status`),
        get<Indexer[]>(`${BASE}/indexer`),
        get<IndexerStatus[]>(`${BASE}/indexerstatus`),
        get<IndexerStats>(`${BASE}/indexerstats?${window}`),
        get<{message: string}[]>(`${BASE}/health`),
    ])

    const enabled = indexers.filter((i) => i.enable).length
    const failed =
        sum(stats, (i) => i.numberOfFailedQueries) +
        sum(stats, (i) => i.numberOfFailedRssQueries) +
        sum(stats, (i) => i.numberOfFailedGrabs)

    return {
        name: 'Prowlarr',
        status: 'online',
        version: status.version,
        url: import.meta.env.VITE_PROWLARR_URL,
        stats: [
            {label: 'Indexers', value: `${enabled} / ${indexers.length}`},
            {
                label: 'Failing',
                value: String(failing.length),
                tone: failing.length > 0 ? 'warn' : undefined,
            },
            {
                label: 'Queries 24h',
                value: String(
                    sum(stats, (i) => i.numberOfQueries + i.numberOfRssQueries),
                ),
            },
            {label: 'Grabs 24h', value: String(sum(stats, (i) => i.numberOfGrabs))},
            {
                label: 'Failed 24h',
                value: String(failed),
                tone: failed > 0 ? 'warn' : undefined,
            },
            {
                label: 'Health',
                value: health.length === 0 ? 'OK' : `${health.length} warn`,
                tone: health.length > 0 ? 'warn' : undefined,
            },
        ],
    }
}
