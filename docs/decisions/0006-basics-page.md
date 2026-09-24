# 6. Basics — a page for the keys themselves

## Status

Accepted. Supersedes the practice *methodology* in `docs/PRACTICE.md` (the
five-level single-key ladder); the ranking, the ledger and the
never-reaches-the-speed-graphs rule it describes still stand.

## Context

Weak-key practice shipped in #6 as one route, `/practice`, reached from a
small link on Home, Statistics and the drill summary. It ran a single fixed
sequence and then dropped you on Statistics. Four problems:

- **It was hard to find.** A text link in the corner of a panel is not a
  place to go.
- **It had one way to practise.** A five-step ladder is good at building a
  motion and bad at proving it — every step is typed once, and a sloppy run
  moves on exactly like a clean one.
- **It ignored its best signal.** The ledger has recorded *what was typed
  instead* on every miss since #6 (`KeyStat.confusions`), and nothing used
  it. The "pairs" step paired weak keys with each other, not with the key
  you actually hit.
- **It only existed for keys you had already missed.** Someone with no
  history, or who wanted to work the number row or shell punctuation on
  purpose, had nothing.

And the audience is not beginners. Nobody here needs to learn where `f` is.
What they need is the handful of keys their fingers still hesitate on, and
the dense punctuation of real code, repeated until it stops being a chord.

## Decision

A top-level **Basics** page (`/basics`, in the main nav between Explore and
Statistics) that holds everything about keys, and a set of full-screen
surfaces it leads to.

### The page

1. **Needs work / Strongest.** The ranked weak keys (by `rankForPractice`,
   expected misses per 1,000 characters — not bare miss rate, see
   `docs/PRACTICE.md` §3) with miss rate and mean hesitation, beside the
   cleanest keys. Every weak key is a link that practises that key alone.
   A **Practice weak keys** button sits in the page head: the thing the page
   is for is one click away.
2. **Weak keys, two ways** — below.
3. **Key tracks** — below.
4. **Keyfall** — below.
5. **Every key.** Every character grouped as letters, capitals, numbers and
   symbols, tinted by first-press accuracy. Grouped by kind, not drawn as a
   keyboard: a drawn keyboard has to assume a layout, and on the layouts this
   is used on `[` is nowhere near `p`.

Everything on it is derived from `ProgressDocument` on each render, like the
rest of the app.

### Weak keys, two ways — both are repetition

**The ladder** builds the motion. Five rungs, each typed once, every weak key
on every rung:

| Rung       | Drills                                                   |
| ---------- | -------------------------------------------------------- |
| Isolate    | each key alone, `{{{ {{{ {{{ {{{ {{{`                    |
| Mix-ups    | each key against its partner, both orders, unpredictably |
| Interleave | every key switched on every keystroke, forwards and back |
| Fuse       | tokens holding the whole set, rotated                    |
| In code    | each key in fragments of real code, then all mixed       |

**Clean streak** proves it. One short line per key — the reach, the mix-up
and two code fragments on one line — then a line with all of them. Each line
must be typed **three times in a row without a miss**; a miss resets the
count to zero and the line comes straight back. Fewer shapes than the
ladder, far more repetitions, and precision is the only way through. Every
attempt counts toward the saved record, because every attempt was practice.

**The partner** a key is drilled against is, in order: the key you most
often typed *instead* of it (from `confusions`), then its syntactic twin
(`[`/`]`, `'`/`"`, `-`/`_`…), then nothing. This is what tells a `[`/`]`
problem (discrimination) from a `[`/`p` one (the reach) — which the old fixed
pairing could not.

