/**
 * The catalogue contract.
 *
 * Everything typeable in CodeType is a Track. A Track holds Lessons; a Lesson
 * holds Drills. The point of a Lesson is that its drills are *variants of one
 * idea* -- retyping them is how the idea sticks, not just the keystrokes.
 */

export const LANGUAGES = {
  typescript: { label: 'TypeScript', short: 'TS' },
  react: { label: 'React', short: 'RE' },
  tailwind: { label: 'Tailwind CSS', short: 'TW' },
  javascript: { label: 'JavaScript', short: 'JS' },
  nextjs: { label: 'Next.js', short: 'NX' },
  python: { label: 'Python', short: 'PY' },
  kotlin: { label: 'Kotlin', short: 'KT' },
  java: { label: 'Java', short: 'JV' },
} as const

export type LanguageId = keyof typeof LANGUAGES

/** Grammars registered with refractor. Keep in sync with `lib/highlight.ts`. */
export type Grammar =
  'tsx' | 'typescript' | 'javascript' | 'css' | 'json' | 'python' | 'kotlin' | 'java'

/**
 * `foundation` — syntax you should never have to think about.
 * `working`    — the patterns you reach for on an ordinary day.
 * `frontier`   — recent enough that your fingers have no habit for it yet.
 */
export type Level = 'foundation' | 'working' | 'frontier'

/** A single typeable passage. */
export interface Drill {
  id: string
  /** Short human label, e.g. "as a guard clause". Shown above the passage. */
  label: string
  /** The passage itself. Leading indentation is ghosted, never typed. */
  code: string
  grammar: Grammar
  /** One sentence on what makes *this* variant different from its siblings. */
  note?: string
}

/** A concept, expressed several ways. */
export interface Lesson {
  id: string
  title: string
  /** One line for the card. */
  summary: string
  /** The thing you are supposed to walk away knowing. 1-3 sentences. */
  concept: string
  sourceUrl?: string
  drills: Drill[]
}

export interface Track {
  id: string
  /**
   * `course`   — evergreen material.
   * `dispatch` — something recent worth burning in while it is still news.
   */
  kind: 'course' | 'dispatch'
  language: LanguageId
  title: string
  blurb: string
  level: Level
  tags: string[]
  /** Days before a completed track is flagged as due for another pass. */
  freshnessDays: number
  /** ISO date. Dispatches only. */
  publishedAt?: string
  sourceUrl?: string
  lessons: Lesson[]
}

export const isDispatch = (track: Track): boolean => track.kind === 'dispatch'

export const drillCount = (track: Track): number =>
  track.lessons.reduce((total, lesson) => total + lesson.drills.length, 0)

/** Characters a drill will actually ask you to type, ignoring ghosted indent. */
export const typedLength = (code: string): number =>
  code
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n').length
