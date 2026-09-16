# CodeType — MVP Plan

> Typing practice that doubles as concept rehearsal. You don't just get faster at
> hitting keys — you get faster at hitting *these* keys, in *this* order, because
> that order is how `useSyncExternalStore` is actually written.

## 1. The premise

Two intertwined goals:

1. **Motor memory.** Repetition of real code until the fingers know it.
2. **Concept memory.** Because the repetitions are *variants* of one idea, retyping
   them teaches when and where the idea applies, not just its spelling.

The lesson is therefore the unit of learning, and it always holds **several drills
that say the same thing differently**. Typing `useState` once is typing practice.
Typing six different useState call sites is a lesson.

## 2. Decisions (locked)

| Decision | Choice |
| --- | --- |
| Stack | Vite + React 19 + TypeScript + Tailwind v4 |
| Hosting | Netlify (Cloudflare Pages drop-in; both configured) |
| Content | Hand-authored typed modules in `src/content/` |
| Typing mode | Forgiving flow — errors marked, never blocking |
| Persistence | `localStorage`, versioned, no backend |
| Aesthetic | Phosphor terminal — amber-on-charcoal CRT |
| Routing | React Router, SPA fallback via `_redirects` |

Assumptions taken without asking (say the word and they change):

- Progress is per-browser. No accounts, no sync. The store is versioned and
  serialisable so a backend can be bolted on without a migration crisis.
- npm as the package manager (best-supported on Netlify/CF out of the box).
- Syntax highlighting via `refractor` (Prism grammars, proper ESM, no globals).

## 3. Scope of the MVP

### Ship

- **Home** — a short stat strip, dispatches (what's new) for your chosen languages,
  then a grid of everything else.
- **Explore** — the same catalogue, unfiltered and filterable: by language, by kind
  (course vs dispatch), by level, and by freshness.
- **Statistics** — speed over time, accuracy over time, favourite keys, keys that
  need work, per-track history.
- **Drill** — the typing screen itself. This is the product; everything else is
  navigation around it.

### Explicitly not in the MVP

Accounts, sync, live news ingestion, multiplayer, a "make me think" blanked-token
mode, sound, custom themes, a content editor UI. Each is a clean follow-up because
the content schema and store are designed to absorb them.

## 4. Architecture

```
src/
  engine/      pure, testable typing core — no React, no DOM
  content/     the catalogue: schema + authored tracks
  store/       localStorage progress, aggregation, derived stats
  routes/      Home, Explore, Statistics, Drill
  components/  layout, typing surface, cards, primitives
  styles/      theme tokens + the phosphor treatment
```

### 4.1 Engine (`src/engine/`)

Framework-free so it can be unit-tested hard.

**Cells.** A drill's source is compiled once into a flat array of *cells*, each
carrying `char`, `line`, `column`, `kind` (`char | newline`) and a highlight
`scope`. Leading indentation is **not typed** — it is rendered as a ghost and
skipped, so `Enter` lands the caret on the first meaningful character of the next
line. Trailing whitespace is stripped at authoring time.

**Session.** `useTypingSession` owns `cursor`, a parallel `entries` array
(`correct | wrong | pending`), and the clock, which starts on the first keystroke
rather than on mount. Forgiving mode: a wrong character is recorded and the cursor
advances anyway. Backspace rewinds and lets you fix it; the original error still
counts against *raw* accuracy, which is the honest number.

**Metrics.** `wpm = (correctChars / 5) / minutes`, `rawWpm` over all characters,
`accuracy = correct / keystrokes`, plus a per-character ledger of
`{ pressed, missed }` that is the raw material for the key heatmap.

### 4.2 Content (`src/content/`)

```ts
Track  { id, kind: 'course' | 'dispatch', language, title, blurb, level,
         tags, freshnessDays, publishedAt?, sourceUrl?, lessons }
Lesson { id, title, summary, concept, sourceUrl?, drills }
Drill  { id, label, code, grammar, note? }
```

A **dispatch** is a track about something recent (a Tailwind v4 feature, a React
compiler change). It is the same shape as a course, so Home, Explore and the drill
screen need no special-casing — only a different card treatment and a date.

Seeded at MVP: TypeScript, React, Tailwind CSS — the three you actually use. The
schema already names Next.js, Kotlin, Java, Python, JavaScript so adding them is a
file, not a refactor.

### 4.3 Store (`src/store/`)

One versioned `localStorage` document:

```ts
{ version, favouriteLanguages, sessions: SessionRecord[], tracks: Record<id, TrackState> }
```

`SessionRecord` holds the outcome of one completed drill plus its key ledger.
Everything on Home and Statistics is *derived* from `sessions` — no denormalised
counters to drift out of sync. Freshness is `now - lastCompletedAt > freshnessDays`,
which is what drives "due for another pass".

## 5. Look and feel

Phosphor terminal. Near-black charcoal ground, warm amber as the dominant light,
one cold cyan reserved exclusively for *correct* — so correctness is the only thing
on screen wearing that colour. Errors in a bruised red that bleeds slightly.

- **Display type:** Unbounded — wide, geometric, a little strange.
- **Code type:** Martian Mono — deliberately unusual, wide aperture, excellent at
  distinguishing the characters that matter (`1lI`, `0O`, `{}()[]`).
- **Atmosphere:** a fixed scanline overlay at very low opacity, a radial vignette,
  and a caret that pulses with a phosphor decay rather than a hard blink.
- **Motion:** one orchestrated page load with staggered reveals; in the drill, the
  only motion is the caret and the character state transitions. The typing surface
  must be calm — animation there is a tax on the reader.

Everything is CSS custom properties in `styles/theme.css`, so a second theme is a
variable block, not a rewrite.

## 6. Delivery order

1. Plan (this document).
2. Scaffold: Vite, TS strict, Tailwind v4, router, lint, test, CI, deploy config.
3. Design pass: key screens as a design canvas before component code is written.
4. Engine + tests.
5. Content (fanned out to subagents, reviewed by hand).
6. Screens.
7. Ship: push, open a PR, wire Netlify.

## 7. Where this goes next

The MVP is built so each of these is additive:

- **Strict mode / "make me think" mode** — the engine already routes every
  keystroke through one reducer; blocking on error is a branch, and blanked tokens
  are a cell flag.
- **Live dispatches** — a build-time script that drafts content files from
  changelogs and RSS, for human review before commit.
- **Backend** — the store document is already a serialisable, versioned payload.
- **More languages** — a content file each.
