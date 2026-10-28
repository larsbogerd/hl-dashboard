/** Something the bar mentions: who it's about and how bad it is. */
export type Notice = {
    source: string
    message: string
    tone: 'ok' | 'warn' | 'bad'
}

type Props = {
    /** Things that need a look. The cards say what; the bar says who. */
    attention: Notice[]
    /** Things happening right now: streams, downloads, queues. */
    activity: Notice[]
    checking: boolean
}

export function StatusBar({ attention, activity, checking }: Props) {
    let led = 'led led--ok'
    let status = 'All clear'
    // The full messages, for the tooltip.
    const details: string[] = []
    if (checking) {
        led = 'led'
        status = 'Checking…'
    } else if (attention.length > 0) {
        led = 'led led--warn'
        const names: string[] = []
        for (const notice of attention) {
            if (notice.tone === 'bad') {
                led = 'led led--bad'
            }
            if (!names.includes(notice.source)) {
                names.push(notice.source)
            }
            details.push(`${notice.source}: ${notice.message}`)
        }
        status = `Needs a look: ${names.join(', ')}`
    }

    // "Plex 1 stream, qBittorrent downloading"
    let now = 'Quiet right now'
    if (activity.length > 0) {
        const parts: string[] = []
        for (const notice of activity) {
            parts.push(`${notice.source} ${notice.message.toLowerCase()}`)
        }
        now = parts.join(', ')
    }

    return (
        <header className="topbar">
            <div className="topbar__inner">
                <span className="topbar__brand">Homelab</span>
                <span
                    className="topbar__item topbar__item--status"
                    title={details.join('\n')}
                >
                    <span className={led} aria-hidden="true" />
                    {status}
                </span>
                <span className="topbar__item">
                    {activity.length > 0 && (
                        <span
                            className="led led--ok led--busy"
                            aria-hidden="true"
                        />
                    )}
                    {now}
                </span>
            </div>
        </header>
    )
}
