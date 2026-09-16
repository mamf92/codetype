import { NavLink } from 'react-router-dom'
import { useProgress } from '@/store/useProgress'
import { headline } from '@/store/progress'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/statistics', label: 'Statistics', end: false },
]

export function TopBar() {
  const progress = useProgress()
  const stats = headline(progress)

  return (
    <header className="relative z-10 flex h-[68px] items-center justify-between border-b border-ink-line bg-gradient-to-b from-[rgba(255,176,0,0.035)] to-transparent px-6 md:px-10">
      <NavLink to="/" className="flex items-center gap-2.5">
        <span className="font-display text-[15px] font-semibold tracking-[0.02em] text-amber">
          CODETYPE
        </span>
        <span className="caret h-[15px] w-[7px] bg-amber" />
      </NavLink>

      <nav className="flex items-center gap-5 md:gap-7">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `text-[11px] tracking-[0.16em] uppercase transition-colors ${
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
