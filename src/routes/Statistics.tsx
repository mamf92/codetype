import { TRACKS } from '@/content/index'
import { useNow } from '@/lib/useNow'
import { useProgress } from '@/store/useProgress'
import { dailySeries, dueForRevisit, headline, lifetimeLedger, standingFor } from '@/store/progress'
import { troubleKeys } from '@/engine/metrics'
import { PageHead } from '@/components/layout/Shell'
import { Empty, KeyCap, Panel, SectionLabel } from '@/components/ui/primitives'
import { AreaChart } from '@/components/ui/AreaChart'

const DAY_MS = 86_400_000

function relative(at: number | null, now: number): string {
  if (at === null) return '—'
  const days = Math.floor((now - at) / DAY_MS)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/** Evenly spaced date ticks, so a long history does not print fifty labels. */
function ticks(days: string[]): string[] {
  if (days.length <= 5) return days.map(short)
  const step = (days.length - 1) / 4
  return [0, 1, 2, 3, 4].map((i) => short(days[Math.round(i * step)] ?? ''))
}

const short = (day: string): string =>
  day === '' ? '' : new Date(day).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })

export default function Statistics() {
  const progress = useProgress()
  const now = useNow()
  const stats = headline(progress)
  const series = dailySeries(progress)
  const ledger = lifetimeLedger(progress)
  const trouble = troubleKeys(ledger, 5)
  const stale = new Set(dueForRevisit(progress, TRACKS, now).map((track) => track.id))

  if (progress.sessions.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHead
          title="Nothing measured yet"
          blurb="Speed, accuracy and your per-key record all come from completed drills. Run a few and this page fills itself in."
        />
        <Empty>
          Every completed passage is stored locally with its own keyboard ledger, so these graphs
          are built from your real keystrokes rather than an average of them.
        </Empty>
      </div>
    )
  }

  const worstKey = trouble[0]

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title={`${series.length} ${series.length === 1 ? 'day' : 'days'} at the keys`}
        blurb={`${stats.sessionCount} drills, ${Math.round(stats.minutesTyped)} minutes, best run ${Math.round(stats.bestWpm)} wpm.`}
        aside={
          stats.trend === null ? undefined : (
            <span className={`text-[10px] ${stats.trend >= 0 ? 'text-signal' : 'text-fault'}`}>
              {stats.trend >= 0 ? '+' : ''}
              {Math.round(stats.trend)} wpm on your previous ten
            </span>
          )
        }
      />

      <Panel className="reveal flex h-[284px] flex-col gap-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] tracking-[0.2em] text-faint uppercase">
            Best speed per day
          </span>
          <span className="text-[10px] text-signal">peak {Math.round(stats.bestWpm)} wpm</span>
        </div>
        <AreaChart
          values={series.map((point) => point.wpm)}
          labels={ticks(series.map((point) => point.day))}
          stroke="#ffb000"
          gradientId="speed"
        />
      </Panel>

      <div className="reveal grid gap-5 lg:grid-cols-2" style={{ animationDelay: '0.1s' }}>
        <Panel className="flex h-[208px] flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] tracking-[0.2em] text-faint uppercase">
              Accuracy, first press
            </span>
            <span className="text-[10px] text-muted">
              holding near {(stats.recentAccuracy * 100).toFixed(0)}%
            </span>
          </div>
          <AreaChart
            values={series.map((point) => point.accuracy * 100)}
            stroke="#3ddbd9"
            gradientId="accuracy"
            domain={[Math.min(80, ...series.map((p) => p.accuracy * 100)), 100]}
          />
        </Panel>

        <Panel className="flex h-[208px] flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] tracking-[0.2em] text-faint uppercase">
              Keys that need work
            </span>
            <span className="text-[10px] text-muted">miss rate, 12+ presses</span>
          </div>
          {trouble.length === 0 ? (
            <p className="flex flex-1 items-center text-[11px] text-muted">
              No key has been pressed enough times yet to say anything honest about it.
            </p>
          ) : (
            <div className="flex flex-1 flex-col justify-between gap-2">
              {trouble.map((key) => (
                <div key={key.char} className="flex items-center gap-3">
                  <KeyCap char={key.char} tone={key.errorRate > 0.18 ? 'fault' : 'warn'} small />
                  <div className="h-2 flex-1 bg-[#1c1710]">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, key.errorRate * 100).toFixed(0)}%`,
                        background: key.errorRate > 0.18 ? '#e24b3f' : '#c98a2f',
                      }}
                    />
                  </div>
                  <span className="w-[34px] text-right text-[10px] text-muted">
                    {(key.errorRate * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <section className="reveal flex flex-col gap-2.5" style={{ animationDelay: '0.2s' }}>
        <SectionLabel>Track by track</SectionLabel>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[2.4fr_1fr_0.8fr_0.8fr_1fr_1.2fr] gap-3 border-b border-ink-line px-3.5 py-2.5 text-[9px] tracking-[0.16em] text-faint uppercase">
              <span>Track</span>
              <span>Last run</span>
              <span>Runs</span>
              <span>Best</span>
              <span>Avg accuracy</span>
              <span>Freshness</span>
            </div>
            {TRACKS.map((track, i) => {
              const standing = standingFor(progress, track.id)
              const never = standing.attempts === 0
              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-[2.4fr_1fr_0.8fr_0.8fr_1fr_1.2fr] gap-3 border-b border-[#15120e] px-3.5 py-3 text-[11px] ${
                    never ? 'text-ghost' : 'text-parchment'
                  } ${i % 2 === 1 ? 'bg-ink-sunk' : ''}`}
                >
                  <span className="truncate">{track.title}</span>
                  <span className={never ? '' : 'text-muted'}>
                    {relative(standing.lastAt, now)}
                  </span>
                  <span>{standing.attempts}</span>
                  <span className={never ? '' : 'font-display font-light text-amber'}>
                    {never ? '—' : Math.round(standing.bestWpm)}
                  </span>
                  <span>{never ? '—' : `${(standing.averageAccuracy * 100).toFixed(1)}%`}</span>
                  <span className={never ? '' : stale.has(track.id) ? 'text-fault' : 'text-signal'}>
                    {never ? 'never run' : stale.has(track.id) ? 'due for a pass' : 'fresh'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {worstKey !== undefined && (
        <p className="text-[10px] text-faint">
          Your weakest key is{' '}
          <span className="text-fault">{worstKey.char === ' ' ? 'space' : worstKey.char}</span>,
          missed {(worstKey.errorRate * 100).toFixed(0)}% of the {worstKey.pressed} times you have
          reached for it.
        </p>
      )}
    </div>
  )
}
