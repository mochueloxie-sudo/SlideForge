#!/usr/bin/env node
/**
 * One-time: samples/{theme}/* → samples/themes/{theme}/overrides/*;
 * prune paper-ink depth dupes; remove legacy theme root dirs.
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SAMPLES = path.join(ROOT, 'samples');
const THEMES = path.join(SAMPLES, 'themes');

const SKIP = new Set(['_core', 'shared', 'themes', '.DS_Store']);

const PAPER_INK_DEPTH_PRUNE = new Set([
  '01_text_only.html', '02_panel.html', '03_stats_grid.html', '04_number.html',
  '05_quote.html', '10_icon_grid.html', '11_code_block.html', '12_table.html',
  '13_card_grid.html', '14_nav_bar.html', '15_chart_demo.html', '20_compare.html'
]);

const LEGACY_DROP = ['00_cover.html'];

const themeDirs = fs.readdirSync(SAMPLES).filter(name => {
  const p = path.join(SAMPLES, name);
  return !SKIP.has(name) && fs.statSync(p).isDirectory();
});

for (const theme of themeDirs) {
  const srcDir = path.join(SAMPLES, theme);
  const destDir = path.join(THEMES, theme, 'overrides');
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith('.html')) continue;
    const from = path.join(srcDir, file);
    const to = path.join(destDir, file);
    if (fs.existsSync(to)) fs.unlinkSync(to);
    fs.renameSync(from, to);
    console.log('moved', path.relative(ROOT, from), '→', path.relative(ROOT, to));
  }
  const left = fs.readdirSync(srcDir);
  if (left.length === 0) {
    fs.rmdirSync(srcDir);
    console.log('removed empty', path.relative(ROOT, srcDir));
  } else {
    console.warn('leftover in', srcDir, left);
  }
}

const paperOverrides = path.join(THEMES, 'paper-ink', 'overrides');
if (fs.existsSync(paperOverrides)) {
  for (const f of PAPER_INK_DEPTH_PRUNE) {
    const p = path.join(paperOverrides, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('pruned paper-ink dupe', f);
    }
  }
}

for (const theme of fs.readdirSync(THEMES)) {
  const ov = path.join(THEMES, theme, 'overrides');
  if (!fs.existsSync(ov)) continue;
  for (const f of LEGACY_DROP) {
    const p = path.join(ov, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('dropped legacy', path.relative(ROOT, p));
    }
  }
}

console.log('\nDone migrate-samples-layout.js');
