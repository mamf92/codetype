import { describe, expect, it } from 'vitest'
import {
  fallMs,
  initialKeyfall,
  keyfallAccuracy,
  kindOf,
  levelFor,
  POINTS,
  reduceKeyfall,
  spawnMs,
  STARTING_LIVES,
  UNLOCKS_AT,
  type Glyph,
  type KeyfallAction,
  type KeyfallState,
} from './keyfall'

const running = (glyphs: Array<Partial<Glyph> & { text: string }> = []): KeyfallState => ({
  ...initialKeyfall(7),
  status: 'running',
  // Far enough away that no tick in a test spawns anything unexpected.
  spawnInMs: 1e9,
  glyphs: glyphs.map((g, i) => ({
    id: i + 1,
    x: 0.5,
    y: 0.5,
    progress: 0,
    kind: kindOf(g.text),
    ...g,
  })),
  nextId: glyphs.length + 1,
})

const run = (state: KeyfallState, ...actions: KeyfallAction[]): KeyfallState =>
  actions.reduce(reduceKeyfall, state)

const type = (state: KeyfallState, text: string): KeyfallState =>
  run(state, ...[...text].map((char): KeyfallAction => ({ type: 'key', char })))

describe('scoring', () => {
  it('pays 10 for a letter, 15 for a capital, 20 for a digit, 25 for a symbol, 30 for an operator', () => {
    expect(POINTS).toEqual({ lower: 10, upper: 15, digit: 20, symbol: 25, token: 30 })
    expect([kindOf('a'), kindOf('A'), kindOf('7'), kindOf('{'), kindOf('=>')]).toEqual([
      'lower',
      'upper',
      'digit',
      'symbol',
      'token',
    ])
  })

  it('scores a glyph when its key is pressed, and clears it', () => {
    const after = type(
      running([{ text: 'q' }, { text: 'Q' }, { text: '4' }, { text: '[' }]),
      'qQ4[',
    )
    expect(after.score).toBe(10 + 15 + 20 + 25)
    expect(after.hits).toBe(4)
    expect(after.glyphs).toEqual([])
    expect(after.pointsBy).toMatchObject({ lower: 10, upper: 15, digit: 20, symbol: 25 })
  })

  it('an operator scores only once every key is typed in order', () => {
    let state = type(running([{ text: '===' }]), '==')
    expect(state.score).toBe(0)
    expect(state.glyphs[0]?.progress).toBe(2)
    state = type(state, '=')
    expect(state.score).toBe(30)
    expect(state.glyphs).toEqual([])
  })

  it('abandons a half-typed operator when the next key does not continue it', () => {
    const state = type(running([{ text: '=>' }, { text: 'a' }]), '=a')
    expect(state.score).toBe(10)
    expect(state.glyphs.map((g) => [g.text, g.progress])).toEqual([['=>', 0]])
  })
})

describe('targeting', () => {
  it('sends a key to the lowest matching glyph — the one about to cost a life', () => {
    const state = type(
      running([
        { text: 'a', y: 0.2 },
        { text: 'a', y: 0.8 },
      ]),
      'a',
    )
    expect(state.glyphs.map((g) => g.y)).toEqual([0.2])
  })

  it('counts a key that matches nothing, and takes nothing else for it', () => {
    const state = type(running([{ text: 'a' }]), 'z')
    expect(state.wrong).toBe(1)
    expect(state.lives).toBe(STARTING_LIVES)
    expect(state.score).toBe(0)
    expect(keyfallAccuracy(state)).toBe(0)
  })

  it('measures accuracy over keys, not glyphs', () => {
    const state = type(running([{ text: '=>' }]), 'x=>')
    expect(keyfallAccuracy(state)).toBeCloseTo(2 / 3)
  })
})

