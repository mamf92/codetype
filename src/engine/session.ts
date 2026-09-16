import type { Cell, SessionState } from './types'

export type SessionAction =
  | { type: 'character'; char: string; at: number }
  | { type: 'newline'; at: number }
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
  }
}

function recordKey(state: SessionState, char: string, missed: boolean): void {
  const entry = state.keyLedger[char] ?? { pressed: 0, missed: 0 }
  state.keyLedger[char] = { pressed: entry.pressed + 1, missed: entry.missed + (missed ? 1 : 0) }
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

  // Wrong key at a line break: counted against you, but it does not advance.
  if (expected.kind === 'newline' && typed !== '\n') {
    const next: SessionState = {
      ...state,
      entries: state.entries.slice(),
      keyLedger: { ...state.keyLedger },
      keystrokes: state.keystrokes + 1,
      errors: state.errors + 1,
      startedAt: state.startedAt ?? action.at,
    }
    recordKey(next, '\n', true)
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
    }
    recordKey(next, expected.char, true)
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
  }
  recordKey(next, expected.char, !correct)
  return next
}
