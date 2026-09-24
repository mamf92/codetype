# Key practice sessions

> **Superseded as a methodology by
> [`decisions/0006-basics-page.md`](decisions/0006-basics-page.md).** Practice
> now lives on the Basics page, with two weak-key methods (the ladder and the
> clean streak), key tracks, and Keyfall. The ranking (§3), the ledger (§2,
> §10) and the rule that practice never reaches the speed graphs still stand
> exactly as described here; the five-level single-key ladder, the pairing
> order and the mastery/probation design below are the historical record.

Targeted remediation for the keys you actually miss: five levels from a single
repeated motion up to real code, generated from your own error record.

> **Implemented in #6.** The plan below is kept as the design record; three
> places the shipped version simplifies it, honestly:
>
> - **Level 3** interferes the current pair against itself, not a genuinely
>   different previously-practiced pair — a single-key entry point has no
>   queue of "the pair before this one" to draw on. It degrades gracefully to
>   level 2's pattern (`src/engine/practice/generators.ts`).
> - **Mastery's "next ~30 presses in ordinary drills"** is judged as a
>   delta against the lifetime ledger at the moment 30 new presses have
>   landed, not a dedicated rolling window independent of the ledger. Same
>   evidence, simpler state (`src/engine/practice/mastery.ts`).
> - **"Your own median" latency** is a ledger-wide mean, not a true median —
>   nothing stores a raw per-keystroke distribution to take a median of, only
>   running sums (`ownBaselineLatencyMs` in `src/engine/metrics.ts`).
>
> Everything else below — the ledger extension, corpus-frequency ranking, the
> five generators, the Leitner probation ladder — shipped as designed.

## 1. The idea

The catalogue teaches concepts. This does not — it goes back to the root of
learning to type: hit one key until the reach is automatic, then learn to tell
it apart from the key you confuse it with, then put it back into real code and
check the fix survived.

Five levels, each training a different skill:

|     | Level              | Trains                       | Example                        |
| --- | ------------------ | ---------------------------- | ------------------------------ |
| 1   | **Isolation**      | the reach                    | `[[[ [[[ [[[  ]]] ]]] ]]]`     |
| 2   | **Discrimination** | telling the pair apart       | `[] [] ][ ][ [] ][`            |
| 3   | **Interference**   | holding it under competition | `[] ;' ][ '; [] ;'`            |
| 4   | **Context**        | the keys inside real shapes  | `xs[i]` `m["k"]` `[...a]`      |
| 5   | **Transfer**       | proving it in the wild       | real drills from the catalogue |

## 2. What we cannot currently do

Three gaps, and the first is the one that matters.

### 2.1 We record the miss but not the mistake

`KeyLedger` is `{ [char]: { pressed, missed } }`. It knows `[` was expected and
missed. It does not know **what was typed instead** — and that is the single
most useful signal here, because it is what tells `[`/`]` confusion (a
discrimination problem, level 2) apart from `[`/`p` (a reach problem, level 1).
Without it, every pairing below is guesswork.

Fix: extend the ledger with `confusions: Record<typedChar, count>`. It is a
two-line change in `recordKey` and a store version bump.

### 2.2 We record correctness but not hesitation

A key you hit correctly but pause 400 ms before costs more words per minute
than one you fluff 5% of the time. Capturing the interval between keystrokes
gives a second, independent ranking — _keys you hesitate on_ — and it is one
timestamp subtraction we are already most of the way to having.

It also gives the only honest mastery test: you have fixed a key when you stop
hesitating on it, not when you stop missing it.

### 2.3 We assume a keyboard we have never seen

This matters more than it sounds, and it matters _specifically here_.
Adjacency-based pairing assumes a US layout. On a Norwegian layout the
programming brackets are not where a US layout puts them at all — `[`, `]`, `{`
and `}` all sit behind AltGr on the digit row. Any "keys next to each other"
logic built on US assumptions would pair the wrong keys and drill the wrong
motion.

Fix, and it needs no setting: record `event.code` alongside `event.key`.
`code` is the _physical_ key and is layout-independent, so the pair
(`key`, `code`, modifiers) lets us learn the user's real layout from their own
typing. Two things fall out of that for free:

- Adjacency is computed over physical positions we actually observed.
- We learn which characters cost a **modifier chord**. A key that needs AltGr is
  intrinsically slower and harder, and the practice screen can say so rather
  than leaving someone wondering why `[` is their worst key.

