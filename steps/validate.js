#!/usr/bin/env node
/**
 * Validate — 本地 scenes.json 校验（零 LLM、零网络依赖）
 *
 * AI-GENERATED (Cursor)
 *
 * 给宿主 Agent 自检用：Agent 在对话内按 docs/SCENES_SCHEMA.md 写出 scenes.json
 * 后，调用本工具拿到结构化错误清单，自行修订后再喂给 design。
 *
 * Input (stdin JSON):
 *   { "scenes": "<path|array>" }
 *
 * Output:
 *   { success, valid, errors: [], warnings: [], scenes_count, ... }
 *   exit code 0：通过（可能含 warnings）
 *   exit code 1：硬错误（errors 非空）
 */

const fs   = require('fs');
const path = require('path');
const { lintQuality } = require('./quality_lint');
const { suggestContentVariant } = require('../utils/variant_suggest');

const VALID_SCENE_TYPES   = new Set(['cover', 'content', 'summary']);
const VALID_VARIANTS = new Set([
  'panel', 'stats_grid', 'timeline', 'two_col', 'number', 'quote',
  'text', 'code', 'table', 'chart', 'nav_bar',
  'panel_stat', 'number_bullets', 'quote_context', 'text_icons',
  'icon_grid', 'card_grid',
  'compare', 'process_flow', 'architecture_stack', 'funnel',
  'auto'
]);
/** In strict mode these quality_warnings become errors (block render). */
const STRICT_QUALITY_CODES = new Set([
  'QUALITY_VARIANT_MISMATCH',
  'QUALITY_PANEL_RUN',
  'QUALITY_VARIANT_RUN',
  'QUALITY_PANEL_RATIO',
  'QUALITY_NO_HIGH_ENERGY'
]);

const VALID_THEMES = new Set([
  'electric-studio', 'bold-signal', 'creative-voltage', 'dark-botanical',
  'neon-cyber', 'terminal-green', 'deep-tech-keynote',
  'notebook-tabs', 'paper-ink', 'pastel-geometry', 'split-pastel',
  'swiss-modern', 'vintage-editorial'
]);

// 各变体「最少要有的字段」——只挑硬约束，弱建议放 warning
const REQUIRED_BY_VARIANT = {
  panel:              ['key_points'],
  stats_grid:         ['stats'],
  timeline:           ['steps'],
  two_col:            ['left_body'],
  number:             ['big_number'],
  quote:              ['quote_body'],
  text:               ['body'],
  code:               ['code_snippet'],
  table:              ['table_headers', 'table_rows'],
  chart:              ['chart_data'],
  nav_bar:            ['nav_items'],
  panel_stat:         ['key_points', 'stat_value'],
  number_bullets:     ['stat_value', 'key_points'],
  quote_context:      ['quote_body', 'context_body'],
  text_icons:         ['body', 'icons'],
  icon_grid:          ['icons'],
  card_grid:          ['cards'],
  compare:            ['compare_left_points', 'compare_right_points'],
  process_flow:       [],
  architecture_stack: ['layers'],
  funnel:             ['funnel_stages']
};

// ─── Hint table ──────────────────────────────────────────────────────────────
// 目的：让 Agent 拿到 error 就能直接修，不必去翻 SCENES_SCHEMA。
// 查找顺序：先按 error msg 模式（更具体），再按 `at` 路径末段字段名。

