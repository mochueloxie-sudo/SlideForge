/**
 * Art direction — scene-level visual_weight / composition → body classes + CSS.
 *
 * AI-GENERATED (Cursor)
 */

const VALID_VISUAL_WEIGHT = new Set(['hero', 'normal', 'dense', 'breathing']);
const VALID_COMPOSITION = new Set(['default', 'title-only', 'stat-hero', 'split-visual']);

/**
 * Merge scene + design page_direction; scene wins.
 * @returns {{ visual_weight?: string, composition?: string, bodyClasses: string[], densityOverride?: string }}
 */
function resolveArtDirection(scene, dir = {}) {
  const visual_weight = pickEnum(scene.visual_weight, dir.visual_weight, VALID_VISUAL_WEIGHT);
  const composition = pickEnum(scene.composition, dir.composition, VALID_COMPOSITION);

  const bodyClasses = [];
  if (visual_weight && visual_weight !== 'normal') bodyClasses.push(`vp-vw-${visual_weight}`);
  if (composition && composition !== 'default') bodyClasses.push(`vp-comp-${composition}`);

  let densityOverride;
  if (visual_weight === 'breathing') densityOverride = 'sparse';
  if (visual_weight === 'dense') densityOverride = 'rich';

  return { visual_weight, composition, bodyClasses, densityOverride };
}

function pickEnum(sceneVal, dirVal, set) {
  if (sceneVal != null && set.has(sceneVal)) return sceneVal;
  if (dirVal != null && set.has(dirVal)) return dirVal;
  if (sceneVal != null || dirVal != null) return undefined;
  return undefined;
}

function getArtDirectionCSS() {
  return `
  /* slide-forge: art direction (Q0) */
  body.vp-vw-hero:not(.vp-cover) .title,
  body.vp-vw-hero:not(.vp-cover) .section-title {
    font-size: clamp(72px, 5vw, 96px) !important;
    line-height: 1.02 !important;
    margin-bottom: 48px !important;
  }
  body.vp-vw-hero .panel,
  body.vp-vw-hero .big-number,
  body.vp-vw-hero .quote-text {
    transform: translateZ(0);
  }
  body.vp-vw-breathing {
    padding-top: 120px !important;
    padding-bottom: 120px !important;
  }
  body.vp-vw-breathing .title {
    font-size: clamp(56px, 4vw, 80px) !important;
    line-height: 1.08 !important;
    max-width: 1400px !important;
  }
  body.vp-vw-breathing .eyebrow,
  body.vp-vw-breathing .label {
    margin-bottom: 32px !important;
  }
  body.vp-vw-dense .title {
    font-size: clamp(48px, 3.2vw, 64px) !important;
    margin-bottom: 24px !important;
  }
  body.vp-comp-title-only .panel,
  body.vp-comp-title-only .kp-list,
  body.vp-comp-title-only .grid,
  body.vp-comp-title-only .body-text,
  body.vp-comp-title-only .stat-row,
  body.vp-comp-title-only .compare-grid,
  body.vp-comp-title-only .pf-track,
  body.vp-comp-title-only .arch-stack {
    display: none !important;
  }
  body.vp-comp-title-only .title {
    font-size: clamp(64px, 4.5vw, 88px) !important;
    max-width: 1500px !important;
  }
  body.vp-comp-title-only .secondary {
    font-size: 36px !important;
    opacity: 0.85 !important;
    margin-top: 24px !important;
  }
  body.vp-comp-stat-hero .big-number,
  body.vp-comp-stat-hero .number,
  body.vp-comp-stat-hero .stat-number {
    font-size: clamp(140px, 12vw, 220px) !important;
    line-height: 0.95 !important;
  }
  body.vp-comp-stat-hero .number-label,
  body.vp-comp-stat-hero .stat-label,
  body.vp-comp-stat-hero .stat-headline {
    font-size: 32px !important;
  }
  /* split-visual: prefer theme .slide-split + .vp-visual-slot; disable legacy body::after */
  body.vp-comp-split-visual::after {
    content: none !important;
    display: none !important;
  }
`;
}

/**
 * Skip global 72px title bump when page is meant to breathe or be title-only.
 */
function shouldSkipTitleEnhancement(art) {
  if (!art) return false;
  if (art.composition === 'title-only') return true;
  if (art.visual_weight === 'breathing') return true;
  return false;
}

module.exports = {
  VALID_VISUAL_WEIGHT,
  VALID_COMPOSITION,
  resolveArtDirection,
  getArtDirectionCSS,
  shouldSkipTitleEnhancement
};
