// Summarize interaction deltas from ia_<label>.json
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const label = process.argv[2] || 'desktop';
const data = JSON.parse(await readFile(join(__dirname, 'out', 'interactions', `ia_${label}.json`), 'utf8'));

function diffLayer(a, b) {
  // a,b are arrays of {sel, s}. Match by sel.
  const out = [];
  const bMap = new Map(b.map((l) => [l.sel, l.s]));
  for (const la of a) {
    const sb = bMap.get(la.sel);
    if (!sb) continue;
    const changed = {};
    for (const k of Object.keys(la.s)) {
      if (la.s[k] !== sb[k]) changed[k] = `${la.s[k]}  ->  ${sb[k]}`;
    }
    if (Object.keys(changed).length) out.push({ sel: la.sel, changed });
  }
  return out;
}

for (const el of data) {
  const hdr = `[${el.id}] ${el.tag} ${el.name ? '(' + el.name + ')' : ''} "${el.text}" ${el.href ? '-> ' + el.href.slice(0, 40) : ''}`;
  const hoverDelta = diffLayer(el.default, el.hover);
  const activeDelta = diffLayer(el.default, el.active);
  const focusDelta = diffLayer(el.default, el.focus);
  const loops = [];
  for (const layer of el.default) {
    if (layer.s.animationName && layer.s.animationName !== 'none') {
      loops.push(`${layer.sel}: ${layer.s.animationName} ${layer.s.animationDuration} ${layer.s.animationTimingFunction} x${layer.s.animationIterationCount} ${layer.s.animationDirection}`);
    }
  }
  console.log('\n' + hdr);
  if (loops.length) console.log('  LOOPS: ' + loops.join(' | '));
  const showDelta = (name, d) => {
    if (!d.length) { console.log(`  ${name}: (no change)`); return; }
    for (const layer of d) {
      const keys = Object.keys(layer.changed).filter((k) => !k.startsWith('animation'));
      if (!keys.length) continue;
      console.log(`  ${name} [${layer.sel}]:`);
      for (const k of keys) console.log(`      ${k}: ${layer.changed[k]}`);
    }
  };
  showDelta('HOVER', hoverDelta);
  showDelta('ACTIVE', activeDelta);
  showDelta('FOCUS', focusDelta);
  // transitions on self
  const self = el.default.find((l) => l.sel === 'self');
  if (self && self.s.transitionDuration !== '0s') {
    console.log(`  transition: ${self.s.transitionProperty} ${self.s.transitionDuration} ${self.s.transitionTimingFunction} ${self.s.transitionDelay}`);
  }
  if (Object.keys(el.keyframes || {}).length) {
    for (const [n, kf] of Object.entries(el.keyframes)) console.log(`  @keyframes ${n}: ${kf ? kf.slice(0, 300) : '(not found)'}`);
  }
}
