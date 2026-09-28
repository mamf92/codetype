import { Link } from 'react-router-dom'
import { SPEED_TESTS } from '@/content/speed/index'
import { SPEED_GROUP_TITLES, type SpeedTestGroup } from '@/content/speed/schema'
import type { SpeedTestStanding } from '@/store/progress'
import { Panel } from '@/components/ui/primitives'
import { bestResult, testLength } from '@/components/basics/speedResult'
import { speedTestPath } from '@/lib/paths'

const GROUPS: { group: SpeedTestGroup; blurb: string }[] = [
  {
    group: 'sprint',
    blurb: 'One line, once, against the clock. Ranked on time, and only a clean run has one.',
  },
  { group: 'text', blurb: 'Plain prose, no code — the number people mean by typing speed.' },
  { group: 'code', blurb: 'A minute of each language in the catalogue, Enter and all.' },
]

/**
 * Every speed test, grouped, with the best on record beside each. Each row is
 * the way in: nothing here needs setting up before you start.
 */
export function SpeedTestPanel({ standings }: { standings: Record<string, SpeedTestStanding> }) {
  return (
    <Panel className="grid gap-6 md:grid-cols-3 md:gap-8">
      {GROUPS.map(({ group, blurb }) => (
        <div key={group} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-base font-light text-parchment">
              {SPEED_GROUP_TITLES[group]}
            </h3>
            <p className="text-[11px] leading-relaxed text-muted">{blurb}</p>
          </div>
          <ul className="flex flex-col">
            {SPEED_TESTS.filter((test) => test.group === group).map((test) => {
              const best = bestResult(test, standings[test.id]!)
              return (
                <li key={test.id} className="border-b border-ink-line last:border-b-0">
                  <Link
                    to={speedTestPath(test.id)}
                    className="group flex items-baseline gap-3 py-2 text-[11px]"
                  >
                    <span className="flex-1 text-parchment group-hover:text-amber">
                      {test.title}
                    </span>
                    <span className="text-[10px] text-faint">{testLength(test)}</span>
                    <span
                      className={`w-[82px] text-right text-[10px] tabular-nums ${
                        best === null ? 'text-ghost' : 'text-amber'
                      }`}
                    >
                      {best ?? '—'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </Panel>
  )
}
