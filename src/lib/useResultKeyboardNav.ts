import { useEffect, useLayoutEffect, useRef } from 'react'

export interface ResultKeyboardNavOptions {
  /** Whether the current attempt is finished — Enter/R do nothing until it is. */
  finished: boolean
  /** Esc always bails, whether or not anything has finished yet. */
  onBail: () => void
  /** Enter, once finished. Omit to leave Enter unhandled. */
  onNext?: () => void
  /** R, once finished. Omit to leave R unhandled. */
  onRetry?: () => void
}

/**
 * The keyboard policy shared by every "you finished something, now what"
 * screen: Esc always bails; Enter and R only take effect once `finished` is
 * true, and never hijack a link or button someone tabbed to on purpose.
 *
 * Callbacks are read from a ref rather than a `useEffect` dependency, so
 * passing a fresh arrow function each render (as every call site does)
 * doesn't tear down and re-add the `window` listener on every keystroke —
 * only `finished` flipping does that.
 */
export function useResultKeyboardNav({
  finished,
  onBail,
  onNext,
  onRetry,
}: ResultKeyboardNavOptions): void {
  const callbacks = useRef({ onBail, onNext, onRetry })
  useLayoutEffect(() => {
    callbacks.current = { onBail, onNext, onRetry }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        callbacks.current.onBail()
        return
      }
      if (!finished || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName
        if (tag === 'A' || tag === 'BUTTON') return
      }
      if (event.key === 'Enter' && callbacks.current.onNext !== undefined) {
        event.preventDefault()
        callbacks.current.onNext()
      } else if (event.key.toLowerCase() === 'r' && callbacks.current.onRetry !== undefined) {
        event.preventDefault()
        callbacks.current.onRetry()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finished])
}
