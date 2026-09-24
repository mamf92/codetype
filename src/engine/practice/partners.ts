import { isPracticableKey } from '@/engine/keys'
import type { KeyStat } from '@/engine/types'

/**
 * Keys whose *order* people invert, whatever the layout. The fallback partner
 * when there is no confusion on record.
 */
const TWINS: Record<string, string> = {
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '(': ')',
  ')': '(',
  '<': '>',
  '>': '<',
  "'": '"',
  '"': "'",
  '-': '_',
  _: '-',
  '/': '\\',
  '\\': '/',
}

/**
 * The key to drill `char` against — the thing you need to learn to tell it
 * apart from.
 *
 * The ledger records what was typed on every miss (`KeyStat.confusions`), so
 * the first choice is the empirical one: the key you actually hit instead,
 * most often. That tells a `[`/`]` problem (discrimination) apart from a
 * `[`/`p` problem (the reach), which no fixed table can. The syntactic twin
 * is the fallback for a key with no misses to learn from; after that there
 * is no partner, and the caller drills the key on its own.
 *
 * A confusion that could not be drilled — a space, a line break — is passed
 * over rather than returned, for the same reason those keys are never
 * practised themselves (see `isPracticableKey`).
 */
export function partnerFor(char: string, stat: KeyStat | undefined): string | null {
  const confused = Object.entries(stat?.confusions ?? {})
    .filter(([typed]) => typed !== char && typed.length === 1 && isPracticableKey(typed))
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))[0]
  if (confused !== undefined) return confused[0]
  return TWINS[char] ?? null
}
