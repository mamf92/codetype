// Theme artboards share structure and differ only in the custom properties
// each one sets on its root, so the four palettes cannot drift apart.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const base = readFileSync('themes-base.css', 'utf8')
const FONTS =
  'https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;400;600&family=Martian+Mono:wght@300;400;500;600&display=swap'

for (const file of readdirSync('parts-themes').filter((f) => f.endsWith('.body.html'))) {
  const name = file.replace('.body.html', '')
  const body = readFileSync(`parts-themes/${file}`, 'utf8')
  writeFileSync(
    `themes/${name}.dc.html`,
    `<!doctype html>
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
${base}  </style>
</helmet>
${body.trimEnd()}
</x-dc>
</body>
</html>
`,
  )
  console.log(`themes/${name}.dc.html`)
}
