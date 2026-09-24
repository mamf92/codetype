import type { KeyLedger } from '@/engine/types'
import { mergeLedgers } from '@/engine/metrics'
import type { LanguageId, Track } from '@/content/schema'
import type { ThemeId } from '@/lib/themes'

const STORAGE_KEY = 'codetype.progress.v1'
/** Plenty of history for the graphs, far short of a localStorage quota. */
const MAX_SESSIONS = 2000
/** Games are tiny records; this is a long high-score table, not a quota risk. */
const MAX_GAMES = 500

/** The outcome of one completed drill. Everything else is derived from these. */
export interface SessionRecord {
  id: string
  trackId: string
  lessonId: string
  drillId: string
  language: LanguageId
  /** Epoch milliseconds. */
  at: number
  wpm: number
  rawWpm: number
  accuracy: number
  correctness: number
  durationMs: number
  keyLedger: KeyLedger
  /**
   * `[[[ [[[` at 120 wpm is not a personal best. Key-practice reps
   * (`kind: 'practice'`) feed the keyboard ledger the same as a drill, but
   * must never reach `headline()` or `dailySeries()` — those are what the
   * speed graphs are built from, and a practice rep would corrupt them
   * quietly. A record with no `kind` (written before this field existed)
   * is treated as `'drill'`; every session on record so far was one.
   */
  kind: 'drill' | 'practice'
}

/**
 * One finished game of Keyfall. Stored raw, like a session, so the high
 * score is a derivation (`bestGames`) rather than a counter that could
 * drift. Not a `SessionRecord`: a game has no passage, no wpm and no key
 * ledger worth feeding anywhere — it is scored on points, not speed.
 */
export interface GameRecord {
  id: string
  game: 'keyfall'
  /** Epoch milliseconds. */
  at: number
  score: number
  level: number
  hits: number
  /** Glyphs that reached the ground. */
  fallen: number
  keys: number
  wrong: number
  durationMs: number
}

export interface ProgressDocument {
  version: 1
  favouriteLanguages: LanguageId[]
  sessions: SessionRecord[]
  /**
   * Added after v1 shipped, and deliberately not a version bump: a document
   * written before games existed reads back with an empty list, the same
   * way a session written before `kind` existed reads back as a drill.
   */
  games: GameRecord[]
  /**
   * Undefined means "no choice stored yet" — the signal the welcome screen
   * uses to show itself, including for anyone who used the app before this
   * field existed. Deliberately not a version bump: an old-shaped v1
   * document is still a valid v1 document, just one that hasn't answered
   * this question.
   */
  theme?: ThemeId
}

export const emptyProgress = (): ProgressDocument => ({
  version: 1,
  favouriteLanguages: ['typescript', 'react', 'tailwind'],
  sessions: [],
  games: [],
})

const isGameRecord = (value: unknown): value is GameRecord => {
  if (typeof value !== 'object' || value === null) return false
  const game = value as Partial<GameRecord>
  return (
    game.game === 'keyfall' &&
    typeof game.id === 'string' &&
    [
      game.at,
      game.score,
      game.level,
      game.hits,
      game.fallen,
      game.keys,
      game.wrong,
      game.durationMs,
    ].every((n) => typeof n === 'number' && Number.isFinite(n))
  )
}

/**
 * Read the document, tolerating anything at all in storage. A corrupt or
 * foreign payload loses history, which is a shame; throwing on boot would lose
 * the whole app, which is worse.
 */
