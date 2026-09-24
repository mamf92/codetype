/**
 * Density is the point, and real code can't supply it (a real snippet holds
 * two `[` in forty characters; a synthetic fragment holds eight). Isolation
 * and discrimination below are blocked practice (the same thing, many
 * times), which improves fastest within a session; interleaving several
 * keys, done elsewhere (see weakKeys.ts), retains worse in the moment but
 * better afterward. See docs/PRACTICE.md for the full reasoning.
 */

/** Isolation: the reach, repeated in short blocks. */
export function generateIsolation(char: string, blocks = 4, repeatsPerBlock = 3): string {
  return Array.from({ length: blocks }, () => char.repeat(repeatsPerBlock)).join(' ')
}

/**
 * Discrimination: telling a confusable pair apart. Two-character tokens
 * combining `char` and `pair` in both orders, in a fixed sequence varied
 * enough that the next token isn't predictable from the last one or two —
 * predictable order would let the fingers pattern-match the sequence
 * instead of actually discriminating each token.
 */
export function generateDiscrimination(char: string, pair: string, tokens = 8): string {
  // A order, B order, repeating with a phase shift so AABB never simply loops.
  const order = ['ab', 'ab', 'ba', 'ba', 'ab', 'ba']
  return Array.from({ length: tokens }, (_, i) => {
    const way = order[i % order.length]
    return way === 'ab' ? char + pair : pair + char
  }).join(' ')
}

/**
 * Context: the target inside shapes real code actually takes, still
 * synthetic (so density stays high and it stays language-agnostic), but no
 * longer an isolated token.
 *
 * Every printable ASCII symbol has hand-written fragments; letters and
 * digits are built from tables below rather than listed one by one. Nothing
 * falls back to a meaningless shape like `let [1 = value` any more — that
 * was the old fallback, and it put the key inside something that is not
 * code in any language.
 */
const SYMBOL_FRAGMENTS: Record<string, string[]> = {
  '[': ['xs[i]', 'm["k"]', '[...a]', 'arr[0]', 'row[i][j]'],
  ']': ['xs[i]', 'm["k"]', '[...a]', 'arr[0]', 'row[i][j]'],
  '(': ['fn(a, b)', 'if (x)', '(a, b) => a', 'sum(1, 2)', 'f(g(x))'],
  ')': ['fn(a, b)', 'if (x)', '(a, b) => a', 'sum(1, 2)', 'f(g(x))'],
  '{': ['{ a, b }', 'if (x) {', 'const { a } = o', '${x}', '{ ...o }'],
  '}': ['{ a, b }', '} else {', 'const { a } = o', '${x}', '{ ...o }'],
  '<': ['a < b', 'Array<T>', '<div>', 'x <= 0', 'Map<K, V>'],
  '>': ['a > b', '() => x', 'x >= 1', '</div>', 'Promise<T>'],
  ';': ['a = 1;', 'return x;', 'let y;', 'for (;;)', 'i++;'],
  ':': ['{ a: 1 }', '(x: number)', 'ok ? a : b', 'def f():', 'key: value'],
  "'": ["const s = 'x'", "import 'x'", "['a', 'b']", "it's"],
  '"': ['const s = "x"', 'import "x"', '{ "k": "v" }', 'f"{x}"'],
  '`': ['`${x}`', '`a${b}c`', '`id-${i}`', 'css`color: red`'],
  '.': ['a.b.c', 'x.map(f)', 'this.state', '[...xs]', '0.5'],
  ',': ['fn(a, b, c)', '[1, 2, 3]', '{ a, b }', 'x, y = y, x'],
  '=': ['let x = 1', 'a === b', '() => x', 'n += 1', 'a !== b'],
  '!': ['!ok', 'a !== b', 'x!', '!!value', 'if (!done)'],
  '?': ['a?.b', 'x ?? y', 'ok ? a : b', 'name?: string', 'a?.[0]'],
  '&': ['a && b', 'A & B', 'x &= 1', 'a &&= b', 'cd x && ls'],
  '|': ['a || b', "'a' | 'b'", 'x | y', 'a ||= b', 'ls | grep x'],
  '+': ['i++', 'a + b', 'n += 1', '+x', "'a' + 'b'"],
  '-': ['i--', 'a - b', 'n -= 1', '-1', 'kebab-case'],
  '*': ['a * b', 'n *= 2', 'x ** 2', 'import * as fs', '/* x */'],
  '/': ['a / b', '// note', './lib/x', '</a>', 'n /= 2'],
  '%': ['i % 2', 'n %= 3', '100%', 'width: 50%', '%s'],
  $: ['${x}', '$el', '$1', '`$${n}`', 'echo $HOME'],
  _: ['_id', 'snake_case', '__init__', 'MAX_SIZE', 'a_b_c'],
  '@': ['@param', '@Component', 'user@host', '@types/node', '@property'],
  '#': ['#id', '#fff', '# note', '#private', '#!/bin/sh'],
  '^': ['a ^ b', '^1.2.0', '/^a/', 'x ^= y'],
  '~': ['~/src', '~x', '~1.0.0', 'cd ~'],
  '\\': ['\\n', 'C:\\dir', '\\d+', '\\t', 'a \\ b'],
}

