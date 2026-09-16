import type { KeyLedger } from '@/engine/types'

/** A level passes on target-key accuracy and not hesitating over it. */
export interface LevelAttempt {
  pressed: number
  missed: number
  /** Mean latency in ms for the target character during this attempt. */
  meanLatencyMs: number | null
}

const MASTERY_ACCURACY = 0.95
const LATENCY_TOLERANCE = 1.25

/**
 * A level passes on target-key accuracy ≥95% **and** latency within 1.25×
 * your own median — not on overall accuracy, which is dominated by the easy
 * characters around the target, and not on accuracy alone, since a key hit
 * correctly after a long pause still costs real speed. `ownMedianLatencyMs`
 * is null until there's a baseline to judge hesitation against, in which
 * case only the accuracy bar applies.
 */
export function passesLevel(attempt: LevelAttempt, ownMedianLatencyMs: number | null): boolean {
  if (attempt.pressed === 0) return false
  const accuracy = (attempt.pressed - attempt.missed) / attempt.pressed
  if (accuracy < MASTERY_ACCURACY) return false
  if (ownMedianLatencyMs === null || attempt.meanLatencyMs === null) return true
  return attempt.meanLatencyMs <= ownMedianLatencyMs * LATENCY_TOLERANCE
}

export type ProbationStatus = 'probation' | 'graduated'

/**
 * Mastery never certifies itself. Passing all five levels puts a key on
 * probation rather than marking it done: it's judged on its next ~30
 * presses in *ordinary drills*, not practice conditions — a mechanical
 * version of "go back to real code and see what shows up". Clear that and
 * it graduates, re-checked on a widening Leitner interval; fail it and it
 * drops back to needing practice, which the normal ranking will surface on
 * its own since a key off probation is just a key in the ledger again.
 */
export interface KeyProbation {
  char: string
  status: ProbationStatus
  /** Epoch ms this probation, or the current graduated interval, started. */
  since: number
  /** This key's lifetime `pressed`/`missed` when the current window started. */
  pressedAtStart: number
  missedAtStart: number
  /** Leitner box: widens by one on each successful re-check. */
  box: number
  /** Epoch ms of the next scheduled re-check. Null while still on probation. */
  nextCheckAt: number | null
}

const DAY_MS = 86_400_000
/** Widening re-check schedule once a key graduates, in days. */
export const LEITNER_INTERVAL_DAYS = [1, 3, 7, 14, 30, 90] as const
const PROBATION_PRESS_WINDOW = 30
const PROBATION_ACCURACY = 0.95

const intervalForBox = (box: number): number =>
  LEITNER_INTERVAL_DAYS[Math.min(box, LEITNER_INTERVAL_DAYS.length - 1)] ?? 90

/** A key that just passed all five practice levels. */
export function startProbation(char: string, ledger: KeyLedger, now: number): KeyProbation {
  const stat = ledger[char]
  return {
    char,
    status: 'probation',
    since: now,
    pressedAtStart: stat?.pressed ?? 0,
    missedAtStart: stat?.missed ?? 0,
    box: 0,
    nextCheckAt: null,
  }
}

/**
 * Probationary keys are ready once ~30 new presses have landed in the
 * ledger since probation started; graduated keys are ready once their
 * Leitner interval has passed.
 */
export function isReadyToCheck(probation: KeyProbation, ledger: KeyLedger, now: number): boolean {
  if (probation.status === 'probation') {
    const pressed = ledger[probation.char]?.pressed ?? 0
    return pressed - probation.pressedAtStart >= PROBATION_PRESS_WINDOW
  }
  return probation.nextCheckAt !== null && now >= probation.nextCheckAt
}

/**
 * Judges the window since `probation` last started, and either widens the
 * interval (a pass — the key graduates the first time this happens) or
 * returns `undefined` (a fail — the key drops off probation and goes back
 * to needing practice). Call only once `isReadyToCheck` is true.
 */
export function recheckProbation(
  probation: KeyProbation,
  ledger: KeyLedger,
  now: number,
): KeyProbation | undefined {
  const stat = ledger[probation.char]
  const pressed = (stat?.pressed ?? 0) - probation.pressedAtStart
  const missed = (stat?.missed ?? 0) - probation.missedAtStart
  const accuracy = pressed > 0 ? (pressed - missed) / pressed : 0
  if (accuracy < PROBATION_ACCURACY) return undefined

  const box = probation.box + 1
  return {
    char: probation.char,
    status: 'graduated',
    since: now,
    pressedAtStart: stat?.pressed ?? 0,
    missedAtStart: stat?.missed ?? 0,
    box,
    nextCheckAt: now + intervalForBox(box) * DAY_MS,
  }
}
