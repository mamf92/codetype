import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
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
 *
 * It hangs off the line's own code column rather than the edge of the
 * surface: the ghosted indentation is its own flex item, so a wrapped row of
 * an indented line sits in from that line's first real character instead of
 * starting to the left of it and reading as a dedent.
 */
const WRAP_INDENT = '1.6em'

/**
 * The caret is not part of the passage's text at all. It is one element laid
 * over the passage and moved onto the character awaiting input, measured
 * after every render and whenever the passage reflows.
 *
 * It must stay out of the text. Anything placed between two characters of a
 * word, even something that takes no width, can become a place the line
 * breaker is willing to break: an `inline-block` caret is one in every
 * browser, and an absolutely positioned one still is in some. A wrapped word
 * then breaks at the caret as it passes through, the characters already typed
 * jumping back up to the row above one keystroke at a time. Kept outside the
 * text, the caret cannot move a row, and rows stay where they first wrapped,
 * the way a narrow editor's do.
 *
 * It is keyed on the cursor so each keystroke mounts it afresh and it burns
 * bright again where it lands, rather than carrying on fading.
 */
function useCaretPosition(
  textRef: RefObject<HTMLDivElement | null>,
  caretRef: RefObject<HTMLSpanElement | null>,
  cursor: number,
  compiled: CompiledDrill,
): void {
  useLayoutEffect(() => {
    const text = textRef.current
    if (text === null) return

    const place = (): void => {
      const caret = caretRef.current
      if (caret === null) return
      // The character (or line-break marker) awaiting input. Past the end of
      // the passage there is none, so the caret sits after the last one.
      const at = text.querySelector<HTMLElement>(`[data-cell="${cursor}"]`)
      const target = at ?? text.querySelector<HTMLElement>(`[data-cell="${cursor - 1}"]`)
      if (target === null) {
        caret.style.visibility = 'hidden'
        return
      }
      const box = text.getBoundingClientRect()
      const cell = target.getBoundingClientRect()
      // The line-break marker is spaced off its line by a margin, and the
      // caret belongs at the end of the line, not beside the marker.
      const gap = parseFloat(getComputedStyle(target).marginLeft) || 0
      const x = (at === null ? cell.right : cell.left - gap) - box.left
      const y = cell.top + cell.height / 2 - box.top
      caret.style.transform = `translate(${x}px, ${y}px)`
      caret.style.visibility = 'visible'
    }

    place()
    // The passage reflows without a render when the surface is resized or the
    // web font arrives, and the caret has to follow it.
    const observer = new ResizeObserver(place)
    observer.observe(text)
    let live = true
    void document.fonts.ready.then(() => {
      if (live) place()
    })
    return () => {
      live = false
      observer.disconnect()
    }
  }, [textRef, caretRef, cursor, compiled])
}

/**
 * The line break at the end of a line, shown on every line that has one —
 * dim as untyped text, lit when the caret reaches it, and in the colour of
 * typed punctuation once it has been. Not as faint as the indentation dots:
 * those are texture you can ignore, this is the answer to "does the next row
 * need Enter?".
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
function Return({ index, lit, typed }: { index: number; lit: boolean; typed: boolean }) {
  // Typed: the colour typed punctuation takes, since that is what it is.
  const colour = lit ? 'var(--color-amber)' : typed ? 'var(--color-muted)' : PENDING
  return (
    <span
      aria-hidden="true"
      data-cell={index}
      className="ml-[0.4em] text-[0.7em] select-none"
      style={{ color: colour }}
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
  const textRef = useRef<HTMLDivElement | null>(null)
  const caretRef = useRef<HTMLSpanElement | null>(null)

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

  useCaretPosition(textRef, caretRef, cursor, compiled)

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
          ref={textRef}
          className={`relative font-mono tracking-code break-words whitespace-pre-wrap ${
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
                className="flex"
              >
                {line.indent.length > 0 && (
                  <span className="shrink-0" style={{ color: GHOST }}>
                    {'·'.repeat(line.indent.length)}
                  </span>
                )}

                <span
                  className="min-w-0 flex-1"
                  style={{ paddingLeft: WRAP_INDENT, textIndent: `-${WRAP_INDENT}` }}
                >
                  {line.cells.map((cell, i) => {
                    const index = line.offset + i
                    const state = entries[index] ?? 'pending'

                    return (
                      <span
                        key={index}
                        data-cell={index}
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
                    )
                  })}

                  {!isLast && (
                    <Return
                      index={newlineIndex}
                      lit={cursor === newlineIndex}
                      typed={entries[newlineIndex] === 'correct'}
                    />
                  )}
                </span>
              </div>
            )
          })}

          <span
            key={cursor}
            ref={caretRef}
            aria-hidden="true"
            className="caret pointer-events-none invisible absolute top-0 left-0 -mt-[0.625em] -ml-[1.5px] w-[3px] bg-amber"
            style={{ height: '1.25em' }}
          />
        </div>
      </div>
    </div>
  )
})
