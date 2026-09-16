# 2. Self-host fonts instead of Google Fonts

## Status

Accepted and shipped.

## Context

The typeface pairing (Unbounded for display, Martian Mono for the typing
surface) was originally loaded from `fonts.googleapis.com` /
`fonts.gstatic.com`. Every visitor's browser fetching from Google hands their
IP address and referring page to a third party — a live GDPR question in the
EEA, a German court has already ruled against a site on exactly these facts
(see `docs/HARDENING.md` §4.5) — and it's also a render-blocking
cross-origin request the build can't control or verify.

## Decision

Self-host both faces via `@fontsource-variable/unbounded` and
`@fontsource-variable/martian-mono`. Both are variable fonts, both are
**OFL-1.1** with the licence text shipped inside the npm package, and Vite
fingerprints and serves the `.woff2` files from the site's own origin.

## Consequences

- The privacy exposure goes away, and the CSP can drop Google's origins
  from `font-src` and `style-src` entirely.
- OFL-1.1 requires the licence to accompany the fonts wherever they're
  distributed. The licence living in `node_modules` doesn't satisfy that —
  `node_modules` never reaches a visitor's browser. `THIRD-PARTY-NOTICES.md`
  is copied into `dist/` on every build specifically to close this gap; see
  `package.json`'s `postbuild` script.
- The build becomes hermetic with respect to fonts, which is what makes the
  typography testable in CI rather than depending on a third-party CDN being
  up and returning the same bytes.
