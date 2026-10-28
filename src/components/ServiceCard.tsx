import type { Service } from '../types'
import { Sparkline } from './Sparkline'

type Props = {
    service: Service
    /**
     * While the layout is being edited the card is not a link: a click or a
     * Tab should land on the card itself, not on the app it opens.
     */
    editing?: boolean
}

/** The light and the word next to it, top right on the card. */
function statusOf(service: Service): { led: string; text: string } {
    if (service.status === 'loading') {
        return { led: 'led', text: 'Checking…' }
    }
    if (service.status === 'offline') {
        return { led: 'led led--bad', text: 'Offline' }
    }
    if (service.issues.length > 0) {
        return { led: 'led led--warn', text: 'Needs a look' }
    }
    if (service.activity) {
        return { led: 'led led--ok led--busy', text: service.activity }
    }
    return { led: 'led led--ok', text: 'Online' }
}

export function ServiceCard({ service, editing }: Props) {
    const { name, status, version, url, icon, headline, meter, history } =
        service
    const { stats, issues } = service
    const badge = statusOf(service)

    return (
        <article className={`card card--${status}`}>
            <header className="card__head">
                {icon && <img className="logo" src={icon} alt="" />}
                <div className="card__id">
                    <h2 className="card__title">
                        {url && !editing ? (
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
                    {version && <p className="card__version">v{version}</p>}
                </div>
                <span className="card__status">
                    <span className={badge.led} aria-hidden="true" />
                    {badge.text}
                </span>
            </header>

            {status === 'offline' && (
                <p className="card__note">
                    Not responding. Its numbers will come back when it does.
                </p>
            )}

            {headline && (
                <div className="card__lead">
                    <p className="card__headline">
                        <span className="card__figure">{headline.value}</span>{' '}
                        {headline.label}
                    </p>

                    {meter && (
                        <>
                            <div className="meter">
                                <div
                                    className="meter__fill"
                                    style={{ width: `${meter.percent}%` }}
                                />
                            </div>
                            <span className="card__caption">{meter.label}</span>
                        </>
                    )}

                    {history && (
                        <>
                            <Sparkline points={history.points} />
                            <span className="card__caption">
                                {history.label}
                            </span>
                        </>
                    )}
                </div>
            )}

            {stats.length > 0 && (
                <dl className="facts">
                    {stats.map((stat) => (
                        <div className="fact" key={stat.label}>
                            <dt>{stat.label}</dt>
                            <dd
                                className={stat.tone ? `tone-${stat.tone}` : ''}
                            >
                                {stat.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            {issues.length > 0 && (
                <ul className="card__issues">
                    {issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                    ))}
                </ul>
            )}
        </article>
    )
}
