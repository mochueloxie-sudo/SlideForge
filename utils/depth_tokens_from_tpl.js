/**
 * Build full Q1 depth token CSS (--sf-*) from DESIGN_TEMPLATES row when
 * samples/themes/<id>/tokens.css is absent. Used by theme_tokens.js.
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 15, g: 15, b: 20 };
  const h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  return { r: 15, g: 15, b: 20 };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function pickPrimaryText(tpl, bodyHex) {
  const b = luminance(bodyHex);
  const t = luminance(tpl.textColor);
  if (b < 0.28 && t < 0.38) return '#f2f4f8';
  if (b > 0.72 && t > 0.65) return '#1a1c22';
  return tpl.textColor;
}

function pickSubtitle(hexPrimary, tpl) {
  if (luminance(tpl.bodyBg) < 0.35) return tpl.textSecondary;
  return tpl.textSecondary;
}

/**
 * @param {object} tpl — DESIGN_TEMPLATES[designMode]
 * @param {string} designMode
 * @returns {string}
 */
function buildDepthTokensCss(tpl, designMode) {
  if (!tpl || !tpl.bodyBg) return '';

  const bodyHex = tpl.bodyBg.startsWith('#') ? tpl.bodyBg : '#0f0f14';
  const accent = tpl.accent || '#4361ee';
  const accent2 = tpl.accentLight || accent;
  const eyebrow = tpl.eyebrowColor || accent;
  const light = luminance(bodyHex) > 0.48;

  const font = tpl.font || 'sans-serif';
  const primary = pickPrimaryText(tpl, bodyHex);
  const secondary = tpl.textSecondary;
  const muted = tpl.textMuted;
  const subtitle = secondary;
  const subLede = pickSubtitle(primary, tpl);

  const panelBg = tpl.panelBg;
  const panelBorder = tpl.panelBorder;
  const panelBorderTop = tpl.panelBorderTop;
  const panelBorderBottom = tpl.panelBorderBottom;
  const panelShadow = tpl.panelShadow;
  const panelRadius = tpl.panelRadius || '16px';
  const hairline = tpl.hairlineColor;
  const eyebrowRing = `1px solid ${rgba(eyebrow, 0.32)}`;

  const g1 = (a) => rgba(accent, a);
  const g2 = (a) => rgba(accent2, a);

  const bodyGrad = light
    ? `linear-gradient(165deg, ${bodyHex} 0%, #ffffff 55%, ${bodyHex} 100%)`
    : `linear-gradient(165deg, ${bodyHex} 0%, ${bodyHex} 48%, ${g1(0.06)} 100%)`;

  const coverBg = light
    ? `radial-gradient(ellipse at 60% 45%, ${g1(0.12)} 0%, transparent 52%),
    radial-gradient(circle at 12% 88%, ${g2(0.08)} 0%, transparent 38%),
    linear-gradient(165deg, ${bodyHex} 0%, #ffffff 52%, ${bodyHex} 100%)`
    : `radial-gradient(ellipse at 60% 45%, ${g1(0.22)} 0%, transparent 52%),
    radial-gradient(circle at 12% 88%, ${g2(0.12)} 0%, transparent 38%),
    radial-gradient(circle at 22% 12%, ${g1(0.08)} 0%, transparent 32%),
    ${bodyGrad}`;

  const pageRadial = (a1, a2) =>
    light
      ? `radial-gradient(circle at 22% 18%, ${g1(a1)} 0%, transparent 30%),
    radial-gradient(circle at 78% 82%, ${g2(a2)} 0%, transparent 36%),
    ${bodyGrad}`
      : `radial-gradient(circle at 22% 18%, ${g1(a1)} 0%, transparent 30%),
    radial-gradient(circle at 78% 82%, ${g2(a2)} 0%, transparent 36%),
    ${bodyGrad}`;

  const kpText = light ? muted : rgba(primary, 0.82);
  const kpDiv = light ? rgba(accent, 0.15) : rgba(accent2, 0.14);
  const cardBorder = light ? rgba(accent, 0.18) : 'rgba(255, 255, 255, 0.08)';
  const cardBg = light ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.03)';
  const hairlineGrad = `linear-gradient(90deg, transparent, ${rgba(accent, light ? 0.35 : 0.45)}, ${rgba(
    accent2,
    light ? 0.28 : 0.35
  )}, transparent)`;

  const compareColBg = light ? 'rgba(255,255,255,0.92)' : rgba(bodyHex, 0.82);
  const processCardBg = light ? 'rgba(255,255,255,0.94)' : rgba(bodyHex, 0.85);
  const statsCardBg = light ? 'rgba(255,255,255,0.9)' : rgba(bodyHex, 0.78);

  return `/* Q1 — auto depth tokens from DESIGN_TEMPLATES (${designMode}) */
:root {
  --sf-font: '${font}', 'PingFang SC', sans-serif;
  --sf-body-bg: ${bodyHex};
  --sf-body-gradient: ${bodyGrad};
  --sf-text-primary: ${primary};
  --sf-text-secondary: ${secondary};
  --sf-text-muted: ${muted};
  --sf-text-subtitle: ${subtitle};
  --sf-accent: ${accent};
  --sf-accent-secondary: ${accent2};
  --sf-accent-light: ${accent2};
  --sf-eyebrow: ${eyebrow};
  --sf-eyebrow-ring: ${eyebrowRing};
  --sf-subtitle-lede: ${subLede};
  --sf-page-num: ${light ? 'rgba(60, 60, 70, 0.45)' : 'rgba(180, 186, 200, 0.55)'};

  --sf-panel-bg: ${panelBg};
  --sf-panel-border: ${panelBorder};
  --sf-panel-border-top: ${panelBorderTop};
  --sf-panel-border-bottom: ${panelBorderBottom};
  --sf-panel-shadow: ${panelShadow};
  --sf-panel-radius: ${panelRadius};

  --sf-hairline: ${hairline};
  --sf-hairline-gradient: ${hairlineGrad};

  --sf-cover-bg: ${coverBg};
  --sf-corner-accent: radial-gradient(circle at 100% 0%, ${g1(light ? 0.14 : 0.22)} 0%, transparent 65%);
  --sf-bottom-line-gradient: linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent2} 60%, transparent 100%);
  --sf-accent-bar-gradient: linear-gradient(90deg, ${accent}, ${accent2});
  --sf-cover-title-glow: ${rgba(accent, light ? 0.12 : 0.18)};

  --sf-page-bg-text: ${pageRadial(light ? 0.06 : 0.1, light ? 0.05 : 0.08)};
  --sf-page-bg-panel: radial-gradient(circle at 20% 15%, ${g1(light ? 0.05 : 0.1)} 0%, transparent 28%),
    ${bodyGrad};
  --sf-page-bg-number: radial-gradient(circle at 18% 20%, ${g1(light ? 0.08 : 0.14)} 0%, transparent 32%),
    radial-gradient(circle at 82% 70%, ${g2(light ? 0.06 : 0.12)} 0%, transparent 38%),
    ${bodyGrad};
  --sf-page-bg-stats: radial-gradient(circle at 20% 15%, ${g1(light ? 0.06 : 0.1)} 0%, transparent 30%),
    ${bodyGrad};
  --sf-page-bg-compare: radial-gradient(circle at 12% 18%, ${g1(light ? 0.07 : 0.12)} 0%, transparent 34%),
    radial-gradient(circle at 88% 80%, ${g2(light ? 0.05 : 0.08)} 0%, transparent 36%),
    ${bodyGrad};
  --sf-page-bg-process: radial-gradient(circle at 15% 20%, ${g1(light ? 0.06 : 0.1)} 0%, transparent 32%),
    ${bodyGrad};
  --sf-page-bg-quote: radial-gradient(circle at 20% 15%, ${g1(light ? 0.05 : 0.1)} 0%, transparent 28%),
    ${bodyGrad};

  --sf-kp-text: ${kpText};
  --sf-kp-divider: ${kpDiv};
  --sf-kp-arrow-glow: 0 0 12px ${rgba(accent, light ? 0.45 : 0.9)};
  --sf-card-muted-border: ${cardBorder};
  --sf-card-muted-bg: ${cardBg};

  --sf-visual-slot-border: 1px solid ${rgba(accent, light ? 0.28 : 0.22)};
  --sf-visual-slot-bg:
    radial-gradient(circle at 30% 25%, ${g1(light ? 0.1 : 0.14)} 0%, transparent 45%),
    radial-gradient(circle at 70% 75%, ${g2(light ? 0.08 : 0.16)} 0%, transparent 50%),
    linear-gradient(145deg, rgba(255, 255, 255, ${light ? 0.5 : 0.05}), rgba(0, 0, 0, ${light ? 0.04 : 0.2}));
  --sf-visual-slot-shadow: 0 32px 80px rgba(0, 0, 0, ${light ? 0.08 : 0.45}), inset 0 1px 0 ${rgba(
    accent,
    light ? 0.15 : 0.12
  )};
  --sf-visual-slot-grid-line-a: ${rgba(accent, light ? 0.07 : 0.04)};
  --sf-visual-slot-grid-line-b: ${rgba(accent2, light ? 0.06 : 0.05)};
  --sf-visual-slot-bar: linear-gradient(135deg, ${rgba(accent, light ? 0.18 : 0.12)}, ${rgba(
    accent2,
    light ? 0.14 : 0.18
  )});
  --sf-visual-slot-bar-shadow: 0 24px 48px rgba(0, 0, 0, ${light ? 0.06 : 0.35});
  --sf-visual-slot-frame-border: 1px solid ${rgba(accent, light ? 0.2 : 0.12)};
  --sf-visual-slot-label: ${rgba(accent, light ? 0.75 : 0.75)};

  --sf-cta-pill-border: 1px solid ${rgba(accent, light ? 0.35 : 0.38)};
  --sf-cta-pill-bg: ${rgba(accent, light ? 0.1 : 0.07)};

  --sf-compare-col-bg: ${compareColBg};
  --sf-compare-col-border: ${panelBorder};
  --sf-compare-col-border-top: ${panelBorderTop};
  --sf-compare-col-shadow: ${light ? '0 16px 40px rgba(0,0,0,0.08)' : '0 24px 64px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)'};
  --sf-compare-col-right-border: ${rgba(accent, light ? 0.42 : 0.32)};
  --sf-compare-col-right-shadow: ${light ? `0 20px 48px ${rgba(accent, 0.12)}` : `0 28px 72px ${rgba(
    accent2,
    0.12
  )}, 0 24px 64px rgba(0, 0, 0, 0.45), inset 0 0 0 1px ${rgba(accent, 0.08)}`};
  --sf-compare-center-line: linear-gradient(180deg, transparent, ${rgba(accent, 0.5)} 20%, ${rgba(
    accent2,
    0.75
  )} 50%, ${rgba(accent, 0.5)} 80%, transparent);
  --sf-compare-center-glow: 0 0 28px ${rgba(accent2, light ? 0.2 : 0.4)};
  --sf-compare-title-border: ${rgba(accent, light ? 0.22 : 0.35)};
  --sf-compare-list-text: ${light ? secondary : rgba(primary, 0.88)};
  --sf-compare-dot-right-glow: 0 0 12px ${rgba(accent, light ? 0.35 : 0.85)};
  --sf-compare-vs-border: 2px solid ${rgba(accent, light ? 0.28 : 0.35)};
  --sf-compare-vs-bg: ${rgba(accent, light ? 0.1 : 0.06)};
  --sf-compare-vs-shadow: 0 0 40px ${rgba(accent, light ? 0.12 : 0.15)};

  --sf-process-rail-line: linear-gradient(90deg, transparent, ${rgba(accent, 0.5)}, ${rgba(accent2, 0.6)}, transparent);
  --sf-process-node-bg: ${accent};
  --sf-process-node-shadow: 0 0 20px ${rgba(accent, light ? 0.35 : 0.85)}, 0 0 40px ${rgba(accent, light ? 0.15 : 0.25)};
  --sf-process-card-bg: ${processCardBg};
  --sf-process-card-border: ${panelBorder};
  --sf-process-card-border-top: ${panelBorderTop};
  --sf-process-card-shadow: ${light ? '0 12px 32px rgba(0,0,0,0.08)' : '0 20px 56px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06)'};

  --sf-stats-card-bg: ${statsCardBg};
  --sf-stats-card-border: ${panelBorder};
  --sf-stats-card-border-top: ${panelBorderTop};
  --sf-stats-card-shadow: ${light ? '0 12px 32px rgba(0,0,0,0.07)' : '0 20px 56px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06)'};
  --sf-stats-number-shadow: 0 0 48px ${rgba(accent, light ? 0.15 : 0.25)};
  --sf-stats-label: ${secondary};
  --sf-stats-desc: ${muted};
  --sf-stats-hero-border: ${rgba(accent, light ? 0.35 : 0.32)};
  --sf-stats-hero-shadow: ${light ? `0 20px 56px ${rgba(accent, 0.12)}` : `0 28px 80px ${rgba(
    accent2,
    0.1
  )}, 0 20px 56px rgba(0, 0, 0, 0.45)`};

  --sf-quote-mark: ${rgba(accent, light ? 0.22 : 0.3)};
  --sf-number-glow: radial-gradient(circle, ${rgba(accent, light ? 0.18 : 0.28)} 0%, transparent 68%);
  --sf-number-glow-hero: radial-gradient(circle, ${rgba(accent, light ? 0.22 : 0.38)} 0%, transparent 65%);
  --sf-number-text-shadow: 0 0 100px ${rgba(accent, light ? 0.12 : 0.35)}, 0 0 24px ${rgba(accent, light ? 0.08 : 0.2)};
  --sf-stat-border-left: 3px solid ${rgba(accent2, light ? 0.45 : 0.55)};
}
`;
}

module.exports = { buildDepthTokensCss, hexToRgb, luminance };