describe('lives', () => {
  it('loses a life when a glyph reaches the ground', () => {
    const state = run(running([{ text: 'a', y: 0.999 }]), { type: 'tick', dtMs: 50 })
    expect(state.lives).toBe(STARTING_LIVES - 1)
    expect(state.fallen).toBe(1)
    expect(state.glyphs).toEqual([])
  })

  it('ends the game on the last life', () => {
    const state = run(
      { ...running([{ text: 'a', y: 0.999 }]), lives: 1 },
      { type: 'tick', dtMs: 50 },
    )
    expect(state.status).toBe('over')
    expect(run(state, { type: 'key', char: 'a' }).score).toBe(0)
  })

  it('never sweeps the board in one huge step after the tab was hidden', () => {
    const state = run(running([{ text: 'a', y: 0 }]), { type: 'tick', dtMs: 60_000 })
    expect(state.lives).toBe(STARTING_LIVES)
  })
})

describe('the run', () => {
  it('does nothing until started, and nothing while paused', () => {
    const ready = initialKeyfall()
    expect(run(ready, { type: 'tick', dtMs: 50 })).toBe(ready)
    const paused = run(running([{ text: 'a', y: 0.99 }]), { type: 'pause' })
    expect(run(paused, { type: 'tick', dtMs: 50 }, { type: 'key', char: 'a' })).toBe(paused)
    expect(run(paused, { type: 'resume' }).status).toBe('running')
  })

  it('spawns glyphs over time, all on screen and none duplicated', () => {
    let state = run(initialKeyfall(), { type: 'start', seed: 42 })
    for (let i = 0; i < 400; i += 1) {
      state = run(state, { type: 'tick', dtMs: 16 })
      const texts = state.glyphs.map((g) => g.text)
      expect(new Set(texts).size).toBe(texts.length)
      for (const g of state.glyphs) {
        expect(g.x).toBeGreaterThanOrEqual(0.08)
        expect(g.x).toBeLessThanOrEqual(0.92)
      }
    }
    expect(state.glyphs.length + state.fallen).toBeGreaterThan(3)
  })

  it('is reproducible from its seed', () => {
    const play = (): string[] => {
      let state = run(initialKeyfall(), { type: 'start', seed: 9 })
      for (let i = 0; i < 300; i += 1) state = run(state, { type: 'tick', dtMs: 16 })
      return state.glyphs.map((g) => g.text)
    }
    expect(play()).toEqual(play())
  })

  it('only drops letters on level one', () => {
    let state = run(initialKeyfall(), { type: 'start', seed: 3 })
    const seen: string[] = []
    for (let i = 0; i < 2000; i += 1) {
      state = run(state, { type: 'tick', dtMs: 16 })
      for (const g of state.glyphs) seen.push(g.kind)
      // Keep the board clear so the game never ends mid-test.
      state = { ...state, lives: STARTING_LIVES }
    }
    expect(new Set(seen)).toEqual(new Set(['lower']))
  })

  it('rains the weak keys it was given more often', () => {
    let state = run(initialKeyfall(), { type: 'start', seed: 5, focus: ['{'] })
    let braces = 0
    for (let i = 0; i < 3000; i += 1) {
      const before = new Set(state.glyphs.map((g) => g.id))
      state = { ...run(state, { type: 'tick', dtMs: 16 }), lives: STARTING_LIVES }
      braces += state.glyphs.filter((g) => !before.has(g.id) && g.text === '{').length
      // Clear the brace so it can fall again.
      state = { ...state, glyphs: state.glyphs.filter((g) => g.text !== '{') }
    }
    expect(braces).toBeGreaterThan(5)
  })
})

describe('difficulty', () => {
  it('levels up every ten hits and unlocks kinds in order', () => {
    expect([levelFor(0), levelFor(9), levelFor(10), levelFor(45)]).toEqual([1, 1, 2, 5])
    expect(UNLOCKS_AT).toEqual({ lower: 1, upper: 2, digit: 3, symbol: 4, token: 5 })
  })

  it('speeds up with the level but never past what a person can do', () => {
    expect(fallMs(2)).toBeLessThan(fallMs(1))
    expect(spawnMs(2)).toBeLessThan(spawnMs(1))
    expect(fallMs(100)).toBe(1800)
    expect(spawnMs(100)).toBe(350)
  })
})
