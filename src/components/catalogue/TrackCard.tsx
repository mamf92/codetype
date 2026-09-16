import { Link } from 'react-router-dom'
import { LANGUAGES, drillCount } from '@/content/schema'
import type { Track } from '@/content/schema'
import type { TrackStanding } from '@/store/progress'
import { Meter, Panel } from '@/components/ui/primitives'

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

  return (
    <Link to={`/drill/${track.id}`} className="group block">
      <Panel
        {...(accent === undefined ? {} : { accent })}
        className="flex h-full min-h-[216px] flex-col justify-between transition-colors group-hover:border-ink-edge"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-[9px] tracking-[0.2em] uppercase ${isDispatch ? 'text-amber' : 'text-faint'}`}
            >
              {isDispatch ? 'Dispatch' : 'Course'} · {track.level}
            </span>
            {isDispatch && track.publishedAt !== undefined ? (
              <span className="text-[10px] text-faint">{track.publishedAt}</span>
            ) : (
              <span className="font-display text-[13px] font-extralight text-ink-edge">
                {LANGUAGES[track.language].short}
              </span>
            )}
          </div>

          <h3 className="font-display text-[17px] leading-snug text-parchment group-hover:text-amber-soft">
            {track.title}
          </h3>

          {showLessons ? (
            <div className="flex flex-col gap-1.5 text-[10px] text-muted">
              {track.lessons.map((lesson, i) => (
                <span key={lesson.id}>
                  {String(i + 1).padStart(2, '0')} — {lesson.title}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted">{track.blurb}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-ink-line pt-3">
          {standing.attempts > 0 && (
            <Meter fraction={standing.drillsTouched / Math.max(1, drillCount(track))} />
          )}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-faint">
              {track.lessons.length} lessons · {drillCount(track)} drills
            </span>
            <Status track={track} standing={standing} stale={stale} />
          </div>
        </div>
      </Panel>
    </Link>
  )
}
