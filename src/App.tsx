import {ServiceCard} from './components/ServiceCard'
import {SystemPanel} from './components/SystemPanel'
import {CONNECTORS} from './services'
import {fetchTrueNas} from './services/truenas'
import type {Service} from './types'
import {useQueries, useQuery} from '@tanstack/react-query'

function App() {
    const {data: system} = useQuery({
        queryKey: ['truenas'],
        queryFn: fetchTrueNas,
    })
    const results = useQueries({
        queries: CONNECTORS.map((c) => ({
            queryKey: ['service', c.name],
            queryFn: c.fetch,
        })),
    })

    const services: Service[] = results.map((result, i) => {
        const {name, url} = CONNECTORS[i]
        return (
            result.data ?? {
                name,
                url: url || undefined,
                status: result.isPending ? 'loading' : 'offline',
                stats: [],
            }
        )
    })

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

            {system && <SystemPanel info={system}/>}

            <section className="grid">
                {services.map((service) => (
                    <ServiceCard key={service.name} service={service}/>
                ))}
            </section>
        </div>
    )
}

export default App
