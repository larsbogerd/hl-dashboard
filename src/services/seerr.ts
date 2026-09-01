import type {Service} from '../types'
import {get} from './client'

/** Proxied in vite.config.ts; the prefix is stripped before forwarding. */
const BASE = '/api/seerr/api/v1'

/** Current-state buckets, not running totals. */
type RequestCount = {
    pending: number
    processing: number
    completed: number
}

type IssueCount = {
    open: number
}

export async function fetchSeerr(): Promise<Service> {
    const [status, counts, issues] = await Promise.all([
        get<{version: string}>(`${BASE}/status`),
        get<RequestCount>(`${BASE}/request/count`),
        get<IssueCount>(`${BASE}/issue/count`),
    ])

    return {
        name: 'Seerr',
        status: 'online',
        version: status.version,
        url: import.meta.env.VITE_SEERR_URL,
        stats: [
            {
                label: 'Pending',
                value: String(counts.pending),
                tone: counts.pending > 0 ? 'warn' : undefined,
            },
            {
                label: 'Issues',
                value: String(issues.open),
                tone: issues.open > 0 ? 'warn' : undefined,
            },
            {label: 'Processing', value: String(counts.processing)},
            {label: 'Completed', value: String(counts.completed)},
        ],
    }
}
