import { describe, expect, it } from 'vitest'
import { TRACKS, drillSequence, locateDrill } from './index'
import { compileDrill } from '@/engine/compile'
import { LANGUAGES, typedLength } from './schema'

const allLessons = TRACKS.flatMap((track) => track.lessons)
const allDrills = allLessons.flatMap((lesson) => lesson.drills)

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

  it('is short enough to finish in one sitting', () => {
    for (const drill of allDrills) {
      expect(drill.code.split('\n').length, drill.id).toBeLessThanOrEqual(10)
      expect(typedLength(drill.code), drill.id).toBeLessThanOrEqual(400)
      expect(typedLength(drill.code), drill.id).toBeGreaterThan(5)
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
