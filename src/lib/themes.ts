/**
 * Four themes, two CRT eras. Dark is a warm amber phosphor tube; light is
 * the cool monochrome screen that came after it — the axis is temperature,
 * not brightness, which is what makes them siblings rather than one being
 * the other with the lights turned on. See `src/styles/index.css` for the
 * palette itself and `src/lib/themes.test.ts` for the contrast proof.
 */
export type ThemeId = 'dark' | 'dark-contrast' | 'light' | 'light-contrast'

export interface ThemeMeta {
  id: ThemeId
  label: string
  description: string
  scheme: 'dark' | 'light'
  /** The high-contrast sibling of the other theme in this scheme. */
  highContrast: boolean
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'dark',
    label: 'Amber phosphor',
    description:
      'The original warm tube. Amber phosphor lingers a beat after the beam passes — untyped code sits dim on purpose.',
    scheme: 'dark',
    highContrast: false,
  },
  {
    id: 'dark-contrast',
    label: 'Amber, high contrast',
    description: 'Same tube, driven harder — even the dimmest token cuts through clean.',
    scheme: 'dark',
    highContrast: true,
  },
  {
    id: 'light',
    label: 'Monochrome screen',
    description:
      'The cool screen that came after — faster phosphor, sharper edges, no lingering glow. Not paper.',
    scheme: 'light',
    highContrast: false,
  },
  {
    id: 'light-contrast',
    label: 'Screen, high contrast',
    description: 'Same screen, pushed until every token stands out sharp against the white.',
    scheme: 'light',
    highContrast: true,
  },
]

export const themeMeta = (id: ThemeId): ThemeMeta =>
  THEMES.find((theme) => theme.id === id) ?? THEMES[0]!

/** The high-contrast theme sharing this theme's scheme — dark or light. */
export const highContrastSibling = (id: ThemeId): ThemeId =>
  themeMeta(id).scheme === 'dark' ? 'dark-contrast' : 'light-contrast'

/**
 * A first guess at which of the four the system already told us to use.
 * `prefers-color-scheme` picks the pair, `prefers-contrast: more` picks the
 * high-contrast theme of that pair — for most people the highlighted card on
 * the welcome screen is already right.
 */
export function guessInitialTheme(): ThemeId {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  const light = window.matchMedia('(prefers-color-scheme: light)').matches
  const moreContrast = window.matchMedia('(prefers-contrast: more)').matches
  if (light) return moreContrast ? 'light-contrast' : 'light'
  return moreContrast ? 'dark-contrast' : 'dark'
}

/** The one place that touches the DOM: sets the attribute every theme hangs off. */
export function applyTheme(id: ThemeId, target: HTMLElement = document.documentElement): void {
  target.setAttribute('data-theme', id)
}
