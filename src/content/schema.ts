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

/**
 * `variant`  — one short call site of the concept. Most drills are these.
 * `capstone` — the concept put to work in a fictional but plausible
 *              codebase, long enough to feel like real writing.
 */
export type DrillKind = 'variant' | 'capstone'

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
  /** Absent means `variant` — the shape every drill had before capstones. */
  kind?: DrillKind
  /**
   * Capstones only, and required on them: the scenario, shown *above* the
   * passage rather than below it. A `note` explains how a variant differs
   * from its siblings; a `brief` sets up the fictional situation you are
   * about to type your way through, which you need before you start, not
   * after.
   */
  brief?: string
}

/**
 * `concept` — one idea, several variants, one capstone.
 * `review`  — no new idea of its own: a single project that puts the
 *             preceding block of concepts back to work together.
 */
export type LessonKind = 'concept' | 'review'

/** A concept, expressed several ways. */
export interface Lesson {
  id: string
  title: string
  /** One line for the card. */
  summary: string
  /** The thing you are supposed to walk away knowing. 1-3 sentences. */
  concept: string
  sourceUrl?: string
  /** Absent means `concept`. */
  kind?: LessonKind
  /**
   * Reviews only, and required on them: the ids of the concept lessons this
   * review pulls together, in the order they appear in the track. Kept as a
   * list rather than a count so the link is checkable — `content.test.ts`
   * holds every concept lesson to being reviewed exactly once.
   */
  covers?: string[]
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

// ---------------------------------------------------------------------------
// Kinds
//
// Both kind fields are optional so that the shape every lesson and drill had
// before capstones existed is still the correct way to write the common case.
// Read them through these helpers rather than comparing to `undefined` at the
// call site.
// ---------------------------------------------------------------------------

export const drillKind = (drill: Drill): DrillKind => drill.kind ?? 'variant'

export const lessonKind = (lesson: Lesson): LessonKind => lesson.kind ?? 'concept'

export const isCapstone = (drill: Drill): boolean => drillKind(drill) === 'capstone'

export const isReview = (lesson: Lesson): boolean => lessonKind(lesson) === 'review'

/** The variants of a lesson, in order, without its capstone. */
export const variantsOf = (lesson: Lesson): Drill[] => lesson.drills.filter((d) => !isCapstone(d))

/** A concept lesson's closing capstone, or undefined if it has none yet. */
export const capstoneOf = (lesson: Lesson): Drill | undefined =>
  lesson.drills.find((drill) => isCapstone(drill))

export const conceptLessons = (track: Track): Lesson[] => track.lessons.filter((l) => !isReview(l))

export const reviewLessons = (track: Track): Lesson[] => track.lessons.filter((l) => isReview(l))

export const capstoneCount = (track: Track): number =>
  track.lessons.reduce((total, lesson) => total + lesson.drills.filter(isCapstone).length, 0)

/** The lessons a review pulls together, resolved against its own track. */
export const coveredLessons = (track: Track, review: Lesson): Lesson[] =>
  (review.covers ?? [])
    .map((id) => track.lessons.find((lesson) => lesson.id === id))
    .filter((lesson): lesson is Lesson => lesson !== undefined)

/** Characters a drill will actually ask you to type, ignoring ghosted indent. */
export const typedLength = (code: string): number =>
  code
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n').length
