#!/usr/bin/env node
/**
 * Quality lint — deck-level visual rhythm checks (non-blocking).
 *
 * AI-GENERATED (Cursor)
 *
 * Used by steps/validate.js. Does not replace schema validation.
 */

const { resolveVisualAsset } = require('../utils/visual_assets');
const { navBarHasLede, deriveNavBarLedePoints } = require('../utils/nav_bar_helpers');

const VALID_VISUAL_WEIGHT = new Set(['hero', 'normal', 'dense', 'breathing']);
const VALID_COMPOSITION = new Set(['default', 'title-only', 'stat-hero', 'split-visual']);
const VISUAL_ASSET_FIELDS = ['hero_image', 'diagram', 'brand_mark'];

const HIGH_ENERGY_VARIANTS = new Set([
  'number', 'quote', 'compare', 'stats_grid', 'process_flow',
  'quote_context', 'panel_stat', 'number_bullets', 'funnel', 'architecture_stack'
]);

const QUALITY_HINTS = {
  QUALITY_PANEL_RUN: '连续多页 panel 会像模板堆砌：合并要点、或改用 number / quote / compare / stats_grid / process_flow 制造节奏',
  QUALITY_PANEL_RATIO: '过半 content 页都是 panel：为「冲击页」加 visual_weight:"hero" + number/quote，为过渡页加 visual_weight:"breathing" + composition:"title-only"',
  QUALITY_NO_HIGH_ENERGY: 'deck 较长但缺少高能页：至少插入 1 页 number（单指标）、quote（金句）或 compare（对照）',
  QUALITY_TITLE_LONG: '标题过长会挤压版式：拆成 eyebrow + 短 title，或把细节放进 key_points/body',
  QUALITY_TOO_MANY_KP: '单页要点过多：拆成两页，或改用 card_grid / timeline',
  QUALITY_INVALID_VW: '合法 visual_weight：hero | normal | dense | breathing',
  QUALITY_INVALID_COMP: '合法 composition：default | title-only | stat-hero | split-visual',
  QUALITY_VISUAL_ASSET_MISSING: 'scene 声明了 hero_image / diagram / brand_mark 但路径解析不到文件；渲染时会回退到 SVG 占位（带 data-vp-placeholder）',
  QUALITY_NAV_BAR_NO_LEDE: 'nav_bar 须填 subtitle（或 secondary/body[0]）或 key_points；仅有 title 且无 nav_items 时正文区会空。并列概念页请用 card_grid / icon_grid',
  QUALITY_NAV_BAR_LEDE_INFERRED: 'nav_bar 未写 subtitle/key_points；渲染已用 nav_items 生成标题下摘要。建议显式写 subtitle 或 key_points，顶栏 nav_items 保持短标签',
};

function attachQualityHints(items) {
  for (const it of items) {
    if (it.code && QUALITY_HINTS[it.code]) it.hint = QUALITY_HINTS[it.code];
  }
}

/**
 * @param {object[]} scenesData
 * @param {{ scenesPath?: string, outputDir?: string }} [ctx]
 * @returns {{ quality_warnings: object[] }}
 */