export function readProgress(): ProgressDocument {
  if (typeof localStorage === 'undefined') return emptyProgress()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return emptyProgress()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return emptyProgress()
    const doc = parsed as Partial<ProgressDocument>
    if (doc.version !== 1 || !Array.isArray(doc.sessions)) return emptyProgress()
    const knownThemes: ThemeId[] = ['dark', 'dark-contrast', 'light', 'light-contrast']
    const theme = knownThemes.includes(doc.theme as ThemeId) ? doc.theme : undefined
    return {
      version: 1,
      favouriteLanguages: Array.isArray(doc.favouriteLanguages)
        ? doc.favouriteLanguages
        : emptyProgress().favouriteLanguages,
      // Every session recorded before `kind` existed was a real drill.
      sessions: doc.sessions.map((session) => ({
        ...session,
        kind: session.kind === 'practice' ? 'practice' : 'drill',
      })),
      games: Array.isArray(doc.games) ? doc.games.filter(isGameRecord) : [],
      ...(theme !== undefined ? { theme } : {}),
    }
  } catch {
    return emptyProgress()
  }
}

export function writeProgress(doc: ProgressDocument): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
  } catch {
    // Quota or private mode. Losing the write is survivable; crashing is not.
  }
}

export const appendSession = (doc: ProgressDocument, record: SessionRecord): ProgressDocument => ({
  ...doc,
  sessions: [...doc.sessions, record].slice(-MAX_SESSIONS),
})

export const appendGame = (doc: ProgressDocument, record: GameRecord): ProgressDocument => ({
  ...doc,
  games: [...doc.games, record].slice(-MAX_GAMES),
})

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

/**
 * Real drills only. Every stat, chart and standing below is built from
 * this, not `doc.sessions` directly — a key-practice rep updates the
 * keyboard ledger it feeds into separately, but must never look like a
 * personal-best drill on a speed graph or a track's completion count.
 */
const drillSessions = (doc: ProgressDocument): SessionRecord[] =>
  doc.sessions.filter((session) => session.kind === 'drill')

export interface TrackStanding {
  attempts: number
  lastAt: number | null
  bestWpm: number
  averageAccuracy: number
  /** Distinct drills completed at least once. */
  drillsTouched: number
}

export function standingFor(doc: ProgressDocument, trackId: string): TrackStanding {
  const relevant = drillSessions(doc).filter((session) => session.trackId === trackId)
  if (relevant.length === 0) {
    return { attempts: 0, lastAt: null, bestWpm: 0, averageAccuracy: 0, drillsTouched: 0 }
  }
  return {
    attempts: relevant.length,
    lastAt: Math.max(...relevant.map((s) => s.at)),
    bestWpm: Math.max(...relevant.map((s) => s.wpm)),
    averageAccuracy: relevant.reduce((sum, s) => sum + s.accuracy, 0) / relevant.length,
    drillsTouched: new Set(relevant.map((s) => s.drillId)).size,
  }
}

/**
 * The keyboard ledger shown on Home and Statistics, and the one the ranking
 * in `src/engine/practice/ranking.ts` picks what to practice from — real
 * drills only. A practice rep's own ledger is deliberately not merged in
 * here: it would flood a targeted key with synthetic-context presses right
 * when it's being drilled, which is exactly backwards for a panel whose job
 * is to reflect how you actually type.
 */
export const lifetimeLedger = (doc: ProgressDocument): KeyLedger =>
  drillSessions(doc).reduce<KeyLedger>(
    (ledger, session) => mergeLedgers(ledger, session.keyLedger),
    {},
  )

export interface Headline {
  sessionCount: number
  minutesTyped: number
  bestWpm: number
  /** Mean wpm across the last ten drills — what you are typing at *now*. */
  recentWpm: number
  recentAccuracy: number
  /** Change in recent wpm against the ten before that. Null until there is data. */
  trend: number | null
}

export function headline(doc: ProgressDocument): Headline {
  const sessions = drillSessions(doc).sort((a, b) => a.at - b.at)
  const mean = (values: number[]): number =>
    values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length

  const recent = sessions.slice(-10)
  const previous = sessions.slice(-20, -10)
  const recentWpm = mean(recent.map((s) => s.wpm))

  return {
    sessionCount: sessions.length,
    minutesTyped: sessions.reduce((sum, s) => sum + s.durationMs, 0) / 60_000,
    bestWpm: sessions.length === 0 ? 0 : Math.max(...sessions.map((s) => s.wpm)),
    recentWpm,
    recentAccuracy: mean(recent.map((s) => s.accuracy)),
    trend: previous.length === 0 ? null : recentWpm - mean(previous.map((s) => s.wpm)),
  }
}

