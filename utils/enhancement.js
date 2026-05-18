/**
 * CSS injection policy — Q0-D: minimal (default) vs full legacy enhancements.
 *
 * AI-GENERATED (Cursor)
 *
 * minimal: density + art-direction + layout helpers only;样张 owns typography.
 * full:    previous behavior (readability + glass + title bumps).
 */

const { shouldSkipTitleEnhancement } = require('./art_direction');

const VALID_ENHANCEMENT = new Set(['minimal', 'full']);

/** Variants with self-contained layout in theme samples — skip universal flex centering. */
const VARIANTS_OWN_LAYOUT = new Set([
  'number', 'compare', 'stats_grid', 'process_flow', 'quote', 'quote_context',
  'architecture_stack', 'funnel', 'text', 'code', 'chart', 'nav_bar'
]);

function normalizeEnhancement(designParams) {
  const raw = designParams && designParams.enhancement;
  if (raw === 'full') return 'full';
  return 'minimal';
}

function shouldInjectReadability(enhancement, art, pageType) {
  if (enhancement === 'full') return true;
  if (pageType === 'cover') return false;
  if (shouldSkipTitleEnhancement(art)) return false;
  if (art && (art.visual_weight === 'hero' || art.composition === 'stat-hero')) return false;
  return false;
}

function shouldInjectGlass(enhancement, pageType) {
  if (enhancement === 'full') return true;
  return false;
}

function shouldInjectTitleEnhancement(enhancement, art, pageType) {
  if (enhancement === 'full') {
    if (pageType === 'cover') return true;
    return !shouldSkipTitleEnhancement(art);
  }
  return false;
}

function shouldInjectUniversalCentering(enhancement, variant) {
  if (enhancement === 'full') return true;
  if (VARIANTS_OWN_LAYOUT.has(variant)) return false;
  return true;
}

/** minimal 不注入 density-sparse/rich 全局覆盖，避免盖掉样张排版（尤其 cover / number） */
function shouldInjectDensity(enhancement, density) {
  if (enhancement === 'full') return true;
  return false;
}

/**
 * @param {object} opts
 * @param {string} opts.enhancement
 * @param {object} [opts.art]
 * @param {string} opts.variant
 * @param {string} opts.pageType - 'cover' | 'content' | 'summary'
 * @param {object} opts.tpl
 * @param {string} opts.density
 * @param {function} opts.getReadabilityCSS
 * @param {function} opts.getDensityCSS
 * @param {function} opts.getGlassEnhancementCSS
 * @param {function} opts.getTitleEnhancementCSS
 * @param {function} opts.getArtDirectionCSS
 */
function buildPageStyleBundle(opts) {
  const {
    enhancement,
    art,
    variant,
    pageType,
    tpl,
    density,
    getReadabilityCSS,
    getDensityCSS,
    getGlassEnhancementCSS,
    getTitleEnhancementCSS,
    getArtDirectionCSS
  } = opts;

  const readCSS = shouldInjectReadability(enhancement, art, pageType) ? getReadabilityCSS() : '';
  const densityCSS = shouldInjectDensity(enhancement, density) ? getDensityCSS(density) : '';
  const glassCSS = shouldInjectGlass(enhancement, pageType) ? getGlassEnhancementCSS(tpl) : '';
  const artCSS = pageType === 'cover' ? '' : (getArtDirectionCSS ? getArtDirectionCSS() : '');
  const titleType = pageType === 'cover' ? 'cover' : 'content';
  const titleCSS = shouldInjectTitleEnhancement(enhancement, art, pageType)
    ? getTitleEnhancementCSS(titleType)
    : '';

  return { readCSS, densityCSS, glassCSS, artCSS, titleCSS, enhancement };
}

module.exports = {
  VALID_ENHANCEMENT,
  normalizeEnhancement,
  shouldInjectReadability,
  shouldInjectGlass,
  shouldInjectTitleEnhancement,
  shouldInjectUniversalCentering,
  shouldInjectDensity,
  buildPageStyleBundle,
  VARIANTS_OWN_LAYOUT
};
