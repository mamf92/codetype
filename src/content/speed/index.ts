import { LANGUAGES, type LanguageId } from '../schema'
import { languagesInCatalogue, TRACKS } from '../index'
import { ALPHABET, PANGRAM, PROSE } from './prose'
import type { SpeedPassage, SpeedTest } from './schema'

/** How long each code test runs. Code is slower going than prose; a minute is plenty to measure. */
export const CODE_TEST_SECONDS = 60

/** The `trackId` every speed test session is saved under. */
export const SPEED_TEST_TRACK_ID = 'speed-test'

const prose: SpeedPassage[] = PROSE.map((text) => ({ text, grammar: 'plain' }))

/**
 * Every short variant written in a language, across every track in it.
 * Capstones stay out: at 15–35 lines they are a sitting of their own, and one
 * would swallow most of a minute.
 */
const variantsIn = (language: LanguageId): SpeedPassage[] =>
  TRACKS.filter((track) => track.language === language).flatMap((track) =>
    track.lessons.flatMap((lesson) =>
      lesson.drills
        .filter((drill) => (drill.kind ?? 'variant') === 'variant')
        .map((drill) => ({ text: drill.code, grammar: drill.grammar })),
    ),
  )

/** The tests, in the order the Basics page shows them. */
export const SPEED_TESTS: SpeedTest[] = [
  {
    id: 'speed-pangram',
    group: 'sprint',
    title: 'The quick brown fox',
    summary: 'One sentence with every letter of the alphabet in it. Clock starts on the first key.',
    passages: [{ text: PANGRAM, grammar: 'plain' }],
  },
  {
    id: 'speed-alphabet',
    group: 'sprint',
    title: 'A to Z',
    summary: 'The alphabet, in order, as fast as it will go. Clock starts on the first key.',
    passages: [{ text: ALPHABET, grammar: 'plain' }],
  },
  {
    id: 'speed-text-2',
    group: 'text',
    title: 'Two minutes',
    summary: 'Plain prose for two minutes. Finish a paragraph and the next one is already there.',
    seconds: 120,
    passages: prose,
  },
  {
    id: 'speed-text-5',
    group: 'text',
    title: 'Five minutes',
    summary: 'Plain prose for five minutes — long enough that holding a pace is the test.',
    seconds: 300,
    passages: prose,
  },
  ...languagesInCatalogue().map((language): SpeedTest => ({
    id: `speed-code-${language}`,
    group: 'code',
    title: LANGUAGES[language].label,
    summary: `A minute of real ${LANGUAGES[language].label}, drawn from every lesson in the catalogue.`,
    seconds: CODE_TEST_SECONDS,
    passages: variantsIn(language),
    language,
  })),
]

export const speedTestById = (id: string): SpeedTest | undefined =>
  SPEED_TESTS.find((test) => test.id === id)
