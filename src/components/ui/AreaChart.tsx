/**
 * A single-series area chart, sized by its container.
 *
 * Deliberately minimal: gridlines, one stroke, one gradient, a dot on the
 * latest reading. There is one series here — a legend would be furniture.
 */
export function AreaChart({
  values,
  labels,
  stroke,
  gradientId,
  domain,
}: {
  values: number[]
  labels?: string[]
  stroke: string
  gradientId: string
  domain?: [number, number]
}) {
  if (values.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-muted">
        Two days of history and this becomes a shape worth reading.
      </div>
    )
  }

  const [low, high] = domain ?? [Math.min(...values), Math.max(...values)]
  const span = high - low || 1
  const step = 1000 / (values.length - 1)
  const y = (value: number): number => 200 - ((value - low) / span) * 200

  const points = values
    .map((value, i) => `${(i * step).toFixed(1)},${y(value).toFixed(1)}`)
    .join(' ')
  const last = values[values.length - 1] ?? low

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex min-h-0 flex-1 gap-3.5">
        <div className="flex flex-col justify-between py-0.5 text-[9px] text-ghost">
          <span>{Math.round(high)}</span>
          <span>{Math.round((high + low) / 2)}</span>
          <span>{Math.round(low)}</span>
        </div>
        <svg
          className="min-h-0 flex-1"
          width="100%"
          height="100%"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.34" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 50, 100, 150].map((line) => (
            <line
              key={line}
              x1="0"
              y1={line}
              x2="1000"
              y2={line}
              stroke="#1c1710"
              strokeWidth="1"
            />
          ))}
          <line x1="0" y1="200" x2="1000" y2="200" stroke="#241d15" strokeWidth="1" />
          <polygon fill={`url(#${gradientId})`} points={`${points} 1000,200 0,200`} />
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          <circle cx="1000" cy={y(last)} r="4" fill={stroke} />
        </svg>
      </div>
      {labels !== undefined && labels.length > 0 && (
        <div className="flex justify-between pl-8 text-[9px] text-ghost">
          {labels.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