/**
 * Real identifiers, so a letter is practised inside words code is actually
 * written in. Every lowercase letter appears in at least three of them —
 * `practice.test.ts` holds the table to that.
 */
export const CODE_WORDS = [
  'async', 'await', 'buffer', 'cache', 'config', 'const', 'debug', 'default', 'delete', 'export',
  'extends', 'false', 'fetch', 'filter', 'format', 'handler', 'hook', 'import', 'index', 'inject',
  'items', 'jest', 'join', 'json', 'jsx', 'key', 'kind', 'lazy', 'length', 'lock', 'map', 'module',
  'next', 'null', 'object', 'params', 'parse', 'promise', 'query', 'queue', 'quote', 'reduce',
  'reject', 'request', 'return', 'schema', 'select', 'size', 'state', 'string', 'switch', 'throw',
  'token', 'type', 'typeof', 'unique', 'update', 'valid', 'value', 'void', 'while', 'width',
  'window', 'yield', 'zero', 'zip', 'zod', 'box', 'hex', 'max', 'resize', 'event', 'break',
  'equal', 'retry', 'vitest', 'write', 'fork', 'zone', 'jump', 'major', 'minor', 'job',
] // prettier-ignore

const capitalise = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

function letterFragments(char: string): string[] {
  const lower = char.toLowerCase()
  const words = CODE_WORDS.filter((word) => word.includes(lower))
  if (char === lower) return words.slice(0, 6)
  // A capital lives at the start of a type or in a constant. Both shapes, so
  // the Shift reach comes from either side of a word.
  const types = words.filter((word) => word.startsWith(lower)).map(capitalise)
  const constants = words.map((word) => word.toUpperCase())
  return [...types.slice(0, 3), ...constants.slice(0, 3)]
}

function digitFragments(d: string): string[] {
  return [`arr[${d}]`, `${d}${d}${d}`, `x * ${d}`, `v${d}.${d}.0`, `0x${d}${d}`, `#${d}${d}${d}`]
}

/** Short code-shaped fragments that each contain `char` — never opening on a space. */
export function contextFragments(char: string): string[] {
  const symbol = SYMBOL_FRAGMENTS[char]
  if (symbol !== undefined) return symbol
  if (/^[0-9]$/.test(char)) return digitFragments(char)
  if (/^[a-zA-Z]$/.test(char)) {
    const fragments = letterFragments(char)
    if (fragments.length > 0) return fragments
  }
  // Anything else — a non-ASCII letter on a Nordic layout, say — still sits
  // in the three places any character can: a string, a list and a word.
  return [`'${char}'`, `[${char}]`, `x${char}${char}`]
}

/** Context fragments, one per line — the shape the single-key ladder wants. */
export function generateContext(char: string): string {
  return contextFragments(char).join('\n')
}
