import { Link } from 'react-router-dom'
import { TRACKS } from '@/content/index'
import { useNow } from '@/lib/useNow'
import type { Track } from '@/content/schema'
import { useProgress } from '@/store/useProgress'
import { dailySeries, dueForRevisit, headline, lifetimeLedger, standingFor } from '@/store/progress'
import { favouriteKeys, troubleKeys } from '@/engine/metrics'
import { rankForPractice } from '@/engine/practice/ranking'
import {
  Empty,
  KeyCap,
  Meter,
  Panel,
  SectionLabel,
  Sparkline,
  StatTile,
} from '@/components/ui/primitives'
import { TrackCard } from '@/components/catalogue/TrackCard'
import { weakKeyPath } from '@/lib/paths'

function KeyLedgerPanel() {
  const progress = useProgress()
  const ledger = lifetimeLedger(progress)
  const good = favouriteKeys(ledger)
  const bad = troubleKeys(ledger)
  const worst = rankForPractice(ledger)[0]

  if (good.length === 0) {
    return (
      <Empty>
        Your keyboard has no history yet. A handful of drills and this fills in with the keys you
        never miss, and the ones you always do.
      </Empty>
    )
  }

  return (
    // Not a fixed height: two rows of full-size keycaps and a button don't fit
    // in the stat tiles' 152px, and forcing them to left no space at all
    // between the favourite keys and the label under them.
    <Panel className="flex h-full min-h-[152px] flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="text-[10px] tracking-[0.18em] text-faint uppercase">Favourite keys</div>
        <div className="flex gap-2">
          {good.map((key) => (
            <KeyCap key={key.char} char={key.char} tone="signal" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-[10px] tracking-[0.18em] text-faint uppercase">
            Keys that need work
          </span>
          {worst !== undefined && (
            <Link
              to={weakKeyPath('ladder')}
              className="bg-amber px-3 py-1.5 text-[10px] tracking-[0.16em] text-ink uppercase hover:bg-amber-soft"
            >
              Practice weak keys
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          {bad.length === 0 ? (
            <span className="text-[11px] text-muted">Nothing is giving you trouble yet.</span>
          ) : (
            bad.map((key) => (
              <Link key={key.char} to={weakKeyPath('ladder', [key.char])}>
                <KeyCap char={key.char} tone="fault" />
              </Link>
            ))
          )}
        </div>
      </div>
    </Panel>
  )
}

export default function Home() {
  const progress = useProgress()
  const now = useNow()
  const stats = headline(progress)
  const series = dailySeries(progress)
  const stale = new Set(dueForRevisit(progress, TRACKS, now).map((track) => track.id))

  const favourite = new Set(progress.favouriteLanguages)
  const inYourStack = (track: Track): boolean => favourite.has(track.language)

  const dispatches = TRACKS.filter((t) => t.kind === 'dispatch' && inYourStack(t)).sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
  )
  const elsewhere = TRACKS.filter((t) => !dispatches.includes(t))

  // Drills only, like every number above it — practice runs aren't history here.
  const hasHistory = stats.sessionCount > 0

  return (
    <div className="flex flex-col gap-7">
      <h1 className="sr-only">Home</h1>
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="reveal" style={{ animationDelay: '0.05s' }}>
            <StatTile
              label="Recent speed"
              value={Math.round(stats.recentWpm)}
              unit="wpm"
              footer={
                stats.trend === null ? (
                  <span className="text-muted">across your last ten drills</span>
                ) : (
                  <span className={stats.trend >= 0 ? 'text-signal' : 'text-fault'}>
                    {stats.trend >= 0 ? '+' : ''}
                    {Math.round(stats.trend)} on the ten before
                  </span>
                )
              }
            >
              <Sparkline values={series.map((point) => point.wpm)} />
            </StatTile>
          </div>

          <div className="reveal" style={{ animationDelay: '0.12s' }}>
            <StatTile
              label="Accuracy"
              value={(stats.recentAccuracy * 100).toFixed(1)}
              unit="%"
              footer={<span className="text-muted">first press, uncorrected</span>}
            >
              <Meter fraction={stats.recentAccuracy} />
            </StatTile>
          </div>

          <div className="reveal" style={{ animationDelay: '0.19s' }}>
            <StatTile
              label="Drills run"
              value={stats.sessionCount}
              footer={<span className="text-muted">across {TRACKS.length} tracks</span>}
            >
              <Meter fraction={Math.min(1, stats.sessionCount / 100)} />
            </StatTile>
          </div>

          <div className="reveal" style={{ animationDelay: '0.26s' }}>
            <StatTile
              label="Time at keys"
              value={
                stats.minutesTyped >= 60
                  ? `${Math.floor(stats.minutesTyped / 60)}h ${Math.round(stats.minutesTyped % 60)}m`
                  : `${Math.round(stats.minutesTyped)}m`
              }
              footer={
                <span className="text-muted">best speed {Math.round(stats.bestWpm)} wpm</span>
              }
            >
              <Sparkline
                values={series.map((point) => point.sessions)}
                stroke="var(--color-amber-dim)"
              />
            </StatTile>
          </div>
        </div>

        <div className="reveal" style={{ animationDelay: '0.33s' }}>
          <KeyLedgerPanel />
        </div>
      </div>

      {!hasHistory && (
        <Panel accent="amber" className="reveal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-[11px] leading-relaxed text-muted">
              Nothing typed yet. Every lesson here says one thing several ways — you type the
              variants back to back until the shape of the idea is in your hands, not just its
              spelling.
            </p>
            <Link
              to={`/drill/${TRACKS[0]?.id ?? ''}`}
              className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
            >
              Start typing
            </Link>
          </div>
        </Panel>
      )}

      {dispatches.length > 0 && (
        <section className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.4s' }}>
          <SectionLabel>Fresh in your stack</SectionLabel>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dispatches.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                standing={standingFor(progress, track.id)}
                stale={stale.has(track.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.48s' }}>
        <SectionLabel>Other ground to cover</SectionLabel>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {elsewhere.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              standing={standingFor(progress, track.id)}
              stale={stale.has(track.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
