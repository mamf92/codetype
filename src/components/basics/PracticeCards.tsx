import { Link } from 'react-router-dom'
import type { KeyTrack } from '@/content/basics/schema'
import { STAGE_TITLES } from '@/content/basics/schema'
import { GLYPH_EXAMPLES, POINTS, type GlyphKind } from '@/engine/keyfall'
import type { PracticeTarget, WeakKeyMode } from '@/engine/practice/weakKeys'
import { WEAK_KEY_MODES } from '@/engine/practice/weakKeys'
import type { GameRecord, StageStanding } from '@/store/progress'
import { KeyCap, Panel } from '@/components/ui/primitives'
import { KEYFALL_PATH, keyStagePath, weakKeyPath } from '@/lib/paths'

const primary =
  'inline-block bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft'
const quiet =
  'inline-block border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber'

/** One of the two ways to work weak keys, and the keys it would work right now. */
export function MethodCard({
  mode,
  targets,
  emphasis,
}: {
  mode: WeakKeyMode
  targets: PracticeTarget[]
  emphasis: boolean
}) {
  const meta = WEAK_KEY_MODES[mode]
  return (
    <Panel accent={emphasis ? 'amber' : undefined} className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[9px] tracking-[0.2em] text-faint uppercase">{meta.steps}</span>
        <h3 className="font-display text-lg font-light text-parchment">{meta.title}</h3>
        <p className="text-[11px] leading-relaxed text-muted">{meta.summary}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        {targets.length > 0 ? (
          <>
            <ul className="flex flex-wrap items-center gap-3" aria-label="Keys this run will drill">
              {targets.map(({ char, partner }) => (
                <li key={char} className="flex items-center gap-1 text-[10px] text-faint">
                  <KeyCap char={char} tone="fault" small />
                  {partner !== null && mode === 'ladder' && (
                    <>
                      <span aria-label="against">/</span>
                      <KeyCap char={partner} tone="warn" small />
                    </>
                  )}
                </li>
              ))}
            </ul>
            <Link to={weakKeyPath(mode)} className={emphasis ? primary : quiet}>
              Start {meta.title.toLowerCase()}
            </Link>
          </>
        ) : (
          <span className="text-[10px] text-faint">
            Opens once a few real drills have found your weak keys.
          </span>
        )}
      </div>
    </Panel>
  )
}

const stageStatus = (standing: StageStanding): { text: string; tone: string } => {
  if (standing.runs === 0) return { text: '—', tone: 'text-ghost' }
  const best = `${(standing.bestAccuracy * 100).toFixed(0)}%`
  return standing.cleared
    ? { text: `✓ ${best}`, tone: 'text-signal' }
    : { text: `${best} best`, tone: 'text-amber-soft' }
}

/**
 * A key track: four stages, each open from the start — nobody using this
 * needs permission to skip the reps. The card still says where to pick up:
 * the first stage not yet run clean.
 */
export function KeyTrackCard({
  track,
  standings,
}: {
  track: KeyTrack
  standings: Record<string, StageStanding>
}) {
  const nextStage = track.stages.find((stage) => !standings[stage.id]?.cleared)
  const started = track.stages.some((stage) => (standings[stage.id]?.runs ?? 0) > 0)
  const target = nextStage ?? track.stages[0]!
  const cta =
    nextStage === undefined
      ? 'Run it again'
      : started
        ? `Continue · ${STAGE_TITLES[nextStage.kind]}`
        : 'Start'

  return (
    <Panel className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-base font-light text-parchment">{track.title}</h3>
        <p className="text-[11px] leading-relaxed text-muted">{track.blurb}</p>
      </div>
      <ol className="flex flex-col">
        {track.stages.map((stage, i) => {
          const status = stageStatus(standings[stage.id]!)
          return (
            <li key={stage.id} className="border-b border-ink-line last:border-b-0">
              <Link
                to={keyStagePath(track.id, stage.id)}
                className="group flex items-center gap-3 py-2 text-[11px]"
              >
                <span className="w-5 text-[10px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 text-parchment group-hover:text-amber">
                  {STAGE_TITLES[stage.kind]}
                </span>
                <span className={`text-[10px] ${status.tone}`}>{status.text}</span>
              </Link>
            </li>
          )
        })}
      </ol>
      <div className="mt-auto">
        <Link to={keyStagePath(track.id, target.id)} className={quiet}>
          {cta}
        </Link>
      </div>
    </Panel>
  )
}

const SCORING: GlyphKind[] = ['lower', 'upper', 'digit', 'symbol', 'token']

/** A handful of glyphs mid-fall, for the look of the thing. */
const RAIN = [
  { face: 'k', x: 12, y: 18, o: 0.35 },
  { face: '{', x: 34, y: 58, o: 0.8 },
  { face: 'R', x: 58, y: 30, o: 0.55 },
  { face: '=>', x: 78, y: 70, o: 0.9 },
  { face: '4', x: 88, y: 12, o: 0.3 },
  { face: '$', x: 22, y: 82, o: 0.6 },
]

export function KeyfallCard({ leaders }: { leaders: GameRecord[] }) {
  return (
    <Panel accent="amber" className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] tracking-[0.2em] text-faint uppercase">Arcade</span>
          <h3 className="font-display text-2xl font-light tracking-[0.08em] text-amber">KEYFALL</h3>
          <p className="max-w-md text-[11px] leading-relaxed text-muted">
            Characters fall from the top of the glass. Type each one before it lands, or lose one of
            three lives. It starts on letters and gets faster every ten hits, adding capitals,
            numbers, symbols and finally whole operators.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Points">
          {SCORING.map((kind) => (
            <li
              key={kind}
              className="flex items-center gap-2 border border-ink-line px-2.5 py-1.5 text-[10px]"
            >
              <span className="font-mono text-sm text-parchment">{GLYPH_EXAMPLES[kind]}</span>
              <span className="text-amber">{POINTS[kind]}</span>
            </li>
          ))}
        </ul>
        <div>
          <Link to={KEYFALL_PATH} className={primary}>
            Play Keyfall
          </Link>
        </div>
      </div>

      <div className="relative flex min-h-[180px] flex-col justify-between overflow-hidden border border-ink-line bg-ink-sunk p-4">
        <div aria-hidden="true">
          {RAIN.map((glyph) => (
            <span
              key={glyph.face}
              className="absolute font-mono text-lg text-amber"
              // Scenery, not content: dim enough that the scores read over it.
              style={{ left: `${glyph.x}%`, top: `${glyph.y}%`, opacity: glyph.o * 0.35 }}
            >
              {glyph.face}
            </span>
          ))}
        </div>
        <div className="relative flex flex-col gap-2">
          <span className="text-[9px] tracking-[0.2em] text-faint uppercase">High scores</span>
          {leaders.length === 0 ? (
            <span className="text-[11px] text-muted">No games yet.</span>
          ) : (
            <ol className="flex flex-col gap-1">
              {leaders.map((game, i) => (
                <li key={game.id} className="flex items-baseline gap-3 text-[11px]">
                  <span className="w-4 text-faint">{i + 1}</span>
                  <span className="font-display font-light text-amber tabular-nums">
                    {game.score}
                  </span>
                  <span className="text-faint">level {game.level}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="relative mt-4 h-[3px] bg-ink-edge" aria-hidden="true" />
      </div>
    </Panel>
  )
}
