import { forwardRef, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { colourForScope } from '@/lib/scopes'
import { isLongPassage } from '@/lib/passage'
import type { CompiledDrill, EntryState } from '@/engine/types'

const GHOST = 'var(--color-ghost-deep)'
const PENDING = 'var(--color-ghost)'

/** Lines of context to keep visible either side of the caret while scrolling. */
const SCROLL_MARGIN_LINES = 2

/**
 * How far a wrapped row is inset from the line it continues. Enough to read
 * as "this is the same line", not so much that the code stops lining up.
 */
const WRAP_INDENT = '1.6em'

function Caret() {
  return (
    <span
      className="caret -mx-[1.5px] inline-block w-[3px] bg-amber align-[-0.22em]"
      style={{ height: '1.25em' }}
    />
  )
}

/**
 * The line break at the end of a line, shown on every line that has one —
 * dim as untyped text, lit when the caret reaches it. Not as faint as the
 * indentation dots: those are texture you can ignore, this is the answer to
 * "does the next row need Enter?".
 *
 * Always present, for two reasons. A line wider than the surface wraps, and a
 * wrapped row otherwise looks exactly like the next line: the marker is how
 * you know which rows actually want Enter, before you get to the end of one.
 * And a marker that appears only under the caret changes the line's width on
 * arrival, which on a line that already fills the surface wraps the marker
 * onto a row of its own — the passage appears to grow a blank line, and lose
 * it again when Enter is pressed.
 *
 * It is attached to the preceding character with a margin rather than a
 * space, so there is no break opportunity in front of it: if the end of the
 * line wraps, the marker wraps with the word it belongs to.
 */
function Return({ lit }: { lit: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="ml-[0.4em] text-[0.7em] select-none"
      style={{ color: lit ? 'var(--color-amber)' : PENDING }}
    >
      ⏎
    </span>
  )
}

/**
 * The passage.
 *
 * Untyped text sits dim and monochrome; typing it lights it up in its own
 * syntax colour, so the line you have done reads as code and the line ahead
 * reads as work. A missed character shows the character that was *expected*,
 * in red — you need to see what you should have hit, not what you did hit.
 *
 * The container is the focusable typing surface: it claims keys only while
 * it holds focus, and its accessible name exposes the passage as readable
 * text to a screen reader, which otherwise only sees a wall of single-letter
 * `span`s.
 *
 * A capstone runs to thirty-odd lines, which no longer fits on a screen
 * alongside the header, the brief and the readouts. Past `LONG_PASSAGE` the
 * text gets a tighter setting, and from `sm` up its own scrolling viewport,
 * sized by the flex row it sits in rather than by a guessed `vh` fraction —
 * the chrome above it is a different height on a review than on a capstone,
 * and a fixed slice would leave the bottom of one of them under the fold. The
 * caret's line is then kept inside that viewport by scrolling the viewport
 * itself: `scrollIntoView` would scroll the page as well and drag the surface
 * out from under the caret it was trying to reveal.
 *
 * Below `sm` none of that applies. A phone has no room to give up to a
 * shrunken window onto the passage, and pairing one with the page scroll it
 * would still need is worse than letting the passage run and the page scroll
 * once.
 *
 * Lines wrap rather than scroll sideways, and every line is set with a
 * hanging indent so a wrapped row sits in from the line it continues. That,
 * plus the `⏎` on every line that ends in one, is what tells you whether the
 * row below needs Enter or is the same line still going.
 */
export const TypingSurface = forwardRef<
  HTMLDivElement,
  {
    compiled: CompiledDrill
    entries: EntryState[]
    cursor: number
    onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
  }
>(function TypingSurface({ compiled, entries, cursor, onKeyDown }, ref) {
  const long = isLongPassage(compiled)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const caretRowRef = useRef<HTMLDivElement | null>(null)

  // The cell at `cursor` is the one awaiting input. Once the passage is
  // finished there is no such cell, so fall back to the last line rather than
  // letting the caret's row go undefined on the very last keystroke.
  const caretLine = compiled.cells[cursor]?.line ?? compiled.lines.length - 1

  useEffect(() => {
    const viewport = viewportRef.current
    const row = caretRowRef.current
    if (viewport === null || row === null) return

    const margin = row.offsetHeight * SCROLL_MARGIN_LINES
    const top = row.offsetTop - margin
    const bottom = row.offsetTop + row.offsetHeight + margin
    if (top < viewport.scrollTop) {
      viewport.scrollTop = Math.max(0, top)
    } else if (bottom > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = bottom - viewport.clientHeight
    }
  }, [caretLine, compiled])

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="group"
      aria-label={`Typing surface. Type the passage: ${compiled.source}`}
      onKeyDown={onKeyDown}
      className={`panel border-t-ink-edge w-full shadow-[0_30px_80px_-40px_rgba(255,176,0,0.25)] focus:outline-none focus-visible:ring-1 focus-visible:ring-amber ${
        long
          ? 'px-5 py-5 sm:flex sm:min-h-0 sm:flex-1 sm:flex-col sm:px-8 sm:py-6'
          : 'px-6 py-8 sm:px-10 sm:py-11'
      }`}
    >
      <div
        ref={viewportRef}
        className={`relative ${long ? 'sm:min-h-0 sm:flex-1 sm:overflow-y-auto' : ''}`}
      >
        <div
          className={`font-mono tracking-[-0.04em] break-words whitespace-pre-wrap ${
            long
              ? 'text-sm leading-[1.85] sm:text-base md:text-lg'
              : 'text-base leading-[2.05] sm:text-lg md:text-xl'
          }`}
        >
          {compiled.lines.map((line) => {
            // The newline that ends this line sits just past its last character.
            const newlineIndex = line.offset + line.cells.length
            const isLast = line.index === compiled.lines.length - 1

            return (
              <div
                key={line.index}
                ref={line.index === caretLine ? caretRowRef : undefined}
                style={{ paddingLeft: WRAP_INDENT, textIndent: `-${WRAP_INDENT}` }}
              >
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
                                  color: 'var(--color-fault)',
                                  background:
                                    'color-mix(in srgb, var(--color-fault) 14%, transparent)',
                                  borderBottom: '2px solid var(--color-fault)',
                                }
                              : { color: PENDING }
                        }
                      >
                        {cell.char}
                      </span>
                    </span>
                  )
                })}

                {!isLast && (
                  <>
                    {cursor === newlineIndex && <Caret />}
                    <Return lit={cursor === newlineIndex} />
                  </>
                )}
                {isLast && cursor >= compiled.cells.length && <Caret />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
