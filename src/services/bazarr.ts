import { plural } from '../format'
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

    const good = providers.data.filter((p) => p.status === 'Good').length

    // These only matter when they fail, so they're issues, not stats.
    const issues: string[] = []
    if (badges.sonarr_signalr !== 'LIVE') {
        issues.push(`Link to Sonarr is ${badges.sonarr_signalr.toLowerCase()}`)
    }
    if (badges.radarr_signalr !== 'LIVE') {
        issues.push(`Link to Radarr is ${badges.radarr_signalr.toLowerCase()}`)
    }
    if (badges.status > 0) {
        issues.push(plural(badges.status, 'health warning'))
    }

    return {
        name: 'Bazarr',
        status: 'online',
        version: status.data.bazarr_version,
        headline: { label: 'subtitles this week', value: String(subsWeek) },
        stats: [
            { label: 'Wanted episodes', value: String(badges.episodes) },
            { label: 'Wanted movies', value: String(badges.movies) },
            {
                label: 'Providers',
                value: `${good} / ${providers.data.length}`,
                tone: good < providers.data.length ? 'warn' : undefined,
            },
        ],
        issues,
    }
}
