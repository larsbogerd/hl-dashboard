export type ServiceStatus = 'loading' | 'online' | 'offline'

export type Stat = {
    label: string
    value: string
}

export type Service = {
    name: string
    status: ServiceStatus
    version?: string
    url?: string
    stats: Stat[]
}
