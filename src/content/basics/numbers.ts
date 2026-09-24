import type { KeyTrack } from './schema'

export const numberRow: KeyTrack = {
  id: 'number-row',
  title: 'Number row',
  blurb:
    "The row most typists never learned to reach without looking. Each hand's half first, then across the middle, then the numbers code is actually full of.",
  focus: '0123456789',
  stages: [
    {
      id: 'number-row-reps',
      kind: 'reps',
      summary: 'Each half of the row on its own, then the reach across the middle.',
      grammar: 'plain',
      passages: [
        `111 222 333 444 555
123 234 345 12345
543 432 321 54321
151 242 353 414 525`,
        `666 777 888 999 000
678 789 890 67890
098 987 876 09876
606 717 828 939 060`,
        `565 656 474 747 383
561 652 743 834 925
1029 3847 5601 7392
50 60 40 70 30 80 20 90`,
      ],
    },
    {
      id: 'number-row-patterns',
      kind: 'patterns',
      summary: 'Sizes, versions, dates, times and addresses — numbers in their usual clothes.',
      grammar: 'plain',
      passages: [
        `2 4 8 16 32 64 128 256
512 1024 2048 4096 8192
100 250 500 750 1000
0.25 0.5 0.75 1.5 2.25`,
        `v1.0.0 v2.3.14 v18.20.4
2026-09-24 1999-12-31
09:45 13:07 23:59:59
1970-01-01T00:00:00`,
        `3000 5173 8080 5432 6379
127.0.0.1 192.168.1.254
10.0.0.42:8443 0.0.0.0/0
172.16.254.1 255.255.0.0`,
      ],
    },
    {
      id: 'number-row-code',
      kind: 'code',
      summary: 'Timeouts, status codes, colours and ratios, inside real lines.',
      grammar: 'typescript',
      passages: [
        `const timeout = 30_000
const retries = 3
const ratio = 16 / 9
setTimeout(flush, 250)
const maxAge = 60 * 60 * 24 * 7`,
        `const codes = [200, 201, 204, 301, 404, 500]
const grid = { cols: 12, gap: 24 }
const page = xs.slice(40, 60)
const id = String(7).padStart(8, '0')`,
        `const red = 0xff0000
const epsilon = 1e-9
const flags = 0b1010_0110
const green = 'rgba(34, 197, 94, 0.8)'
const port = Number(env.PORT ?? 8080)`,
      ],
    },
    {
      id: 'number-row-load',
      kind: 'load',
      summary: 'Fixtures and tables: nearly every other character is a digit.',
      grammar: 'typescript',
      passages: [
        `const matrix = [
  [1, 0, 0, 12],
  [0, 1, 0, 48],
  [0, 0, 1, 96],
  [0, 0, 0, 1],
]
const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1]
const scale = [0.5, 0.75, 1, 1.25, 1.5, 2]`,
        `const spacing = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64]
const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 }
const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
const easing = [0.2, 0.8, 0.3, 1]`,
        `const readings = [
  { at: 1727136000, temp: 18.4, rh: 62 },
  { at: 1727139600, temp: 17.9, rh: 65 },
  { at: 1727143200, temp: 16.7, rh: 71 },
  { at: 1727146800, temp: 15.2, rh: 78 },
]`,
      ],
    },
  ],
}
