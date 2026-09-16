import { TRACKS } from '@/content/index'
import { typedLength } from '@/content/schema'
import type { Grammar } from '@/content/schema'

/**
 * Levels 1-4 are synthetic — density is the point, and real code can't
 * supply it (a real snippet holds two `[` in forty characters; a synthetic
 * fragment holds eight). Levels 1-2 are blocked practice (the same thing,
 * many times), which improves fastest within a session. Level 3
 * deliberately interleaves two pairs, because blocked practice retains
 * worse than interleaved practice despite feeling better at the time. See
 * #6 for the full reasoning.
 */

/** Level 1 — isolation: the reach, repeated in short blocks. */
export function generateIsolation(char: string, blocks = 4, repeatsPerBlock = 3): string {
  return Array.from({ length: blocks }, () => char.repeat(repeatsPerBlock)).join(' ')
}

/**
 * Level 2 — discrimination: telling a confusable pair apart. Two-character
 * tokens combining `char` and `pair` in both orders, in a fixed sequence
 * varied enough that the next token isn't predictable from the last one or
 * two — predictable order would let the fingers pattern-match the sequence
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
 * Level 3 — interference: the current pair competing against the previous
 * one, on purpose. `previous` is the pair the last practice session in this
 * run targeted; passing the same pair as `current` degrades gracefully to
 * level 2's pattern, since there is nothing yet to interleave against.
 */
export function generateInterference(
  current: readonly [string, string],
  previous: readonly [string, string],
  tokens = 8,
): string {
  const [a, aPair] = current
  const [b, bPair] = previous
  const order = ['ab', 'ba', 'ab', 'ba']
  return Array.from({ length: tokens }, (_, i) => {
    const [char, pair] = i % 2 === 0 ? [a, aPair] : [b, bPair]
    const way = order[i % order.length]
    return way === 'ab' ? char + pair : pair + char
  }).join(' ')
}

/**
 * Level 4 — context: the target inside shapes real code actually takes,
 * still synthetic (so density stays high and it stays language-agnostic),
 * but no longer an isolated token. A handful of hand-written templates for
 * the punctuation that's actually worth this level (see the corpus
 * frequency argument in #6 — brackets, quotes, semicolons dominate); any
 * other character falls back to a generic assignment-shaped context that
 * still repeats it several times.
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

export interface TransferDrill {
  trackId: string
  drillId: string
  label: string
  code: string
  grammar: Grammar
  /** Occurrences of the target character per typed character, 0-1. */
  density: number
}

/**
 * Level 5 — transfer: real drills already in the catalogue, ranked by how
 * densely they use the target character. Needs no new content — familiar
 * material is the point, since typing a passage you've already worked
 * removes "I was slow because I didn't know the API" as a confound.
 */
export function transferDrills(char: string, count = 3): TransferDrill[] {
  const candidates: TransferDrill[] = []
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      for (const drill of lesson.drills) {
        const length = typedLength(drill.code)
        if (length === 0) continue
        const occurrences = [...drill.code].filter((c) => c === char).length
        if (occurrences === 0) continue
        candidates.push({
          trackId: track.id,
          drillId: drill.id,
          label: `${track.title} · ${drill.label}`,
          code: drill.code,
          grammar: drill.grammar,
          density: occurrences / length,
        })
      }
    }
  }
  return candidates.sort((a, b) => b.density - a.density).slice(0, count)
}
