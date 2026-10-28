import { plural } from '../format'
import type { Service } from '../types'
import { get } from './client'

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
        get<{ version: string }>(`${BASE}/status`),
        get<RequestCount>(`${BASE}/request/count`),
        get<IssueCount>(`${BASE}/issue/count`),
    ])

    // Both of these wait on you, so they go to the top of the page.
    const needsLook: string[] = []
    if (counts.pending > 0) {
        needsLook.push(
            `${plural(counts.pending, 'request')} waiting for approval`,
        )
    }
    if (issues.open > 0) {
        needsLook.push(`${plural(issues.open, 'open issue')} reported`)
    }

    return {
        name: 'Seerr',
        status: 'online',
        version: status.version,
        headline: { label: 'pending', value: String(counts.pending) },
        stats: [
            { label: 'Processing', value: String(counts.processing) },
            { label: 'Completed', value: String(counts.completed) },
            {
                label: 'Issues',
                value: String(issues.open),
                tone: issues.open > 0 ? 'warn' : undefined,
            },
        ],
        issues: needsLook,
    }
}
