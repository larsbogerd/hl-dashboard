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
    stats: Stat[]
}
