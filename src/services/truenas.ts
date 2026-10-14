import { get } from './client'

/** What GET /api/system returns. Keep in sync with server/truenas.ts. */
export type SystemInfo = {
    version: string
    uptimeSeconds: number
    model: string
    cores: number
    threads: number
    cpuPercent: number
    cpuTemp: number
    memTotal: number
    memFree: number
    memCache: number
    netIn: number
    netOut: number
    /** The last hour of CPU usage, averaged down to ~60 points. */
    cpuHistory: number[]
    pools: Pool[]
}

export type Pool = {
    name: string
    status: string
    healthy: boolean
    size: number
    allocated: number
    free: number
}

export function fetchTrueNas(): Promise<SystemInfo> {
    return get<SystemInfo>('/api/system')
}
