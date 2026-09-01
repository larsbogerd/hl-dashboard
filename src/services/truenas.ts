import { get, post } from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/truenas/api/v2.0'

export type Pool = {
    name: string
    status: string
    healthy: boolean
    size: number
    allocated: number
    free: number
}

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
    /** Downsampled last hour, for sparklines. */
    cpuHistory: number[]
    pools: Pool[]
}

type RawSystemInfo = {
    version: string
    uptime_seconds: number
    model: string
    physmem: number
    cores: number
    physical_cores: number
}

/** Each graph is a legend plus rows of [timestamp, ...values]. */
type Graph = {
    name: string
    legend: string[]
    data: number[][]
}

/** Latest sample for one column of a graph, by legend name. */
function latest(graphs: Graph[], name: string, column: string): number {
    const graph = graphs.find((g) => g.name === name)
    if (!graph) return 0
    const row = graph.data.at(-1)
    const index = graph.legend.indexOf(column)
    return row && index > 0 ? row[index] : 0
}

/** Every value for one column, downsampled to `buckets` averaged points. */
function series(
    graphs: Graph[],
    name: string,
    column: string,
    buckets = 60,
): number[] {
    const graph = graphs.find((g) => g.name === name)
    if (!graph) return []
    const index = graph.legend.indexOf(column)
    if (index < 1) return []

    const size = Math.ceil(graph.data.length / buckets)
    const out: number[] = []
    for (let i = 0; i < graph.data.length; i += size) {
        const slice = graph.data.slice(i, i + size)
        out.push(
            slice.reduce((sum, r) => sum + (r[index] ?? 0), 0) / slice.length,
        )
    }
    return out
}

/** TrueNAS shows the hottest core, not the package sensor. */
function hottestCore(graphs: Graph[]): number {
    const graph = graphs.find((g) => g.name === 'cputemp')
    const row = graph?.data.at(-1)
    if (!graph || !row) return 0

    const cores = graph.legend
        .map((name, i) => (/^cpu\d+$/.test(name) ? i : -1))
        .filter((i) => i > 0)
    return cores.length > 0 ? Math.max(...cores.map((i) => row[i] ?? 0)) : 0
}

export async function fetchTrueNas(): Promise<SystemInfo> {
    const [info, pools, graphs] = await Promise.all([
        get<RawSystemInfo>(`${BASE}/system/info`),
        get<Pool[]>(`${BASE}/pool`),
        post<Graph[]>(`${BASE}/reporting/netdata_get_data`, {
            graphs: [
                { name: 'cpu' },
                { name: 'cputemp' },
                { name: 'memory' },
                { name: 'arcsize' },
                { name: 'interface', identifier: 'enp4s0' },
            ],
            query: { unit: 'HOUR', page: 1, aggregate: true },
        }),
    ])

    // netdata reports interface throughput in kilobits/sec.
    const toBytes = (kbits: number) => kbits * 125

    return {
        version: info.version,
        uptimeSeconds: info.uptime_seconds,
        model: info.model,
        cores: info.physical_cores,
        threads: info.cores,
        cpuPercent: latest(graphs, 'cpu', 'cpu'),
        cpuTemp: hottestCore(graphs),
        memTotal: info.physmem,
        memFree: latest(graphs, 'memory', 'available'),
        memCache: latest(graphs, 'arcsize', 'size'),
        netIn: toBytes(latest(graphs, 'interface', 'received')),
        netOut: toBytes(latest(graphs, 'interface', 'sent')),
        cpuHistory: series(graphs, 'cpu', 'cpu'),
        pools: pools.map((p) => ({
            name: p.name,
            status: p.status,
            healthy: p.healthy,
            size: p.size,
            allocated: p.allocated,
            free: p.free,
        })),
    }
}
