# CLAUDE.md

Repo conventions and invariants for anyone — human or agent — working on
CodeType. If you're a tool that looks for `AGENTS.md` instead, that file
just points back here; this is the canonical one.

## What this is

A typing trainer that doubles as concept rehearsal. Every lesson holds
several **drills that say the same thing differently** — the same hook at
several call sites, the same utility type in several shapes. The repetition
trains the fingers; the variation is what teaches you when the idea applies.
That is the one idea everything else here serves. A change that makes a
lesson faster to add but flatter to type (e.g. dropping the "several
variants" requirement) is fighting the product, not improving it.

## Layout

```
src/
  engine/      the typing core — pure, framework-free, heavily tested
  content/     the catalogue: schema plus authored tracks
  store/       localStorage progress and everything derived from it
  routes/      Home, Explore, Statistics, Drill, Settings
  components/  layout, the typing surface, cards, primitives
  lib/         small framework-free helpers (highlighting, theming, etc.)
design/        canvas sources for screen mockups and theme explorations
docs/          durable decisions (docs/decisions/, ADR-style) and reference
                material — plans live in GitHub issues, not here
```

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, production build into `dist/`, copies `THIRD-PARTY-NOTICES.md` in |
| `npm test` | Engine, store and catalogue tests (pure, no browser) |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier, check-only |
| `npm run check` | Lint, test, build — the gate CI and PRs are held to |

There is no component-level browser testing today (see `docs/HARDENING.md`)
— unit tests are pure functions only. **For anything visual or
interactive, drive it by hand in a real browser rather than trusting the
build.** Every real bug found in this repo so far was found that way, not by
a test.

## Invariants — things that will look like bugs if you don't know they're deliberate

- **Leading indentation is ghosted, never typed.** A drill's passage shows
  its indentation dimmed, but the cell stream (`compileDrill` in
  `src/engine/compile.ts`) never asks you to type it — the caret lands on
  the first real character of a line. A drill authored with a line that
  opens on a space would have nowhere reachable for the caret to land;
  `content.test.ts` enforces this.
- **A wrong character never blocks; a line break always does.** Typing the
  wrong character advances the cursor anyway and records the miss — a typo
  can't stall you, and backspace lets you fix it (the correction shows in
  `correctness`, the original mistake stays in `accuracy`). A line break is
  structural: the wrong key at a line break, or Enter pressed mid-line,
  is recorded as an error but does **not** advance. See `src/engine/session.ts`.
- **Progress has no stored counters.** Everything on Home, Statistics and
  Explore — best WPM, streaks, per-key accuracy, due-for-revisit — is derived
  fresh from `ProgressDocument.sessions` (`src/store/progress.ts`) on every
  read. There is nowhere for a denormalised total to drift out of sync with
  reality, because there's no denormalised total. Don't add one; add a
  derivation.
- **`SessionRecord` will eventually need `kind: 'drill' | 'practice'`** once
  targeted key-practice sessions land (see the open issue for it) — practice
  reps must never reach the speed graphs the same way a real drill does.
- **`event.code`, not just `event.key`, matters for keyboard logic.** This
  codebase is used on non-US keyboards — a Norwegian layout puts `[ ] { }`
  behind AltGr on the digit row, so anything that reasons about "adjacent
  keys" using US-keyboard assumptions will be wrong for a real fraction of
  users.
- **axe-core cannot see contrast on this site.** The page background is a
  layered gradient; axe reports every element's contrast `incomplete`
  rather than pass/fail, which is not the same as passing. Contrast is
  checked with a deterministic unit test over the token table instead — see
  `src/lib/themes.test.ts` and `docs/HARDENING.md`.

## Content rules `content.test.ts` enforces

Anything added to `src/content/tracks/` is checked automatically — read the
tests (`src/content/content.test.ts`) for the exact assertions, but in
summary: globally unique kebab-case ids at every level; every lesson carries
**at least 3 drills**; no lesson repeats the same passage verbatim across its
own drills; a drill is **at most 10 lines** and long enough to be worth
typing but short enough to finish in one sitting; no tabs, no trailing
whitespace, no stray blank edges; no line opens with a space (see the
indentation invariant above); every dispatch carries a real `publishedAt`
date and `sourceUrl`.

## Licensing — this matters for what you write, not just how

Code is MIT. **`src/content/` is CC-BY-SA-4.0** — a different, share-alike
licence, because the catalogue is the commons this project exists to grow
(see `src/content/LICENSE` and `CONTRIBUTING.md`). If you're generating or
editing track content, you're producing CC-BY-SA-4.0 material, not MIT code;
don't treat drill text as interchangeable with the rest of the codebase when
reasoning about reuse or attribution.

## Authoring a track

`.claude/skills/author-track/SKILL.md` has the brief for writing a new track
— read it before generating drills. It exists because early content passes
needed a long hand-written brief each time, and some of them broke the
length rule anyway; the skill is the versioned, improvable version of that
brief.
