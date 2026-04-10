/**
 * Page-level + block-level entrance animations for single-slide HTML.
 * FFmpeg / video filter strategies stay in steps/animations/ — do not mix.
 */

'use strict';

const PRESETS = ['none', 'fade', 'stagger'];

function normalizePreset(p) {
  const s = String(p || 'stagger').toLowerCase();
  return PRESETS.includes(s) ? s : 'stagger';
}

/**
 * @param {{ enabled?: boolean, preset?: string }} opts
 * @returns {{ styleBlock: string, bootScript: string, bodyClass: string, settleMs: number }}
 */
function getPageAnimationInjection(opts) {
  const enabled = opts.enabled !== false;
  const preset = normalizePreset(opts.preset);
  if (!enabled || preset === 'none') {
    return { styleBlock: '', bootScript: '', bodyClass: '', settleMs: 0 };
  }

  const keyframes = `
@keyframes vp-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes vp-block-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}`;

  const reduced = `
@media (prefers-reduced-motion: reduce) {
  body.vp-page-anim,
  body.vp-page-anim [data-vp-animate],
  body.vp-page-anim.vp-anim-preset-fade > *:not(.page-num):not(.hairline):not(.vp-footnote) {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}`;

  if (preset === 'fade') {
    const styleBlock = `${keyframes}
${reduced}
body.vp-page-anim.vp-anim-preset-fade > *:not(.page-num):not(.hairline):not(.vp-footnote) {
  opacity: 0;
  animation: vp-fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}`;
    const settleMs = 700;
    return {
      styleBlock,
      bootScript: buildBootScript(settleMs),
      bodyClass: 'vp-page-anim vp-anim-preset-fade',
      settleMs,
    };
  }

  // stagger — blocks use data-vp-animate + inline animation-delay from html_generator
  const styleBlock = `${keyframes}
${reduced}
body.vp-page-anim.vp-anim-preset-stagger [data-vp-animate] {
  opacity: 0;
  animation: vp-block-in 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}`;
  const settleMs = 1600;
  return {
    styleBlock,
    bootScript: buildBootScript(settleMs),
    bodyClass: 'vp-page-anim vp-anim-preset-stagger',
    settleMs,
  };
}

function buildBootScript(settleMs) {
  return `<script id="vp-page-anim-boot">(function(){
  function done(){
    if(document.body){
      document.body.setAttribute('data-vp-anim-ready','1');
      try{ window.dispatchEvent(new CustomEvent('vp-anim-ready')); }catch(e){}
    }
  }
  function run(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      done(); return;
    }
    setTimeout(done, ${settleMs});
  }
  if(document.readyState==='complete') run();
  else window.addEventListener('load', run);
})();</script>`;
}

/**
 * Merge animation CSS + boot script into HTML and add body classes.
 * @param {string} html
 * @param {object|null|undefined} designParams — full Step2 object or null
 */
function shouldWaitForVpAnimReady(designParams) {
  if (!designParams || typeof designParams !== 'object') return false;
  if (designParams.page_animations === false) return false;
  return normalizePreset(designParams.page_animation_preset) !== 'none';
}

function mergeAnimationIntoHtml(html, designParams) {
  if (!designParams || typeof designParams !== 'object') return html;
  const inj = getPageAnimationInjection({
    enabled: designParams.page_animations !== false,
    preset: designParams.page_animation_preset,
  });
  if (!inj.styleBlock && !inj.bootScript) return html;

  const headBits = [];
  if (inj.styleBlock) {
    headBits.push(`<style id="vp-page-anim-style">\n${inj.styleBlock}\n</style>`);
  }
  if (inj.bootScript) headBits.push(inj.bootScript);
  html = html.replace('</head>', `${headBits.join('\n')}\n</head>`);

  if (inj.bodyClass) {
    const cls = inj.bodyClass.trim();
    html = html.replace(/<body([^>]*)>/i, (_, attrs) => {
      const m = attrs.match(/class="([^"]*)"/);
      if (m) {
        return `<body${attrs.replace(/class="[^"]*"/, `class="${m[1]} ${cls}"`)}>`;
      }
      return `<body${attrs} class="${cls}">`;
    });
  }
  return html;
}

module.exports = {
  PRESETS,
  normalizePreset,
  getPageAnimationInjection,
  shouldWaitForVpAnimReady,
  mergeAnimationIntoHtml,
};
