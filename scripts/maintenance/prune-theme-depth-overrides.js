#!/usr/bin/env node
/**
 * Remove per-theme overrides that shadow samples/_core/layouts/.
 *
 * AI-GENERATED (Cursor)
 *
 * Usage: node scripts/maintenance/prune-theme-depth-overrides.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const DRY = process.argv.includes('--dry-run');

const DEPTH_FILES = [
  '01_text_only.html',
  '02_panel.html',
  '03_stats_grid.html',
  '04_number.html',
  '05_quote.html',
  '20_compare.html',
  '21_process_flow.html',
  'cover.html'
];

/** Per-theme files to keep under themes/{id}/overrides/. */
const KEEP_IN_OVERRIDES = {
  'notebook-tabs': new Set(['cover.html', '_content_shell.html', 'content.html']),
  'paper-ink': new Set(['cover.html', 'content.html']),
  'dark-botanical': new Set(['18_quote_context.html', 'content.html'])
};

let removed = 0;
let skipped = 0;

function tryRemove(filePath) {
  if (!fs.existsSync(filePath)) {
    skipped++;
    return;
  }
  if (DRY) {
    console.log('would remove', path.relative(ROOT, filePath));
  } else {
    fs.unlinkSync(filePath);
    console.log('removed', path.relative(ROOT, filePath));
  }
  removed++;
}

const themesDir = path.join(ROOT, 'samples', 'themes');
for (const theme of fs.readdirSync(themesDir)) {
  const ov = path.join(themesDir, theme, 'overrides');
  if (!fs.existsSync(ov)) continue;
  const keep = KEEP_IN_OVERRIDES[theme] || new Set(['content.html', 'content_no_panel.html']);

  for (const file of DEPTH_FILES) {
    if (keep.has(file)) continue;
    tryRemove(path.join(ov, file));
  }
}

console.log(`\n${DRY ? 'dry-run: ' : ''}removed ${removed}, skipped ${skipped}`);
