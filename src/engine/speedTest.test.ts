import { describe, expect, it } from 'vitest'
import { compileDrill } from './compile'
import {
  currentPassage,
  initialSpeedTest,
  passageIndex,
  reduceSpeedTest,
  remainingMs,
  speedTestMetrics,
  type SpeedTestAction,
  type SpeedTestPlan,
  type SpeedTestState,
} from './speedTest'

const plan = (passages: string[], durationMs: number | null): SpeedTestPlan => ({
  pool: passages.map((p) => compileDrill(p, 'plain')),
  durationMs,
})

/** Type `text` one key a second from `at`, starting from `state`. */
function type(
  test: SpeedTestPlan,
  state: SpeedTestState,
  text: string,
  at: number,
  step = 1_000,
): SpeedTestState {
  return [...text].reduce<SpeedTestState>((s, char, i) => {
    const action: SpeedTestAction =
      char === '\n'
        ? { type: 'newline', code: 'Enter', at: at + i * step }
        : { type: 'character', char, code: 'KeyA', at: at + i * step }
    return reduceSpeedTest(test, s, action)
  }, state)
}

describe('passageIndex', () => {
  it('draws every passage once before any comes back', () => {
    for (const seed of [1, 7, 12345, Date.UTC(2026, 0, 1)]) {
      const firstRound = Array.from({ length: 6 }, (_, n) => passageIndex(n, 6, seed))
      expect(new Set(firstRound).size).toBe(6)
      const secondRound = Array.from({ length: 6 }, (_, n) => passageIndex(n + 6, 6, seed))
      expect(new Set(secondRound).size).toBe(6)
    }
  })

  it('is the same order for the same seed', () => {
    const order = (seed: number) => Array.from({ length: 10 }, (_, n) => passageIndex(n, 10, seed))
    expect(order(42)).toEqual(order(42))
  })

  it('never repeats a passage back to back across a round', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      for (let n = 1; n < 12; n += 1) {
        expect(passageIndex(n, 3, seed)).not.toBe(passageIndex(n - 1, 3, seed))
      }
    }
  })

  it('handles a pool of one', () => {
    expect([0, 1, 2].map((n) => passageIndex(n, 1, 9))).toEqual([0, 0, 0])
  })
})

describe('a sprint', () => {
  const sprint = plan(['abc'], null)

  it('times the run from the first key to the last, not from arrival', () => {
    let state = initialSpeedTest(sprint, 1)
    state = type(sprint, state, 'abc', 5_000)
    expect(state.finishedAt).toBe(7_000)
    expect(state.totals.durationMs).toBe(2_000)
    const metrics = speedTestMetrics(sprint, state, 99_999)
    expect(metrics.correctChars).toBe(3)
    expect(metrics.accuracy).toBe(1)
    expect(metrics.correctness).toBe(1)
  })

  it('has no clock to run out', () => {
    let state = initialSpeedTest(sprint, 1)
    state = type(sprint, state, 'a', 0)
    state = reduceSpeedTest(sprint, state, { type: 'tick', at: 10_000_000 })
    expect(state.finishedAt).toBeNull()
    expect(remainingMs(sprint, state, 10_000_000)).toBeNull()
  })

  it('keeps a wrong key on the record, even once corrected', () => {
    let state = initialSpeedTest(sprint, 1)
    state = type(sprint, state, 'ax', 0)
    state = reduceSpeedTest(sprint, state, { type: 'backspace' })
    state = type(sprint, state, 'bc', 2_000)
    const metrics = speedTestMetrics(sprint, state, 0)
    expect(metrics.errors).toBe(1)
    expect(metrics.accuracy).toBe(0.75)
    expect(metrics.correctness).toBe(1)
  })
})

describe('a timed test', () => {
  const timed = plan(['ab', 'cd', 'ef'], 10_000)

  it('does not start the clock until the first key', () => {
    let state = initialSpeedTest(timed, 3)
    state = reduceSpeedTest(timed, state, { type: 'tick', at: 50_000 })
    expect(state.finishedAt).toBeNull()
    expect(remainingMs(timed, state, 50_000)).toBe(10_000)
  })

  it('moves on to the next passage on the keystroke that finishes one', () => {
    let state = initialSpeedTest(timed, 3)
    const first = currentPassage(timed, state).source
    state = type(timed, state, first, 0)
    expect(state.index).toBe(1)
    expect(state.finishedAt).toBeNull()
    expect(state.session.cursor).toBe(0)
    expect(currentPassage(timed, state).source).not.toBe(first)
    expect(state.totals.correctChars).toBe(2)
    // The clock keeps running from the very first key.
    expect(state.startedAt).toBe(0)
  })

  it('counts only what was reached when the clock runs out', () => {
    let state = initialSpeedTest(timed, 3)
    state = type(timed, state, currentPassage(timed, state).source, 0)
    state = type(timed, state, currentPassage(timed, state).source.slice(0, 1), 2_000)
    state = reduceSpeedTest(timed, state, { type: 'tick', at: 10_500 })
    expect(state.finishedAt).toBe(10_000)
    expect(state.totals).toMatchObject({ durationMs: 10_000, correctChars: 3, cells: 3 })
    const metrics = speedTestMetrics(timed, state, 0)
    // Three correct characters in ten seconds: 3 / 5 / (1/6) = 3.6 wpm.
    expect(metrics.wpm).toBe(4)
    expect(metrics.correctness).toBe(1)
  })

  it('ends on a key pressed after the deadline instead of typing it', () => {
    let state = initialSpeedTest(timed, 3)
    state = type(timed, state, currentPassage(timed, state).source[0]!, 0)
    state = reduceSpeedTest(timed, state, {
      type: 'character',
      char: 'z',
      code: 'KeyZ',
      at: 10_000,
    })
    expect(state.finishedAt).toBe(10_000)
    expect(state.totals.keystrokes).toBe(1)
  })

  it('ignores everything once finished, except a restart', () => {
    let state = initialSpeedTest(timed, 3)
    state = type(timed, state, 'x', 0)
    state = reduceSpeedTest(timed, state, { type: 'tick', at: 20_000 })
    const done = state
    expect(
      reduceSpeedTest(timed, done, { type: 'character', char: 'a', code: 'KeyA', at: 1 }),
    ).toBe(done)
    const again = reduceSpeedTest(timed, done, { type: 'restart', seed: 4 })
    expect(again).toMatchObject({ seed: 4, index: 0, startedAt: null, finishedAt: null })
    expect(again.totals.keystrokes).toBe(0)
  })

  it('reports time left, and live numbers capped at the test length', () => {
    let state = initialSpeedTest(timed, 3)
    state = type(timed, state, currentPassage(timed, state).source, 1_000)
    expect(remainingMs(timed, state, 4_000)).toBe(7_000)
    expect(speedTestMetrics(timed, state, 60_000).elapsedMs).toBe(10_000)
  })
})
