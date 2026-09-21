import { isPracticableKey } from '@/engine/keys'
import type { KeyLedger, KeyStat } from '@/engine/types'
import { frequencyPer1000 } from './corpusFrequency'

/**
 * Additive (Laplace) smoothing on the miss rate, so a key touched once or
 * twice doesn't swing straight to 0% or 100% — the smoothed rate moves
 * toward the true rate as evidence accumulates instead of overreacting to
 * the first press or two.
 */
const SMOOTHING = 1

export function smoothedErrorRate(stat: Pick<KeyStat, 'pressed' | 'missed'> | undefined): number {
  const pressed = stat?.pressed ?? 0
  const missed = stat?.missed ?? 0
  return (missed + SMOOTHING) / (pressed + 2 * SMOOTHING)
}

export interface PracticeCandidate {
  char: string
  pressed: number
  missed: number
  /** 0-1, Laplace-smoothed. */
  smoothedRate: number
  /** Occurrences per 1000 typed characters across the whole catalogue. */
  frequencyPer1000: number
  /**
   * `smoothedRate × frequencyPer1000` — expected misses per 1000 typed
   * characters. Ranking by raw error rate alone rewards fixing a key that
   * is simply rare; this is "what is worth my next ten minutes" instead of
   * "what is my worst percentage" (see #6).
   */
  expectedMissesPer1000: number
}

/**
 * Every key worth considering for practice, ranked by expected cost —
 * worst first. Keys touched too rarely to say anything honest are excluded
 * the same way `troubleKeys` excludes them, just at a lower bar: smoothing
 * already guards against a one-off miss swinging the rate, so this only
 * needs enough presses to trust the corpus-frequency multiplication.
 *
 * Keys a generated passage cannot drill — the line break and the space — are
 * excluded here rather than at each call site, so every caller (the Practice
 * route, the nudge at the end of a drill) gets the same answer. The line
 * break would otherwise rank near the top on frequency alone: `compileDrill`
 * emits one per line.
 */
export function rankForPractice(ledger: KeyLedger, minimumPresses = 5): PracticeCandidate[] {
  return Object.entries(ledger)
    .filter(([char, stat]) => isPracticableKey(char) && stat.pressed >= minimumPresses)
    .map(([char, stat]) => {
      const smoothedRate = smoothedErrorRate(stat)
      const freq = frequencyPer1000(char)
      return {
        char,
        pressed: stat.pressed,
        missed: stat.missed,
        smoothedRate,
        frequencyPer1000: freq,
        expectedMissesPer1000: smoothedRate * freq,
      }
    })
    .sort((a, b) => b.expectedMissesPer1000 - a.expectedMissesPer1000)
}
