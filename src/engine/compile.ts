import type { Grammar } from '@/content/schema'
import { scopesPerCharacter } from '@/lib/highlight'
import type { Cell, CompiledDrill, CompiledLine } from './types'

const TAB_WIDTH = 2

/**
 * Bring authored code to a canonical shape: spaces for tabs, no trailing
 * whitespace, no leading or trailing blank lines. Drills should never ask you
 * to type something you cannot see.
 */
export function normalise(code: string): string {
  const lines = code.replace(/\r\n?/g, '\n').split('\n')
  const trimmed = lines.map((line) =>
    line.replace(/\t/g, ' '.repeat(TAB_WIDTH)).replace(/\s+$/, ''),
  )
  while (trimmed.length > 0 && trimmed[0] === '') trimmed.shift()
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === '') trimmed.pop()
  return trimmed.join('\n')
}

/**
 * Compile a drill into the flat cell stream the session reducer consumes.
 *
 * Leading indentation is deliberately *not* typed: it becomes the line's
 * `indent` ghost, so pressing Enter lands the caret on the first meaningful
 * character of the next line. Nobody improves at code by typing spaces.
 */
export function compileDrill(code: string, grammar: Grammar): CompiledDrill {
  const source = normalise(code)
  const scopes = scopesPerCharacter(source, grammar)

  const cells: Cell[] = []
  const lines: CompiledLine[] = []

  let cursor = 0 // index into `source`

  const rawLines = source.split('\n')
  rawLines.forEach((raw, lineIndex) => {
    const indent = raw.match(/^[ ]*/)?.[0] ?? ''
    const offset = cells.length
    const lineCells: Cell[] = []

    for (let i = indent.length; i < raw.length; i += 1) {
      const cell: Cell = {
        char: raw[i] as string,
        kind: 'char',
        line: lineIndex,
        column: lineCells.length,
        scope: scopes[cursor + i] ?? null,
      }
      lineCells.push(cell)
      cells.push(cell)
    }

    // Advance past this line's text plus its newline separator.
    cursor += raw.length + 1

    if (lineIndex < rawLines.length - 1) {
      cells.push({
        char: '\n',
        kind: 'newline',
        line: lineIndex,
        column: lineCells.length,
        scope: null,
      })
    }

    lines.push({ index: lineIndex, indent, cells: lineCells, offset })
  })

  return { cells, lines, source }
}
