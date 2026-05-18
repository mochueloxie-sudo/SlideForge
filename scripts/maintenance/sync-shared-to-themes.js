#!/usr/bin/env node
/**
 * Copy shared/ variants into theme dirs (token placeholders preserved).
 * Used so golden decks prefer theme-local samples over generic shared/.
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHARED = path.join(ROOT, 'samples', 'shared');

/** theme → shared files that deck actually uses */
const MAP = {
  'bold-signal': ['07_timeline.html', '16_panel_stat.html'],
  'dark-botanical': ['08_two_col.html', '18_quote_context.html']
};

let n = 0;
for (const [theme, files] of Object.entries(MAP)) {
  const destDir = path.join(ROOT, 'samples', theme);
  for (const file of files) {
    const src = path.join(SHARED, file);
    if (!fs.existsSync(src)) {
      console.warn(`missing shared/${file}`);
      continue;
    }
    fs.copyFileSync(src, path.join(destDir, file));
    console.log(`  ${theme}/${file}`);
    n++;
  }
}
console.log(`\n✅ copied ${n} shared variants → ${Object.keys(MAP).join(', ')}`);
