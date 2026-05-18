/**
 * Q1-A — theme design tokens (CSS variables + tpl merge).
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');
const { buildDepthTokensCss } = require('./depth_tokens_from_tpl');

const ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'samples', 'themes');

/**
 * Map DESIGN_TEMPLATES entry → :root CSS variables.
 * @param {object} tpl
 */
function tplToCssVars(tpl) {
  if (!tpl) return '';
  return `:root {
  --sf-font: '${tpl.font}', 'PingFang SC', sans-serif;
  --sf-body-bg: ${tpl.bodyBg};
  --sf-text-primary: ${tpl.textColor};
  --sf-text-secondary: ${tpl.textSecondary};
  --sf-text-muted: ${tpl.textMuted};
  --sf-accent: ${tpl.accent};
  --sf-accent-light: ${tpl.accentLight};
  --sf-panel-bg: ${tpl.panelBg};
  --sf-panel-border: ${tpl.panelBorder};
  --sf-panel-border-top: ${tpl.panelBorderTop};
  --sf-panel-border-bottom: ${tpl.panelBorderBottom};
  --sf-panel-shadow: ${tpl.panelShadow};
  --sf-panel-radius: ${tpl.panelRadius};
  --sf-hairline: ${tpl.hairlineColor};
  --sf-eyebrow: ${tpl.eyebrowColor};
}`;
}

/**
 * @param {string} designMode
 * @param {object} [fallbackTpl] — from DESIGN_TEMPLATES
 * @returns {string} CSS for <style id="sf-theme-tokens">
 */
function getThemeTokensCSS(designMode, fallbackTpl) {
  const file = path.join(THEMES_DIR, designMode, 'tokens.css');
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').trim();
  }
  if (fallbackTpl) {
    const generated = buildDepthTokensCss(fallbackTpl, designMode || '');
    if (generated) return generated;
  }
  return tplToCssVars(fallbackTpl);
}

/**
 * Inject theme token block before </head>.
 * @param {string} html
 * @param {string} designMode
 * @param {object} fallbackTpl
 */
function injectThemeTokens(html, designMode, fallbackTpl) {
  const css = getThemeTokensCSS(designMode, fallbackTpl);
  if (!css) return html;
  const block = `<style id="sf-theme-tokens">\n${css}\n</style>\n`;
  if (html.includes('id="sf-theme-tokens"')) return html;
  return html.replace('</head>', `${block}</head>`);
}

module.exports = {
  getThemeTokensCSS,
  injectThemeTokens,
  tplToCssVars,
  THEMES_DIR
};
