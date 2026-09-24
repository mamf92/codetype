import { describe, expect, it } from 'vitest'
import { compileDrill, normalise } from './compile'
import { initialSession, reduceSession } from './session'
import {
  addRun,
  computeMetrics,
  emptyTotals,
  favouriteKeys,
  mergeLedgers,
  totalsMetrics,
  troubleKeys,
} from './metrics'
import type { Cell, KeyStat, SessionState } from './types'

const compile = (code: string) => compileDrill(code, 'typescript')

/** Type a whole string, one action per character, starting at t=0. */
function typeAll(cells: readonly Cell[], input: string, startAt = 0): SessionState {
  let state = initialSession(cells.length)
  ;[...input].forEach((char, i) => {
    state = reduceSession(
      state,
      char === '\n'
        ? { type: 'newline', code: 'Enter', at: startAt + i }
        : { type: 'character', char, code: `Key${char.toUpperCase()}`, at: startAt + i },
      cells,
    )
  })
  return state
}

const stat = (over: Partial<KeyStat> = {}): KeyStat => ({
  pressed: 0,
  missed: 0,
  latencyMs: 0,
  confusions: {},
  codes: {},
  ...over,
})

describe('normalise', () => {
  it('expands tabs, strips trailing whitespace and surrounding blank lines', () => {
    expect(normalise('\n\n\tconst a = 1   \n\n')).toBe('  const a = 1')
  })

  it('normalises CRLF', () => {
    expect(normalise('a\r\nb')).toBe('a\nb')
  })

  it('keeps interior blank lines', () => {
    expect(normalise('a\n\nb')).toBe('a\n\nb')
  })
})

describe('compileDrill', () => {
  it('ghosts leading indentation instead of asking you to type it', () => {
    const { cells, lines } = compile('if (x) {\n  return 1\n}')
    expect(lines[1]?.indent).toBe('  ')
    expect(lines[1]?.cells.map((c) => c.char).join('')).toBe('return 1')
    // No cell anywhere is an indent space.
    expect(cells.every((c) => !(c.kind === 'char' && c.column === 0 && c.char === ' '))).toBe(true)
  })

  it('emits a newline cell between lines but not after the last', () => {
    const { cells } = compile('a\nb')
    expect(cells.map((c) => c.char)).toEqual(['a', '\n', 'b'])
  })

  it('gives a blank interior line its own newline cell', () => {
    const { cells } = compile('a\n\nb')
    expect(cells.map((c) => c.char)).toEqual(['a', '\n', '\n', 'b'])
  })

  it('assigns one scope per character, aligned to the source', () => {
    const { cells } = compile('const x = 1')
    const keyword = cells.slice(0, 5)
    expect(keyword.every((c) => c.scope === 'keyword')).toBe(true)
    expect(cells.at(-1)?.scope).toBe('number')
  })

  it('never desyncs scopes from characters, whatever the grammar does', () => {
    const source = 'const emoji = "🙂" // unicode\nconst n = 0b1010'
    const { cells } = compileDrill(source, 'typescript')
    const typed = cells.map((c) => c.char).join('')
    expect(typed).toBe(
      source
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n'),
    )
  })
})

