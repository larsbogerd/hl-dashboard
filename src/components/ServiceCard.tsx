import type {Service, ServiceStatus} from '../types'

const STATUS_LABEL: Record<ServiceStatus, string> = {
    loading: 'Checking…',
    online: 'Active',
    offline: 'Offline',
}

type Props = {
    service: Service
}

export function ServiceCard({service}: Props) {
    const {name, status, version, stats, url} = service

    return (
        <article className={`card card--${status}`}>
            <header className="card__head">
                <h2 className="card__title">
                    {url ? (
                        <a
                            className="card__link"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {name}
                        </a>
                    ) : (
                        name
                    )}
                </h2>
                <span className="card__status">
          <span className="dot" aria-hidden="true"/>
                    {STATUS_LABEL[status]}
        </span>
            </header>

            <p className="card__version">{version ? `v${version}` : ' '}</p>

            <dl className="stats">
                {stats.map((stat) => (
                    <div className="stat" key={stat.label}>
                        <dt className="stat__label">{stat.label}</dt>
                        <dd
                            className={`stat__value ${
                                stat.tone ? `stat__value--${stat.tone}` : ''
                            }`}
                        >
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </article>
    )
}
