/**
 * Q1-C — content-aware typography scales (1920×1080 slides).
 *
 * AI-GENERATED (Cursor)
 */

/**
 * Key-point list font size by item count.
 * @param {number} count
 * @returns {{ fontSize: number, dotSize: number }}
 */
function kpScale(count) {
  const n = Math.max(0, Number(count) || 0);
  const fontSize = n <= 2 ? 46
    : n === 3 ? 38
    : n === 4 ? 32
    : n === 5 ? 27
    : n === 6 ? 24
    : 21;
  const dotSize = fontSize >= 38 ? 11 : fontSize >= 32 ? 9 : 8;
  return { fontSize, dotSize };
}

/**
 * Title display scale from character count (CJK ≈ 2 units).
 * @param {string} title
 * @param {{ pageType?: string }} [opts]
 * @returns {{ clamp: string, maxChars: number }}
 */
function titleScale(title, opts = {}) {
  const raw = String(title || '').replace(/<[^>]+>/g, '');
  const units = [...raw].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 2 : 1), 0);
  const pageType = opts.pageType || 'content';

  if (pageType === 'cover') {
    if (units <= 12) return { clamp: 'clamp(96px, 7vw, 120px)', maxChars: units };
    if (units <= 24) return { clamp: 'clamp(88px, 6.5vw, 112px)', maxChars: units };
    return { clamp: 'clamp(72px, 5.5vw, 96px)', maxChars: units };
  }

  if (units <= 14) return { clamp: 'clamp(64px, 4.8vw, 88px)', maxChars: units };
  if (units <= 28) return { clamp: 'clamp(56px, 4.2vw, 72px)', maxChars: units };
  if (units <= 42) return { clamp: 'clamp(48px, 3.6vw, 64px)', maxChars: units };
  return { clamp: 'clamp(42px, 3.2vw, 56px)', maxChars: units };
}

/**
 * Big-number scale when not using sample-fixed px.
 * @param {string} num
 */
function statNumberScale(num) {
  const s = String(num || '');
  const len = s.replace(/\s/g, '').length;
  if (len <= 4) return 'clamp(160px, 14vw, 240px)';
  if (len <= 7) return 'clamp(120px, 11vw, 180px)';
  return 'clamp(96px, 9vw, 140px)';
}

/**
 * Optional per-page CSS snippet (minimal mode: sample owns layout; use sparingly).
 */
function getTypographyOverrideCSS(scene, opts = {}) {
  const pageType = opts.pageType || 'content';
  if (!scene || !scene.title) return '';
  const { clamp } = titleScale(scene.title, { pageType });
  if (pageType === 'cover') return '';
  return `
  body.sf-typo-adapt .title {
    font-size: ${clamp} !important;
  }`;
}

/**
 * Q1-C — content-aware typography vars.
 *
 * Returns a `:root { --sf-* }` block that depth layouts in `_core/layouts/`
 * pick up via `font-size: var(--sf-title-size, <fallback>)`.
 * Empty when nothing to override (caller may skip injection entirely).
 *
 * @param {object} scene
 * @param {{ pageType?: 'cover'|'content', variant?: string }} [opts]
 * @returns {string}
 */
function buildTypographyVarsCss(scene, opts = {}) {
  if (!scene) return '';
  const pageType = opts.pageType || 'content';
  const variant = opts.variant || scene.content_variant || null;
  const lines = [];

  if (scene.title) {
    const { clamp } = titleScale(scene.title, { pageType });
    if (pageType === 'cover') {
      lines.push(`  --sf-cover-title-size: ${clamp};`);
    } else {
      lines.push(`  --sf-title-size: ${clamp};`);
    }
  }

  if ((pageType === 'content') && (variant === 'number' || scene.big_number)) {
    const big = scene.big_number;
    if (big) {
      lines.push(`  --sf-stat-number-size: ${statNumberScale(big)};`);
    }
  }

  if (!lines.length) return '';
  return `:root {\n${lines.join('\n')}\n}\n`;
}

/**
 * Q1-C — activation gate. Honoured by html_generator.
 *
 *   scene.typography === 'adapt'                     ← per-page opt-in
 *   designParams.typography_scale === 'adapt'        ← deck-level (design command)
 *   normalizeEnhancement(designParams) === 'full'    ← global enhanced mode
 */
function shouldApplyTypographyAdapt(scene, designParams) {
  if (scene && scene.typography === 'adapt') return true;
  if (designParams && designParams.typography_scale === 'adapt') return true;
  const enh = designParams && (designParams.enhancement || designParams.enhancement_mode);
  if (enh === 'full') return true;
  return false;
}

module.exports = {
  kpScale,
  titleScale,
  statNumberScale,
  getTypographyOverrideCSS,
  buildTypographyVarsCss,
  shouldApplyTypographyAdapt
};
