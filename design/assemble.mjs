// Wraps each artboard body in the Design Component shell with the shared
// phosphor stylesheet, so the four screens cannot drift apart visually.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const shared = readFileSync('_shared.css', 'utf8')
const FONTS =
  'https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;400;600&family=Martian+Mono:wght@300;400;500;600&display=swap'

for (const file of readdirSync('parts').filter((f) => f.endsWith('.body.html'))) {
  const name = file.replace('.body.html', '')
  const body = readFileSync(`parts/${file}`, 'utf8')
  const out = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="${FONTS}">
  <style>
${shared}  </style>
</helmet>
${body.trimEnd()}
</x-dc>
</body>
</html>
`
  writeFileSync(`${name}.dc.html`, out)
  console.log(`${name}.dc.html  ${out.length} bytes`)
}
