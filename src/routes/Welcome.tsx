import { useEffect, useState } from 'react'
import { ThemePicker } from '@/components/theme/ThemePicker'
import { applyTheme, guessInitialTheme, highContrastSibling } from '@/lib/themes'
import type { ThemeId } from '@/lib/themes'
import { setTheme } from '@/store/useProgress'

/**
 * Shown once, before anything else, when no theme choice is on record —
 * including for anyone who used the app before this screen existed.
 *
 * The whole page adopts whichever theme is selected, live: you choose by
 * seeing, not by reading a label, because a swatch cannot tell you what
 * typing in a theme feels like. The one exception is this screen's own
 * chrome — the intro, the cards' own labels, the button that leaves — which
 * stays on the high-contrast sibling of whichever scheme is showing, so the
 * control you need in order to leave a theme never gets to hide itself.
 */
export default function Welcome() {
  const [previewed, setPreviewed] = useState<ThemeId>(() => guessInitialTheme())

  useEffect(() => {
    applyTheme(previewed)
  }, [previewed])

  const start = (): void => setTheme(previewed)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return
      // A radio input already uses Enter/Space for its own selection; only
      // the page-level shortcut belongs here.
      if (event.target instanceof HTMLInputElement) return
      start()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewed])

  const chromeTheme = highContrastSibling(previewed)

  return (
    <div className="crt theme-transition flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div
        data-theme={chromeTheme}
        className="theme-transition flex w-full max-w-[640px] flex-col items-center gap-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-display text-base font-semibold tracking-[0.02em] text-amber">
            CODETYPE
          </span>
          <p className="max-w-md text-[13px] leading-relaxed text-muted">
            CodeType is a typing trainer that doubles as concept rehearsal — every lesson says one
            thing several ways, in real TypeScript, React and Tailwind. Pick the screen it feels
            right on; you can change this later in Settings.
          </p>
        </div>

        <ThemePicker value={previewed} onChange={setPreviewed} legend="Choose a theme" />

        <button
          type="button"
          onClick={start}
          className="bg-amber px-6 py-2.5 text-[11px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
        >
          Start typing · Enter
        </button>
      </div>

      {/*
       * Deliberately outside the chrome override: this panel shows the
       * previewed theme exactly as it will look in a drill, dim tokens and
       * all, which is the whole point of a live preview rather than a label.
       */}
      <div className="panel w-full max-w-[640px] px-6 py-7">
        <div className="mb-4 text-[9px] tracking-[0.2em] text-faint uppercase">
          What a drill looks like
        </div>
        <pre className="font-mono text-sm leading-[1.9] break-words whitespace-pre-wrap sm:text-base">
          <span style={{ color: 'var(--color-amber)' }}>const</span>
          <span style={{ color: 'var(--color-muted)' }}> [</span>
          <span style={{ color: 'var(--color-parchment)' }}>count</span>
          <span style={{ color: 'var(--color-muted)' }}>, </span>
          <span style={{ color: 'var(--color-parchment)' }}>setCount</span>
          <span style={{ color: 'var(--color-muted)' }}>] = </span>
          <span style={{ color: 'var(--color-parchment)' }}>useState</span>
          <span style={{ color: 'var(--color-muted)' }}>(</span>
          <span style={{ color: 'var(--color-amber-soft)' }}>0</span>
          <span style={{ color: 'var(--color-muted)' }}>)</span>
          {'\n'}
          <span style={{ color: 'var(--color-parchment)' }}>setCount</span>
          <span style={{ color: 'var(--color-muted)' }}>((</span>
          <span style={{ color: 'var(--color-parchment)' }}>prev</span>
          <span style={{ color: 'var(--color-muted)' }}>) =&gt; prev + </span>
          <span style={{ color: 'var(--color-amber-soft)' }}>1</span>
          <span style={{ color: 'var(--color-muted)' }}>)</span>
          {'\n'}
          <span style={{ color: 'var(--color-ghost)' }}>{'// this line is still untyped'}</span>
        </pre>
      </div>
    </div>
  )
}
