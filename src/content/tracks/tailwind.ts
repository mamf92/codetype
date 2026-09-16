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
      ],
    },
  ],
}
