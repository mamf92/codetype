import type { Track } from '../schema'

export const typescriptCore: Track = {
  id: 'ts-core',
  kind: 'course',
  language: 'typescript',
  title: 'TypeScript Core',
  blurb:
    'The everyday patterns: narrowing, generics, utility types, satisfies, and type predicates.',
  level: 'working',
  tags: ['narrowing', 'generics', 'utility-types', 'satisfies', 'type-guards'],
  freshnessDays: 21,
  lessons: [
    {
      id: 'ts-core-narrowing',
      title: 'Discriminated unions',
      summary: 'Exhaustive narrowing over a tagged union.',
      concept:
        'A discriminated union gives each variant a shared literal tag field. Switching on that tag lets TypeScript narrow the rest of the shape per branch, and a `never` check in the default case makes the compiler flag any variant you forgot to handle.',
      sourceUrl:
        'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions',
      drills: [
        {
          id: 'ts-core-narrowing-1',
          label: 'switch with exhaustive default',
          code: `function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'square':
      return shape.side ** 2
  }
}`,
          grammar: 'typescript',
          note: 'Baseline: two variants, switch narrows `shape` in each case automatically.',
        },
        {
          id: 'ts-core-narrowing-2',
          label: 'adding a variant on purpose',
          code: `function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2
    case 'square': return shape.side ** 2
    case 'triangle': return (shape.base * shape.height) / 2
  }
}`,
          grammar: 'typescript',
          note: 'A third variant means a third case; the discriminant still drives narrowing.',
        },
        {
          id: 'ts-core-narrowing-3',
          label: 'never-checked default branch',
          code: `function describe(state: State): string {
  switch (state.status) {
    case 'idle':
      return 'waiting to start'
    default:
      return assertNever(state)
  }
}`,
          grammar: 'typescript',
          note: 'Here the default branch calls an `assertNever` helper, so a missed case is a compile error, not just a runtime surprise.',
        },
        {
          id: 'ts-core-narrowing-4',
          label: 'narrowing with if instead of switch',
          code: `function unwrap<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value
  }
  throw new Error(result.error)
}`,
          grammar: 'typescript',
          note: 'Same tagged-union idea, but narrowed with a plain `if (result.ok)` guard rather than a switch.',
        },
        {
          id: 'ts-core-narrowing-capstone',
          kind: 'capstone',
          label: 'parcel tracking, end to end',
          brief:
            'A courier service models every scan as one tagged event, then renders a headline for it. Watch the discriminant do all the work: each case narrows the shape, the never-checked default refuses to compile once a sixth event type is added, and the same union narrows again with a plain if a few lines down.',
          code: `type ParcelEvent =
  | { kind: 'scanned'; hub: string; at: string }
  | { kind: 'out-for-delivery'; courier: string; eta: number }
  | { kind: 'delivered'; signedBy: string }
  | { kind: 'failed'; reason: string; retryable: boolean }

function assertNever(value: never): never {
  throw new Error(\`unhandled event: \${JSON.stringify(value)}\`)
}

export function headline(event: ParcelEvent): string {
  switch (event.kind) {
    case 'scanned':
      return \`Scanned at \${event.hub}\`
    case 'out-for-delivery':
      return \`With \${event.courier}, \${event.eta} min away\`
    case 'delivered':
      return \`Signed for by \${event.signedBy}\`
    case 'failed':
      return event.retryable ? \`Retrying: \${event.reason}\` : event.reason
    default:
      return assertNever(event)
  }
}

export function isTerminal(event: ParcelEvent): boolean {
  if (event.kind === 'delivered') return true
  return event.kind === 'failed' && !event.retryable
}`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-core-generic-constraints',
      title: 'Generic constraints with extends',
      summary: 'Bounding a type parameter so the compiler knows what it can do.',
      concept:
        'A generic constraint (`<T extends ...>`) restricts what a caller may pass in while letting the function stay reusable. It lets you call methods or access properties the constraint promises exist, without giving up on inference.',
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints',
      drills: [
        {
          id: 'ts-core-generic-constraints-1',
          label: 'constrain to an object with length',
          code: `function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}

longest('hello', 'hi')
longest([1, 2, 3], [1])`,
          grammar: 'typescript',
          note: 'The constraint only requires a `length` property, so it works for strings and arrays alike.',
        },
        {
          id: 'ts-core-generic-constraints-2',
          label: 'constrain to keyof for safe lookup',
          code: `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { id: 1, name: 'Ada' }
getProperty(user, 'name')`,
          grammar: 'typescript',
          note: 'Instead of a shape constraint, `K extends keyof T` ties the key parameter to the object so bad keys fail to compile.',
        },
        {
          id: 'ts-core-generic-constraints-3',
          label: 'default type parameter with a constraint',
          code: `interface Repository<T extends { id: string }> {
  save(entity: T): void
  find(id: string): T | undefined
}
function createRepo<T extends { id: string } = { id: string }>(): Repository<T> {
  const items = new Map<string, T>()
  return { save: (e) => items.set(e.id, e), find: (id) => items.get(id) }
}`,
          grammar: 'typescript',
          note: "The constraint now bounds an interface's parameter, and pairs with a default so `createRepo()` works with no arguments.",
        },
        {
          id: 'ts-core-generic-constraints-4',
          label: 'constraint plus conditional type',
          code: `type ExtractError<T extends { ok: boolean }> = T extends { ok: false; error: infer E } ? E : never

function reportError<T extends { ok: boolean }>(result: T): ExtractError<T> {
  if (!result.ok && 'error' in result) {
    return result.error as ExtractError<T>
  }
  throw new Error('no error to report')
}`,
          grammar: 'typescript',
          note: 'The same bounding technique now feeds a conditional type, extracting the error branch of a constrained shape.',
        },
        {
          id: 'ts-core-generic-constraints-capstone',
          kind: 'capstone',
          label: 'a generic table for an admin panel',
          brief:
            'An in-memory store behind every admin screen. One constraint bounds the class so every row is known to have an id, a second ties lookup keys to the row type, and a caller picks the concrete shape once when it constructs the table.',
          code: `interface Entity {
  id: string
}

export class Table<T extends Entity> {
  private rows = new Map<string, T>()

  put(row: T): void {
    this.rows.set(row.id, row)
  }

  pluck<K extends keyof T>(id: string, key: K): T[K] | undefined {
    return this.rows.get(id)?.[key]
  }

  sortBy<K extends keyof T>(key: K): T[] {
    const all = [...this.rows.values()]
    return all.sort((a, b) => String(a[key]).localeCompare(String(b[key])))
  }
}

interface Invoice extends Entity {
  customer: string
  total: number
}

const invoices = new Table<Invoice>()
invoices.put({ id: 'inv-1', customer: 'Ada', total: 420 })
const who = invoices.pluck('inv-1', 'customer')`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-core-utility-types',
      title: 'Utility types: Pick, Omit, Record, Partial',
      summary: 'Deriving new shapes from an existing type instead of redeclaring them.',
      concept:
        'Built-in utility types let you transform an existing type rather than write a parallel one by hand. `Pick` and `Omit` select or drop keys, `Record` builds a map type, and `Partial` makes every property optional for patch-style updates.',
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/utility-types.html',
      drills: [
        {
          id: 'ts-core-utility-types-1',
          label: 'Pick for a summary view',
          code: `interface User {
  id: string
  name: string
  email: string
  passwordHash: string
}

type UserSummary = Pick<User, 'id' | 'name'>`,
          grammar: 'typescript',
          note: 'Pick keeps only the listed keys, useful for a public-facing view of a bigger type.',
        },
        {
          id: 'ts-core-utility-types-2',
          label: 'Omit for a safe-to-send view',
          code: `interface User {
  id: string
  name: string
  email: string
  passwordHash: string
}

type PublicUser = Omit<User, 'passwordHash'>`,
          grammar: 'typescript',
          note: "Omit is Pick's complement: drop the sensitive key and keep everything else.",
        },
        {
          id: 'ts-core-utility-types-3',
          label: 'Record for a lookup table',
          code: `type Role = 'admin' | 'editor' | 'viewer'

const permissionLevel: Record<Role, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
}`,
          grammar: 'typescript',
          note: 'Record builds an object type from a key union, and the compiler checks every key is present.',
        },
        {
          id: 'ts-core-utility-types-4',
          label: 'Partial for a patch function',
          code: `interface User {
  id: string
  name: string
  email: string
}
function updateUser(user: User, patch: Partial<User>): User {
  return { ...user, ...patch }
}`,
          grammar: 'typescript',
          note: 'Partial makes every field optional so callers can pass just the fields they want to change.',
        },
        {
          id: 'ts-core-utility-types-capstone',
          kind: 'capstone',
          label: 'one account type, four derived views',
          brief:
            'An accounts module where exactly one interface is written by hand and every other shape is derived from it. Rename a field on Account and the public view, the card, the patch type and the seat table all move with it, which is the whole reason not to write them out twice.',
          code: `interface Account {
  id: string
  email: string
  displayName: string
  passwordHash: string
  role: 'admin' | 'editor' | 'viewer'
}

type PublicAccount = Omit<Account, 'passwordHash'>
type AccountCard = Pick<Account, 'id' | 'displayName'>
type AccountPatch = Partial<Omit<Account, 'id'>>

const seatLimit: Record<Account['role'], number> = {
  admin: 3,
  editor: 25,
  viewer: 200,
}

export function toPublic({ passwordHash, ...rest }: Account): PublicAccount {
  return rest
}

export function toCard(account: Account): AccountCard {
  return { id: account.id, displayName: account.displayName }
}

export function applyPatch(account: Account, patch: AccountPatch): Account {
  return { ...account, ...patch }
}

export function hasSeats(role: Account['role'], taken: number): boolean {
  return taken < seatLimit[role]
}`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-core-satisfies',
      title: 'The satisfies operator',
      summary: 'Checking a value against a type without widening or losing its literal shape.',
      concept:
        "`satisfies` validates that an expression matches a type, but unlike an annotation it keeps the expression's own inferred type, so literals stay literals and unlisted keys still get errors. It is for validation, not casting.",
      sourceUrl:
        'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator',
      drills: [
        {
          id: 'ts-core-satisfies-1',
          label: 'a config object keeps its literal keys',
          code: `type Palette = Record<string, string | [number, number, number]>

const colors = {
  red: [255, 0, 0],
  blue: '#0000ff',
} satisfies Palette

colors.red.at(0)`,
          grammar: 'typescript',
          note: 'With `satisfies` instead of `: Palette`, `colors.red` is still known as a tuple, so `.at(0)` is available.',
        },
        {
          id: 'ts-core-satisfies-2',
          label: 'catching a typo in an otherwise-valid shape',
          code: `type RouteMap = Record<'home' | 'about', string>

const routes = {
  home: '/',
  abuot: '/about',
} satisfies RouteMap`,
          grammar: 'typescript',
          note: 'Same pattern, but here the misspelled key makes `satisfies` fail because `about` is missing.',
        },
        {
          id: 'ts-core-satisfies-3',
          label: 'satisfies on a function return value',
          code: `type Handler = (event: string) => void

const onClick = ((event) => console.log(event)) satisfies Handler`,
          grammar: 'typescript',
          note: 'The same operator applies to a function expression, confirming its shape while keeping inferred parameter types.',
        },
        {
          id: 'ts-core-satisfies-4',
          label: 'contrast with a plain type annotation',
          code: `interface Point {
  x: number
  y: number
  z?: number
}

const origin: Point = { x: 0, y: 0 }
const originChecked = { x: 0, y: 0 } satisfies Point`,
          grammar: 'typescript',
          note: 'Side by side: `: Point` widens to the annotation, while `satisfies Point` keeps the literal `{ x: number; y: number }` type.',
        },
        {
          id: 'ts-core-satisfies-capstone',
          kind: 'capstone',
          label: 'a dashboard config that stays literal',
          brief:
            'Feature flags, a theme and a route table, each validated against a target type without losing what it actually is. Because satisfies keeps the inferred type, keyof typeof flags is a real union of flag names, accent is still a tuple you can index, and every route is checked against a template literal type.',
          code: `type Flag = { enabled: boolean; rollout: number }
type Theme = { bg: string; accent: [number, number, number] }

const flags = {
  newEditor: { enabled: true, rollout: 0.25 },
  betaExport: { enabled: false, rollout: 0 },
} satisfies Record<string, Flag>

const theme = {
  bg: '#0b0b0d',
  accent: [255, 176, 0],
} satisfies Theme

const routes = {
  home: '/',
  settings: '/settings',
  billing: '/settings/billing',
} satisfies Record<string, \`/\${string}\`>

export function isRolledOut(name: keyof typeof flags, bucket: number): boolean {
  const flag = flags[name]
  return flag.enabled && bucket < flag.rollout
}

export function accentChannel(index: 0 | 1 | 2): number {
  return theme.accent[index]
}

export const settingsPath = routes.settings`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-core-type-guards',
      title: 'Type predicates and assertion functions',
      summary: 'Writing your own narrowing functions instead of relying on built-in ones.',
      concept:
        "A function can narrow its argument's type for callers by declaring a return type of `arg is Type` (a type predicate) or by asserting with `asserts arg is Type`. This lets you package custom runtime checks so the compiler trusts them the same way it trusts `typeof`.",
      sourceUrl:
        'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates',
      drills: [
        {
          id: 'ts-core-type-guards-1',
          label: 'a basic type predicate',
          code: `function isString(value: unknown): value is string {
  return typeof value === 'string'
}

const value: unknown = 'hi'
if (isString(value)) value.toUpperCase()`,
          grammar: 'typescript',
          note: 'Baseline predicate: `value is string` lets the compiler narrow `unknown` inside the `if`.',
        },
        {
          id: 'ts-core-type-guards-2',
          label: 'a predicate over a union of object shapes',
          code: `interface Cat { kind: 'cat'; meow(): void }
interface Dog { kind: 'dog'; bark(): void }

function isCat(pet: Cat | Dog): pet is Cat {
  return pet.kind === 'cat'
}
declare const pet: Cat | Dog
if (isCat(pet)) pet.meow()`,
          grammar: 'typescript',
          note: 'Same predicate shape, now narrowing between two object variants instead of a primitive.',
        },
        {
          id: 'ts-core-type-guards-3',
          label: 'array filter narrowed by a predicate',
          code: `const values: (number | null)[] = [1, null, 2, null, 3]

function isNumber(value: number | null): value is number {
  return value !== null
}

const numbers = values.filter(isNumber)`,
          grammar: 'typescript',
          note: "The same kind of predicate, passed straight to `filter`, narrows the resulting array's element type.",
        },
        {
          id: 'ts-core-type-guards-4',
          label: 'an assertion function instead of a predicate',
          code: `function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('expected a string')
  }
}
const value: unknown = 'hi'
assertIsString(value)
value.toUpperCase()`,
          grammar: 'typescript',
          note: 'Instead of returning a boolean, an `asserts value is string` function narrows the rest of the enclosing scope by throwing.',
        },
        {
          id: 'ts-core-type-guards-capstone',
          kind: 'capstone',
          label: 'trusting a webhook payload',
          brief:
            'Nothing arriving over the wire is typed, so this module earns its types instead. A small record predicate composes into a full event predicate, an assertion function turns that into a throw, and the same predicate hands filter a narrowed array at the bottom.',
          code: `interface WebhookEvent {
  id: string
  type: string
  payload: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isWebhookEvent(value: unknown): value is WebhookEvent {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.type === 'string'
}

function assertWebhookEvent(value: unknown): asserts value is WebhookEvent {
  if (!isWebhookEvent(value)) {
    throw new Error('payload is not a webhook event')
  }
}

export function handle(raw: unknown): string {
  assertWebhookEvent(raw)
  return \`\${raw.type} (\${raw.id})\`
}

export function handleBatch(batch: unknown[]): string[] {
  return batch.filter(isWebhookEvent).map((event) => event.type)
}`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-core-review',
      kind: 'review',
      title: 'Review: a typed settings service',
      summary:
        'One workspace-settings module that puts all five core patterns back to work together.',
      concept:
        'Nothing new here. This is the settings service for a fictional team product, written across three files: the domain types, the guards that let untrusted JSON in, and the service that ties them together. Narrowing, generic constraints, utility types, satisfies and type predicates each turn up where they are actually the right tool, rather than one at a time.',
      covers: [
        'ts-core-narrowing',
        'ts-core-generic-constraints',
        'ts-core-utility-types',
        'ts-core-satisfies',
        'ts-core-type-guards',
      ],
      drills: [
        {
          id: 'ts-core-review-1',
          kind: 'capstone',
          label: 'settings/types.ts',
          brief:
            'The domain, written once. A discriminated union for the load state, utility types for the derived views, and a satisfies-checked seat table whose keys are tied to the plan union rather than restated as strings.',
          code: `export interface Workspace {
  id: string
  name: string
  plan: 'free' | 'team' | 'enterprise'
  secretKey: string
}

export type PublicWorkspace = Omit<Workspace, 'secretKey'>
export type WorkspacePatch = Partial<Pick<Workspace, 'name' | 'plan'>>

export type SettingsState =
  | { status: 'loading' }
  | { status: 'ready'; workspace: Workspace }
  | { status: 'error'; message: string; retryable: boolean }

export const seatsByPlan = {
  free: 1,
  team: 20,
  enterprise: 500,
} satisfies Record<Workspace['plan'], number>

export function describe(state: SettingsState): string {
  switch (state.status) {
    case 'loading':
      return 'Loading settings'
    case 'ready':
      return \`\${state.workspace.name} on \${state.workspace.plan}\`
    case 'error':
      return state.retryable ? 'Retrying' : state.message
  }
}`,
          grammar: 'typescript',
        },
        {
          id: 'ts-core-review-2',
          kind: 'capstone',
          label: 'settings/guards.ts',
          brief:
            'The boundary. Two predicates and an assertion function turn unknown JSON into a Workspace, a constrained generic reads a field off any row that has an id, and the last predicate narrows a whole array of load states down to the ready ones.',
          code: `import type { SettingsState, Workspace } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isWorkspace(value: unknown): value is Workspace {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.name === 'string'
}

export function assertWorkspace(value: unknown): asserts value is Workspace {
  if (!isWorkspace(value)) {
    throw new Error('not a workspace')
  }
}

export function pluck<T extends { id: string }, K extends keyof T>(
  rows: T[],
  id: string,
  key: K,
): T[K] | undefined {
  return rows.find((row) => row.id === id)?.[key]
}

type Ready = Extract<SettingsState, { status: 'ready' }>

export function loaded(states: SettingsState[]): Workspace[] {
  const ready = states.filter((s): s is Ready => s.status === 'ready')
  return ready.map((state) => state.workspace)
}`,
          grammar: 'typescript',
        },
        {
          id: 'ts-core-review-3',
          kind: 'capstone',
          label: 'settings/service.ts',
          brief:
            'Where it all lands. Untrusted input is asserted at the door, the secret is dropped on the way out with a rest destructure, a patch type keeps updates partial, and the seat table indexed by the narrowed plan gives an answer without a single any.',
          code: `import { assertWorkspace } from './guards'
import { seatsByPlan } from './types'
import type { PublicWorkspace, SettingsState, Workspace, WorkspacePatch } from './types'

export class SettingsService {
  private cache = new Map<string, Workspace>()

  ingest(raw: unknown): PublicWorkspace {
    assertWorkspace(raw)
    this.cache.set(raw.id, raw)
    const { secretKey, ...safe } = raw
    return safe
  }

  patch(id: string, patch: WorkspacePatch): SettingsState {
    const current = this.cache.get(id)
    if (current === undefined) {
      return { status: 'error', message: 'unknown workspace', retryable: false }
    }
    const next = { ...current, ...patch }
    this.cache.set(id, next)
    return { status: 'ready', workspace: next }
  }

  seatsLeft(id: string, taken: number): number {
    const workspace = this.cache.get(id)
    if (workspace === undefined) return 0
    return seatsByPlan[workspace.plan] - taken
  }
}`,
          grammar: 'typescript',
        },
      ],
    },
  ],
}

export const typescriptFrontier: Track = {
  id: 'ts-frontier',
  kind: 'dispatch',
  language: 'typescript',
  title: 'TypeScript, freshly shipped',
  blurb:
    'const type parameters, satisfies in real configs, and explicit resource management with using.',
  level: 'frontier',
  tags: ['const-type-parameters', 'satisfies', 'using', 'resource-management'],
  freshnessDays: 10,
  publishedAt: '2024-03-06',
  sourceUrl: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/',
  lessons: [
    {
      id: 'ts-frontier-const-type-params',
      title: 'const type parameters',
      summary: 'Asking inference to keep literal types without an extra as const.',
      concept:
        'TypeScript 5.0 lets you mark a generic type parameter as `const`, which tells inference to preserve literal types and readonly-ness at the call site, the way `as const` would, without the caller having to remember to write it.',
      sourceUrl:
        'https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#const-type-parameters',
      drills: [
        {
          id: 'ts-frontier-const-type-params-1',
          label: 'without const, literals widen',
          code: `function first<T>(arr: T[]): T {
  return arr[0]
}

const dir = first(['left', 'right'])`,
          grammar: 'typescript',
          note: 'Baseline: without a `const` modifier, `dir` widens to `string`, not the literal union.',
        },
        {
          id: 'ts-frontier-const-type-params-2',
          label: 'adding const to keep the literal',
          code: `function first<const T>(arr: T[]): T {
  return arr[0]
}

const dir = first(['left', 'right'])`,
          grammar: 'typescript',
          note: 'Same function, now with `<const T>`, so `dir` is inferred as `"left" | "right"` instead of `string`.',
        },
        {
          id: 'ts-frontier-const-type-params-3',
          label: 'const type parameter on a tuple-returning helper',
          code: `function pair<const T extends readonly [unknown, unknown]>(tuple: T): T {
  return tuple
}

const point = pair(['x', 10])`,
          grammar: 'typescript',
          note: 'The same modifier on a tuple-shaped parameter keeps both the literal `"x"` and the readonly tuple structure.',
        },
        {
          id: 'ts-frontier-const-type-params-capstone',
          kind: 'capstone',
          label: 'a router that remembers its paths',
          brief:
            'A miniature router where no caller ever writes as const. Because every helper declares its type parameter const, the array of paths stays a tuple of literals, Route is a real union derived from it, and a typo in navigate is a compile error rather than a 404 in production.',
          code: `function defineRoutes<const T extends readonly string[]>(paths: T): T {
  return paths
}

const routes = defineRoutes(['/', '/inbox', '/inbox/:id', '/settings'])
type Route = (typeof routes)[number]

function navigate<const P extends Route>(path: P): { path: P; at: number } {
  return { path, at: Date.now() }
}

type NavItem = { name: string; path: Route }

function group<const T extends readonly NavItem[]>(items: T): T {
  return items
}

const primary = group([
  { name: 'Inbox', path: '/inbox' },
  { name: 'Settings', path: '/settings' },
])

const current = navigate('/inbox/:id')
const firstName = primary[0].name`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-frontier-satisfies-config',
      title: 'satisfies in real config shapes',
      summary: 'Using satisfies to validate multi-key configuration objects.',
      concept:
        'Beyond toy examples, `satisfies` earns its place in configuration objects with many keys and nested nested unions: it validates every key against a target type while still letting each property keep its own precise inferred type for later use.',
      sourceUrl:
        'https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/#the-satisfies-operator',
      drills: [
        {
          id: 'ts-frontier-satisfies-config-1',
          label: 'validating an environment config',
          code: `type Env = Record<'development' | 'production', { url: string; retries: number }>

const env = {
  development: { url: 'http://localhost:3000', retries: 0 },
  production: { url: 'https://api.example.com', retries: 3 },
} satisfies Env`,
          grammar: 'typescript',
          note: 'Baseline: a two-environment config checked against `Env`, keeping each `url` as its literal string.',
        },
        {
          id: 'ts-frontier-satisfies-config-2',
          label: 'a build-tool style config with satisfies',
          code: `interface BuildConfig {
  entry: string
  target: 'es2020' | 'esnext'
}
const config = {
  entry: './src/index.ts',
  target: 'esnext',
} satisfies BuildConfig`,
          grammar: 'typescript',
          note: 'Same validation idea applied to a flatter, single-object build config instead of a per-environment map.',
        },
        {
          id: 'ts-frontier-satisfies-config-3',
          label: 'satisfies catching an invalid literal',
          code: `interface BuildConfig {
  entry: string
  target: 'es2020' | 'esnext'
}
const config = {
  entry: './src/index.ts',
  target: 'es5',
} satisfies BuildConfig`,
          grammar: 'typescript',
          note: "The same `BuildConfig` shape now rejects the config because `'es5'` is not one of the allowed `target` literals.",
        },
        {
          id: 'ts-frontier-satisfies-config-capstone',
          kind: 'capstone',
          label: 'three deploy targets, one checked map',
          brief:
            'The config file every project grows: one entry per environment, each checked against the same Target shape. satisfies validates all three at once while leaving the object literal precise enough that TargetName is a union of the three keys rather than plain string.',
          code: `interface Target {
  url: string
  retries: number
  region: 'eu-north-1' | 'us-east-1'
  features: readonly string[]
}

const targets = {
  local: {
    url: 'http://localhost:5173',
    retries: 0,
    region: 'eu-north-1',
    features: ['debug-panel'],
  },
  staging: {
    url: 'https://staging.example.dev',
    retries: 2,
    region: 'eu-north-1',
    features: ['debug-panel', 'beta-drills'],
  },
  production: {
    url: 'https://example.dev',
    retries: 5,
    region: 'us-east-1',
    features: [],
  },
} satisfies Record<string, Target>

export type TargetName = keyof typeof targets

export function urlFor(name: TargetName): string {
  return targets[name].url
}`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-frontier-using',
      title: 'Explicit resource management with using',
      summary: 'Declaring disposable resources that clean up automatically at scope exit.',
      concept:
        'TypeScript 5.2 added support for the `using` declaration: a variable holding a value with a `Symbol.dispose` method is disposed automatically when it goes out of scope, even if the block exits via an exception, replacing manual try/finally cleanup.',
      sourceUrl:
        'https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management',
      drills: [
        {
          id: 'ts-frontier-using-1',
          label: 'a minimal disposable resource',
          code: `function run() {
  using resource = {
    [Symbol.dispose]() {
      console.log('cleaned up')
    },
  }
}`,
          grammar: 'typescript',
          note: 'Baseline: `using` calls `[Symbol.dispose]()` automatically when `run` returns.',
        },
        {
          id: 'ts-frontier-using-2',
          label: 'using with a file-handle-style class',
          code: `class FileHandle {
  constructor(private path: string) {}
  [Symbol.dispose]() {
    console.log(\`closing \${this.path}\`)
  }
}

using file = new FileHandle('config.json')`,
          grammar: 'typescript',
          note: 'The same disposal contract implemented on a class instead of a plain object literal.',
        },
        {
          id: 'ts-frontier-using-3',
          label: 'await using for async cleanup',
          code: `class Connection {
  async [Symbol.asyncDispose]() {
    console.log('closing connection')
  }
}
async function query() {
  await using conn = new Connection()
}`,
          grammar: 'typescript',
          note: 'The async counterpart: `await using` with `Symbol.asyncDispose` for resources that close asynchronously.',
        },
        {
          id: 'ts-frontier-using-capstone',
          kind: 'capstone',
          label: 'an import job that cleans up after itself',
          brief:
            'A batch import that holds two resources at once: a scratch file and a database connection. Neither gets a try/finally. The sync one disposes at the closing brace, the async one is awaited on the way out, and both still run if the loop throws halfway through.',
          code: `class TempFile {
  constructor(readonly path: string) {}

  [Symbol.dispose]() {
    console.log(\`unlinking \${this.path}\`)
  }
}

class Connection {
  async query(sql: string): Promise<number> {
    return sql.length
  }

  async [Symbol.asyncDispose]() {
    console.log('closing connection')
  }
}

export async function importRows(rows: string[]): Promise<number> {
  using staging = new TempFile('/tmp/import.csv')
  await using db = new Connection()

  let written = 0
  for (const row of rows) {
    written += await db.query(\`INSERT INTO staged VALUES (\${row})\`)
  }
  console.log(\`staged \${written} bytes via \${staging.path}\`)
  return written
}`,
          grammar: 'typescript',
        },
      ],
    },
    {
      id: 'ts-frontier-review',
      kind: 'review',
      title: 'Review: a resource-safe export job',
      summary:
        'A nightly export built from const type parameters, a satisfies-checked sink map, and using.',
      concept:
        'The three newest features in this dispatch, used once each in the same fictional export job: const type parameters keep the format list literal, satisfies validates the sink configuration without flattening it, and using disposes the spool and the warehouse connection on the way out of the run.',
      covers: [
        'ts-frontier-const-type-params',
        'ts-frontier-satisfies-config',
        'ts-frontier-using',
      ],
      drills: [
        {
          id: 'ts-frontier-review-1',
          kind: 'capstone',
          label: 'export/formats.ts',
          brief:
            'The vocabulary of the job. Every helper takes a const type parameter, so nothing widens: the format list stays a tuple, Format is a union derived from it, and each job literal keeps the exact format it was declared with.',
          code: `function defineFormats<const T extends readonly string[]>(formats: T): T {
  return formats
}

export const formats = defineFormats(['csv', 'ndjson', 'parquet'])
export type Format = (typeof formats)[number]

type Job = { format: Format; chunk: number }

function defineJob<const J extends Job>(job: J): J {
  return job
}

export const nightly = defineJob({ format: 'ndjson', chunk: 5000 })
export const adhoc = defineJob({ format: 'csv', chunk: 250 })

export function extensionFor(format: Format): string {
  return format === 'parquet' ? '.parquet' : \`.\${format}\`
}

export const nightlyFormat = nightly.format
export const adhocChunk = adhoc.chunk`,
          grammar: 'typescript',
        },
        {
          id: 'ts-frontier-review-2',
          kind: 'capstone',
          label: 'export/sinks.ts',
          brief:
            'Where the rows go. Both sinks are checked against the same Sink interface in one satisfies, and because the literal keeps its own type, SinkName is the union of the two keys and each format is still the narrow literal declared above.',
          code: `import type { Format } from './formats'

interface Sink {
  bucket: string
  format: Format
  concurrency: number
  compress: boolean
}

export const sinks = {
  archive: {
    bucket: 's3://example-archive',
    format: 'parquet',
    concurrency: 4,
    compress: true,
  },
  support: {
    bucket: 's3://example-support',
    format: 'csv',
    concurrency: 1,
    compress: false,
  },
} satisfies Record<string, Sink>

export type SinkName = keyof typeof sinks

export function bucketFor(name: SinkName): string {
  return sinks[name].bucket
}`,
          grammar: 'typescript',
        },
        {
          id: 'ts-frontier-review-3',
          kind: 'capstone',
          label: 'export/run.ts',
          brief:
            'The run itself, holding two resources and cleaning up neither by hand. The spool disposes synchronously at the closing brace, the warehouse is awaited on the way out, and the sink name it takes is the literal union the config inferred two files ago.',
          code: `import { nightly } from './formats'
import { bucketFor } from './sinks'
import type { SinkName } from './sinks'

class Spool {
  constructor(readonly name: string) {}

  write(line: string): number {
    return line.length
  }
  [Symbol.dispose]() {
    console.log(\`flushing \${this.name}\`)
  }
}

class Warehouse {
  async fetch(sink: SinkName): Promise<string[]> {
    return [bucketFor(sink)]
  }

  async [Symbol.asyncDispose]() {
    console.log('closing warehouse')
  }
}

export async function runExport(sink: SinkName): Promise<number> {
  using spool = new Spool(nightly.format)
  await using warehouse = new Warehouse()

  let bytes = 0
  for (const row of await warehouse.fetch(sink)) {
    bytes += spool.write(row)
  }
  return bytes
}`,
          grammar: 'typescript',
        },
      ],
    },
  ],
}
