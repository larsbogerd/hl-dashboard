import {useEffect, useState} from 'react'
import {ServiceCard} from './components/ServiceCard'
import {fetchSonarr, PLACEHOLDER_SERVICES} from './services'
import type {Service} from './types'

function App() {
    const [sonarr, setSonarr] = useState<Service>({
        name: 'Sonarr',
        status: 'loading',
        stats: [],
    })

    useEffect(() => {
        fetchSonarr()
            .then(setSonarr)
            .catch((err: unknown) => {
                console.error('Sonarr fetch failed:', err)
                setSonarr({name: 'Sonarr', status: 'offline', stats: [], url: import.meta.env.VITE_SONARR_URL})
            })
    }, [])

    const services = [sonarr, ...PLACEHOLDER_SERVICES]
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

            <section className="grid">
                {services.map((service) => (
                    <ServiceCard key={service.name} service={service}/>
                ))}
            </section>
        </div>
    )
}

export default App
