import { ServiceCard } from './components/ServiceCard'
import { StatusBar, type Notice } from './components/StatusBar'
import { SystemPanel, SystemPanelOffline } from './components/SystemPanel'
import { iconUrl } from './icons'
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
        const icon = iconUrl(id)
        return result.data
            ? { ...result.data, url, icon }
            : {
                  name,
                  url,
                  icon,
                  status: result.isPending ? 'loading' : 'offline',
                  stats: [],
                  issues: [],
              }
    })

    // Everything that needs a look, and everything that's busy right now.
    const attention: Notice[] = []
    const activity: Notice[] = []
    let online = 0
    let checking = true
    for (const service of services) {
        if (service.status !== 'loading') {
            checking = false
        }
        if (service.status === 'online') {
            online++
        }
        if (service.status === 'offline') {
            attention.push({
                source: service.name,
                message: 'Not responding',
                tone: 'bad',
            })
        }
        for (const issue of service.issues) {
            attention.push({
                source: service.name,
                message: issue,
                tone: 'warn',
            })
        }
        if (service.activity) {
            activity.push({
                source: service.name,
                message: service.activity,
                tone: 'ok',
            })
        }
    }

    // Check isError before data. After a failed fetch TanStack keeps the last
    // good `data` around, so a dead NAS would otherwise keep showing its last
    // numbers as if they were live.
    let systemPanel = null
    if (truenas.isError) {
        systemPanel = <SystemPanelOffline />
        attention.push({
            source: 'TrueNAS',
            message: 'Not responding',
            tone: 'bad',
        })
    } else if (truenas.data) {
        systemPanel = <SystemPanel info={truenas.data} />
        for (const pool of truenas.data.pools) {
            const used = Math.round((pool.allocated / pool.size) * 100)
            if (!pool.healthy) {
                attention.push({
                    source: 'TrueNAS',
                    message: `Pool ${pool.name} is ${pool.status.toLowerCase()}`,
                    tone: 'bad',
                })
            } else if (used >= 90) {
                attention.push({
                    source: 'TrueNAS',
                    message: `Pool ${pool.name} is ${used}% full`,
                    tone: 'warn',
                })
            }
        }
    }

    return (
        <>
            <StatusBar
                attention={attention}
                activity={activity}
                online={online}
                total={services.length}
                checking={checking}
            />

            <main className="app">
                {systemPanel}

                <section className="grid" aria-label="Services">
                    {services.map((service) => (
                        <ServiceCard key={service.name} service={service} />
                    ))}
                </section>
            </main>
        </>
    )
}

export default App
