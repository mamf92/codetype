import { SYMBOL_KEYS, type KeyTrack } from './schema'

export const javascriptSymbols: KeyTrack = {
  id: 'javascript-symbols',
  title: 'JavaScript & TypeScript symbols',
  blurb:
    'Brackets, arrows, optional chains, template literals and generics: the punctuation that makes up half of every line of JavaScript and TypeScript.',
  focus: SYMBOL_KEYS,
  stages: [
    {
      id: 'javascript-symbols-reps',
      kind: 'reps',
      summary: 'Pairs, operators and quotes on their own, until they stop being chords.',
      grammar: 'plain',
      passages: [
        `() () () [] [] [] {} {} {}
(( )) [[ ]] {{ }} <> <>
([]) {()} [{}] ({}) <[]>`,
        `=> => => === === !== !==
&& && || || ?? ?? ?. ?.
+= -= *= /= %= **= ??=`,
        `'' '' "" "" \`\` \`\` \${} \${}
'a' "b" \`c\` \`\${d}\` \`e\${f}\`
... ... ; ; : : , , . .`,
      ],
    },
    {
      id: 'javascript-symbols-patterns',
      kind: 'patterns',
      summary: 'The shapes they come in: calls, arrows, access chains and type syntax.',
      grammar: 'plain',
      passages: [
        `() => {}  (a) => a  (a, b) => a + b
fn()  fn(a)  fn(a, b)  fn(...args)
x => x * 2  async () => {}  () => ({})`,
        `a.b  a?.b  a[0]  a?.[0]  a.b()  a?.b?.()
obj['key']  obj[key]  obj.key!  arr.at(-1)
{ a }  { ...a }  { a, ...rest }  [a, ...rest]`,
        `Array<T>  Map<K, V>  Record<string, T>
T | null  A & B  keyof T  T[K]  T[]
<T,>(x: T) => x  (x?: number) => void`,
      ],
    },
    {
      id: 'javascript-symbols-code',
      kind: 'code',
      summary: 'Ordinary lines of TypeScript, chosen for how much punctuation they carry.',
      grammar: 'typescript',
      passages: [
        `const total = items.reduce((sum, { price }) => sum + price, 0)
const label = count === 1 ? 'item' : 'items'
if (!user?.email) throw new Error('missing email')`,
        `const url = \`\${base}/users/\${id}?page=\${page}\`
const headers = { 'Content-Type': 'application/json' }
const res = await fetch(url, { method: 'POST', headers })`,
        `type Handler<T> = (event: T) => void | Promise<void>
const cache = new Map<string, number[]>()
const ready = (a && b) || !c
export { type User, parse } from './user'`,
      ],
    },
    {
      id: 'javascript-symbols-load',
      kind: 'load',
      summary: 'Generics, JSX and spreads stacked three deep. No word gets a line to itself.',
      grammar: 'tsx',
      passages: [
        `export const pick = <T, K extends keyof T>(o: T, ...keys: K[]) =>
  Object.fromEntries(keys.map((k) => [k, o[k]])) as Pick<T, K>`,
        `{items.length > 0 ? (
  <ul className={cx('list', { dense })}>
    {items.map(({ id, name }) => <li key={id}>{name}</li>)}
  </ul>
) : null}`,
        `const next = { ...prev, [key]: value ?? prev[key] }
const hyp = ((a ** 2 + b ** 2) ** 0.5) | 0
const ok = !!(flags & 0b100) && x !== y
const name = arr?.[i]?.name?.trim() || 'n/a'`,
      ],
    },
  ],
}
