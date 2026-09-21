# 5. Capstones and reviews — variation, then application

## Status

Accepted.

## Context

A lesson in CodeType is a concept said several ways: five `useState` call
sites, four shapes of a utility type. That is the product's one idea and it
works — the variation is what teaches when an idea applies.

What it does not do is ask you to *use* the idea. Every drill in a lesson is
two to eight lines, extracted from any surrounding code, and a learner who
has typed all five `useState` variants has never once typed a component that
holds three pieces of state at the same time. The gap between "I can type
this call site" and "I can write this feature" is exactly the gap the
catalogue was not crossing. The same gap exists one level up: five concepts
learned one after another are five concepts, not a codebase.

The obvious way to close it — make the drills longer — is the one option
that breaks the product. A ten-line cap is what keeps a variant a variant;
raise it and a lesson becomes five medium-length passages that teach by
repetition alone.

## Decision

Add a second kind of drill, and a second kind of lesson, rather than
stretching the existing ones.

**A capstone** (`Drill.kind: 'capstone'`) closes every concept lesson. It is
15–35 lines of a fictional but plausible codebase in which that one concept
is doing real work — the cart that holds three kinds of state, the parcel
tracker whose every branch is a narrowing. It carries a `brief`: a short
scenario rendered *above* the passage, because context you need before you
start typing is useless underneath. Exactly one per concept lesson, always
last, and the length budget is a different budget rather than a relaxed one
(15 lines minimum, so a variant cannot be relabelled into one).

**A review** (`Lesson.kind: 'review'`) closes every run of up to five concept
lessons and names them in `covers`. It teaches nothing new: it is one
project, split into three stages that are all capstones, in which the
concepts of the block turn up where they are actually the right tool.
Splitting the project into stages — `settings/types.ts`, `settings/guards.ts`,
`settings/service.ts` — is what keeps a review inside the product's own rule
rather than outside it. Three drills, genuinely different shapes, one idea:
the same contract every other lesson is held to.

Both kinds are optional fields defaulting to the old values, so the shape a
lesson had before this is still the correct way to write the common case.

## Consequences

- `content.test.ts` gained the cadence as an enforced rule, not a
  convention: every concept lesson ends in exactly one capstone, every run of
  concept lessons is closed by a review naming exactly that run, no run
  exceeds five, and a capstone must out-length every variant beside it. The
  three-drills-per-lesson rule now counts *variants*, so a lesson cannot ship
  two variants and a summary and still pass.
- The drill screen had to learn a second layout. A 35-line passage does not
  fit under a title, a concept, a chip row and a brief, so from `sm` up a long
  drill pins the page to the viewport height and gives the passage a flex-
  sized scrolling window with the caret kept inside it. Below `sm` it does
  not: a phone has no room for a 180-pixel window onto the passage, and the
  page simply scrolls, once.
- A capstone no longer repeats its lesson's `concept` above the passage. It
  has been on screen for every variant of the lesson already, and the brief
  is the more specific thing to read. A review is the exception — its concept
  is the only description of the project.
- Reviews sit outside the lesson numbering everywhere they are listed
  (`01 02 03 04 05 REVIEW`, not `06`), because a numbered review reads as a
  sixth concept.
- Capstone runs record like any other drill. They are longer and therefore
  give a *better* WPM sample than a two-line variant, so there is no reason
  to keep them out of the graphs the way key-practice reps are kept out
  (ADR 0005 in `SessionRecord`'s own note, `kind: 'practice'`).
- Writing a track is now a bigger job: 3–6 variants plus a capstone per
  lesson, plus a review per five. `.claude/skills/author-track/SKILL.md`
  carries the brief for both new kinds.
