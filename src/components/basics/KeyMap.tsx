import { Link } from 'react-router-dom'
import type { KeyLedger } from '@/engine/types'
import { isPracticableKey } from '@/engine/keys'
import { SYMBOL_KEYS } from '@/content/basics/schema'
import { weakKeyPath } from '@/lib/paths'
import {
  accuracyOf,
  keyName,
  keyTone,
  meanLatencyMs,
  THIN_PRESSES,
  type KeyTone,
} from './keyStanding'

/**
 * Grouped by what a key is, not where it sits. A drawn keyboard would have
 * to assume a layout, and this codebase is used on layouts where `[` is not
 * next to `p` at all (see the `event.code` invariant in CLAUDE.md). Rows of
 * characters are honest on every keyboard.
 */
const ROWS: Array<{ label: string; chars: string[] }> = [
  { label: 'Letters', chars: [...'abcdefghijklmnopqrstuvwxyz'] },
  { label: 'Capitals', chars: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] },
  { label: 'Numbers', chars: [...'0123456789'] },
  { label: 'Symbols', chars: [...SYMBOL_KEYS, ' '] },
]

const TILE: Record<KeyTone, string> = {
  untouched: 'border-dashed border-ink-line text-ghost',
  thin: 'border-ink-line text-faint',
  strong: 'border-signal-line text-signal',
  fair: 'border-ink-edge text-amber-soft',
  weak: 'border-fault-line text-fault bg-[color-mix(in_srgb,var(--color-fault)_10%,transparent)]',
}

const LEGEND: Array<{ tone: KeyTone; label: string }> = [
  { tone: 'strong', label: '98%+' },
  { tone: 'fair', label: '93–98%' },
  { tone: 'weak', label: 'under 93%' },
  { tone: 'thin', label: `under ${THIN_PRESSES} presses` },
  { tone: 'untouched', label: 'never typed' },
]

const tileClass = (tone: KeyTone): string =>
  `flex h-7 w-7 items-center justify-center rounded-[3px] border font-mono text-xs ${TILE[tone]}`

/** Every key, coloured by how you actually type it. Anything you have typed practices on click. */
export function KeyMap({ ledger }: { ledger: KeyLedger }) {
  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[10px] tracking-[0.2em] text-faint uppercase">
          The whole keyboard, from your real drills
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-faint">
          {LEGEND.map(({ tone, label }) => (
            <li key={tone} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-[2px] border ${TILE[tone]}`} />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {ROWS.map((row) => (
        <div key={row.label} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="w-16 shrink-0 pt-1.5 text-[9px] tracking-[0.18em] text-faint uppercase">
            {row.label}
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {row.chars.map((char) => {
              const stat = ledger[char]
              const tone = keyTone(stat)
              const face = char === ' ' ? '␣' : char
              const detail =
                stat === undefined || stat.pressed === 0
                  ? 'never typed'
                  : `${(accuracyOf(stat) * 100).toFixed(1)}% of ${stat.pressed} presses, ${meanLatencyMs(stat)} ms`
              const practicable = stat !== undefined && stat.pressed > 0 && isPracticableKey(char)
              return (
                <li key={char}>
                  {practicable ? (
                    <Link
                      to={weakKeyPath('ladder', [char])}
                      title={`${keyName(char)} · ${detail} · practice it`}
                      aria-label={`${keyName(char)}: ${detail}. Practice this key.`}
                      className={`${tileClass(tone)} hover:border-amber hover:text-amber`}
                    >
                      {face}
                    </Link>
                  ) : (
                    <span
                      title={`${keyName(char)} · ${detail}`}
                      aria-label={`${keyName(char)}: ${detail}`}
                      role="img"
                      className={tileClass(tone)}
                    >
                      {face}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
