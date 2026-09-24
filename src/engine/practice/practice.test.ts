import { describe, expect, it } from 'vitest'
import { corpusCount, corpusTotal, frequencyPer1000 } from './corpusFrequency'
import { rankForPractice, smoothedErrorRate } from './ranking'
import {
  CODE_WORDS,
  contextFragments,
  generateContext,
  generateDiscrimination,
  generateIsolation,
} from './generators'
import { partnerFor } from './partners'
import {
  ladderSteps,
  MAX_PRACTICE_KEYS,
  practiceTargets,
  streakSteps,
  type PracticeTarget,
} from './weakKeys'
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

  it('never offers the line break, however badly it scores', () => {
    // The ledger records every line break, and `compileDrill` emits one per
    // line, so '\n' would otherwise rank at the very top on frequency alone
    // — and a passage generated from it is untypable: Enter would be both
    // the character being drilled and the key that moves past it.
    const ledger: KeyLedger = {
      '\n': key({ pressed: 200, missed: 100 }),
      '(': key({ pressed: 20, missed: 1 }),
    }
    expect(rankForPractice(ledger, 1).map((candidate) => candidate.char)).toEqual(['('])
  })

  it('never offers the space — a line of spaces has no reachable caret', () => {
    const ledger: KeyLedger = {
      ' ': key({ pressed: 200, missed: 100 }),
      '(': key({ pressed: 20, missed: 1 }),
    }
    expect(rankForPractice(ledger, 1).map((candidate) => candidate.char)).toEqual(['('])
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

describe('contextFragments', () => {
  const printable = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).filter(
    (c) => c !== ' ',
  )

  it('every printable ASCII key gets fragments that contain it', () => {
    for (const char of printable) {
      const fragments = contextFragments(char)
      expect(fragments.length, char).toBeGreaterThanOrEqual(3)
      for (const fragment of fragments) expect(fragment, char).toContain(char)
    }
  })

  it('no fragment opens or closes on a space — a line built from one must stay typable', () => {
    for (const char of printable) {
      for (const fragment of contextFragments(char)) {
        expect(fragment.trim(), JSON.stringify(fragment)).toBe(fragment)
      }
    }
  })

  it('every letter appears in at least three code words', () => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      expect(CODE_WORDS.filter((w) => w.includes(letter)).length, letter).toBeGreaterThanOrEqual(3)
    }
  })

  it('a character outside ASCII still gets real fragments', () => {
    for (const fragment of contextFragments('ø')) expect(fragment).toContain('ø')
  })
})

describe('partnerFor', () => {
  it('prefers the key actually typed instead, most often first', () => {
    expect(partnerFor('[', key({ confusions: { p: 1, ']': 4 } }))).toBe(']')
    expect(partnerFor('[', key({ confusions: { p: 5, ']': 4 } }))).toBe('p')
  })

  it('falls back to the syntactic twin with no confusion on record', () => {
    expect(partnerFor('{', undefined)).toBe('}')
    expect(partnerFor('"', key())).toBe("'")
  })

  it('never partners a key with something undrillable', () => {
    expect(partnerFor('(', key({ confusions: { ' ': 9, '\n': 9 } }))).toBe(')')
    expect(partnerFor('q', key({ confusions: { ' ': 9 } }))).toBeNull()
  })
})

const targets = (chars: string[]): PracticeTarget[] => practiceTargets(chars, {})

/** Every line of every step must give the caret somewhere to land. */
function expectTypable(steps: { passage: string }[]): void {
  for (const step of steps) {
    expect(step.passage.length).toBeGreaterThan(0)
    for (const line of step.passage.split('\n')) {
      expect(line.startsWith(' '), JSON.stringify(line)).toBe(false)
      expect(line.endsWith(' '), JSON.stringify(line)).toBe(false)
      expect(line.length).toBeGreaterThan(0)
    }
  }
}

describe('practiceTargets', () => {
  it('deduplicates, caps and pairs each key', () => {
    const picked = practiceTargets(['(', '(', '!', '@', '#', '$', '%'], {
      '!': key({ confusions: { '1': 3 } }),
    })
    expect(picked.map((t) => t.char)).toEqual(['(', '!', '@', '#'])
    expect(picked.map((t) => t.partner)).toEqual([')', '1', null, null])
  })
})

describe('ladderSteps', () => {
  it('returns nothing for an empty key set', () => {
    expect(ladderSteps([])).toEqual([])
  })

  it('is five rungs, every one of which drills every key', () => {
    const keys = ['{', '"', '-']
    const steps = ladderSteps(targets(keys))
    expect(steps.map((s) => s.name)).toEqual([
      'Isolate',
      'Mix-ups',
      'Interleave',
      'Fuse',
      'In code',
    ])
    for (const step of steps) for (const char of keys) expect(step.passage).toContain(char)
    expectTypable(steps)
  })

  it('drills a key against the key the ledger says it gets confused with', () => {
    const [, mixUps] = ladderSteps(practiceTargets(['['], { '[': key({ confusions: { p: 6 } }) }))
    expect(new Set(mixUps!.passage.replace(/\s/g, ''))).toEqual(new Set(['[', 'p']))
  })

  it('a lone key interleaves with its partner rather than with nothing', () => {
    const [, , interleave] = ladderSteps(targets(['(']))
    expect(interleave!.passage).toContain(')')
  })

  it('a lone key with no partner still produces a typable ladder', () => {
    const steps = ladderSteps(targets(['q']))
    expect(steps).toHaveLength(5)
    expectTypable(steps)
  })

  it('is never highlighted — even the in-code rung mixes languages', () => {
    for (const step of ladderSteps(targets(['(', "'"]))) expect(step.grammar).toBe('plain')
  })
})

describe('streakSteps', () => {
  it('is one line per key, then one with all of them', () => {
    const keys = ['[', ';', '=']
    const steps = streakSteps(targets(keys))
    expect(steps).toHaveLength(keys.length + 1)
    keys.forEach((char, i) => expect(steps[i]!.passage).toContain(char))
    for (const char of keys) expect(steps.at(-1)!.passage).toContain(char)
    expectTypable(steps)
  })

  it('keeps every step to a single line — three clean runs of it is the ask', () => {
    for (const step of streakSteps(targets(['[', ';', '=', 'q']))) {
      expect(step.passage).not.toContain('\n')
    }
  })

  it('a single key has no separate all-of-them line', () => {
    expect(streakSteps(targets(['(']))).toHaveLength(1)
  })

  it('caps the practiced set rather than producing an unreadable passage', () => {
    const many = ['!', '@', '#', '$', '%', '^']
    const used = new Set(
      streakSteps(targets(many))
        .map((s) => s.passage)
        .join(''),
    )
    for (const extra of many.slice(MAX_PRACTICE_KEYS)) expect(used.has(extra)).toBe(false)
  })
})