The old "level 3 interferes a pair against itself" and "level 5 transfer"
steps are gone: interleaving now runs over the whole weak set (plus a lone
key's partner, so one key never interleaves with nothing), and transfer is
what ordinary drills are for — see "practice never certifies itself" below.

### Key tracks — reps first, then pressure

Four tracks: **Number row**, **JavaScript & TypeScript symbols**, **Python
symbols**, **Shell symbols**. JavaScript and Python are separate because they
spend punctuation in different places (`=>` `?.` `${}` against `:` `__`
`**`); the shell spends more per line than either.

Each has the same four stages, open from the start (nobody here needs
permission to skip reps), with three passages each:

| Stage      | Is                                                  |
| ---------- | --------------------------------------------------- |
| Reps       | the bare keys, repeated — the motion and nothing else |
| Patterns   | the keys in the shapes they come in                 |
| In code    | real lines of the language                          |
| Under load | dense passages with nowhere to rest                 |

A stage is **cleared** at 95% first-press accuracy. `basics.test.ts` holds
the progression to it: reps are densest in the track's keys, patterns denser
than code, and load denser than code, with per-kind floors measured from the
content.

Key tracks are **not catalogue `Track`s**. A catalogue lesson teaches a
concept and closes with a capstone; a key track teaches nothing but keys and
would fail every rule `content.test.ts` enforces. They live in
`src/content/basics/` with their own schema and tests, and stay out of
`TRACKS` — which also keeps them out of the corpus frequency table, where a
stage of nothing but digits would inflate the cost of every digit you miss.
They are still content, and still CC-BY-SA-4.0.

### Keyfall — the arcade

Characters fall; type each before it lands or lose one of three lives.

| Falls          | Points | From level |
| -------------- | ------ | ---------- |
| letter         | 10     | 1          |
| capital        | 15     | 2          |
| digit          | 20     | 3          |
| symbol         | 25     | 4          |
| operator (`=>`, `===`, `?.`, `&&`, `${`…) | 30 | 5 |

A level every ten hits; each one speeds the fall and the spawn rate, to
floors that stay humanly possible. An operator is typed key by key; a key
goes to the operator already in progress if it continues it, otherwise to
the *lowest* glyph it matches — the one about to cost a life. A key that
matches nothing is counted against accuracy and costs nothing else. The game
pauses when the window loses focus. Optionally, a third of what falls is
drawn from your own weak keys.

The rules are a pure, seeded reducer (`src/engine/keyfall.ts`), tested like
the typing session is; the screen owns only the clock and the glass.

### Data

- Every practice surface records one `SessionRecord` with
  `kind: 'practice'` for the whole run — never only its last step, which is
  what the old screen did. Practice never reaches `headline()`,
  `dailySeries()` or `lifetimeLedger()`.
- Key-track stages record under the stage's own id as `drillId`, which is
  how `stageStanding` finds them; `basics.test.ts` keeps those ids unique
  against the catalogue.
- Keyfall games are `GameRecord`s in a new `ProgressDocument.games` list —
  raw runs, with the high-score table derived (`bestGames`). Not a version
  bump: a document without the field reads back with an empty list.

### Practice never certifies itself

The end of every weak-key run shows each target key's accuracy *this run*
against its accuracy *in real drills*, and says plainly that only the second
number counts. The weak-key ranking is built from real drills only, so the
only way a key leaves the list is by being typed well in real code.

### Also fixed along the way

- **Keys behind AltGr or Option were dropped.** The typing surface ignored
  any keystroke with Alt held, which on a Norwegian layout (Windows AltGr,
  reported as Ctrl+Alt; macOS Option) made `[ ] { }` untypable.
  `typedCharacter` (`src/engine/keys.ts`) now accepts AltGr, Ctrl+Alt that
  changed the character, and plain Alt only on a Mac, where Option composes.
  Alt+R restarts by physical key, since Option+R reports `®`.
- **The typing surface never had focus on arrival.** It sits inside a
  staggered `.reveal`, which is `visibility: hidden` until its animation
  starts, and a hidden element refuses `focus()` silently. Focus is now
  retried the moment the reveal's animation starts, and only while nothing
  else holds it.

## Consequences

- `/practice` redirects to `/basics/weak/ladder`, so old links still work.
- The Basics routes are a lazily loaded chunk; the main bundle does not grow
  for anyone who never opens the page.
- Keyfall needs a physical keyboard, as does every typing surface here.
- There is no mastery ladder or probation state (the Leitner idea in
  `docs/PRACTICE.md` §8). "Cleared" on a key track is a derivation over
  sessions, and a weak key leaves the list when real drills say so. If a
  scheduled re-check is ever wanted, it should be derived the same way
  rather than stored.
