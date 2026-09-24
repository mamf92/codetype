import type { KeyStat } from '@/engine/types'

/** Below this many presses a key's record is too thin to colour honestly. */
export const THIN_PRESSES = 5

export type KeyTone = 'untouched' | 'thin' | 'strong' | 'fair' | 'weak'

/**
 * One rule for what "strong" and "weak" look like, shared by the key map and
 * the lists beside it, so a key can't be green in one place and red in the
 * other. Cyan is right and red is wrong, as everywhere else; amber is the
 * middle, where most keys a professional types actually live.
 */
export function keyTone(stat: KeyStat | undefined): KeyTone {
  if (stat === undefined || stat.pressed === 0) return 'untouched'
  if (stat.pressed < THIN_PRESSES) return 'thin'
  const accuracy = 1 - stat.missed / stat.pressed
  if (accuracy >= 0.98) return 'strong'
  if (accuracy >= 0.93) return 'fair'
  return 'weak'
}

export const accuracyOf = (stat: KeyStat): number =>
  stat.pressed === 0 ? 1 : 1 - stat.missed / stat.pressed

/**
 * Mean gap before the key, in ms — the hesitation signal. A running sum over
 * `pressed`, so it is a mean rather than a median (see docs/PRACTICE.md).
 */
export const meanLatencyMs = (stat: KeyStat): number =>
  stat.pressed === 0 ? 0 : Math.round(stat.latencyMs / stat.pressed)

/** A keycap's face, spelled out for a screen reader. */
export const keyName = (char: string): string => (char === ' ' ? 'space' : char)
