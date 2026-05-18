#!/usr/bin/env node
/**
 * Q2-B — Multi-theme HTML preview (cover + first content slice × N themes).
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ensureDir, writeResult } = require('./utils/step-utils');
const { suggestPreviewThemes } = require('../utils/design_mode_infer');
const STYLE_PRESETS = require('./presets/frontend-presets.json');

const ROOT = path.resolve(__dirname, '..');
const VALID_THEMES = new Set(Object.keys(STYLE_PRESETS.presets || {}));

function runExecutor(cmd) {
  const r = spawnSync('node', [path.join(ROOT, 'executor.js')], {
    input: JSON.stringify(cmd),
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit']
  });
  if (r.status !== 0) {
    console.error(r.stderr || '');
    process.exit(r.status || 1);
  }
  const out = r.stdout || '';
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(`executor returned no JSON for ${cmd.command}`);
  return JSON.parse(out.slice(start, end + 1));
}

/**
 * First cover scene + first non-cover scene (2 pages).
 * @param {object[]} scenes
 */
function pickPreviewScenes(scenes) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return [
      { type: 'cover', title: 'Preview', subtitle: 'slide-forge' },
      { type: 'content', content_variant: 'text', title: 'Content', body: 'Preview body text.' }
    ];
  }
  const coverIdx = scenes.findIndex(s => s.type === 'cover');
  const cover = coverIdx >= 0
    ? JSON.parse(JSON.stringify(scenes[coverIdx]))
    : { ...JSON.parse(JSON.stringify(scenes[0])), type: 'cover' };

  const contentIdx = scenes.findIndex((s, i) => s.type !== 'cover' && i !== coverIdx);
  const content = contentIdx >= 0
    ? JSON.parse(JSON.stringify(scenes[contentIdx]))
    : JSON.parse(JSON.stringify(scenes[coverIdx >= 0 ? Math.min(coverIdx + 1, scenes.length - 1) : 0]));

  if (content.type === 'cover') content.type = 'content';
  return [cover, content];
}

let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const params = JSON.parse(input);
    const output_dir = path.resolve(params.output_dir || './output/preview');
    const scenesPath = params.scenes ? path.resolve(params.scenes) : null;

    let scenesData = params.scenes;
    if (typeof scenesData === 'string') {
      scenesData = JSON.parse(fs.readFileSync(scenesData, 'utf8'));
    }
    if (scenesData && !Array.isArray(scenesData) && scenesData.scenes) {
      scenesData = scenesData.scenes;
    }
    if (!Array.isArray(scenesData)) {
      throw new Error('preview: "scenes" must be an array or path to scenes.json');
    }

    let themes = Array.isArray(params.themes) ? params.themes.map(String) : null;
    if (!themes || !themes.length) {
      themes = suggestPreviewThemes(scenesData);
    }
    themes = themes.map(t => String(t).trim()).filter(t => VALID_THEMES.has(t));
    if (!themes.length) {
      throw new Error('preview: no valid themes (check names against STYLE_PRESETS)');
    }

    ensureDir(output_dir);
    const slicePath = path.join(output_dir, '_preview_scenes.json');
    const previewScenes = pickPreviewScenes(scenesData);
    fs.writeFileSync(slicePath, JSON.stringify(previewScenes, null, 2), 'utf8');

    const outputs = [];
    for (const theme of themes) {
      const sub = path.join(output_dir, theme);
      fs.rmSync(sub, { recursive: true, force: true });
      ensureDir(sub);
      runExecutor({
        command: 'design',
        scenes: slicePath,
        output_dir: sub,
        design_mode: theme,
        page_animations: params.page_animations,
        page_animation_preset: params.page_animation_preset,
        enhancement: params.enhancement,
        mode: params.mode,
        render_mode: params.render_mode,
        typography_scale: params.typography_scale
      });
      runExecutor({
        command: 'html',
        scenes: slicePath,
        design_params: path.join(sub, 'design_params.json'),
        output_dir: sub
      });
      outputs.push(sub);
    }

    const rows = themes.map((t) => {
      const base = `./${t}`;
      return `<section class="sf-prev-card"><h2>${t}</h2><div class="sf-prev-row">
  <div class="sf-prev-frame"><div class="lbl">page_001</div><iframe src="${base}/page_001.html" title="${t} p1"></iframe></div>
  <div class="sf-prev-frame"><div class="lbl">page_002</div><iframe src="${base}/page_002.html" title="${t} p2"></iframe></div>
</div></section>`;
    }).join('\n');

    const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>SlideForge — style preview</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #111; color: #e8e8e8; }
    h1 { font-size: 1.25rem; }
    p.note { opacity: 0.85; max-width: 72ch; font-size: 0.9rem; }
    .sf-prev-grid { display: flex; flex-direction: column; gap: 28px; margin-top: 20px; }
    .sf-prev-card { border: 1px solid #333; border-radius: 12px; padding: 16px; background: #1a1a1a; }
    .sf-prev-card h2 { margin: 0 0 12px; font-size: 1rem; color: #9cf; }
    .sf-prev-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 900px) { .sf-prev-row { grid-template-columns: 1fr; } }
    .sf-prev-frame { background: #000; border-radius: 8px; overflow: hidden; }
    .sf-prev-frame .lbl { font-size: 11px; padding: 4px 8px; color: #888; }
    iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; display: block; background: #000; }
  </style>
</head>
<body>
  <h1>SlideForge style preview</h1>
  <p class="note">Agent-driven selection: pick a theme, then set <code>recommended_design_mode</code> or pass <code>design_mode</code> on <code>design</code> / <code>render</code> and run the normal pipeline.</p>
  <div class="sf-prev-grid">
${rows}
  </div>
</body>
</html>`;

    const previewPath = path.join(output_dir, 'preview.html');
    fs.writeFileSync(previewPath, previewHtml, 'utf8');
    outputs.unshift(previewPath);

    writeResult({
      success: true,
      step: 'preview',
      outputs,
      message: `Preview HTML for ${themes.length} theme(s) → ${previewPath}`,
      metadata: {
        themes,
        scenes_slice: slicePath,
        preview_html: path.relative(process.cwd(), previewPath)
      }
    });
  } catch (err) {
    console.error('❌ preview 失败:', err.message);
    process.exit(1);
  }
});
