#!/usr/bin/env node
/**
 * Remove per-theme code/table/chart/nav_bar/icon_grid/card_grid copies so
 * samples/shared/*.html is used (after Agent B adds shared 11/12/14/15).
 *
 * AI-GENERATED (Cursor)
 *
 * Usage: node scripts/prune-theme-utility-templates.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

const THEMES = fs.readdirSync(path.join(ROOT, 'samples'))
  .filter((d) => {
    const p = path.join(ROOT, 'samples', d);
    return fs.statSync(p).isDirectory() && !d.startsWith('_') && d !== 'shared' && d !== 'themes';
  });

const UTILITY_FILES = [
  '10_icon_grid.html',
  '11_code_block.html',
  '12_table.html',
  '13_card_grid.html',
  '14_nav_bar.html',
  '15_chart_demo.html',
  '06_hairline.html'
];

/** paper-ink keeps custom card_grid / icon if present — optional; wave 3 uses shared */
const SKIP_THEMES = new Set(['paper-ink']);

let removed = 0;

for (const theme of THEMES) {
  if (SKIP_THEMES.has(theme)) continue;
  for (const file of UTILITY_FILES) {
    const fp = path.join(ROOT, 'samples', theme, file);
    if (!fs.existsSync(fp)) continue;
    if (DRY) console.log('would remove', path.relative(ROOT, fp));
    else {
      fs.unlinkSync(fp);
      console.log('removed', path.relative(ROOT, fp));
    }
    removed++;
  }
}

console.log(`\n${DRY ? 'dry-run: ' : ''}removed ${removed} utility template(s)`);
