import {formatBytes} from '../format'
import type {Pool, SystemInfo} from '../services/truenas'

function uptime(seconds: number): string {
    const days = Math.floor(seconds / 86_400)
    const hours = Math.floor((seconds % 86_400) / 3_600)
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

function fillClass(percent: number): string {
    if (percent >= 90) return 'meter__fill--bad'
    if (percent >= 75) return 'meter__fill--warn'
    return ''
}

function Meter({percent}: {percent: number}) {
    return (
        <div className="meter">
            <div
                className={`meter__fill ${fillClass(percent)}`}
                style={{width: `${Math.min(100, percent)}%`}}
            />
        </div>
    )
}

function Sparkline({points, max}: {points: number[]; max?: number}) {
    if (points.length < 2) return null

    const top = max ?? Math.max(...points, 1)
    const line = points
        .map((value, i) => {
            const x = (i / (points.length - 1)) * 100
            const y = 100 - (value / top) * 100
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')

    return (
        <svg
            className="spark"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path className="spark__area" d={`${line} L100,100 L0,100 Z`}/>
            <path className="spark__line" d={line}/>
        </svg>
    )
}

function PoolRow({pool}: {pool: Pool}) {
    const used = (pool.allocated / pool.size) * 100

    return (
        <div className="pool">
            <div className="pool__head">
                <span className="pool__name">
                    {!pool.healthy && (
                        <span className="dot dot--bad" aria-hidden="true"/>
                    )}
                    {pool.name}
                </span>
                <span className="pool__pct">{Math.round(used)}%</span>
            </div>
            <Meter percent={used}/>
            <span className="pool__sub">
                {formatBytes(pool.free)} free of {formatBytes(pool.size)}
            </span>
        </div>
    )
}

export function SystemPanel({info}: {info: SystemInfo}) {
    const memServices = Math.max(0, info.memTotal - info.memFree - info.memCache)
    const pct = (bytes: number) => (bytes / info.memTotal) * 100

    return (
        <section className="system">
            <header className="system__head">
                <h2 className="system__host">TrueNAS {info.version}</h2>
                <span className="system__meta">
                    Uptime {uptime(info.uptimeSeconds)}
                </span>
            </header>

            <div className="system__grid">
                <div className="tile">
                    <span className="tile__label">CPU usage</span>
                    <span className="tile__value">
                        {Math.round(info.cpuPercent)}%
                        <span className="tile__unit">{Math.round(info.cpuTemp)}°C</span>
                    </span>
                    <Sparkline points={info.cpuHistory} max={100}/>
                    <span className="tile__sub">
                        {info.cores} cores / {info.threads} threads
                    </span>
                </div>

                <div className="tile">
                    <span className="tile__label">Memory</span>
                    <span className="tile__value">
                        {formatBytes(info.memTotal - info.memFree)}
                        <span className="tile__unit">of {formatBytes(info.memTotal)}</span>
                    </span>
                    <div className="meter meter--split">
                        <div
                            className="seg seg--services"
                            style={{width: `${pct(memServices)}%`}}
                        />
                        <div
                            className="seg seg--cache"
                            style={{width: `${pct(info.memCache)}%`}}
                        />
                    </div>
                    <span className="tile__sub legend">
                        <span className="legend__item">
                            <span className="key key--services"/>
                            {formatBytes(memServices)} services
                        </span>
                        <span className="legend__item">
                            <span className="key key--cache"/>
                            {formatBytes(info.memCache)} cache
                        </span>
                        <span className="legend__item">
                            <span className="key key--free"/>
                            {formatBytes(info.memFree)} free
                        </span>
                    </span>
                </div>

                <div className="tile">
                    <span className="tile__label">Network</span>
                    <span className="tile__value">↓ {formatBytes(info.netIn)}/s</span>
                    <span className="tile__value tile__value--sm">
                        ↑ {formatBytes(info.netOut)}/s
                    </span>
                </div>

                <div className="tile tile--wide">
                    <span className="tile__label">Storage</span>
                    <div className="pools">
                        {info.pools.map((pool) => (
                            <PoolRow key={pool.name} pool={pool}/>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
