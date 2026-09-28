import { mergeLedgers, totalsMetrics, emptyTotals, type RunTotals } from './metrics'
import { initialSession, reduceSession, type SessionAction } from './session'
import type { CompiledDrill, Metrics, SessionState } from './types'

/**
 * A speed test: the rules, as a pure reducer over the typing session.
 *
 * Two shapes, one reducer —
 *
 * - **sprint** (`durationMs: null`) — one short passage, typed once. The clock
 *   runs from the first keystroke to the last, and the time is the result.
 * - **timed** — passages drawn from a pool and chained for as long as the
 *   clock allows. Finishing one loads the next on the same keystroke, so the
 *   time between passages is typing time like any other. When the clock runs
 *   out, whatever part of the current passage was reached counts, and the
 *   rest is not booked as missed — you never had the chance to type it.
 *
 * The clock starts on the first keystroke, not on arrival, so reading the
 * first line is free. The screen owns nothing but the wall clock: it sends
 * `tick`s, and every keystroke carries its own timestamp, so a key pressed
 * after the deadline but before the next tick ends the test instead of
 * typing.
 */

export interface SpeedTestPlan {
  /** Every passage the test can draw on, compiled. A sprint has exactly one. */
  pool: CompiledDrill[]
  /** How long a timed test runs. Null for a sprint, which runs until it is typed. */
  durationMs: number | null
}

export interface SpeedTestState {
  /** Fixes the order passages are drawn in; a new one per attempt. */
  seed: number
  /** How many passages have been finished before the current one. */
  index: number
  /** The passage being typed now. */
  session: SessionState
  /** Every passage finished so far, and on the last one, the one the clock cut off. */
  totals: RunTotals
  /** The first keystroke of the whole test. */
  startedAt: number | null
  finishedAt: number | null
}

export type SpeedTestAction =
  | Exclude<SessionAction, { type: 'reset' }>
  | { type: 'tick'; at: number }
  | { type: 'restart'; seed: number }

/** A small seeded generator, so a test's order is reproducible from its seed. */
function random(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

function shuffledOrder(length: number, seed: number): number[] {
  const order = Array.from({ length }, (_, i) => i)
  let state = seed
  for (let i = length - 1; i > 0; i -= 1) {
    const [value, next] = random(state)
    state = next
    const j = Math.floor(value * (i + 1))
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}

/**
 * Which passage of a pool of `length` comes `n`th. Every passage once, in a
 * shuffled order, before any repeats — and a pool that runs out is shuffled
 * again rather than replayed, without letting the last passage of one round
 * come straight back as the first of the next.
 */
export function passageIndex(n: number, length: number, seed: number): number {
  const round = Math.floor(n / length)
  const order = shuffledOrder(length, seed + round)
  if (round > 0 && length > 1) {
    const previous = shuffledOrder(length, seed + round - 1)
    if (order[0] === previous[length - 1]) [order[0], order[1]] = [order[1]!, order[0]!]
  }
  return order[n % length]!
}

export const currentPassage = (plan: SpeedTestPlan, state: SpeedTestState): CompiledDrill =>
  plan.pool[passageIndex(state.index, plan.pool.length, state.seed)]!

export function initialSpeedTest(plan: SpeedTestPlan, seed: number): SpeedTestState {
  const state: SpeedTestState = {
    seed,
    index: 0,
    session: initialSession(0),
    totals: emptyTotals(),
    startedAt: null,
    finishedAt: null,
  }
  return { ...state, session: initialSession(currentPassage(plan, state).cells.length) }
}

/**
 * Fold a passage into the totals, as far as it was typed. `cells` is what was
 * reached rather than what the passage held: a passage the clock cut off asked
 * for only as much as there was time to type.
 */
function fold(totals: RunTotals, session: SessionState): RunTotals {
  return {
    ledger: mergeLedgers(totals.ledger, session.keyLedger),
    durationMs: totals.durationMs,
    correctChars:
      totals.correctChars + session.entries.filter((entry) => entry === 'correct').length,
    keystrokes: totals.keystrokes + session.keystrokes,
    errors: totals.errors + session.errors,
    cells: totals.cells + session.cursor,
  }
}

/** The clock ran out: keep what was typed, and time it at exactly the test's length. */
function timeUp(plan: SpeedTestPlan, state: SpeedTestState, deadline: number): SpeedTestState {
  return {
    ...state,
    totals: { ...fold(state.totals, state.session), durationMs: plan.durationMs ?? 0 },
    finishedAt: deadline,
  }
}

export function reduceSpeedTest(
  plan: SpeedTestPlan,
  state: SpeedTestState,
  action: SpeedTestAction,
): SpeedTestState {
  if (action.type === 'restart') return initialSpeedTest(plan, action.seed)
  if (state.finishedAt !== null) return state

  const deadline =
    plan.durationMs !== null && state.startedAt !== null ? state.startedAt + plan.durationMs : null
  if (action.type === 'tick') {
    return deadline !== null && action.at >= deadline ? timeUp(plan, state, deadline) : state
  }
  if (action.type !== 'backspace' && deadline !== null && action.at >= deadline) {
    return timeUp(plan, state, deadline)
  }

  const session = reduceSession(state.session, action, currentPassage(plan, state).cells)
  const startedAt = state.startedAt ?? session.startedAt
  if (session.finishedAt === null) return { ...state, session, startedAt }

  const totals = fold(state.totals, session)
  if (plan.durationMs === null) {
    return {
      ...state,
      session,
      startedAt,
      totals: { ...totals, durationMs: session.finishedAt - (startedAt ?? session.finishedAt) },
      finishedAt: session.finishedAt,
    }
  }

  // Straight on to the next passage. The last keystroke carries over, so the
  // first key of the new passage is timed from it like any other.
  const next: SpeedTestState = { ...state, index: state.index + 1, totals, startedAt }
  return {
    ...next,
    session: {
      ...initialSession(currentPassage(plan, next).cells.length),
      lastActionAt: session.lastActionAt,
    },
  }
}

/** Time left on a timed test, in milliseconds. Null for a sprint. */
export function remainingMs(
  plan: SpeedTestPlan,
  state: SpeedTestState,
  now: number,
): number | null {
  if (plan.durationMs === null) return null
  if (state.startedAt === null) return plan.durationMs
  const end = state.finishedAt ?? now
  return Math.max(0, plan.durationMs - Math.max(0, end - state.startedAt))
}

/**
 * The numbers so far — or, once finished, the result. Built the same way as a
 * practice run's (`totalsMetrics`), so wpm means the same thing everywhere:
 * correct characters over five, per minute.
 */
export function speedTestMetrics(plan: SpeedTestPlan, state: SpeedTestState, now: number): Metrics {
  if (state.finishedAt !== null) return totalsMetrics(state.totals)
  const elapsed = state.startedAt === null ? 0 : Math.max(0, now - state.startedAt)
  return totalsMetrics({
    ...fold(state.totals, state.session),
    durationMs: plan.durationMs === null ? elapsed : Math.min(elapsed, plan.durationMs),
  })
}
