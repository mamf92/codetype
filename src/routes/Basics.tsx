import { Link } from 'react-router-dom'
import { KEY_TRACKS } from '@/content/basics/index'
import { rankForPractice } from '@/engine/practice/ranking'
import { MAX_PRACTICE_KEYS, practiceTargets } from '@/engine/practice/weakKeys'
import { useProgress } from '@/store/useProgress'
import { bestGames, lifetimeLedger, practiceSummary, stageStanding } from '@/store/progress'
import { PageHead } from '@/components/layout/Shell'
import { SectionLabel } from '@/components/ui/primitives'
import { KeyMap } from '@/components/basics/KeyMap'
import { NeedsWork, Strongest } from '@/components/basics/KeyStandings'
import { KeyfallCard, KeyTrackCard, MethodCard } from '@/components/basics/PracticeCards'
import { weakKeyPath } from '@/lib/paths'

/**
 * Basics — the keys themselves, for people who already know where they are.
 *
 * The catalogue teaches concepts; this page goes back to the root of typing:
 * find the keys that cost you, repeat them until the reach is boring, then
 * put them under pressure. Everything here is derived from the session
 * history on every render, like the rest of the app — no stored counters.
 */
export default function Basics() {
  const progress = useProgress()
  const ledger = lifetimeLedger(progress)
  const ranked = rankForPractice(ledger)
  const targets = practiceTargets(
    ranked.slice(0, MAX_PRACTICE_KEYS).map((key) => key.char),
    ledger,
  )
  const summary = practiceSummary(progress)
  const leaders = bestGames(progress, 5)

  return (
    <div className="flex flex-col gap-7">
      <PageHead
        title="Learn the keys"
        blurb="You know where the keys are. This is where every one of them gets boring: repetition on the ones that cost you, then pressure until they hold."
        aside={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {targets.length > 0 ? (
              <Link
                to={weakKeyPath('ladder')}
                className="bg-amber px-5 py-3 text-[11px] tracking-[0.18em] text-ink uppercase shadow-[0_0_24px_-6px_var(--color-amber)] hover:bg-amber-soft"
              >
                Practice weak keys
              </Link>
            ) : (
              <Link
                to="/explore"
                className="border border-ink-edge px-5 py-3 text-[11px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
              >
                Find your weak keys in a drill
              </Link>
            )}
            {summary.sessions > 0 && (
              <span className="text-[10px] text-faint">
                {summary.sessions} practice {summary.sessions === 1 ? 'run' : 'runs'} ·{' '}
                {Math.max(1, Math.round(summary.minutes))} min
              </span>
            )}
          </div>
        }
      />

      <div
        className="reveal grid gap-5 lg:grid-cols-[1.35fr_1fr]"
        style={{ animationDelay: '0.05s' }}
      >
        <NeedsWork ranked={ranked} ledger={ledger} />
        <Strongest ledger={ledger} />
      </div>

      <section className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.12s' }}>
        <SectionLabel>Weak keys, two ways</SectionLabel>
        <div className="grid gap-5 md:grid-cols-2">
          <MethodCard mode="ladder" targets={targets} emphasis />
          <MethodCard mode="streak" targets={targets} emphasis={false} />
        </div>
      </section>

      <section className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.19s' }}>
        <SectionLabel>Key tracks</SectionLabel>
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted">
          Four stages each: bare reps, the shapes the keys come in, real lines of code, then dense
          passages with nowhere to rest. A stage counts as cleared at 95% first-press accuracy.
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {KEY_TRACKS.map((track) => (
            <KeyTrackCard
              key={track.id}
              track={track}
              standings={Object.fromEntries(
                track.stages.map((stage) => [stage.id, stageStanding(progress, stage.id)]),
              )}
            />
          ))}
        </div>
      </section>

      <section className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.26s' }}>
        <SectionLabel>Under pressure</SectionLabel>
        <KeyfallCard leaders={leaders} />
      </section>

      <section className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.33s' }}>
        <SectionLabel>Every key</SectionLabel>
        <KeyMap ledger={ledger} />
      </section>
    </div>
  )
}
