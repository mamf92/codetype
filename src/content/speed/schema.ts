import type { Grammar, LanguageId } from '../schema'

/**
 * Speed tests on the Basics page.
 *
 * Not catalogue tracks and not key tracks: a speed test teaches nothing and
 * drills nothing in particular. It measures. So it has its own shape, its
 * own rules (`speed.test.ts`), and its own session kind (`'test'`), which
 * keeps it off the drill speed graphs — see
 * `docs/decisions/0007-speed-tests.md`.
 *
 * The sprints and the prose under `src/content/speed/` are content like
 * everything else here, and CC-BY-SA-4.0. The code tests are not authored
 * here at all: they draw on the catalogue's own variants, so a language gets
 * a test the day its first track lands.
 */

/**
 * `sprint` — one short passage, typed once against the clock.
 * `text`   — plain prose, for as long as the clock runs.
 * `code`   — one language's code, for as long as the clock runs.
 */
export type SpeedTestGroup = 'sprint' | 'text' | 'code'

export const SPEED_GROUP_TITLES: Record<SpeedTestGroup, string> = {
  sprint: 'Sprints',
  text: 'Text',
  code: 'Code',
}

export interface SpeedPassage {
  text: string
  grammar: Grammar
}

export interface SpeedTest {
  id: string
  group: SpeedTestGroup
  title: string
  /** What the test is, in a line. Shown on the card and above the passage. */
  summary: string
  /** Absent: a sprint, typed once. Present: a timed test that runs this long. */
  seconds?: number
  /** A sprint's one passage, or the pool a timed test draws on in shuffled order. */
  passages: SpeedPassage[]
  /** Code tests only: the catalogue language the passages come from. */
  language?: LanguageId
}
