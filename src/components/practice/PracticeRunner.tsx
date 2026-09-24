import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTypingSession } from '@/engine/useTypingSession'
import { addRun, emptyTotals, rankKeys, totalsMetrics, type RunTotals } from '@/engine/metrics'
import type { KeyLedger } from '@/engine/types'
import type { PracticeStep } from '@/engine/practice/weakKeys'
import { recordSession } from '@/store/useProgress'
import { useResultKeyboardNav } from '@/lib/useResultKeyboardNav'
import { TypingSurface } from '@/components/typing/TypingSurface'
import { FocusHeader } from '@/components/layout/FocusHeader'
import { KeyCap } from '@/components/ui/primitives'
import { accuracyOf } from '@/components/basics/keyStanding'

/** How long a finished rep stays on screen before a streak moves on by itself. */
const STREAK_PAUSE_MS = 750

export interface PracticeRunnerProps {
  /** Breadcrumb after "Basics /". */
  crumbs: ReactNode
  /** Shown as the eyebrow above each step's name, e.g. "Number row · Reps". */
  eyebrow: string
  /** The heading. Absent means each step's own name is the heading. */
  title?: string | undefined
  /** One line under the heading. */
  blurb: string
  steps: PracticeStep[]
  /**
   * Clean runs in a row each step needs before it moves on. Absent means
   * each step is typed once and you move on when you choose to.
   */
  streak?: number | undefined
  /** Where the run is saved: see `SessionRecord`. Always `kind: 'practice'`. */
  record: { trackId: string; lessonId: string; drillId: string }
  /** Where Esc leads, and "done" when there is no `next`. */
  exitTo: string
  /** Where to go after a finished run, if somewhere follows on — the next stage. */
  next?: { label: string; to: string } | undefined
  /** Keys to report on at the end, against the lifetime ledger. */
  targets?: string[]
  lifetime?: KeyLedger
}

const accuracyIn = (ledger: KeyLedger, char: string): number | null => {
  const stat = ledger[char]
  return stat === undefined || stat.pressed === 0 ? null : accuracyOf(stat)
}

const percent = (value: number | null): string =>
  value === null ? '—' : `${(value * 100).toFixed(0)}%`

/**
 * A practice run: several short passages in order, recorded as one practice
 * session at the end. Two policies, one component —
 *
 * - **once** — type each step, see how it went, then retry (R) or move on
 *   (Enter). The weak-key ladder and every key-track stage run this way.
 * - **streak** — each step repeats by itself until it has been typed `streak`
 *   times running without a miss. A miss resets the count. Every attempt
 *   counts toward the saved record, because every attempt was real practice.
 *
 * Nothing here reaches the speed graphs: the session is `kind: 'practice'`.
 */
