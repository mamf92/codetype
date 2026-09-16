import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTypingSession } from '@/engine/useTypingSession'
import { TypingSurface } from '@/components/typing/TypingSurface'
import { recordSession, startKeyProbation, useProgress } from '@/store/useProgress'
import { lifetimeLedger } from '@/store/progress'
import { meanLatency, ownBaselineLatencyMs } from '@/engine/metrics'
import { confusionPairFor } from '@/engine/practice/ranking'
import {
  generateContext,
  generateDiscrimination,
  generateInterference,
  generateIsolation,
  transferDrills,
} from '@/engine/practice/generators'
import type { LevelAttempt } from '@/engine/practice/mastery'
import { passesLevel } from '@/engine/practice/mastery'
import NotFound from './NotFound'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Isolation',
  2: 'Discrimination',
  3: 'Interference',
  4: 'Context',
  5: 'Transfer',
}

export default function Practice() {
  const { char: encoded } = useParams()
  const char = encoded === undefined ? undefined : decodeURIComponent(encoded)
  const navigate = useNavigate()
  const progress = useProgress()

  const ledger = useMemo(() => lifetimeLedger(progress), [progress])
  const baseline = useMemo(() => ownBaselineLatencyMs(ledger), [ledger])
  const pair = char === undefined ? undefined : confusionPairFor(ledger, char)

  // Levels 2 and 3 need a real confusable pair to mean anything; without
  // one (not enough evidence yet in the ledger) they're skipped rather than
  // silently drilling something that isn't discrimination or interference.
  const sequence = useMemo(() => (pair === undefined ? [1, 4, 5] : [1, 2, 3, 4, 5]), [pair])
  const [step, setStep] = useState(0)
  const level = sequence[step] ?? 1

  // Level 5 offers up to three real drills; retrying cycles to the next one
  // rather than repeating the same passage.
  const transferOptions = useMemo(() => (char === undefined ? [] : transferDrills(char, 3)), [char])
  const [transferIndex, setTransferIndex] = useState(0)

  const passage = useMemo(() => {
    if (char === undefined) return ''
    switch (level) {
      case 1:
        return generateIsolation(char)
      case 2:
        return pair === undefined ? generateIsolation(char) : generateDiscrimination(char, pair)
      case 3:
        // Simplified: interferes the pair against itself rather than a
        // truly different previously-practiced pair, which needs a queue of
        // keys practiced together that a single-key entry point doesn't
        // have. Degrades gracefully to level 2's pattern — see generators.ts.
        return pair === undefined
          ? generateIsolation(char)
          : generateInterference([char, pair], [char, pair])
      case 4:
        return generateContext(char)
      default:
        return (
          transferOptions[transferIndex % Math.max(1, transferOptions.length)]?.code ??
          generateContext(char)
        )
    }
  }, [char, level, pair, transferOptions, transferIndex])

  const { compiled, state, metrics, restart } = useTypingSession(passage, 'typescript')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') navigate('/statistics')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  // Derived during render rather than in an effect — React's own
  // "adjusting state" pattern (see the equivalent in Drill.tsx) — so the
  // pass/fail verdict lands in the render that finished the attempt, and
  // resets to 'pending' the instant `restart()` clears `finishedAt` again
  // without needing a matching setState call at every call site that resets.
  const [outcome, setOutcome] = useState<{
    finishedAt: number | null
    result: 'pending' | 'passed' | 'failed'
  }>({ finishedAt: null, result: 'pending' })
  if (outcome.finishedAt !== state.finishedAt) {
    if (state.finishedAt === null) {
      setOutcome({ finishedAt: null, result: 'pending' })
    } else {
      const stat = char === undefined ? undefined : state.keyLedger[char]
      const attempt: LevelAttempt = {
        pressed: stat?.pressed ?? 0,
        missed: stat?.missed ?? 0,
        meanLatencyMs: stat === undefined ? null : meanLatency(stat),
      }
      setOutcome({
        finishedAt: state.finishedAt,
        result: passesLevel(attempt, baseline) ? 'passed' : 'failed',
      })
    }
  }
  const result = outcome.result

  if (char === undefined) return <NotFound />

  const finished = state.finishedAt !== null
  const isLastLevel = step === sequence.length - 1

  const retry = (): void => {
    if (level === 5) setTransferIndex((i) => i + 1)
    restart()
  }

  const advance = (): void => {
    if (!isLastLevel) {
      setStep((s) => s + 1)
      restart()
      return
    }
    recordSession({
      id: crypto.randomUUID(),
      trackId: 'practice',
      lessonId: 'practice',
      drillId: `practice-${char}`,
      // Practice isn't tied to a real catalogue language; the field exists
      // for SessionRecord's shape, not to imply this was a TypeScript drill.
      language: 'typescript',
      at: Date.now(),
      wpm: metrics.wpm,
      rawWpm: metrics.rawWpm,
      accuracy: metrics.accuracy,
      correctness: metrics.correctness,
      durationMs: metrics.elapsedMs,
      keyLedger: state.keyLedger,
      kind: 'practice',
    })
    startKeyProbation(char)
    navigate('/statistics')
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
          <span className="truncate text-[11px] text-parchment">
            key {char === ' ' ? 'space' : char}
          </span>
        </div>
        <div className="hidden shrink-0 items-center gap-4.5 text-[10px] tracking-[0.14em] text-faint uppercase sm:flex">
          <span>Esc to bail</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10">
        <div className="reveal flex flex-col items-center gap-2.5 text-center">
          <span className="text-[10px] tracking-[0.22em] text-faint uppercase">
            Level {level} of 5 · step {step + 1} of {sequence.length}
          </span>
          <h1 className="font-display text-xl font-light text-parchment md:text-2xl">
            {LEVEL_NAMES[level]}
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-muted">
            {level === 1 && `Isolating the reach for "${char === ' ' ? 'space' : char}".`}
            {level === 2 && pair !== undefined && `Telling "${char}" and "${pair}" apart.`}
            {level === 3 && pair !== undefined && `"${char}" and "${pair}" under competition.`}
            {level === 4 &&
              `"${char === ' ' ? 'space' : char}" inside real shapes, still synthetic.`}
            {level === 5 && 'Proving it in a real passage from the catalogue.'}
          </p>
        </div>

        <div className="reveal mt-8 w-full">
          <TypingSurface compiled={compiled} entries={state.entries} cursor={state.cursor} />
        </div>

        {finished && (
          <div
            className="panel reveal mt-7 flex w-full flex-wrap items-center justify-between gap-5 p-6"
            style={{ animationDelay: '0.05s' }}
          >
            <div className="flex flex-wrap items-baseline gap-4">
              <span
                className={`font-display text-lg ${result === 'passed' ? 'text-signal' : 'text-fault'}`}
              >
                {result === 'passed' ? 'Level cleared' : 'Not yet'}
              </span>
              <span className="text-[11px] text-muted">
                {(state.keyLedger[char]?.pressed ?? 0) - (state.keyLedger[char]?.missed ?? 0)} /{' '}
                {state.keyLedger[char]?.pressed ?? 0} on &quot;{char === ' ' ? 'space' : char}&quot;
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={retry}
                className="border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
              >
                Retry
              </button>
              {result === 'passed' && (
                <button
                  type="button"
                  onClick={advance}
                  className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
                >
                  {isLastLevel ? 'Finish · on probation next' : 'Next level'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