describe('session', () => {
  it('advances through a clean run and finishes', () => {
    const { cells } = compile('const a = 1')
    const state = typeAll(cells, 'const a = 1')
    expect(state.cursor).toBe(cells.length)
    expect(state.finishedAt).not.toBeNull()
    expect(state.errors).toBe(0)
    expect(state.entries.every((e) => e === 'correct')).toBe(true)
  })

  it('records a typo but keeps moving — forgiving flow never stalls', () => {
    const { cells } = compile('const')
    const state = typeAll(cells, 'conts')
    expect(state.cursor).toBe(5)
    expect(state.errors).toBe(2)
    expect(state.entries).toEqual(['correct', 'correct', 'correct', 'wrong', 'wrong'])
  })

  it('starts the clock on the first keystroke, not on mount', () => {
    const { cells } = compile('ab')
    let state = initialSession(cells.length)
    expect(state.startedAt).toBeNull()
    state = reduceSession(state, { type: 'character', char: 'a', code: 'KeyA', at: 5000 }, cells)
    expect(state.startedAt).toBe(5000)
  })

  it('requires Enter at a line break and does not consume it otherwise', () => {
    const { cells } = compile('a\nb')
    let state = typeAll(cells, 'a')
    state = reduceSession(state, { type: 'character', char: 'x', code: 'KeyX', at: 10 }, cells)
    expect(state.cursor).toBe(1) // still waiting on Enter
    expect(state.errors).toBe(1)
    state = reduceSession(state, { type: 'newline', code: 'Enter', at: 11 }, cells)
    expect(state.cursor).toBe(2)
  })

  it('treats a stray Enter mid-line as an error without advancing', () => {
    const { cells } = compile('ab')
    let state = typeAll(cells, 'a')
    state = reduceSession(state, { type: 'newline', code: 'Enter', at: 10 }, cells)
    expect(state.cursor).toBe(1)
    expect(state.errors).toBe(1)
  })

  it('backspace rewinds and lets you fix, but the mistake still counts', () => {
    const { cells } = compile('abc')
    let state = typeAll(cells, 'ax')
    expect(state.errors).toBe(1)
    state = reduceSession(state, { type: 'backspace' }, cells)
    expect(state.cursor).toBe(1)
    expect(state.entries[1]).toBe('pending')
    state = reduceSession(state, { type: 'character', char: 'b', code: 'KeyB', at: 20 }, cells)
    expect(state.entries[1]).toBe('correct')
    expect(state.errors).toBe(1) // raw accuracy remembers
    expect(state.keystrokes).toBe(3)
  })

  it('is terminal once the last cell is consumed, even if that cell was missed', () => {
    // Reaching the end stops the clock, so there is nothing left to correct.
    // The miss survives in `correctness` rather than being quietly repaired.
    const { cells } = compile('ab')
    let state = typeAll(cells, 'ax')
    expect(state.finishedAt).not.toBeNull()
    state = reduceSession(state, { type: 'backspace' }, cells)
    expect(state.cursor).toBe(2)
    expect(computeMetrics(state, 100).correctness).toBeCloseTo(0.5)
  })

  it('backspace at the start is a no-op', () => {
    const { cells } = compile('a')
    const state = reduceSession(initialSession(cells.length), { type: 'backspace' }, cells)
    expect(state.cursor).toBe(0)
  })

  it('ignores input once finished', () => {
    const { cells } = compile('a')
    const done = typeAll(cells, 'a')
    const after = reduceSession(done, { type: 'character', char: 'b', code: 'KeyB', at: 99 }, cells)
    expect(after).toBe(done)
  })

  it('reset returns a pristine session', () => {
    const { cells } = compile('abc')
    const state = reduceSession(typeAll(cells, 'ab'), { type: 'reset' }, cells)
    expect(state).toEqual(initialSession(cells.length))
  })

  it('attributes a miss to the character that was expected', () => {
    const { cells } = compile('{}')
    const state = typeAll(cells, '(]')
    expect(state.keyLedger['{']).toEqual(
      stat({ pressed: 1, missed: 1, confusions: { '(': 1 }, codes: { 'Key(': 1 } }),
    )
    expect(state.keyLedger['}']).toEqual(
      stat({ pressed: 1, missed: 1, latencyMs: 1, confusions: { ']': 1 }, codes: { 'Key]': 1 } }),
    )
  })

  it('records latency as the gap since the previous accepted keystroke', () => {
    const { cells } = compile('ab')
    let state = initialSession(cells.length)
    state = reduceSession(state, { type: 'character', char: 'a', code: 'KeyA', at: 1000 }, cells)
    state = reduceSession(state, { type: 'character', char: 'b', code: 'KeyB', at: 1400 }, cells)
    expect(state.keyLedger['a']?.latencyMs).toBe(0) // nothing came before it
    expect(state.keyLedger['b']?.latencyMs).toBe(400)
  })
})