const FIELD_HINTS = {
  key_points:           '常见拼写错误：keypoints / keyPoints / key_point。正确是 snake_case 复数 "key_points"。详见 SCENES_SCHEMA §3.1',
  key_point_descs:      '与 key_points 同长的数组；panel + layout_hint:"grid-3"/"cards" 时强烈建议提供',
  stats:                'stats[] 每项需 { number, label, desc }，desc 必填——否则页面信息密度太低',
  steps:                'timeline 的 steps[] 每项需 { num, label, desc }',
  process_stages:       'process_flow 的 process_stages[] 每项需 { label, desc }，3-6 项',
  flow_lanes:           'process_flow 的 flow_lanes[] 每项需 { lane_label, cells: [{label, desc}] }，2-3 lane',
  layers:               'architecture_stack 的 layers[] 每项需 { title, desc }，3-5 层',
  funnel_stages:        'funnel 的 funnel_stages[] 每项需 { label, desc }，3-5 阶',
  quote_body:           'quote / quote_context 的主引文字段（字符串）',
  context_body:         'quote_context 的上下文段（1-2 句背景或意义）',
  cards:                'card_grid 的 cards[] 每项需 { title, body }，body 必填——只有 title 的卡片浪费空间',
  icons:                'icon_grid / text_icons 的 icons[] 每项需 { emoji, label, desc }',
  compare_left_points:  'compare 需同时提供 compare_left_points 与 compare_right_points（建议等长 3-5 项）',
  compare_right_points: 'compare 需同时提供 compare_left_points 与 compare_right_points（建议等长 3-5 项）',
  big_number:           'number 的主数字（如 "240%"、"1.2 亿"）',
  stat_value:           'panel_stat / number_bullets 的主数字',
  left_body:            'two_col 左栏散文（2-3 句最佳）',
  body:                 'text 的散文 / text_icons 的散文 / number 的说明文字',
  code_snippet:         'code 变体的代码字符串',
  table_headers:        'table 表头数组（一维）',
  table_rows:           'table 二维数组：行 × 列',
  chart_data:           'chart 数据 [{label, values[], unit?}]',
  nav_items:            'nav_bar 顶栏 3-6 个短章节名；正文区另须 subtitle 或 key_points（见 SCENES_SCHEMA §3.11）',
  content_variant:      '每个 type:"content" 必须声明 content_variant；22 种合法值见 SCENES_SCHEMA §3 或 §0.2 决策图',
  title:                'title 必填且非空字符串',
  type:                 'type 必须是 "cover" | "content" | "summary" 之一',
  script:               'script 是口播逐字稿；仅 format 含 video 时必填，zh 150-200 字 / en 50-80 词',
};

const MSG_PATTERN_HINTS = [
  { pattern: /^expected exactly 1 cover scene/,
    hint: '首页必须是 type:"cover" 且只能有一个；其它页用 type:"content"，末页可用 type:"summary"' },
  { pattern: /^expected at most 1 summary scene/,
    hint: '末页可放一个 type:"summary"（可选）；中间页全部用 type:"content"' },
  { pattern: /first scene should be type=cover/,
    hint: 'scenes 数组第一项必须是 cover 页（虽然只是 warning 不阻塞渲染，建议修正）' },
  { pattern: /process_flow requires one of/,
    hint: 'process_flow 需要 process_stages[] 或 flow_lanes[]（或 legacy steps[]）至少一个非空。最常用 process_stages（横向阶段条）' },
  { pattern: /scenes must be an array/,
    hint: 'scenes.json 顶层是 JSON 数组 [{...}, {...}]，不是对象；{scenes:[...]} 包装也兼容' },
  { pattern: /scenes is empty/,
    hint: '至少要有一个 cover 页才能渲染' },
  { pattern: /consecutive same content_variant/,
    hint: '相邻两页同变体观感单调，考虑换变体或合并；这是 warning 不阻塞渲染' },
  { pattern: /script very short/,
    hint: 'zh 建议 150-200 字 / en 50-80 词；过短会让 TTS 语音过急' },
  { pattern: /script very long/,
    hint: '过长会让单页朗读时间偏长（>30s）；建议拆分到多页或精炼' },
  { pattern: /unknown theme id/,
    hint: '13 个合法主题 id：electric-studio / bold-signal / creative-voltage / dark-botanical / neon-cyber / terminal-green / deep-tech-keynote / swiss-modern / paper-ink / vintage-editorial / notebook-tabs / pastel-geometry / split-pastel' },
  { pattern: /invalid type/,
    hint: 'type 必须是 "cover" | "content" | "summary" 三选一' },
  { pattern: /unknown content_variant/,
    hint: '22 种合法变体：panel / stats_grid / timeline / two_col / number / quote / text / code / table / chart / nav_bar / panel_stat / number_bullets / quote_context / text_icons / icon_grid / card_grid / compare / process_flow / architecture_stack / funnel。决策图见 SCENES_SCHEMA §0.2' },
  { pattern: /content scene must declare content_variant/,
    hint: '每个 type:"content" 必须有 content_variant。先按 §0.2a 填字段，再写与之匹配的变体名；仅当只有 key_points[] 时用 panel' },
  { pattern: /declared ".+" but fields suggest/,
    hint: '见 quality_warnings 的 suggested_content_variant；改 content_variant 或删/移字段。详见 SCENES_SCHEMA §0.2a' },
];

