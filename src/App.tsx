import {useEffect, useState} from 'react'
import {ServiceCard} from './components/ServiceCard'
import {CONNECTORS} from './services'
import type {Service} from './types'

function initialServices(): Service[] {
    return CONNECTORS.map(({name, url}) => ({
        name,
        status: 'loading',
        url: url || undefined,
        stats: [],
    }))
}

function App() {
    const [connected, setConnected] = useState<Service[]>(initialServices)

    useEffect(() => {
        CONNECTORS.forEach(({name, url, fetch}, index) => {
            // Each card updates on its own, so one slow service
            // doesn't hold up the rest.
            const replace = (service: Service) =>
                setConnected((prev) =>
                    prev.map((old, i) => (i === index ? service : old)),
                )

            fetch()
                .then(replace)
                .catch((err: unknown) => {
                    console.error(`${name} fetch failed:`, err)
                    replace({
                        name,
                        status: 'offline',
                        url: url || undefined,
                        stats: [],
                    })
                })
        })
    }, [])

    const onlineCount = connected.filter((s) => s.status === 'online').length

    return (
        <div className="app">
            <header className="page-head">
                <div>
                    <h1 className="page-title">Homelab dashboard</h1>
                    <p className="page-sub">
                        {onlineCount} of {connected.length} services online
                    </p>
                </div>
            </header>

            <section className="grid">
                {connected.map((service) => (
                    <ServiceCard key={service.name} service={service}/>
                ))}
            </section>
        </div>
    )
}

export default App
