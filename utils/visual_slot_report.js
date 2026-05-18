/**
 * Post-render report: which pages can / should get user-supplied visuals.
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { resolveVisualAsset } = require('./visual_assets');

const VISUAL_FIELDS = ['hero_image', 'diagram', 'brand_mark'];

const FIELD_HINTS = {
  hero_image: '产品截图、现场照片、横图（cover 裁切）',
  diagram: '架构/流程示意图，PNG 或 SVG 均可',
  brand_mark: 'Logo 或标识，透明底 PNG/SVG 更佳'
};

/**
 * @param {object} scene
 * @returns {string|null}
 */
function pickVisualField(scene) {
  if (!scene || typeof scene !== 'object') return null;
  for (const f of VISUAL_FIELDS) {
    if (scene[f] != null && String(scene[f]).trim()) return f;
  }
  return null;
}

/**
 * @param {number} pageNum
 * @param {string} field
 * @param {string} [sceneId]
 * @returns {string}
 */
function suggestAssetPath(pageNum, field, sceneId) {
  const slug = sceneId
    ? String(sceneId).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)
    : `page-${String(pageNum).padStart(3, '0')}`;
  const ext = field === 'diagram' ? 'svg' : 'png';
  return `assets/${slug}-${field === 'brand_mark' ? 'logo' : field}.${ext}`;
}

/**
 * @param {object[]} scenes
 * @param {{ scenesPath?: string, htmlDir?: string }} [opts]
 * @returns {{ slots: object[], gaps_for_user: object[], has_gaps: boolean }}
 */
function buildVisualSlotReport(scenes, opts = {}) {
  const slots = [];
  const gaps_for_user = [];

  if (!Array.isArray(scenes) || scenes.length === 0) {
    return { slots, gaps_for_user, has_gaps: false };
  }

  const ctx = {
    scenesPath: opts.scenesPath,
    outputDir: opts.htmlDir
  };

  scenes.forEach((scene, i) => {
    if (!scene || scene.type === 'cover') return;
    const pageNum = i + 1;
    const field = pickVisualField(scene);
    const wantsSlot = scene.composition === 'split-visual' || !!field;
    if (!wantsSlot) return;

    const htmlFile = `page_${String(pageNum).padStart(3, '0')}.html`;
    let placeholderInHtml = false;
    if (opts.htmlDir) {
      const fp = path.join(path.resolve(opts.htmlDir), htmlFile);
      if (fs.existsSync(fp)) {
        placeholderInHtml = fs.readFileSync(fp, 'utf8').includes('data-vp-placeholder');
      }
    }

    const base = {
      page: pageNum,
      scene_id: scene.id || null,
      title: scene.title || '',
      composition: scene.composition || 'default',
      html_file: htmlFile
    };

    if (!field) {
      const suggested_path = suggestAssetPath(pageNum, 'diagram', scene.id);
      const row = {
        ...base,
        field: null,
        declared_path: null,
        resolved: false,
        placeholder_in_html: placeholderInHtml,
        status: 'split_visual_no_field',
        suggested_path,
        suggested_field: 'diagram',
        hint: FIELD_HINTS.diagram,
        user_action: `补图：将文件放到 scenes.json 同目录下的 ${suggested_path}，并在该页 scenes 增加 "diagram" 与 "composition":"split-visual"`
      };
      slots.push(row);
      gaps_for_user.push(row);
      return;
    }

    const declared = String(scene[field]).trim();
    const { url, warning } = resolveVisualAsset(declared, ctx);
    const resolved = !!url;
    const needsUserImage = !resolved || placeholderInHtml;
    const suggested_path = suggestAssetPath(pageNum, field, scene.id);

    const row = {
      ...base,
      field,
      declared_path: declared,
      resolved,
      placeholder_in_html: placeholderInHtml,
      status: resolved && !placeholderInHtml
        ? 'ok'
        : (placeholderInHtml ? 'placeholder' : 'file_not_found'),
      suggested_path: needsUserImage ? suggested_path : declared,
      hint: FIELD_HINTS[field] || '',
      user_action: needsUserImage
        ? `补图：把图片保存为 ${suggested_path}（相对 scenes.json），更新 scenes[${i}].${field}，再跑 html → package`
        : null
    };
    slots.push(row);
    if (needsUserImage) gaps_for_user.push(row);
    if (warning && needsUserImage) row.resolve_warning = warning;
  });

  return {
    slots,
    gaps_for_user,
    has_gaps: gaps_for_user.length > 0
  };
}

/**
 * @param {{ gaps_for_user: object[], has_gaps: boolean }} report
 * @returns {string}
 */
function visualSlotsReportMarkdown(report) {
  if (!report.has_gaps) {
    return [
      '## Visual slots (补图指引)',
      '',
      '_无待补主视觉位；若需加图，在任意 content 页设 `composition:"split-visual"` 并填写 `hero_image` / `diagram` / `brand_mark`。_',
      ''
    ].join('\n');
  }

  const lines = [
    '## Visual slots — 建议用户补图',
    '',
    '以下页面已预留主视觉区（或声明了资产但未解析）。**交付后**请主动告知用户；收到图后更新 `scenes.json` 路径并重跑 `html`（+ `screenshot` → `package`）。',
    '',
    '| 页 | 标题 | 字段 | 状态 | 建议路径 | 说明 |',
    '|----|------|------|------|----------|------|'
  ];

  for (const g of report.gaps_for_user) {
    const status = g.status === 'placeholder' ? '占位符' : (g.status === 'file_not_found' ? '文件未找到' : '缺字段');
    lines.push(
      `| ${g.page} | ${String(g.title).replace(/\|/g, '\\|').slice(0, 24)} | ${g.field || '—'} | ${status} | \`${g.suggested_path}\` | ${g.hint || ''} |`
    );
  }
  lines.push('', '### Agent 第二轮命令', '', '```bash', '# 用户供图并更新 scenes.json 后', 'echo \'{"command":"validate","scenes":"./project/scenes.json"}\' | node executor.js', 'echo \'{"command":"html","scenes":"./project/scenes.json","design_params":"./project/design_params.json","output_dir":"./project"}\' | node executor.js', 'echo \'{"command":"screenshot","html_dir":"./project","output_dir":"./project/screenshots","design_params":"./project/design_params.json"}\' | node executor.js', 'echo \'{"command":"package","scenes":"./project/scenes.json","screenshots_dir":"./project/screenshots","html_dir":"./project","output_dir":"./project","format":["pdf","html"]}\' | node executor.js', '```', '');
  return lines.join('\n');
}

module.exports = {
  buildVisualSlotReport,
  visualSlotsReportMarkdown,
  pickVisualField,
  suggestAssetPath,
  VISUAL_FIELDS
};
