import { describe, expect, it } from 'vitest'
import {
  appendSession,
  beginProbation,
  dailySeries,
  emptyProgress,
  headline,
  lifetimeLedger,
} from './progress'
import type { ProgressDocument, SessionRecord } from './progress'

const baseSession = (over: Partial<SessionRecord> = {}): SessionRecord => ({
  id: over.id ?? 'id',
  trackId: 'react-core',
  lessonId: 'react-core-state',
  drillId: 'react-core-state-1',
  language: 'react',
  at: 1_000,
  wpm: 60,
  rawWpm: 65,
  accuracy: 0.95,
  correctness: 0.98,
  durationMs: 20_000,
  keyLedger: { a: { pressed: 10, missed: 1, latencyMs: 2000, confusions: {}, codes: {} } },
  kind: 'drill',
  ...over,
})

describe('SessionRecord.kind — practice must not reach the speed graphs', () => {
  it('a practice session never enters headline()', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'practice', wpm: 900 }))
    expect(headline(doc).sessionCount).toBe(0)
    expect(headline(doc).bestWpm).toBe(0)
  })

  it('a practice session never enters dailySeries()', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'practice' }))
    expect(dailySeries(doc)).toEqual([])
  })

  it('a practice session still feeds its own key ledger, just not the lifetime one', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'practice' }))
    expect(lifetimeLedger(doc)).toEqual({})
  })

  it('a drill session does everything a practice one does not', () => {
    const doc = appendSession(emptyProgress(), baseSession({ kind: 'drill' }))
    expect(headline(doc).sessionCount).toBe(1)
    expect(lifetimeLedger(doc)['a']?.pressed).toBe(10)
  })
})

describe('probation lifecycle through appendSession', () => {
  it('does nothing until a key is actually on probation', () => {
    const doc = appendSession(emptyProgress(), baseSession())
    expect(doc.probation).toEqual({})
  })

  it('graduates a probationary key once enough clean drill presses land', () => {
    let doc: ProgressDocument = emptyProgress()
    doc = beginProbation(doc, 'a', 500)
    // 35 new presses of 'a', 1 miss — clears the 95% bar over the 30-press window.
    doc = appendSession(
      doc,
      baseSession({
        at: 2000,
        keyLedger: { a: { pressed: 35, missed: 1, latencyMs: 0, confusions: {}, codes: {} } },
      }),
    )
    expect(doc.probation['a']?.status).toBe('graduated')
  })

  it('drops a probationary key that regresses over the window', () => {
    let doc: ProgressDocument = emptyProgress()
    doc = beginProbation(doc, 'a', 500)
    doc = appendSession(
      doc,
      baseSession({
        at: 2000,
        keyLedger: { a: { pressed: 35, missed: 10, latencyMs: 0, confusions: {}, codes: {} } },
      }),
    )
    expect(doc.probation['a']).toBeUndefined()
  })

  it('leaves a probationary key alone until its press window fills', () => {
    let doc: ProgressDocument = emptyProgress()
    doc = beginProbation(doc, 'a', 500)
    doc = appendSession(
      doc,
      baseSession({
        at: 2000,
        keyLedger: { a: { pressed: 5, missed: 0, latencyMs: 0, confusions: {}, codes: {} } },
      }),
    )
    expect(doc.probation['a']?.status).toBe('probation')
  })
})
