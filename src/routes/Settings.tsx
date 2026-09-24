import { PageHead } from '@/components/layout/Shell'
import { Panel, SectionLabel } from '@/components/ui/primitives'
import { ThemePicker } from '@/components/theme/ThemePicker'
import { clearHistory, setTheme, useProgress } from '@/store/useProgress'

export default function Settings() {
  const progress = useProgress()
  const theme = progress.theme ?? 'dark'
  const drills = progress.sessions.filter((s) => s.kind === 'drill').length
  const practice = progress.sessions.length - drills
  const games = progress.games.length
  const nothing = progress.sessions.length === 0 && games === 0

  const onClearHistory = (): void => {
    if (
      !window.confirm('Clear every recorded drill, practice run and game? This cannot be undone.')
    )
      return
    clearHistory()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Settings"
        blurb="The theme picker you saw on your first visit — the promise that you could change it later, kept."
      />

      <div className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.05s' }}>
        <SectionLabel>Theme</SectionLabel>
        <ThemePicker value={theme} onChange={setTheme} legend="Theme" />
      </div>

      <div className="reveal flex flex-col gap-3.5" style={{ animationDelay: '0.12s' }}>
        <SectionLabel>Data</SectionLabel>
        <Panel accent="fault" className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-lg text-[11px] leading-relaxed text-muted">
            Progress lives only in this browser's local storage — {drills}{' '}
            {drills === 1 ? 'drill' : 'drills'}, {practice} practice{' '}
            {practice === 1 ? 'run' : 'runs'} and {games} {games === 1 ? 'game' : 'games'} so far.
            Clearing it is permanent and cannot be undone.
          </p>
          <button
            type="button"
            onClick={onClearHistory}
            disabled={nothing}
            className="border border-fault-line px-4 py-2 text-[10px] tracking-[0.18em] text-fault uppercase hover:border-fault disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear history
          </button>
        </Panel>
      </div>
    </div>
  )
}
