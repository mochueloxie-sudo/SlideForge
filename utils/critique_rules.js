/**
 * Critique rule registry — static HTML checks (cheerio, no network).
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

const TOKEN_RE = /\{\{[A-Z0-9_]+\}\}/g;
const READABILITY_BASELINE_RE = /readability baseline/i;

/**
 * @param {import('cheerio').CheerioAPI} $
 * @returns {boolean}
 */
function hasValidHeroVisual($) {
  const slot = $('.vp-visual-slot');
  if (slot.length) {
    const real = slot.find(
      'img.vp-hero-image, img.vp-diagram-image, img.vp-brand-mark, img[src]'
    ).not('[data-vp-placeholder]');
    if (real.length > 0) {
      return real.toArray().some(el => {
        const src = ($(el).attr('src') || '').trim();
        return src.length > 0;
      });
    }
    if (slot.find('[data-vp-placeholder]').length > 0) return false;
    return false;
  }
  const imgs = $('img').not('[data-vp-placeholder]');
  return imgs.toArray().some(el => {
    const src = ($(el).attr('src') || '').trim();
    return src.length > 0 && !/^data:image\/svg\+xml/i.test(src);
  });
}

/**
 * @param {object|null} scene
 * @returns {boolean}
 */
function sceneExpectsHero(scene) {
  if (!scene || typeof scene !== 'object') return false;
  if (scene.hero_image) return true;
  if (scene.composition === 'split-visual') return true;
  return false;
}

/**
 * @param {object|null} scene
 * @returns {boolean}
 */
function isContentPage(scene) {
  return !!(scene && scene.type === 'content');
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {object|null} scene
 */
function pageStructureFingerprint($, scene) {
  const parts = [];
  if (scene && scene.content_variant) parts.push(scene.content_variant);
  if ($('.compare-grid').length) parts.push('dom:compare');
  if ($('.stats-row').length) parts.push('dom:stats');
  if ($('.slide-split').length) parts.push('dom:split');
  if ($('.panel').length) parts.push('dom:panel');
  if ($('.fn-wrap, .funnel').length) parts.push('dom:funnel');
  if ($('.stack-wrap, .arch-layer').length) parts.push('dom:stack');
  if ($('.grid.cards, .card-grid').length) parts.push('dom:cards');
  if ($('.quote, blockquote').length) parts.push('dom:quote');
  return parts.join('|') || 'dom:generic';
}

function parseCssColor(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
  }
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3] };
  }
  return null;
}

function relativeLuminance({ r, g, b }) {
  const lin = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Heuristic: body + :root vars from inline styles (no Puppeteer).
 * @param {string} raw
 */
function extractTextBackgroundColors(raw) {
  let fg = null;
  let bg = null;
  const rootBlock = raw.match(/:root\s*\{([^}]+)\}/i);
  if (rootBlock) {
    const rb = rootBlock[1];
    const tp = rb.match(/--sf-text-primary\s*:\s*([^;]+)/i);
    const bb = rb.match(/--sf-body-bg\s*:\s*([^;]+)/i) ||
      rb.match(/--sf-page-bg[^:]*:\s*([^;]+)/i);
    if (tp) fg = parseCssColor(tp[1]);
    if (bb) bg = parseCssColor(bb[1]);
  }
  const bodyBlock = raw.match(/body\s*\{([^}]+)\}/i);
  if (bodyBlock) {
    const bb = bodyBlock[1];
    const tc = bb.match(/\bcolor\s*:\s*([^;]+)/i);
    const bgc = bb.match(/\bbackground(?:-color)?\s*:\s*([^;]+)/i);
    if (tc) fg = parseCssColor(tc[1]) || fg;
    if (bgc) bg = parseCssColor(bgc[1]) || bg;
  }
  return { fg, bg };
}

