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

Then the lesson **closes with a capstone**, and every run of up to five
lessons **closes with a review**. Variation teaches when an idea applies;
these are where the reader finds out they can write with it. Neither is
optional and `content.test.ts` enforces both — see "Capstones" and "Reviews"
below before you start, because they change how you plan a track, not just
what you add at the end of one.

## Shape

```
Track
  id, kind ('course' | 'dispatch'), language, title, blurb, level, tags,
  freshnessDays, (publishedAt + sourceUrl if kind is 'dispatch')
  lessons: Lesson[]
    id, title, summary, concept, sourceUrl?
    kind? ('concept' | 'review'), covers? (review only)
    drills: Drill[]
      id, label, code, grammar, note?
      kind? ('variant' | 'capstone'), brief? (capstone only)
```

Both `kind` fields are optional and default to the ordinary case, so a plain
variant in a plain lesson is written exactly as it always was.

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

## Capstones

Every **concept lesson ends with exactly one capstone**: the same idea, this
time doing real work in a fictional but plausible codebase.

- `kind: 'capstone'`, last in the `drills` array, id `{lesson-id}-capstone`.
- **15–35 lines.** The minimum matters as much as the maximum: a twelve-line
  capstone is a variant wearing a label, and CI will say so.
- A `brief` is required — two or three sentences setting up the scenario,
  rendered *above* the passage because it is context the reader needs before
  they start typing. Don't caption the code ("this component uses useState");
  say what the thing is and point at what to watch.
- No `note`. A note explains how a variant differs from its siblings, which
  is not a question a capstone answers.
- Write a whole small artefact — a module, a component, a config file — not a
  snippet with the edges sawn off. The concept should appear several times
  inside it, at genuinely different call sites, so the capstone is a lesson
  in miniature rather than one long variant.
- Keep lines under about 90 characters. They wrap on the typing surface, and
  a 130-character line is a long way to go without a break.

## Reviews

Every run of **up to five concept lessons is closed by a review lesson**.

- `kind: 'review'`, `covers: [...]` naming exactly the lessons of that run in
  order, id `{track-id}-review`. Place it last in the run. A track whose
  lessons end without one fails CI, and so does a run of six.
- A review teaches **nothing new**. It is one project in which the covered
  concepts turn up where they are genuinely the right tool. You do not have
  to revisit every variant — reach for the ones the project actually wants.
- **Three drills, all capstones**, which are three *stages of the same
  project*: `settings/types.ts`, `settings/guards.ts`, `settings/service.ts`,
  or the three components a feature splits into. This is how a review stays
  inside the several-ways-of-saying-it rule instead of becoming an exception
  to it — the stages are different shapes of one case. Label each drill with
  its file or stage name.
- The lesson's `concept` is the only place the project is described, so
  write it as the brief for the whole thing; each drill's own `brief` then
  covers its stage.
- Title it `Review: a saved-search panel` — the surfaces strip the
  `Review: ` prefix and render the rest after a `REVIEW` marker.

## Rules `content.test.ts` enforces — a drill that breaks these fails CI

- Every id (track, lesson, drill) is **globally unique** across the whole
  catalogue and **kebab-case** (`^[a-z0-9]+(-[a-z0-9]+)*$`). Convention:
  `{track-id}-{lesson-slug}` for lessons, `{lesson-id}-{n}` for drills — see
  the example above.
- Every lesson has at least 3 drills, and a concept lesson has **at least 3
  variants** — the capstone does not count towards them.
- No lesson repeats the exact same `code` string across its own drills.
- A **variant** is **at most 10 lines** (`code.split('\n').length`), and its
  typed length (leading indentation excluded) is more than 5 and at most 400
  characters — long enough to be worth typing, short enough to finish in one
  sitting.
- A **capstone** is **15–35 lines**, typed length over 300 and at most 1600,
  carries a `brief` of more than 40 characters, and is longer than every
  variant in its lesson. Only capstones may carry a `brief`.
- Every concept lesson has **exactly one capstone, last**. Every run of
  concept lessons is closed by a **review** whose `covers` equals that run
  exactly, in order, with **no run longer than five**. A review's drills are
  all capstones; a concept lesson never has `covers`.
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
2. Plan the run first: up to five concept lessons, then the review that
   closes them. Knowing the review's project up front is what stops it
   turning into a bag of unrelated snippets at the end.
3. Write 1 lesson at a time: state the concept in a sentence, write 3–6
   variants that are genuinely different call sites or shapes of that one
   concept, ordered roughly simplest-first, then the capstone that puts it to
   work.
4. Write the review last: one project, three stages, each a capstone.
5. Check every rule above against what you wrote, per drill, before calling
   it done — don't wait for CI to find a 90-character indent or a duplicate
   passage. Line counts are the usual thing to get wrong; count them.
6. Register the track in `src/content/index.ts`.
7. Run `npm test`. Fix whatever it flags; don't relax a test to make content
   pass.

## Licence

Track content lands under **CC-BY-SA-4.0** (`src/content/LICENSE`), not this
repository's usual MIT — say so if you're drafting on someone's behalf, per
`CONTRIBUTING.md`.
