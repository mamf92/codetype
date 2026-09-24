import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EFFECT_MS,
  GLYPH_LABELS,
  initialKeyfall,
  keyfallAccuracy,
  levelFor,
  POINTS,
  reduceKeyfall,
  STARTING_LIVES,
  UNLOCKS_AT,
  type Glyph,
  type GlyphKind,
} from '@/engine/keyfall'
import { keyInputFrom, typedCharacter } from '@/engine/keys'
import { rankForPractice } from '@/engine/practice/ranking'
import { MAX_PRACTICE_KEYS } from '@/engine/practice/weakKeys'
import { bestGames, lifetimeLedger } from '@/store/progress'
import { recordGame, useProgress } from '@/store/useProgress'
import { FocusHeader } from '@/components/layout/FocusHeader'
import { KeyCap } from '@/components/ui/primitives'
import { BASICS_PATH } from '@/lib/paths'

const KINDS: GlyphKind[] = ['lower', 'upper', 'digit', 'symbol', 'token']
const EXAMPLES: Record<GlyphKind, string> = {
  lower: 'a',
  upper: 'A',
  digit: '7',
  symbol: '{',
  token: '=>',
}

/**
 * Glyph colours stay inside the phosphor palette: parchment and the amber
 * family by value, so a glance says what a glyph is worth. Cyan is kept for
 * "you got it" and red for "you are about to lose it", as everywhere else.
 */
const GLYPH_TONES: Record<GlyphKind, string> = {
  lower: 'var(--color-parchment)',
  upper: 'var(--color-amber-soft)',
  digit: 'var(--color-amber)',
  symbol: 'var(--color-amber)',
  token: 'var(--color-amber)',
}

/** Past this far down, a glyph turns red: it is about to cost a life. */
const DANGER_Y = 0.78

function FallingGlyph({ glyph }: { glyph: Glyph }) {
  const danger = glyph.y > DANGER_Y
  const colour = danger ? 'var(--color-fault)' : GLYPH_TONES[glyph.kind]
  return (
    <span
      className={`absolute -translate-x-1/2 font-mono text-2xl leading-none md:text-3xl ${
        glyph.kind === 'token' ? 'border border-current px-1.5 py-1' : 'px-1 py-1'
      }`}
      style={{
        left: `${(glyph.x * 100).toFixed(2)}%`,
        top: `calc(${glyph.y.toFixed(4)} * (100% - 2.75rem))`,
        color: colour,
        textShadow: `0 0 12px color-mix(in srgb, ${colour} 70%, transparent)`,
      }}
    >
      {[...glyph.text].map((char, i) => (
        <span key={i} style={i < glyph.progress ? { color: 'var(--color-signal)' } : undefined}>
          {char}
        </span>
      ))}
    </span>
  )
}

