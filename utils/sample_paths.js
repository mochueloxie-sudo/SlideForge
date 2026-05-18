/**
 * Canonical paths under samples/ (themes, _core, shared).
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(ROOT, 'samples');
const THEMES_DIR = path.join(SAMPLES_DIR, 'themes');
const CORE_LAYOUTS_DIR = path.join(SAMPLES_DIR, '_core', 'layouts');
const SHARED_DIR = path.join(SAMPLES_DIR, 'shared');
const VISUAL_SLOT_CSS = path.join(SAMPLES_DIR, '_core', 'inject', 'visual-slot.css');

/**
 * Per-theme HTML overrides (cover, legacy content.html, notebook shell, etc.).
 * @param {string} designMode
 * @returns {string}
 */
function themeOverridesDir(designMode) {
  return path.join(THEMES_DIR, designMode || 'electric-studio', 'overrides');
}

/**
 * @param {string} designMode
 * @param {string} templateName e.g. cover, 02_panel
 * @returns {string}
 */
function themeOverrideFile(designMode, templateName) {
  return path.join(themeOverridesDir(designMode), `${templateName}.html`);
}

module.exports = {
  ROOT,
  SAMPLES_DIR,
  THEMES_DIR,
  CORE_LAYOUTS_DIR,
  SHARED_DIR,
  VISUAL_SLOT_CSS,
  themeOverridesDir,
  themeOverrideFile
};