export function PracticeRunner({
  crumbs,
  eyebrow,
  title,
  blurb,
  steps,
  streak,
  record,
  exitTo,
  next,
  targets = [],
  lifetime = {},
}: PracticeRunnerProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [totals, setTotals] = useState<RunTotals>(emptyTotals)
  const [clean, setClean] = useState(0)
  const [reps, setReps] = useState(0)
  const [summary, setSummary] = useState<RunTotals | null>(null)

  const current = steps[step] ?? steps[0]!
  const isLastStep = step === steps.length - 1
  const { compiled, state, metrics, restart, surfaceRef, onSurfaceKeyDown } = useTypingSession(
    current.passage,
    current.grammar,
  )
  const finished = state.finishedAt !== null
  const cleanRun = finished && state.errors === 0

  const finish = (final: RunTotals): void => {
    // Skipped straight through without typing: nothing happened worth saving.
    if (final.keystrokes === 0) {
      navigate(exitTo)
      return
    }
    const run = totalsMetrics(final)
    recordSession({
      id: crypto.randomUUID(),
      ...record,
      // Not tied to a catalogue language; the field exists for the shape.
      language: 'typescript',
      at: Date.now(),
      wpm: run.wpm,
      rawWpm: run.rawWpm,
      accuracy: run.accuracy,
      correctness: run.correctness,
      durationMs: run.elapsedMs,
      keyLedger: final.ledger,
      kind: 'practice',
    })
    setSummary(final)
  }

  const nextStep = (withThisRun: RunTotals): void => {
    setClean(0)
    if (isLastStep) {
      finish(withThisRun)
      return
    }
    setTotals(withThisRun)
    // The step change alone gives the typing session a new passage, which
    // resets and refocuses it (see engine/useTypingSession.ts).
    setStep((s) => s + 1)
  }

  // Once: Enter moves on, keeping this attempt. A retried attempt is thrown
  // away, the way the drill screen throws away a restarted drill.
  const advance = (): void => nextStep(addRun(totals, state, metrics))

  // Streak: every attempt is kept, clean or not, then either repeats or moves on.
  const continueStreak = (): void => {
    const withThisRun = addRun(totals, state, metrics)
    setReps((r) => r + 1)
    const count = state.errors === 0 ? clean + 1 : 0
    if (streak !== undefined && count >= streak) {
      nextStep(withThisRun)
      return
    }
    setTotals(withThisRun)
    setClean(count)
    restart()
  }

  // A finished rep waiting on the streak's pause is kept; a half-typed one is
  // dropped, the way a retried attempt is — counting its untyped remainder
  // would book every cell you never reached as a mistake.
  const skip = (): void => {
    if (finished) setReps((r) => r + 1)
    nextStep(finished ? addRun(totals, state, metrics) : totals)
    // The button keeps focus otherwise, and the next line's surface never
    // gets it: Space would press Skip again instead of typing.
    surfaceRef.current?.focus()
  }

  const again = (): void => {
    setStep(0)
    setTotals(emptyTotals())
    setClean(0)
    setReps(0)
    setSummary(null)
    restart()
  }

  // The streak's own clock. The callback is read through a ref, so the timer
  // is armed once per finished rep, not once per render.
  const continueRef = useRef(continueStreak)
  useLayoutEffect(() => {
    continueRef.current = continueStreak
  })
  useEffect(() => {
    if (streak === undefined || !finished || summary !== null) return
    const id = window.setTimeout(() => continueRef.current(), STREAK_PAUSE_MS)
    return () => window.clearTimeout(id)
  }, [streak, finished, summary])

  // Back from the summary: the surface remounts and needs focus back.
  useEffect(() => {
    if (summary === null) surfaceRef.current?.focus()
  }, [summary, surfaceRef])

  useResultKeyboardNav({
    finished: summary !== null || (streak === undefined && finished),
    onBail: () => navigate(exitTo),
    onNext: summary !== null ? () => navigate(next?.to ?? exitTo) : advance,
    onRetry: summary !== null ? again : restart,
  })

  // Announced, not shown: the visual surface already reacts to every key.
  const announcement =
    summary !== null
      ? 'Practice complete.'
      : !finished
        ? ''
        : streak === undefined
          ? 'Step done.'
          : cleanRun
            ? `Clean. ${Math.min(streak, clean + 1)} of ${streak}.`
            : 'Missed. Streak reset.'

  const header = (
    <FocusHeader
      crumbs={crumbs}
      hints={summary !== null ? ['Esc to leave'] : ['Esc to leave', 'Alt+R to restart']}
    />
  )

  if (summary !== null) {
    const run = totalsMetrics(summary)
    const missed = rankKeys(summary.ledger, 1)
      .filter((key) => key.missed > 0)
      .slice(0, 8)
    return (
      <div className="crt flex min-h-dvh flex-col">
        {header}
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        <main className="relative z-10 mx-auto flex w-full max-w-[860px] flex-1 flex-col justify-center gap-6 px-6 py-10 md:px-10">
          <div className="reveal flex flex-col gap-2.5">
            <span className="text-[10px] tracking-[0.22em] text-faint uppercase">{eyebrow}</span>
            <h1 className="font-display text-2xl font-light text-parchment md:text-3xl">
              Run complete
            </h1>
          </div>

          <div
            className="panel reveal grid grid-cols-2 gap-px bg-ink-line p-0 md:grid-cols-4"
            style={{ animationDelay: '0.05s' }}
          >
            {[
              { label: 'Speed', value: run.wpm, unit: 'wpm', tone: 'text-amber' },
              {
                label: 'Accuracy',
                value: (run.accuracy * 100).toFixed(1),
                unit: '%',
                tone: 'text-signal',
              },
              {
                label: 'Misses',
                value: run.errors,
                tone: run.errors > 0 ? 'text-fault' : 'text-ghost',
              },
              {
                label: streak === undefined ? 'Time' : 'Reps',
                value:
                  streak === undefined ? `${Math.max(1, Math.round(run.elapsedMs / 1000))}s` : reps,
                tone: 'text-amber',
              },
            ].map((tile) => (
              <div key={tile.label} className="flex flex-col gap-1.5 bg-ink-sunk px-5 py-4">
                <span className="text-[9px] tracking-[0.2em] text-faint uppercase">
                  {tile.label}
                </span>
                <span>
                  <span className={`font-display text-3xl font-light ${tile.tone}`}>
                    {tile.value}
                  </span>
                  {tile.unit !== undefined && (
                    <span className="ml-1 text-[10px] text-faint">{tile.unit}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {targets.length > 0 && (
            <section
              className="panel reveal flex flex-col gap-3 p-5"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="text-[10px] tracking-[0.18em] text-faint uppercase">
                Target keys · this run against your real drills
              </span>
              <div className="flex flex-col gap-2">
                {targets.map((char) => {
                  const now = accuracyIn(summary.ledger, char)
                  const before = accuracyIn(lifetime, char)
                  const better = now !== null && before !== null && now > before
                  return (
                    <div key={char} className="flex items-center gap-3 text-[11px]">
                      <KeyCap char={char} tone={better ? 'signal' : 'fault'} small />
                      <span className={better ? 'text-signal' : 'text-parchment'}>
                        {percent(now)}
                      </span>
                      <span className="text-faint">here · {percent(before)} in drills</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] leading-relaxed text-faint">
                Practice never certifies itself. The number that counts is the second one, and it
                only moves when you use the key in real drills.
              </p>
            </section>
          )}

          <section className="reveal flex flex-col gap-2.5" style={{ animationDelay: '0.14s' }}>
            <span className="text-[10px] tracking-[0.18em] text-faint uppercase">
              {missed.length === 0 ? 'No key missed this run' : 'Missed this run'}
            </span>
            {missed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missed.map((key) => (
                  <KeyCap key={key.char} char={key.char} tone="fault" />
                ))}
              </div>
            )}
          </section>

          <div className="reveal flex flex-wrap gap-3" style={{ animationDelay: '0.18s' }}>
            <button
              type="button"
              onClick={again}
              className="border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
            >
              Again · R
            </button>
            {next === undefined ? (
              <button
                type="button"
                onClick={() => navigate(exitTo)}
                className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
              >
                Back to Basics · Enter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate(exitTo)}
                  className="border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
                >
                  Back to Basics
                </button>
                <button
                  type="button"
                  onClick={() => navigate(next.to)}
                  className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
                >
                  {next.label} · Enter
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="crt flex min-h-dvh flex-col">
      <a
        href="#practice-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-amber focus:px-4 focus:py-2 focus:text-[11px] focus:tracking-[0.14em] focus:text-ink focus:uppercase"
      >
        Skip to typing surface
      </a>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {header}

      <main
        id="practice-main"
        tabIndex={-1}
        className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10 focus:outline-none"
      >
        <div className="reveal flex flex-col items-center gap-2.5 text-center">
          <span className="text-[10px] tracking-[0.22em] text-faint uppercase">
            {eyebrow} · Step {step + 1} of {steps.length}
          </span>
          <h1 className="font-display text-xl font-light text-parchment md:text-2xl">
            {title ?? current.name}
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-muted">{blurb}</p>
        </div>

        <ol
          className="reveal mt-6 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: '0.08s' }}
          aria-label="Steps"
        >
          {steps.map((s, i) => (
            <li
              key={`${i}-${s.name}`}
              aria-current={i === step ? 'step' : undefined}
              className={`px-3 py-1.5 text-[10px] ${
                i === step
                  ? 'bg-amber text-ink shadow-[0_0_14px_rgba(255,176,0,0.35)]'
                  : i < step
                    ? 'border border-signal-line text-signal'
                    : 'border border-ink-line text-ghost'
              }`}
            >
              {s.name}
            </li>
          ))}
        </ol>

        {streak !== undefined && (
          <div
            className="reveal mt-5 flex items-center gap-3 text-[10px] tracking-[0.16em] uppercase"
            style={{ animationDelay: '0.12s' }}
          >
            <span className="text-faint">Clean in a row</span>
            <span className="flex gap-1.5" aria-label={`${clean} of ${streak} clean`}>
              {Array.from({ length: streak }, (_, i) => {
                const lit = i < clean || (cleanRun && i === clean)
                return (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 border ${
                      lit
                        ? 'border-signal bg-signal shadow-[0_0_8px_var(--color-signal)]'
                        : finished && !cleanRun
                          ? 'border-fault-line'
                          : 'border-ink-edge'
                    }`}
                  />
                )
              })}
            </span>
            {finished && (
              <span className={cleanRun ? 'text-signal' : 'text-fault'}>
                {cleanRun ? 'Clean' : 'Missed — again from zero'}
              </span>
            )}
          </div>
        )}

        <div className="reveal mt-7 w-full" style={{ animationDelay: '0.16s' }}>
          <TypingSurface
            ref={surfaceRef}
            compiled={compiled}
            entries={state.entries}
            cursor={state.cursor}
            onKeyDown={onSurfaceKeyDown}
          />
        </div>

        {streak === undefined && finished ? (
          <div className="panel reveal mt-7 flex w-full flex-wrap items-center justify-between gap-5 p-6">
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="font-display text-lg text-signal">Step done</span>
              <span className="text-[11px] text-muted">
                {metrics.wpm} wpm · {(metrics.accuracy * 100).toFixed(0)}% accurate
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
              >
                Retry · R
              </button>
              <button
                type="button"
                onClick={advance}
                className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
              >
                {isLastStep ? 'Finish · Enter' : 'Next step · Enter'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-3 text-[10px] text-faint">
            <span>
              {metrics.wpm} wpm · {(metrics.accuracy * 100).toFixed(0)}% accurate
              {streak !== undefined && reps > 0 && ` · ${reps} ${reps === 1 ? 'rep' : 'reps'}`}
            </span>
            {streak !== undefined && (
              <button
                type="button"
                onClick={skip}
                className="tracking-[0.16em] uppercase hover:text-parchment"
              >
                {isLastStep ? 'Finish here' : 'Skip this line'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
