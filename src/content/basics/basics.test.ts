import { describe, expect, it } from 'vitest'
import { compileDrill } from '@/engine/compile'
import { TRACKS } from '../index'
import { typedLength } from '../schema'
import { KEY_TRACKS, keyTrackById } from './index'
import { STAGE_ORDER, type KeyStage, type KeyStageKind, type KeyTrack } from './schema'

const allStages = KEY_TRACKS.flatMap((track) => track.stages.map((stage) => ({ track, stage })))

/**
 * Share of a passage's typed, non-space characters that are the track's focus
 * keys. A key track that drifts into ordinary words has stopped drilling the
 * keys it is named for; this is what notices.
 */
function density(track: KeyTrack, stage: KeyStage, passage: string): number {
  const typed = compileDrill(passage, stage.grammar).cells.filter(
    (cell) => cell.kind === 'char' && cell.char !== ' ',
  )
  return typed.filter((cell) => track.focus.includes(cell.char)).length / typed.length
}

const meanDensity = (track: KeyTrack, kind: KeyStageKind): number => {
  const stage = track.stages.find((s) => s.kind === kind)!
  const values = stage.passages.map((p) => density(track, stage, p))
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Floors, measured from the tracks as written and set a little under the
 * lowest passage of each kind — so a new passage that is noticeably wordier
 * than its siblings fails, and the existing ones do not fail by accident.
 */
const FLOOR: Record<KeyStageKind, number> = { reps: 0.65, patterns: 0.28, code: 0.2, load: 0.25 }

describe('key tracks', () => {
  it('has the four tracks the Basics page promises', () => {
    expect(KEY_TRACKS.map((t) => t.id)).toEqual([
      'number-row',
      'javascript-symbols',
      'python-symbols',
      'shell-symbols',
    ])
    expect(keyTrackById('number-row')).toBe(KEY_TRACKS[0])
  })

  it('uses kebab-case ids, unique here and against the catalogue', () => {
    const ids = [...KEY_TRACKS.map((t) => t.id), ...allStages.map(({ stage }) => stage.id)]
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    const catalogue = new Set(TRACKS.map((t) => t.id))
    for (const id of ids) expect(catalogue.has(id), id).toBe(false)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('stays out of the catalogue, so it never skews corpus frequency', () => {
    for (const track of KEY_TRACKS) expect(TRACKS.some((t) => t.id === track.id)).toBe(false)
  })

  it('runs every track through the four stages, in order', () => {
    for (const track of KEY_TRACKS) {
      expect(
        track.stages.map((s) => s.kind),
        track.id,
      ).toEqual(STAGE_ORDER)
    }
  })

  it('gives every stage several passages, none repeated', () => {
    for (const { stage } of allStages) {
      expect(stage.passages.length, stage.id).toBeGreaterThanOrEqual(3)
      expect(new Set(stage.passages).size, stage.id).toBe(stage.passages.length)
    }
  })

  it('keeps reps and patterns out of the highlighter — they are not code', () => {
    const early = allStages.filter(
      ({ stage }) => stage.kind === 'reps' || stage.kind === 'patterns',
    )
    for (const { stage } of early) {
      expect(stage.grammar, stage.id).toBe('plain')
    }
  })
})

describe('key track passages', () => {
  it('are short enough to finish in one sitting', () => {
    for (const { stage } of allStages) {
      for (const passage of stage.passages) {
        expect(passage.split('\n').length, stage.id).toBeLessThanOrEqual(10)
        expect(typedLength(passage), stage.id).toBeGreaterThan(30)
        expect(typedLength(passage), stage.id).toBeLessThanOrEqual(400)
      }
    }
  })

  it('carry no tabs, trailing whitespace or blank edges', () => {
    for (const { stage } of allStages) {
      for (const passage of stage.passages) {
        expect(passage, stage.id).not.toMatch(/\t/)
        expect(passage, stage.id).not.toMatch(/[ ]+$/m)
        expect(passage, stage.id).toBe(passage.trim())
      }
    }
  })

  it('never open a line on a space the caret cannot reach', () => {
    for (const { stage } of allStages) {
      for (const passage of stage.passages) {
        for (const line of compileDrill(passage, stage.grammar).lines) {
          if (line.cells.length > 0) expect(line.cells[0]?.char, stage.id).not.toBe(' ')
        }
      }
    }
  })

  it('are typable on any keyboard — printable ASCII only', () => {
    for (const { stage } of allStages) {
      for (const passage of stage.passages) expect(passage, stage.id).toMatch(/^[\x20-\x7e\n]+$/)
    }
  })

  it('stay dense in the keys the track is named for', () => {
    for (const { track, stage } of allStages) {
      for (const passage of stage.passages) {
        expect(density(track, stage, passage), `${stage.id}: ${passage}`).toBeGreaterThanOrEqual(
          FLOOR[stage.kind],
        )
      }
    }
  })

  it('climb: reps densest, patterns above code, and load harder than code', () => {
    for (const track of KEY_TRACKS) {
      expect(meanDensity(track, 'reps'), track.id).toBeGreaterThan(meanDensity(track, 'patterns'))
      expect(meanDensity(track, 'patterns'), track.id).toBeGreaterThan(meanDensity(track, 'code'))
      expect(meanDensity(track, 'load'), track.id).toBeGreaterThan(meanDensity(track, 'code'))
    }
  })
})
