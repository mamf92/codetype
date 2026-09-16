# 4. Four themes, two CRT eras — not a colour inversion

## Status

Accepted (see #2 and its implementing pull request).

## Context

The original dark theme rendered untyped code — the text you must read in
order to type it — at 1.96:1 contrast against the background, well below
WCAG AA. That's not an audit nag; it's the primary function of the product
being hard to see (`docs/HARDENING.md` §5.1). The obvious fix was to raise
that one theme's dim tokens until they cleared 4.5:1. That was rejected: it
would have won correctness by spending the theme's entire visual identity,
and it still leaves no answer for anyone who wants a light background at
all.

## Decision

Ship four themes instead of patching one:

| Theme | Ground | Untyped code |
| --- | --- | --- |
| Amber phosphor (`dark`) | warm CRT tube | 1.96:1 — kept deliberately, the original look |
| Amber, high contrast (`dark-contrast`) | same tube, pushed | clears AAA |
| Monochrome screen (`light`) | cool blue-white CRT | clears AA |
| Screen, high contrast (`light-contrast`) | same screen, pushed | clears AAA |

The axis between the two pairs is **temperature, not brightness** — dark is
a warm amber phosphor tube, light is the cool monochrome screen that came
after it, deliberately **not paper** (no cream, no ivory; the ground stays a
screen the whole way through, because the product is a screen). Both
high-contrast themes clear AAA on every token, syntax colours included, not
just body text.

`dark` is the one theme allowed to keep failing its own target — it's the
existing look, kept on purpose, verified by an explicit exemption in
`src/lib/themes.test.ts` rather than a silent pass.

Shown once on a first-visit welcome screen (four cards, live full-page
preview as you move between them, initial guess from
`prefers-color-scheme` + `prefers-contrast`), and changeable afterwards in
Settings.

## Consequences

- Every component that reached for a literal colour instead of a
  `--color-*` custom property had to be found and fixed — inline `style`
  colours don't re-render on a theme switch, which is how the syntax
  highlighter and the typing surface's own ghost/pending tokens were found
  to be hardcoded hex.
- The welcome screen's own chrome (labels, the button that leaves) has to
  stay on the high-contrast sibling of whichever scheme is previewing,
  or previewing the 1.96:1 theme would hide the control needed to leave it.
- `ProgressDocument` gained an optional `theme` field rather than a version
  bump (see ADR 0001) — undefined means "no choice recorded yet", which is
  also the correct state for anyone who used the app before this shipped.
