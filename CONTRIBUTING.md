# Contributing

Thanks for wanting to add to this. The engine is a few hundred lines of
reducer and some React; the interesting part is the **catalogue**, and a
catalogue is exactly the kind of thing that gets better when other people add
to it. Someone who writes Kotlin every day will write better Kotlin drills
than either of us.

## Licence split — read this before you write anything

This repository carries two licences, on purpose:

- **Code** (`src/engine`, `src/store`, `src/routes`, `src/components`, the
  build config, everything that isn't lesson content) — **MIT**. See
  `LICENSE`.
- **Lesson content** (`src/content/`) — **CC-BY-SA-4.0**. See
  `src/content/LICENSE`.
- **Design sources** (`design/`) — under the code licence (MIT), same as the
  rest of the repository outside `src/content/`.

If you contribute a track, a lesson, or a drill, you are contributing it
under CC-BY-SA-4.0, not MIT — anyone who reuses or modifies the catalogue has
to keep it open on the same terms. If that's not something you're willing to
license your writing under, please don't submit content changes; code
contributions elsewhere in the repo are unaffected.

## Adding a track

A track lives in `src/content/tracks/`, holds one or more lessons, and each
lesson holds several **drills that say the same thing differently** — that
repetition-with-variation is the entire teaching method, not a nice-to-have.

1. Pick a language already in `LANGUAGES` (`src/content/schema.ts`), or add a
   new one there first if it doesn't exist yet.
2. Write the track as a `Track` (see `src/content/schema.ts` for the shape:
   `Track` → `Lesson[]` → `Drill[]`). Look at an existing track — e.g.
   `src/content/tracks/react.ts` — for the pattern.
3. Export it and register it in `src/content/index.ts`.
4. Run `npm test`. `src/content/content.test.ts` enforces the rules that are
   easy to get wrong without a test catching them:
   - Every id is globally unique and kebab-case.
   - Every lesson carries **at least 3 drills** — fewer isn't variation, it's
     one example.
   - No lesson repeats the same passage verbatim across its own drills.
   - A drill is **at most 10 lines**, and short enough to type in one sitting
     (a floor and a ceiling on typed character count).
   - No tabs, no trailing whitespace, no stray blank lines at the edges of a
     passage.
   - No line starts with a space — indentation is ghosted and never typed
     (see "Invariants" in `CLAUDE.md`), so a line has to open on real content
     or the caret has nowhere reachable to land.
   - Every dispatch (`kind: 'dispatch'`) carries a real `publishedAt` date
     and a `sourceUrl`.
5. `npm run check` before you open a pull request — lint, test, and build,
   the same gate CI runs.

If you're using an AI agent to help draft a track, `.claude/skills/author-track/SKILL.md`
has the brief we give ours; reading it first will save you a round of drills
that break the length rule.

## Code changes

Standard flow: fork, branch, `npm run check` before you push, open a PR
against `main`. Check `.github/pull_request_template.md` for what to fill in.
There's no formal style guide beyond what ESLint and Prettier already
enforce — `npm run lint` and `npm run format:check` are both part of
`npm run check`.

## Design

`design/` holds the canvas sources for the screen mockups and theme
explorations (see `docs/decisions/` for the reasoning behind the current
visual direction). It's under the code licence and extendable the same way
the code is — if you're proposing a visual change, a canvas source that shows
it is worth more than a description.

## Reporting a security issue

See `SECURITY.md` — please don't open a public issue for anything sensitive.
