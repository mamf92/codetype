import type { Track } from '../schema'

export const reactCore: Track = {
  id: 'react-core',
  kind: 'course',
  language: 'react',
  title: 'React Core',
  blurb:
    'The hooks and patterns you reach for on an ordinary day: state, effects, memoization, custom hooks, and typed props.',
  level: 'working',
  tags: ['hooks', 'useState', 'useEffect', 'useMemo', 'useCallback', 'typescript'],
  freshnessDays: 21,
  lessons: [
    {
      id: 'react-core-state',
      title: 'useState updater forms',
      summary: 'Passing a value vs. passing a function to setState.',
      concept:
        'setState accepts either a new value or an updater function that receives the previous state. Reach for the function form whenever the next state depends on the current one, especially inside closures like timers or event handlers where a stale value could otherwise sneak in.',
      sourceUrl: 'https://react.dev/reference/react/useState',
      drills: [
        {
          id: 'react-core-state-1',
          label: 'direct value',
          code: `const [open, setOpen] = useState(false)
setOpen(true)`,
          grammar: 'tsx',
          note: 'The simplest form: setState called with a plain value.',
        },
        {
          id: 'react-core-state-2',
          label: 'updater with previous state',
          code: `const [count, setCount] = useState(0)
setCount((prev) => prev + 1)`,
          grammar: 'tsx',
          note: 'The updater form reads the previous value instead of a captured one.',
        },
        {
          id: 'react-core-state-3',
          label: 'updater on an object',
          code: `const [form, setForm] = useState({ name: '', email: '' })
setForm((prev) => ({ ...prev, email: 'a@b.com' }))`,
          grammar: 'tsx',
          note: 'Same updater pattern, but spreading the previous object to update one field.',
        },
        {
          id: 'react-core-state-4',
          label: 'toggling inside a callback',
          code: `const [liked, setLiked] = useState(false)
function handleClick() {
  setLiked((prev) => !prev)
}`,
          grammar: 'tsx',
          note: 'Toggling booleans is a common case where the updater form avoids stale closures.',
        },
        {
          id: 'react-core-state-5',
          label: 'appending to an array',
          code: `const [items, setItems] = useState<string[]>([])
setItems((prev) => [...prev, 'new item'])`,
          grammar: 'tsx',
          note: 'The same idea applied to arrays: build the next array from the previous one.',
        },
        {
          id: 'react-core-state-capstone',
          kind: 'capstone',
          label: 'a cart with three kinds of state',
          brief:
            'A shopping cart drawer holding a list, a string and a boolean at once. Every setter that reads what was there before takes the updater form, because add, remove and toggle all run from handlers that outlive the render they were created in.',
          code: `interface Line {
  sku: string
  qty: number
}

export function Cart() {
  const [lines, setLines] = useState<Line[]>([])
  const [coupon, setCoupon] = useState('')
  const [open, setOpen] = useState(false)

  function add(sku: string) {
    setLines((prev) => {
      const hit = prev.find((line) => line.sku === sku)
      if (hit === undefined) return [...prev, { sku, qty: 1 }]
      return prev.map((line) =>
        line.sku === sku ? { ...line, qty: line.qty + 1 } : line,
      )
    })
  }

  function remove(sku: string) {
    setLines((prev) => prev.filter((line) => line.sku !== sku))
  }

  return (
    <aside hidden={!open}>
      <input value={coupon} onChange={(e) => setCoupon(e.target.value)} />
      <button onClick={() => add('tee-01')}>Add tee</button>
      <button onClick={() => remove('tee-01')}>Remove tee</button>
      <button onClick={() => setOpen((prev) => !prev)}>Toggle</button>
    </aside>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-core-effect',
      title: 'useEffect cleanup and dependencies',
      summary: 'Subscribing, cleaning up, and choosing what belongs in the dependency array.',
      concept:
        'An effect can return a cleanup function that React runs before the effect runs again and when the component unmounts. The dependency array controls how often that cycle happens: omit it to run every render, pass [] to run once, or list the values the effect actually reads.',
      sourceUrl: 'https://react.dev/reference/react/useEffect',
      drills: [
        {
          id: 'react-core-effect-1',
          label: 'run once on mount',
          code: `useEffect(() => {
  console.log('mounted')
}, [])`,
          grammar: 'tsx',
          note: 'An empty dependency array runs the effect only after the first render.',
        },
        {
          id: 'react-core-effect-2',
          label: 'subscribe with cleanup',
          code: `useEffect(() => {
  const id = setInterval(() => setTick((t) => t + 1), 1000)
  return () => clearInterval(id)
}, [])`,
          grammar: 'tsx',
          note: 'The returned function tears down the interval before remount or unmount.',
        },
        {
          id: 'react-core-effect-3',
          label: 'dependency tied to a prop',
          code: `useEffect(() => {
  document.title = \`\${unreadCount} unread\`
}, [unreadCount])`,
          grammar: 'tsx',
          note: 'Listing unreadCount reruns the effect only when that specific value changes.',
        },
        {
          id: 'react-core-effect-4',
          label: 'aborting an async fetch',
          code: `useEffect(() => {
  const controller = new AbortController()
  fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
  return () => controller.abort()
}, [userId])`,
          grammar: 'tsx',
          note: 'Cleanup here cancels an in-flight request instead of clearing a timer.',
        },
        {
          id: 'react-core-effect-capstone',
          kind: 'capstone',
          label: 'a presence panel with four effects',
          brief:
            'A live "who is in this room" panel, where every effect in the component has a different reason to re-run. A socket keyed on the room, an aborted fetch keyed on the same, two window listeners that never re-subscribe, and a title write keyed on nothing but the count.',
          code: `export function PresencePanel({ roomId }: { roomId: string }) {
  const [peers, setPeers] = useState<string[]>([])
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const socket = new WebSocket(\`wss://rooms.example.com/\${roomId}\`)
    socket.onmessage = (event) => setPeers(JSON.parse(event.data))
    return () => socket.close()
  }, [roomId])

  useEffect(() => {
    const controller = new AbortController()
    fetch(\`/api/rooms/\${roomId}/peers\`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setPeers)
    return () => controller.abort()
  }, [roomId])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    document.title = \`\${peers.length} in room\`
  }, [peers.length])

  return <ul>{peers.map((peer) => <li key={peer}>{peer}</li>)}</ul>
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-core-memo',
      title: 'useMemo and useCallback',
      summary: 'Memoizing an expensive value versus memoizing a function identity.',
      concept:
        'useMemo caches the result of a computation across renders; useCallback caches a function reference. Both take a dependency array and exist to keep referential equality stable for children or effects, not to make plain arithmetic faster.',
      sourceUrl: 'https://react.dev/reference/react/useMemo',
      drills: [
        {
          id: 'react-core-memo-1',
          label: 'memoize a derived value',
          code: `const sorted = useMemo(() => [...items].sort(), [items])`,
          grammar: 'tsx',
          note: 'useMemo returns the cached array instead of resorting on every render.',
        },
        {
          id: 'react-core-memo-2',
          label: 'memoize a filtered list',
          code: `const visible = useMemo(
  () => rows.filter((row) => row.status === filter),
  [rows, filter]
)`,
          grammar: 'tsx',
          note: 'Two dependencies this time, so the filter recomputes only when either changes.',
        },
        {
          id: 'react-core-memo-3',
          label: 'stable callback for a child',
          code: `const handleSelect = useCallback((id: string) => {
  setSelectedId(id)
}, [])`,
          grammar: 'tsx',
          note: 'useCallback keeps the same function identity so a memoized child does not re-render.',
        },
        {
          id: 'react-core-memo-4',
          label: 'callback that closes over a prop',
          code: `const handleSubmit = useCallback(() => {
  onSubmit(draftId)
}, [onSubmit, draftId])`,
          grammar: 'tsx',
          note: 'Here the dependency array must include everything the closure reads, unlike the empty one above.',
        },
        {
          id: 'react-core-memo-capstone',
          kind: 'capstone',
          label: 'a filtered log table',
          brief:
            'A log viewer where the filtering is genuinely expensive and the child is genuinely memoized. One useMemo derives the visible rows, a second derives counts from the first, and useCallback keeps the row handler stable so the virtualized child is not thrown away on every keystroke.',
          code: `interface Row {
  id: string
  level: 'info' | 'warn' | 'error'
  message: string
}

interface LogTableProps {
  rows: Row[]
  onPick: (id: string) => void
}

export function LogTable({ rows, onPick }: LogTableProps) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Row['level'] | 'all'>('all')

  const visible = useMemo(() => {
    const needle = query.toLowerCase()
    return rows.filter(
      (row) =>
        (level === 'all' || row.level === level) &&
        row.message.toLowerCase().includes(needle),
    )
  }, [rows, level, query])

  const counts = useMemo(() => {
    const tally: Record<string, number> = {}
    for (const row of visible) tally[row.level] = (tally[row.level] ?? 0) + 1
    return tally
  }, [visible])

  const handlePick = useCallback((id: string) => onPick(id), [onPick])

  return <VirtualRows rows={visible} counts={counts} onPick={handlePick} />
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-core-custom-hooks',
      title: 'Custom hooks',
      summary: 'Extracting stateful logic into a reusable, composable function.',
      concept:
        'A custom hook is just a function whose name starts with use and that calls other hooks. It lets you share stateful behavior between components without changing the component tree, unlike a higher-order component or render props.',
      sourceUrl: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
      drills: [
        {
          id: 'react-core-custom-hooks-1',
          label: 'wrapping window size',
          code: `const [width, setWidth] = useState(window.innerWidth)
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth)
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}, [])`,
          grammar: 'tsx',
          note: 'Bundles a state value and its subscribing effect behind one call site.',
        },
        {
          id: 'react-core-custom-hooks-2',
          label: 'a toggle hook',
          code: `function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue((v) => !v), [])
  return [value, toggle] as const
}`,
          grammar: 'tsx',
          note: 'Returns a tuple like useState itself, showing hooks can mimic the built-in API shape.',
        },
        {
          id: 'react-core-custom-hooks-3',
          label: 'consuming a custom hook',
          code: `function Sidebar() {
  const width = useWindowWidth()
  return <aside style={{ width: width < 640 ? '100%' : 240 }} />
}`,
          grammar: 'tsx',
          note: 'From the caller side a custom hook reads exactly like a built-in one.',
        },
        {
          id: 'react-core-custom-hooks-4',
          label: 'a hook with parameters and cleanup',
          code: `function useEventListener(target: EventTarget, type: string, handler: (e: Event) => void) {
  useEffect(() => {
    target.addEventListener(type, handler)
    return () => target.removeEventListener(type, handler)
  }, [target, type, handler])
}`,
          grammar: 'tsx',
          note: 'Generalizes the pattern further by taking the target and event type as arguments.',
        },
        {
          id: 'react-core-custom-hooks-capstone',
          kind: 'capstone',
          label: 'three hooks stacked into a draft editor',
          brief:
            'A note editor whose entire behaviour lives in hooks the component never has to know about. One hook debounces any value, a second builds on it to persist a draft, a third tracks connectivity, and the component using all three is three lines long. Watch what the draft hook debounces: the key travels with the text, so a note switched mid-keystroke cannot write one draft over another.',
          code: `function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return settled
}

function useLocalDraft(key: string) {
  const [draft, setDraft] = useState(() => ({ key, text: localStorage.getItem(key) ?? '' }))
  if (draft.key !== key) setDraft({ key, text: localStorage.getItem(key) ?? '' })
  const settled = useDebounced(draft, 400)
  useEffect(() => {
    localStorage.setItem(settled.key, settled.text)
  }, [settled])
  return [draft.text, (text: string) => setDraft({ key, text })] as const
}

function useOnlineStatus() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    return () => window.removeEventListener('online', update)
  }, [])
  return online
}

export function DraftEditor({ noteId }: { noteId: string }) {
  const [text, setText] = useLocalDraft(\`draft:\${noteId}\`)
  const online = useOnlineStatus()
  return <textarea value={text} disabled={!online} onChange={(e) => setText(e.target.value)} />
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-core-props',
      title: 'Typed component props',
      summary: 'Declaring prop shapes with an interface, including children and optional fields.',
      concept:
        'A component that takes props should declare their shape as an interface or type alias, not inline. Optional props get a ?, children get React.ReactNode, and destructuring in the function signature keeps the body free of props.foo noise.',
      sourceUrl: 'https://react.dev/learn/typescript',
      drills: [
        {
          id: 'react-core-props-1',
          label: 'basic props interface',
          code: `interface ButtonProps {
  label: string
  onClick: () => void
}

function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}`,
          grammar: 'tsx',
          note: 'The minimal shape: two required props, no children.',
        },
        {
          id: 'react-core-props-2',
          label: 'optional prop with a default',
          code: `interface BadgeProps {
  count: number
  variant?: 'info' | 'warning'
}

function Badge({ count, variant = 'info' }: BadgeProps) {
  return <span className={variant}>{count}</span>
}`,
          grammar: 'tsx',
          note: 'A ? marks variant optional, and the destructure supplies its default.',
        },
        {
          id: 'react-core-props-3',
          label: 'props with children',
          code: `interface CardProps {
  title: string
  children: React.ReactNode
}

function Card({ title, children }: CardProps) {
  return <section><h2>{title}</h2>{children}</section>
}`,
          grammar: 'tsx',
          note: 'children is typed as React.ReactNode to accept any renderable content.',
        },
        {
          id: 'react-core-props-4',
          label: 'generic list props',
          code: `interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>
}`,
          grammar: 'tsx',
          note: 'A generic parameter lets the same component stay type-safe across different item types.',
        },
        {
          id: 'react-core-props-capstone',
          kind: 'capstone',
          label: 'a generic table component',
          brief:
            'The component every app eventually writes. Its props are declared as an interface, not inline; a generic parameter ties the columns to the rows; a cell renderer is typed as ReactNode rather than a string; and the two optional props carry, respectively, a default in the destructure and an optional call at the site that uses it.',
          code: `interface Column<T> {
  key: keyof T & string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  rows: T[]
  columns: Column<T>[]
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T extends { id: string }>({
  rows,
  columns,
  emptyMessage = 'Nothing here yet',
  onRowClick,
}: TableProps<T>) {
  if (rows.length === 0) return <p>{emptyMessage}</p>
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onRowClick?.(row)}>
            {columns.map((col) => (
              <td key={col.key}>{col.render?.(row) ?? String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-core-review',
      kind: 'review',
      title: 'Review: a saved-search panel',
      summary:
        'One feature that needs typed props, updater state, effects, memoization and a custom hook at once.',
      concept:
        'No new hook here. This is the saved-search panel of a log viewer, in the three files it would really be split across: the presentational list with its typed props, the custom hook that owns fetching and saving, and the panel that memoizes, runs an effect on what you picked, and wires the other two together.',
      covers: [
        'react-core-state',
        'react-core-effect',
        'react-core-memo',
        'react-core-custom-hooks',
        'react-core-props',
      ],
      drills: [
        {
          id: 'react-core-review-1',
          kind: 'capstone',
          label: 'SearchList.tsx',
          brief:
            'The presentational half. Props are an exported interface rather than an inline annotation, the optional message carries a default in the destructure, children are typed as ReactNode, and the component holds no state of its own.',
          code: `export interface SavedSearch {
  id: string
  label: string
  query: string
  level: 'info' | 'warn' | 'error' | 'all'
}

export interface SearchListProps {
  searches: SavedSearch[]
  onRun: (search: SavedSearch) => void
  emptyMessage?: string
  children?: React.ReactNode
}

export function SearchList({
  searches,
  onRun,
  emptyMessage = 'No saved searches',
  children,
}: SearchListProps) {
  if (searches.length === 0) return <p>{emptyMessage}</p>
  return (
    <ul>
      {children}
      {searches.map((search) => (
        <li key={search.id}>
          <button onClick={() => onRun(search)}>{search.label}</button>
        </li>
      ))}
    </ul>
  )
}`,
          grammar: 'tsx',
        },
        {
          id: 'react-core-review-2',
          kind: 'capstone',
          label: 'useSavedSearches.ts',
          brief:
            'The stateful half, extracted so the panel never sees a fetch. A generic debounce hook composes into the feature hook, the effect aborts on a changed user, and saving appends through the updater form rather than the array it captured.',
          code: `function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return settled
}

export function useSavedSearches(userId: string) {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [draft, setDraft] = useState('')
  const debounced = useDebounced(draft, 300)

  useEffect(() => {
    const controller = new AbortController()
    fetch(\`/api/users/\${userId}/searches\`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setSearches)
    return () => controller.abort()
  }, [userId])

  const save = useCallback((label: string, query: string) => {
    const id = crypto.randomUUID()
    setSearches((prev) => [...prev, { id, label, query, level: 'all' }])
  }, [])

  return { searches, draft, setDraft, debounced, save }
}`,
          grammar: 'tsx',
        },
        {
          id: 'react-core-review-3',
          kind: 'capstone',
          label: 'SearchPanel.tsx',
          brief:
            'Where the two halves meet. The hook supplies the data, a memo filters it against the debounced query, an effect writes and restores the document title when a search is run, and a stable callback is handed down to the list from the first file.',
          code: `export function SearchPanel({ userId }: { userId: string }) {
  const { searches, draft, setDraft, debounced, save } = useSavedSearches(userId)
  const [ran, setRan] = useState<SavedSearch | null>(null)

  const matches = useMemo(() => {
    const needle = debounced.toLowerCase()
    return searches.filter((s) => s.label.toLowerCase().includes(needle))
  }, [searches, debounced])

  useEffect(() => {
    if (ran === null) return
    document.title = \`Search: \${ran.label}\`
    return () => {
      document.title = 'CodeType'
    }
  }, [ran])

  const onRun = useCallback((search: SavedSearch) => setRan(search), [])

  return (
    <section>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      <SearchList searches={matches} onRun={onRun} />
      <button onClick={() => save(draft, draft)}>Save this search</button>
    </section>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
  ],
}

export const reactFrontier: Track = {
  id: 'react-frontier',
  kind: 'dispatch',
  language: 'react',
  title: 'React 19: The New Hooks',
  blurb:
    'Actions, optimistic updates, and reading promises directly in render: the hooks that shipped with React 19.',
  level: 'frontier',
  tags: ['react-19', 'use', 'useOptimistic', 'useActionState', 'actions'],
  freshnessDays: 10,
  publishedAt: '2024-12-05',
  sourceUrl: 'https://react.dev/blog/2024/12/05/react-19',
  lessons: [
    {
      id: 'react-frontier-use',
      title: 'The use() hook',
      summary: 'Reading a promise or a context value directly during render.',
      concept:
        'use() lets a component read the value of a promise or a context inside render, including conditionally, which regular hooks cannot do. Reading a pending promise suspends the component until it resolves.',
      sourceUrl: 'https://react.dev/reference/react/use',
      drills: [
        {
          id: 'react-frontier-use-1',
          label: 'reading a promise prop',
          code: `function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise)
  return <ul>{comments.map((c) => <li key={c.id}>{c.text}</li>)}</ul>
}`,
          grammar: 'tsx',
          note: 'use() unwraps a promise passed down as a prop, suspending until it settles.',
        },
        {
          id: 'react-frontier-use-2',
          label: 'reading context',
          code: `function ThemedButton() {
  const theme = use(ThemeContext)
  return <button className={theme}>Click</button>
}`,
          grammar: 'tsx',
          note: 'use() also reads context, working as a drop-in for useContext here.',
        },
        {
          id: 'react-frontier-use-3',
          label: 'conditional use inside a branch',
          code: `function Panel({ show, dataPromise }: { show: boolean; dataPromise: Promise<Data> }) {
  if (!show) return null
  const data = use(dataPromise)
  return <div>{data.label}</div>
}`,
          grammar: 'tsx',
          note: 'Unlike other hooks, use() is allowed after an early return or inside an if.',
        },
        {
          id: 'react-frontier-use-capstone',
          kind: 'capstone',
          label: 'a product page that reads promises in render',
          brief:
            'A product page with no useEffect and no loading state of its own. use reads a context at the top of one component, unwraps a promise in two more, and in StockLine is called after an early return, which no other hook is allowed to do. Note that every promise arrives as a prop: one created during render would be a different promise each render, and the component would suspend forever.',
          code: `const LocaleContext = createContext('en')

interface PageProps {
  product: Promise<{ title: string }>
  reviews: Promise<{ id: string; body: string }[]>
  stock: Promise<number>
  inStock: boolean
}

function ReviewList({ reviews }: { reviews: PageProps['reviews'] }) {
  const locale = use(LocaleContext)
  const list = use(reviews)
  return (
    <ul lang={locale}>
      {list.map((r) => <li key={r.id}>{r.body}</li>)}
    </ul>
  )
}

function StockLine({ show, stock }: { show: boolean; stock: Promise<number> }) {
  if (!show) return null
  const left = use(stock)
  return <p>{left} left</p>
}

export function ProductPage({ product, reviews, stock, inStock }: PageProps) {
  const info = use(product)
  return (
    <Suspense fallback={<p>Loading</p>}>
      <h1>{info.title}</h1>
      <StockLine show={inStock} stock={stock} />
      <ReviewList reviews={reviews} />
    </Suspense>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-frontier-optimistic',
      title: 'useOptimistic',
      summary: 'Showing a predicted result while a real update is still in flight.',
      concept:
        'useOptimistic renders a temporary state derived from the current state plus an in-flight action, then reverts to the real value once that action settles. It is built for the pattern of updating the UI immediately on submit and reconciling with the server response after.',
      sourceUrl: 'https://react.dev/reference/react/useOptimistic',
      drills: [
        {
          id: 'react-frontier-optimistic-1',
          label: 'optimistic like toggle',
          code: `const [optimisticLiked, setOptimisticLiked] = useOptimistic(liked)

async function like() {
  setOptimisticLiked(true)
  await likePost(postId)
}`,
          grammar: 'tsx',
          note: 'The simplest form: an optimistic boolean set right before the real request fires.',
        },
        {
          id: 'react-frontier-optimistic-2',
          label: 'optimistic message list',
          code: `const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (state, newMessage: string) => [...state, { text: newMessage, sending: true }]
)`,
          grammar: 'tsx',
          note: 'Passes a merge function so the optimistic value is computed from state plus the new item, not just replaced.',
        },
        {
          id: 'react-frontier-optimistic-3',
          label: 'submitting through a form action',
          code: `async function submitAction(formData: FormData) {
  const text = formData.get('message') as string
  addOptimistic(text)
  await sendMessage(text)
}`,
          grammar: 'tsx',
          note: 'Same addOptimistic call as above, this time wired to a form action instead of a click handler.',
        },
        {
          id: 'react-frontier-optimistic-capstone',
          kind: 'capstone',
          label: 'a comment thread that never waits',
          brief:
            'A thread where the new comment appears the instant you submit it, marked as in flight, and is replaced by the real one when the server answers. The merge function does the predicting; the form action does the sending; nothing in between needs a spinner.',
          code: `interface Comment {
  id: string
  text: string
  sending?: boolean
}

export function Thread({ postId, comments }: { postId: string; comments: Comment[] }) {
  const [optimistic, addOptimistic] = useOptimistic(
    comments,
    (state, text: string) => [...state, { id: 'pending', text, sending: true }],
  )
  const [draft, setDraft] = useState('')

  async function submit(formData: FormData) {
    const text = formData.get('comment') as string
    addOptimistic(text)
    setDraft('')
    await postComment(postId, text)
  }

  return (
    <form action={submit}>
      <ul>
        {optimistic.map((comment) => (
          <li key={comment.id} aria-busy={comment.sending}>
            {comment.text}
          </li>
        ))}
      </ul>
      <input name="comment" value={draft} onChange={(e) => setDraft(e.target.value)} />
    </form>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-frontier-actions',
      title: 'Actions and useActionState',
      summary: 'Wiring an async form submission to pending state and returned errors.',
      concept:
        "Passing an async function to a form's action prop lets React manage submission automatically. useActionState wraps that function to also track its pending status and the value it last returned, so a component can show a spinner or a validation error without extra useState calls.",
      sourceUrl: 'https://react.dev/reference/react/useActionState',
      drills: [
        {
          id: 'react-frontier-actions-1',
          label: 'plain form action',
          code: `<form action={async (formData) => {
  await createTodo(formData.get('title') as string)
}}>
  <input name="title" />
</form>`,
          grammar: 'tsx',
          note: 'The bare form action: no pending state or error tracking yet.',
        },
        {
          id: 'react-frontier-actions-2',
          label: 'useActionState for an error message',
          code: `const [error, submitAction, isPending] = useActionState(
  async (_prevError: string | null, formData: FormData) => {
    const ok = await createTodo(formData.get('title') as string)
    return ok ? null : 'Could not save todo'
  },
  null
)`,
          grammar: 'tsx',
          note: 'Adds the (state, dispatch, pending) triple around the same kind of action.',
        },
        {
          id: 'react-frontier-actions-3',
          label: 'rendering the pending and error state',
          code: `<form action={submitAction}>
  <input name="title" disabled={isPending} />
  {error && <p role="alert">{error}</p>}
</form>`,
          grammar: 'tsx',
          note: 'Consumes the isPending and error values that useActionState returned above.',
        },
        {
          id: 'react-frontier-actions-capstone',
          kind: 'capstone',
          label: 'an invite form with validation and pending state',
          brief:
            'A team invite form that keeps no useState at all. useActionState owns the returned result and the pending flag, the action validates before it sends and returns an error instead of throwing, and a child button reads the same submission through useFormStatus.',
          code: `interface InviteResult {
  error: string | null
  sent: number
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Sending' : 'Send invite'}
    </button>
  )
}

export function InviteForm({ teamId }: { teamId: string }) {
  const [result, submitAction, isPending] = useActionState(
    async (prev: InviteResult, formData: FormData): Promise<InviteResult> => {
      const email = formData.get('email') as string
      if (!email.includes('@')) return { ...prev, error: 'That is not an email' }
      await sendInvite(teamId, email)
      return { error: null, sent: prev.sent + 1 }
    },
    { error: null, sent: 0 },
  )

  return (
    <form action={submitAction}>
      <input name="email" type="email" disabled={isPending} />
      {result.error !== null && <p role="alert">{result.error}</p>}
      <p>{result.sent} invites sent</p>
      <SubmitButton />
    </form>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
    {
      id: 'react-frontier-review',
      kind: 'review',
      title: 'Review: a React 19 checkout',
      summary:
        'A checkout flow built from use, useOptimistic and useActionState in the same three files.',
      concept:
        'The three new hooks from this dispatch, meeting in one checkout. The summary reads its data with use and no effect, the quantity stepper predicts the server with useOptimistic, and the order form owns its error and pending state through useActionState and useFormStatus.',
      covers: ['react-frontier-use', 'react-frontier-optimistic', 'react-frontier-actions'],
      drills: [
        {
          id: 'react-frontier-review-1',
          kind: 'capstone',
          label: 'CartSummary.tsx',
          brief:
            'The read side, with no useEffect and no loading flag. One use call pulls the currency out of context, another unwraps the cart promise the parent passed down, and the component suspends by itself until the data lands.',
          code: `const CurrencyContext = createContext('NOK')

export interface CartLine {
  sku: string
  title: string
  qty: number
  price: number
}

export function CartSummary({ cart }: { cart: Promise<CartLine[]> }) {
  const currency = use(CurrencyContext)
  const lines = use(cart)
  const total = lines.reduce((sum, line) => sum + line.qty * line.price, 0)
  return (
    <ul>
      {lines.map((line) => (
        <li key={line.sku}>
          {line.title} x{line.qty} at {line.price} {currency}
        </li>
      ))}
      <li>Total {total} {currency}</li>
    </ul>
  )
}`,
          grammar: 'tsx',
        },
        {
          id: 'react-frontier-review-2',
          kind: 'capstone',
          label: 'QuantityStepper.tsx',
          brief:
            'The write side, shown before it is true. The merge function replaces one line in the list and the stepper reads the optimistic copy rather than the prop. The transition is not decoration: an optimistic update made outside an action or a transition is thrown away, so a plain click handler would render nothing.',
          code: `interface StepperProps {
  line: CartLine
  lines: CartLine[]
}

export function QuantityStepper({ line, lines }: StepperProps) {
  const [optimistic, setOptimistic] = useOptimistic(
    lines,
    (state, next: CartLine) =>
      state.map((row) => (row.sku === next.sku ? next : row)),
  )
  const shown = optimistic.find((row) => row.sku === line.sku) ?? line

  function change(delta: number) {
    const next = { ...shown, qty: Math.max(0, shown.qty + delta) }
    startTransition(async () => {
      setOptimistic(next)
      await updateCartLine(next.sku, next.qty)
    })
  }

  return (
    <span>
      <button onClick={() => change(-1)}>-</button>
      <output>{shown.qty}</output>
      <button onClick={() => change(1)}>+</button>
    </span>
  )
}`,
          grammar: 'tsx',
        },
        {
          id: 'react-frontier-review-3',
          kind: 'capstone',
          label: 'Checkout.tsx',
          brief:
            'The submit. The action validates first and returns an error object rather than throwing, useActionState keeps that result between submissions, the button reads the same pending state through useFormStatus, and the summary from the first file renders inside the form.',
          code: `interface OrderResult {
  error: string | null
  orderId: string | null
}

function PlaceButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Placing' : 'Place order'}</button>
}

export function Checkout({ cart }: { cart: Promise<CartLine[]> }) {
  const [result, placeAction] = useActionState(
    async (prev: OrderResult, formData: FormData): Promise<OrderResult> => {
      const address = formData.get('address') as string
      if (address.length < 5) return { ...prev, error: 'Address looks short' }
      const orderId = await placeOrder(address)
      return { error: null, orderId }
    },
    { error: null, orderId: null },
  )

  return (
    <form action={placeAction}>
      <CartSummary cart={cart} />
      <input name="address" />
      {result.error !== null && <p role="alert">{result.error}</p>}
      <PlaceButton />
    </form>
  )
}`,
          grammar: 'tsx',
        },
      ],
    },
  ],
}
