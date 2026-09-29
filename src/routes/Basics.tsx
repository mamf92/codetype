import { Link } from 'react-router-dom'
import { KEY_TRACKS } from '@/content/basics/index'
import { SPEED_TESTS } from '@/content/speed/index'
import { rankForPractice } from '@/engine/practice/ranking'
import { MAX_PRACTICE_KEYS, practiceTargets } from '@/engine/practice/weakKeys'
import { useProgress } from '@/store/useProgress'
import {
  bestGames,
  lifetimeLedger,
  practiceSummary,
  speedTestStanding,
  stageStanding,
} from '@/store/progress'
import { PageHead } from '@/components/layout/Shell'
import { SectionLabel } from '@/components/ui/primitives'
import { BUTTON } from '@/components/ui/button'
import { KeyMap } from '@/components/basics/KeyMap'
import { NeedsWork, Strongest } from '@/components/basics/KeyStandings'
import { KeyfallCard, KeyTrackCard, MethodCard } from '@/components/basics/PracticeCards'
import { SpeedTestPanel } from '@/components/basics/SpeedTestPanel'
import { weakKeyPath } from '@/lib/paths'

const JUMPS = [
  ['weak-keys', 'Weak keys'],
  ['key-tracks', 'Key tracks'],
  ['speed-test', 'Speed test'],
  ['keyfall', 'Keyfall'],
  ['every-key', 'Every key'],
] as const

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
    <div className="flex flex-col gap-page">
      <PageHead
        title="Learn the keys"
        blurb="You know where the keys are. This is where every one of them gets boring: repetition on the ones that cost you, then pressure until they hold."
        aside={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {targets.length > 0 ? (
              <Link to={weakKeyPath('ladder')} className={BUTTON.primary}>
                Practice weak keys
              </Link>
            ) : (
              <Link to="/explore" className={BUTTON.secondary}>
                Find your weak keys in a drill
              </Link>
            )}
            {summary.sessions > 0 && (
              <span className="text-meta text-faint">
                {summary.sessions} practice {summary.sessions === 1 ? 'run' : 'runs'} ·{' '}
                {Math.max(1, Math.round(summary.minutes))} min
              </span>
            )}
          </div>
        }
      />

      {/* The longest page by far on a phone; this is its table of contents
          there. From `sm` up the sections are in view quickly enough. */}
      <nav aria-label="On this page" className="-mx-6 overflow-x-auto px-6 sm:hidden">
        <ul className="flex gap-2">
          {JUMPS.map(([id, label]) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                className="block border border-ink-edge px-3 py-2 text-label tracking-label text-parchment uppercase"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="reveal grid gap-grid lg:grid-cols-[1.35fr_1fr]"
        style={{ animationDelay: '0.05s' }}
      >
        <NeedsWork ledger={ledger} />
        <Strongest ledger={ledger} />
      </div>

      <section
        id="weak-keys"
        className="reveal flex scroll-mt-4 flex-col gap-section"
        style={{ animationDelay: '0.12s' }}
      >
        <SectionLabel>Weak keys, two ways</SectionLabel>
        <div className="grid gap-grid md:grid-cols-2">
          <MethodCard mode="ladder" targets={targets} emphasis />
          <MethodCard mode="streak" targets={targets} emphasis={false} />
        </div>
      </section>

      <section
        id="key-tracks"
        className="reveal flex scroll-mt-4 flex-col gap-section"
        style={{ animationDelay: '0.19s' }}
      >
        <SectionLabel>Key tracks</SectionLabel>
        <p className="max-w-2xl text-body leading-relaxed text-muted">
          Four stages each: bare reps, the shapes the keys come in, real lines of code, then dense
          passages with nowhere to rest. A stage counts as cleared at 95% first-press accuracy.
        </p>
        <div className="grid gap-grid md:grid-cols-2 xl:grid-cols-4">
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

      <section
        id="speed-test"
        className="reveal flex scroll-mt-4 flex-col gap-section"
        style={{ animationDelay: '0.26s' }}
      >
        <SectionLabel>Speed test</SectionLabel>
        <p className="max-w-2xl text-body leading-relaxed text-muted">
          Nothing to learn here, only something to measure. Results go to Statistics, and stay off
          the drill graphs: a three-second alphabet is not a drill.
        </p>
        <SpeedTestPanel
          standings={Object.fromEntries(
            SPEED_TESTS.map((test) => [test.id, speedTestStanding(progress, test.id)]),
          )}
        />
      </section>

      <section
        id="keyfall"
        className="reveal flex scroll-mt-4 flex-col gap-section"
        style={{ animationDelay: '0.33s' }}
      >
        <SectionLabel>Under pressure</SectionLabel>
        <KeyfallCard leaders={leaders} />
      </section>

      <section
        id="every-key"
        className="reveal flex scroll-mt-4 flex-col gap-section"
        style={{ animationDelay: '0.4s' }}
      >
        <SectionLabel>Every key</SectionLabel>
        <KeyMap ledger={ledger} />
      </section>
    </div>
  )
}