const DAY_MS = 86_400_000

/**
 * Tracks you have worked and then let go stale. Untouched tracks are not
 * "due" — they are simply new, and belong in a different part of the page.
 */
export function dueForRevisit(doc: ProgressDocument, tracks: Track[], now: number): Track[] {
  return tracks
    .map((track) => ({ track, standing: standingFor(doc, track.id) }))
    .filter(
      ({ track, standing }) =>
        standing.lastAt !== null && now - standing.lastAt > track.freshnessDays * DAY_MS,
    )
    .sort((a, b) => (a.standing.lastAt ?? 0) - (b.standing.lastAt ?? 0))
    .map(({ track }) => track)
}

/** Daily best wpm, oldest first — the shape the progress graph wants. */
export interface DailyPoint {
  day: string
  wpm: number
  accuracy: number
  sessions: number
}

export function dailySeries(doc: ProgressDocument): DailyPoint[] {
  const byDay = new Map<string, SessionRecord[]>()
  for (const session of drillSessions(doc)) {
    const day = new Date(session.at).toISOString().slice(0, 10)
    byDay.set(day, [...(byDay.get(day) ?? []), session])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, sessions]) => ({
      day,
      wpm: Math.max(...sessions.map((s) => s.wpm)),
      accuracy: sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length,
      sessions: sessions.length,
    }))
}

// ---------------------------------------------------------------------------
// Basics
// ---------------------------------------------------------------------------

/** Key practice only: weak-key runs and key-track stages alike. */
const practiceSessions = (doc: ProgressDocument): SessionRecord[] =>
  doc.sessions.filter((session) => session.kind === 'practice')

/** First-press accuracy a key-track stage has to be run at to count as cleared. */
export const STAGE_CLEAR_ACCURACY = 0.95

export interface StageStanding {
  runs: number
  lastAt: number | null
  bestWpm: number
  bestAccuracy: number
  /** Run at least once at `STAGE_CLEAR_ACCURACY` or better. */
  cleared: boolean
}

/**
 * How a key-track stage has gone. A stage run is recorded as a practice
 * session whose `drillId` is the stage id — ids that `basics.test.ts` holds
 * unique against the catalogue, so nothing else can match.
 */
export function stageStanding(doc: ProgressDocument, stageId: string): StageStanding {
  const runs = practiceSessions(doc).filter((session) => session.drillId === stageId)
  if (runs.length === 0) {
    return { runs: 0, lastAt: null, bestWpm: 0, bestAccuracy: 0, cleared: false }
  }
  const bestAccuracy = Math.max(...runs.map((s) => s.accuracy))
  return {
    runs: runs.length,
    lastAt: Math.max(...runs.map((s) => s.at)),
    bestWpm: Math.max(...runs.map((s) => s.wpm)),
    bestAccuracy,
    cleared: bestAccuracy >= STAGE_CLEAR_ACCURACY,
  }
}

export interface PracticeSummary {
  sessions: number
  minutes: number
}

/** Everything done on the Basics page's typing surfaces, as a total. */
export function practiceSummary(doc: ProgressDocument): PracticeSummary {
  const sessions = practiceSessions(doc)
  return {
    sessions: sessions.length,
    minutes: sessions.reduce((sum, s) => sum + s.durationMs, 0) / 60_000,
  }
}

/** Highest scores first; the earlier game wins a tie, since it got there first. */
export const bestGames = (doc: ProgressDocument, count = 5): GameRecord[] =>
  doc.games
    .slice()
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, count)
