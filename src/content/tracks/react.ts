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
      ],
    },
  ],
}
