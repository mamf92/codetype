import type { Grammar } from '@/content/schema'
import type { KeyLedger } from '@/engine/types'
import { contextFragments, generateDiscrimination, generateIsolation } from './generators'
import { partnerFor } from './partners'

/** One passage in a practice run, and what it is called on screen. */
export interface PracticeStep {
  name: string
  passage: string
  grammar: Grammar
}

/** More than this and a single passage line stops being readable at a glance. */
export const MAX_PRACTICE_KEYS = 4

/** Clean runs in a row a streak step asks for before it lets you move on. */
export const CLEAN_STREAK = 3

/**
 * The two ways to work weak keys. Both are repetition; they differ in what
 * the repetition is *for*.
 *
 * - `ladder` builds the motion: five rungs, blocked to interleaved to code,
 *   each typed once. Volume and variety — the reach, then the mix-up, then
 *   the key among the others, then inside real shapes.
 * - `streak` proves it: a handful of short lines, each of which has to be
 *   typed three times running without a single miss. A slip resets the count
 *   to zero. Fewer shapes, far more reps, and precision is the gate.
 */
export type WeakKeyMode = 'ladder' | 'streak'

export const WEAK_KEY_MODES: Record<
  WeakKeyMode,
  { title: string; summary: string; steps: string }
> = {
  ladder: {
    title: 'The ladder',
    summary:
      'Five rungs, each typed once: the bare reach, the key against the one you hit instead, every weak key interleaved, fused into tokens, then inside real code.',
    steps: 'Isolate · Mix-ups · Interleave · Fuse · In code',
  },
  streak: {
    title: 'Clean streak',
    summary: `One short line per key, then one with all of them. Each must be typed ${CLEAN_STREAK} times in a row without a miss — a slip resets the count. Precision is the only way through.`,
    steps: `Every line × ${CLEAN_STREAK}, clean`,
  },
}

export const isWeakKeyMode = (value: string | undefined): value is WeakKeyMode =>
  value === 'ladder' || value === 'streak'

/** A key and what it will be drilled against. */
export interface PracticeTarget {
  char: string
  partner: string | null
}

/**
 * Pair each key with its partner from the ledger, deduplicated and capped.
 * A partner that is itself one of the targets is kept: `[`/`]` both weak is
 * exactly the case where drilling them against each other matters most.
 */
export function practiceTargets(keys: string[], ledger: KeyLedger): PracticeTarget[] {
  return [...new Set(keys)]
    .slice(0, MAX_PRACTICE_KEYS)
    .map((char) => ({ char, partner: partnerFor(char, ledger[char]) }))
}

/** Every weak key, one at a time, round robin — forces switching on every keystroke. */
function roundRobin(chars: string[], rounds: number): string {
  if (chars.length === 0) return ''
  return Array.from({ length: chars.length * rounds }, (_, i) => chars[i % chars.length]!).join(' ')
}

/** Tokens that fuse every key into one unit, each a different rotation of the set. */
function rotations(chars: string[], count: number): string {
  const n = chars.length
  if (n === 0) return ''
  return Array.from({ length: count }, (_, i) =>
    Array.from({ length: n }, (_, j) => chars[(i + j) % n]!).join(''),
  ).join(' ')
}

/**
 * The keys a run switches between: every target, plus a lone target's
 * partner. Interleaving a single key with nothing is just isolation again.
 */
function interleaveSet(targets: PracticeTarget[]): string[] {
  const chars = targets.map((t) => t.char)
  const only = targets[0]
  if (targets.length === 1 && only?.partner != null) chars.push(only.partner)
  return chars
}

/** A target against its partner, or doubled on its own when it has none. */
function mixUp({ char, partner }: PracticeTarget, tokens: number): string {
  return partner === null
    ? generateIsolation(char, tokens, 2)
    : generateDiscrimination(char, partner, tokens)
}

/**
 * The ladder: five passages, each typed once, every weak key on every rung.
 *
 * 1. Isolate    — each key repeated solo, one line per key.
 * 2. Mix-ups    — each key against the key you actually hit instead of it.
 * 3. Interleave — every key switched on every keystroke, forwards then back.
 * 4. Fuse       — tokens that hold the whole set, rotated.
 * 5. In code    — each key in fragments of real code, then all of them mixed.
 *
 * Blocked first, because a motion that does not exist yet is built fastest
 * by repeating it; interleaved after, because that is what makes it stick.
 */
export function ladderSteps(targets: PracticeTarget[]): PracticeStep[] {
  if (targets.length === 0) return []
  const chars = targets.map((t) => t.char)
  const set = interleaveSet(targets)

  const isolate = chars.map((c) => generateIsolation(c, 5, 3)).join('\n')
  const mixUps = targets.map((t) => mixUp(t, 8)).join('\n')
  const interleave = [roundRobin(set, 4), roundRobin([...set].reverse(), 4)].join('\n')
  const fuse = [rotations(set, 6), rotations([...set].reverse(), 6)].join('\n')
  const inCode = [
    ...chars.map((c) => contextFragments(c).slice(0, 4).join('  ')),
    chars.map((c) => contextFragments(c).at(-1)).join('  '),
  ].join('\n')

  return [
    { name: 'Isolate', passage: isolate, grammar: 'plain' },
    { name: 'Mix-ups', passage: mixUps, grammar: 'plain' },
    { name: 'Interleave', passage: interleave, grammar: 'plain' },
    { name: 'Fuse', passage: fuse, grammar: 'plain' },
    { name: 'In code', passage: inCode, grammar: 'typescript' },
  ]
}

/**
 * The streak: one short line per key and a closing line with all of them,
 * each to be typed `CLEAN_STREAK` times running without a miss.
 *
 * Each key's line opens on the reach, runs through its mix-up and ends in
 * code, so one line holds the whole ladder in miniature — short enough that
 * typing it clean three times is a realistic ask, dense enough that it is not
 * a free one.
 */
export function streakSteps(targets: PracticeTarget[]): PracticeStep[] {
  if (targets.length === 0) return []
  const perKey = targets.map((target) => {
    const [first, second] = contextFragments(target.char)
    const line = [target.char.repeat(3), mixUp(target, 3), first, second]
      .filter((part) => part !== undefined)
      .join(' ')
    return { name: target.char, passage: line, grammar: 'plain' as const }
  })
  if (targets.length === 1) return perKey

  const set = interleaveSet(targets)
  const all = [rotations(set, 3), ...targets.map((t) => contextFragments(t.char)[2] ?? t.char)]
  return [...perKey, { name: 'All of them', passage: all.join(' '), grammar: 'plain' }]
}

export function weakKeySteps(mode: WeakKeyMode, targets: PracticeTarget[]): PracticeStep[] {
  return mode === 'ladder' ? ladderSteps(targets) : streakSteps(targets)
}
