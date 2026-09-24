import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BASICS_PATH } from '@/lib/paths'

/**
 * The bar on the full-screen practice surfaces: a breadcrumb back through
 * Basics, and the keys that work here. No navigation to look away at — the
 * same reasoning the drill screen's own bar follows.
 */
export function FocusHeader({ crumbs, hints }: { crumbs: ReactNode; hints: string[] }) {
  return (
    <header className="relative z-10 flex h-[68px] items-center justify-between gap-4 border-b border-ink-line px-6 md:px-10">
      <div className="flex min-w-0 items-center gap-3.5">
        <Link to="/" className="font-display text-[15px] font-semibold text-amber">
          CODETYPE
        </Link>
        <span className="text-ink-line">/</span>
        <Link to={BASICS_PATH} className="text-[11px] text-muted hover:text-parchment">
          Basics
        </Link>
        <span className="text-ink-line">/</span>
        <div className="flex min-w-0 items-center gap-3 truncate text-[11px] text-parchment">
          {crumbs}
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-4.5 text-[10px] tracking-[0.14em] text-faint uppercase sm:flex">
        {hints.map((hint) => (
          <span key={hint}>{hint}</span>
        ))}
      </div>
    </header>
  )
}
