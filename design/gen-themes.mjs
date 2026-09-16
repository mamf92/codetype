// Emits the four theme artboards from one palette table, so they stay
// structurally identical and differ only in colour.
import { writeFileSync } from 'node:fs'

const THEMES = {
  DarkCurrent: {
    label: 'Dark · current', note: 'untyped code 1.96:1 — below AA',
    v: { bg:'#0c0a08', panel:'linear-gradient(to bottom,#15120e,#100d0a)', line:'#241d15',
         text:'#e8dccb', muted:'#8f8172', faint:'#6f6355', pending:'#4a4036',
         amber:'#ffb000', signal:'#3ddbd9', fault:'#e24b3f', scan:'rgba(255,176,0,0.028)',
         kw:'#ffb000', id:'#e8dccb', num:'#ffd27a', punc:'#8f8172' } },
  DarkContrast: {
    label: 'Dark · high contrast', note: 'untyped code 5.99:1 — clears AA',
    v: { bg:'#060505', panel:'linear-gradient(to bottom,#161310,#0e0c0a)', line:'#3a3129',
         text:'#f7efe3', muted:'#c3b6a5', faint:'#ab9e8d', pending:'#97897a',
         amber:'#ffc247', signal:'#5fe9e1', fault:'#ff7063', scan:'rgba(255,194,71,0.022)',
         kw:'#ffc247', id:'#f7efe3', num:'#ffd68a', punc:'#c3b6a5' } },
  Light: {
    label: 'Light', note: 'untyped code 4.74:1 — clears AA',
    v: { bg:'#f4eee3', panel:'linear-gradient(to bottom,#fdfbf6,#efe7d9)', line:'#d9cfbd',
         text:'#1f1913', muted:'#5e5448', faint:'#6b6154', pending:'#726859',
         amber:'#8a4f00', signal:'#0f6a66', fault:'#a32a1d', scan:'rgba(120,80,0,0.030)',
         kw:'#8a4f00', id:'#1f1913', num:'#7a4a00', punc:'#5e5448' } },
  LightContrast: {
    label: 'Light · high contrast', note: 'untyped code 7.89:1 — clears AAA',
    v: { bg:'#fdfbf6', panel:'linear-gradient(to bottom,#ffffff,#f7f2e9)', line:'#c4b8a4',
         text:'#0a0805', muted:'#3d362c', faint:'#453d32', pending:'#574e42',
         amber:'#6b3c00', signal:'#0a4f4c', fault:'#7d1d11', scan:'rgba(80,50,0,0.034)',
         kw:'#6b3c00', id:'#0a0805', num:'#5c3700', punc:'#3d362c' } },
}

for (const [name, { label, note, v }] of Object.entries(THEMES)) {
  const vars = Object.entries(v).map(([k, val]) => `--${k}: ${val};`).join(' ')
  writeFileSync(`parts-themes/${name}.body.html`, `<div class="screen" style="${vars}">
  <div class="pad">

    <div class="themetag">
      <span class="themename">${label}</span>
      <span class="ratio">${note}</span>
    </div>

    <div class="chips">
      <span class="chip done">direct value</span>
      <span class="chip on">updater with previous state</span>
      <span class="chip">updater on an object</span>
      <span class="chip">toggling in a callback</span>
    </div>

    <div class="surface">
      <pre class="code"><span style="color: var(--kw)">const</span><span style="color: var(--punc)"> [</span><span style="color: var(--id)">count</span><span style="color: var(--punc)">, </span><span style="color: var(--id)">setCount</span><span style="color: var(--punc)">] = </span><span style="color: var(--id)">useState</span><span style="color: var(--punc)">(</span><span style="color: var(--num)">0</span><span style="color: var(--punc)">)</span>
<span style="color: var(--id)">setCount</span><span style="color: var(--punc)">((</span><span style="color: var(--id)">pr</span><span style="color: var(--fault); background: color-mix(in srgb, var(--fault) 14%, transparent); border-bottom: 2px solid var(--fault)">e</span><span class="caret"></span><span style="color: var(--pending)">v) =&gt; prev + 1)</span></pre>
    </div>

    <div class="hud">
      <div class="cell"><span class="cap">Speed</span><span><b style="color: var(--amber)">71</b></span></div>
      <div class="cell"><span class="cap">Accuracy</span><span><b style="color: var(--signal)">92</b></span></div>
      <div class="cell"><span class="cap">Missed</span><span><b style="color: var(--fault)">1</b></span></div>
      <div class="cell"><span class="cap">Passage 2 of 21</span>
        <div style="height: 4px; background: var(--line); margin-top: 4px;">
          <div style="width: 58%; height: 100%; background: var(--amber);"></div>
        </div>
      </div>
    </div>

  </div>
</div>
`)
  console.log('wrote', name)
}
