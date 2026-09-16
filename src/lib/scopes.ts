/**
 * Prism scope to colour.
 *
 * Deliberately narrow: everything sits in the amber family or parchment. A
 * phosphor tube never showed a rainbow, and a six-hue syntax theme would fight
 * the one signal that matters on this screen — whether you got it right.
 *
 * Values are CSS custom property references, not literal hex. Four themes
 * live entirely in `[data-theme]` CSS (src/styles/index.css); a colour typed
 * as a literal here would freeze at whichever theme was active when the
 * drill compiled, since these are written into an inline `style` once and
 * React has no reason to re-render on a theme switch.
 */
const SCOPE_COLOURS: Record<string, string> = {
  keyword: 'var(--color-amber)',
  atrule: 'var(--color-amber)',
  rule: 'var(--color-amber)',
  selector: 'var(--color-amber)',
  tag: 'var(--color-amber)',
  important: 'var(--color-amber)',

  'class-name': 'var(--color-amber-soft)',
  'maybe-class-name': 'var(--color-amber-soft)',
  builtin: 'var(--color-amber-soft)',
  number: 'var(--color-amber-soft)',
  boolean: 'var(--color-amber-soft)',
  constant: 'var(--color-amber-soft)',
  'attr-name': 'var(--color-amber-soft)',
  symbol: 'var(--color-amber-soft)',

  string: 'var(--color-syntax-string)',
  char: 'var(--color-syntax-string)',
  'attr-value': 'var(--color-syntax-string)',
  regex: 'var(--color-syntax-string)',
  url: 'var(--color-syntax-string)',

  operator: 'var(--color-muted)',
  punctuation: 'var(--color-muted)',
  'template-punctuation': 'var(--color-muted)',

  comment: 'var(--color-syntax-comment)',
  prolog: 'var(--color-syntax-comment)',
  doctype: 'var(--color-syntax-comment)',
}

const DEFAULT_COLOUR = 'var(--color-parchment)'

export const colourForScope = (scope: string | null): string =>
  scope === null ? DEFAULT_COLOUR : (SCOPE_COLOURS[scope] ?? DEFAULT_COLOUR)
