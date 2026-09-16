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
      ],
    },
  ],
}
