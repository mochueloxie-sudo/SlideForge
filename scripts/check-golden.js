#!/usr/bin/env node
/**
 * Golden regression: validate JSON → render HTML → assert no stray tokens / baseline leak.
 *
 * AI-GENERATED (Cursor)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { runCritique } = require('../utils/critique_static');

const ROOT = path.resolve(__dirname, '..');
const EXECUTOR = path.join(ROOT, 'executor.js');

const GOLDEN_SCENES = [
  'examples/golden/product_launch_scenes.json',
  'examples/golden/business_report_scenes.json',
  'examples/golden/humanities_narrative_scenes.json',
  'examples/golden/editorial_notes_scenes.json',
  'examples/golden/variant_showcase_scenes.json'
];

const GOLDEN_OUT = [
  'output_golden/product_launch',
  'output_golden/business_report',
  'output_golden/humanities_narrative',
  'output_golden/editorial_notes',
  'output_golden/variant_showcase'
];

/** @type {{ out: string, scenes: string }[]} */
const GOLDEN_CRITIQUE = GOLDEN_OUT.map((out, i) => ({
  out,
  scenes: GOLDEN_SCENES[i]
}));

const TOKEN_RE = /\{\{[A-Z][A-Z0-9_]*\}\}/g;

let failed = 0;

console.error('── validate golden scenes ──');
for (const scenes of GOLDEN_SCENES) {
  const r = spawnSync('node', [EXECUTOR], {
    cwd: ROOT,
    input: JSON.stringify({ command: 'validate', scenes }),
    encoding: 'utf8'
  });
  const out = r.stdout || '';
  process.stdout.write(out);
  if (!out.includes('"valid": true')) {
    console.error(`❌ validate failed: ${scenes}`);
    failed = 1;
  }
}

console.error('\n── golden:render ──');
const render = spawnSync('node', [path.join(ROOT, 'scripts', 'golden-render.js')], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['inherit', 'inherit', 'inherit']
});
if (render.status !== 0) {
  console.error('❌ golden-render failed');
  process.exit(1);
}

console.error('\n── HTML artifact checks ──');
for (const outDir of GOLDEN_OUT) {
  const abs = path.join(ROOT, outDir);
  if (!fs.existsSync(abs)) {
    console.error(`❌ missing output dir: ${outDir}`);
    failed = 1;
    continue;
  }
  const pages = fs.readdirSync(abs).filter(f => /^page_\d+\.html$/i.test(f));
  if (pages.length === 0) {
    console.error(`❌ no page_*.html in ${outDir}`);
    failed = 1;
    continue;
  }
  let tokens = 0;
  let baseline = 0;
  for (const p of pages) {
    const html = fs.readFileSync(path.join(abs, p), 'utf8');
    const t = html.match(TOKEN_RE);
    if (t) {
      tokens += t.length;
      console.error(`❌ ${outDir}/${p}: unreplaced tokens: ${[...new Set(t)].join(', ')}`);
    }
    if (html.includes('readability baseline')) baseline++;
  }
  if (tokens === 0 && baseline === 0) {
    console.error(`✅ ${outDir}: ${pages.length} pages, no stray tokens, no readability baseline`);
  } else if (baseline > 0) {
    console.error(`❌ ${outDir}: ${baseline} page(s) inject readability baseline (expected minimal enhancement)`);
    failed = 1;
  }
  if (tokens > 0) failed = 1;
}

console.error('\n── critique (HTML static) ──');
for (const { out, scenes } of GOLDEN_CRITIQUE) {
  const abs = path.join(ROOT, out);
  if (!fs.existsSync(abs)) {
    console.error(`⏭ skip critique (missing dir): ${out}`);
    continue;
  }
  const scenesPath = scenes ? path.join(ROOT, scenes) : null;
  const report = runCritique(abs, {
    scenesPath,
    deckName: path.basename(out),
    applyBaseline: true
  });
  const critPath = path.join(abs, 'critique.json');
  fs.writeFileSync(critPath, JSON.stringify(report, null, 2), 'utf8');

  for (const f of report.findings) {
    if (f.level === 'warning' || f.level === 'info') {
      const loc = f.file ? `${out}/${f.file}` : out;
      console.error(`⚠ ${loc}: [${f.code}] ${f.message}`);
    }
  }
  if (report.suppressed?.length) {
    console.error(
      `ℹ ${out}: ${report.suppressed.length} finding(s) suppressed via critique_baseline.json`
    );
  }
  if (!report.ok) {
    for (const f of report.findings) {
      if (f.level === 'error') {
        const loc = f.file ? `${out}/${f.file}` : out;
        console.error(`❌ ${loc}: [${f.code}] ${f.message}`);
      }
    }
    failed = 1;
  } else {
    console.error(
      `✅ ${out}: critique ok (${report.summary.warnings} warnings, ${report.summary.info} info)`
    );
  }
}

if (failed) {
  console.error('\n❌ golden check failed');
  process.exit(1);
}
console.error('\n✅ golden check passed');
