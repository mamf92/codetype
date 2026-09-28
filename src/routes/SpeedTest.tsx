import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SPEED_TEST_TRACK_ID, speedTestById } from '@/content/speed/index'
import { SPEED_GROUP_TITLES, type SpeedTest as SpeedTestContent } from '@/content/speed/schema'
import { compileDrill } from '@/engine/compile'
import { rankKeys } from '@/engine/metrics'
import {
  currentPassage,
  initialSpeedTest,
  reduceSpeedTest,
  remainingMs,
  speedTestMetrics,
  type SpeedTestAction,
  type SpeedTestPlan,
  type SpeedTestState,
} from '@/engine/speedTest'
import { surfaceAction, useSurfaceFocus } from '@/engine/useTypingSession'
import { speedTestStanding, type SpeedTestStanding } from '@/store/progress'
import { recordSession, useProgress } from '@/store/useProgress'
import { useResultKeyboardNav } from '@/lib/useResultKeyboardNav'
import { clockTime, sprintTime } from '@/lib/duration'
import { BASICS_PATH } from '@/lib/paths'
import { FocusHeader } from '@/components/layout/FocusHeader'
import { TypingSurface } from '@/components/typing/TypingSurface'
import { KeyCap, Meter } from '@/components/ui/primitives'

/** How often the clock on screen refreshes, and the deadline is checked. */
const TICK_MS = 100

/** Under this long left, the countdown turns red. */
const HURRY_MS = 10_000

const primary =
  'bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft'
const quiet =
  'border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber'

export default function SpeedTest() {
  const { testId } = useParams()
  const test = testId === undefined ? undefined : speedTestById(testId)
  if (test === undefined) return <Navigate to={BASICS_PATH} replace />
  // A different test is a different run, never a continuation.
  return <SpeedTestRunner key={test.id} test={test} />
}

/**
 * Whether this run beats what was on record before it started. A sprint is
 * ranked on time, and only a clean run has a time worth ranking; a timed test
 * always runs the same length, so it is ranked on wpm.
 */
function beatsRecord(
  sprint: boolean,
  before: SpeedTestStanding,
  run: { wpm: number; ms: number; clean: boolean },
): boolean {
  if (sprint) return run.clean && (before.fastestCleanMs === null || run.ms < before.fastestCleanMs)
  return run.wpm > before.bestWpm
}

