import { describe, expect, it } from 'vitest'

/*
 * The type, tracking and spacing scale lives in `src/styles/index.css`
 * (`--text-*`, `--tracking-*`, `--spacing-page|grid|section`). This keeps
 * the components on it: a literal size or letter-spacing added in one place
 * is exactly how the app drifted into eight sizes and nine trackings before.
 *
 * Sizes in `em` are allowed: they scale with their parent, like the line-break
 * marker sized against the passage it sits in.
 *
 * `src/content/` is left out on purpose: drill passages are code people
 * type, and a Tailwind class inside a passage is content, not styling.
 */

// Every component and route, read as text at test time.
const FILES = import.meta.glob<string>(['/src/**/*.tsx', '!/src/content/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const offences = (pattern: RegExp): string[] =>
  Object.entries(FILES).flatMap(([file, text]) =>
    text
      .split('\n')
      .flatMap((line, i) => (pattern.test(line) ? [`${file}:${i + 1}  ${line.trim()}`] : [])),
  )

it('reads the components it checks', () => {
  expect(Object.keys(FILES).length).toBeGreaterThan(20)
})

describe('the type and spacing scale', () => {
  it('sets no text size outside the scale', () => {
    expect(offences(/\btext-(\[\d+(\.\d+)?(px|rem)\]|xs(?![\w-]))/)).toEqual([])
  })

  it('sets no letter-spacing outside the scale', () => {
    expect(offences(/\btracking-\[/)).toEqual([])
  })
})
