import { NavLink } from 'react-router-dom'
import { useProgress } from '@/store/useProgress'
import { headline } from '@/store/progress'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/basics', label: 'Basics', end: false },
  { to: '/statistics', label: 'Statistics', end: false },
  { to: '/settings', label: 'Settings', end: false },
]

export function TopBar() {
  const progress = useProgress()
  const stats = headline(progress)

  return (
    // Below `lg` the nav takes a row of its own: five sections never fitted
    // beside the logo on a phone, and a bar wider than the screen scrolled
    // the whole page sideways.
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-y-3 border-b border-ink-line bg-gradient-to-b from-[rgba(255,176,0,0.035)] to-transparent px-6 py-4 md:px-10 lg:h-[68px] lg:flex-nowrap lg:py-0">
      <NavLink to="/" className="flex items-center gap-2.5">
        <span className="font-display text-[15px] font-semibold tracking-[0.02em] text-amber">
          CODETYPE
        </span>
        <span className="caret h-[15px] w-[7px] bg-amber" />
      </NavLink>

      <nav className="order-last flex w-full items-center justify-between gap-3 overflow-x-auto sm:justify-start sm:gap-7 lg:order-none lg:w-auto">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `shrink-0 text-[10px] tracking-[0.04em] uppercase transition-colors sm:text-[11px] sm:tracking-[0.16em] ${
                isActive ? 'text-amber' : 'text-faint hover:text-parchment'
              }`
            }
          >
            {({ isActive }) => (
              <span className="block">
                {link.label}
                {isActive && (
                  <span className="mt-[7px] block h-px bg-amber shadow-[0_0_8px_rgba(255,176,0,0.9)]" />
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="hidden items-baseline gap-3.5 text-[11px] text-faint sm:flex">
        <span>
          <span className="font-display text-sm font-light text-amber">
            {Math.round(stats.recentWpm)}
          </span>{' '}
          wpm
        </span>
        <span className="text-ink-line">/</span>
        <span>
          <span className="font-display text-sm font-light text-amber">
            {(stats.recentAccuracy * 100).toFixed(1)}
          </span>
          %
        </span>
      </div>
    </header>
  )
}
