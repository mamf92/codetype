import type { Cell, KeyStat, SessionState } from './types'

export type SessionAction =
  | { type: 'character'; char: string; code: string; at: number }
  | { type: 'newline'; code: string; at: number }
  | { type: 'backspace' }
  | { type: 'reset' }

export function initialSession(length: number): SessionState {
  return {
    cursor: 0,
    entries: Array.from({ length }, () => 'pending' as const),
    keystrokes: 0,
    errors: 0,
    keyLedger: {},
    startedAt: null,
    finishedAt: null,
    lastActionAt: null,
  }
}

/**
 * Records one keystroke against the character it was measured for.
 *
 * `expected` is the ledger key — what the passage asked for. `typed` and
 * `code` are what actually happened, so a miss records not just *that* it
 * was wrong but *what* was typed instead (`event.key`) and which physical
 * key produced it (`event.code`) — the two together are what let a
 * discrimination pair or a real (non-US) keyboard layout be learned from
 * typing rather than assumed. `latencyMs` is the gap since the previous
 * accepted keystroke, the "hesitation" signal correctness alone misses.
 */
function recordKey(
  state: SessionState,
  expected: string,
  typed: string,
  code: string,
  latencyMs: number,
): void {
  const missed = typed !== expected
  const entry: KeyStat = state.keyLedger[expected] ?? {
    pressed: 0,
    missed: 0,
    latencyMs: 0,
    confusions: {},
    codes: {},
  }
  const codes = { ...entry.codes, [code]: (entry.codes[code] ?? 0) + 1 }
  const confusions = missed
    ? { ...entry.confusions, [typed]: (entry.confusions[typed] ?? 0) + 1 }
    : entry.confusions
  state.keyLedger[expected] = {
    pressed: entry.pressed + 1,
    missed: entry.missed + (missed ? 1 : 0),
    latencyMs: entry.latencyMs + Math.max(0, latencyMs),
    confusions,
    codes,
  }
}

/**
 * Forgiving flow: a wrong character is recorded and the cursor advances anyway,
 * so a typo never stalls you mid-line. Backspace rewinds so you *can* fix it —
 * the correction shows up in `correctness`, while the original mistake stays on
 * the record in `accuracy`.
 *
 * The one thing that does block is a line break. Newlines are structural, and
 * consuming one by accident would leave the passage silently misaligned.
 */
export function reduceSession(
  state: SessionState,
  action: SessionAction,
  cells: readonly Cell[],
): SessionState {
  if (action.type === 'reset') return initialSession(cells.length)
  if (state.finishedAt !== null) return state

  if (action.type === 'backspace') {
    if (state.cursor === 0) return state
    const cursor = state.cursor - 1
    const entries = state.entries.slice()
    entries[cursor] = 'pending'
    return { ...state, cursor, entries }
  }

  const expected = cells[state.cursor]
  if (expected === undefined) return state

  const typed = action.type === 'newline' ? '\n' : action.char
  const code = action.code
  const latencyMs = state.lastActionAt === null ? 0 : action.at - state.lastActionAt

  // Wrong key at a line break: counted against you, but it does not advance.
  if (expected.kind === 'newline' && typed !== '\n') {
    const next: SessionState = {
      ...state,
      entries: state.entries.slice(),
      keyLedger: { ...state.keyLedger },
      keystrokes: state.keystrokes + 1,
      errors: state.errors + 1,
      startedAt: state.startedAt ?? action.at,
      lastActionAt: action.at,
    }
    recordKey(next, '\n', typed, code, latencyMs)
    return next
  }

  // Enter pressed mid-line: same treatment, for the same reason.
  if (expected.kind === 'char' && typed === '\n') {
    const next: SessionState = {
      ...state,
      entries: state.entries.slice(),
      keyLedger: { ...state.keyLedger },
      keystrokes: state.keystrokes + 1,
      errors: state.errors + 1,
      startedAt: state.startedAt ?? action.at,
      lastActionAt: action.at,
    }
    recordKey(next, expected.char, typed, code, latencyMs)
    return next
  }

  const correct = typed === expected.char
  const entries = state.entries.slice()
  entries[state.cursor] = correct ? 'correct' : 'wrong'
  const cursor = state.cursor + 1

  const next: SessionState = {
    ...state,
    cursor,
    entries,
    keyLedger: { ...state.keyLedger },
    keystrokes: state.keystrokes + 1,
    errors: state.errors + (correct ? 0 : 1),
    startedAt: state.startedAt ?? action.at,
    finishedAt: cursor >= cells.length ? action.at : null,
    lastActionAt: action.at,
  }
  recordKey(next, expected.char, typed, code, latencyMs)
  return next
}
