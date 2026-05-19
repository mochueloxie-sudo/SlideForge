/**
 * Content-type → design_mode inference (shared by design + preview).
 *
 * AI-GENERATED (Cursor)
 */

const DEFAULT_PRESET = 'electric-studio';

const CONTENT_TYPE_MAP = {
  技术文档: 'terminal-green',
  technical: 'terminal-green',
  商业报告: 'bold-signal',
  business: 'bold-signal',
  教学材料: 'creative-voltage',
  educational: 'creative-voltage',
  产品介绍: 'neon-cyber',
  product: 'neon-cyber',
  演讲稿: 'deep-tech-keynote',
  keynote: 'deep-tech-keynote',
  通用演示: 'electric-studio',
  general: 'electric-studio',
  学习笔记: 'notebook-tabs',
  notes: 'notebook-tabs',
  深度内容: 'paper-ink',
  editorial: 'paper-ink',
  创意设计: 'pastel-geometry',
  creative: 'pastel-geometry',
  生活方式: 'split-pastel',
  lifestyle: 'split-pastel',
  品牌展示: 'swiss-modern',
  brand: 'swiss-modern',
  喜茶办公: 'heytea',
  heytea: 'heytea',
  喜茶: 'heytea',
  文化艺术: 'vintage-editorial',
  culture: 'vintage-editorial',
  人文社科: 'dark-botanical',
  humanities: 'dark-botanical'
};

/** Diversity pool for style preview when `themes` not passed (Q2-B). */
const PREVIEW_FALLBACK_POOL = [
  'neon-cyber',
  'bold-signal',
  'electric-studio',
  'paper-ink',
  'dark-botanical',
  'swiss-modern',
  'terminal-green',
  'vintage-editorial'
];

function inferContentType(bodyText, scenes) {
  const text = `${bodyText} ${scenes.map(s => `${s.title || ''} ${s.eyebrow || ''}`).join(' ')}`;

  if (/代码|API|工程|开发|模型|agent|prompt|部署|架构|函数|算法|数据库|CI\/CD/i.test(text)) return '技术文档';
  if (/报告|战略|经营|增长|汇报|指标|财报|OKR|KPI|季度|年度|市场份额/i.test(text)) return '商业报告';
  if (/演讲|主题演讲|Keynote|大会|峰会|发布会|年会|TED/i.test(text)) return '演讲稿';
  if (/产品|功能|上线|发布|Demo|APP|用户体验|交互|界面|版本/i.test(text)) return '产品介绍';
  if (/课程|教学|培训|方法论|步骤|教程|学习路径|知识点/i.test(text)) return '教学材料';

  if (/读书|笔记|摘录|书评|阅读|总结|复盘|手账|随笔|心得|收获/i.test(text)) return '学习笔记';
  if (/深度|报道|访谈|专题|评论|文章|杂志|观点|分析|解读|长文/i.test(text)) return '深度内容';
  if (/人文|社科|人类学|社会学|心理学|策展|民族志|博物馆学|田野调查|学术期刊|思辨|伦理/i.test(text)) return '人文社科';
  if (/历史|文化|艺术|传统|古典|非遗|博物|文学|诗|经典/i.test(text)) return '文化艺术';
  if (/时尚|美妆|穿搭|生活方式|种草|探店|好物|分享|日常|打卡/i.test(text)) return '生活方式';
  if (/喜茶|Heytea|heytea|办公模板|办公横版/i.test(text)) return '喜茶办公';
  if (/品牌|VI|视觉|logo|设计规范|色彩|字体|企业形象|手册/i.test(text)) return '品牌展示';
  if (/创意|设计|插画|视觉|提案|灵感|风格|美学|配色|排版/i.test(text)) return '创意设计';

  return '通用演示';
}

function autoSelectDesignMode(scenes) {
  const bodyText = scenes.flatMap(s => {
    if (Array.isArray(s.body)) return s.body;
    if (typeof s.body === 'string') return [s.body];
    return [];
  }).join(' ');
  const contentType = inferContentType(bodyText, scenes);
  return CONTENT_TYPE_MAP[contentType] || DEFAULT_PRESET;
}

/**
 * @param {object[]} scenes
 * @returns {string[]} 3 distinct theme ids for preview
 */
function suggestPreviewThemes(scenes) {
  const primary = autoSelectDesignMode(scenes);
  const rest = PREVIEW_FALLBACK_POOL.filter(t => t !== primary);
  return [primary, rest[0], rest[1]];
}

module.exports = {
  CONTENT_TYPE_MAP,
  inferContentType,
  autoSelectDesignMode,
  suggestPreviewThemes,
  DEFAULT_PRESET
};
