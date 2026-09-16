---
name: author-track
description: Write a new CodeType track (course or dispatch) — a Track of Lessons of Drills that teach one concept several ways. Use this when asked to add, draft, or generate typing-practice content for src/content/tracks/.
---

# Authoring a CodeType track

This is the brief. Three earlier content passes each needed a long
hand-written version of this, and two of them still produced drills that
broke the length rule — read it before generating anything, and check the
"Rules `content.test.ts` enforces" section against what you write, because
that test is what actually gates a pull request.

## The one idea

A **Lesson** is a concept expressed as **several drills that say the same
thing differently**. Typing `useState` once is typing practice. Typing five
different `useState` call sites — a direct value, an updater, an updater on
an object, inside a callback, appending to an array — is a lesson: the
repetition trains the fingers, and the *variation* is what teaches when the
idea applies and when it doesn't. If every drill in a lesson is a trivial
rename of the others (`a`, `b`, `c` swapped for different variable names),
you have not written variation, you have written one drill five times.

## Shape

```
Track
  id, kind ('course' | 'dispatch'), language, title, blurb, level, tags,
  freshnessDays, (publishedAt + sourceUrl if kind is 'dispatch')
  lessons: Lesson[]
    id, title, summary, concept, sourceUrl?
    drills: Drill[]
      id, label, code, grammar, note?
```

Full types: `src/content/schema.ts`. Real example to pattern-match against:
`src/content/tracks/react.ts`.

- **`course`** — evergreen material, something true regardless of when you
  read this.
- **`dispatch`** — something recent worth burning into muscle memory while
  it's still news. Needs a real `publishedAt` (ISO date) and `sourceUrl` —
  don't invent either; if you don't have a real source, write a course
  instead.
- **`concept`** (1–3 sentences) is the thing the person is meant to walk
  away knowing, not a description of the drills. Write it like you're
  explaining *why*, not *what*.
- **`code`** is the passage, exactly as it will be typed. Realistic syntax
  in the target language/grammar — not simplified for typing ease. The
  point is that your fingers learn the real shape.
- **`note`** (optional, per drill) is one sentence on what makes *this*
  variant different from its siblings — not a caption repeating the code.

## Rules `content.test.ts` enforces — a drill that breaks these fails CI

- Every id (track, lesson, drill) is **globally unique** across the whole
  catalogue and **kebab-case** (`^[a-z0-9]+(-[a-z0-9]+)*$`). Convention:
  `{track-id}-{lesson-slug}` for lessons, `{lesson-id}-{n}` for drills — see
  the example above.
- Every lesson has **at least 3 drills**.
- No lesson repeats the exact same `code` string across its own drills.
- A drill is **at most 10 lines** (`code.split('\n').length`), and its typed
  length (leading indentation excluded) is more than 5 and at most 400
  characters — long enough to be worth typing, short enough to finish in one
  sitting.
- **No tabs.** Indent with spaces.
- **No trailing whitespace** on any line, and `code` must equal its own
  `.trim()` — no leading/trailing blank lines.
- **No line may open with a space.** Leading indentation is *ghosted* — shown
  dimmed but never typed, so the caret always lands on the first real
  character of a line (see the indentation invariant in `CLAUDE.md`). A line
  that is indentation and nothing else (a blank line inside a block) is
  fine; a line where the first *typeable* character is a space is not.
- A dispatch needs `publishedAt` matching `^\d{4}-\d{2}-\d{2}$` and a real
  `Date.parse`-able value, plus a `sourceUrl` starting `https://`.

## Process

1. Pick the language (`LANGUAGES` in `src/content/schema.ts`) and confirm a
   grammar for it is registered in `src/lib/highlight.ts`. If neither
   exists yet, that's a bigger change than one track — flag it rather than
   guessing.
2. Write 1 lesson at a time: state the concept in a sentence, then write
   3–6 drills that are genuinely different call sites or shapes of that one
   concept, ordered roughly simplest-first.
3. Check every rule above against what you wrote, per drill, before calling
   it done — don't wait for CI to find a 90-character indent or a duplicate
   passage.
4. Register the track in `src/content/index.ts`.
5. Run `npm test`. Fix whatever it flags; don't relax a test to make content
   pass.

## Licence

Track content lands under **CC-BY-SA-4.0** (`src/content/LICENSE`), not this
repository's usual MIT — say so if you're drafting on someone's behalf, per
`CONTRIBUTING.md`.