function lookupHint(at, msg) {
  for (const { pattern, hint } of MSG_PATTERN_HINTS) {
    if (pattern.test(msg)) return hint;
  }
  const lastSegment = (at || '').split('.').pop().replace(/^\$/, '');
  if (FIELD_HINTS[lastSegment]) return FIELD_HINTS[lastSegment];
  return undefined;
}

function attachHints(items) {
  for (const it of items) {
    const h = lookupHint(it.at, it.msg);
    if (h) it.hint = h;
  }
}

function validate(scenesData, opts = {}) {
  const lintCtx = {
    scenesPath: opts.scenesPath,
    outputDir: opts.outputDir
  };
  const errors = [];
  const warnings = [];

  if (!Array.isArray(scenesData)) {
    errors.push({ at: '$', msg: 'scenes must be an array' });
    return { valid: false, errors, warnings };
  }

  if (scenesData.length === 0) {
    errors.push({ at: '$', msg: 'scenes is empty' });
    return { valid: false, errors, warnings };
  }

  const covers   = scenesData.filter(s => s && s.type === 'cover');
  const summaries = scenesData.filter(s => s && s.type === 'summary');
  if (covers.length !== 1)    errors.push({ at: '$', msg: `expected exactly 1 cover scene, got ${covers.length}` });
  if (summaries.length > 1)   errors.push({ at: '$', msg: `expected at most 1 summary scene, got ${summaries.length}` });
  if (scenesData[0].type !== 'cover') warnings.push({ at: '[0]', msg: 'first scene should be type=cover' });

  scenesData.forEach((scene, i) => {
    const at = `[${i}]`;

    if (!scene || typeof scene !== 'object') {
      errors.push({ at, msg: 'scene must be an object' });
      return;
    }

    if (!scene.type) errors.push({ at, msg: 'missing required field: type' });
    else if (!VALID_SCENE_TYPES.has(scene.type)) {
      errors.push({ at: `${at}.type`, msg: `invalid type "${scene.type}", must be cover|content|summary` });
    }

    if (!scene.title || typeof scene.title !== 'string' || !scene.title.trim()) {
      errors.push({ at: `${at}.title`, msg: 'missing or empty required field: title' });
    }

    if (scene.mode != null && scene.mode !== '') {
      if (scene.mode !== 'production' && scene.mode !== 'art-directed') {
        errors.push({
          at: `${at}.mode`,
          msg: `invalid mode "${scene.mode}", must be "production" or "art-directed"`
        });
      } else if (scene.mode === 'art-directed') {
        const hasCss = (scene.custom_css && String(scene.custom_css).trim()) ||
          (scene.custom_css_file && String(scene.custom_css_file).trim());
        if (!hasCss) {
          warnings.push({
            at: `${at}.mode`,
            msg: 'mode "art-directed" but no custom_css / custom_css_file — art pass will be empty'
          });
        }
      }
    }
    if (scene.custom_css && String(scene.custom_css).length > 120000) {
      warnings.push({
        at: `${at}.custom_css`,
        msg: `custom_css very long (${String(scene.custom_css).length} chars); may bloat HTML`
      });
    }

    if (scene.type === 'content') {
      if (!scene.content_variant) {
        errors.push({ at: `${at}.content_variant`, msg: 'content scene must declare content_variant' });
      } else if (!VALID_VARIANTS.has(scene.content_variant)) {
        errors.push({ at: `${at}.content_variant`, msg: `unknown content_variant "${scene.content_variant}"` });
      } else {
        const effectiveVariant =
          scene.content_variant === 'auto'
            ? (suggestContentVariant(scene) || 'text')
            : scene.content_variant;
        const required = REQUIRED_BY_VARIANT[effectiveVariant] || [];
        for (const field of required) {
          const v = scene[field];
          const missing = v === undefined || v === null ||
            (Array.isArray(v) && v.length === 0) ||
            (typeof v === 'string' && !v.trim());
          if (missing) {
            errors.push({
              at: `${at}.${field}`,
              msg: `content_variant="${scene.content_variant}" (resolves to ${effectiveVariant}) requires non-empty "${field}"`
            });
          }
        }

        if (effectiveVariant === 'process_flow') {
          const hasStages = Array.isArray(scene.process_stages) && scene.process_stages.length > 0;
          const hasLanes  = Array.isArray(scene.flow_lanes)     && scene.flow_lanes.length > 0;
          const hasSteps  = Array.isArray(scene.steps)          && scene.steps.length > 0;
          if (!hasStages && !hasLanes && !hasSteps) {
            errors.push({
              at: `${at}`,
              msg: 'process_flow requires one of: process_stages | flow_lanes | steps'
            });
          }
        }
      }

      if (scene.script !== undefined) {
        if (typeof scene.script !== 'string') {
          errors.push({ at: `${at}.script`, msg: 'script must be a string when present' });
        } else if (scene.script.length > 0 && scene.script.length < 30) {
          warnings.push({ at: `${at}.script`, msg: `script very short (${scene.script.length} chars); typical zh 150-200, en 50-80 words` });
        } else if (scene.script.length > 600) {
          warnings.push({ at: `${at}.script`, msg: `script very long (${scene.script.length} chars); may be hard to narrate` });
        }
      }
    }
  });

  if (opts.recommended_design_mode !== undefined && opts.recommended_design_mode !== null) {
    if (!VALID_THEMES.has(String(opts.recommended_design_mode).trim())) {
      errors.push({ at: 'project.recommended_design_mode', msg: `unknown theme id "${opts.recommended_design_mode}"` });
    }
  }

  for (let i = 1; i < scenesData.length; i++) {
    const a = scenesData[i - 1];
    const b = scenesData[i];
    if (a && b && a.type === 'content' && b.type === 'content' &&
        a.content_variant && a.content_variant === b.content_variant) {
      warnings.push({
        at: `[${i}]`,
        msg: `consecutive same content_variant "${a.content_variant}" — Step2 will try to rebalance, but consider merging`
      });
    }
  }

  attachHints(errors);
  attachHints(warnings);

  const { quality_warnings } = lintQuality(scenesData, lintCtx);

  if (opts.strict) {
    for (const q of quality_warnings) {
      if (STRICT_QUALITY_CODES.has(q.code)) {
        errors.push({
          at: q.at || '$',
          code: q.code,
          msg: `[strict] ${q.msg}`,
          hint: q.hint
        });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings, quality_warnings, strict: !!opts.strict };
}

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const params = JSON.parse(input);
    const { scenes, project } = params;

    if (!scenes) throw new Error('validate: missing required field "scenes"');

    let scenesData = scenes;
    let scenesPath = null;
    if (typeof scenesData === 'string') {
      const abs = path.resolve(scenesData);
      if (!fs.existsSync(abs)) throw new Error(`validate: file not found: ${abs}`);
      scenesPath = abs;
      scenesData = JSON.parse(fs.readFileSync(abs, 'utf8'));
    }
    if (scenesData && !Array.isArray(scenesData) && Array.isArray(scenesData.scenes)) {
      scenesData = scenesData.scenes;
    }

    let projectData = project;
    if (typeof projectData === 'string') {
      const abs = path.resolve(projectData);
      if (fs.existsSync(abs)) projectData = JSON.parse(fs.readFileSync(abs, 'utf8'));
    }

    const strict = params.strict === true || params.strict === 'true';
    const result = validate(scenesData, {
      recommended_design_mode: projectData && projectData.recommended_design_mode,
      scenesPath,
      outputDir: params.output_dir,
      strict
    });

    const output = {
      success: result.valid,
      step: 'validate',
      valid: result.valid,
      strict,
      scenes_count: Array.isArray(scenesData) ? scenesData.length : 0,
      errors: result.errors,
      warnings: result.warnings,
      quality_warnings: result.quality_warnings,
      message: result.valid
        ? `OK — ${Array.isArray(scenesData) ? scenesData.length : 0} scenes${result.warnings.length ? ` (${result.warnings.length} warnings)` : ''}${result.quality_warnings.length ? `, ${result.quality_warnings.length} quality` : ''}`
        : `INVALID — ${result.errors.length} error(s), ${result.warnings.length} warning(s)`
    };

    console.log(JSON.stringify(output, null, 2));
    // 注意：永远 exit 0 —— validate 是「检查工具」，valid:false 不是工具失败，
    // 而是工具发现了问题。结果由调用方（Agent / executor）读 JSON 字段判断。
    // 仅在工具自身崩溃（文件不存在、JSON 解析失败等）时 exit 1。
    process.exit(0);
  } catch (err) {
    process.stderr.write(`❌ validate failed: ${err.message}\n`);
    if (process.env.DEBUG) process.stderr.write(err.stack + '\n');
    process.exit(1);
  }
});

module.exports = { validate, VALID_VARIANTS, VALID_THEMES, STRICT_QUALITY_CODES };
