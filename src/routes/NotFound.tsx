import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="reveal flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="font-display text-5xl font-extralight text-ink-edge">404</span>
      <p className="text-xs text-muted">Nothing here to type.</p>
      <Link
        to="/"
        className="text-[11px] tracking-[0.16em] text-amber uppercase hover:text-amber-soft"
      >
        Back to home
      </Link>
    </div>
  )
}