/** @type {Array<{ id: string, level: 'error'|'warning'|'info', run: Function }>} */
const CRITIQUE_RULES = [
  {
    id: 'CRIT_UNFILLED_TOKEN',
    level: 'error',
    run({ raw, file }) {
      const unfilled = raw.match(TOKEN_RE) || [];
      if (!unfilled.length) return [];
      return [{
        level: 'error',
        code: 'CRIT_UNFILLED_TOKEN',
        file,
        message: `Unfilled template tokens: ${[...new Set(unfilled)].slice(0, 8).join(', ')}`
      }];
    }
  },
  {
    id: 'CRIT_READABILITY_BASELINE',
    level: 'error',
    run({ raw, file }) {
      if (!READABILITY_BASELINE_RE.test(raw)) return [];
      return [{
        level: 'error',
        code: 'CRIT_READABILITY_BASELINE',
        file,
        message: 'Readability baseline CSS leaked into page (expected enhancement: minimal)'
      }];
    }
  },
  {
    id: 'CRIT_PLACEHOLDER_IMAGE',
    level: 'warning',
    run({ $, file }) {
      const placeholders = $('[data-vp-placeholder]').length;
      if (placeholders <= 0) return [];
      return [{
        level: 'warning',
        code: 'CRIT_PLACEHOLDER_IMAGE',
        file,
        message: `${placeholders} hero/visual slot(s) using placeholder (missing asset)`
      }];
    }
  },
  {
    id: 'CRIT_EXTERNAL_STYLESHEET',
    level: 'warning',
    run({ $, file }) {
      const out = [];
      $('link[rel="stylesheet"]').each((_, el) => {
        const href = ($(el).attr('href') || '').trim();
        if (/^https?:\/\//i.test(href)) {
          out.push({
            level: 'warning',
            code: 'CRIT_EXTERNAL_STYLESHEET',
            file,
            message: `External stylesheet: ${href}`
          });
        }
      });
      return out;
    }
  },
  {
    id: 'CRIT_NO_HERO',
    level: 'warning',
    run({ $, scene, file }) {
      if (!sceneExpectsHero(scene)) return [];
      if (hasValidHeroVisual($)) return [];
      return [{
        level: 'warning',
        code: 'CRIT_NO_HERO',
        file,
        message: 'Scene expects a hero/split visual but page has no resolved image (empty slot or placeholder only)'
      }];
    }
  },
  {
    id: 'CRIT_MISSING_SF_THEME_TOKENS',
    level: 'warning',
    run({ raw, scene, file }) {
      if (!isContentPage(scene)) return [];
      if (raw.includes('id="sf-theme-tokens"')) return [];
      return [{
        level: 'warning',
        code: 'CRIT_MISSING_SF_THEME_TOKENS',
        file,
        message: 'Content page missing <style id="sf-theme-tokens"> (depth theme token block)'
      }];
    }
  },
  {
    id: 'CRIT_SPARSE_TEXT',
    level: 'info',
    run({ $, file }) {
      const textLen = $('body').text().replace(/\s+/g, ' ').trim().length;
      if (textLen >= 20) return [];
      return [{
        level: 'info',
        code: 'CRIT_SPARSE_TEXT',
        file,
        message: `Very little visible text (${textLen} chars)`
      }];
    }
  },
  {
    id: 'CRIT_HERO_NOT_DETECTED',
    level: 'info',
    run({ $, raw, scene, file }) {
      if (!scene || !scene.hero_image) return [];
      if (hasValidHeroVisual($)) return [];
      if (raw.includes('vp-visual') || raw.includes('vp-hero') || raw.includes('hero')) return [];
      return [{
        level: 'info',
        code: 'CRIT_HERO_NOT_DETECTED',
        file,
        message: 'scene.hero_image set but no obvious hero slot markers in HTML (heuristic)'
      }];
    }
  },
  {
    id: 'CRIT_LOW_CONTRAST',
    level: 'warning',
    run({ raw, file }) {
      const { fg, bg } = extractTextBackgroundColors(raw);
      if (!fg || !bg) return [];
      const ratio = contrastRatio(fg, bg);
      if (ratio >= 4.5) return [];
      return [{
        level: 'warning',
        code: 'CRIT_LOW_CONTRAST',
        file,
        message: `Estimated body text/background contrast ${ratio.toFixed(2)}:1 (target ≥ 4.5:1 for PDF)`
      }];
    }
  },
  {
    id: 'CRIT_GENERIC_GRADIENT',
    level: 'info',
    run({ raw, file }) {
      if (!/linear-gradient\([^)]*(#6366f1|#8b5cf6|#a855f7|139,\s*92,\s*246)/i.test(raw)) return [];
      return [{
        level: 'info',
        code: 'CRIT_GENERIC_GRADIENT',
        file,
        message: 'Possible generic AI-style purple gradient detected'
      }];
    }
  }
];

/** Deck-level rules (run after all pages). */
const DECK_CRITIQUE_RULES = [
  {
    id: 'CRIT_DECK_MONOTONY',
    level: 'warning',
    runDeck({ pages }) {
      if (!pages || pages.length < 3) return [];
      const out = [];
      for (let i = 2; i < pages.length; i++) {
        const a = pages[i - 2];
        const b = pages[i - 1];
        const c = pages[i];
        if (a.fingerprint && a.fingerprint === b.fingerprint && b.fingerprint === c.fingerprint) {
          out.push({
            level: 'warning',
            code: 'CRIT_DECK_MONOTONY',
            file: c.file,
            message: `3 consecutive pages share structure "${c.fingerprint}" (rendered monotony)`
          });
          break;
        }
      }
      return out;
    }
  }
];

module.exports = {
  CRITIQUE_RULES,
  DECK_CRITIQUE_RULES,
  sceneExpectsHero,
  hasValidHeroVisual,
  isContentPage,
  pageStructureFingerprint,
  extractTextBackgroundColors,
  contrastRatio
};
