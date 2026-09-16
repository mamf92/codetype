import { describe, expect, it } from 'vitest'
import { corpusCount, corpusTotal, frequencyPer1000 } from './corpusFrequency'
import { rankForPractice, smoothedErrorRate } from './ranking'
import { generateContext, generateDiscrimination, generateIsolation } from './generators'
import { generateWeakKeyPractice, MAX_PRACTICE_KEYS, WEAK_KEY_STEP_NAMES } from './weakKeys'
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

  it('context templates actually contain the target character', () => {
    for (const char of ['[', '(', '{', ';']) {
      expect(generateContext(char)).toContain(char)
    }
  })

  it('context falls back to a generic shape for an unlisted character', () => {
    expect(generateContext('q')).toContain('q')
  })
})

describe('generateWeakKeyPractice', () => {
  it('returns nothing for an empty key set', () => {
    expect(generateWeakKeyPractice([])).toEqual([])
  })

  it('returns one passage per named step', () => {
    const steps = generateWeakKeyPractice(['{', '"', '-'])
    expect(steps).toHaveLength(WEAK_KEY_STEP_NAMES.length)
  })

  it('every step contains every practiced key at least once', () => {
    const keys = ['{', '"', '-']
    for (const step of generateWeakKeyPractice(keys)) {
      for (const char of keys) expect(step).toContain(char)
    }
  })

  it('no line opens on a space — the caret must always have somewhere to land', () => {
    for (const step of generateWeakKeyPractice(['{', '"', '-'])) {
      for (const line of step.split('\n')) expect(line.startsWith(' ')).toBe(false)
    }
  })

  it('degrades gracefully to a solo drill with just one key', () => {
    const steps = generateWeakKeyPractice(['('])
    expect(steps).toHaveLength(WEAK_KEY_STEP_NAMES.length)
    for (const step of steps) expect(step).toContain('(')
  })

  it('caps the practiced set rather than producing an unreadable passage', () => {
    // Symbols, not letters — the context step's fallback template ("let X1
    // = value") is made of ordinary English words, so a letter key would
    // show up in the output incidentally even when it wasn't practiced.
    const many = ['!', '@', '#', '$', '%', '^']
    const steps = generateWeakKeyPractice(many)
    const used = new Set(steps.join('').replace(/[\s,]/g, ''))
    for (const extra of many.slice(MAX_PRACTICE_KEYS)) expect(used.has(extra)).toBe(false)
  })

  it('deduplicates repeated keys instead of drilling the same one twice', () => {
    const steps = generateWeakKeyPractice(['(', '('])
    expect(steps).toHaveLength(WEAK_KEY_STEP_NAMES.length)
  })
})
