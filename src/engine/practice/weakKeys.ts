import { generateContext, generateDiscrimination, generateIsolation } from './generators'

export const WEAK_KEY_STEP_NAMES = [
  'Isolation',
  'Pairs',
  'All together',
  'Combined',
  'In context',
] as const

/** More than this and a single passage line stops being readable at a glance. */
export const MAX_PRACTICE_KEYS = 4

/** Every adjacent pair, wrapping — `[a, b, c]` → `ab`, `bc`, `ca`. Two keys give one pair. */
function cyclicPairs(chars: string[]): Array<[string, string]> {
  if (chars.length < 2) return []
  if (chars.length === 2) return [[chars[0]!, chars[1]!]]
  return chars.map((c, i) => [c, chars[(i + 1) % chars.length]!] as [string, string])
}

/** Every weak key, one at a time, round robin — forces switching on every keystroke. */
function roundRobin(chars: string[], rounds: number): string {
  if (chars.length === 0) return ''
  return Array.from({ length: chars.length * rounds }, (_, i) => chars[i % chars.length]!).join(' ')
}

/** Tokens that fuse every weak key into one unit, each a different rotation of the set. */
function rotations(chars: string[], count: number): string {
  const n = chars.length
  if (n === 0) return ''
  return Array.from({ length: count }, (_, i) =>
    Array.from({ length: n }, (_, j) => chars[(i + j) % n]!).join(''),
  ).join(' ')
}

/** Each key's own real-code shape, folded into a single combined line. */
function contextLine(chars: string[]): string {
  return chars.map((c) => generateContext(c).split('\n')[0]).join(', ')
}

/**
 * Five passages of increasing complexity, combining every key in `keys`
 * instead of drilling one at a time — repetition across the whole struggling
 * set, not a pass/fail test of any single key. Mirrors the app's existing
 * blocked → interleaved → contextual pedagogy (see generators.ts), just
 * applied across several keys instead of one.
 *
 * 1. Isolation   — each key repeated solo, one line per key.
 * 2. Pairs       — every adjacent pair of keys alternated as two-char tokens.
 * 3. All together — every key interleaved one character at a time.
 * 4. Combined    — tokens that fuse the whole set into one unit, rotated.
 * 5. In context  — each key's real-code shape, combined into one line.
 */
export function generateWeakKeyPractice(keys: string[]): string[] {
  const chars = [...new Set(keys)].slice(0, MAX_PRACTICE_KEYS)
  if (chars.length === 0) return []

  const isolation = chars.map((c) => generateIsolation(c)).join('\n')

  const pairs = cyclicPairs(chars)
  const pairwise =
    pairs.length === 0
      ? generateIsolation(chars[0]!, 6, 2)
      : pairs.map(([a, b]) => generateDiscrimination(a, b, 4)).join('\n')

  const together = roundRobin(chars, 4)
  const combined = rotations(chars, 6)
  const context = contextLine(chars)

  return [isolation, pairwise, together, combined, context]
}
