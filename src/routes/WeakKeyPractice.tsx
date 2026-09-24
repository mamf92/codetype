import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useProgress } from '@/store/useProgress'
import { lifetimeLedger } from '@/store/progress'
import type { KeyLedger } from '@/engine/types'
import { isPracticableKey } from '@/engine/keys'
import { rankForPractice } from '@/engine/practice/ranking'
import {
  CLEAN_STREAK,
  isWeakKeyMode,
  MAX_PRACTICE_KEYS,
  practiceTargets,
  WEAK_KEY_MODES,
  weakKeySteps,
} from '@/engine/practice/weakKeys'
import { PracticeRunner } from '@/components/practice/PracticeRunner'
import { KeyCap } from '@/components/ui/primitives'
import { BASICS_PATH } from '@/lib/paths'

export default function WeakKeyPractice() {
  const { mode } = useParams()
  const [params] = useSearchParams()
  const progress = useProgress()

  // Snapshotted once on entry, not re-derived as this run's own presses land
  // — the set being practiced shouldn't shift mid-run. Practice sessions
  // never reach `lifetimeLedger` anyway (see src/store/progress.ts).
  const [ledger] = useState<KeyLedger>(() => lifetimeLedger(progress))

  const requested = params.get('keys')
  const chars = useMemo(() => {
    // A chosen key comes from a click on the Basics page; the ranked set is
    // the default. `Array.from` splits by code point, so a non-BMP character
    // can't be torn in half.
    const pool =
      requested !== null
        ? Array.from(requested).filter(isPracticableKey)
        : rankForPractice(ledger).map((key) => key.char)
    return [...new Set(pool)].slice(0, MAX_PRACTICE_KEYS)
  }, [requested, ledger])

  const targets = useMemo(() => practiceTargets(chars, ledger), [chars, ledger])
  const steps = useMemo(
    () => (isWeakKeyMode(mode) ? weakKeySteps(mode, targets) : []),
    [mode, targets],
  )

  if (!isWeakKeyMode(mode)) return <Navigate to={BASICS_PATH} replace />

  if (steps.length === 0) {
    return (
      <div className="crt flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-xl font-light text-parchment">Nothing to practice yet</h1>
        <p className="max-w-sm text-[11px] leading-relaxed text-muted">
          Weak keys are found from real drills. Type a few passages and the keys giving you trouble
          will show up here — or warm up on a key track in the meantime.
        </p>
        <div className="flex gap-3">
          <Link
            to={BASICS_PATH}
            className="border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
          >
            Back to Basics
          </Link>
          <Link
            to="/explore"
            className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
          >
            Find a drill
          </Link>
        </div>
      </div>
    )
  }

  const meta = WEAK_KEY_MODES[mode]
  return (
    <PracticeRunner
      // A different mode or key set is a different run, never a continuation.
      key={`${mode}:${chars.join('')}`}
      crumbs={
        <>
          <span className="truncate">{meta.title}</span>
          <span className="flex items-center gap-1.5">
            {chars.map((char) => (
              <KeyCap key={char} char={char} tone="fault" small />
            ))}
          </span>
        </>
      }
      eyebrow={`Weak keys · ${meta.title}`}
      blurb={
        mode === 'ladder'
          ? 'No pass or fail — reps on the keys giving you trouble, from the bare reach up to real code.'
          : `Type the line ${CLEAN_STREAK} times running without a miss. A slip resets the count; the line comes back by itself.`
      }
      steps={steps}
      streak={mode === 'streak' ? CLEAN_STREAK : undefined}
      record={{ trackId: 'practice', lessonId: `practice-${mode}`, drillId: `practice-${mode}` }}
      exitTo={BASICS_PATH}
      targets={chars}
      lifetime={ledger}
    />
  )
}
