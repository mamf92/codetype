import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  appendGame,
  appendSession,
  bestGames,
  dailySeries,
  emptyProgress,
  headline,
  lifetimeLedger,
  practiceSummary,
  readProgress,
  stageStanding,
} from './progress'
import type { GameRecord, SessionRecord } from './progress'

const baseSession = (over: Partial<SessionRecord> = {}): SessionRecord => ({
  id: over.id ?? 'id',
  trackId: 'react-core',
  lessonId: 'react-core-state',
  drillId: 'react-core-state-1',
  language: 'react',
  at: 1_000,
  wpm: 60,
  rawWpm: 65,
  accuracy: 0.95,
  correctness: 0.98,
  durationMs: 20_000,
  keyLedger: { a: { pressed: 10, missed: 1, latencyMs: 2000, confusions: {}, codes: {} } },
  kind: 'drill',
  ...over,
})

describe('SessionRecord.kind — practice must not reach the speed graphs', () => {
  it('a practice session never enters headline()', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'practice', wpm: 900 }))
    expect(headline(doc).sessionCount).toBe(0)
    expect(headline(doc).bestWpm).toBe(0)
  })

  it('a practice session never enters dailySeries()', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'practice' }))
    expect(dailySeries(doc)).toEqual([])
  })

  it('a practice session still feeds its own key ledger, just not the lifetime one', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'practice' }))
    expect(lifetimeLedger(doc)).toEqual({})
  })

  it('a drill session does everything a practice one does not', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'drill' }))
    expect(headline(doc).sessionCount).toBe(1)
    expect(lifetimeLedger(doc)['a']?.pressed).toBe(10)
  })
})

const game = (over: Partial<GameRecord> = {}): GameRecord => ({
  id: 'g',
  game: 'keyfall',
  at: 1_000,
  score: 100,
  level: 1,
  hits: 10,
  fallen: 3,
  keys: 12,
  wrong: 2,
  durationMs: 30_000,
  ...over,
})

describe('stageStanding', () => {
  const stage = (over: Partial<SessionRecord>): SessionRecord =>
    baseSession({ kind: 'practice', trackId: 'number-row', drillId: 'number-row-reps', ...over })

  it('is empty for a stage never run', () => {
    expect(stageStanding(emptyProgress(), 'number-row-reps')).toEqual({
      runs: 0,
      lastAt: null,
      bestWpm: 0,
      bestAccuracy: 0,
      cleared: false,
    })
  })

  it('takes the best of every run, and clears at 95% or better', () => {
    let doc = appendSession(emptyProgress(), stage({ at: 1, wpm: 40, accuracy: 0.9 }))
    expect(stageStanding(doc, 'number-row-reps').cleared).toBe(false)
    doc = appendSession(doc, stage({ at: 2, wpm: 35, accuracy: 0.96 }))
    expect(stageStanding(doc, 'number-row-reps')).toMatchObject({
      runs: 2,
      lastAt: 2,
      bestWpm: 40,
      bestAccuracy: 0.96,
      cleared: true,
    })
  })

  it('never counts a real drill that happens to share nothing but the shape', () => {
    const doc = appendSession(emptyProgress(), stage({ kind: 'drill' }))
    expect(stageStanding(doc, 'number-row-reps').runs).toBe(0)
  })
})

describe('practiceSummary', () => {
  it('totals practice sessions only', () => {
    let doc = appendSession(emptyProgress(), baseSession({ kind: 'practice', durationMs: 60_000 }))
    doc = appendSession(doc, baseSession({ kind: 'drill', durationMs: 60_000 }))
    expect(practiceSummary(doc)).toEqual({ sessions: 1, minutes: 1 })
  })
})

describe('games', () => {
  it('ranks the best scores first, the earlier game winning a tie', () => {
    let doc = emptyProgress()
    for (const [id, score, at] of [
      ['a', 50, 1],
      ['b', 300, 2],
      ['c', 300, 1],
      ['d', 10, 4],
    ] as const) {
      doc = appendGame(doc, game({ id, score, at }))
    }
    expect(bestGames(doc, 3).map((g) => g.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('readProgress', () => {
  afterEach(() => vi.unstubAllGlobals())

  const stored = (value: unknown): void => {
    const data = new Map([['codetype.progress.v1', JSON.stringify(value)]])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: () => undefined,
    })
  }

  it('reads a document written before games existed with an empty list', () => {
    stored({ version: 1, favouriteLanguages: [], sessions: [] })
    expect(readProgress().games).toEqual([])
  })

  it('drops a game record it cannot trust rather than rendering garbage', () => {
    stored({
      version: 1,
      favouriteLanguages: [],
      sessions: [],
      games: [game(), { ...game(), score: 'lots' }, null, { game: 'pong' }],
    })
    expect(readProgress().games).toEqual([game()])
  })
})
