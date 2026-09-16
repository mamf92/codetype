# 1. MVP foundations

## Status

Accepted. Shipped in the initial MVP; unchanged since.

## Context

CodeType needed a stack, a hosting story, a persistence model and a visual
direction before any content could be written. These choices needed to be
made once, early, and then left alone so the catalogue could grow against a
stable foundation.

## Decision

| Decision | Choice |
| --- | --- |
| Stack | Vite + React 19 + TypeScript + Tailwind v4 |
| Hosting | Netlify, with Cloudflare Pages as a drop-in fallback |
| Content | Hand-authored typed modules in `src/content/`, not a CMS or a database |
| Typing mode | Forgiving flow — a wrong character is marked and recorded, never blocks the cursor |
| Persistence | One versioned `localStorage` document, no backend, no accounts |
| Routing | React Router, SPA fallback via `_redirects` / `netlify.toml` |

Assumptions taken alongside these, not re-litigated since: progress is
per-browser (no accounts, no sync — the store is versioned and serialisable
so a backend could be bolted on later without a migration crisis); npm as
the package manager; syntax highlighting via `refractor` (Prism grammars,
proper ESM, no globals).

## Consequences

- No backend means no server-side attack surface (see `SECURITY.md`) but
  also no cross-device sync — progress is genuinely per-browser.
- The forgiving-flow typing model is why `SessionState` records both
  `accuracy` (first-press correctness) and `correctness` (final state after
  backspace) — see the invariant in `CLAUDE.md`.
- A versioned document (`ProgressDocument.version`) is what let later
  additions — `favouriteLanguages`, and `theme` in ADR 0004 — land without a
  migration, by treating a missing field as "unanswered" rather than bumping
  the version.