function Lives({ lives }: { lives: number }) {
  return (
    <span className="flex gap-1.5" aria-label={`${lives} of ${STARTING_LIVES} lives left`}>
      {Array.from({ length: STARTING_LIVES }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-3 ${
            i < lives
              ? 'bg-amber shadow-[0_0_8px_var(--color-amber)]'
              : 'border border-fault-line bg-transparent'
          }`}
        />
      ))}
    </span>
  )
}

function ScoreTable() {
  return (
    <table className="w-full max-w-xs text-left text-[11px]">
      <tbody>
        {KINDS.map((kind) => (
          <tr key={kind} className="border-b border-ink-line last:border-b-0">
            <td className="py-1.5 pr-4 font-mono text-base" style={{ color: GLYPH_TONES[kind] }}>
              {EXAMPLES[kind]}
            </td>
            <td className="py-1.5 pr-4 text-muted">{GLYPH_LABELS[kind]}</td>
            <td className="py-1.5 pr-4 text-faint">
              {UNLOCKS_AT[kind] === 1 ? 'from the start' : `level ${UNLOCKS_AT[kind]}`}
            </td>
            <td className="py-1.5 text-right font-display text-amber">{POINTS[kind]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const buttonPrimary =
  'bg-amber px-4 py-2 text-[10px] tracking-[0.18em] text-ink uppercase hover:bg-amber-soft'
const buttonQuiet =
  'border border-ink-edge px-4 py-2 text-[10px] tracking-[0.18em] text-parchment uppercase hover:border-amber hover:text-amber'

/**
 * Keyfall: characters fall, you type them before they land. The rules live
 * in `src/engine/keyfall.ts`; this screen owns the clock, the keyboard and
 * the glass.
 */
export default function Keyfall() {
  const navigate = useNavigate()
  const progress = useProgress()
  const [state, dispatch] = useReducer(reduceKeyfall, undefined, () => initialKeyfall())
  const fieldRef = useRef<HTMLDivElement>(null)

  // Read once per visit, like every other practice surface.
  const [weakKeys] = useState(() =>
    rankForPractice(lifetimeLedger(progress))
      .slice(0, MAX_PRACTICE_KEYS)
      .map((key) => key.char),
  )
  const [useWeakKeys, setUseWeakKeys] = useState(false)

  const leaders = bestGames(progress, 5)
  // The best before this game started, so the end screen can say "new best"
  // about the game it is showing rather than the game it just saved.
  const [bestBefore, setBestBefore] = useState(0)

  // Which game this is, so each one is saved exactly once.
  const run = useRef(0)
  const saved = useRef(0)

  const start = (): void => {
    run.current += 1
    setBestBefore(bestGames(progress, 1)[0]?.score ?? 0)
    dispatch({ type: 'start', seed: Date.now(), focus: useWeakKeys ? weakKeys : [] })
    // Off whatever button started it, so Space or Enter can't press it again.
    fieldRef.current?.focus()
  }

  // The clock only runs while the game does.
  useEffect(() => {
    if (state.status !== 'running') return
    let last = performance.now()
    let frame = 0
    const loop = (now: number): void => {
      dispatch({ type: 'tick', dtMs: now - last })
      last = now
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [state.status])

  // Looking away pauses. Losing a life to a notification is not a game.
  useEffect(() => {
    const pause = (): void => dispatch({ type: 'pause' })
    const onVisibility = (): void => {
      if (document.hidden) pause()
    }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Keyboard. Read through a ref so the listener is added once, not per frame.
  const handlers = useRef({ start, status: state.status })
  useLayoutEffect(() => {
    handlers.current = { start, status: state.status }
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const { status } = handlers.current
      if (event.key === 'Escape') {
        navigate(BASICS_PATH)
        return
      }
      if (event.key === 'Enter') {
        // A focused button or link already does its own thing on Enter.
        if (event.target instanceof HTMLElement && ['A', 'BUTTON'].includes(event.target.tagName)) {
          return
        }
        event.preventDefault()
        if (status === 'running') dispatch({ type: 'pause' })
        else if (status === 'paused') dispatch({ type: 'resume' })
        else handlers.current.start()
        return
      }
      if (status !== 'running') return
      const char = typedCharacter(keyInputFrom(event))
      if (char === null) return
      // Space would scroll the page; Firefox opens quick find on / and '.
      event.preventDefault()
      if (char !== ' ') dispatch({ type: 'key', char })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  // Save each finished game once, even under StrictMode's doubled effects.
  useEffect(() => {
    if (state.status !== 'over' || saved.current === run.current) return
    saved.current = run.current
    if (state.keys === 0 && state.hits === 0) return
    recordGame({
      id: crypto.randomUUID(),
      game: 'keyfall',
      at: Date.now(),
      score: state.score,
      level: levelFor(state.hits),
      hits: state.hits,
      fallen: state.fallen,
      keys: state.keys,
      wrong: state.wrong,
      durationMs: Math.round(state.elapsedMs),
    })
  }, [state])

  const level = levelFor(state.hits)
  const nextUnlock = KINDS.find((kind) => UNLOCKS_AT[kind] > level)
  const newBest = state.status === 'over' && state.score > bestBefore && state.score > 0

  const recentFall = state.effects.some((e) => e.kind === 'fall')
  const recentWrong = state.effects.some((e) => e.kind === 'wrong')

  const announcement =
    state.status === 'over'
      ? `Game over. ${state.score} points, level ${level}.`
      : state.status === 'paused'
        ? 'Paused.'
        : ''

  return (
    <div className="crt flex h-dvh min-h-[560px] flex-col">
      <FocusHeader
        crumbs={<span>Keyfall</span>}
        hints={['Esc to leave', state.status === 'running' ? 'Enter to pause' : 'Enter to play']}
      />
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-[920px] flex-1 flex-col gap-4 px-6 py-5 md:px-10">
        <h1 className="sr-only">Keyfall</h1>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-6">
            <span>
              <span className="block text-[9px] tracking-[0.2em] text-faint uppercase">Score</span>
              <span className="font-display text-3xl font-light text-amber tabular-nums">
                {state.score}
              </span>
            </span>
            <span>
              <span className="block text-[9px] tracking-[0.2em] text-faint uppercase">Level</span>
              <span className="font-display text-xl font-light text-parchment">{level}</span>
            </span>
            <span className="hidden sm:block">
              <span className="block text-[9px] tracking-[0.2em] text-faint uppercase">Best</span>
              <span className="font-display text-xl font-light text-muted">
                {Math.max(leaders[0]?.score ?? 0, state.score)}
              </span>
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Lives lives={state.lives} />
            {state.status === 'running' && nextUnlock !== undefined && (
              <span className="text-[9px] tracking-[0.16em] text-faint uppercase">
                {GLYPH_LABELS[nextUnlock]}s at level {UNLOCKS_AT[nextUnlock]}
              </span>
            )}
          </div>
        </div>

        <div
          ref={fieldRef}
          tabIndex={-1}
          aria-label="Keyfall play field"
          className={`panel relative min-h-[320px] flex-1 overflow-hidden transition-colors focus:outline-none ${
            recentWrong ? 'border-fault-line' : ''
          }`}
        >
          {/* The danger band: anything inside it is about to land. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%]"
            style={{
              background:
                'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-fault) 7%, transparent))',
            }}
          />
          <div aria-hidden="true">
            {state.glyphs.map((glyph) => (
              <FallingGlyph key={glyph.id} glyph={glyph} />
            ))}
            {state.effects
              .filter((effect) => effect.kind === 'hit')
              .map((effect) => (
                <span
                  key={effect.id}
                  className="keyfall-pop absolute -translate-x-1/2 font-display text-sm text-signal"
                  style={{
                    left: `${(effect.x * 100).toFixed(2)}%`,
                    top: `calc(${effect.y.toFixed(4)} * (100% - 2.75rem))`,
                    animationDuration: `${EFFECT_MS}ms`,
                  }}
                >
                  +{effect.points}
                </span>
              ))}
          </div>
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-[3px] ${
              recentFall ? 'bg-fault shadow-[0_0_18px_var(--color-fault)]' : 'bg-ink-edge'
            }`}
          />

          {state.status !== 'running' && (
            <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-ink/80 p-6 backdrop-blur-[1px]">
              {state.status === 'ready' && (
                <div className="reveal flex max-w-md flex-col items-center gap-5 text-center">
                  <h2 className="font-display text-3xl font-light tracking-[0.08em] text-amber">
                    KEYFALL
                  </h2>
                  <p className="text-[11px] leading-relaxed text-muted">
                    Type each character before it hits the ground. Three lives. Every ten hits the
                    fall gets faster and a new kind of key joins in.
                  </p>
                  <ScoreTable />
                  {weakKeys.length > 0 && (
                    <label className="flex cursor-pointer items-center gap-2.5 text-[11px] text-muted">
                      <input
                        type="checkbox"
                        checked={useWeakKeys}
                        onChange={(event) => setUseWeakKeys(event.target.checked)}
                        className="accent-[var(--color-amber)]"
                      />
                      Rain my weak keys more often
                      <span className="flex gap-1">
                        {weakKeys.map((char) => (
                          <KeyCap key={char} char={char} tone="fault" small />
                        ))}
                      </span>
                    </label>
                  )}
                  <button type="button" onClick={start} className={buttonPrimary}>
                    Start · Enter
                  </button>
                  <p className="text-[10px] text-faint sm:hidden">
                    Keyfall needs a physical keyboard.
                  </p>
                </div>
              )}

              {state.status === 'paused' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <h2 className="font-display text-2xl font-light text-parchment">Paused</h2>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'resume' })
                      fieldRef.current?.focus()
                    }}
                    className={buttonPrimary}
                  >
                    Resume · Enter
                  </button>
                </div>
              )}

              {state.status === 'over' && (
                <div className="reveal flex max-w-md flex-col items-center gap-5 text-center">
                  <h2 className="font-display text-2xl font-light text-fault">Game over</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl font-light text-amber">
                      {state.score}
                    </span>
                    <span className="text-[11px] text-faint">points</span>
                  </div>
                  {newBest && (
                    <span className="border border-signal-line px-3 py-1 text-[10px] tracking-[0.18em] text-signal uppercase">
                      New best
                    </span>
                  )}
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] sm:grid-cols-4">
                    {[
                      ['Level', level],
                      ['Hits', state.hits],
                      ['Landed', state.fallen],
                      ['Accuracy', `${(keyfallAccuracy(state) * 100).toFixed(0)}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="text-[9px] tracking-[0.18em] text-faint uppercase">
                          {label}
                        </dt>
                        <dd className="font-display text-lg font-light text-parchment">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-muted">
                    {KINDS.filter((kind) => state.pointsBy[kind] > 0).map((kind) => (
                      <span key={kind}>
                        {GLYPH_LABELS[kind]}s {state.pointsBy[kind]}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(BASICS_PATH)}
                      className={buttonQuiet}
                    >
                      Back to Basics
                    </button>
                    <button type="button" onClick={start} className={buttonPrimary}>
                      Play again · Enter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
