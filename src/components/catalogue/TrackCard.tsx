import { Link } from 'react-router-dom'
import { LANGUAGES, capstoneCount, drillCount, isReview } from '@/content/schema'
import type { Track } from '@/content/schema'
import type { TrackStanding } from '@/store/progress'
import { Meter, Panel } from '@/components/ui/primitives'
import { drillPath } from '@/lib/paths'

function Status({
  track,
  standing,
  stale,
}: {
  track: Track
  standing: TrackStanding
  stale: boolean
}) {
  const total = drillCount(track)
  if (stale) return <span className="text-fault">due for a pass</span>
  if (standing.attempts === 0) return <span className="text-muted">not started</span>
  return (
    <span className="text-signal">
      {standing.drillsTouched} / {total} typed
    </span>
  )
}

export function TrackCard({
  track,
  standing,
  stale,
  showLessons = false,
}: {
  track: Track
  standing: TrackStanding
  stale: boolean
  showLessons?: boolean
}) {
  const isDispatch = track.kind === 'dispatch'
  const accent = stale ? 'fault' : isDispatch ? 'amber' : undefined

  // The title's link is stretched over the whole card, so the card still
  // opens the track wherever it is clicked; the lesson rows sit above that
  // layer as links of their own. A link can't be nested inside another, which
  // is why the card is not simply wrapped in one.
  return (
    <article className="group relative">
      <Panel
        {...(accent === undefined ? {} : { accent })}
        className="flex h-full min-h-[216px] flex-col justify-between transition-colors group-hover:border-ink-edge"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-label tracking-label uppercase ${isDispatch ? 'text-amber' : 'text-faint'}`}
            >
              {isDispatch ? 'Dispatch' : 'Course'} · {track.level}
            </span>
            {isDispatch && track.publishedAt !== undefined ? (
              <span className="text-meta text-faint">{track.publishedAt}</span>
            ) : (
              <span className="font-display text-glyph font-extralight text-ink-edge">
                {LANGUAGES[track.language].short}
              </span>
            )}
          </div>

          <h3 className="font-display text-title leading-snug text-parchment group-hover:text-amber-soft">
            <Link
              to={drillPath(track.id)}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-amber"
            >
              {track.title}
            </Link>
          </h3>

          {showLessons ? (
            <ol className="flex flex-col gap-1.5 text-meta text-muted">
              {/* Reviews sit outside the numbering rather than continuing it:
                  the sequence a learner sees is 01 02 03 04 05 REVIEW, and a
                  review numbered 06 would read as a sixth concept. */}
              {track.lessons.map((lesson) => {
                const numbered = track.lessons.filter((l) => !isReview(l)).indexOf(lesson)
                const first = lesson.drills[0]
                return (
                  <li key={lesson.id}>
                    <Link
                      to={drillPath(track.id, first?.id)}
                      className={`relative z-10 hover:text-amber ${isReview(lesson) ? 'text-amber-soft' : ''}`}
                    >
                      {isReview(lesson)
                        ? `REVIEW — ${lesson.title.replace(/^Review: /, '')}`
                        : `${String(numbered + 1).padStart(2, '0')} — ${lesson.title}`}
                    </Link>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="text-body leading-relaxed text-muted">{track.blurb}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-ink-line pt-3">
          {standing.attempts > 0 && (
            <Meter fraction={standing.drillsTouched / Math.max(1, drillCount(track))} />
          )}
          <div className="flex items-center justify-between gap-3 text-meta whitespace-nowrap">
            <span className="text-faint">
              {track.lessons.length} lessons · {drillCount(track)} drills
              {/* Dropped on a phone, where the line would otherwise wrap mid-phrase. */}
              <span className="hidden sm:inline"> · {capstoneCount(track)} capstones</span>
            </span>
            <Status track={track} standing={standing} stale={stale} />
          </div>
        </div>
      </Panel>
    </article>
  )
}
