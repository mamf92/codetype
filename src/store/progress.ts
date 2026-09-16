import type { KeyLedger } from '@/engine/types'
import { mergeLedgers } from '@/engine/metrics'
import type { LanguageId, Track } from '@/content/schema'
import { isReadyToCheck, recheckProbation, startProbation } from '@/engine/practice/mastery'
import type { KeyProbation } from '@/engine/practice/mastery'
import type { ThemeId } from '@/lib/themes'

const STORAGE_KEY = 'codetype.progress.v1'
/** Plenty of history for the graphs, far short of a localStorage quota. */
const MAX_SESSIONS = 2000

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

export interface ProgressDocument {
  version: 1
  favouriteLanguages: LanguageId[]
  sessions: SessionRecord[]
  /** Keys that have passed all five practice levels, keyed by character — see mastery.ts. */
  probation: Record<string, KeyProbation>
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
  probation: {},
})

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
      probation: typeof doc.probation === 'object' && doc.probation !== null ? doc.probation : {},
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

export const appendSession = (doc: ProgressDocument, record: SessionRecord): ProgressDocument => {
  const withSession = { ...doc, sessions: [...doc.sessions, record].slice(-MAX_SESSIONS) }
  // Only a real drill is evidence for a probation check — practice reps are
  // exactly what probation exists to look past (see mastery.ts).
  return record.kind === 'drill' ? recheckDueProbations(withSession, record.at) : withSession
}

/**
 * Every probationary or graduated key that's due gets judged against the
 * ledger as it stands after this session. A pass widens its interval; a
 * fail drops it off probation, back to being ranked for practice normally.
 */
export function recheckDueProbations(doc: ProgressDocument, now: number): ProgressDocument {
  const entries = Object.values(doc.probation)
  if (entries.length === 0) return doc

  const ledger = lifetimeLedger(doc)
  const probation: Record<string, KeyProbation> = {}
  for (const entry of entries) {
    if (!isReadyToCheck(entry, ledger, now)) {
      probation[entry.char] = entry
      continue
    }
    const result = recheckProbation(entry, ledger, now)
    if (result !== undefined) probation[entry.char] = result
    // undefined: the key dropped off probation entirely.
  }
  return { ...doc, probation }
}

/** Call when a key has just passed all five practice levels. */
export const beginProbation = (
  doc: ProgressDocument,
  char: string,
  now: number,
): ProgressDocument => ({
  ...doc,
  probation: { ...doc.probation, [char]: startProbation(char, lifetimeLedger(doc), now) },
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
