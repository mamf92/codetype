import { colourForScope } from '@/lib/scopes'
import type { CompiledDrill, EntryState } from '@/engine/types'

const GHOST = '#2b241b'
const PENDING = '#4a4036'

function Caret() {
  return (
    <span
      className="caret -mx-[1.5px] inline-block w-[3px] bg-amber align-[-0.22em]"
      style={{ height: '1.25em' }}
    />
  )
}

/**
 * The passage.
 *
 * Untyped text sits dim and monochrome; typing it lights it up in its own
 * syntax colour, so the line you have done reads as code and the line ahead
 * reads as work. A missed character shows the character that was *expected*,
 * in red — you need to see what you should have hit, not what you did hit.
 */
export function TypingSurface({
  compiled,
  entries,
  cursor,
}: {
  compiled: CompiledDrill
  entries: EntryState[]
  cursor: number
}) {
  return (
    <div className="panel border-t-ink-edge w-full px-6 py-8 shadow-[0_30px_80px_-40px_rgba(255,176,0,0.25)] sm:px-10 sm:py-11">
      <div className="font-mono text-base leading-[2.05] tracking-[-0.04em] break-words whitespace-pre-wrap sm:text-lg md:text-xl">
        {compiled.lines.map((line) => {
          // The newline that ends this line sits just past its last character.
          const newlineIndex = line.offset + line.cells.length
          const isLast = line.index === compiled.lines.length - 1

          return (
            <div key={line.index}>
              {line.indent.length > 0 && (
                <span style={{ color: GHOST }}>{'·'.repeat(line.indent.length)}</span>
              )}

              {line.cells.map((cell, i) => {
                const index = line.offset + i
                const state = entries[index] ?? 'pending'

                return (
                  <span key={index}>
                    {cursor === index && <Caret />}
                    <span
                      style={
                        state === 'correct'
                          ? { color: colourForScope(cell.scope) }
                          : state === 'wrong'
                            ? {
                                color: '#e24b3f',
                                background: 'rgba(226, 75, 63, 0.14)',
                                borderBottom: '2px solid #e24b3f',
                              }
                            : { color: PENDING }
                      }
                    >
                      {cell.char}
                    </span>
                  </span>
                )
              })}

              {!isLast && cursor === newlineIndex && (
                <>
                  <Caret />
                  <span className="text-[0.6em] text-ghost"> ⏎</span>
                </>
              )}
              {isLast && cursor >= compiled.cells.length && <Caret />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
