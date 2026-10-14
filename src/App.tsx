import { ServiceCard } from './components/ServiceCard'
import { SystemPanel, SystemPanelOffline } from './components/SystemPanel'
import { CONNECTORS } from './services'
import { get } from './services/client'
import { fetchTrueNas } from './services/truenas'
import type { Service } from './types'
import { useQueries, useQuery } from '@tanstack/react-query'

function App() {
    // Link URLs come from the server. They don't change while it runs.
    const { data: links } = useQuery({
        queryKey: ['config'],
        queryFn: () => get<Record<string, string>>('/api/config'),
        staleTime: Infinity,
    })
    const truenas = useQuery({
        queryKey: ['truenas'],
        queryFn: fetchTrueNas,
        refetchInterval: 2_000,
    })
    const results = useQueries({
        queries: CONNECTORS.map((c) => ({
            queryKey: ['service', c.name],
            queryFn: c.fetch,
            refetchInterval: c.interval ?? 30_000,
        })),
    })

    const services: Service[] = results.map((result, i) => {
        const { name, id } = CONNECTORS[i]
        const url = links?.[id]
        return result.data
            ? { ...result.data, url }
            : {
                  name,
                  url,
                  status: result.isPending ? 'loading' : 'offline',
                  stats: [],
              }
    })

    // Check isError before data. After a failed fetch TanStack keeps the last
    // good `data` around, so a dead NAS would otherwise keep showing its last
    // numbers as if they were live.
    let systemPanel = null
    if (truenas.isError) {
        systemPanel = <SystemPanelOffline />
    } else if (truenas.data) {
        systemPanel = <SystemPanel info={truenas.data} />
    }

    const onlineCount = services.filter((s) => s.status === 'online').length

    return (
        <div className="app">
            <header className="page-head">
                <div>
                    <h1 className="page-title">Homelab dashboard</h1>
                    <p className="page-sub">
                        {onlineCount} of {services.length} services online
                    </p>
                </div>
            </header>

            {systemPanel}

            <section className="grid">
                {services.map((service) => (
                    <ServiceCard key={service.name} service={service} />
                ))}
            </section>
        </div>
    )
}

export default App