function lintQuality(scenesData, ctx = {}) {
  const quality_warnings = [];

  if (!Array.isArray(scenesData) || scenesData.length === 0) {
    return { quality_warnings };
  }

  scenesData.forEach((scene, i) => {
    if (!scene || typeof scene !== 'object') return;
    const at = `[${i}]`;

    if (scene.visual_weight != null && !VALID_VISUAL_WEIGHT.has(scene.visual_weight)) {
      quality_warnings.push({
        at: `${at}.visual_weight`,
        code: 'QUALITY_INVALID_VW',
        msg: `unknown visual_weight "${scene.visual_weight}"`
      });
    }
    if (scene.composition != null && !VALID_COMPOSITION.has(scene.composition)) {
      quality_warnings.push({
        at: `${at}.composition`,
        code: 'QUALITY_INVALID_COMP',
        msg: `unknown composition "${scene.composition}"`
      });
    }

    if (scene.type === 'content' && typeof scene.title === 'string' && scene.title.length > 48) {
      quality_warnings.push({
        at: `${at}.title`,
        code: 'QUALITY_TITLE_LONG',
        msg: `content title long (${scene.title.length} chars); keep under ~48 for layout headroom`
      });
    }

    if (scene.content_variant === 'panel' && Array.isArray(scene.key_points) && scene.key_points.length > 5) {
      quality_warnings.push({
        at: `${at}.key_points`,
        code: 'QUALITY_TOO_MANY_KP',
        msg: `panel has ${scene.key_points.length} key_points (recommended max 5)`
      });
    }

    if (scene.content_variant === 'nav_bar' && !navBarHasLede(scene)) {
      const inferred = deriveNavBarLedePoints(scene);
      if (inferred.length) {
        quality_warnings.push({
          at,
          code: 'QUALITY_NAV_BAR_LEDE_INFERRED',
          msg: `nav_bar lede inferred from ${inferred.length} nav_items (render OK; add explicit subtitle or key_points)`
        });
      } else {
        quality_warnings.push({
          at,
          code: 'QUALITY_NAV_BAR_NO_LEDE',
          msg: 'nav_bar has no subtitle/key_points and no nav_items to infer lede from'
        });
      }
    }

    // Q1-B: visual asset reachability (hero_image / diagram / brand_mark).
    // Only check when ctx provides a resolution root (scenesPath); otherwise skip
    // to keep `validate` callable without filesystem context.
    if (ctx && (ctx.scenesPath || ctx.outputDir)) {
      for (const field of VISUAL_ASSET_FIELDS) {
        const raw = scene[field];
        if (!raw || typeof raw !== 'string' || !raw.trim()) continue;
        const { url } = resolveVisualAsset(raw, ctx);
        if (!url) {
          quality_warnings.push({
            at: `${at}.${field}`,
            code: 'QUALITY_VISUAL_ASSET_MISSING',
            msg: `${field} path not resolved: "${raw}"`
          });
        }
      }
    }
  });

  const contentIndices = scenesData
    .map((s, i) => (s && s.type === 'content' ? i : -1))
    .filter(i => i >= 0);

  // Consecutive panel run >= 3
  let run = 0;
  for (let k = 0; k < contentIndices.length; k++) {
    const scene = scenesData[contentIndices[k]];
    if (scene.content_variant === 'panel') {
      run++;
      if (run >= 3) {
        quality_warnings.push({
          at: `[${contentIndices[k]}]`,
          code: 'QUALITY_PANEL_RUN',
          msg: `3+ consecutive panel pages ending here (template monotony)`
        });
        run = 0;
      }
    } else {
      run = 0;
    }
  }

  const contentScenes = contentIndices.map(i => scenesData[i]);
  if (contentScenes.length >= 4) {
    const panelCount = contentScenes.filter(s => s.content_variant === 'panel').length;
    if (panelCount / contentScenes.length > 0.7) {
      quality_warnings.push({
        at: '$',
        code: 'QUALITY_PANEL_RATIO',
        msg: `${panelCount}/${contentScenes.length} content pages use panel (>70%)`
      });
    }
  }

  if (contentScenes.length >= 6) {
    const hasHigh = contentScenes.some(s => HIGH_ENERGY_VARIANTS.has(s.content_variant));
    if (!hasHigh) {
      quality_warnings.push({
        at: '$',
        code: 'QUALITY_NO_HIGH_ENERGY',
        msg: `deck has ${contentScenes.length} content pages but no high-energy variant`
      });
    }
  }

  attachQualityHints(quality_warnings);
  return { quality_warnings };
}

module.exports = {
  lintQuality,
  VALID_VISUAL_WEIGHT,
  VALID_COMPOSITION,
  QUALITY_HINTS
};
