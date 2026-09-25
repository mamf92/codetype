import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  accent,
}: {
  children: ReactNode
  className?: string
  accent?: 'amber' | 'fault' | undefined
}) {
  const edge =
    accent === 'amber'
      ? 'border-l-2 border-l-amber'
      : accent === 'fault'
        ? 'border-l-2 border-l-fault'
        : ''
  return <div className={`panel p-5 ${edge} ${className}`}>{children}</div>
}

/** A section heading with the rule that runs out to the edge of the column. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[10px] tracking-[0.22em] text-faint uppercase">
      {children}
      <span className="h-px flex-1 bg-ink-line" />
    </div>
  )
}

export function Chip({
  children,
  tone = 'idle',
}: {
  children: ReactNode
  tone?: 'idle' | 'on' | 'signal' | 'fault' | 'absent'
}) {
  const tones: Record<string, string> = {
    idle: 'border border-ink-edge text-parchment',
    on: 'bg-amber text-ink',
    signal: 'border border-signal-line text-signal',
    fault: 'border border-fault-line text-fault',
    absent: 'border border-dashed border-ink-line text-ghost',
  }
  return <span className={`px-3 py-1.5 text-[10px] ${tones[tone]}`}>{children}</span>
}

export function KeyCap({
  char,
  tone = 'signal',
  small = false,
}: {
  char: string
  tone?: 'signal' | 'fault' | 'warn'
  small?: boolean
}) {
  const tones = {
    signal: 'text-signal border-signal-line',
    fault: 'text-fault border-fault-line',
    warn: 'text-amber-soft border-ink-edge',
  }
  const size = small ? 'w-[26px] h-6 text-xs' : 'w-9 h-[38px] text-[13px]'
  return (
    <span
      className={`flex items-center justify-center rounded-[3px] border bg-gradient-to-b from-ink-raised to-ink-sunk ${tones[tone]} ${size}`}
    >
      {/* A space is a real key with a real miss rate; give it a visible face.
          The line break is not a key at all — `isKeyboardKey` keeps it out of
          every ranking that feeds a keycap. */}
      {char === ' ' ? '␣' : char}
    </span>
  )
}

export function StatTile({
  label,
  value,
  unit,
  footer,
  children,
}: {
  label: string
  value: ReactNode
  unit?: string
  footer?: ReactNode
  children?: ReactNode
}) {
  return (
    // A floor, not a fixed height, so a row of tiles stretches to match
    // whatever sits beside it (the key panel on Home) instead of ending short.
    <Panel className="flex h-full min-h-[152px] flex-col justify-between">
      <div className="text-[10px] tracking-[0.18em] text-faint uppercase">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[40px] leading-none font-light text-amber">{value}</span>
        {unit !== undefined && <span className="text-[11px] text-faint">{unit}</span>}
      </div>
      {children}
      {footer !== undefined && <div className="text-[10px]">{footer}</div>}
    </Panel>
  )
}

/** A bare line chart. No axes, no legend — it is a shape, not a table. */
export function Sparkline({
  values,
  stroke = 'var(--color-amber)',
  height = 28,
}: {
  values: number[]
  stroke?: string
  height?: number
}) {
  if (values.length < 2) return <div style={{ height }} />

  const low = Math.min(...values)
  const high = Math.max(...values)
  const span = high - low || 1
  const step = 180 / (values.length - 1)
  const points = values
    .map((value, i) => `${(i * step).toFixed(1)},${(26 - ((value - low) / span) * 24).toFixed(1)}`)
    .join(' ')

  return (
    <svg width="100%" height={height} viewBox="0 0 180 28" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  )
}

export function Meter({
  fraction,
  tone = 'var(--color-amber)',
}: {
  fraction: number
  tone?: string
}) {
  const clamped = Math.max(0, Math.min(1, fraction))
  return (
    <div className="h-1 bg-ink-line">
      <div
        className="h-full"
        style={{
          width: `${(clamped * 100).toFixed(1)}%`,
          background: tone,
          boxShadow: `0 0 10px color-mix(in srgb, ${tone} 50%, transparent)`,
        }}
      />
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <Panel className="flex min-h-[152px] items-center justify-center">
      <p className="max-w-sm text-center text-[11px] leading-relaxed text-muted">{children}</p>
    </Panel>
  )
}
