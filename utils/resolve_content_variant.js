/**
 * Resolve effective content_variant for rendering (honors explicit variant vs "auto").
 *
 * AI-GENERATED (Cursor)
 */

const { suggestContentVariant } = require('./variant_suggest');

/**
 * @param {object} scene
 * @param {object} [dir] — design page_directions row
 * @returns {string}
 */
function resolveContentVariant(scene, dir = {}) {
  if (!scene || scene.type !== 'content') {
    return scene?.content_variant || 'text';
  }
  const declared = scene.content_variant;
  if (declared && declared !== 'auto') return declared;
  const fromDir = dir.content_variant;
  if (fromDir && fromDir !== 'auto') return fromDir;
  return suggestContentVariant(scene) || 'text';
}

module.exports = { resolveContentVariant };
