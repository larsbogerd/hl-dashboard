type Props = {
    points: number[]
    /** Top of the chart. Defaults to the highest point. */
    max?: number
}

export function Sparkline({ points, max }: Props) {
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
            <path className="spark__area" d={`${line} L100,100 L0,100 Z`} />
            <path className="spark__line" d={line} />
        </svg>
    )
}