describe('metrics', () => {
  it('computes wpm from correct characters over elapsed time', () => {
    const { cells } = compile('abcde')
    let state = initialSession(cells.length)
    // Five correct characters spread across exactly one second.
    ;[...'abcde'].forEach((char, i) => {
      state = reduceSession(
        state,
        { type: 'character', char, code: `Key${char.toUpperCase()}`, at: i * 250 },
        cells,
      )
    })
    const metrics = computeMetrics(state, 1000)
    expect(metrics.elapsedMs).toBe(1000)
    expect(metrics.wpm).toBe(60) // 5 chars = 1 word, in 1s = 60 wpm
    expect(metrics.accuracy).toBe(1)
  })

  it('separates raw speed from correct speed', () => {
    const { cells } = compile('abcde')
    let state = initialSession(cells.length)
    ;[...'abcdx'].forEach((char, i) => {
      state = reduceSession(
        state,
        { type: 'character', char, code: `Key${char.toUpperCase()}`, at: i * 250 },
        cells,
      )
    })
    const metrics = computeMetrics(state, 1000)
    expect(metrics.rawWpm).toBeGreaterThan(metrics.wpm)
    expect(metrics.accuracy).toBeCloseTo(0.8)
    expect(metrics.correctness).toBeCloseTo(0.8)
  })

  it('reports zeroes rather than dividing by zero before the first keystroke', () => {
    const metrics = computeMetrics(initialSession(3), 1000)
    expect(metrics.wpm).toBe(0)
    expect(metrics.accuracy).toBe(1)
    expect(metrics.elapsedMs).toBe(0)
  })

  it('merges ledgers across sessions', () => {
    const merged = mergeLedgers(
      { a: stat({ pressed: 2, missed: 1, confusions: { s: 1 } }) },
      {
        a: stat({ pressed: 3, missed: 0 }),
        b: stat({ pressed: 1, missed: 1, confusions: { n: 1 } }),
      },
    )
    expect(merged['a']).toEqual(stat({ pressed: 5, missed: 1, confusions: { s: 1 } }))
    expect(merged['b']).toEqual(stat({ pressed: 1, missed: 1, confusions: { n: 1 } }))
  })

  it('ignores keys with too little evidence to judge', () => {
    const ledger = { z: stat({ pressed: 2, missed: 2 }), a: stat({ pressed: 50, missed: 5 }) }
    expect(troubleKeys(ledger).map((k) => k.char)).toEqual(['a'])
  })

  it('leaves the line break out of the keyboard panels entirely', () => {
    // A line break is structural, not a key you drill — and every keycap it
    // would appear on links to a practice session that cannot practice it.
    const ledger = { '\n': stat({ pressed: 80, missed: 40 }), a: stat({ pressed: 50, missed: 5 }) }
    expect(troubleKeys(ledger).map((k) => k.char)).toEqual(['a'])
    expect(favouriteKeys(ledger).map((k) => k.char)).toEqual(['a'])
  })

  it('ranks trouble keys worst-first and favourites cleanest-first', () => {
    const ledger = {
      a: stat({ pressed: 100, missed: 1 }),
      ';': stat({ pressed: 40, missed: 12 }),
      '{': stat({ pressed: 30, missed: 3 }),
    }
    expect(troubleKeys(ledger)[0]?.char).toBe(';')
    expect(favouriteKeys(ledger)[0]?.char).toBe('a')
  })
})

describe('run totals', () => {
  it('describes every passage of a run, not just the last one', () => {
    const first = compile('ab')
    const slow = typeAll(first.cells, 'ab', 0)
    // 'ab' in 60 s, then 'cd' in 60 s with one miss: 3 correct chars over 2 minutes.
    const firstState = { ...slow, startedAt: 0, finishedAt: 60_000 }
    const second = compile('cd')
    const missed = typeAll(second.cells, 'xd', 0)
    const secondState = { ...missed, startedAt: 0, finishedAt: 60_000 }

    let totals = emptyTotals()
    totals = addRun(totals, firstState, computeMetrics(firstState, 0))
    totals = addRun(totals, secondState, computeMetrics(secondState, 0))
    const metrics = totalsMetrics(totals)

    expect(metrics.elapsedMs).toBe(120_000)
    expect(metrics.keystrokes).toBe(4)
    expect(metrics.errors).toBe(1)
    expect(metrics.accuracy).toBe(0.75)
    expect(metrics.correctness).toBe(0.75)
    expect(totals.ledger['c']?.missed).toBe(1)
    expect(totals.ledger['a']?.pressed).toBe(1)
  })

  it('is a clean, empty record before anything is typed', () => {
    expect(totalsMetrics(emptyTotals())).toMatchObject({ wpm: 0, accuracy: 1, correctness: 1 })
  })
})
