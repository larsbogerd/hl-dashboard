import {formatBytes} from '../format'
import type {Service} from '../types'
import {get, getText} from './client'

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

export async function fetchQbittorrent(): Promise<Service> {
    const [version, main] = await Promise.all([
        getText(`${BASE}/app/version`),
        get<MainData>(`${BASE}/sync/maindata`),
    ])

    const torrents = Object.values(main.torrents)
    const onDisk = torrents.reduce((sum, t) => sum + t.completed, 0)

    return {
        name: 'qBittorrent',
        status: 'online',
        version: version.replace(/^v/, ''),
        url: import.meta.env.VITE_QBITTORRENT_URL,
        stats: [
            {label: 'Active torrents', value: String(torrents.length)},
            {label: 'Size on disk', value: formatBytes(onDisk)},
            {
                label: 'Leeching',
                value: String(torrents.filter((t) => isDownloading(t.state)).length),
            },
            {
                label: 'Seeding',
                value: String(torrents.filter((t) => isSeeding(t.state)).length),
            },
            {
                label: 'Down',
                value: `${formatBytes(main.server_state.dl_info_speed)}/s`,
            },
            {
                label: 'Up',
                value: `${formatBytes(main.server_state.up_info_speed)}/s`,
            },
        ],
    }
}
