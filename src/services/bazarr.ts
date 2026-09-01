import {formatUptime} from '../format'
import type {Service} from '../types'
import {get} from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/bazarr/api'

type SystemStatus = {
    data: {
        bazarr_version: string
        /** Unix seconds, unlike the *arr apps' ISO strings. */
        start_time: number
    }
}

type Badges = {
    episodes: number
    movies: number
    status: number
}

type Providers = {
    data: {name: string; status: string}[]
}

/** Daily subtitle download counts, roughly the last month. */
type HistoryStats = {
    series: {date: string; count: number}[]
    movies: {date: string; count: number}[]
}

function lastWeek(days: {count: number}[]): number {
    return days.slice(-7).reduce((sum, d) => sum + d.count, 0)
}

export async function fetchBazarr(): Promise<Service> {
    const [status, badges, providers, history] = await Promise.all([
        get<SystemStatus>(`${BASE}/system/status`),
        get<Badges>(`${BASE}/badges`),
        get<Providers>(`${BASE}/providers`),
        get<HistoryStats>(`${BASE}/history/stats`),
    ])

    const startedAt = new Date(status.data.start_time * 1000).toISOString()
    const good = providers.data.filter((p) => p.status === 'Good').length
    const subsWeek = lastWeek(history.series) + lastWeek(history.movies)

    return {
        name: 'Bazarr',
        status: 'online',
        version: status.data.bazarr_version,
        url: import.meta.env.VITE_BAZARR_URL,
        stats: [
            {label: 'Wanted eps', value: String(badges.episodes)},
            {label: 'Wanted movies', value: String(badges.movies)},
            {label: 'Subs fetched (7d)', value: String(subsWeek)},
            {label: 'Providers', value: `${good}/${providers.data.length}`},
            {label: 'Health', value: badges.status === 0 ? 'OK' : `${badges.status} warn`},
            {label: 'Uptime', value: formatUptime(startedAt)},
        ],
    }
}
