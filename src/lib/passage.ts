import type { CompiledDrill } from '@/engine/types'

/** Lines past which a passage stops being a screenful and starts being a file. */
export const LONG_PASSAGE = 12

/**
 * Whether a passage needs the long-drill treatment: a tighter setting and,
 * from `sm` up, its own scrolling viewport inside a screen pinned to the
 * viewport height.
 *
 * It lives here rather than in `TypingSurface` because the drill screen needs
 * the same answer — the surface can only be sized by the space the page has
 * left if every ancestor above it agrees to stretch, so both ends of that
 * chain have to make the decision the same way.
 */
export const isLongPassage = (compiled: CompiledDrill): boolean =>
  compiled.lines.length > LONG_PASSAGE
