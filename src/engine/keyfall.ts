/**
 * Keyfall — characters fall from the top of the screen; type one before it
 * reaches the ground or lose a life. Pure and seeded, like the typing
 * session reducer: the screen owns the clock and the keyboard, and this owns
 * every rule, so the rules are testable without either.
 *
 * Positions are fractions of the play field: `x` 0–1 left to right, `y` 0 at
 * the top and 1 at the ground.
 */

export type GlyphKind = 'lower' | 'upper' | 'digit' | 'symbol' | 'token'

/** What a glyph is worth. A token is two or three keys typed in order. */
export const POINTS: Record<GlyphKind, number> = {
  lower: 10,
  upper: 15,
  digit: 20,
  symbol: 25,
  token: 30,
}

export const GLYPH_LABELS: Record<GlyphKind, string> = {
  lower: 'Letter',
  upper: 'Capital',
  digit: 'Number',
  symbol: 'Symbol',
  token: 'Operator',
}

/** One glyph of each kind, for a legend. */
export const GLYPH_EXAMPLES: Record<GlyphKind, string> = {
  lower: 'a',
  upper: 'A',
  digit: '7',
  symbol: '{',
  token: '=>',
}

export const STARTING_LIVES = 3

/** Hits per level. */
export const HITS_PER_LEVEL = 10

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = LOWER.toUpperCase()
const DIGITS = '0123456789'
const SYMBOLS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

/** Operators a developer types as one motion. Worth the most: they are several keys. */
export const TOKENS = [
  '=>', '===', '!==', '&&', '||', '??', '?.', '...', '::', '->',
  '**', '<=', '>=', '+=', '//', ':=', '${', '</',
] // prettier-ignore

/** The level a kind first falls at: letters, then capitals, digits, symbols, operators. */
export const UNLOCKS_AT: Record<GlyphKind, number> = {
  lower: 1,
  upper: 2,
  digit: 3,
  symbol: 4,
  token: 5,
}

/** How often each unlocked kind is picked, relative to the others. */
const WEIGHTS: Record<GlyphKind, number> = { lower: 4, upper: 2, digit: 2, symbol: 3, token: 1.5 }

/** Share of spawns drawn from the player's own weak keys, when they asked for that. */
const FOCUS_SHARE = 0.35

export const kindOf = (text: string): GlyphKind => {
  if (text.length > 1) return 'token'
  if (LOWER.includes(text)) return 'lower'
  if (UPPER.includes(text)) return 'upper'
  if (DIGITS.includes(text)) return 'digit'
  return 'symbol'
}

/**
 * Milliseconds for a glyph to fall the whole screen. Pitched at people who
 * already type for a living: level one is brisk rather than gentle, and the
 * floor is where it stays humanly possible rather than where it gets hard.
 */
export const fallMs = (level: number): number => Math.max(1800, 5500 - (level - 1) * 400)

/** Milliseconds between spawns, before jitter. */
export const spawnMs = (level: number): number => Math.max(350, 1100 - (level - 1) * 90)

export const levelFor = (hits: number): number => 1 + Math.floor(hits / HITS_PER_LEVEL)

export interface Glyph {
  id: number
  text: string
  kind: GlyphKind
  x: number
  y: number
  /** Characters of a token already typed. Always 0 for a single character. */
  progress: number
}

/** Something the screen should flash for a moment. Dropped after `EFFECT_MS`. */
export interface Effect {
  id: number
  kind: 'hit' | 'fall' | 'wrong'
  x: number
  y: number
  points: number
  at: number
}

export const EFFECT_MS = 700

export interface KeyfallState {
  status: 'ready' | 'running' | 'paused' | 'over'
  elapsedMs: number
  glyphs: Glyph[]
  effects: Effect[]
  score: number
  lives: number
  hits: number
  /** Glyphs that reached the ground. */
  fallen: number
  /** Every key pressed while running. */
  keys: number
  /** Keys that matched nothing on screen. */
  wrong: number
  /** Points by kind, for the end screen. */
  pointsBy: Record<GlyphKind, number>
  spawnInMs: number
  nextId: number
  /** RNG state. */
  seed: number
  /** Weak keys to rain more often. Empty for an even mix. */
  focus: string[]
}

