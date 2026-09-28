import { describe, expect, it } from 'vitest'
import { languagesInCatalogue, TRACKS } from '../index'
import { KEY_TRACKS } from '../basics/index'
import { ALPHABET, PANGRAM, PROSE } from './prose'
import { SPEED_TEST_TRACK_ID, SPEED_TESTS, speedTestById } from './index'

const byGroup = (group: string) => SPEED_TESTS.filter((test) => test.group === group)

/** Characters a fast typist gets through in five minutes at 160 wpm. */
const FIVE_MINUTES_FAST = 160 * 5 * 5

describe('speed tests', () => {
  it('uses kebab-case ids, unique here and against everything else that is saved', () => {
    const ids = SPEED_TESTS.map((test) => test.id)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(new Set(ids).size).toBe(ids.length)
    const elsewhere = new Set([
      ...TRACKS.flatMap((t) => [t.id, ...t.lessons.flatMap((l) => l.drills.map((d) => d.id))]),
      ...KEY_TRACKS.flatMap((t) => [t.id, ...t.stages.map((s) => s.id)]),
    ])
    for (const id of [...ids, SPEED_TEST_TRACK_ID]) expect(elsewhere.has(id), id).toBe(false)
    expect(speedTestById('speed-alphabet')?.passages[0]?.text).toBe(ALPHABET)
  })

  it('has the two sprints, and the pangram really is one', () => {
    expect(byGroup('sprint').map((t) => t.id)).toEqual(['speed-pangram', 'speed-alphabet'])
    for (const test of byGroup('sprint')) {
      expect(test.seconds, test.id).toBeUndefined()
      expect(test.passages, test.id).toHaveLength(1)
    }
    const letters = new Set(PANGRAM.toLowerCase().replace(/[^a-z]/g, ''))
    expect(letters.size).toBe(26)
    expect(ALPHABET).toBe('abcdefghijklmnopqrstuvwxyz')
  })

  it('times the text tests at two and five minutes', () => {
    expect(byGroup('text').map((t) => t.seconds)).toEqual([120, 300])
  })

  it('gives every catalogue language a code test with plenty to draw on', () => {
    const code = byGroup('code')
    expect(code.map((t) => t.language)).toEqual(languagesInCatalogue())
    for (const test of code) {
      expect(test.seconds, test.id).toBeGreaterThan(0)
      expect(test.passages.length, test.id).toBeGreaterThanOrEqual(10)
    }
  })

  it('draws code tests from short variants only, never a capstone', () => {
    for (const test of byGroup('code')) {
      for (const passage of test.passages) {
        expect(passage.text.split('\n').length, test.id).toBeLessThanOrEqual(10)
      }
    }
  })

  it('writes prose as clean single lines of printable ASCII', () => {
    for (const text of [PANGRAM, ALPHABET, ...PROSE]) {
      expect(text, text).toMatch(/^[\x21-\x7e][\x20-\x7e]*[\x21-\x7e]$/)
      expect(text, text).not.toMatch(/ {2}/)
    }
  })

  it('keeps each paragraph readable at a glance, and none repeated', () => {
    for (const text of PROSE) {
      expect(text.length, text).toBeGreaterThanOrEqual(180)
      expect(text.length, text).toBeLessThanOrEqual(320)
    }
    expect(new Set(PROSE).size).toBe(PROSE.length)
  })

  it('holds more prose than a fast typist gets through in five minutes', () => {
    const total = PROSE.reduce((sum, text) => sum + text.length, 0)
    expect(total).toBeGreaterThan(FIVE_MINUTES_FAST)
  })
})
