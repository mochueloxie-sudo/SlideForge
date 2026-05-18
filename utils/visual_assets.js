/**
 * Q1-B — hero_image / diagram / brand_mark resolution + HTML.
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * @param {string} raw
 * @param {{ scenesPath?: string, outputDir?: string }} ctx
 * @returns {{ url: string|null, warning?: string }}
 */
function resolveVisualAsset(raw, ctx = {}) {
  if (raw == null || String(raw).trim() === '') {
    return { url: null };
  }
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) {
    return { url: s };
  }

  const candidates = [];
  if (path.isAbsolute(s)) {
    candidates.push(s);
  } else {
    if (ctx.scenesPath) {
      candidates.push(path.join(path.dirname(path.resolve(ctx.scenesPath)), s));
    }
    if (ctx.outputDir) {
      candidates.push(path.join(path.resolve(ctx.outputDir), s));
    }
    candidates.push(path.join(ROOT, s));
    candidates.push(path.resolve(s));
  }

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return { url: toHtmlAssetUrl(p, ctx.outputDir) };
    }
  }
  return {
    url: null,
    warning: `visual asset not found: ${s} (tried ${candidates.slice(0, 3).join(', ')})`
  };
}

/**
 * Relative URL from generated page dir → asset (works with preview_server).
 */
function toHtmlAssetUrl(absPath, outputDir) {
  const abs = path.resolve(absPath);
  const out = path.resolve(outputDir || ROOT);
  let rel = path.relative(out, abs);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
    return rel.split(path.sep).join('/');
  }
  const fromRoot = path.relative(ROOT, abs);
  if (!fromRoot.startsWith('..')) {
    const ups = path.relative(out, ROOT).split(path.sep).filter(Boolean);
    const prefix = ups.length ? ups.map(() => '..').join('/') + '/' : '';
    return prefix + fromRoot.split(path.sep).join('/');
  }
  return 'file://' + abs.split(path.sep).join('/');
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * Build visual slot inner HTML (priority: hero_image > diagram > brand_mark).
 * @param {object} scene
 * @param {object} ctx
 * @returns {{ html: string, warnings: string[] }}
 */
function buildVisualSlotContent(scene, ctx = {}) {
  const warnings = [];
  const pick = [
    ['hero_image', 'vp-hero-image', 'cover'],
    ['diagram', 'vp-diagram-image', 'contain'],
    ['brand_mark', 'vp-brand-mark', 'contain']
  ];

  let firstMissing = null;
  for (const [field, className, fit] of pick) {
    if (!scene[field]) continue;
    const { url, warning } = resolveVisualAsset(scene[field], ctx);
    if (warning) warnings.push(warning);
    if (!url) {
      if (!firstMissing) firstMissing = { field, raw: String(scene[field]).trim() };
      continue;
    }
    const alt = escapeAttr(scene.visual_alt || scene.title || '');
    const fitCss = fit === 'cover' ? 'object-fit:cover' : 'object-fit:contain; padding:24px';
    return {
      html: `<img class="${className}" src="${escapeAttr(url)}" alt="${alt}" style="width:100%;height:100%;${fitCss};border-radius:inherit;display:block;" />`,
      warnings
    };
  }

  // Q1-B fallback: scene declared a visual but file not resolved → SVG placeholder.
  // Keeps the slot visually filled and marks it `data-vp-placeholder` for human review.
  if (firstMissing) {
    return {
      html: buildPlaceholderSvg(firstMissing, scene),
      warnings
    };
  }
  return { html: '', warnings };
}

function buildPlaceholderSvg({ field, raw }, scene) {
  const label = escapeAttr(scene.visual_alt || scene.title || raw || field);
  const meta = escapeAttr(`${field.toUpperCase()} · ${raw}`);
  return [
    `<svg data-vp-placeholder="${escapeAttr(field)}" data-vp-placeholder-src="${escapeAttr(raw)}"`,
    `     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" preserveAspectRatio="xMidYMid slice"`,
    `     style="width:100%;height:100%;display:block;border-radius:inherit;background:transparent;">`,
    `  <defs><pattern id="vp-ph-grid" width="48" height="48" patternUnits="userSpaceOnUse">`,
    `    <path d="M48 0H0V48" fill="none" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/>`,
    `  </pattern></defs>`,
    `  <rect width="960" height="720" fill="url(#vp-ph-grid)" color="currentColor"/>`,
    `  <g fill="none" stroke="currentColor" stroke-opacity="0.45" stroke-width="2">`,
    `    <rect x="48" y="48" width="864" height="624" rx="20"/>`,
    `    <line x1="48" y1="48" x2="912" y2="672"/>`,
    `    <line x1="912" y1="48" x2="48" y2="672"/>`,
    `  </g>`,
    `  <text x="480" y="380" text-anchor="middle" fill="currentColor" fill-opacity="0.85"`,
    `        font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="600">${label}</text>`,
    `  <text x="480" y="430" text-anchor="middle" fill="currentColor" fill-opacity="0.55"`,
    `        font-family="system-ui, -apple-system, sans-serif" font-size="16" letter-spacing="0.16em">${meta}</text>`,
    `</svg>`,
  ].join('\n');
}

function loadVisualSlotCSS() {
  const p = path.join(ROOT, 'samples', '_core', 'inject', 'visual-slot.css');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

/**
 * Replace placeholder slot content when scene has visual fields.
 */
function applyVisualSlot(html, scene, ctx) {
  const { html: inner, warnings } = buildVisualSlotContent(scene, ctx);
  if (!inner || !html.includes('vp-visual-slot')) return { html, warnings };

  const replaced = html.replace(
    /(<aside class="vp-visual-slot"[^>]*>)([\s\S]*?)(<\/aside>)/i,
    `$1${inner}$3`
  );
  return { html: replaced, warnings };
}

module.exports = {
  resolveVisualAsset,
  buildVisualSlotContent,
  loadVisualSlotCSS,
  applyVisualSlot,
  toHtmlAssetUrl
};
