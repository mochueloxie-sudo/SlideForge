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

  for (const [field, className, fit] of pick) {
    if (!scene[field]) continue;
    const { url, warning } = resolveVisualAsset(scene[field], ctx);
    if (warning) warnings.push(warning);
    if (!url) continue;
    const alt = escapeAttr(scene.visual_alt || scene.title || '');
    const fitCss = fit === 'cover' ? 'object-fit:cover' : 'object-fit:contain; padding:24px';
    return {
      html: `<img class="${className}" src="${escapeAttr(url)}" alt="${alt}" style="width:100%;height:100%;${fitCss};border-radius:inherit;display:block;" />`,
      warnings
    };
  }
  return { html: '', warnings };
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
