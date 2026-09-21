/**
 * What counts as a key.
 *
 * The session ledger records the line break under `'\n'`, the same way it
 * records every other expected character — that is the honest record of what
 * happened at a line break, and it is what `accuracy` is built from. But a
 * line break is *structural* (see the blocking rule in `session.ts`), not a
 * reach you drill, and the panels that rank keys all lead to a practice
 * session. Practice passages are generated text: a passage made of line
 * breaks has no reachable caret, and Enter would be both the character being
 * drilled and the key that moves past it.
 *
 * So the rule lives here, once, rather than at each call site.
 */

/** Characters the ledger holds but the keyboard panels must never show. */
const STRUCTURAL = new Set(['\n'])

/** A character a keycap can stand for — anything but the line break. */
export const isKeyboardKey = (char: string): boolean => !STRUCTURAL.has(char)

/**
 * A character a generated practice passage can actually drill. Space is a
 * real key with a real miss rate, so it stays visible on the keyboard panels,
 * but a line of nothing but spaces has nowhere for the caret to land — see
 * the indentation invariant in CLAUDE.md.
 */
export const isPracticableKey = (char: string): boolean => isKeyboardKey(char) && char !== ' '
