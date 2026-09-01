import type {Service} from '../types'
import {get} from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/plex'

/**
 * Both Start and Size are required to get a count without the metadata dump:
 * Size alone is ignored and returns every item (2.5 MB for movies).
 */
const COUNT_ONLY = 'X-Plex-Container-Start=0&X-Plex-Container-Size=0'

type Root = {
    MediaContainer: {
        version: string
        transcoderActiveVideoSessions: number
        myPlexSigninState: string
        myPlexMappingState: string
    }
}

type Container = {
    MediaContainer: {size: number; totalSize?: number}
}

async function count(filter: string): Promise<number> {
    const res = await get<Container>(`${BASE}/library/all?${filter}&${COUNT_ONLY}`)
    return res.MediaContainer.totalSize ?? 0
}

export async function fetchPlex(): Promise<Service> {
    const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86_400
    // `>>=` is Plex's filter syntax for "greater than"; `>=` is a 400.
    const since = `addedAt%3E%3E=${weekAgo}`

    const [root, sessions, movies, episodes, added] = await Promise.all([
        get<Root>(`${BASE}/`),
        get<Container>(`${BASE}/status/sessions`),
        count('type=1'),
        count('type=4'),
        count(`type=4&${since}`),
    ])

    const server = root.MediaContainer
    const remoteOk =
        server.myPlexSigninState === 'ok' && server.myPlexMappingState === 'mapped'

    return {
        name: 'Plex',
        status: 'online',
        // Trim the build hash: 1.43.3.10896-cb3ebc72d
        version: server.version.split('-')[0],
        url: import.meta.env.VITE_PLEX_URL,
        stats: [
            {label: 'Streaming', value: String(sessions.MediaContainer.size)},
            {
                label: 'Transcodes',
                value: String(server.transcoderActiveVideoSessions),
            },
            {label: 'Movies', value: String(movies)},
            {label: 'Episodes', value: String(episodes)},
            {label: 'Added (7d)', value: String(added)},
            {
                label: 'Remote',
                value: remoteOk ? 'OK' : 'Unavailable',
                tone: remoteOk ? undefined : 'bad',
            },
        ],
    }
}
