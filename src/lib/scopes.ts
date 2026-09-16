/**
 * Prism scope to colour.
 *
 * Deliberately narrow: everything sits in the amber family or parchment. A
 * phosphor tube never showed a rainbow, and a six-hue syntax theme would fight
 * the one signal that matters on this screen — whether you got it right.
 */
const SCOPE_COLOURS: Record<string, string> = {
  keyword: '#ffb000',
  atrule: '#ffb000',
  rule: '#ffb000',
  selector: '#ffb000',
  tag: '#ffb000',
  important: '#ffb000',

  'class-name': '#ffd27a',
  'maybe-class-name': '#ffd27a',
  builtin: '#ffd27a',
  number: '#ffd27a',
  boolean: '#ffd27a',
  constant: '#ffd27a',
  'attr-name': '#ffd27a',
  symbol: '#ffd27a',

  string: '#a8925f',
  char: '#a8925f',
  'attr-value': '#a8925f',
  regex: '#a8925f',
  url: '#a8925f',

  operator: '#8f8172',
  punctuation: '#8f8172',
  'template-punctuation': '#8f8172',

  comment: '#5c5245',
  prolog: '#5c5245',
  doctype: '#5c5245',
}

const DEFAULT_COLOUR = '#e8dccb'

export const colourForScope = (scope: string | null): string =>
  scope === null ? DEFAULT_COLOUR : (SCOPE_COLOURS[scope] ?? DEFAULT_COLOUR)
