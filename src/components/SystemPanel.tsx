import { formatBytes } from '../format'
import { iconUrl } from '../icons'
import type { Pool, SystemInfo } from '../services/truenas'
import { Sparkline } from './Sparkline'

function uptime(seconds: number): string {
    const days = Math.floor(seconds / 86_400)
    const hours = Math.floor((seconds % 86_400) / 3_600)
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

function fillClass(percent: number): string {
    if (percent >= 90) return 'meter__fill meter__fill--bad'
    if (percent >= 75) return 'meter__fill meter__fill--warn'
    return 'meter__fill'
}

function PoolGauge({ pool }: { pool: Pool }) {
    const used = (pool.allocated / pool.size) * 100

    return (
        <div className="pool">
            <div className="pool__head">
                <span className="pool__name">
                    {!pool.healthy && (
                        <span className="led led--bad" aria-hidden="true" />
                    )}
                    {pool.name}
                </span>
                <span className="pool__pct">{Math.round(used)}%</span>
            </div>
            <div className="meter">
                <div
                    className={fillClass(used)}
                    style={{ width: `${Math.min(100, used)}%` }}
                />
            </div>
            <span className="gauge__sub">
                {formatBytes(pool.free)} free of {formatBytes(pool.size)}
            </span>
        </div>
    )
}

export function SystemPanel({ info }: { info: SystemInfo }) {
    // ZFS keeps free memory busy as cache and hands it back when asked, so
    // "in use" means what the apps hold, not total minus free.
    const memApps = Math.max(0, info.memTotal - info.memFree - info.memCache)
    const pct = (bytes: number) => (bytes / info.memTotal) * 100

    return (
        <section className="panel machine">
            <header className="machine__head">
                <img className="logo" src={iconUrl('truenas-scale')} alt="" />
                <h2 className="machine__name">
                    TrueNAS{' '}
                    <span className="machine__meta">{info.version}</span>
                </h2>
                <span className="machine__meta">
                    Uptime {uptime(info.uptimeSeconds)}
                </span>
            </header>

            <div className="machine__grid">
                <div className="gauge gauge--cpu">
                    <span className="gauge__label">CPU usage</span>
                    <span className="gauge__value">
                        {Math.round(info.cpuPercent)}%
                        <span className="gauge__unit">
                            {Math.round(info.cpuTemp)}°C
                        </span>
                    </span>
                    <Sparkline points={info.cpuHistory} max={100} />
                    <span className="gauge__sub">
                        {info.cores} cores / {info.threads} threads
                    </span>
                </div>

                <div className="gauge">
                    <span className="gauge__label">Memory</span>
                    <span className="gauge__value">
                        {formatBytes(memApps)}
                        <span className="gauge__unit">
                            of {formatBytes(info.memTotal)}
                        </span>
                    </span>
                    <div className="meter">
                        <div
                            className="meter__fill"
                            style={{ width: `${pct(memApps)}%` }}
                        />
                        <div
                            className="meter__fill meter__fill--cache"
                            style={{ width: `${pct(info.memCache)}%` }}
                        />
                    </div>
                    <span className="gauge__sub legend">
                        <span className="legend__item">
                            <span className="key key--services" />
                            {formatBytes(memApps)} services
                        </span>
                        <span className="legend__item">
                            <span className="key key--cache" />
                            {formatBytes(info.memCache)} cache
                        </span>
                    </span>
                </div>

                <div className="gauge">
                    <span className="gauge__label">Network</span>
                    {/* Down and up, the same words qBittorrent uses. */}
                    <span className="gauge__value">
                        {formatBytes(info.netIn)}/s
                        <span className="gauge__unit">down</span>
                    </span>
                    <span className="gauge__value gauge__value--small">
                        {formatBytes(info.netOut)}/s
                        <span className="gauge__unit">up</span>
                    </span>
                </div>

                <div className="gauge gauge--storage">
                    <span className="gauge__label">Storage</span>
                    <div className="pools">
                        {info.pools.map((pool) => (
                            <PoolGauge key={pool.name} pool={pool} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

/** Shown when the server can't reach TrueNAS: the panel's frame, no numbers. */
export function SystemPanelOffline() {
    return (
        <section className="panel machine">
            <header className="machine__head machine__head--alone">
                <img className="logo" src={iconUrl('truenas-scale')} alt="" />
                <h2 className="machine__name">TrueNAS</h2>
                <span className="machine__meta tone-bad">
                    <span className="led led--bad" aria-hidden="true" />
                    {' Not responding'}
                </span>
            </header>
        </section>
    )
}
