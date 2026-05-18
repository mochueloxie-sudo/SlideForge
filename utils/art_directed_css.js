/**
 * Q2-A — Sanitize scene.custom_css for art-directed pages (strip-only policy).
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @param {string} raw
 * @param {{ sceneId?: string|number }} [ctx]
 * @returns {{ css: string, warnings: string[] }}
 */
function sanitizeArtDirectedCss(raw, ctx = {}) {
  const warnings = [];
  if (raw == null || String(raw).trim() === '') {
    return { css: '', warnings };
  }
  let css = String(raw);

  if (/@import\b/i.test(css)) {
    warnings.push('ART_DIRECTED_STRIP: removed @import (network / perf policy)');
    css = css.replace(/@import[^;]+;/gi, '');
  }

  if (/@font-face\b/i.test(css)) {
    warnings.push('ART_DIRECTED_STRIP: removed @font-face block(s)');
    css = css.replace(/@font-face\s*\{[^}]*\}/gi, '');
  }

  if (/@media\b/i.test(css)) {
    warnings.push('ART_DIRECTED_STRIP: removed @media block(s) (fixed 1920×1080 canvas)');
    css = stripMediaBlocks(css);
  }

  if (/url\s*\(\s*['"]?https?:\/\//i.test(css)) {
    warnings.push('ART_DIRECTED_STRIP: removed url(http...) references (use hero_image / local assets)');
    css = css.replace(/url\s*\(\s*['"]?https?:\/\/[^)]+\)/gi, 'none');
  }

  // html/body viewport tampering
  const badViewport = /\b(html|body)\s*\{[^}]*\b(width|height)\s*:\s*(100vw|100vh|100%)/gi;
  if (badViewport.test(css)) {
    warnings.push('ART_DIRECTED_STRIP: removed width/height rules on html/body that risk viewport escape');
    css = css.replace(badViewport, '$1 { /* stripped viewport override */ ');
  }

  if (/\b(html|body)\s*\{[^}]*\bposition\s*:\s*(fixed|sticky)/gi.test(css)) {
    warnings.push('ART_DIRECTED_STRIP: removed position:fixed|sticky on html/body');
    css = css.replace(
      /\b(html|body)\s*\{[^}]*\bposition\s*:\s*(fixed|sticky)[^;}]*;?/gi,
      ''
    );
  }

  // Oversized font guard (px only)
  css = css.replace(/font-size\s*:\s*(\d+)px/gi, (match, n) => {
    const px = parseInt(n, 10);
    if (px > 400) {
      warnings.push(`ART_DIRECTED_STRIP: clamped font-size ${px}px → 400px`);
      return 'font-size: 400px';
    }
    return match;
  });

  return { css: css.trim(), warnings };
}

function stripMediaBlocks(css) {
  let s = css;
  let guard = 0;
  while (guard++ < 500) {
    const m = s.match(/@media\b[^{]*\{/i);
    if (!m || m.index === undefined) break;
    const start = m.index;
    const openBrace = start + m[0].length - 1;
    let depth = 1;
    let j = openBrace + 1;
    while (j < s.length && depth > 0) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}') depth--;
      j++;
    }
    s = s.slice(0, start) + s.slice(j);
  }
  return s;
}

/**
 * @param {string} filePath relative or absolute
 * @param {{ scenesPath?: string|null, cwd?: string }} ctx
 */
function readCustomCssFile(filePath, ctx = {}) {
  const raw = String(filePath || '').trim();
  if (!raw) return { content: null, resolved: null, warning: null };

  const candidates = [];
  if (path.isAbsolute(raw)) {
    candidates.push(raw);
  } else {
    if (ctx.scenesPath) {
      candidates.push(path.join(path.dirname(path.resolve(ctx.scenesPath)), raw));
    }
    if (ctx.cwd) {
      candidates.push(path.join(path.resolve(ctx.cwd), raw));
    }
    candidates.push(path.join(process.cwd(), raw));
  }

  for (const p of candidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return { content: fs.readFileSync(p, 'utf8'), resolved: p, warning: null };
      }
    } catch (_) { /* ignore */ }
  }
  return {
    content: null,
    resolved: null,
    warning: `custom_css_file not found: ${raw}`
  };
}

module.exports = {
  sanitizeArtDirectedCss,
  readCustomCssFile
};
