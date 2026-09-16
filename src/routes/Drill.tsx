import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { drillSequence, trackById } from '@/content/index'
import { useTypingSession } from '@/engine/useTypingSession'
import { recordSession, useProgress } from '@/store/useProgress'
import { TypingSurface } from '@/components/typing/TypingSurface'
import { rankForPractice } from '@/engine/practice/ranking'
import { useResultKeyboardNav } from '@/lib/useResultKeyboardNav'
import NotFound from './NotFound'

function Readout({
  label,
  value,
  unit,
  tone = 'text-amber',
}: {
  label: string
  value: string | number
  unit?: string
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-ink-sunk px-5 py-4">
      <span className="text-[9px] tracking-[0.2em] text-faint uppercase">{label}</span>
      <span>
        <span className={`font-display text-2xl font-light ${tone}`}>{value}</span>
        {unit !== undefined && <span className="ml-1 text-[10px] text-faint">{unit}</span>}
      </span>
    </div>
  )
}

export default function Drill() {
  const { trackId, drillId } = useParams()
  const navigate = useNavigate()
  const progress = useProgress()

  const track = trackId === undefined ? undefined : trackById(trackId)
  const sequence = useMemo(() => (track === undefined ? [] : drillSequence(track)), [track])

  // With no drill named, pick up where the history says you left off.
  const completed = useMemo(
    () => new Set(progress.sessions.filter((s) => s.trackId === trackId).map((s) => s.drillId)),
    [progress.sessions, trackId],
  )
  const current =
    (drillId === undefined
      ? sequence.find((entry) => !completed.has(entry.drill.id))
      : sequence.find((entry) => entry.drill.id === drillId)) ?? sequence[0]

  // Pin the resolved drill into the URL.
  //
  // Without this, finishing a drill records a session, which changes which
  // drill counts as "the first one not yet done" — and the screen would jump
  // to the next passage the instant you finished, taking your result with it.
  useEffect(() => {
    if (drillId === undefined && current !== undefined && trackId !== undefined) {
      navigate(`/drill/${trackId}/${current.drill.id}`, { replace: true })
    }
  }, [drillId, current, navigate, trackId])

  const next = current === undefined ? undefined : sequence[current.position + 1]

  const { compiled, state, metrics, restart, surfaceRef, onSurfaceKeyDown } = useTypingSession(
    current?.drill.code ?? '',
    current?.drill.grammar ?? 'typescript',
  )

  // One record per completed run, even under StrictMode's double effects.
  const recorded = useRef<string | null>(null)
  useEffect(() => {
    if (state.finishedAt === null || current === undefined || track === undefined) return
    const stamp = `${current.drill.id}:${state.finishedAt}`
    if (recorded.current === stamp) return
    recorded.current = stamp

    recordSession({
      id: crypto.randomUUID(),
      trackId: track.id,
      lessonId: current.lesson.id,
      drillId: current.drill.id,
      language: track.language,
      at: state.finishedAt,
      wpm: metrics.wpm,
      rawWpm: metrics.rawWpm,
      accuracy: metrics.accuracy,
      correctness: metrics.correctness,
      durationMs: metrics.elapsedMs,
      keyLedger: state.keyLedger,
      kind: 'drill',
    })
  }, [state.finishedAt, state.keyLedger, current, track, metrics])

  const finished = state.finishedAt !== null

  useResultKeyboardNav({
    finished,
    onBail: () => navigate('/explore'),
    onNext: () => navigate(next === undefined ? '/' : `/drill/${trackId}/${next.drill.id}`),
    onRetry: restart,
  })

  // A polite live region for the one AT audience the visual surface leaves
  // out entirely: announce a miss as it happens, and the result once the
  // drill ends. Deliberately terse — every keystroke already has a visual
  // reaction, and this must not become a running commentary.
  //
  // Derived during render rather than in an effect (React's own "adjusting
  // state" pattern: https://react.dev/reference/react/useState#storing-information-from-previous-renders) —
  // the announcement lands in the render that caused it instead of one tick
  // behind, and nothing here reaches outside React.
  const [live, setLive] = useState({
    compiled,
    errors: 0,
    finishedAt: null as number | null,
    message: '',
  })
  if (live.compiled !== compiled) {
    setLive({ compiled, errors: 0, finishedAt: null, message: '' })
  } else if (state.finishedAt !== null && live.finishedAt === null) {
    setLive({
      compiled,
      errors: state.errors,
      finishedAt: state.finishedAt,
      message: `Drill complete. ${metrics.wpm} words per minute, ${(metrics.accuracy * 100).toFixed(0)} percent accuracy.`,
    })
  } else if (state.errors > live.errors && state.finishedAt === null) {
    setLive({ compiled, errors: state.errors, finishedAt: null, message: 'Miss.' })
  }
  const liveMessage = live.message

  if (track === undefined || current === undefined) return <NotFound />

  const { lesson, drill } = current
  const lessonIndex = track.lessons.findIndex((entry) => entry.id === lesson.id)

  return (
    <div className="crt flex min-h-dvh flex-col">
      <a
        href="#drill-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-amber focus:px-4 focus:py-2 focus:text-[11px] focus:tracking-[0.14em] focus:text-ink focus:uppercase"
      >
        Skip to typing surface
      </a>
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <header className="relative z-10 flex h-[68px] items-center justify-between gap-4 border-b border-ink-line px-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link to="/" className="font-display text-[15px] font-semibold text-amber">
            CODETYPE
          </Link>
          <span className="text-ink-line">/</span>
          <Link to="/explore" className="truncate text-[11px] text-muted hover:text-parchment">
            {track.title}
          </Link>
          <span className="text-ink-line">/</span>
          <span className="truncate text-[11px] text-parchment">{lesson.title}</span>
        </div>
        <div className="hidden shrink-0 items-center gap-4.5 text-[10px] tracking-[0.14em] text-faint uppercase sm:flex">
          <span>Esc to bail</span>
          <span>R to restart</span>
        </div>
      </header>

      <main
        id="drill-main"
        tabIndex={-1}
        className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10 focus:outline-none"
      >
        <div
          className="reveal flex flex-col items-center gap-2.5 text-center"
          style={{ animationDelay: '0.05s' }}
        >
          <span className="text-[10px] tracking-[0.22em] text-faint uppercase">
            Lesson {lessonIndex + 1} of {track.lessons.length}
          </span>
          <h1 className="font-display text-xl font-light text-parchment md:text-2xl">
            {lesson.title}
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-muted">{lesson.concept}</p>
        </div>

        <div
          className="reveal mt-6 flex flex-wrap items-center justify-center gap-2.5"
          style={{ animationDelay: '0.14s' }}
        >
          <span className="mr-1.5 text-[10px] tracking-[0.18em] text-faint uppercase">
            Variants
          </span>
          {lesson.drills.map((variant) => {
            const isCurrent = variant.id === drill.id
            const done = completed.has(variant.id)
            return (
              <Link key={variant.id} to={`/drill/${track.id}/${variant.id}`}>
                <span
                  className={`block px-3 py-1.5 text-[10px] ${
                    isCurrent
                      ? 'bg-amber text-ink shadow-[0_0_14px_rgba(255,176,0,0.35)]'
                      : done
                        ? 'border border-signal-line text-signal'
                        : 'border border-ink-line text-ghost hover:border-ink-edge'
                  }`}
                >
                  {variant.label}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="reveal mt-8 w-full" style={{ animationDelay: '0.22s' }}>
          <TypingSurface
            ref={surfaceRef}
            compiled={compiled}
            entries={state.entries}
            cursor={state.cursor}
            onKeyDown={onSurfaceKeyDown}
          />
        </div>

        {drill.note !== undefined && !finished && (
          <p className="mt-5 max-w-xl text-center text-[11px] leading-relaxed text-faint">
            {drill.note}
          </p>
        )}

        {finished ? (
          <div
            className="panel reveal mt-7 flex w-full flex-wrap items-center justify-between gap-5 p-6"
            style={{ animationDelay: '0.05s' }}
          >
            <div className="flex flex-wrap items-baseline gap-7">
              <span>
                <span className="font-display text-4xl font-light text-amber">{metrics.wpm}</span>
                <span className="ml-1.5 text-[10px] text-faint">wpm</span>
              </span>
              <span>
                <span className="font-display text-2xl font-light text-signal">
                  {(metrics.accuracy * 100).toFixed(1)}
                </span>
                <span className="ml-1 text-[10px] text-faint">% accurate</span>
              </span>
              {metrics.errors > 0 && (
                <span className="text-[11px] text-fault">
                  {metrics.errors} {metrics.errors === 1 ? 'miss' : 'misses'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber"
              >
                Again · R
              </button>
              <Link
                to={next === undefined ? '/' : `/drill/${track.id}/${next.drill.id}`}
                className="bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft"
              >
                {next === undefined ? 'Track complete' : 'Next variant · Enter'}
              </Link>
            </div>
          </div>
        ) : null}

        {finished &&
          (() => {
            const worst = rankForPractice(state.keyLedger, 1)[0]
            if (worst === undefined || worst.missed === 0) return null
            return (
              <p className="reveal mt-3 w-full text-center text-[11px] text-faint">
                <Link to="/practice" className="text-amber hover:text-amber-soft">
                  Practice weak keys
                </Link>{' '}
                — starting with &quot;{worst.char === ' ' ? 'space' : worst.char}&quot;, the key
                that cost you the most this run.
              </p>
            )
          })()}

        {!finished && (
          <div
            className="reveal mt-7 grid w-full grid-cols-2 gap-px border border-ink-line bg-ink-line md:grid-cols-4"
            style={{ animationDelay: '0.3s' }}
          >
            <Readout label="Speed" value={metrics.wpm} unit="wpm" />
            <Readout
              label="Accuracy"
              value={(metrics.accuracy * 100).toFixed(0)}
              unit="%"
              tone="text-signal"
            />
            <Readout
              label="Missed"
              value={metrics.errors}
              tone={metrics.errors > 0 ? 'text-fault' : 'text-ghost'}
            />
            <div className="flex flex-col justify-center gap-2.5 bg-ink-sunk px-5 py-4">
              <span className="text-[9px] tracking-[0.2em] text-faint uppercase">
                Passage {current.position + 1} of {current.total}
              </span>
              <div className="h-1 bg-ink-line">
                <div
                  className="h-full bg-amber shadow-[0_0_10px_rgba(255,176,0,0.55)]"
                  style={{
                    width: `${((state.cursor / Math.max(1, compiled.cells.length)) * 100).toFixed(1)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
