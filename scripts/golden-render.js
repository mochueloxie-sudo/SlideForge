#!/usr/bin/env node
/**
 * golden-render.js — render all golden decks with their reference themes.
 *
 * AI-GENERATED (Cursor)
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SETS = [
  { name: 'product_launch', scenes: 'examples/golden/product_launch_scenes.json', theme: 'neon-cyber' },
  { name: 'business_report', scenes: 'examples/golden/business_report_scenes.json', theme: 'bold-signal' },
  { name: 'humanities_narrative', scenes: 'examples/golden/humanities_narrative_scenes.json', theme: 'dark-botanical' }
];

function run(cmd) {
  const r = spawnSync('node', [path.join(ROOT, 'executor.js')], {
    input: JSON.stringify(cmd),
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit']
  });
  if (r.status !== 0) {
    process.exit(r.status || 1);
  }
  const out = r.stdout || '';
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(`executor returned no JSON for ${cmd.command}`);
  return JSON.parse(out.slice(start, end + 1));
}

for (const set of SETS) {
  const out = path.join(ROOT, 'output_golden', set.name);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const scenesPath = path.join(ROOT, set.scenes);
  console.error(`\n── ${set.name} (${set.theme}) ──`);
  run({ command: 'design', scenes: scenesPath, output_dir: out, design_mode: set.theme });
  run({
    command: 'html',
    scenes: scenesPath,
    design_params: path.join(out, 'design_params.json'),
    output_dir: out
  });
  const pages = fs.readdirSync(out).filter(f => /^page_\d+\.html$/.test(f));
  console.error(`   ✅ ${pages.length} pages → ${out}`);
}

console.error('\n✅ all golden sets rendered');
