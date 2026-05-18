#!/usr/bin/env node
/**
 * Wave 3 coordinator: fix shared templates, generate theme tokens, extend golden showcase.
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');
const { buildDepthTokensCss } = require('../utils/depth_tokens_from_tpl');
const { DESIGN_TEMPLATES } = require('../utils/html_generator');

const ROOT = path.resolve(__dirname, '..');

function fixMotionTypos(filePath) {
  if (!fs.existsSync(filePath)) return;
  let s = fs.readFileSync(filePath, 'utf8');
  const next = s.replace(/<\/?motion\.div/g, (m) => m.replace('motion.', ''));
  if (next !== s) {
    fs.writeFileSync(filePath, next);
    console.log('fixed tags', path.relative(ROOT, filePath));
  }
}

function upgradeLegacyTokens(filePath) {
  if (!fs.existsSync(filePath)) return;
  let s = fs.readFileSync(filePath, 'utf8');
  if (s.includes('var(--sf-font)')) return;
  const map = [
    [/background:\s*\{\{BODY_BG\}\}/g, 'background: var(--sf-page-bg-panel, var(--sf-body-gradient, var(--sf-body-bg)))'],
    [/font-family:\s*'\{\{FONT\}\}'/g, 'font-family: var(--sf-font'],
    [/color:\s*\{\{TEXT_PRIMARY\}\}/g, 'color: var(--sf-text-primary)'],
    [/color:\s*\{\{TEXT_SECONDARY\}\}/g, 'color: var(--sf-text-secondary)'],
    [/color:\s*\{\{TEXT_MUTED\}\}/g, 'color: var(--sf-text-muted)'],
    [/color:\s*\{\{EYEBROW_COLOR\}\}/g, 'color: var(--sf-eyebrow)'],
    [/color:\s*\{\{ACCENT\}\}/g, 'color: var(--sf-accent)'],
    [/color:\s*\{\{ACCENT_LIGHT\}\}/g, 'color: var(--sf-accent-light, var(--sf-accent))'],
    [/background:\s*\{\{PANEL_BG\}\}/g, 'background: var(--sf-panel-bg)'],
    [/border:\s*\{\{PANEL_BORDER\}\}/g, 'border: var(--sf-panel-border)'],
    [/border-top:\s*\{\{PANEL_BORDER_TOP\}\}/g, 'border-top: var(--sf-panel-border-top)'],
    [/border-bottom:\s*\{\{PANEL_BORDER_BOTTOM\}\}/g, 'border-bottom: var(--sf-panel-border-bottom)'],
    [/box-shadow:\s*\{\{PANEL_SHADOW\}\}/g, 'box-shadow: var(--sf-panel-shadow)'],
    [/border-radius:\s*\{\{PANEL_RADIUS\}\}/g, 'border-radius: var(--sf-panel-radius, 20px)'],
    [/background:\s*\{\{HAIRLINE_COLOR\}\}/g, 'background: var(--sf-hairline)'],
    [/border[^;]*:\s*1px solid \{\{HAIRLINE_COLOR\}\}/g, 'border-color: var(--sf-hairline)'],
    [/backdrop-filter:\s*blur\(\{\{PANEL_BLUR\}\}\)/g, 'backdrop-filter: blur(12px']
  ];
  for (const [re, rep] of map) s = s.replace(re, rep);
  fs.writeFileSync(filePath, s);
  console.log('upgraded tokens', path.relative(ROOT, filePath));
}

const SHARED_UPGRADE = [
  '17_number_bullets.html',
  '18_quote_context.html',
  '19_text_icons.html'
];

for (const f of SHARED_UPGRADE) upgradeLegacyTokens(path.join(ROOT, 'samples/shared', f));

fixMotionTypos(path.join(ROOT, 'samples/shared/11_code_block.html'));

for (const dup of ['03_stats_grid.html', '20_compare.html', '21_process_flow.html']) {
  const p = path.join(ROOT, 'samples/shared', dup);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('removed duplicate', dup);
  }
}

const NEED_TOKENS = [
  'paper-ink',
  'terminal-green',
  'deep-tech-keynote',
  'creative-voltage',
  'notebook-tabs',
  'pastel-geometry',
  'split-pastel'
];

for (const theme of NEED_TOKENS) {
  const dir = path.join(ROOT, 'samples/themes', theme);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'tokens.css');
  if (fs.existsSync(out)) continue;
  const tpl = DESIGN_TEMPLATES[theme];
  if (!tpl) {
    console.warn('no tpl', theme);
    continue;
  }
  const css = buildDepthTokensCss(tpl, theme);
  fs.writeFileSync(
    out,
    `/* Q1-A — ${theme} tokens (generated wave 3) */\n/* Contract: samples/_core/TOKENS.md */\n${css}\n`
  );
  console.log('wrote', out);
}

console.log('\nDone wave3-finish.js — run prune-theme-utility-templates.js + check:golden');
