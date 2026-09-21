import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTypingSession } from '@/engine/useTypingSession'
import { TypingSurface } from '@/components/typing/TypingSurface'
import { recordSession, useProgress } from '@/store/useProgress'
import { lifetimeLedger } from '@/store/progress'
import { mergeLedgers } from '@/engine/metrics'
import type { KeyLedger } from '@/engine/types'
import { rankForPractice } from '@/engine/practice/ranking'
import {
  generateWeakKeyPractice,
  MAX_PRACTICE_KEYS,
  WEAK_KEY_STEP_NAMES,
} from '@/engine/practice/weakKeys'
import { useResultKeyboardNav } from '@/lib/useResultKeyboardNav'
import { KeyCap } from '@/components/ui/primitives'

export default function Practice() {
  const navigate = useNavigate()
  const progress = useProgress()

  // Snapshotted once on entry, not re-derived as this session's own presses
  // land — the set being practiced shouldn't shift mid-session (a real drill
  // is excluded from this anyway; `lifetimeLedger` only ever sees `kind:
  // 'drill'` sessions, see src/store/progress.ts).
  const [ledger] = useState<KeyLedger>(() => lifetimeLedger(progress))

  // `rankForPractice` has already dropped the keys a generated passage can't
  // drill — the space and the line break (see src/engine/keys.ts).
  const chars = useMemo(
    () =>
      rankForPractice(ledger)
        .slice(0, MAX_PRACTICE_KEYS)
        .map((key) => key.char),
    [ledger],
  )
  const passages = useMemo(() => generateWeakKeyPractice(chars), [chars])

  const [step, setStep] = useState(0)
  const passage = passages[step] ?? ''
  const isLastStep = step === passages.length - 1

  const { compiled, state, metrics, restart, surfaceRef, onSurfaceKeyDown } = useTypingSession(
    passage,
    'typescript',
  )

  // Accumulates what's typed across steps so the one recorded session
  // reflects all five, not just the last — each step is its own compiled
  // drill, so `state` resets between them.
  const [accumulated, setAccumulated] = useState<{ ledger: KeyLedger; durationMs: number }>({
    ledger: {},
    durationMs: 0,
  })

  const finished = state.finishedAt !== null

  const retry = (): void => restart()

  const advance = (): void => {
    const merged = {
      ledger: mergeLedgers(accumulated.ledger, state.keyLedger),
      durationMs: accumulated.durationMs + metrics.elapsedMs,
    }
    if (!isLastStep) {
      // No explicit restart: the step change alone gives `useTypingSession` a
      // new `compiled` passage, which already resets state and refocuses the
      // surface (see the `[compiled]` effects in engine/useTypingSession.ts).
      setAccumulated(merged)
      setStep((s) => s + 1)
      return
    }
    recordSession({
      id: crypto.randomUUID(),
      trackId: 'practice',
      lessonId: 'practice',
      drillId: `practice-${chars.join('')}`,
      // Practice isn't tied to a real catalogue language; the field exists
      // for SessionRecord's shape, not to imply this was a TypeScript drill.
      language: 'typescript',
      at: Date.now(),
      wpm: metrics.wpm,
      rawWpm: metrics.rawWpm,
      accuracy: metrics.accuracy,
      correctness: metrics.correctness,
      durationMs: merged.durationMs,
      keyLedger: merged.ledger,
      kind: 'practice',
    })
    navigate('/statistics')
  }

  useResultKeyboardNav({
    finished,
    onBail: () => navigate('/statistics'),
    onNext: advance,
    onRetry: retry,
  })

  if (chars.length === 0) {
    return (
      <div className="crt flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-xl font-light text-parchment">Nothing to practice yet</h1>
        <p className="max-w-sm text-[11px] leading-relaxed text-muted">
          Weak keys are found from real drills. Type a few passages and the keys giving you trouble
          will show up here.
        </p>
        <Link
          to="/explore"
          className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
        >
          Find a drill
        </Link>
      </div>
    )
  }

  return (
    <div className="crt flex min-h-dvh flex-col">
      <header className="relative z-10 flex h-[68px] items-center justify-between gap-4 border-b border-ink-line px-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link to="/" className="font-display text-[15px] font-semibold text-amber">
            CODETYPE
          </Link>
          <span className="text-ink-line">/</span>
          <Link to="/statistics" className="truncate text-[11px] text-muted hover:text-parchment">
            Practice
          </Link>
          <span className="text-ink-line">/</span>
          <span className="flex items-center gap-1.5">
            {chars.map((char) => (
              <KeyCap key={char} char={char} tone="fault" small />
            ))}
          </span>
        </div>
        <div className="hidden shrink-0 items-center gap-4.5 text-[10px] tracking-[0.14em] text-faint uppercase sm:flex">
          <span>Esc to bail</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10">
        <div className="reveal flex flex-col items-center gap-2.5 text-center">
          <span className="text-[10px] tracking-[0.22em] text-faint uppercase">
            Step {step + 1} of {passages.length}
          </span>
          <h1 className="font-display text-xl font-light text-parchment md:text-2xl">
            {WEAK_KEY_STEP_NAMES[step] ?? WEAK_KEY_STEP_NAMES[0]}
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-muted">
            No pass or fail here — just reps on the keys giving you trouble.
          </p>
        </div>

        <div className="reveal mt-8 w-full">
          <TypingSurface
            ref={surfaceRef}
            compiled={compiled}
            entries={state.entries}
            cursor={state.cursor}
            onKeyDown={onSurfaceKeyDown}
          />
        </div>

        {finished && (
          <div
            className="panel reveal mt-7 flex w-full flex-wrap items-center justify-between gap-5 p-6"
            style={{ animationDelay: '0.05s' }}
          >
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="font-display text-lg text-signal">Step done</span>
              <span className="text-[11px] text-muted">
                {metrics.wpm} wpm · {(metrics.accuracy * 100).toFixed(0)}% accurate
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={retry}
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
        )}
      </div>
    </div>
  )
}