## 3. Choosing what to practise

### 3.1 Error rate alone is the wrong ranking

Today `troubleKeys()` ranks by `missed / pressed`. That over-values keys you
rarely type. Measured against this catalogue's 11,027 typed characters:

| Key | Frequency | At a 30% miss rate, costs    |
| --- | --------- | ---------------------------- |
| `(` | 16.8 / 1k | **5.03** misses per 1k chars |
| `{` | 12.2 / 1k | 3.67                         |
| `[` | 4.4 / 1k  | 1.31                         |
| `;` | 1.5 / 1k  | **0.46**                     |

Same error rate, and `(` costs **eleven times** what `;` costs. The current
Statistics panel would happily send you off to fix the semicolon. (`;` is rare
here because the catalogue is written in a semicolon-free style — which is
exactly the kind of thing a corpus measurement catches and intuition does not.)

### 3.2 The ranking

**Smooth the rate**, so twelve samples cannot manufacture a crisis. Additive
smoothing toward the global miss rate μ, with a pseudo-count α ≈ 20:

```
rate(k) = (missed_k + α·μ) / (pressed_k + α)
```

**Weight by how often you will meet the key**, using character frequency
computed from the catalogue at build time:

```
cost(k) = rate(k) × freq(k)        // expected misses per 1000 typed chars
```

Rank by `cost` descending. That is the whole selection algorithm, and it
answers "what is worth my next ten minutes" rather than "what is my worst
percentage".

Keep the rate-based list too — it is the honest answer to a different question
("what am I worst at") and it is what the Statistics panel already shows. Label
them differently rather than pretending one is the other.

## 4. Pairing keys

Level 2 needs a _confusable partner_. Three sources, in priority order:

1. **Observed confusion** — the most common substitution from §2.1. Empirical,
   personal, and always right when it exists.
2. **Syntactic partner** — `[`/`]`, `{`/`}`, `(`/`)`, `<`/`>`, `'`/`"`. These
   are natural drill partners whatever the layout, and they are the pairs whose
   _order_ people actually invert.
3. **Physical neighbour** — from the observed layout in §2.3. The fallback when
   a key has no confusion history and no syntactic twin.

## 5. Why the levels are in this order

Levels 1 and 2 are **blocked** practice: same thing, many times. Blocked
practice produces fast in-session improvement — which is what you want when the
goal is to build a motion that does not exist yet.

Level 3 **interleaves** two pairs on purpose. Interleaved practice feels worse
during the session and retains substantially better afterwards; blocked
practice flatters itself. This is why level 3 is not simply "the next pair" but
the previous pair _and_ the next one, competing:

```
level 2    [] [] ][ ][ [] ][          one pair, blocked
level 3    [] ;' ][ '; [] ;' '; []    two pairs, interleaved
```

So the session shape is: build the motion fast (blocked), then deliberately
make it harder in a way that makes it stick (interleaved), then put it back
into context.

## 6. Generating each level

All five produce an ordinary `Drill` object at runtime, so the existing engine
compiles and runs them unchanged. Levels 1–3 use a `plain` grammar so nothing
is syntax-highlighted — `[[[ [[[` is not TypeScript and colouring it as if it
were would be a lie. `scopesPerCharacter` already falls back to all-null, so
this is a pseudo-grammar, not a new code path.

**1 — Isolation.** Bursts of 3, four groups per key, then the partner.
Deliberately short: this motion never occurs in real code and over-training it
risks grooving a rhythm that does not transfer.

**2 — Discrimination.** Three blocks of rising difficulty: natural order
(`[] []`), reversed (`][ ][`), then mixed (`[] ][ ][ []`). The reversed and
mixed forms are where discrimination actually happens; the natural order is
almost free.

**3 — Interference.** Interleave pair A with pair B, seeded so a session is
reproducible. Rotate triads when three or more keys are in play.

**4 — Context.** Minimal syntactic fragments from a template table keyed by
character, not by language:

