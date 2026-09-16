import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

/** The page frame: CRT atmosphere, the bar, and a column for everything else. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="crt min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-amber focus:px-4 focus:py-2 focus:text-[11px] focus:tracking-[0.14em] focus:text-ink focus:uppercase"
      >
        Skip to content
      </a>
      <TopBar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-8 md:px-10 focus:outline-none"
      >
        {children}
      </main>
    </div>
  )
}

export function PageHead({
  title,
  blurb,
  aside,
}: {
  title: string
  blurb: string
  aside?: ReactNode
}) {
  return (
    <div className="reveal flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-2xl font-light text-parchment md:text-3xl">{title}</h1>
        <p className="max-w-xl text-xs leading-relaxed text-muted">{blurb}</p>
      </div>
      {aside}
    </div>
  )
}
