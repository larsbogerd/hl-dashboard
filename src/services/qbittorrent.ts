import { formatBytes } from '../format'
import type { Service } from '../types'
import { get, getText } from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/qbittorrent/api/v2'

type Torrent = {
    state: string
    /** Bytes actually on disk, unlike `size` which is the full torrent. */
    completed: number
}

type MainData = {
    server_state: {
        dl_info_speed: number
        up_info_speed: number
    }
    /** Keyed by torrent hash. */
    torrents: Record<string, Torrent>
}

// qBittorrent states are suffixed DL/UP: stalledUP, metaDL, queuedDL...
const isDownloading = (s: string) => s === 'downloading' || s.endsWith('DL')
const isSeeding = (s: string) => s === 'uploading' || s.endsWith('UP')

/**
 * Download speed from the last 60 fetches, oldest first. One fetch every 2 s,
 * so about 2 minutes. Lives here, outside React, and is lost on a reload.
 */
const speeds: number[] = []

export async function fetchQbittorrent(): Promise<Service> {
    const [version, main] = await Promise.all([
        getText(`${BASE}/app/version`),
        get<MainData>(`${BASE}/sync/maindata`),
    ])

    const torrents = Object.values(main.torrents)
    const onDisk = torrents.reduce((sum, t) => sum + t.completed, 0)
    const down = main.server_state.dl_info_speed

    speeds.push(down)
    if (speeds.length > 60) {
        speeds.shift()
    }

    return {
        name: 'qBittorrent',
        status: 'online',
        version: version.replace(/^v/, ''),
        headline: { label: 'down', value: `${formatBytes(down)}/s` },
        // A copy: TanStack compares old and new data, and the same array
        // changed in place would look like "nothing new".
        history: { points: speeds.slice(), label: 'Last 2 minutes' },
        stats: [
            {
                label: 'Up',
                value: `${formatBytes(main.server_state.up_info_speed)}/s`,
            },
            { label: 'Torrents', value: String(torrents.length) },
            {
                label: 'Leeching',
                value: String(
                    torrents.filter((t) => isDownloading(t.state)).length,
                ),
            },
            {
                label: 'Seeding',
                value: String(
                    torrents.filter((t) => isSeeding(t.state)).length,
                ),
            },
            { label: 'On disk', value: formatBytes(onDisk) },
        ],
        issues: [],
        activity: down > 0 ? 'Downloading' : undefined,
    }
}
