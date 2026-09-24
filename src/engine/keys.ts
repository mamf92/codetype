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

/**
 * The parts of a keyboard event that decide whether it typed a character —
 * narrow, so the decision is testable without a DOM. Build one from a real
 * event with `keyInputFrom`.
 */
export interface KeyInput {
  key: string
  code: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  /** `event.getModifierState('AltGraph')`. */
  altGraph: boolean
  /**
   * Whether Alt on its own composes characters, as Option does on a Mac. On
   * Windows and Linux plain Alt is only ever a shortcut; their third level
   * is AltGr, which arrives as `altGraph` or as Ctrl+Alt.
   */
  altComposes: boolean
}

/** macOS, where Option types characters. Read once; the platform doesn't change. */
const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

export const keyInputFrom = (event: {
  key: string
  code: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  getModifierState(key: 'AltGraph'): boolean
}): KeyInput => ({
  key: event.key,
  code: event.code,
  ctrlKey: event.ctrlKey,
  altKey: event.altKey,
  metaKey: event.metaKey,
  altGraph: event.getModifierState('AltGraph'),
  altComposes: isMac(),
})

/** The character a physical letter or digit key gives with no modifier held, if it is one. */
function unmodified(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter !== null) return letter[1]!.toLowerCase()
  const digit = /^Digit([0-9])$/.exec(code)
  if (digit !== null) return digit[1]!
  return null
}

/**
 * The character a keystroke typed, or null if it was a shortcut or not text
 * at all.
 *
 * "Any modifier means a shortcut" is a US-keyboard assumption, and it is
 * wrong for a real share of the people using this. A Norwegian layout puts
 * `[ ] { }` behind AltGr on the digit row, and Windows reports AltGr as
 * Ctrl+Alt; a Norwegian Mac puts `[` on Option+8, reported as Alt. Refusing
 * every event with a modifier made the brackets untypable on both.
 *
 * So: Meta is always a shortcut, and so is Ctrl alone. AltGr is always text.
 * Ctrl+Alt is text when it *changed* the character — AltGr+7 giving `{` —
 * and a shortcut when the key still reports its own plain letter or digit.
 * Plain Alt is text only where it composes characters (a Mac's Option), and
 * a shortcut everywhere else — Alt+Shift+1 on Windows reports `!`, and that
 * must not be typed.
 */
export function typedCharacter(input: KeyInput): string | null {
  // One UTF-16 unit: named keys ("Shift", "Enter") are longer.
  if (input.key.length !== 1) return null
  if (input.metaKey) return null
  if (input.altGraph) return input.key
  if (input.ctrlKey && !input.altKey) return null
  if (input.ctrlKey && input.altKey) {
    return input.key.toLowerCase() === unmodified(input.code) ? null : input.key
  }
  if (input.altKey && !input.altComposes) return null
  return input.key
}
