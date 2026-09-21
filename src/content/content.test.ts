import { describe, expect, it } from 'vitest'
import { TRACKS, drillSequence, locateDrill } from './index'
import { compileDrill } from '@/engine/compile'
import {
  LANGUAGES,
  capstoneOf,
  conceptLessons,
  coveredLessons,
  isCapstone,
  isReview,
  reviewLessons,
  typedLength,
  variantsOf,
} from './schema'
import type { Drill, Lesson } from './schema'

const allLessons = TRACKS.flatMap((track) => track.lessons)
const allDrills = allLessons.flatMap((lesson) => lesson.drills)
const variantDrills = allDrills.filter((drill) => !isCapstone(drill))
const capstoneDrills = allDrills.filter(isCapstone)

/** Which lesson a drill belongs to, for error messages that name both. */
const lessonOf = (drill: Drill): Lesson =>
  allLessons.find((lesson) => lesson.drills.includes(drill)) as Lesson

describe('catalogue integrity', () => {
  it('has content', () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(6)
    expect(allDrills.length).toBeGreaterThanOrEqual(50)
  })

  it('uses globally unique ids at every level', () => {
    const ids = [
      ...TRACKS.map((t) => t.id),
      ...allLessons.map((l) => l.id),
      ...allDrills.map((d) => d.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses kebab-case ids', () => {
    for (const id of [...TRACKS.map((t) => t.id), ...allDrills.map((d) => d.id)]) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('names a language that exists', () => {
    for (const track of TRACKS) expect(LANGUAGES[track.language]).toBeDefined()
  })

  it('gives every dispatch a date and a source', () => {
    for (const track of TRACKS.filter((t) => t.kind === 'dispatch')) {
      expect(track.publishedAt, track.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(track.publishedAt as string))).toBe(false)
      expect(track.sourceUrl, track.id).toMatch(/^https:\/\//)
    }
  })
})

describe('lesson shape', () => {
  it('teaches by variation — every lesson carries at least three drills', () => {
    for (const lesson of allLessons) {
      expect(lesson.drills.length, lesson.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('gives a concept lesson at least three variants before its capstone', () => {
    // The capstone is the pay-off, not one of the several-ways-of-saying-it.
    // Counting it towards the three would let a lesson ship two variants and
    // a summary and still pass, which is the flat lesson this rule exists to
    // prevent.
    for (const lesson of allLessons.filter((l) => !isReview(l))) {
      expect(variantsOf(lesson).length, lesson.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('states a concept and a summary worth reading', () => {
    for (const lesson of allLessons) {
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(10)
      expect(lesson.concept.length, lesson.id).toBeGreaterThan(20)
    }
  })

  it('keeps sibling drills distinct — no lesson repeats a passage verbatim', () => {
    for (const lesson of allLessons) {
      const passages = lesson.drills.map((d) => d.code)
      expect(new Set(passages).size, lesson.id).toBe(passages.length)
    }
  })
})

describe('drill hygiene', () => {
  it('is clean text: no tabs, no trailing whitespace, no stray blank edges', () => {
    for (const drill of allDrills) {
      expect(drill.code, drill.id).not.toMatch(/\t/)
      expect(drill.code, drill.id).not.toMatch(/[ ]+$/m)
      expect(drill.code, drill.id).toBe(drill.code.trim())
    }
  })

  it('keeps a variant short enough to finish in one sitting', () => {
    for (const drill of variantDrills) {
      expect(drill.code.split('\n').length, drill.id).toBeLessThanOrEqual(10)
      expect(typedLength(drill.code), drill.id).toBeLessThanOrEqual(400)
      expect(typedLength(drill.code), drill.id).toBeGreaterThan(5)
    }
  })

  it('keeps a capstone long enough to be a project and short enough to finish', () => {
    // Deliberately a different budget from a variant, not a relaxed one: a
    // capstone that fits in ten lines is a variant wearing a label, and one
    // past thirty-five is a sitting nobody finishes.
    for (const drill of capstoneDrills) {
      const lines = drill.code.split('\n').length
      expect(lines, drill.id).toBeGreaterThanOrEqual(15)
      expect(lines, drill.id).toBeLessThanOrEqual(35)
      expect(typedLength(drill.code), drill.id).toBeGreaterThan(300)
      expect(typedLength(drill.code), drill.id).toBeLessThanOrEqual(1600)
    }
  })

  it('compiles to a cell stream that reproduces its own source', () => {
    for (const drill of allDrills) {
      const compiled = compileDrill(drill.code, drill.grammar)
      const rebuilt = compiled.lines
        .map((line) => line.indent + line.cells.map((cell) => cell.char).join(''))
        .join('\n')
      expect(rebuilt, drill.id).toBe(compiled.source)
      expect(compiled.cells.length, drill.id).toBeGreaterThan(0)
    }
  })

  it('never opens a line with a character you cannot reach', () => {
    // Every line must either be blank or start with a real character, since
    // indentation is ghosted and the caret jumps straight to content.
    for (const drill of allDrills) {
      for (const line of compileDrill(drill.code, drill.grammar).lines) {
        if (line.cells.length > 0) expect(line.cells[0]?.char).not.toBe(' ')
      }
    }
  })
})

describe('capstones', () => {
  it('closes every concept lesson with exactly one capstone, last', () => {
    for (const lesson of allLessons.filter((l) => !isReview(l))) {
      const capstones = lesson.drills.filter(isCapstone)
      expect(capstones.length, lesson.id).toBe(1)
      expect(lesson.drills.at(-1)?.id, lesson.id).toBe(capstones[0]?.id)
    }
  })

  it('briefs every capstone — the scenario has to arrive before the typing does', () => {
    for (const drill of capstoneDrills) {
      expect(drill.brief, drill.id).toBeDefined()
      expect((drill.brief as string).length, drill.id).toBeGreaterThan(40)
    }
  })

  it('never briefs a variant, whose note says the same thing in the right place', () => {
    for (const drill of variantDrills) {
      expect(drill.brief, drill.id).toBeUndefined()
    }
  })

  it('does not simply retype a variant — a capstone is longer than every sibling', () => {
    // Reviews are all capstone and have no variants to be longer than, so
    // this one only has something to say about a concept lesson's closer.
    for (const drill of capstoneDrills.filter((d) => !isReview(lessonOf(d)))) {
      const siblings = variantsOf(lessonOf(drill))
      const longest = Math.max(...siblings.map((sibling) => typedLength(sibling.code)))
      expect(typedLength(drill.code), drill.id).toBeGreaterThan(longest)
    }
  })
})

describe('reviews', () => {
  it('marks a review lesson and fills in what it covers', () => {
    for (const lesson of allLessons.filter(isReview)) {
      expect(lesson.covers, lesson.id).toBeDefined()
      expect((lesson.covers as string[]).length, lesson.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('leaves covers off a concept lesson, which reviews nothing', () => {
    for (const lesson of allLessons.filter((l) => !isReview(l))) {
      expect(lesson.covers, lesson.id).toBeUndefined()
    }
  })

  it('builds a review entirely out of capstones — no new variants sneak in', () => {
    for (const lesson of allLessons.filter(isReview)) {
      for (const drill of lesson.drills) {
        expect(isCapstone(drill), drill.id).toBe(true)
      }
    }
  })

  it('reviews the block of concept lessons that precedes it, in order', () => {
    // The cadence is 01 02 03 04 05 -> REVIEW: a review closes the run of
    // concept lessons since the last one, naming every member of that run and
    // nothing else. Checking the exact list rather than a count is what keeps
    // a review honest when lessons get reordered or inserted later.
    for (const track of TRACKS) {
      let block: string[] = []
      for (const lesson of track.lessons) {
        if (!isReview(lesson)) {
          block.push(lesson.id)
          continue
        }
        expect(lesson.covers, lesson.id).toEqual(block)
        block = []
      }
      expect(block, `${track.id} ends on an unreviewed block`).toEqual([])
    }
  })

  it('never lets a run of concepts grow past five without a review', () => {
    for (const track of TRACKS) {
      for (const review of reviewLessons(track)) {
        expect(coveredLessons(track, review).length, review.id).toBeLessThanOrEqual(5)
      }
    }
  })

  it('resolves every covered id to a real lesson in the same track', () => {
    for (const track of TRACKS) {
      for (const review of reviewLessons(track)) {
        expect(coveredLessons(track, review).length, review.id).toBe(review.covers?.length)
      }
    }
  })

  it('gives every track at least one review, and every concept lesson a capstone', () => {
    for (const track of TRACKS) {
      expect(reviewLessons(track).length, track.id).toBeGreaterThanOrEqual(1)
      for (const lesson of conceptLessons(track)) {
        expect(capstoneOf(lesson), lesson.id).toBeDefined()
      }
    }
  })
})

describe('navigation', () => {
  it('sequences a track into a walkable order', () => {
    for (const track of TRACKS) {
      const sequence = drillSequence(track)
      expect(sequence.length).toBe(track.lessons.flatMap((l) => l.drills).length)
      expect(sequence[0]?.position).toBe(0)
      expect(sequence.at(-1)?.position).toBe(sequence.length - 1)
    }
  })

  it('locates any drill from its track and drill id', () => {
    for (const track of TRACKS) {
      for (const lesson of track.lessons) {
        for (const drill of lesson.drills) {
          expect(locateDrill(track.id, drill.id)?.drill.id, drill.id).toBe(drill.id)
        }
      }
    }
  })

  it('returns undefined for ids that do not exist', () => {
    expect(locateDrill('nope', 'nope')).toBeUndefined()
    expect(locateDrill(TRACKS[0]?.id ?? '', 'nope')).toBeUndefined()
  })
})
