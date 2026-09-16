import { TRACKS } from '@/content/index'
import { compileDrill } from '@/engine/compile'

/**
 * How often each character actually gets typed across the whole catalogue —
 * the corpus frequency table the ranking in `ranking.ts` needs.
 *
 * Computed from `TRACKS` via `compileDrill`, the same function the drill
 * screen itself uses, rather than reimplementing "strip ghosted indentation"
 * separately. This can never drift from what a passage actually asks you to
 * type, and TRACKS is static catalogue data, so the cost of recomputing it
 * (a handful of drills' worth of compilation) is paid once, not per render.
 */
function computeFrequency(): { counts: Map<string, number>; total: number } {
  const counts = new Map<string, number>()
  let total = 0
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      for (const drill of lesson.drills) {
        const { cells } = compileDrill(drill.code, drill.grammar)
        for (const cell of cells) {
          counts.set(cell.char, (counts.get(cell.char) ?? 0) + 1)
          total += 1
        }
      }
    }
  }
  return { counts, total }
}

let cached: { counts: Map<string, number>; total: number } | undefined

function table(): { counts: Map<string, number>; total: number } {
  cached ??= computeFrequency()
  return cached
}

/** Raw occurrences of `char` across every drill in the catalogue. */
export function corpusCount(char: string): number {
  return table().counts.get(char) ?? 0
}

/** Total typed characters in the catalogue — the denominator every rate above is against. */
export function corpusTotal(): number {
  return table().total
}

/** Occurrences of `char` per 1000 typed characters — comparable across characters of any rarity. */
export function frequencyPer1000(char: string): number {
  const total = corpusTotal()
  return total === 0 ? 0 : (corpusCount(char) / total) * 1000
}
