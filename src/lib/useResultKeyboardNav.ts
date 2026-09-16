import { useEffect } from 'react'

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
 */
export function useResultKeyboardNav({
  finished,
  onBail,
  onNext,
  onRetry,
}: ResultKeyboardNavOptions): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onBail()
        return
      }
      if (!finished || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName
        if (tag === 'A' || tag === 'BUTTON') return
      }
      if (event.key === 'Enter' && onNext !== undefined) {
        event.preventDefault()
        onNext()
      } else if (event.key.toLowerCase() === 'r' && onRetry !== undefined) {
        event.preventDefault()
        onRetry()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finished, onBail, onNext, onRetry])
}
