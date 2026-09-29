import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { drillSequence, trackById } from '@/content/index'
import { coveredLessons, isCapstone, isReview } from '@/content/schema'
import { useTypingSession } from '@/engine/useTypingSession'
import { recordSession, useProgress } from '@/store/useProgress'
import { TypingSurface } from '@/components/typing/TypingSurface'
import { isLongPassage } from '@/lib/passage'
import { rankForPractice } from '@/engine/practice/ranking'
import { useResultKeyboardNav } from '@/lib/useResultKeyboardNav'
import { drillPath, weakKeyPath } from '@/lib/paths'
import { BUTTON } from '@/components/ui/button'
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
      <span className="text-label tracking-label text-faint uppercase">{label}</span>
      <span>
        <span className={`font-display text-2xl font-light ${tone}`}>{value}</span>
        {unit !== undefined && <span className="ml-1 text-meta text-faint">{unit}</span>}
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
  const review = isReview(lesson)
  // Reviews are not lessons you are `n of m` through, so they are left out of
  // the count rather than inflating it.
  const lessonIndex = track.lessons.filter((l) => !isReview(l)).findIndex((l) => l.id === lesson.id)
  const conceptTotal = track.lessons.length - track.lessons.filter(isReview).length
  const long = isLongPassage(compiled)

  return (
    // `min-h-dvh` only sets a floor, so a stretching surface inside it would
    // grow the page instead of scrolling. From `sm` up a long passage pins the
    // screen to the viewport height, giving the flex chain below a ceiling to
    // divide up; if the chrome ever leaves less than the surface's minimum,
    // the page simply scrolls as it did before.
    <div className={`crt flex flex-col ${long ? 'min-h-dvh sm:h-dvh' : 'min-h-dvh'}`}>
      <a
        href="#drill-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-amber focus:px-4 focus:py-2 focus:text-label focus:tracking-label focus:text-ink focus:uppercase"
      >
        Skip to typing surface
      </a>
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <header className="relative z-10 flex h-[68px] items-center justify-between gap-4 border-b border-ink-line px-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link to="/" className="font-display text-logo font-semibold text-amber">
            CODETYPE
          </Link>
          <span className="text-ink-line">/</span>
          <Link to="/explore" className="truncate text-meta text-muted hover:text-parchment">
            {track.title}
          </Link>
          <span className="text-ink-line">/</span>
          <span className="truncate text-meta text-parchment">{lesson.title}</span>
        </div>
        <div className="hidden shrink-0 items-center gap-4.5 text-label tracking-label text-faint uppercase sm:flex">
          <span>Esc to bail</span>
          <span>Alt+R to restart</span>
        </div>
      </header>

      <main
        id="drill-main"
        tabIndex={-1}
        className={`relative z-10 mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center px-6 md:px-10 focus:outline-none ${
          long ? 'justify-start py-6 sm:min-h-0' : 'justify-center py-10'
        }`}
      >
        <div
          className="reveal flex flex-col items-center gap-2.5 text-center"
          style={{ animationDelay: '0.05s' }}
        >
          {/* Every lesson in the track, so any of them is one click away rather
              than only reachable by typing through the ones before it. Each
              opens at its first drill not yet typed. Reviews keep their
              word instead of a number — 01 02 03 04 05 REVIEW. */}
          <nav
            aria-label="Lessons in this track"
            className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5 text-label tracking-section text-faint uppercase"
          >
            <span className="mr-2">
              {review ? (
                <span className="text-amber">
                  Review · {coveredLessons(track, lesson).length} concepts
                </span>
              ) : (
                <span className="sr-only">
                  Lesson {lessonIndex + 1} of {conceptTotal}.{' '}
                </span>
              )}
              {!review && <span aria-hidden="true">Lesson</span>}
            </span>
            {track.lessons.map((other) => {
              const here = other.id === lesson.id
              const numbered = track.lessons.filter((l) => !isReview(l)).indexOf(other)
              const target =
                other.drills.find((candidate) => !completed.has(candidate.id)) ?? other.drills[0]
              return (
                <Link
                  key={other.id}
                  to={drillPath(track.id, target?.id)}
                  aria-current={here ? 'page' : undefined}
                  title={other.title}
                  aria-label={
                    isReview(other) ? other.title : `Lesson ${numbered + 1}: ${other.title}`
                  }
                  className={`px-1.5 py-1 tracking-label ${
                    here ? 'text-amber' : 'text-ghost hover:text-parchment'
                  }`}
                >
                  {isReview(other) ? 'Review' : String(numbered + 1).padStart(2, '0')}
                </Link>
              )
            })}
          </nav>
          <h1 className="font-display text-xl font-light text-parchment md:text-2xl">
            {lesson.title}
          </h1>
          {/* On a capstone the concept has already been on screen for every
              variant of this lesson, and the brief below says the more useful,
              more specific thing. A review is the exception: its concept is
              the only place the whole project is described. */}
          {(review || drill.brief === undefined) && (
            <p className="max-w-xl text-body leading-relaxed text-muted">{lesson.concept}</p>
          )}
        </div>

        <div
          className="reveal mt-6 flex flex-wrap items-center justify-center gap-2.5"
          style={{ animationDelay: '0.14s' }}
        >
          <span className="mr-1.5 text-label tracking-label text-faint uppercase">
            {review ? 'Stages' : 'Variants'}
          </span>
          {lesson.drills.map((sibling) => {
            const isCurrent = sibling.id === drill.id
            const done = completed.has(sibling.id)
            // A concept lesson's capstone is the one chip that is not a
            // variant of the others, so it is not dressed like one: it keeps
            // an amber edge even while untouched, and a rule sets it apart
            // from the run it closes. A review is all capstone, so there is
            // nothing there to set apart.
            const closer = !review && isCapstone(sibling)
            return (
              <Fragment key={sibling.id}>
                {closer && <span className="mx-0.5 h-px w-5 bg-ink-line" aria-hidden="true" />}
                <Link to={`/drill/${track.id}/${sibling.id}`}>
                  <span
                    className={`block px-3 py-1.5 text-meta ${
                      isCurrent
                        ? 'bg-amber text-ink shadow-[0_0_14px_rgba(255,176,0,0.35)]'
                        : done
                          ? 'border border-signal-line text-signal'
                          : closer
                            ? 'border border-amber-soft/40 text-amber-soft hover:border-amber'
                            : 'border border-ink-line text-ghost hover:border-ink-edge'
                    }`}
                  >
                    {closer && (
                      <span className="mr-1.5 text-label tracking-label uppercase">Capstone</span>
                    )}
                    {sibling.label}
                  </span>
                </Link>
              </Fragment>
            )
          })}
        </div>

        {drill.brief !== undefined && (
          <div
            className="reveal mt-6 w-full border-l-2 border-amber-soft/40 bg-ink-sunk px-5 py-3.5"
            style={{ animationDelay: '0.18s' }}
          >
            <span className="text-label tracking-label text-amber-soft uppercase">
              {review ? `The brief · ${drill.label}` : 'The brief'}
            </span>
            <p className="mt-2 text-body leading-relaxed text-muted">{drill.brief}</p>
          </div>
        )}

        <div
          // The floor belongs on this flex item rather than inside the panel:
          // a minimum set further down cannot stop flexbox shrinking its
          // ancestors, and the surface would end up shorter than its own
          // contents and painted over by the readouts below it. Here it stops
          // the shrink instead, so a screen too small to hold everything
          // overflows downwards and scrolls, which is survivable.
          // Once the run is over the passage is reference material, not
          // something you are still typing into, so it gives up most of its
          // floor and lets the result panel take the room instead. Without
          // that, a short screen finishes a capstone with the score below the
          // fold.
          className={`reveal w-full ${
            long
              ? `mt-5 sm:flex sm:flex-1 sm:flex-col ${finished ? 'sm:min-h-24' : 'sm:min-h-[224px]'}`
              : 'mt-8'
          }`}
          style={{ animationDelay: '0.22s' }}
        >
          <TypingSurface
            ref={surfaceRef}
            compiled={compiled}
            entries={state.entries}
            cursor={state.cursor}
            onKeyDown={onSurfaceKeyDown}
          />
        </div>

        {drill.note !== undefined && !finished && (
          <p className="mt-5 max-w-xl text-center text-body leading-relaxed text-faint">
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
                <span className="ml-1.5 text-meta text-faint">wpm</span>
              </span>
              <span>
                <span className="font-display text-2xl font-light text-signal">
                  {(metrics.accuracy * 100).toFixed(1)}
                </span>
                <span className="ml-1 text-meta text-faint">% accurate</span>
              </span>
              {metrics.errors > 0 && (
                <span className="text-meta text-fault">
                  {metrics.errors} {metrics.errors === 1 ? 'miss' : 'misses'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={restart} className={BUTTON.secondary}>
                Again · R
              </button>
              <Link
                to={next === undefined ? '/' : `/drill/${track.id}/${next.drill.id}`}
                className={BUTTON.primary}
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
              <p className="reveal mt-3 w-full text-center text-meta text-faint">
                <Link to={weakKeyPath('ladder')} className="text-amber hover:text-amber-soft">
                  Practice weak keys
                </Link>{' '}
                — &quot;{worst.char}&quot; cost you the most this run, and it's not the only one
                worth another look.
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
              <span className="text-label tracking-label text-faint uppercase">
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
