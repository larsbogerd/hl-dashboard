import { plural } from '../format'
import type { Service } from '../types'
import { get } from './client'

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
    MediaContainer: { size: number; totalSize?: number }
}

async function count(filter: string): Promise<number> {
    const res = await get<Container>(
        `${BASE}/library/all?${filter}&${COUNT_ONLY}`,
    )
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
        server.myPlexSigninState === 'ok' &&
        server.myPlexMappingState === 'mapped'

    const streams = sessions.MediaContainer.size

    const issues: string[] = []
    if (!remoteOk) {
        issues.push('Remote access is unavailable')
    }

    return {
        name: 'Plex',
        status: 'online',
        // Trim the build hash: 1.43.3.10896-cb3ebc72d
        version: server.version.split('-')[0],
        headline: { label: 'streaming', value: String(streams) },
        stats: [
            {
                label: 'Transcodes',
                value: String(server.transcoderActiveVideoSessions),
            },
            { label: 'Movies', value: movies.toLocaleString() },
            { label: 'Episodes', value: episodes.toLocaleString() },
            { label: 'Added this week', value: String(added) },
        ],
        issues,
        activity: streams > 0 ? plural(streams, 'stream') : undefined,
    }
}
