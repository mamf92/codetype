import type { Track } from '../schema'

export const tailwindCore: Track = {
  id: 'tw-core',
  kind: 'course',
  language: 'tailwind',
  title: 'Tailwind CSS Core Patterns',
  blurb:
    'The utility classes you reach for every day: responsive prefixes, state variants, flex and grid layout, the spacing scale, and dark mode.',
  level: 'working',
  tags: ['tailwind', 'css', 'utility-classes', 'responsive', 'layout'],
  freshnessDays: 21,
  lessons: [
    {
      id: 'tw-core-responsive',
      title: 'Responsive breakpoint prefixes',
      summary: 'Prefix utilities with sm:, md:, lg: and beyond to change styles per viewport.',
      concept:
        'Tailwind breakpoints are mobile-first: an unprefixed utility applies at every size, and a prefixed one only takes over at that breakpoint and up. Stacking prefixes on the same property is how you build responsive layouts without writing a single media query.',
      sourceUrl: 'https://tailwindcss.com/docs/responsive-design',
      drills: [
        {
          id: 'tw-core-responsive-1',
          label: 'grid columns by breakpoint',
          code: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card />
</div>`,
          grammar: 'tsx',
          note: 'Column count grows in three steps as the viewport widens.',
        },
        {
          id: 'tw-core-responsive-2',
          label: 'stack to row navigation',
          code: `<nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
  <a href="/docs">Docs</a>
</nav>`,
          grammar: 'tsx',
          note: 'Same flex utility, but the axis itself flips at md instead of the column count.',
        },
        {
          id: 'tw-core-responsive-3',
          label: 'type scale by breakpoint',
          code: `<h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold">
  Ship it
</h1>`,
          grammar: 'tsx',
          note: 'Here the responsive prefix scales font size rather than layout.',
        },
        {
          id: 'tw-core-responsive-4',
          label: 'hide on small screens',
          code: `<aside className="hidden lg:block w-64 shrink-0">
  <Sidebar />
</aside>`,
          grammar: 'tsx',
          note: 'hidden plus a breakpoint prefix toggles display instead of resizing anything.',
        },
        {
          id: 'tw-core-responsive-5',
          label: 'fractional widths',
          code: `<img
  src={src}
  className="w-full sm:w-1/2 lg:w-1/3 rounded-lg object-cover"
/>`,
          grammar: 'tsx',
          note: 'The same idea applied to width fractions, tightening the image as space opens up.',
        },
        {
          id: 'tw-core-responsive-capstone',
          kind: 'capstone',
          label: 'a pricing page that reflows four times',
          brief:
            'A marketing section where every responsive decision is made in class names instead of a media query. Padding, type scale, column count, visibility and flex direction each change at a different breakpoint, and none of them is written twice.',
          code: `export function Pricing({ plans }: { plans: Plan[] }) {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <h2 className="text-2xl font-bold sm:text-3xl lg:text-5xl">Pick a plan</h2>
      <p className="mt-2 max-w-prose text-sm sm:text-base lg:text-lg">
        Every plan includes the full catalogue.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-xl border p-4 sm:p-6">
            <h3 className="text-lg lg:text-xl">{plan.name}</h3>
            <p className="text-3xl lg:text-4xl">{plan.price}</p>
          </article>
        ))}
      </div>
      <aside className="hidden lg:block lg:w-72">
        <FaqLinks />
      </aside>
      <nav className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
        <a href="/docs">Docs</a>
        <a href="/contact">Talk to us</a>
      </nav>
    </section>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'tw-core-state',
      title: 'State variants',
      summary:
        'hover:, focus-visible:, disabled: and friends style an element based on its own interaction state.',
      concept:
        'State variants prefix a utility so it only applies during that pseudo-state, and they compose with each other and with breakpoints in a fixed left-to-right order. Reaching for focus-visible: instead of focus: keeps keyboard-only outlines without punishing mouse users.',
      sourceUrl: 'https://tailwindcss.com/docs/hover-focus-and-other-states',
      drills: [
        {
          id: 'tw-core-state-1',
          label: 'hover and focus-visible on a button',
          code: `<button className="bg-blue-600 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400">
  Save
</button>`,
          grammar: 'tsx',
          note: 'Two different state variants stacked on one element.',
        },
        {
          id: 'tw-core-state-2',
          label: 'disabled input styling',
          code: `<input
  disabled
  className="border disabled:cursor-not-allowed disabled:opacity-50"
/>`,
          grammar: 'tsx',
          note: 'disabled: reads the native disabled attribute instead of a pointer or keyboard event.',
        },
        {
          id: 'tw-core-state-3',
          label: 'active state on press',
          code: `<button className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800">
  Confirm
</button>`,
          grammar: 'tsx',
          note: 'active: adds a third shade for the instant the button is actually pressed.',
        },
        {
          id: 'tw-core-state-4',
          label: 'group-hover on a child',
          code: `<div className="group rounded-lg border p-4">
  <span className="text-slate-500 group-hover:text-slate-900">
    Preview
  </span>
</div>`,
          grammar: 'tsx',
          note: 'group-hover: reacts to hovering the ancestor marked group, not the span itself.',
        },
        {
          id: 'tw-core-state-5',
          label: 'focus ring on a link',
          code: `<a
  href="/settings"
  className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
>
  Settings
</a>`,
          grammar: 'tsx',
          note: 'Same focus-visible: idea as the button, this time driving an outline instead of a ring.',
        },
        {
          id: 'tw-core-state-capstone',
          kind: 'capstone',
          label: 'an invite row in every interaction state',
          brief:
            'One small form that answers for hover, focus, press, disabled and a parent hover all at once. The label reacts to the form being hovered rather than itself, the input and the button both read the same disabled flag, and nothing uses plain focus where focus-visible belongs.',
          code: `export function InviteRow({ disabled }: { disabled: boolean }) {
  return (
    <form className="group rounded-lg border border-slate-200 p-4 hover:border-slate-400">
      <label className="block text-sm text-slate-500 group-hover:text-slate-900">
        Teammate email
      </label>
      <input
        type="email"
        disabled={disabled}
        className="w-full border px-3 py-2 focus-visible:ring-2 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 active:bg-blue-800"
      >
        Send invite
      </button>
      <a
        href="/team"
        className="ml-3 text-blue-600 hover:underline focus-visible:outline-2"
      >
        Manage team
      </a>
    </form>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'tw-core-layout',
      title: 'Flex vs grid layout',
      summary: 'flex handles one-dimensional alignment; grid handles two-dimensional placement.',
      concept:
        'Flex utilities distribute and align items along a single axis you control with flex-direction, while grid utilities lay items into an explicit row-and-column template. Knowing which model a layout actually needs saves you from fighting the wrong one.',
      sourceUrl: 'https://tailwindcss.com/docs/flex',
      drills: [
        {
          id: 'tw-core-layout-1',
          label: 'flex row with justify-between',
          code: `<header className="flex items-center justify-between px-6 py-4">
  <Logo />
  <UserMenu />
</header>`,
          grammar: 'tsx',
          note: 'One axis, two items pushed to opposite ends.',
        },
        {
          id: 'tw-core-layout-2',
          label: 'grid with fixed columns',
          code: `<div className="grid grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>`,
          grammar: 'tsx',
          note: "grid-cols-3 defines the two-dimensional template flex alone can't express.",
        },
        {
          id: 'tw-core-layout-3',
          label: 'flexible children with flex-1',
          code: `<div className="flex gap-4">
  <aside className="w-64 shrink-0">Nav</aside>
  <main className="flex-1">Content</main>
</div>`,
          grammar: 'tsx',
          note: 'flex-1 lets one child absorb remaining space while a sibling stays fixed.',
        },
        {
          id: 'tw-core-layout-4',
          label: 'wrapping flex row',
          code: `<div className="flex flex-wrap gap-2">
  {tags.map((tag) => (
    <Badge key={tag} label={tag} />
  ))}
</div>`,
          grammar: 'tsx',
          note: 'flex-wrap turns the same single axis into multiple lines instead of a grid.',
        },
        {
          id: 'tw-core-layout-5',
          label: 'centering with grid',
          code: `<div className="grid h-screen place-items-center">
  <Spinner />
</div>`,
          grammar: 'tsx',
          note: 'place-items-center centers on both axes at once, something flex needs two properties for.',
        },
        {
          id: 'tw-core-layout-capstone',
          kind: 'capstone',
          label: 'an app shell using both models',
          brief:
            'A whole application frame that picks the right layout model four times over: flex for the header bar and the sidebar-plus-main split, flex-wrap for a tag row that is one axis after all, and grid for both the card template and the two-axis centring of an empty state.',
          code: `export function AppShell({ tags, empty }: { tags: string[]; empty: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <UserMenu />
      </header>
      <div className="flex flex-1 gap-6 px-6">
        <aside className="w-60 shrink-0">
          <Nav />
        </aside>
        <main className="flex-1">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </div>
          {empty ? (
            <div className="grid h-64 place-items-center">
              <Spinner />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card />
              <Card />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'tw-core-spacing',
      title: 'Spacing and sizing scale',
      summary:
        'Padding, margin, gap and width all share one numeric scale, so 4 always means the same 1rem step.',
      concept:
        "Tailwind's spacing scale is a single set of numbers reused across padding, margin, gap and sizing utilities, so learning that 4 is 1rem and 2 is 0.5rem pays off everywhere at once. Directional and axis variants like px, py and gap-x apply that scale unevenly without introducing new numbers.",
      sourceUrl: 'https://tailwindcss.com/docs/padding',
      drills: [
        {
          id: 'tw-core-spacing-1',
          label: 'padding on all sides',
          code: `<div className="p-4 rounded-lg border">
  <p>Card body</p>
</div>`,
          grammar: 'tsx',
          note: 'p-4 applies one scale step to every side at once.',
        },
        {
          id: 'tw-core-spacing-2',
          label: 'axis padding',
          code: `<button className="px-6 py-3 rounded-md bg-slate-900 text-white">
  Continue
</button>`,
          grammar: 'tsx',
          note: 'px and py split the same scale across the horizontal and vertical axes.',
        },
        {
          id: 'tw-core-spacing-3',
          label: 'gap between grid cells',
          code: `<div className="grid grid-cols-2 gap-x-6 gap-y-2">
  <Field />
  <Field />
</div>`,
          grammar: 'tsx',
          note: 'gap-x and gap-y apply different scale steps per axis instead of one shared gap.',
        },
        {
          id: 'tw-core-spacing-4',
          label: 'stacking children with space-y',
          code: `<form className="space-y-4">
  <Input />
  <Input />
  <Button>Submit</Button>
</form>`,
          grammar: 'tsx',
          note: 'space-y-4 inserts margin between siblings without wrapping each one.',
        },
        {
          id: 'tw-core-spacing-5',
          label: 'capping width with max-w',
          code: `<article className="max-w-2xl mx-auto px-4">
  <p>Body copy</p>
</article>`,
          grammar: 'tsx',
          note: 'max-w reuses a named scale to cap width, then mx-auto centers what is left.',
        },
        {
          id: 'tw-core-spacing-capstone',
          kind: 'capstone',
          label: 'a settings card on one scale',
          brief:
            'A settings form where every gap, pad and margin comes from the same numeric scale, and no two of them are invented. Note how space-y handles the vertical rhythm between siblings while gap-x and gap-y take the grid, and max-w plus mx-auto cap the whole thing.',
          code: `export function SettingsCard() {
  return (
    <article className="mx-auto max-w-2xl rounded-xl border p-6">
      <header className="mb-6 space-y-1">
        <h2 className="text-lg">Notifications</h2>
        <p className="text-sm text-slate-500">How often we email you.</p>
      </header>
      <form className="space-y-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Field label="Digest" />
          <Field label="Mentions" />
        </div>
        <fieldset className="mt-2 px-4 py-3">
          <legend className="px-1 text-sm">Quiet hours</legend>
          <div className="flex gap-3 pt-2">
            <Input name="from" />
            <Input name="to" />
          </div>
        </fieldset>
        <footer className="flex justify-end gap-3 border-t pt-4">
          <button className="px-4 py-2">Cancel</button>
          <button className="px-6 py-2">Save</button>
        </footer>
      </form>
    </article>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'tw-core-dark',
      title: 'Dark mode variants',
      summary: 'Prefix a utility with dark: to swap it in only when dark mode is active.',
      concept:
        'The dark: variant pairs a light-mode utility with a dark-mode override on the same element, and it composes with other variants like hover: in a fixed order. Whether it activates by OS preference or a class toggle depends on how dark mode is configured, not on how you write the variant.',
      sourceUrl: 'https://tailwindcss.com/docs/dark-mode',
      drills: [
        {
          id: 'tw-core-dark-1',
          label: 'background and text swap',
          code: `<div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
  <p>Card</p>
</div>`,
          grammar: 'tsx',
          note: 'Two properties, each given its own light and dark value.',
        },
        {
          id: 'tw-core-dark-2',
          label: 'border color swap',
          code: `<div className="rounded-lg border border-slate-200 dark:border-slate-700">
  <p>Panel</p>
</div>`,
          grammar: 'tsx',
          note: 'Same pairing idea applied to border-color instead of background.',
        },
        {
          id: 'tw-core-dark-3',
          label: 'dark variant combined with hover',
          code: `<button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
  Toggle
</button>`,
          grammar: 'tsx',
          note: 'dark:hover: chains two variants so hover gets its own dark-mode color.',
        },
        {
          id: 'tw-core-dark-4',
          label: 'muted text in both modes',
          code: `<span className="text-slate-500 dark:text-slate-400">
  Last updated 2 hours ago
</span>`,
          grammar: 'tsx',
          note: 'A lighter pairing where only the shade, not the hue, changes.',
        },
        {
          id: 'tw-core-dark-5',
          label: 'ring color swap on focus',
          code: `<input
  className="focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
/>`,
          grammar: 'tsx',
          note: 'The pairing extends to a focus-visible ring color, not just static backgrounds and borders.',
        },
        {
          id: 'tw-core-dark-capstone',
          kind: 'capstone',
          label: 'a notification card in two schemes',
          brief:
            'A card that has to read in both schemes, so every colour decision is made twice on the same element. Background, border, heading, muted text, a conditional badge, a hover state and a focus ring each get their dark counterpart, and the variants stack in a fixed order.',
          code: `export function NotificationCard({ unread }: { unread: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-slate-900 dark:text-slate-100">Build finished</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        main passed in 3m 12s
      </p>
      <span
        className={
          unread
            ? 'bg-blue-100 px-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            : 'bg-slate-100 px-2 text-slate-600 dark:bg-slate-800'
        }
      >
        {unread ? 'New' : 'Seen'}
      </span>
      <div className="mt-4 flex gap-2">
        <button className="bg-slate-100 px-3 py-1 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
          Mute
        </button>
        <a
          href="/builds"
          className="px-3 py-1 focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          View
        </a>
      </div>
    </article>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'tw-core-review',
      kind: 'review',
      title: 'Review: a responsive dashboard',
      summary:
        'One dashboard built from breakpoints, state variants, both layout models, the spacing scale and dark mode.',
      concept:
        'No new utilities here. This is the shell, the card and the controls of a metrics dashboard, written the way the three components would really be split. Every lesson in this track turns up somewhere in them, and most turn up in all three.',
      covers: [
        'tw-core-responsive',
        'tw-core-state',
        'tw-core-layout',
        'tw-core-spacing',
        'tw-core-dark',
      ],
      drills: [
        {
          id: 'tw-core-review-1',
          kind: 'capstone',
          label: 'DashboardShell.tsx',
          brief:
            'The frame. Flex for the vertical page and the sidebar split, grid for the card template, breakpoint prefixes deciding when the nav and the sidebar appear at all, and a dark background paired with the light one on the outermost element.',
          code: `export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <header className="flex items-center justify-between px-4 py-3 sm:px-8">
        <Logo />
        <nav className="hidden gap-6 md:flex md:items-center">
          <a href="/runs">Runs</a>
          <a href="/keys">Keys</a>
        </nav>
      </header>
      <div className="flex flex-1 gap-6 px-4 sm:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <Sidebar />
        </aside>
        <main className="flex-1 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}`,
          grammar: 'tsx',
        },
        {
          id: 'tw-core-review-2',
          kind: 'capstone',
          label: 'MetricCard.tsx',
          brief:
            'One cell of that grid. The spacing scale does the internal rhythm with space-y, mb, gap and pt; the type scale steps up at a breakpoint; and every colour that would vanish on a dark background is paired with a dark: counterpart.',
          code: `interface MetricProps {
  label: string
  value: string
  trend: string
}

export function MetricCard({ label, value, trend }: MetricProps) {
  return (
    <article className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
      <header className="mb-3 space-y-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-3xl sm:text-4xl">{value}</p>
      </header>
      <div className="flex items-baseline justify-between gap-4 border-t pt-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {trend} vs last week
        </span>
        <a
          href="/runs"
          className="px-2 py-1 hover:underline focus-visible:ring-2 dark:text-slate-200"
        >
          Details
        </a>
      </div>
    </article>
  )
}`,
          grammar: 'tsx',
        },
        {
          id: 'tw-core-review-3',
          kind: 'capstone',
          label: 'RangeControls.tsx',
          brief:
            'The interactive strip above the grid. It stacks on a phone and turns into a row at sm, its label answers to the form being hovered, the select and the button both read a busy flag, and each of those states has its own dark-mode colour.',
          code: `export function RangeControls({ busy }: { busy: boolean }) {
  return (
    <form className="group mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <label className="text-sm text-slate-500 group-hover:text-slate-900 dark:text-slate-400">
        Range
      </label>
      <select
        disabled={busy}
        className="w-full px-3 py-2 focus-visible:ring-2 disabled:opacity-50 sm:w-48 dark:bg-slate-900"
      >
        <option>Last 7 days</option>
        <option>Last 30 days</option>
      </select>
      <button
        disabled={busy}
        className="px-4 py-2 hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed dark:hover:bg-slate-800"
      >
        Apply
      </button>
    </form>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
  ],
}

export const tailwindV4: Track = {
  id: 'tw-v4',
  kind: 'dispatch',
  language: 'tailwind',
  title: 'Tailwind v4: CSS-First Config',
  blurb:
    'Tailwind CSS v4 moves configuration into CSS itself: @theme, @utility, and a single @import entry point replace the old JS config file and the three @tailwind directives.',
  level: 'frontier',
  tags: ['tailwind', 'css', 'v4', 'theme', 'dispatch'],
  freshnessDays: 10,
  publishedAt: '2025-01-22',
  sourceUrl: 'https://tailwindcss.com/blog/tailwindcss-v4',
  lessons: [
    {
      id: 'tw-v4-theme',
      title: 'CSS-first theme configuration',
      summary:
        '@theme defines design tokens as CSS custom properties, replacing the JS tailwind.config theme object.',
      concept:
        'In Tailwind v4, theme values live inside an @theme block in your CSS as custom properties, namespaced by kind (--color-*, --font-*, --breakpoint-*), and Tailwind generates matching utilities and variants from them automatically. Because they are plain CSS variables, you can also reference them directly wherever a value is expected.',
      sourceUrl: 'https://tailwindcss.com/docs/theme',
      drills: [
        {
          id: 'tw-v4-theme-1',
          label: 'custom color token',
          code: `@theme {
  --color-brand: oklch(64% 0.19 260);
}`,
          grammar: 'css',
          note: 'A --color-* variable in @theme becomes a bg-brand / text-brand utility automatically.',
        },
        {
          id: 'tw-v4-theme-2',
          label: 'custom breakpoint token',
          code: `@theme {
  --breakpoint-3xl: 120rem;
}`,
          grammar: 'css',
          note: 'Same @theme block, but a --breakpoint-* namespace adds a new 3xl: variant instead.',
        },
        {
          id: 'tw-v4-theme-3',
          label: 'custom font token',
          code: `@theme {
  --font-display: "Inter", sans-serif;
}`,
          grammar: 'css',
          note: 'The --font-* namespace generates a font-display utility instead of a color or breakpoint.',
        },
        {
          id: 'tw-v4-theme-4',
          label: 'consuming a theme variable directly',
          code: `<div className="w-(--sidebar-width) bg-(--color-brand)">
  <Nav />
</div>`,
          grammar: 'tsx',
          note: 'Because theme tokens are real CSS variables, bg-(--color-brand) reads one directly instead of going through a generated class name.',
        },
        {
          id: 'tw-v4-theme-capstone',
          kind: 'capstone',
          label: 'a full token block for a product',
          brief:
            'The top of a real v4 stylesheet: colours, fonts, a breakpoint, a spacing step and a radius, all declared as custom properties in one @theme block. Each namespace generates its own family of utilities, and because they are plain CSS variables the component layer below reads them with var().',
          code: `@theme {
  --color-brand: oklch(64% 0.19 260);
  --color-brand-soft: oklch(78% 0.12 260);
  --color-ink: oklch(18% 0.01 260);
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --breakpoint-3xl: 120rem;
  --spacing-gutter: 1.25rem;
  --radius-panel: 0.75rem;
}

@layer components {
  .panel {
    background: var(--color-ink);
    border-radius: var(--radius-panel);
    padding: var(--spacing-gutter);
    font-family: var(--font-display);
  }
}

@media (min-width: 120rem) {
  .panel {
    padding: calc(var(--spacing-gutter) * 2);
  }
}`,
          grammar: 'css',
        },
      ],
    },
    {
      id: 'tw-v4-utility',
      title: '@utility for custom utilities',
      summary:
        '@utility declares a custom utility in CSS so it gets variant and ordering support like a built-in class.',
      concept:
        'The @utility directive is where custom, one-off utility classes live in v4: whatever you write becomes a first-class utility that composes with variants such as hover: and lg:. Ending the name in a trailing -* opts it into functional matching, so tab-2, tab-4 and tab-8 can share one definition via --value().',
      sourceUrl: 'https://tailwindcss.com/docs/functions-and-directives',
      drills: [
        {
          id: 'tw-v4-utility-1',
          label: 'single-declaration utility',
          code: `@utility content-auto {
  content-visibility: auto;
}`,
          grammar: 'css',
          note: 'The simplest form: one fixed class name mapped to one declaration.',
        },
        {
          id: 'tw-v4-utility-2',
          label: 'multi-declaration utility',
          code: `@utility card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}`,
          grammar: 'css',
          note: 'Same directive, but the utility now bundles several declarations behind one class.',
        },
        {
          id: 'tw-v4-utility-3',
          label: 'functional utility with a wildcard',
          code: `@utility tab-* {
  tab-size: --value(integer);
}`,
          grammar: 'css',
          note: 'The trailing -* plus --value() turns one definition into a whole family like tab-2, tab-4, tab-8.',
        },
        {
          id: 'tw-v4-utility-4',
          label: 'using the custom utility in markup',
          code: `<div className="card tab-4 hover:shadow-lg">
  <Code />
</div>`,
          grammar: 'tsx',
          note: 'Once declared, the custom utility takes hover: and other variants exactly like a built-in class.',
        },
        {
          id: 'tw-v4-utility-capstone',
          kind: 'capstone',
          label: 'a small utility layer of your own',
          brief:
            'Five custom utilities in the shapes v4 actually supports: a single declaration, a multi-declaration bundle, an integer-matched family, a keyword-matched family, and two that read straight from the theme namespaces. Every one of them takes variants like hover: and lg: for free.',
          code: `@utility content-auto {
  content-visibility: auto;
}

@utility panel {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

@utility tab-* {
  tab-size: --value(integer);
}

@utility scrollbar-* {
  scrollbar-width: --value(thin, auto, none);
}

@utility stack-* {
  display: flex;
  flex-direction: column;
  gap: --value(--spacing-*);
}

@utility ink-* {
  color: --value(--color-*);
}`,
          grammar: 'css',
        },
      ],
    },
    {
      id: 'tw-v4-import',
      title: 'The @import entry point',
      summary:
        '@import "tailwindcss" replaces the three separate @tailwind base/components/utilities directives.',
      concept:
        'Tailwind v4\'s CSS entry point collapses to a single @import "tailwindcss"; statement, and related directives like @source and the source() modifier give explicit control over which files Tailwind scans for classes when automatic detection is not enough. This is plain CSS import syntax, so it plays by the same rules as any other CSS @import.',
      sourceUrl: 'https://tailwindcss.com/docs/functions-and-directives',
      drills: [
        {
          id: 'tw-v4-import-1',
          label: 'the v4 entry point',
          code: `@import "tailwindcss";`,
          grammar: 'css',
          note: 'One line stands in for the old @tailwind base; @tailwind components; @tailwind utilities; trio.',
        },
        {
          id: 'tw-v4-import-2',
          label: 'disabling automatic source detection',
          code: `@import "tailwindcss" source(none);`,
          grammar: 'css',
          note: "The same import statement, now with source(none) to opt out of Tailwind's automatic file scanning.",
        },
        {
          id: 'tw-v4-import-3',
          label: 'registering an extra source path',
          code: `@source "../node_modules/@acme/ui-lib";`,
          grammar: 'css',
          note: '@source adds one specific path to scan, complementing rather than replacing the @import line.',
        },
        {
          id: 'tw-v4-import-4',
          label: 'import followed by theme',
          code: `@import "tailwindcss";

@theme {
  --color-brand: oklch(64% 0.19 260);
}`,
          grammar: 'css',
          note: 'In practice the entry point and the @theme block sit together at the top of the same file.',
        },
        {
          id: 'tw-v4-import-capstone',
          kind: 'capstone',
          label: 'the whole entry point',
          brief:
            'One stylesheet doing everything the old JS config used to: a single import in place of three directives, explicit source paths for files Tailwind cannot find by itself, one excluded, and then the theme, a custom utility and a base layer stacked underneath it.',
          code: `@import "tailwindcss";
@import "./fonts.css" layer(base);

@source "../packages/ui/src";
@source "../../node_modules/@acme/widgets";
@source not "../packages/ui/src/legacy";

@theme {
  --color-brand: oklch(64% 0.19 260);
  --font-display: "Space Grotesk", sans-serif;
}

@utility panel {
  border-radius: var(--radius-lg);
  background: var(--color-brand);
}

@layer base {
  body {
    margin: 0;
    font-family: var(--font-display);
  }
}`,
          grammar: 'css',
        },
      ],
    },
    {
      id: 'tw-v4-review',
      kind: 'review',
      title: 'Review: one v4 stylesheet, end to end',
      summary: 'The three v4 ideas as the three parts of a single real stylesheet.',
      concept:
        "A project's whole CSS entry point, in the order you would actually write it: the import and the sources at the top, the theme tokens under it, and the custom utility layer last. Nothing here is new — it is the same three directives from this dispatch, finally sitting next to each other.",
      covers: ['tw-v4-theme', 'tw-v4-utility', 'tw-v4-import'],
      drills: [
        {
          id: 'tw-v4-review-1',
          kind: 'capstone',
          label: 'app.css, the top of the file',
          brief:
            'Where the stylesheet starts. One import replaces the three old directives, a second pulls a reset into the base layer, explicit sources cover the files Tailwind cannot discover on its own, and one path is deliberately excluded.',
          code: `@import "tailwindcss";
@import "./reset.css" layer(base);

@source "../src";
@source "../../packages/ui/src";
@source not "../src/legacy";

@plugin "@tailwindcss/typography";

@custom-variant crt (&:where([data-theme="crt"] *));

@layer base {
  html {
    color-scheme: light dark;
  }
  body {
    margin: 0;
    min-height: 100dvh;
  }
}`,
          grammar: 'css',
        },
        {
          id: 'tw-v4-review-2',
          kind: 'capstone',
          label: 'app.css, the tokens',
          brief:
            'The design system, as custom properties rather than a JavaScript object. Five namespaces generate five families of utilities, an inline alias points one token at another, and the dark scheme overrides two of them with ordinary CSS because they are ordinary CSS.',
          code: `@theme {
  --color-surface: oklch(98% 0.01 260);
  --color-surface-sunk: oklch(94% 0.01 260);
  --color-line: oklch(88% 0.01 260);
  --color-ink: oklch(20% 0.02 260);
  --color-brand: oklch(64% 0.19 260);
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --breakpoint-3xl: 120rem;
  --radius-panel: 0.75rem;
  --shadow-panel: 0 20px 60px -30px oklch(20% 0.02 260 / 0.5);
}

@theme inline {
  --color-accent: var(--color-brand);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: oklch(18% 0.01 260);
    --color-ink: oklch(96% 0.01 260);
  }
}`,
          grammar: 'css',
        },
        {
          id: 'tw-v4-review-3',
          kind: 'capstone',
          label: 'app.css, the utilities',
          brief:
            'The last third of the file, where the tokens above become classes of your own. A plain bundle, two functional families matched on a theme namespace and on an integer, and a components layer underneath that still reads the same variables.',
          code: `@utility panel {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
}

@utility stack-* {
  display: flex;
  flex-direction: column;
  gap: --value(--spacing-*);
}

@utility ink-* {
  color: --value(--color-*);
}

@utility tab-* {
  tab-size: --value(integer);
}

@layer components {
  .drill-surface {
    font-family: var(--font-mono);
    tab-size: 2;
  }
  .drill-surface:focus-visible {
    outline: 2px solid var(--color-brand);
  }
}`,
          grammar: 'css',
        },
      ],
    },
  ],
}
