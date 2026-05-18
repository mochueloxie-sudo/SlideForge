#!/usr/bin/env node
/**
 * check-scenes.js — convenience wrapper for `validate`
 *
 * AI-GENERATED (Cursor)
 *
 * Spares humans from typing `echo '{"command":"validate",...}' | node executor.js`.
 * Agents should still call executor.js directly (this script is for the
 * developer / CI ergonomics; the canonical API is the JSON contract).
 *
 * Usage:
 *   npm run check -- <path/to/scenes.json> [more paths ...]
 *   npm run check:all                                       # whitelist
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const useAll = args.includes('--all');

// `--all` runs the full examples set (matches CI's glob).
const ALL_EXAMPLES = [
  'examples/scenes_example.json',
  'examples/four_new_variants_scenes.json',
  'examples/tencent_intro_scenes_fixture.json',
  'examples/verify_notebook_shell_scenes.json',
];

const GOLDEN_EXAMPLES = [
  'examples/golden/product_launch_scenes.json',
  'examples/golden/business_report_scenes.json',
  'examples/golden/humanities_narrative_scenes.json',
];

const useGolden = args.includes('--golden');

const files = useGolden
  ? GOLDEN_EXAMPLES
  : useAll
    ? ALL_EXAMPLES
    : args.filter(a => !a.startsWith('-'));

if (files.length === 0) {
  console.error('Usage: npm run check -- <path/to/scenes.json> [more...]');
  console.error('       npm run check:all          # check the v4-schema whitelist');
  console.error('       npm run check:golden       # validate + golden:render + HTML regression');
  process.exit(2);
}

const executor = path.resolve(__dirname, '..', 'executor.js');

(async () => {
  let anyFail = 0;
  for (const f of files) {
    if (files.length > 1) console.log(`\n── ${f} ──`);
    const out = await runValidate(f);
    process.stdout.write(out);
    if (!out.includes('"valid": true')) {
      anyFail = 1;
    }
  }
  if (files.length > 1) {
    console.log(`\n── summary ──`);
    console.log(anyFail ? '❌ one or more files failed validation' : `✅ all ${files.length} files passed`);
  }
  process.exit(anyFail);
})();

function runValidate(file) {
  return new Promise((resolve, reject) => {
    const p = spawn('node', [executor], { stdio: ['pipe', 'pipe', 'inherit'] });
    let out = '';
    p.stdout.on('data', d => (out += d));
    p.on('error', reject);
    p.on('close', () => resolve(out));
    p.stdin.end(JSON.stringify({ command: 'validate', scenes: file }));
  });
}
