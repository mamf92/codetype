/**
 * Density is the point, and real code can't supply it (a real snippet holds
 * two `[` in forty characters; a synthetic fragment holds eight). Isolation
 * and discrimination below are blocked practice (the same thing, many
 * times), which improves fastest within a session; interleaving several
 * keys, done elsewhere (see weakKeys.ts), retains worse in the moment but
 * better afterward. See #6 for the full reasoning.
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
 * longer an isolated token. A handful of hand-written templates for the
 * punctuation that's actually worth this (see the corpus frequency
 * argument in #6 — brackets, quotes, semicolons dominate); any other
 * character falls back to a generic assignment-shaped context that still
 * repeats it several times.
 */
const CONTEXT_TEMPLATES: Record<string, string[]> = {
  '[': ['xs[i]', 'm["k"]', '[...a]', 'arr[0]', 'row[i][j]'],
  ']': ['xs[i]', 'm["k"]', '[...a]', 'arr[0]', 'row[i][j]'],
  '(': ['fn(a, b)', 'if (x)', '(a, b) => a', 'sum(1, 2)'],
  ')': ['fn(a, b)', 'if (x)', '(a, b) => a', 'sum(1, 2)'],
  '{': ['{ a, b }', 'if (x) {', 'const { a } = o'],
  '}': ['{ a, b }', 'if (x) {', 'const { a } = o'],
  ';': ['a = 1;', 'return x;', 'let y;'],
  "'": ["const s = 'x'", "import 'x'"],
  '"': ['const s = "x"', 'import "x"'],
  '.': ['a.b.c', 'x.map(f)', 'this.state'],
  ',': ['fn(a, b, c)', '[1, 2, 3]'],
  ':': ['{ a: 1 }', '(x: number)'],
  '=': ['let x = 1', 'a === b'],
}

export function generateContext(char: string): string {
  const templates = CONTEXT_TEMPLATES[char]
  if (templates !== undefined) return templates.join('\n')
  return [`let ${char}1 = value`, `const ${char}2 = value`, `${char}3.use()`].join('\n')
}
