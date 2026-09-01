import type { Service } from '../types'
import { get } from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/bazarr/api'

type Badges = {
    episodes: number
    movies: number
    /** Count of *problem* providers, not the total. */
    providers: number
    status: number
    sonarr_signalr: string
    radarr_signalr: string
}

type Providers = { data: { name: string; status: string }[] }

type HistoryStats = {
    series: { count: number }[]
    movies: { count: number }[]
}

export async function fetchBazarr(): Promise<Service> {
    const [status, badges, providers, history] = await Promise.all([
        get<{ data: { bazarr_version: string } }>(`${BASE}/system/status`),
        get<Badges>(`${BASE}/badges`),
        get<Providers>(`${BASE}/providers`),
        get<HistoryStats>(`${BASE}/history/stats?timeFrame=week`),
    ])

    const total = (days: { count: number }[]) =>
        days.reduce((sum, d) => sum + d.count, 0)
    const subsWeek = total(history.series) + total(history.movies)

    const links = `${badges.sonarr_signalr} / ${badges.radarr_signalr}`
    const good = providers.data.filter((p) => p.status === 'Good').length

    return {
        name: 'Bazarr',
        status: 'online',
        version: status.data.bazarr_version,
        url: import.meta.env.VITE_BAZARR_URL,
        stats: [
            { label: 'Wanted eps', value: String(badges.episodes) },
            { label: 'Wanted movies', value: String(badges.movies) },
            { label: 'Subs (7d)', value: String(subsWeek) },
            {
                label: 'Providers',
                value: `${good}/${providers.data.length}`,
            },
            {
                label: 'Arr links',
                value: links,
                tone: links === 'LIVE / LIVE' ? undefined : 'bad',
            },
            {
                label: 'Health',
                value: badges.status === 0 ? 'OK' : `${badges.status} warn`,
                tone: badges.status > 0 ? 'warn' : undefined,
            },
        ],
    }
}
