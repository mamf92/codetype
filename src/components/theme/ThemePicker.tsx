import { THEMES } from '@/lib/themes'
import type { ThemeId } from '@/lib/themes'

/**
 * Four theme cards as a native radio group: arrow keys move the selection,
 * Tab enters and leaves the whole group in one stop, and `onChange` fires on
 * every move — not just a final click — so a caller can live-preview as the
 * selection changes rather than only on confirm.
 */
export function ThemePicker({
  value,
  onChange,
  legend,
}: {
  value: ThemeId
  onChange: (id: ThemeId) => void
  legend: string
}) {
  return (
    <fieldset className="grid w-full grid-cols-1 gap-3 border-0 p-0 sm:grid-cols-2">
      <legend className="sr-only">{legend}</legend>
      {THEMES.map((theme) => {
        const checked = value === theme.id
        return (
          <label
            key={theme.id}
            className={`panel flex cursor-pointer flex-col gap-1.5 border p-4 text-left transition-colors ${
              checked ? 'border-amber' : 'border-ink-line hover:border-ink-edge'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={theme.id}
              checked={checked}
              onChange={() => onChange(theme.id)}
              className="sr-only"
            />
            <span className="flex items-center justify-between gap-2">
              <span className="font-display text-[13px] text-parchment">{theme.label}</span>
              {checked && <span className="text-[10px] text-amber">selected</span>}
            </span>
            <span className="text-[11px] leading-relaxed text-muted">{theme.description}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