function SpeedTestRunner({ test }: { test: SpeedTestContent }) {
  const navigate = useNavigate()
  const progress = useProgress()
  const sprint = test.seconds === undefined

  const plan = useMemo<SpeedTestPlan>(
    () => ({
      pool: test.passages.map((passage) => compileDrill(passage.text, passage.grammar)),
      durationMs: test.seconds === undefined ? null : test.seconds * 1000,
    }),
    [test],
  )
  const reducer = useCallback(
    (state: SpeedTestState, action: SpeedTestAction) => reduceSpeedTest(plan, state, action),
    [plan],
  )
  const [state, dispatch] = useReducer(reducer, undefined, () => initialSpeedTest(plan, Date.now()))

  // What was on record when this attempt began, so the result can say "new
  // best" about the run it shows rather than the run it has just saved.
  const [before, setBefore] = useState(() => speedTestStanding(progress, test.id))

  const running = state.startedAt !== null && state.finishedAt === null
  const finished = state.finishedAt !== null

  // The wall clock. The reducer owns the deadline; this only tells it the time.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const at = Date.now()
      setNow(at)
      dispatch({ type: 'tick', at })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [running])

  const metrics = speedTestMetrics(plan, state, now)
  const remaining = remainingMs(plan, state, now)

  // Save each finished run once, even under StrictMode's doubled effects.
  // A run is identified by its first keystroke.
  const saved = useRef<number | null>(null)
  useEffect(() => {
    if (state.finishedAt === null || state.startedAt === null) return
    if (saved.current === state.startedAt || state.totals.keystrokes === 0) return
    saved.current = state.startedAt
    const result = speedTestMetrics(plan, state, state.finishedAt)
    recordSession({
      id: crypto.randomUUID(),
      trackId: SPEED_TEST_TRACK_ID,
      lessonId: test.id,
      drillId: test.id,
      // Text tests have no language; the field exists for the shape.
      language: test.language ?? 'typescript',
      at: Date.now(),
      wpm: result.wpm,
      rawWpm: result.rawWpm,
      accuracy: result.accuracy,
      correctness: result.correctness,
      durationMs: result.elapsedMs,
      keyLedger: state.totals.ledger,
      kind: 'test',
    })
  }, [plan, state, test])

  const surfaceRef = useRef<HTMLDivElement>(null)
  useSurfaceFocus(surfaceRef, `${state.seed}:${finished}`)

  const again = (): void => {
    setBefore(speedTestStanding(progress, test.id))
    dispatch({ type: 'restart', seed: Date.now() })
    surfaceRef.current?.focus()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const action = surfaceAction(event)
    if (action === null) return
    // Alt+R starts the whole test again, clock and all — not just the passage.
    if (action.type === 'reset') again()
    else dispatch(action)
  }

  useResultKeyboardNav({
    finished,
    onBail: () => navigate(BASICS_PATH),
    onNext: () => navigate(BASICS_PATH),
    onRetry: again,
  })

  const header = (
    <FocusHeader
      crumbs={
        <>
          <span className="truncate text-muted">Speed test</span>
          <span className="text-ink-line">/</span>
          <span className="truncate">{test.title}</span>
        </>
      }
      hints={finished ? ['Esc to leave'] : ['Esc to leave', 'Alt+R to restart']}
    />
  )
  const eyebrow = `Speed test · ${SPEED_GROUP_TITLES[test.group]}`

  if (finished) {
    const clean = metrics.correctness >= 1
    const best = beatsRecord(sprint, before, {
      wpm: metrics.wpm,
      ms: metrics.elapsedMs,
      clean,
    })
    const previous = sprint
      ? before.fastestCleanMs === null
        ? null
        : sprintTime(before.fastestCleanMs)
      : before.runs === 0
        ? null
        : `${before.bestWpm} wpm`
    const missed = rankKeys(state.totals.ledger, 1)
      .filter((key) => key.missed > 0)
      .slice(0, 8)
    const wrongLeft = state.totals.cells - state.totals.correctChars

    return (
      <div className="crt flex min-h-dvh flex-col">
        {header}
        <div aria-live="polite" className="sr-only">
          {sprint
            ? `Done. ${sprintTime(metrics.elapsedMs)}, ${metrics.wpm} words per minute.`
            : `Time. ${metrics.wpm} words per minute.`}
        </div>
        <main className="relative z-10 mx-auto flex w-full max-w-[860px] flex-1 flex-col justify-center gap-6 px-6 py-10 md:px-10">
          <div className="reveal flex flex-col gap-2.5">
            <span className="text-[10px] tracking-[0.22em] text-faint uppercase">{eyebrow}</span>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="font-display text-2xl font-light text-parchment md:text-3xl">
                {test.title}
              </h1>
              {best && (
                <span className="border border-signal-line px-3 py-1 text-[10px] tracking-[0.18em] text-signal uppercase">
                  {previous === null ? 'First on record' : 'New best'}
                </span>
              )}
            </div>
          </div>

          <div
            className="panel reveal grid grid-cols-2 gap-px bg-ink-line p-0 md:grid-cols-4"
            style={{ animationDelay: '0.05s' }}
          >
            {[
              sprint
                ? { label: 'Time', value: sprintTime(metrics.elapsedMs), tone: 'text-amber' }
                : { label: 'Speed', value: metrics.wpm, unit: 'wpm', tone: 'text-amber' },
              sprint
                ? { label: 'Speed', value: metrics.wpm, unit: 'wpm', tone: 'text-amber-soft' }
                : { label: 'Time', value: clockTime(metrics.elapsedMs), tone: 'text-amber-soft' },
              {
                label: 'Accuracy',
                value: (metrics.accuracy * 100).toFixed(1),
                unit: '%',
                tone: 'text-signal',
              },
              {
                label: 'Misses',
                value: metrics.errors,
                tone: metrics.errors > 0 ? 'text-fault' : 'text-ghost',
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

          <div
            className="reveal flex flex-col gap-1.5 text-[11px] text-muted"
            style={{ animationDelay: '0.1s' }}
          >
            {previous !== null && (
              <span>
                Best before this run: <span className="text-parchment">{previous}</span>
              </span>
            )}
            {!sprint && (
              <span>
                {metrics.correctChars} characters right, {metrics.rawWpm} wpm raw.
              </span>
            )}
            {sprint && !clean && (
              <span className="text-fault">
                {wrongLeft} {wrongLeft === 1 ? 'character' : 'characters'} left wrong — a time only
                counts toward your best when every character ends right. Backspace is allowed.
              </span>
            )}
          </div>

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
            <button type="button" onClick={again} className={quiet}>
              Again · R
            </button>
            <Link to="/statistics" className={quiet}>
              Statistics
            </Link>
            <button type="button" onClick={() => navigate(BASICS_PATH)} className={primary}>
              Back to Basics · Enter
            </button>
          </div>
        </main>
      </div>
    )
  }

  const hurry = remaining !== null && running && remaining <= HURRY_MS
  return (
    <div className="crt flex min-h-dvh flex-col">
      <a
        href="#speed-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-amber focus:px-4 focus:py-2 focus:text-[11px] focus:tracking-[0.14em] focus:text-ink focus:uppercase"
      >
        Skip to typing surface
      </a>
      {header}

      <main
        id="speed-main"
        tabIndex={-1}
        className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10 focus:outline-none"
      >
        <div className="reveal flex flex-col items-center gap-2.5 text-center">
          <span className="text-[10px] tracking-[0.22em] text-faint uppercase">{eyebrow}</span>
          <h1 className="font-display text-xl font-light text-parchment md:text-2xl">
            {test.title}
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-muted">{test.summary}</p>
        </div>

        <div
          className="reveal mt-7 flex w-full max-w-md flex-col gap-3"
          style={{ animationDelay: '0.08s' }}
        >
          <div className="flex items-end justify-between gap-6">
            <span>
              <span className="block text-[9px] tracking-[0.2em] text-faint uppercase">
                {remaining === null ? 'Time' : 'Left'}
              </span>
              <span
                className={`font-display text-4xl font-light tabular-nums ${
                  hurry ? 'text-fault' : 'text-amber'
                }`}
              >
                {remaining === null ? sprintTime(metrics.elapsedMs) : clockTime(remaining)}
              </span>
            </span>
            <span className="flex gap-6 text-right">
              <span>
                <span className="block text-[9px] tracking-[0.2em] text-faint uppercase">wpm</span>
                <span className="font-display text-xl font-light text-parchment tabular-nums">
                  {metrics.wpm}
                </span>
              </span>
              <span>
                <span className="block text-[9px] tracking-[0.2em] text-faint uppercase">
                  Accuracy
                </span>
                <span className="font-display text-xl font-light text-parchment tabular-nums">
                  {(metrics.accuracy * 100).toFixed(0)}%
                </span>
              </span>
            </span>
          </div>
          {plan.durationMs !== null && remaining !== null && (
            <Meter
              fraction={1 - remaining / plan.durationMs}
              tone={hurry ? 'var(--color-fault)' : 'var(--color-amber)'}
            />
          )}
        </div>

        <div className="reveal mt-7 w-full" style={{ animationDelay: '0.16s' }}>
          <TypingSurface
            ref={surfaceRef}
            compiled={currentPassage(plan, state)}
            entries={state.session.entries}
            cursor={state.session.cursor}
            onKeyDown={onKeyDown}
          />
        </div>

        <p className="mt-6 text-[10px] text-faint">
          {state.startedAt === null
            ? 'The clock starts on your first key.'
            : sprint
              ? 'Every character has to end right for the time to count. Backspace is allowed.'
              : `Passage ${state.index + 1} · the next one loads as you finish this one.`}
        </p>
      </main>
    </div>
  )
}
