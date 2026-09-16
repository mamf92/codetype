# Hardening plan

Getting CodeType to the point where a push cannot quietly break the live site,
and the live site cannot quietly leak or embarrass.

Everything in the baseline below was measured in the repo, not assumed.

## Baseline

**Good already**

- `npm audit` — 0 vulnerabilities, production and dev.
- No dangerous sinks: no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`,
  no `new Function`. Highlighted code is rendered character by character as text
  nodes, so a drill cannot inject markup even if someone authored one to try.
- No runtime network calls at all, beyond the Google Fonts stylesheet.
- No accounts, no PII, no secrets. Progress is one localStorage document.
- Lockfile committed, CI uses `npm ci`.
- The repository is **public**, so CodeQL, secret scanning and push protection
  are all free rather than paid add-ons.

**Thin or missing**

- 40 tests, every one of them pure. Nothing touches React, the router,
  localStorage or a browser. That is exactly the gap that hid the drill-jump
  bug until the app was driven by hand.
- CI runs lint, format, test and build. No security scanning, no coverage floor,
  no check that the thing actually works once built.
- No security headers on the deployed page beyond asset caching.
- Fonts load from Google's CDN, so every visitor's IP reaches a third party.
- Several palette tokens fail WCAG contrast — see §5.1. One of them badly.

---

## 1. Test environment

### 1.1 Extend the unit layer where it is genuinely absent

`src/store/` has **no tests at all**, and it is the one module that parses
untrusted input: whatever happens to be in `localStorage`. Worth covering
properly, because its failure mode is a white screen on boot.

- Round-trip a document; append past `MAX_SESSIONS` and confirm the cap holds.
- Corrupt payloads: invalid JSON, `null`, an array, a wrong `version`, a
  `sessions` value that is not an array — each must fall back, never throw.
- A `setItem` that throws (quota, private mode) must not crash the caller.
- Derivations: `headline`, `dailySeries`, `dueForRevisit`, `standingFor`,
  including the empty case and the single-session case.

### 1.2 Browser end-to-end, against the built artifact

Playwright driving Chromium against `vite preview` — the production bundle, not
the dev server. Each spec is a regression guard for something that has broken or
plausibly could:

- A drill types to completion; the summary appears with plausible metrics.
- Forgiving flow: a typo advances the cursor; backspace rewinds and lets you
  fix it; the original mistake still shows in accuracy.
- Enter is required at a line break, and a stray Enter mid-line does not advance.
- `Alt+R` restarts, `Esc` leaves, `Enter` advances only once finished, and
  `Tab` moves focus off the typing surface like anywhere else (#3 — it used
  to be bound to restart and trap keyboard focus on `<body>`).
- **Finishing a drill does not jump to the next passage.** This one already
  broke once; it gets a permanent test.
- Progress survives a reload, and Statistics reflects it.
- Deep link straight to `/drill/:trackId/:drillId`; unknown route renders 404.
- Every route renders in a browser with empty localStorage.

### 1.3 Accessibility

`@axe-core/playwright` on each route, failing on serious and critical
violations — but **not as the contrast gate**. Measured in #3: the page
background is a layered gradient axe cannot resolve to a single colour, so it
reports every element's contrast `incomplete` rather than pass or fail. On
Home that was 60 elements silently unchecked, at the same time the untyped-code
token sat at 1.96:1. An `incomplete` result is not a pass; CI should fail on it
the same as a violation, once this Playwright harness exists.

Contrast itself is asserted separately, as a deterministic unit test over the
token table (`src/lib/contrast.test.ts`) — no browser, no gradient to trip
over. axe still earns its place for what it *can* see: structure, roles,
names, and reachability.

Also worth asserting: keyboard-only reachability, visible focus, and that
`prefers-reduced-motion` is respected (it already is).

### 1.4 Coverage

V8 coverage, with thresholds only where a number means something: **90% lines
and branches on `src/engine` and `src/store`**. No global threshold — a repo-wide
percentage mostly measures JSX and rewards writing tests for markup.

---

## 2. Pipeline

Split CI into jobs that run in parallel and fail independently:

| Job        | Does                                                              |
| ---------- | ----------------------------------------------------------------- |
| `quality`  | lint, format check, typecheck, unit tests, coverage thresholds    |
| `e2e`      | build, serve, Playwright + axe, upload report artifact on failure |
| `security` | `npm audit --audit-level=high`, CodeQL                            |

Plus, on the workflows themselves:

- `concurrency` group so superseded runs cancel instead of queueing.
- `permissions: contents: read` at workflow level. The default `GITHUB_TOKEN`
  is broader than this repo needs.
- **Pin every action to a commit SHA**, not a moving tag. `@v4` is a mutable
  pointer; a compromised tag is a supply-chain foothold in CI.

Separately:

- `.github/dependabot.yml` — npm and github-actions ecosystems, weekly, with
  minor and patch updates grouped so it opens one PR rather than fifteen.
- `.github/workflows/codeql.yml` — JS/TS analysis on PR and weekly.
- Netlify opens a deploy preview per PR automatically. Click the real thing
  before merging.

---

## 3. Repository security

| Item                                          | Who                                    |
| --------------------------------------------- | -------------------------------------- |
| CodeQL workflow                               | me                                     |
| `npm audit` gate in CI                        | me                                     |
| Actions pinned to SHAs, least-privilege token | me                                     |
| `SECURITY.md` — how to report something       | me                                     |
| Dependabot alerts + security updates          | **you** (Settings → Advanced Security) |
| Secret scanning + push protection             | **you** (same page; free, public repo) |
| Branch protection on `main`                   | **you** (Settings → Rules)             |

---

## 4. Security of the shipped page

### 4.1 One headers file, both hosts

Move headers into `public/_headers`. Netlify and Cloudflare Pages both read that
format, so there is one source of truth instead of a `netlify.toml` block that
silently does nothing on Cloudflare. `netlify.toml` keeps only build config.

### 4.2 Proposed headers

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

Self-hosting the fonts (§4.5) is what lets `font-src` and `style-src` drop
Google's origins entirely.

### 4.3 The CSP gets verified, not guessed

A CSP that is too strict breaks the page silently — which is the worst outcome,
because nothing errors loudly. So the e2e suite listens for
`securitypolicyviolation` events and console errors on every route, and fails
the build on either. Ship the strict policy, let the tests prove which
directives genuinely need loosening, and loosen only those.

### 4.4 HSTS caveat

`Strict-Transport-Security` without `includeSubDomains` and without `preload`
while the site lives on a shared `*.netlify.app` or `*.pages.dev` domain —
asserting policy over a domain you do not control is rude at best. Revisit both
flags once there is a custom domain.

### 4.5 Fonts, and why this is a privacy item

Today every visitor's browser fetches from `fonts.googleapis.com` and
`fonts.gstatic.com`, which hands their IP address and referring page to a third
party. In an EU/EEA context that is a live GDPR question — a German court has
already ruled against a site on exactly these facts.

Fix: self-host via `@fontsource-variable/unbounded` and
`@fontsource-variable/martian-mono`. Both are **OFL-1.1** with the licence
shipped inside the package (verified against the npm registry), both are
variable fonts, and Vite fingerprints and serves the woff2 from your own origin.

Four problems, one change: the privacy exposure goes away, the CSP simplifies,
a render-blocking third-party request disappears, and the build becomes hermetic
— which finally makes the typography testable in CI instead of something I have
still never actually seen.

---

## 5. Findings that need your decision

### 5.1 Contrast — the serious one

Measured against the page background `#0c0a08`. WCAG AA for normal text is
4.5:1.

