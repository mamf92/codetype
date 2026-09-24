import { SYMBOL_KEYS, type KeyTrack } from './schema'

export const shellSymbols: KeyTrack = {
  id: 'shell-symbols',
  title: 'Shell symbols',
  blurb:
    'Pipes, redirects, flags, globs and parameter expansion — the terminal is where punctuation is densest and a typo costs the most.',
  focus: SYMBOL_KEYS,
  stages: [
    {
      id: 'shell-symbols-reps',
      kind: 'reps',
      summary: 'Pipes, redirects, dollars and dashes on their own.',
      grammar: 'plain',
      passages: [
        `| | | || || || && && &&
> > > >> >> >> < < <
$ $ $ $() $() \${} \${}`,
        `~ ~ ~/ ~/ ./ ./ ../ ../
- - -- -- -v -rf --help
* * ** ? ? ! ! ; ; \\ \\`,
        `'' "" 2> 2>&1 &> /dev/null
"$1" "$@" "$#" "$?" "$HOME"
[[ ]] [ ] (( )) { } # #!`,
      ],
    },
    {
      id: 'shell-symbols-patterns',
      kind: 'patterns',
      summary: 'Pipelines, redirects and expansions, the way a command line strings them together.',
      grammar: 'plain',
      passages: [
        `ls -la | grep -v '^d' | wc -l
cat *.log | sort | uniq -c | sort -rn
ps -ef | grep -- --watch | awk '{print $2}'`,
        `cmd > out 2>&1  cmd >> log 2> err
cmd < in | tee -a out  cmd &> /dev/null
cmd && ok || fail  (cd /tmp && ls); echo $?`,
        `"\${name:-anon}" "\${#list[@]}"
"$(date +%F)" "\${file%.*}"
"\${path##*/}" "$((n + 1))"`,
      ],
    },
    {
      id: 'shell-symbols-code',
      kind: 'code',
      summary: 'Commands you run every day, typed without looking down.',
      grammar: 'bash',
      passages: [
        `git log --oneline -n 20 | grep -i fix
git diff main...HEAD -- src/ | less
git stash push -m "wip: $(date +%H%M)"`,
        `find . -name '*.ts' -not -path './node_modules/*'
grep -rn 'TODO' src/ | cut -d: -f1 | sort -u
xargs -I{} echo {} < files.txt`,
        `export PATH="$HOME/.local/bin:$PATH"
alias gs='git status -sb'
[ -f .env ] && source .env || echo 'no .env'`,
      ],
    },
    {
      id: 'shell-symbols-load',
      kind: 'load',
      summary: 'Loops, traps and continuation lines — scripts, not commands.',
      grammar: 'bash',
      passages: [
        `for f in src/**/*.{ts,tsx}; do
  [[ -s "$f" ]] || continue
  echo "$(wc -l < "$f") $f"
done | sort -rn | head -n 10`,
        `curl -fsSL "https://api.example.com/v1/items?page=\${PAGE:-1}" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'Accept: application/json' | jq '.items[] | {id, name}'`,
        `set -euo pipefail
trap 'rm -rf "$tmp"' EXIT
tmp="$(mktemp -d)"
: "\${1:?usage: $0 <dir>}"
cp -r "$1"/. "$tmp"/ && ls -A "$tmp" | wc -l`,
      ],
    },
  ],
}
