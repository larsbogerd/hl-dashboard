export type ServiceStatus = 'loading' | 'online' | 'offline'

export type Stat = {
    label: string
    value: string
    /** Colours the value when something needs attention. */
    tone?: 'warn' | 'bad'
}

export type Service = {
    name: string
    status: ServiceStatus
    version?: string
    url?: string
    /** Logo image URL. Filled in by App, like `url`. */
    icon?: string
    /** The one number that says the most about this service. Shown big. */
    headline?: Stat
    /** A bar under the headline, e.g. how much of the library is on disk. */
    meter?: { percent: number; label: string }
    /** A small line chart under the headline. Points are oldest first. */
    history?: { points: number[]; label: string }
    /** Supporting numbers. Any amount, including none. */
    stats: Stat[]
    /** Things that need a look, in plain words. Empty when all is well. */
    issues: string[]
    /** What it's doing right now, e.g. "1 stream". Unset when idle. */
    activity?: string
}
