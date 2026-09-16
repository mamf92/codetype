import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('is 1 for identical colours', () => {
    expect(contrastRatio('#000000', '#000000')).toBeCloseTo(1, 5)
  })

  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('does not care which colour comes first', () => {
    expect(contrastRatio('#0c0a08', '#e8dccb')).toBeCloseTo(
      contrastRatio('#e8dccb', '#0c0a08'),
      10,
    )
  })
})

/**
 * The token table for the current (amber phosphor) theme, checked against
 * the page background it actually sits on. This is deliberate: axe cannot
 * resolve contrast on this site at all, because the background is a layered
 * gradient it cannot flatten to a single colour — it reports every element
 * `incomplete` rather than passing or failing (see #3). A gradient has no
 * single "the colour", so this test asserts against the background's darkest
 * stop, `--color-ink`, which is also the flat colour axe's own docs say a
 * gradient-in-CSS effectively degrades to for reading purposes and is at
 * least as dark as every other stop, so it can only *undercount* contrast,
 * never overstate it.
 *
 * Once #2 lands the four-theme system this table grows one dimension (per
 * theme) and the two high-contrast themes get an AAA floor instead of AA.
 * For now this is the whole of the existing dark theme.
 */
describe('token contrast against the page background', () => {
  const BACKGROUND = '#0c0a08' // --color-ink

  const AA = 4.5

  it.each([
    ['parchment (body text)', '#e8dccb'],
    ['amber (chrome, carets)', '#ffb000'],
    ['signal / cyan (correct)', '#3ddbd9'],
    ['fault / red (error)', '#e24b3f'],
    ['muted', '#8f8172'],
  ])('%s clears AA (%s)', (_label, hex) => {
    expect(contrastRatio(hex, BACKGROUND)).toBeGreaterThanOrEqual(AA)
  })

  /**
   * Known failures, measured in docs/HARDENING.md §5.1 and tracked for a fix
   * in #2 (the theme system rework raises the dim end of the palette rather
   * than patching this one in isolation). Asserted here, explicitly, rather
   * than silently passing — a regression that makes these *worse* should
   * still fail loudly even before #2 lands.
   */
  it.each([
    ['faint (micro-labels)', '#6f6355', 3.38],
    ['syntax comment', '#5c5245', 2.59],
    ['ghost (untyped code)', '#4a4036', 1.96],
  ])('%s fails AA today (%s) — tracked in #2', (_label, hex, known) => {
    const ratio = contrastRatio(hex, BACKGROUND)
    expect(ratio).toBeLessThan(AA)
    expect(ratio).toBeCloseTo(known, 1)
  })

  it('ghost-deep (indent dots) is a documented exception, not a bug', () => {
    // Decorative whitespace markers for text you are explicitly not asked to
    // type. Nothing is lost if they go unseen, so this is a deliberate
    // suppression rather than a target — see docs/HARDENING.md §5.1.
    expect(contrastRatio('#2b241b', BACKGROUND)).toBeLessThan(AA)
  })
})
