import { Link } from 'react-router-dom'
import type { KeyLedger } from '@/engine/types'
import { favouriteKeys } from '@/engine/metrics'
import type { PracticeCandidate } from '@/engine/practice/ranking'
import { KeyCap, Panel } from '@/components/ui/primitives'
import { weakKeyPath } from '@/lib/paths'
import { accuracyOf, keyName, meanLatencyMs } from './keyStanding'

const Heading = ({ title, aside }: { title: string; aside: string }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-2">
    <h2 className="text-[10px] tracking-[0.2em] text-faint uppercase">{title}</h2>
    <span className="text-[10px] text-faint">{aside}</span>
  </div>
)

/**
 * The keys practice will drill, in the order it will drill them: ranked by
 * what they cost you per thousand characters of real code, not by bare miss
 * rate — a rare key with a bad rate costs less than a common one with a
 * middling rate (see `rankForPractice`). Each row practices that key alone.
 */
export function NeedsWork({ ranked, ledger }: { ranked: PracticeCandidate[]; ledger: KeyLedger }) {
  const shown = ranked.slice(0, 6)
  const worst = Math.max(...shown.map((key) => key.missed / key.pressed), 0.01)

  return (
    <Panel accent="fault" className="flex h-full flex-col gap-4">
      <Heading title="Needs work" aside="ranked by misses per 1,000 characters" />
      {shown.length === 0 ? (
        <p className="flex flex-1 items-center text-[11px] leading-relaxed text-muted">
          No key has enough history yet. A few real drills and the keys that cost you the most line
          up here, worst first.
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {shown.map((key) => {
            const stat = ledger[key.char]
            const rate = key.missed / key.pressed
            return (
              <li key={key.char}>
                <Link
                  to={weakKeyPath('ladder', [key.char])}
                  aria-label={`${keyName(key.char)}: missed ${(rate * 100).toFixed(1)}% of ${key.pressed} presses. Practice this key.`}
                  className="group grid grid-cols-[auto_1fr_4.5rem_3.5rem] items-center gap-3 text-[10px]"
                >
                  <KeyCap char={key.char} tone={key.missed > 0 ? 'fault' : 'warn'} small />
                  <span className="h-1.5 bg-ink-line">
                    <span
                      className="block h-full bg-fault group-hover:bg-amber"
                      style={{ width: `${Math.max(2, (rate / worst) * 100).toFixed(1)}%` }}
                    />
                  </span>
                  <span className="text-right text-muted group-hover:text-amber">
                    {(rate * 100).toFixed(1)}% miss
                  </span>
                  <span className="text-right text-faint">
                    {stat === undefined ? '' : `${meanLatencyMs(stat)} ms`}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}

/** Cleanest keys, volume breaking ties — the ones you never think about. */
export function Strongest({ ledger }: { ledger: KeyLedger }) {
  const best = favouriteKeys(ledger, 6)
  return (
    <Panel className="flex h-full flex-col gap-4">
      <Heading title="Strongest" aside="12+ presses" />
      {best.length === 0 ? (
        <p className="flex flex-1 items-center text-[11px] leading-relaxed text-muted">
          Nothing measured yet. The keys you never miss show up here once you have typed them enough
          to be sure.
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {best.map((key) => {
            const stat = ledger[key.char]!
            return (
              <li
                key={key.char}
                className="grid grid-cols-[auto_1fr_auto_3.5rem] items-center gap-3 text-[10px]"
              >
                <KeyCap char={key.char} tone="signal" small />
                <span className="text-signal">{(accuracyOf(stat) * 100).toFixed(1)}%</span>
                <span className="text-faint">{key.pressed} presses</span>
                <span className="text-right text-faint">{meanLatencyMs(stat)} ms</span>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
