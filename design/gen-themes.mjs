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
    label: 'Dark · high contrast', note: 'untyped code 7.73:1 — clears AAA',
    v: { bg:'#050404', panel:'linear-gradient(to bottom,#171310,#0d0b09)', line:'#40372d',
         text:'#fbf5ec', muted:'#d6cbbb', faint:'#c2b6a4', pending:'#ab9d8b',
         amber:'#ffc76b', signal:'#74efe6', fault:'#ff8a7d', scan:'rgba(255,199,107,0.020)',
         kw:'#ffc76b', id:'#fbf5ec', num:'#ffd89a', punc:'#c2b6a4' } },
  Light: {
    label: 'Light · monochrome screen', note: 'untyped code 4.73:1 — clears AA',
    v: { bg:'#edf0f5', panel:'linear-gradient(to bottom,#f8fafc,#e6eaf1)', line:'#c9d1de',
         text:'#101a2b', muted:'#3f4b5c', faint:'#4a5666', pending:'#5f6b7d',
         amber:'#1b4a8f', signal:'#0a6058', fault:'#a82217', scan:'rgba(20,45,90,0.030)',
         kw:'#1b4a8f', id:'#101a2b', num:'#2d6099', punc:'#4a5666' } },
  LightContrast: {
    label: 'Light · high contrast', note: 'untyped code 9.09:1 — clears AAA',
    v: { bg:'#f7f9fc', panel:'linear-gradient(to bottom,#ffffff,#eef2f8)', line:'#aab7c9',
         text:'#05090f', muted:'#242f3d', faint:'#2b3746', pending:'#3b4654',
         amber:'#10336b', signal:'#04433e', fault:'#7a150c', scan:'rgba(10,30,70,0.034)',
         kw:'#10336b', id:'#05090f', num:'#1c477f', punc:'#2b3746' } },
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
