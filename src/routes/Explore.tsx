import { useState } from 'react'
import { TRACKS } from '@/content/index'
import { useNow } from '@/lib/useNow'
import { LANGUAGES, capstoneCount, drillCount } from '@/content/schema'
import type { LanguageId, Level, Track } from '@/content/schema'
import { useProgress } from '@/store/useProgress'
import { dueForRevisit, standingFor } from '@/store/progress'
import { PageHead } from '@/components/layout/Shell'
import { Chip } from '@/components/ui/primitives'
import { TrackCard } from '@/components/catalogue/TrackCard'

type KindFilter = 'all' | 'course' | 'dispatch'
type LevelFilter = 'all' | Level

const LEVELS: Level[] = ['foundation', 'working', 'frontier']

/** Languages the schema knows, split by whether anything has been written yet. */
const stocked = new Set(TRACKS.map((track) => track.language))
const LANGUAGE_IDS = Object.keys(LANGUAGES) as LanguageId[]

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="w-[78px] shrink-0 text-[9px] tracking-[0.2em] text-faint uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

export default function Explore() {
  const progress = useProgress()
  const now = useNow()
  const [language, setLanguage] = useState<LanguageId | 'all'>('all')
  const [kind, setKind] = useState<KindFilter>('all')
  const [level, setLevel] = useState<LevelFilter>('all')
  const [dueOnly, setDueOnly] = useState(false)

  const stale = new Set(dueForRevisit(progress, TRACKS, now).map((track) => track.id))

  const matches = (track: Track): boolean =>
    (language === 'all' || track.language === language) &&
    (kind === 'all' || track.kind === kind) &&
    (level === 'all' || track.level === level) &&
    (!dueOnly || stale.has(track.id))

  const visible = TRACKS.filter(matches)
  const lessons = TRACKS.reduce((sum, track) => sum + track.lessons.length, 0)
  const drills = TRACKS.reduce((sum, track) => sum + drillCount(track), 0)
  const capstones = TRACKS.reduce((sum, track) => sum + capstoneCount(track), 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Everything typeable"
        blurb={`${TRACKS.length} tracks, ${lessons} lessons, ${drills} passages, ${capstones} of them capstones. Every lesson says one thing several ways and then puts it to work in a real codebase, because that is the only way it sticks.`}
        aside={
          <span className="text-[10px] tracking-[0.2em] text-faint uppercase">
            {visible.length} of {TRACKS.length} shown
          </span>
        }
      />

      <div
        className="reveal flex flex-col gap-3 border-y border-ink-line py-4.5"
        style={{ animationDelay: '0.12s' }}
      >
        <FilterRow label="Language">
          <button type="button" onClick={() => setLanguage('all')}>
            <Chip tone={language === 'all' ? 'on' : 'idle'}>All</Chip>
          </button>
          {LANGUAGE_IDS.map((id) =>
            stocked.has(id) ? (
              <button key={id} type="button" onClick={() => setLanguage(id)}>
                <Chip tone={language === id ? 'on' : 'idle'}>{LANGUAGES[id].label}</Chip>
              </button>
            ) : (
              // Named in the schema, nothing written yet. Shown so the shape of
              // where this is going is visible, not clickable so it cannot lie.
              <span key={id} title="Not in the catalogue yet">
                <Chip tone="absent">{LANGUAGES[id].label}</Chip>
              </span>
            ),
          )}
        </FilterRow>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <FilterRow label="Kind">
            {(['all', 'course', 'dispatch'] as KindFilter[]).map((value) => (
              <button key={value} type="button" onClick={() => setKind(value)}>
                <Chip tone={kind === value ? 'on' : 'idle'}>
                  {value === 'all' ? 'All' : value === 'course' ? 'Courses' : 'Dispatches'}
                </Chip>
              </button>
            ))}
          </FilterRow>

          <FilterRow label="Level">
            {(['all', ...LEVELS] as LevelFilter[]).map((value) => (
              <button key={value} type="button" onClick={() => setLevel(value)}>
                <Chip tone={level === value ? 'on' : 'idle'}>
                  {value === 'all' ? 'All' : value}
                </Chip>
              </button>
            ))}
          </FilterRow>

          {stale.size > 0 && (
            <button type="button" onClick={() => setDueOnly(!dueOnly)} className="ml-auto">
              <Chip tone={dueOnly ? 'on' : 'fault'}>Due for a pass · {stale.size}</Chip>
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="reveal py-16 text-center text-[11px] text-muted">
          Nothing matches that combination yet.
        </p>
      ) : (
        <div
          className="reveal grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          style={{ animationDelay: '0.2s' }}
        >
          {visible.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              standing={standingFor(progress, track.id)}
              stale={stale.has(track.id)}
              showLessons
            />
          ))}
        </div>
      )}
    </div>
  )
}
