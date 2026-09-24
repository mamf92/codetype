import type { Grammar } from '../schema'

/**
 * The key tracks on the Basics page.
 *
 * Deliberately not a catalogue `Track`. A catalogue lesson teaches a concept
 * and closes with a capstone; a key track teaches nothing but the keys, so
 * it has neither concepts nor capstones and would fail every rule
 * `content.test.ts` holds a lesson to. It has its own shape and its own rules
 * (`basics.test.ts`), and it stays out of `TRACKS` — which also keeps it out
 * of the corpus frequency table, where a stage made of nothing but digits
 * would inflate the cost of every digit you ever miss.
 *
 * Still content, though, and still CC-BY-SA-4.0 like everything else under
 * `src/content/`.
 */

/**
 * `reps`     — the bare keys, repeated. The motion, nothing else.
 * `patterns` — the keys in the shapes they actually come in.
 * `code`     — the keys inside real lines of the language.
 * `load`     — dense passages with nowhere to rest. The challenge.
 */
export type KeyStageKind = 'reps' | 'patterns' | 'code' | 'load'

export const STAGE_ORDER: KeyStageKind[] = ['reps', 'patterns', 'code', 'load']

export const STAGE_TITLES: Record<KeyStageKind, string> = {
  reps: 'Reps',
  patterns: 'Patterns',
  code: 'In code',
  load: 'Under load',
}

/** One stage: several passages, typed back to back as one run. */
export interface KeyStage {
  id: string
  kind: KeyStageKind
  /** What this stage asks of you, in a line. Shown on the card and above the passage. */
  summary: string
  grammar: Grammar
  /** Several ways of saying the same thing, as everywhere else in CodeType. */
  passages: string[]
}

export interface KeyTrack {
  id: string
  title: string
  blurb: string
  /** The keys this track exists to drill. Density is measured against these. */
  focus: string
  /** Four stages, one of each kind, in `STAGE_ORDER`. */
  stages: KeyStage[]
}

/** Every printable ASCII symbol — the focus of the three symbol tracks. */
export const SYMBOL_KEYS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
