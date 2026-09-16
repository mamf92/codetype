# docs/

**Plans belong in GitHub issues, not here.** What's in this directory is
either a durable decision that's still true, or reference material that
explains the current state of the system.

- **`decisions/`** — architecture decision records (ADRs). One decision per
  file, numbered, never edited after the fact — a decision that changes gets
  a new ADR that supersedes the old one, so the history of *why* stays
  intact.
- **`HARDENING.md`** — the security/testing audit and its ongoing plan of
  work. Kept here rather than in an issue because it's a living reference
  (baseline findings, what's fixed, what's still open) rather than a
  one-shot task list.
- **`PLAN.md`**, **`PRACTICE.md`** — historical planning documents from
  before this convention existed (the MVP plan, and the key-practice design).
  Left in place as reference rather than deleted or moved, since they're
  already merged history and still accurate about what they describe; new
  planning belongs in an issue, and a decision that came out of one of these
  and is still load-bearing today has its own ADR in `decisions/`.
