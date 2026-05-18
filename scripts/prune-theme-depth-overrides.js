#!/usr/bin/env node
/**
 * Remove legacy per-theme depth HTML that shadows samples/_core/layouts/.
 * Keeps paper-ink custom layouts and notebook-tabs/cover.html only.
 *
 * AI-GENERATED (Cursor)
 *
 * Usage: node scripts/prune-theme-depth-overrides.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

/** Themes whose theme-dir depth files should be removed (fall back to _core). */
const PRUNE_THEMES = [
  'electric-studio',
  'creative-voltage',
  'terminal-green',
  'deep-tech-keynote',
  'pastel-geometry',
  'split-pastel',
  'swiss-modern',
  'vintage-editorial',
  'notebook-tabs'
];

/** Never prune — intentional theme overrides (Q0/G2). */
const KEEP_THEME_DIR = new Set(['paper-ink']);

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

/** notebook-tabs: only cover stays in theme dir. */
const KEEP_IN_THEME = {
  'notebook-tabs': new Set(['cover.html', '_content_shell.html', 'content.html'])
};

/** Extra legacy shadows (use shared/). */
const EXTRA_BY_THEME = {
  'bold-signal': ['07_timeline.html', '16_panel_stat.html'],
  'dark-botanical': ['08_two_col.html']
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

for (const theme of PRUNE_THEMES) {
  if (KEEP_THEME_DIR.has(theme)) continue;
  const dir = path.join(ROOT, 'samples', theme);
  if (!fs.existsSync(dir)) continue;
  const keep = KEEP_IN_THEME[theme] || new Set();

  for (const file of DEPTH_FILES) {
    if (keep.has(file)) continue;
    tryRemove(path.join(dir, file));
  }
}

for (const [theme, files] of Object.entries(EXTRA_BY_THEME)) {
  const dir = path.join(ROOT, 'samples', theme);
  for (const file of files) {
    tryRemove(path.join(dir, file));
  }
}

console.log(`\n${DRY ? 'dry-run: ' : ''}removed ${removed}, skipped ${skipped}`);
