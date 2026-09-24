/** One character the drill will ask for, or a line break. */
export interface Cell {
  /** The expected character. `\n` for line breaks. */
  char: string
  kind: 'char' | 'newline'
  /** Zero-based line this cell belongs to. */
  line: number
  /** Index of this cell within its line's typed characters. */
  column: number
  /** Prism scope for colouring, or null for plain text. */
  scope: string | null
}

/** A rendered line: ghosted indentation plus the cells you actually type. */
export interface CompiledLine {
  index: number
  /** Leading whitespace, shown but never typed. */
  indent: string
  cells: Cell[]
  /** Index into `CompiledDrill.cells` where this line's first cell sits. */
  offset: number
}

export interface CompiledDrill {
  /** Every cell in typing order, line breaks included. */
  cells: Cell[]
  lines: CompiledLine[]
  /** Source after normalisation. */
  source: string
}

export type EntryState = 'pending' | 'correct' | 'wrong'

/**
 * Everything recorded about the times a passage asked for a given character.
 *
 * `confusions` and `codes` are keyed by, respectively, what was actually
 * typed on a miss and the physical key (`event.code`) that produced it —
 * this is what lets a discrimination pair or a layout be learned from real
 * typing instead of assumed. `latencyMs` is a running sum; divide by
 * `pressed` for the mean. See `docs/PRACTICE.md` §2.
 */
export interface KeyStat {
  pressed: number
  missed: number
  latencyMs: number
  confusions: Record<string, number>
  codes: Record<string, number>
}

/** How often a given expected character was reached, and how it went. */
export interface KeyLedger {
  [character: string]: KeyStat
}

export interface SessionState {
  /** Index of the cell awaiting input. Equals `cells.length` when finished. */
  cursor: number
  entries: EntryState[]
  /** Every accepted keystroke, corrections included. The honest denominator. */
  keystrokes: number
  /** Keystrokes that were wrong at the moment they were made. */
  errors: number
  keyLedger: KeyLedger
  startedAt: number | null
  finishedAt: number | null
  /** Timestamp of the last accepted keystroke, for measuring latency on the next one. */
  lastActionAt: number | null
}

export interface Metrics {
  elapsedMs: number
  /** Correct characters only. The number worth quoting. */
  wpm: number
  /** Everything typed, right or wrong. */
  rawWpm: number
  /** Share of keystrokes that were right first time, 0-1. */
  accuracy: number
  /** Share of the finished passage left correct after corrections, 0-1. */
  correctness: number
  keystrokes: number
  errors: number
  correctChars: number
}
