# 8. One type, tracking and spacing scale

## Status

Accepted.

## Context

An audit of the pages found 8 text sizes (8, 9, 10, 11, 12, 13, 15, 17px),
9 letter-spacings (0.02em to 0.22em), page sections spaced by `gap-5`,
`gap-6` or `gap-7` depending on the route, and four sizes of the same
amber button. None of it was chosen; each value was whatever looked right
in the one place it was added. Nine-pixel text carried table headers,
filter labels and the drill screen's readouts, in a product whose whole
argument (ADR 0004) is that reading comes first.

## Decision

The scale lives in `@theme` in `src/styles/index.css`, as Tailwind tokens,
and components pick by role:

| Token | Value | Role |
| --- | --- | --- |
| `text-label` | 10px | uppercase, tracked text: eyebrows, column heads, chips, buttons. The floor |
| `text-meta` | 11px | small lowercase text: counts, dates, table cells, footers |
| `text-body` | 12px | anything read as a sentence |
| `text-glyph` / `text-logo` / `text-title` / `text-figure` | 13 / 15 / 17 / 40px | a keycap, the wordmark, a card title, a stat number |
| `tracking-label` | 0.18em | every uppercase run |
| `tracking-section` | 0.22em | a `SectionLabel` (the page's h2s) |
| `tracking-display` / `tracking-code` | 0.02em / -0.04em | the wordmark; the typing surface |
| `gap-page` / `gap-grid` / `gap-section` | 1.75 / 1.25 / 0.875rem | between a page's sections; between cards in a grid; under a SectionLabel |

Buttons come from `BUTTON` in `src/components/ui/button.ts`: primary,
secondary or danger, one size. One primary per view.

`src/lib/scale.test.ts` fails on any literal `text-[Npx]`, `text-xs` or
`tracking-[…]` outside `src/content/` (drill passages are content, and a
class name in one is text to type).

## Consequences

- The smallest text in the app went from 8px to 10px, and paragraphs from
  11px to 12px.
- A size the scale doesn't have is a change to this table, made on
  purpose, not a literal added in passing.
