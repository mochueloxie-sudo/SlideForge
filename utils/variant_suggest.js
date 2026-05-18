/**
 * Suggest content_variant from scene fields (ignores declared content_variant).
 * Used by quality lint — aligns with html_generator inferVariant priority.
 *
 * AI-GENERATED (Cursor)
 */

function nonEmptyArr(v) {
  return Array.isArray(v) && v.length > 0;
}

/**
 * @param {object} scene
 * @returns {string|null} suggested variant for type:"content", else null
 */
function suggestContentVariant(scene) {
  if (!scene || scene.type !== 'content') return null;

  if (
    nonEmptyArr(scene.compare_left_points) &&
    nonEmptyArr(scene.compare_right_points)
  ) {
    return 'compare';
  }
  if (nonEmptyArr(scene.process_stages) || nonEmptyArr(scene.flow_lanes)) {
    return 'process_flow';
  }
  if (nonEmptyArr(scene.layers) && scene.layers.length >= 2) {
    return 'architecture_stack';
  }
  if (nonEmptyArr(scene.funnel_stages) && scene.funnel_stages.length >= 2) {
    return 'funnel';
  }
  if (nonEmptyArr(scene.chart_data)) return 'chart';
  if (nonEmptyArr(scene.stats)) return 'stats_grid';
  if (nonEmptyArr(scene.steps)) return 'timeline';
  if (scene.left_body != null && String(scene.left_body).trim()) return 'two_col';
  if (nonEmptyArr(scene.cards)) return 'card_grid';

  if (scene.stat_value != null && String(scene.stat_value).trim() !== '') {
    if (nonEmptyArr(scene.key_points) && !nonEmptyArr(scene.icons)) {
      return 'panel_stat';
    }
  }
  if (
    scene.quote_body != null &&
    String(scene.quote_body).trim() &&
    scene.context_body != null &&
    String(scene.context_body).trim()
  ) {
    return 'quote_context';
  }
  if (
    scene.body != null &&
    String(scene.body).trim() &&
    nonEmptyArr(scene.icons) &&
    scene.icons.length <= 4
  ) {
    return 'text_icons';
  }
  if (nonEmptyArr(scene.icons)) return 'icon_grid';
  if (
    nonEmptyArr(scene.nav_items) &&
    !nonEmptyArr(scene.cards) &&
    !(nonEmptyArr(scene.key_points) && scene.key_points.length > 4)
  ) {
    return 'nav_bar';
  }
  if (scene.table_headers != null && nonEmptyArr(scene.table_headers)) return 'table';
  if (scene.code_snippet != null && String(scene.code_snippet).trim()) return 'code';
  if (scene.quote_body != null && String(scene.quote_body).trim()) return 'quote';
  if (scene.big_number != null && String(scene.big_number).trim()) return 'number';
  if (nonEmptyArr(scene.key_points)) return 'panel';
  if (scene.body != null && String(scene.body).trim()) return 'text';

  return 'text';
}

/** Pairs where declared variant is a common misuse when fields fit another layout. */
const SOFT_EQUIV = new Set([
  'panel|panel_stat',
  'panel_stat|panel',
  'number|panel_stat',
  'panel_stat|number'
]);

/**
 * @param {string} declared
 * @param {string} suggested
 * @returns {boolean}
 */
function variantsMismatch(declared, suggested) {
  if (!declared || !suggested || declared === suggested) return false;
  const key = `${declared}|${suggested}`;
  if (SOFT_EQUIV.has(key)) return false;
  return true;
}

module.exports = {
  suggestContentVariant,
  variantsMismatch
};
