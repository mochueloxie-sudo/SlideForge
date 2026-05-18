/**
 * nav_bar — lede detection + fallback from nav_items.
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

/** @param {object} scene */
function navBarHasLede(scene) {
  if (!scene || typeof scene !== 'object') return false;
  const sub = scene.subtitle || scene.secondary
    || (Array.isArray(scene.body) ? scene.body[0] : scene.body)
    || scene.script;
  if (sub != null && String(sub).trim()) return true;
  if (Array.isArray(scene.key_points) && scene.key_points.some(k => k != null && String(k).trim())) {
    return true;
  }
  return false;
}

/**
 * Strip leading emoji / symbol noise for readable lede lines.
 * @param {string} raw
 * @returns {string}
 */
function cleanNavItemLabel(raw) {
  let s = String(raw).trim();
  if (!s) return '';
  s = s.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}]+/u, '').trim();
  s = s.replace(/^[^\w\u4e00-\u9fff]+/u, '').trim();
  return s || String(raw).trim();
}

/**
 * When Agent only fills nav_items, derive 2-6 bullet lines for the main column.
 * @param {object} scene
 * @returns {string[]}
 */
function deriveNavBarLedePoints(scene) {
  if (!scene || navBarHasLede(scene)) return [];
  const items = Array.isArray(scene.nav_items) ? scene.nav_items : [];
  return items.map(cleanNavItemLabel).filter(Boolean).slice(0, 6);
}

module.exports = {
  navBarHasLede,
  cleanNavItemLabel,
  deriveNavBarLedePoints
};
