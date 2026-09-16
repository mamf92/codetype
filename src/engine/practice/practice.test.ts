import { describe, expect, it } from 'vitest'
import { corpusCount, corpusTotal, frequencyPer1000 } from './corpusFrequency'
import { confusionPairFor, rankForPractice, smoothedErrorRate } from './ranking'
import {
  generateContext,
  generateDiscrimination,
  generateInterference,
  generateIsolation,
  transferDrills,
} from './generators'
import { isReadyToCheck, passesLevel, recheckProbation, startProbation } from './mastery'
import type { KeyLedger, KeyStat } from '@/engine/types'

const key = (over: Partial<KeyStat> = {}): KeyStat => ({
  pressed: 0,
  missed: 0,
  latencyMs: 0,
  confusions: {},
  codes: {},
  ...over,
})

describe('corpusFrequency', () => {
  it('counts real characters from the catalogue, not zero', () => {
    expect(corpusTotal()).toBeGreaterThan(0)
    // Semicolons and parens are used somewhere in a TypeScript/React catalogue.
    expect(corpusCount('(')).toBeGreaterThan(0)
  })

  it('expresses frequency per 1000 characters, proportional to raw count', () => {
    const per1000 = frequencyPer1000('(')
    expect(per1000).toBeCloseTo((corpusCount('(') / corpusTotal()) * 1000, 5)
  })

  it('is zero for a character that never appears', () => {
    expect(frequencyPer1000('§')).toBe(0)
  })
})

describe('smoothedErrorRate', () => {
  it('is smoothed toward 0.5 rather than exactly 0 or 1 on thin evidence', () => {
    const oneMiss = smoothedErrorRate(key({ pressed: 1, missed: 1 }))
    expect(oneMiss).toBeGreaterThan(0.5)
    expect(oneMiss).toBeLessThan(1)
  })

  it('converges toward the true rate as evidence accumulates', () => {
    const thin = smoothedErrorRate(key({ pressed: 4, missed: 1 }))
    const thick = smoothedErrorRate(key({ pressed: 400, missed: 100 }))
    expect(Math.abs(thick - 0.25)).toBeLessThan(Math.abs(thin - 0.25))
  })

  it('treats an untouched key as 50/50, not 0', () => {
    expect(smoothedErrorRate(undefined)).toBe(0.5)
  })
})

describe('rankForPractice', () => {
  it('ranks a frequent, error-prone key above a rare one at the same error rate', () => {
    // '(' is common in this catalogue; an obscure symbol character is not.
    const ledger: KeyLedger = {
      '(': key({ pressed: 20, missed: 6 }),
      '§': key({ pressed: 20, missed: 6 }),
    }
    const ranked = rankForPractice(ledger, 1)
    expect(ranked[0]?.char).toBe('(')
  })

  it('excludes keys with too little evidence', () => {
    const ledger: KeyLedger = { a: key({ pressed: 2, missed: 1 }) }
    expect(rankForPractice(ledger, 5)).toEqual([])
  })
})

describe('confusionPairFor', () => {
  it('returns the character most often typed instead', () => {
    const ledger: KeyLedger = {
      '[': key({ pressed: 10, missed: 4, confusions: { p: 1, ']': 3 } }),
    }
    expect(confusionPairFor(ledger, '[')).toBe(']')
  })

  it('is undefined with no confusion evidence', () => {
    const ledger: KeyLedger = { a: key({ pressed: 10, missed: 0 }) }
    expect(confusionPairFor(ledger, 'a')).toBeUndefined()
  })
})

describe('generators', () => {
  it('isolation repeats only the target character', () => {
    const text = generateIsolation('[')
    expect(new Set([...text.replace(/\s/g, '')])).toEqual(new Set(['[']))
  })

  it('discrimination uses only the two characters given', () => {
    const text = generateDiscrimination('[', ']')
    const chars = new Set([...text.replace(/\s/g, '')])
    expect(chars).toEqual(new Set(['[', ']']))
  })

  it('interference degrades to one pair when current and previous match', () => {
    const text = generateInterference(['[', ']'], ['[', ']'])
    const chars = new Set([...text.replace(/\s/g, '')])
    expect(chars).toEqual(new Set(['[', ']']))
  })

  it('interference draws from both pairs when they differ', () => {
    const text = generateInterference(['[', ']'], [';', "'"])
    const chars = new Set([...text.replace(/\s/g, '')])
    expect(chars).toEqual(new Set(['[', ']', ';', "'"]))
  })

  it('context templates actually contain the target character', () => {
    for (const char of ['[', '(', '{', ';']) {
      expect(generateContext(char)).toContain(char)
    }
  })

  it('context falls back to a generic shape for an unlisted character', () => {
    expect(generateContext('q')).toContain('q')
  })

  it('transfer drills are real catalogue passages containing the target character', () => {
    const drills = transferDrills('(')
    expect(drills.length).toBeGreaterThan(0)
    for (const drill of drills) expect(drill.code).toContain('(')
    // Ranked densest-first.
    for (let i = 1; i < drills.length; i++) {
      expect(drills[i - 1]!.density).toBeGreaterThanOrEqual(drills[i]!.density)
    }
  })

  it('returns nothing for a character absent from the whole catalogue', () => {
    expect(transferDrills('§')).toEqual([])
  })
})

describe('mastery', () => {
  it('passes a clean, unhesitating attempt', () => {
    expect(passesLevel({ pressed: 20, missed: 0, meanLatencyMs: 300 }, 300)).toBe(true)
  })

  it('fails on accuracy alone, regardless of speed', () => {
    expect(passesLevel({ pressed: 20, missed: 3, meanLatencyMs: 100 }, 300)).toBe(false)
  })

  it('fails on hesitation even at perfect accuracy', () => {
    expect(passesLevel({ pressed: 20, missed: 0, meanLatencyMs: 1000 }, 300)).toBe(false)
  })

  it('skips the latency bar with no baseline to judge it against', () => {
    expect(passesLevel({ pressed: 20, missed: 0, meanLatencyMs: 5000 }, null)).toBe(true)
  })

  it('is not ready to check probation before the press window fills', () => {
    const ledger: KeyLedger = { '[': key({ pressed: 5, missed: 0 }) }
    const probation = startProbation('[', ledger, 1000)
    const later: KeyLedger = { '[': key({ pressed: 20, missed: 0 }) }
    expect(isReadyToCheck(probation, later, 2000)).toBe(false)
  })

  it('graduates a probationary key that stays accurate over the window', () => {
    const ledger: KeyLedger = { '[': key({ pressed: 5, missed: 1 }) }
    const probation = startProbation('[', ledger, 1000)
    const after: KeyLedger = { '[': key({ pressed: 40, missed: 2 }) } // 35 new presses, 1 new miss
    expect(isReadyToCheck(probation, after, 2000)).toBe(true)
    const result = recheckProbation(probation, after, 2000)
    expect(result?.status).toBe('graduated')
    expect(result?.box).toBe(1)
    expect(result?.nextCheckAt).toBeGreaterThan(2000)
  })

  it('drops a probationary key that regresses over the window', () => {
    const ledger: KeyLedger = { '[': key({ pressed: 5, missed: 1 }) }
    const probation = startProbation('[', ledger, 1000)
    const after: KeyLedger = { '[': key({ pressed: 40, missed: 10 }) } // 35 new, 9 new missed
    expect(recheckProbation(probation, after, 2000)).toBeUndefined()
  })
})
