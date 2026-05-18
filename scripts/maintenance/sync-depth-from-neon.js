#!/usr/bin/env node
/**
 * Legacy: copied neon-cyber depth HTML → bold-signal / dark-botanical.
 * As of Q1-D, depth layouts live in samples/_core/layouts/ and load via
 * loadTemplateWithSource (no per-theme HTML copies).
 *
 * Keep this script as a no-op hook so `npm run sync:depth-themes` still runs in CI/docs.
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'samples', 'neon-cyber');

/** Add filenames here only if neon gets a theme-only override again. */
const FILES = [];

const THEMES = ['bold-signal', 'dark-botanical'];

if (!FILES.length) {
  console.log('ℹ️  sync:depth-themes — nothing to copy (depth layouts → samples/_core/layouts/)');
  process.exit(0);
}

let wrote = 0;
for (const theme of THEMES) {
  const destDir = path.join(ROOT, 'samples', theme);
  for (const file of FILES) {
    const srcPath = path.join(SRC, file);
    if (!fs.existsSync(srcPath)) {
      console.warn(`skip missing source: ${file}`);
      continue;
    }
    fs.copyFileSync(srcPath, path.join(destDir, file));
    console.log(`  ${theme}/${file}`);
    wrote++;
  }
}
console.log(`\n✅ copied ${wrote} files (verbatim) neon-cyber → ${THEMES.join(', ')}`);
