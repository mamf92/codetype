import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

/** The page frame: CRT atmosphere, the bar, and a column for everything else. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="crt min-h-dvh">
      <TopBar />
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-8 md:px-10">
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
