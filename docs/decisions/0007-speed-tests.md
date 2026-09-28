# 7. Speed tests

## Status

Accepted. Extends `0006-basics-page.md`.

## Context

Everything on Basics so far *trains*: weak-key runs, key tracks, Keyfall.
Nothing answers the plainer question people bring to a typing site — how
fast am I? — and nothing lets you ask it the same way twice and compare.

## Decision

A **Speed test** section on Basics, above Keyfall, with three groups:

| Group   | Tests                                   | Runs            | Ranked on               |
| ------- | --------------------------------------- | --------------- | ----------------------- |
| Sprints | the quick brown fox (a pangram), A to Z | until typed     | fastest *clean* time    |
| Text    | two minutes, five minutes of prose      | a fixed clock   | wpm                     |
| Code    | one per catalogue language              | one minute each | wpm                     |

Each opens a full-screen surface at `/basics/speed/:testId`.

### The rules

A pure reducer, `src/engine/speedTest.ts`, wrapping the ordinary typing
session — so every rule of the drill screen (a wrong key never blocks, a line
break always does, indentation is ghosted) holds here unchanged.

- **The clock starts on the first key**, not on arrival. Reading the first
  line is free.
- **Timed tests chain passages.** Finishing one loads the next on the same
  keystroke; the time between them is typing time. Passages come in a
  seeded shuffle, every one once before any repeats, and a round never ends
  on the passage the next one starts with.
- **The clock cuts, it does not penalise.** When time runs out, what was
  reached of the current passage counts and the rest is not booked as
  missed. A key pressed after the deadline, before the screen's next tick,
  ends the test instead of typing.
- **A sprint's time only counts when clean** — every character ending right,
  backspace allowed. Otherwise mashing through A to Z would be the record.

### Content

Prose paragraphs are single lines (a text test that asks for Enter mid-thought
is testing something nobody types prose with), plain printable ASCII, and
together longer than a 160 wpm typist gets through in five minutes.
`src/content/speed/speed.test.ts` holds those rules. They are content, and
CC-BY-SA-4.0.

Code tests are **not authored**: they draw on the catalogue's own variants
in that language (capstones excluded — one would swallow the minute). A
language gets a test the day its first track lands, and the test enforces it.

### Data

A run is one `SessionRecord` with **`kind: 'test'`**, `trackId: 'speed-test'`
and the test id as `drillId`. Like practice, it never reaches `headline()`,
`dailySeries()` or `lifetimeLedger()`: a three-second alphabet is not a drill,
and prose would flood the letter keys of a ledger built to reflect real code.
`speedTestStanding` derives runs, best and history from the raw sessions — no
stored personal best.

Statistics shows a **Speed tests** table (runs, latest, best, a sparkline of
every run) beside the drill charts rather than inside them, and shows it even
before any drill has been run.

## Consequences

- Older app versions would read a `'test'` session as a drill. Nothing reads
  the document but the current app, so this is noted, not handled.
- The drill screen's key handling and focus-on-reveal were lifted out of
  `useTypingSession` (`surfaceAction`, `useSurfaceFocus`) so this surface
  shares them instead of copying the AltGr rules.
