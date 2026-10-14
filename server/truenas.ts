import { env } from './config.ts'

/*
 * One long-lived WebSocket to TrueNAS. Once we subscribe, TrueNAS pushes a full
 * snapshot of CPU, memory and network every 2 seconds. We keep the latest one in
 * memory, and GET /api/system serves it to the browser.
 *
 * The protocol is JSON-RPC 2.0 over wss://<nas>/api/current:
 *   - A request we send carries an `id`. TrueNAS's reply carries the same `id`.
 *   - A pushed event has no `id`. It has `method: "collection_update"` instead.
 */

// wss:// only. TrueNAS revokes an API key that is ever sent over plain ws://.
const SOCKET_URL = env('TRUENAS_URL').replace(/^https?/, 'wss') + '/api/current'
const API_KEY = env('TRUENAS_API_KEY')

const RECONNECT_DELAY_MS = 5_000
const POOL_REFRESH_MS = 60_000

// TrueNAS ticks every ~2 seconds, but can send several events per tick.
// We keep at most one CPU sample per tick, so 1800 samples is one hour.
const MIN_SAMPLE_GAP_MS = 1_500
const MAX_CPU_SAMPLES = 1_800
const SPARKLINE_POINTS = 60

// One fixed id per kind of request. Each kind is only in flight once at a time,
// so the id on a reply tells us which request it answers.
const LOGIN_ID = 1
const SYSTEM_INFO_ID = 2
const POOLS_ID = 3
const SUBSCRIBE_ID = 4

/** What GET /api/system returns. Keep in sync with src/services/truenas.ts. */
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

/** The fields we use from `system.info`. */
type RawSystemInfo = {
    version: string
    model: string
    physmem: number
    cores: number
    physical_cores: number
    boottime: { $date: number }
}

/** The fields we use from one `reporting.realtime` event. */
type Snapshot = {
    cpu: Record<string, { usage: number; temp: number | null }>
    memory: {
        arc_size: number
        physical_memory_total: number
        physical_memory_available: number
    }
    interfaces: Record<
        string,
        {
            link_state: string
            received_bytes_rate: number
            sent_bytes_rate: number
        }
    >
}

/** Anything TrueNAS sends us: either a reply (has `id`) or an event. */
type Message = {
    id?: number
    result?: unknown
    error?: unknown
    method?: string
    params?: { fields: Snapshot }
}

let socket: WebSocket | null = null
let loggedIn = false
// Set when TrueNAS rejects the key. Retrying with the same key won't help.
let gaveUp = false

let systemInfo: RawSystemInfo | null = null
let pools: Pool[] = []
let latest: Snapshot | null = null
const cpuSamples: number[] = []
let lastSampleAt = 0

function send(id: number, method: string, params: unknown[] = []): void {
    if (socket === null || socket.readyState !== WebSocket.OPEN) {
        return
    }
    socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }))
}

function connect(): void {
    console.log(`TrueNAS: connecting to ${SOCKET_URL}`)
    socket = new WebSocket(SOCKET_URL)

    socket.addEventListener('open', () => {
        send(LOGIN_ID, 'auth.login_with_api_key', [API_KEY])
    })

    socket.addEventListener('message', (event) => {
        handleMessage(String(event.data))
    })

    socket.addEventListener('error', () => {
        // Node's WebSocket error event carries no details: a refused connection
        // and a rejected certificate look exactly the same. So check the one
        // setting that's easy to forget, and say so if it's missing.
        if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
            console.error(
                'TrueNAS: connection failed. TrueNAS uses a self-signed ' +
                    'certificate, so set NODE_TLS_REJECT_UNAUTHORIZED=0 in ' +
                    '.env (see .env.example).',
            )
            return
        }
        console.error('TrueNAS: connection failed. Is the NAS reachable?')
    })

    // Fires after every disconnect, including a failed first attempt.
    // The NAS rebooting or the network dropping both end up here.
    socket.addEventListener('close', () => {
        socket = null
        loggedIn = false
        // Stop serving numbers we can no longer vouch for.
        latest = null

        if (gaveUp) {
            return
        }
        console.log(
            `TrueNAS: disconnected, retrying in ${RECONNECT_DELAY_MS / 1000}s`,
        )
        setTimeout(connect, RECONNECT_DELAY_MS)
    })
}

