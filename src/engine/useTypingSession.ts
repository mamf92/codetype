import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
import type { Grammar } from '@/content/schema'
import { compileDrill } from './compile'
import { keyInputFrom, typedCharacter } from './keys'
import { initialSession, reduceSession } from './session'
import type { SessionAction } from './session'
import { computeMetrics } from './metrics'
import type { CompiledDrill, Metrics, SessionState } from './types'

export interface TypingSession {
  compiled: CompiledDrill
  state: SessionState
  metrics: Metrics
  restart: () => void
  /** Attach to the focusable element that should receive typed keys. */
  surfaceRef: RefObject<HTMLDivElement | null>
  onSurfaceKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
}

/** How often live metrics refresh while typing. Fast enough to feel live. */
const TICK_MS = 250

/**
 * Binds the pure session reducer to the keyboard.
 *
 * Keys are handled by the focusable typing surface itself, via
 * `onSurfaceKeyDown`, rather than a `window` listener — a `window` listener
 * has no way to let `Tab` leave the surface, which made the whole drill
 * screen a keyboard trap. The surface is focused automatically when a drill
 * loads, so typing can still start without a click; once focus moves away
 * (by `Tab` or a click), keys stop being claimed, same as any other control.
 */
export function useTypingSession(code: string, grammar: Grammar): TypingSession {
  const compiled = useMemo(() => compileDrill(code, grammar), [code, grammar])

  const reducer = useCallback(
    (state: SessionState, action: SessionAction) => reduceSession(state, action, compiled.cells),
    [compiled],
  )
  const [state, dispatch] = useReducer(reducer, compiled.cells.length, initialSession)

  // A new drill is a new session, never a continuation of the last one.
  useEffect(() => {
    dispatch({ type: 'reset' })
  }, [compiled])

  const surfaceRef = useRef<HTMLDivElement>(null)

  // A surface inside a `.reveal` is `visibility: hidden` until its staggered
  // animation starts, and a hidden element refuses focus without a word — so
  // one `focus()` at mount silently left focus on <body>, and nothing typed
  // landed until the surface was clicked. Keep trying each frame until the
  // reveal lets it land, but only while nothing else holds focus: someone who
  // has already tabbed somewhere keeps it.
  useEffect(() => {
    const surface = surfaceRef.current
    if (surface === null) return
    const giveUpAt = performance.now() + 2000
    let frame = 0
    const attempt = (): void => {
      const free = document.activeElement === null || document.activeElement === document.body
      if (document.activeElement === surface || !free) return
      surface.focus()
      if (document.activeElement !== surface && performance.now() < giveUpAt) {
        frame = requestAnimationFrame(attempt)
      }
    }
    attempt()
    return () => cancelAnimationFrame(frame)
  }, [compiled])

  const onSurfaceKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    // Restart shortcut lives behind Alt so a bare letter can still be typed —
    // Tab is deliberately left alone; it is how you leave the surface.
    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'r') {
      event.preventDefault()
      dispatch({ type: 'reset' })
      return
    }
    if (event.key === 'Backspace' || event.key === 'Enter') {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      event.preventDefault()
      dispatch(
        event.key === 'Enter'
          ? { type: 'newline', code: event.code, at: Date.now() }
          : { type: 'backspace' },
      )
      return
    }

    // Not "no modifiers": AltGr and Option are how a non-US layout types
    // the brackets at all (see `typedCharacter`).
    const char = typedCharacter(keyInputFrom(event))
    if (char === null) return
    // Space would scroll the page out from under the passage, and Firefox
    // opens quick find on `/` and `'`.
    event.preventDefault()
    dispatch({ type: 'character', char, code: event.code, at: Date.now() })
  }, [])

  // The clock only ticks while a drill is genuinely in flight.
  const [now, setNow] = useState(() => Date.now())
  const running = state.startedAt !== null && state.finishedAt === null
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [running])

  const metrics = useMemo(() => computeMetrics(state, now), [state, now])
  const restart = useCallback(() => {
    dispatch({ type: 'reset' })
    surfaceRef.current?.focus()
  }, [])

  return { compiled, state, metrics, restart, surfaceRef, onSurfaceKeyDown }
}
