import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import type { Grammar } from '@/content/schema'
import { compileDrill } from './compile'
import { initialSession, reduceSession } from './session'
import type { SessionAction } from './session'
import { computeMetrics } from './metrics'
import type { CompiledDrill, Metrics, SessionState } from './types'

export interface TypingSession {
  compiled: CompiledDrill
  state: SessionState
  metrics: Metrics
  restart: () => void
}

/** How often live metrics refresh while typing. Fast enough to feel live. */
const TICK_MS = 250

/**
 * Binds the pure session reducer to the keyboard.
 *
 * Listens on `window` rather than a focused input: there is no text field to
 * lose focus, so the drill can never silently stop accepting keystrokes.
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === 'Tab') {
        event.preventDefault()
        dispatch({ type: 'reset' })
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        dispatch({ type: 'backspace' })
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        dispatch({ type: 'newline', code: event.code, at: Date.now() })
        return
      }
      if (event.key.length === 1) {
        // Space would scroll the page out from under the passage.
        if (event.key === ' ') event.preventDefault()
        dispatch({ type: 'character', char: event.key, code: event.code, at: Date.now() })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
  const restart = useCallback(() => dispatch({ type: 'reset' }), [])

  return { compiled, state, metrics, restart }
}