function handleMessage(raw: string): void {
    const message = JSON.parse(raw) as Message

    if (message.error !== undefined) {
        console.error('TrueNAS: request failed', message.error)
        return
    }

    if (message.id === LOGIN_ID) {
        if (message.result !== true) {
            console.error('TrueNAS: login rejected. Check TRUENAS_API_KEY.')
            gaveUp = true
            if (socket !== null) {
                socket.close()
            }
            return
        }
        console.log('TrueNAS: logged in')
        loggedIn = true
        send(SYSTEM_INFO_ID, 'system.info')
        send(POOLS_ID, 'pool.query')
        send(SUBSCRIBE_ID, 'core.subscribe', ['reporting.realtime'])
        return
    }

    if (message.id === SYSTEM_INFO_ID) {
        systemInfo = message.result as RawSystemInfo
        return
    }

    if (message.id === POOLS_ID) {
        savePools(message.result as Pool[])
        return
    }

    if (message.method === 'collection_update' && message.params) {
        saveSnapshot(message.params.fields)
    }
}

function saveSnapshot(snapshot: Snapshot): void {
    // Always keep the newest snapshot, however often they arrive.
    latest = snapshot

    // But only record history once per tick, or the extra events would
    // squeeze an hour of history into a few minutes.
    const now = Date.now()
    if (now - lastSampleAt < MIN_SAMPLE_GAP_MS) {
        return
    }
    lastSampleAt = now

    cpuSamples.push(snapshot.cpu.cpu.usage)
    if (cpuSamples.length > MAX_CPU_SAMPLES) {
        cpuSamples.shift()
    }
}

function savePools(result: Pool[]): void {
    // pool.query sends a lot more per pool (disk layout, scrub state...).
    // Keep only what the panel shows, so /api/system stays small.
    const kept: Pool[] = []
    for (const pool of result) {
        kept.push({
            name: pool.name,
            status: pool.status,
            healthy: pool.healthy,
            size: pool.size,
            allocated: pool.allocated,
            free: pool.free,
        })
    }
    pools = kept
}

/** TrueNAS's own UI shows the hottest core, so we do too. */
function hottestCoreTemp(cpu: Snapshot['cpu']): number {
    let hottest = 0
    for (const [name, core] of Object.entries(cpu)) {
        // "cpu" is a package sensor that reads far above any single core.
        if (name === 'cpu') {
            continue
        }
        // Some cores (10–15 on this NAS) report no temperature at all.
        if (core.temp === null) {
            continue
        }
        if (core.temp > hottest) {
            hottest = core.temp
        }
    }
    return hottest
}

/** The first network interface that has a link, or null if none do. */
function activeInterface(interfaces: Snapshot['interfaces']) {
    for (const nic of Object.values(interfaces)) {
        if (nic.link_state === 'LINK_STATE_UP') {
            return nic
        }
    }
    return null
}

/** Average groups of samples together, so a long history fits in `points` points. */
function downsample(samples: number[], points: number): number[] {
    const result: number[] = []
    const groupSize = Math.max(1, Math.ceil(samples.length / points))

    for (let start = 0; start < samples.length; start += groupSize) {
        let sum = 0
        let count = 0
        for (let i = start; i < start + groupSize && i < samples.length; i++) {
            sum += samples[i]
            count++
        }
        result.push(sum / count)
    }
    return result
}

/** Everything the panel needs, or null until the first snapshot has arrived. */
export function getSystemInfo(): SystemInfo | null {
    if (systemInfo === null || latest === null) {
        return null
    }

    const nic = activeInterface(latest.interfaces)
    let netIn = 0
    let netOut = 0
    if (nic !== null) {
        netIn = nic.received_bytes_rate
        netOut = nic.sent_bytes_rate
    }

    return {
        version: systemInfo.version,
        uptimeSeconds: (Date.now() - systemInfo.boottime.$date) / 1000,
        model: systemInfo.model,
        cores: systemInfo.physical_cores,
        threads: systemInfo.cores,
        cpuPercent: latest.cpu.cpu.usage,
        cpuTemp: hottestCoreTemp(latest.cpu),
        memTotal: latest.memory.physical_memory_total,
        memFree: latest.memory.physical_memory_available,
        memCache: latest.memory.arc_size,
        netIn,
        netOut,
        cpuHistory: downsample(cpuSamples, SPARKLINE_POINTS),
        pools,
    }
}

export function startTrueNas(): void {
    connect()

    // Pool sizes aren't in the realtime events, and they change slowly,
    // so ask for them again once a minute.
    setInterval(() => {
        if (loggedIn) {
            send(POOLS_ID, 'pool.query')
        }
    }, POOL_REFRESH_MS)
}
