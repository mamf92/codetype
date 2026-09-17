import type { KeyLedger, Metrics, SessionState } from './types'

/** Words-per-minute is characters-per-minute over five. The usual convention. */
const CHARS_PER_WORD = 5

export function computeMetrics(state: SessionState, now: number): Metrics {
  const correctChars = state.entries.filter((entry) => entry === 'correct').length
  const total = state.entries.length

  const elapsedMs =
    state.startedAt === null ? 0 : Math.max(0, (state.finishedAt ?? now) - state.startedAt)
  const minutes = elapsedMs / 60_000

  const perMinute = (chars: number): number =>
    minutes > 0 ? Math.round(chars / CHARS_PER_WORD / minutes) : 0

  return {
    elapsedMs,
    wpm: perMinute(correctChars),
    rawWpm: perMinute(state.keystrokes),
    accuracy: state.keystrokes > 0 ? (state.keystrokes - state.errors) / state.keystrokes : 1,
    correctness: total > 0 ? correctChars / total : 1,
    keystrokes: state.keystrokes,
    errors: state.errors,
    correctChars,
  }
}

function mergeCounts(
  base: Record<string, number>,
  addition: Record<string, number>,
): Record<string, number> {
  const merged = { ...base }
  for (const [key, count] of Object.entries(addition)) merged[key] = (merged[key] ?? 0) + count
  return merged
}

export function mergeLedgers(base: KeyLedger, addition: KeyLedger): KeyLedger {
  const merged: KeyLedger = { ...base }
  for (const [char, entry] of Object.entries(addition)) {
    const existing = merged[char] ?? {
      pressed: 0,
      missed: 0,
      latencyMs: 0,
      confusions: {},
      codes: {},
    }
    merged[char] = {
      pressed: existing.pressed + entry.pressed,
      missed: existing.missed + entry.missed,
      latencyMs: existing.latencyMs + entry.latencyMs,
      confusions: mergeCounts(existing.confusions, entry.confusions),
      codes: mergeCounts(existing.codes, entry.codes),
    }
  }
  return merged
}

export interface KeyStanding {
  char: string
  pressed: number
  missed: number
  /** 0-1. */
  errorRate: number
}

/**
 * Rank keys by miss rate. Keys you have barely touched are excluded — one typo
 * on a character you have typed twice says nothing worth showing.
 */
export function rankKeys(ledger: KeyLedger, minimumPresses = 12): KeyStanding[] {
  return Object.entries(ledger)
    .filter(([, entry]) => entry.pressed >= minimumPresses)
    .map(([char, entry]) => ({
      char,
      pressed: entry.pressed,
      missed: entry.missed,
      errorRate: entry.missed / entry.pressed,
    }))
    .sort((a, b) => b.errorRate - a.errorRate || b.pressed - a.pressed)
}

/** Keys that need work: worst miss rate first. */
export const troubleKeys = (ledger: KeyLedger, count = 6): KeyStanding[] =>
  rankKeys(ledger)
    .filter((key) => key.missed > 0)
    .slice(0, count)

/** Favourite keys: cleanest, with volume breaking ties. */
export const favouriteKeys = (ledger: KeyLedger, count = 6): KeyStanding[] =>
  rankKeys(ledger)
    .slice()
    .sort((a, b) => a.errorRate - b.errorRate || b.pressed - a.pressed)
    .slice(0, count)
