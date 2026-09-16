# Security

## Reporting a vulnerability

Please don't open a public issue for a security problem. Instead, use
[GitHub's private vulnerability reporting](https://github.com/mamf92/codetype/security/advisories/new)
for this repository, or email the maintainer directly if that isn't
available to you. Include what you found, how to reproduce it, and its
impact if you can.

Expect an acknowledgement within a few days. This is a small, unfunded
open-source project — there's no bug bounty, but real reports are read and
acted on.

## Scope, honestly

CodeType is a static site with no backend, no accounts, and no server-side
attack surface: everything runs in your browser, and the only state is one
`localStorage` document per visitor. The realistic risk surface is:

- A dependency with a known vulnerability (`npm audit` runs in CI).
- A change that reintroduces an unsafe sink — `dangerouslySetInnerHTML`,
  `innerHTML`, `eval`, `new Function`. There are none today; highlighted code
  is rendered character-by-character as text nodes specifically so a drill
  passage can't inject markup even if someone authored one to try.
- The deployed page's security headers (CSP and friends) regressing.

See `docs/HARDENING.md` for the fuller audit this file's scope is drawn from.

## Supported versions

There's one deployed version — `main`. Fixes land there; there's no older
release line to backport to.