| Token                    | Ratio      |                     |
| ------------------------ | ---------- | ------------------- |
| parchment (body)         | 14.62:1    | pass                |
| amber                    | 10.79:1    | pass                |
| cyan (correct)           | 11.61:1    | pass                |
| red (error)              | 5.00:1     | pass                |
| muted                    | 5.22:1     | pass                |
| **faint** (micro-labels) | **3.38:1** | fail                |
| **syntax comment**       | **2.59:1** | fail                |
| **ghost — untyped code** | **1.96:1** | fail badly          |
| ghost-deep (indent dots) | 1.29:1     | fail, arguably fine |

The third-from-last is the one that matters. `ghost` is the colour of **the text
you have not typed yet** — which is the text you must read in order to type it.
At 1.96:1 that is not an audit nag, it is the primary function of the product
being hard to see. I chose that value for drama and did not check it.

**Resolved in #2, differently than proposed above.** Rather than raising this
one theme's dim tokens and losing the drama, it ships as one of four themes —
two CRT eras (warm amber tube, cool monochrome screen), each with a
high-contrast sibling that clears AAA on every token, syntax colours
included. This theme, `dark`, keeps its original values and is the one theme
allowed to fail its own target deliberately; anyone who wants the drama back
just picks it, and anyone who needs the text legible picks one of the other
three. `src/styles/index.css` has the palettes, `src/lib/themes.test.ts`
has the proof.

The indent dots (`ghost-deep`) stay a defensible exception in every theme:
decorative, marking whitespace you are explicitly not asked to type, nothing
lost if they go unseen.

### 5.2 The drill screen is invisible to a screen reader

**Addressed in #3.** The key handler moved off `window` onto the typing
surface itself, which is now focusable, has an accessible name exposing the
passage as readable text, and sits next to a polite live region announcing
misses and the final result. That was also what fixed the keyboard trap below
— the surface needed to be a real focusable element either way.

Going further than the cheap floor (a richer reading experience for the
passage itself, live per-character state) is still a genuine product question
for a typing-*speed* trainer, not something this PR assumed an answer to.

### 5.3 The repository has no LICENSE

It is public with no licence file, which under default copyright means all
rights reserved — nobody may legally copy, fork or reuse it. That may be exactly
what you want. If it is not, MIT or Apache-2.0 are the usual picks, and
Apache-2.0 additionally grants patent rights. Your call; I will not pick one
for you.

---

## 6. Deliberately not now

- Lighthouse CI performance budget.
- Code-splitting the `refractor` grammars. The bundle is 391 kB raw / 125 kB
  gzipped, most of it syntax grammars loaded whether or not a drill needs them.
  Fine today; revisit if more languages land.
- Visual regression snapshots. Brittle for the payoff at this size.

---

## 7. Order of work

1. Self-host fonts and fix contrast — both change the CSS the tests assert on,
   so they go first.
2. `public/_headers` with the strict CSP.
3. Playwright harness, e2e specs, axe integration. Prove the CSP.
4. Store unit tests and coverage thresholds.
5. CI restructure, SHA pinning, CodeQL, Dependabot, `SECURITY.md`.
6. You enable the GitHub settings in §3, and turn on branch protection last —
   once CI is green and stable, so the gate never blocks on its own setup.