export type KeyfallAction =
  | { type: 'start'; seed: number; focus?: string[] }
  | { type: 'tick'; dtMs: number }
  | { type: 'key'; char: string }
  | { type: 'pause' }
  | { type: 'resume' }

/** mulberry32 — small, fast, and good enough to make a game feel random. */
function random(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

const emptyPoints = (): Record<GlyphKind, number> => ({
  lower: 0,
  upper: 0,
  digit: 0,
  symbol: 0,
  token: 0,
})

export function initialKeyfall(seed = 1, focus: string[] = []): KeyfallState {
  return {
    status: 'ready',
    elapsedMs: 0,
    glyphs: [],
    effects: [],
    score: 0,
    lives: STARTING_LIVES,
    hits: 0,
    fallen: 0,
    keys: 0,
    wrong: 0,
    pointsBy: emptyPoints(),
    spawnInMs: 600,
    nextId: 1,
    seed,
    focus,
  }
}

function pool(kind: GlyphKind): readonly string[] {
  switch (kind) {
    case 'lower':
      return [...LOWER]
    case 'upper':
      return [...UPPER]
    case 'digit':
      return [...DIGITS]
    case 'symbol':
      return [...SYMBOLS]
    case 'token':
      return TOKENS
  }
}

/** Choose what falls next and where, avoiding anything already on screen. */
function spawn(state: KeyfallState, level: number): KeyfallState {
  let seed = state.seed
  const roll = (): number => {
    const [value, next] = random(seed)
    seed = next
    return value
  }

  const unlocked = (Object.keys(UNLOCKS_AT) as GlyphKind[]).filter((k) => UNLOCKS_AT[k] <= level)
  const onScreen = new Set(state.glyphs.map((g) => g.text))

  let text = ''
  // A handful of tries is plenty: the pools are far larger than what is on screen.
  for (let attempt = 0; attempt < 6 && (text === '' || onScreen.has(text)); attempt += 1) {
    if (state.focus.length > 0 && roll() < FOCUS_SHARE) {
      text = state.focus[Math.floor(roll() * state.focus.length)]!
      continue
    }
    const total = unlocked.reduce((sum, k) => sum + WEIGHTS[k], 0)
    let pick = roll() * total
    const kind = unlocked.find((k) => (pick -= WEIGHTS[k]) < 0) ?? 'lower'
    const choices = pool(kind)
    text = choices[Math.floor(roll() * choices.length)]!
  }
  if (onScreen.has(text)) return { ...state, seed }

  // Keep clear of anything that has only just started falling, so two glyphs
  // never spawn on top of each other.
  const fresh = state.glyphs.filter((g) => g.y < 0.25)
  let x = 0.08 + roll() * 0.84
  for (let attempt = 0; attempt < 5 && fresh.some((g) => Math.abs(g.x - x) < 0.12); attempt += 1) {
    x = 0.08 + roll() * 0.84
  }

  const glyph: Glyph = { id: state.nextId, text, kind: kindOf(text), x, y: 0, progress: 0 }
  return { ...state, seed, glyphs: [...state.glyphs, glyph], nextId: state.nextId + 1 }
}

function tick(state: KeyfallState, dtMs: number): KeyfallState {
  // A long gap means the tab was hidden or the machine slept. The screen
  // pauses on blur, but a single huge step must never sweep the board.
  const dt = Math.min(Math.max(0, dtMs), 100)
  const level = levelFor(state.hits)
  const elapsedMs = state.elapsedMs + dt
  const step = dt / fallMs(level)

  let next: KeyfallState = { ...state, elapsedMs }
  let lives = state.lives
  let fallen = state.fallen
  const effects = state.effects.filter((e) => elapsedMs - e.at < EFFECT_MS)
  let nextId = state.nextId

  const glyphs: Glyph[] = []
  for (const glyph of state.glyphs) {
    const y = glyph.y + step
    if (y >= 1) {
      lives -= 1
      fallen += 1
      effects.push({ id: nextId, kind: 'fall', x: glyph.x, y: 1, points: 0, at: elapsedMs })
      nextId += 1
    } else {
      glyphs.push({ ...glyph, y })
    }
  }

  next = { ...next, glyphs, effects, lives: Math.max(0, lives), fallen, nextId }
  if (lives <= 0) return { ...next, status: 'over' }

  let spawnInMs = state.spawnInMs - dt
  if (spawnInMs <= 0) {
    next = spawn(next, level)
    const [jitter, seed] = random(next.seed)
    spawnInMs += spawnMs(level) * (0.8 + jitter * 0.4)
    next = { ...next, seed }
  }
  return { ...next, spawnInMs }
}

/**
 * A key goes to the token already being typed if it continues it; otherwise
 * to the lowest glyph on screen that starts with it — the one closest to
 * costing you a life. A key that matches nothing is counted, and costs
 * nothing else: mashing is already its own punishment, since every glyph you
 * clear by accident is one you did not choose.
 */
function key(state: KeyfallState, char: string): KeyfallState {
  const hit = (glyph: Glyph, glyphs: Glyph[]): KeyfallState => {
    const points = POINTS[glyph.kind]
    return {
      ...state,
      glyphs: glyphs.filter((g) => g.id !== glyph.id),
      score: state.score + points,
      hits: state.hits + 1,
      pointsBy: { ...state.pointsBy, [glyph.kind]: state.pointsBy[glyph.kind] + points },
      effects: [
        ...state.effects,
        { id: state.nextId, kind: 'hit', x: glyph.x, y: glyph.y, points, at: state.elapsedMs },
      ],
      nextId: state.nextId + 1,
    }
  }

  const locked = state.glyphs.find((g) => g.progress > 0)
  if (locked !== undefined && locked.text[locked.progress] === char) {
    if (locked.progress + 1 === locked.text.length) return hit(locked, state.glyphs)
    return {
      ...state,
      glyphs: state.glyphs.map((g) =>
        g.id === locked.id ? { ...g, progress: g.progress + 1 } : g,
      ),
    }
  }

  // Anything half-typed is abandoned the moment a key does not continue it.
  const released = state.glyphs.map((g) => (g.progress > 0 ? { ...g, progress: 0 } : g))
  const target = released
    .filter((g) => g.text[0] === char)
    .reduce<Glyph | undefined>((low, g) => (low === undefined || g.y > low.y ? g : low), undefined)

  if (target === undefined) {
    return {
      ...state,
      glyphs: released,
      wrong: state.wrong + 1,
      effects: [
        ...state.effects,
        { id: state.nextId, kind: 'wrong', x: 0.5, y: 1, points: 0, at: state.elapsedMs },
      ],
      nextId: state.nextId + 1,
    }
  }
  if (target.text.length === 1) return hit(target, released)
  return {
    ...state,
    glyphs: released.map((g) => (g.id === target.id ? { ...g, progress: 1 } : g)),
  }
}

export function reduceKeyfall(state: KeyfallState, action: KeyfallAction): KeyfallState {
  switch (action.type) {
    case 'start':
      return { ...initialKeyfall(action.seed, action.focus ?? []), status: 'running' }
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state
    case 'resume':
      return state.status === 'paused' ? { ...state, status: 'running' } : state
    case 'tick':
      return state.status === 'running' ? tick(state, action.dtMs) : state
    case 'key':
      return state.status === 'running'
        ? { ...key(state, action.char), keys: state.keys + 1 }
        : state
  }
}

/** Share of keys pressed that landed on something. */
export const keyfallAccuracy = (state: Pick<KeyfallState, 'keys' | 'wrong'>): number =>
  state.keys === 0 ? 1 : (state.keys - state.wrong) / state.keys