```
'['  →  a[0]   xs[i]   m["k"]   [...a]   a[a.length - 1]
'{'  →  { a }  { ...o }  ({})   { [k]: v }
';'  →  a = 1; b = 2;   for (;;)
'`'  →  `${x}`  `a${b}c`
```

**5 — Transfer.** Real drills from the catalogue, ranked by target-key density:

```
density(d) = Σ_k count_k(d) · w_k / typedLength(d)
```

## 7. Should levels 4 and 5 use the user's completed courses?

**Level 4 stays dumb. Level 5 does not.** They have different jobs.

Level 4's job is **density**. A real snippet might hold two `[` in forty
characters; a synthetic fragment holds eight. Density is the entire point at
that stage and real code cannot deliver it. Keeping level 4 synthetic also
keeps it language-agnostic, so it works for a Python learner without a second
template set.

Level 5's job is **transfer** — proving the fix survives in code you did not
design around it. That needs real material, and _familiar_ material is better:
drawing from tracks the user has already worked removes the confound of "I was
slow because I did not know the API". The only novel thing left is the key.

This needs no new content. It is a ranked query over drills we already have.

## 8. Mastery, and the loop back to real code

**A level passes** when, over the last ~40 presses of the target keys:

- accuracy on **those keys specifically** ≥ 95% (not overall accuracy — overall
  is dominated by the easy characters around them), and
- median latency on those keys ≤ 1.25 × your own median latency overall.

Miss the criterion and the level regenerates rather than advancing. Passing all
five does not mean the key is fixed — it means it is fixed _in practice
conditions_, which is the easy case.

**Then the key goes on probation**, and this is the part that answers "go back
to work on code again and see what shows up". Probation is measured in
**ordinary drills, never in practice**: the next ~30 presses of that key in
normal typing decide it.

- Clears the threshold → graduates off the trouble list, with a re-check
  scheduled on a widening interval (7 days, 21, 60 — a Leitner ladder).
- Fails → straight back to practice, and the interval resets.

So the full loop is: **rank → practise → probation in real code → graduate or
repeat.** Practice never certifies itself.

## 9. Where it is reached from

- **Home**, on the _Keys that need work_ panel: one `Practise` affordance for
  the set, and each keycap clickable to practise that key alone.
- **Statistics**, on the same panel, plus the fuller ranked list from §3.
- **The drill summary.** If the drill you just finished exposed a bad key,
  offer practice right there. That is the highest-intent moment there is, and
  it costs one line of UI.

Routes: `/practice` for the ranked set, `/practice/:keys` for a specific
selection.

## 10. Data model changes

```ts
// v2 ledger entry
{ pressed, missed, confusions: Record<string, number>,
  latencyTotalMs: number, latencySamples: number }

// SessionRecord gains:
kind: 'drill' | 'practice'

// ProgressDocument gains:
practice: Record<string, {
  stage: 1|2|3|4|5|'probation'|'graduated'
  lastPassedAt: number | null
  probationPresses: number
  reviewIntervalDays: number
}>
```

Store version 1 → 2 with a migration: existing entries keep `pressed`/`missed`,
gain an empty `confusions` and no latency history. `readProgress` already
tolerates anything, so the migration is additive and cannot lose a session.

**`kind` is not optional.** Practice sessions must not reach the speed graphs —
typing `[[[ [[[` at 120 wpm is not a personal best, and letting it into
`headline()` or `dailySeries()` would quietly corrupt the one chart the whole
product exists to move.

## 11. Risks worth holding

- **Repetitive strain.** Hammering one key hundreds of times is a real physical
  risk in a way that typing prose is not. Cap repetitions per key per session
  and break levels into short blocks.
- **Training a motion that does not exist.** `[[[ [[[` appears in no codebase.
  Level 1 is capped short and the weight of the session sits in levels 3–5.
- **Thin evidence.** Below ~30 presses of a key, do not offer practice at all;
  say the record is too short to judge. The smoothing in §3.2 handles ranking,
  but it cannot manufacture confidence that is not there.
- **Practice flattering itself.** Mitigated by §8: the pass is decided in real
  drills, not in the practice that preceded it.

## 12. Order of work

1. Ledger v2 — confusions, latency, `event.code`. Everything else depends on
   it, and until it lands the pairing is guesswork.
2. Corpus frequency table, generated at build time.
3. Ranking (`cost`) and pairing, as pure functions with unit tests. No UI.
4. Generators for levels 1–4, plus the level-5 density query.
5. The practice screen, reusing the existing typing surface unchanged.
6. Mastery, probation and the Leitner ladder.
7. Entry points on Home, Statistics and the drill summary.

Steps 1–4 are pure logic and testable without a browser, which is where the
interesting bugs will be.
