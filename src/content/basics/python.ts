import { SYMBOL_KEYS, type KeyTrack } from './schema'

export const pythonSymbols: KeyTrack = {
  id: 'python-symbols',
  title: 'Python symbols',
  blurb:
    'Colons, dunders, decorators, f-strings, slices and star-args. Python spends its punctuation in different places, so it gets its own track.',
  focus: SYMBOL_KEYS,
  stages: [
    {
      id: 'python-symbols-reps',
      kind: 'reps',
      summary: 'Colons, underscores and the operators Python has that JavaScript does not.',
      grammar: 'plain',
      passages: [
        `:: :: :: __ __ __ ## ## ##
[] [] {} {} () () ** ** //
-> -> := := != != == == @ @`,
        `__x__ __x__ _x _x __ __ __
*a **k *a **k (*a) {**k}
f"{x}" f"{x!r}" f"{x:>8}" f"{x:.2f}"`,
        `[::] [::-1] [1:] [:-1] [::2]
{} {**a} {*a} [*a] (*a,)
'' "" '''doc''' r"\\d+" b"\\x00"`,
      ],
    },
    {
      id: 'python-symbols-patterns',
      kind: 'patterns',
      summary: 'Signatures, comprehensions and decorators — the shapes Python is built from.',
      grammar: 'plain',
      passages: [
        `f(x):  g(*a, **k):  h(a, /, b, *, c):
lambda x: x * 2  lambda *a: a  lambda: {}
-> None:  -> dict[str, int]:  -> tuple[int, ...]:`,
        `[x for x in xs]  {k: v for k, v in d}
[x**2 for x in xs if x % 2]  (y for y in ys)
{**a, **b}  [*a, *b]  {*a, *b}  (*a, *b)`,
        `@dataclass  @property  @app.get("/")  @cache
xs[::2]  xs[1:-1]  xs[::-1]  m[i][j]  d["k"]
a // b  a ** b  a % b  a @ b  a != b  (a := b)`,
      ],
    },
    {
      id: 'python-symbols-code',
      kind: 'code',
      summary: 'Real Python: type hints, context managers, f-strings, keyword-only arguments.',
      grammar: 'python',
      passages: [
        `def load(path: str, *, strict: bool = False) -> dict[str, Any]:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)`,
        `@app.get("/users/{user_id}")
async def read_user(user_id: int, q: str | None = None):
    return {"id": user_id, "q": q}`,
        `class Point:
    __slots__ = ("x", "y")

    def __repr__(self) -> str:
        return f"Point({self.x!r}, {self.y!r})"`,
      ],
    },
    {
      id: 'python-symbols-load',
      kind: 'load',
      summary: 'Nested comprehensions, format specs and slices in one breath.',
      grammar: 'python',
      passages: [
        `totals = {k: sum(v) / len(v) for k, v in groups.items() if v}
top = sorted(totals, key=lambda k: -totals[k])[:3]
print(f"{top[0]!r:>12} {totals[top[0]]:.2f}")`,
        `def merge(*ds: dict[str, Any], **kw: Any) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for d in (*ds, kw):
        out |= {k: v for k, v in d.items() if v is not None}
    return out`,
        `if __name__ == "__main__":
    args = sys.argv[1:]
    pairs = [(a, b) for a, b in zip(args[::2], args[1::2])]
    assert all(k.startswith("--") for k, _ in pairs), pairs
    main(**{k[2:]: v for k, v in pairs})`,
      ],
    },
  ],
}
