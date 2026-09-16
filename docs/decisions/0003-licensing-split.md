# 3. MIT for code, CC-BY-SA-4.0 for lesson content

## Status

Accepted and shipped.

## Context

The repository was public with no `LICENSE` file, which under default
copyright means all rights reserved — nobody could legally fork, copy or
reuse it, even though the code was readable by anyone. Visible but unusable
serves nobody. Beyond simply fixing that, the project suits open source
unusually well: there's no commercial secret, and the interesting part — the
catalogue of tracks and drills — is exactly the kind of thing that gets
better when other people add to it. Someone who writes Kotlin every day will
write better Kotlin drills than the maintainer.

A single licence for the whole repository was considered and rejected. The
engine is a vehicle: a few hundred lines of reducer and some React, whose
value is in being read, copied and learned from. The catalogue is the
commons this project exists to grow. Those are different jobs and deserve
different terms.

## Decision

- **Code — MIT.** Permissive, because the engine should be frictionless to
  reuse and nobody is going to build a competing business on a typing
  engine; if someone does, that's a compliment, not a loss.
- **Lesson content (`src/content/`) — CC-BY-SA-4.0.** Share-alike,
  deliberately asymmetric with the code licence. Someone who extends or
  corrects the lessons has to hand the result back on the same terms, which
  is what keeps a modified corpus open rather than letting it be folded into
  something closed. CC-BY-SA still permits using, teaching from and
  republishing the material freely.
- **Fonts** shipped in `dist/` are OFL-1.1 — see ADR 0002 and
  `THIRD-PARTY-NOTICES.md`. This isn't a preference, it's an obligation that
  already existed once self-hosting landed.

## Consequences

- A pull request touching `src/content/` is a CC-BY-SA-4.0 contribution, not
  an MIT one — `CONTRIBUTING.md` and `.github/pull_request_template.md` both
  say so, since a contributor who doesn't want their writing under a
  share-alike licence needs to know that before, not after, they write it.
- `src/content/LICENSE` exists as its own file specifically so the split is
  visible to anyone browsing that directory in isolation, not just to
  someone who read the root `LICENSE` all the way through.
