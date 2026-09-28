import type { SpeedTest } from '@/content/speed/schema'
import type { SpeedTestStanding } from '@/store/progress'
import { sprintTime } from '@/lib/duration'

/** What a test asks for, in a word: a sprint's length, or how long a timed test runs. */
export const testLength = (test: SpeedTest): string =>
  test.seconds === undefined
    ? `${test.passages[0]?.text.length ?? 0} keys`
    : test.seconds % 60 === 0
      ? `${test.seconds / 60} min`
      : `${test.seconds}s`

/**
 * The number a test is ranked on — a sprint's fastest clean time, otherwise
 * its best wpm — or null if it has never been taken.
 */
export function bestResult(test: SpeedTest, standing: SpeedTestStanding): string | null {
  if (standing.runs === 0) return null
  if (test.seconds === undefined) {
    return standing.fastestCleanMs === null ? 'no clean run' : sprintTime(standing.fastestCleanMs)
  }
  return `${standing.bestWpm} wpm`
}
