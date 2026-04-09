/**
 * HTML Builder - 从 design_params 动态生成幻灯片 HTML
 * 完全参数驱动，零硬编码
 * 
 * 整合 frontend-slides 设计系统：
 * - 严格的视口适配（100vh + overflow hidden）
 * - clamp() 响应式字体
 * - 内容密度检查
 * - 12 个预设设计模式
 * - 丰富的抽象装饰元素
 */

const fs = require('fs');
const path = require('path');

// 加载 frontend-slides 预设
const STYLE_PRESETS_PATH = path.join(__dirname, '../steps/presets/frontend-presets.json');
let STYLE_PRESETS = {};
try {
  STYLE_PRESETS = JSON.parse(fs.readFileSync(STYLE_PRESETS_PATH, 'utf-8')).presets || {};
} catch (e) {
  console.error('⚠️ 未找到 frontend-presets.json，使用内置默认预设');
}

// 图标 SVG 库（精简版）
const ICON_SVG = {
  "🤖": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="8" r="3"/><path d="M12 13v5"/><path d="M8 21h8"/></svg>',
  "💻": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  "🦾": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 2.1 12.05"/><path d="M12 12 5.5 5.5"/></svg>',
  "⚡": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L2 13h9l-1 9 11-9h-9l1-9z"/></svg>',
  "🏛️": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>',
  "🧱": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7v2l10 4 10-4V7z"/><path d="M12 22V12"/><path d="M12 12l-6 6"/><path d="M12 12l6 6"/></svg>',
  "👔": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l-5 5v5h10V7z"/><path d="M12 22a5 5 0 0 1 0-10"/></svg>',
  "📊": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
  "🎯": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  "🚀": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2 2.1 12.05"/><path d="M12 12 5.5 5.5"/><path d="M12 12l6-6"/></svg>',
  "⏳": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  "♾️": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
  "🔢": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v2"/><path d="M12 2v2"/><path d="M16 2v2"/><path d="M8 8h2"/><path d="M12 8h2"/><path d="M16 8h2"/><path d="M8 14h2"/><path d="M12 14h2"/><path d="M16 14h2"/></svg>',
  "⚙️": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/></svg>',
  "🧠": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 15.47 5 13.38 5 11a7 7 0 0 1 7-7z"/><path d="M9 22v-6"/><path d="M15 22v-6"/></svg>'
};

// Google Fonts 映射
const FONT_URLS = {
  'Archivo Black': 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
  'Manrope': 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;800&display=swap',
  'Syne': 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap',
  'Cormorant': 'https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600&display=swap',
  'IBM Plex Sans': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400&display=swap',
  'Bodoni Moda': 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&display=swap',
  'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap',
  'Orbitron': 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap',
  'JetBrains Mono': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
  'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap',
  'Georgia': 'https://fonts.googleapis.com/css2?family=Georgia&display=swap',
  'Source Serif Pro': 'https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;700&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap',
  'Noto Sans SC': 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap'
};

class HtmlBuilder {
  constructor(designParams, scenes, options = {}) {
    this.d = designParams;
    this.scenes = scenes;
    this.options = {
      outputDir: options.outputDir || './output/html',
      waitForFonts: options.waitForFonts !== false,
      debug: options.debug || false
    };
  }

  async buildAll() {
    const results = [];
    for (const scene of this.scenes) {
      // 内容密度检查（frontend-slides 规则）
      this.validateContentDensity(scene);

      const html = this.renderSingleSlide(scene);
      const filename = `page_${String(scene.id).padStart(3, '0')}.html`;
      const filepath = path.join(this.options.outputDir, filename);
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      fs.writeFileSync(filepath, html, 'utf-8');
      results.push(filepath);
      // 日志输出到 stderr，避免污染 stdout JSON
      console.error(`  ✅ 页面 ${scene.id}: ${filename} (${html.length} bytes)`);
    }
    return results;
  }

  validateContentDensity(scene) {
    // frontend-slides 内容密度规则
    const limits = {
      cover: { title: 1, body: 0, subtitle: 1 },
      content: { title: 1, body: 6, subtitle: 0 },
      summary: { title: 1, body: 8, subtitle: 0 }
    };
    const limit = limits[scene.type] || limits.content;
    const bodyCount = scene.body?.length || 0;

    if (bodyCount > limit.body) {
      console.error(`  ⚠️ 页面 ${scene.id} 内容密度超限: ${bodyCount} 行 > ${limit.body} 行限制，建议拆分`);
    }
  }

  renderSingleSlide(scene) {
    const d = this.d;
    const isApple = d.appleStyle === true;

    // 1. 构建 CSS（完全从 design 参数读取 + frontend-slides 视口规则）
    const css = this.buildCSS(scene, d, isApple);

    // 2. 构建装饰元素（frontend-slides 抽象形状）
    const decorations = this.buildDecorations(d, isApple);

    // 3. 构建主体内容
    const content = this.buildContent(scene, d);

    // 4. splitPanel 背景作为 body 内联样式
    const bodyStyle = this.getBodyStyle(d);

    // 5. 组装 HTML
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scene.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${this.buildFontLinks(d)}
  <style>
    /* Frontend Slides: Viewport Fitting Base */
    ${this.getViewportBaseCSS()}

    /* Custom Design Styles */
    ${css}

    /* Per-page-type CSS */
    ${this.buildPageTypeCSS(scene, d)}
  </style>
</head>
<body class="h-screen w-screen flex items-center justify-center relative overflow-hidden" ${bodyStyle}>
  ${decorations}
  <div class="relative z-10 ${this.getContainerClass(scene, d, isApple)}">
    ${content}
  </div>
</body>
</html>`;
  }

  buildFontLinks(d) {
    // 从 design_params 收集需要加载的字体
    const fonts = new Set();
    const titleFont = d.typography?.title?.font || 'Space Grotesk';
    const bodyFont = d.typography?.body?.font || 'Noto Sans SC';
    fonts.add(titleFont);
    fonts.add(bodyFont);

    // 构建 font link
    let links = '';
    for (const [fontName, url] of Object.entries(FONT_URLS)) {
      if (fonts.has(fontName)) {
        links += `\n  <link href="${url}" rel="stylesheet">`;
      }
    }
    // 默认加载 Space Grotesk + Noto Sans SC
    if (!links) {
      links = '\n  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">';
    }
    return links;
  }

  getViewportBaseCSS() {
    // frontend-slides 核心视口规则
    return `
/* Frontend Slides: Viewport Fitting */
html, body {
  height: 100%;
  overflow: hidden;
}
html {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
/* 每个 slide 必须严格 100vh */
.slide {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  position: relative;
}
.slide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 100%;
  overflow: hidden;
}
/* 响应式断点（frontend-slides） */
@media (max-height: 700px) {
  :root { --slide-padding: clamp(0.75rem, 3vw, 2rem); }
}
@media (max-height: 600px) {
  :root { --slide-padding: clamp(0.5rem, 2.5vw, 1.5rem); }
  .decorative, .nav-dots { display: none; }
}
/* 减少动画（无障碍） */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.2s !important;
  }
  html { scroll-behavior: auto; }
}
`;
  }

  buildCSS(scene, d, isApple) {
    // 字体
    const titleFont = this.resolveFont(d.typography?.title?.font || 'Space Grotesk', isApple);
    const bodyFont = this.resolveFont(d.typography?.body?.font || 'Noto Sans SC', isApple);
    const codeFont = this.resolveFont(d.typography?.code?.font || 'JetBrains Mono', isApple);

    // 布局
    const direction = (d.page_directions || []).find(p => p.id === scene.id) || {};
    const layoutHint = direction.alignment === 'center'
      ? 'center_focus'
      : (d.layout_hint || (['cover', 'summary', 'end'].includes(scene.type) ? 'center_focus' : 'left_text_right_space'));
    const textAlign = layoutHint === 'center_focus' ? 'center' : 'left';
    const alignItems = layoutHint === 'center_focus' ? 'center' : 'flex-start';

    // 字号使用 clamp()（frontend-slides 视口适配）
    const titleSize = d.typography?.title?.size || 72;
    const bodySize = d.typography?.body?.size || 32;
    const titleClamp = `clamp(1.5rem, ${(titleSize / 16).toFixed(2)}vw, ${titleSize}px)`;
    const bodyClamp = `clamp(0.875rem, ${(bodySize / 16).toFixed(2)}vw, ${bodySize}px)`;

    const padding = isApple ? '80px' : (d.padding || '100px 120px');
    const maxWidth = d.max_width || '1400px';

    // splitPanel / keynote 背景通过 CSS 渐变和 panel 材质控制
    const bodyBg = d.colorScheme?.backgroundGradient
      ? d.colorScheme.backgroundGradient
      : (d.decoration?.splitPanel?.enabled
        ? 'transparent'
        : (d.colorScheme?.background || '#0a0a0a'));
    // splitPanel 白上蓝下，内容在白区所以文字用深色；右区是装饰色块
    const bodyColor = d.decoration?.splitPanel?.enabled
      ? (d.colorScheme?.textDark || '#0a0a0a')
      : (d.colorScheme?.textPrimary || '#ffffff');

    let css = `
/* === Slide Styles === */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: ${bodyBg};
  color: ${bodyColor};
  font-family: ${bodyFont};
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: ${maxWidth};
  padding: ${padding};
  display: flex;
  flex-direction: column;
  align-items: ${alignItems};
  justify-content: center;
  text-align: ${textAlign};
}
.container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: ${d.decoration?.panel?.radius || '0'};
  background: ${d.decoration?.panel?.enabled ? (d.decoration.panel.background || 'transparent') : 'transparent'};
  border: ${d.decoration?.panel?.enabled ? (d.decoration.panel.border || 'none') : 'none'};
  border-top: ${d.decoration?.panel?.enabled ? (d.decoration.panel.borderTop || d.decoration.panel.border || 'none') : 'none'};
  border-bottom: ${d.decoration?.panel?.enabled ? (d.decoration.panel.borderBottom || 'none') : 'none'};
  box-shadow: ${d.decoration?.panel?.enabled ? `${d.decoration.panel.shadow || 'none'}, ${d.decoration.panel.innerGlow || 'none'}` : 'none'};
  backdrop-filter: ${d.decoration?.panel?.enabled ? `blur(${d.decoration.panel.blur || '8px'})` : 'none'};
  -webkit-backdrop-filter: ${d.decoration?.panel?.enabled ? `blur(${d.decoration.panel.blur || '8px'})` : 'none'};
  z-index: -1;
}
.container::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: ${d.decoration?.hairline?.enabled ? (d.decoration.hairline.color || 'transparent') : 'transparent'};
  opacity: 0.8;
  z-index: -1;
}
.title {
  font-size: ${titleClamp};
  font-weight: ${d.typography?.title?.weight || 700};
  font-family: ${titleFont};
  color: ${d.colorScheme?.textPrimary || '#ffffff'};
  margin-bottom: 30px;
  line-height: ${d.typography?.title?.lineHeight || 1.2};
  letter-spacing: ${d.typography?.title?.letterSpacing || '0'};
  text-shadow: 0 2px 20px rgba(0,0,0,0.18);
}
.subtitle {
  font-size: clamp(1rem, 2vw, 1.5rem);
  color: ${d.colorScheme?.textSecondary || d.colorScheme?.accent || '#6366f1'};
  margin-top: 20px;
  font-weight: 400;
}
.body-text {
  font-size: ${bodyClamp};
  line-height: ${d.typography?.body?.lineHeight || 1.6};
  color: ${d.colorScheme?.textSecondary || 'rgba(255,255,255,0.85)'};
  max-width: 100%;
}
.body-text p { margin-bottom: 0.72em; }
`;

    // 特殊元素
    if (d.specialElements) {
      if (d.specialElements.numbers) {
        const numSize = d.specialElements.numbers.size || '56px';
        css += `
.big-number {
  font-size: clamp(1.25rem, 4vw, ${numSize});
  font-weight: ${d.specialElements.numbers.weight || 700};
  color: ${d.colorScheme?.accent || '#6366f1'};
  margin: 20px 0;
}
`;
      }
      if (d.specialElements.code) {
        const codeBg = d.specialElements.code.background || 'rgba(139,92,246,0.1)';
        const codeBorder = d.specialElements.code.border || '1px solid rgba(139,92,246,0.2)';
        const codeSize = d.typography?.code?.size || 24;
        const codeClamp = `clamp(0.75rem, 1.5vw, ${codeSize}px)`;
        css += `
.code-inline {
  display: inline;
  font-family: ${codeFont};
  font-size: ${codeClamp};
  background: ${codeBg};
  border: ${codeBorder};
  border-radius: 6px;
  padding: 2px 6px;
}
`;
      }
      if (d.specialElements.quotes) {
        const q = d.specialElements.quotes;
        const borderLeft = q.borderLeft || `6px solid ${d.colorScheme?.primary || '#4361ee'}`;
        const paddingLeft = q.paddingLeft || '24px';
        const fontStyle = q.fontStyle || 'normal';
        const fontSize = q.fontSize || '32px';
        const fontWeight = q.fontWeight || 800;
        css += `
.quote-box {
  border-left: ${borderLeft};
  padding-left: ${paddingLeft};
  margin: 28px 0;
  font-style: ${fontStyle};
  font-weight: ${fontWeight};
  color: ${d.colorScheme?.textLight || '#ffffff'};
  font-size: clamp(1rem, 2.5vw, ${fontSize});
  line-height: 1.4;
}
`;
      }
      if (d.specialElements.keyPoints) {
        const kp = d.specialElements.keyPoints;
        const kpBg = kp.background || '#ffffff';
        const kpBorder = kp.border || `2px solid ${d.colorScheme?.primary || '#4361ee'}`;
        const kpRadius = kp.borderRadius || '12px';
        const kpPadding = kp.padding || '28px 40px';
        css += `
.key-points-box {
  background: ${kpBg};
  border: ${kpBorder};
  border-radius: ${kpRadius};
  padding: ${kpPadding};
  text-align: left;
  margin: 28px 0;
  width: 100%;
  max-width: 700px;
}
.key-points-box .kp-title {
  font-size: clamp(0.875rem, 1.5vw, 1.125rem);
  font-weight: 700;
  color: ${d.colorScheme?.textDark || '#0a0a0a'};
  margin-bottom: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.key-points-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.key-points-box ul li {
  font-size: clamp(0.875rem, 1.5vw, 1.125rem);
  color: ${d.colorScheme?.textDark || '#0a0a0a'};
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
}
.key-points-box ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${d.colorScheme?.primary || '#4361ee'};
}
`;
      }
    }

    // Apple 模式
    if (isApple) {
      css += `
/* Apple 风格 */
.container { padding: 80px 100px; text-align: left; align-items: flex-start; }
.title { letter-spacing: -0.02em; line-height: 1.1; }
.subtitle { font-size: clamp(0.875rem, 1.5vw, 1.25rem); color: ${d.colorScheme?.textSecondary || 'rgba(255,255,255,0.7)'}; }
.body-text { color: ${d.colorScheme?.textPrimary || '#ffffff'}; line-height: 1.6; }
`;
    }

    return css;
  }

  buildDecorations(d, isApple) {
    let html = '';

    // 1. Glow 光晕装饰
    const count = d.decoration?.glow?.count || (isApple ? 0 : 2);
    if (count > 0) {
      const color = d.decoration.glow.color || d.colorScheme?.primary || '#6366f1';
      const size = d.decoration.glow.size || '500px';
      const blur = d.decoration.glow.blur || 100;
      const opacity = d.decoration.glow.opacity || 0.15;
      const positions = [
        { style: 'top: -150px; right: -150px;' },
        { style: 'bottom: -150px; left: -150px;' },
        { style: 'top: -150px; left: -150px;' },
        { style: 'bottom: -150px; right: -150px;' }
      ];
      for (let i = 0; i < count && i < positions.length; i++) {
        html += `  <div class="glow" style="position: absolute; width: ${size}; height: ${size}; border-radius: 50%; background: radial-gradient(circle, ${color} 0%, transparent 70%); filter: blur(${blur}px); opacity: ${opacity}; z-index: 0; ${positions[i].style}"></div>\n`;
      }
    }

    // 2. AccentBar 左侧强调竖条（electric-studio 特色）
    if (d.decoration?.accentBar?.enabled) {
      const barWidth = d.decoration.accentBar.width || '6px';
      const barColor = d.decoration.accentBar.color || d.colorScheme?.primary || '#4361ee';
      html += `  <div style="position: absolute; top: 0; left: 0; width: ${barWidth}; height: 100%; background: ${barColor}; z-index: 0;"></div>\n`;
    }

    // 3. Apple 模式 accentLine
    if (isApple && d.decoration?.accentLine?.enabled) {
      html += `  <div style="position: absolute; top: 120px; left: 0; width: ${d.decoration.accentLine.width || '80px'}; height: ${d.decoration.accentLine.height || '4px'}; background: ${d.colorScheme?.accent || '#007aff'}; z-index: 0;"></div>\n`;
    }

    return html;
  }

  getBodyStyle(d) {
    // splitPanel 双色垂直分割背景（electric-studio 特色）
    if (d.decoration?.splitPanel?.enabled) {
      const topColor = d.decoration.splitPanel.topColor || '#ffffff';
      const bottomColor = d.decoration.splitPanel.bottomColor || '#4361ee';
      // 垂直渐变：白上蓝下，内容在白区所以文字用深色
      return `style="background: linear-gradient(180deg, ${topColor} 50%, ${bottomColor} 50%);"`;
    }
    return '';
  }

  buildContent(scene, d) {
    const isApple = d.appleStyle === true;
    const strategy = this.resolveSceneStrategy(scene, d);
    const bodyLines = strategy.bodyLines;

    let html = '';

    // Per-type title size injected as inline style (overrides Tailwind utility class)
    const type = scene.type || 'content';
    const titleSizeMap = {
      cover: 'clamp(2.5rem, 6vw, 5rem)',
      summary: 'clamp(2rem, 4.5vw, 3.5rem)',
      end: 'clamp(2rem, 4.5vw, 3.5rem)'
    };
    const titleSizeStyle = titleSizeMap[type] || null;
    const titleTag = titleSizeStyle
      ? `<h1 class="title" style="font-size: ${titleSizeStyle} !important">${strategy.title}</h1>\n`
      : `<h1 class="title">${strategy.title}</h1>\n`;
    html += `    ${titleTag}`;

    if (scene.subtitle) {
      html += `    <p class="subtitle">${scene.subtitle}</p>\n`;
    }

    if (bodyLines.length > 0) {
      html += '    <div class="body-text">\n';
      for (const line of bodyLines) {
        const processedLine = this.processLineContent(line, d, isApple, strategy.focus);
        html += `      <p>${processedLine}</p>\n`;
      }
      html += '    </div>\n';
    }

    if (strategy.focus) {
      html += this.renderFocusElement(scene, strategy.focus, d) + '\n';
    }

    if (strategy.showKeyPoints && d.specialElements?.keyPoints && strategy.keyPoints.length > 0) {
      const kpTitle = scene.key_points_title || '核心要点';
      html += `    <div class="key-points-box">\n`;
      html += `      <div class="kp-title">${kpTitle}</div>\n`;
      html += `      <ul>\n`;
      for (const point of strategy.keyPoints) {
        html += `        <li>${point}</li>\n`;
      }
      html += `      </ul>\n`;
      html += `    </div>\n`;
    }

    return html;
  }

  resolveSceneStrategy(scene, d) {
    const rawBody = Array.isArray(scene.body) ? scene.body : [];
    const rawKeyPoints = Array.isArray(scene.key_points) ? scene.key_points : [];
    const direction = (d.page_directions || []).find(p => p.id === scene.id) || {};
    const title = this.compressTitle(scene.title || '');
    // Resolve focus: 'key_points' is NOT a focus block type — it means "show key_points list"
    const isKeyPointsScene = scene.focus_element === 'key_points' || direction.hero_element === 'key_points';
    const focus = (!isKeyPointsScene && (scene.focus_element || this.mapHeroElementToFocus(direction.hero_element) || this.inferFocusElement(scene, d)));

    let bodyLines = rawBody.slice();
    let keyPoints = rawKeyPoints.slice(0, direction.max_key_points || 3);
    let showKeyPoints = isKeyPointsScene;
    const maxBodyLines = direction.max_body_lines || 3;

    if (focus) {
      bodyLines = this.compressBodyLines(rawBody, maxBodyLines);
      showKeyPoints = false;
    } else if (keyPoints.length > 0) {
      bodyLines = this.compressBodyLines(rawBody, Math.min(maxBodyLines, rawBody.length > 2 ? 1 : 2));
      keyPoints = keyPoints.map(p => this.trimLine(p, 26)).slice(0, direction.max_key_points || 3);
      showKeyPoints = true;
    } else {
      bodyLines = this.compressBodyLines(rawBody, maxBodyLines);
    }

    if (['cover', 'summary', 'end'].includes(scene.type)) {
      bodyLines = this.compressBodyLines(rawBody, maxBodyLines);
      keyPoints = [];
      showKeyPoints = false;
    }

    return { title, bodyLines, keyPoints, showKeyPoints, focus, direction };
  }

  mapHeroElementToFocus(heroElement) {
    if (heroElement === 'quote') return 'quotes';
    if (heroElement === 'code') return 'code_blocks';
    if (heroElement === 'big_number') return 'big_numbers';
    return null;
  }

  compressTitle(title) {
    if (!title) return title;
    return title.length > 14 ? `${title.slice(0, 14)}…` : title;
  }

  compressBodyLines(lines, maxLines = 3) {
    return (lines || [])
      .map(line => this.trimLine(line, 28))
      .filter(Boolean)
      .slice(0, maxLines);
  }

  trimLine(line, maxChars = 28) {
    if (!line) return line;
    const clean = String(line).replace(/\s+/g, ' ').trim();
    return clean.length > maxChars ? `${clean.slice(0, maxChars)}…` : clean;
  }

  processLineContent(line, d, isApple, focus) {
    // 单页单主角：只有无 block-level focus 的普通内容页，才允许数字内联强调
    if (d.specialElements?.numbers && !focus) {
      line = line.replace(/(\d+(?:\.\d+)?%?)/g, `<span class="big-number">$1</span>`);
    }
    if (d.specialElements?.code && (line.includes('`') || line.includes('代码') || line.includes('API'))) {
      line = line.replace(/`([^`]+)`/g, '<span class="code-inline">$1</span>');
    }
    return line;
  }

  inferFocusElement(scene, d) {
    const text = (scene.body || []).join(' ');
    const hasKeyPoints = Array.isArray(scene.key_points) && scene.key_points.length > 0;
    // 单页单主角：有 key points 的内容页，不再额外渲染其他 focus 元素
    if (scene.type === 'content' && hasKeyPoints) return null;

    if (['cover', 'summary', 'end'].includes(scene.type)) {
      if (/\d+(?:\.\d+)?%?/.test(text)) return 'big_numbers';
      if (text.includes('"') || text.includes('说') || text.includes('引用')) return 'quotes';
      if (text.includes('代码') || text.includes('API') || text.includes('LLM')) return 'code_blocks';
    }

    // 内容页只允许 quote 或 code 二选一，不上 big-number block
    if (scene.type === 'content') {
      if (text.includes('`') || text.includes('代码') || text.includes('API')) return 'code_blocks';
      if (text.includes('"') || text.includes('说') || text.includes('引用')) return 'quotes';
    }
    return null;
  }

  renderFocusElement(scene, focus, d) {
    switch (focus) {
      case 'big_numbers': {
        const nums = (scene.body || []).join(' ').match(/\d+(?:\.\d+)?%?/);
        return nums ? `<div class="big-number text-center my-8">${nums[0]}</div>` : '';
      }
      case 'quotes': {
        const quoteLine = (scene.body || []).find(line => line.includes('"')) || scene.body?.[0] || '';
        return `<div class="quote-box text-center my-8">❝ ${quoteLine.replace(/`/g, '')} ❞</div>`;
      }
      case 'code_blocks': {
        const codeLine = (scene.body || []).find(line => line.includes('`')) || scene.body?.[0] || '';
        const clean = codeLine.replace(/`/g, '');
        return `<div class="quote-box text-left my-8" style="font-family:${this.resolveFont(d.typography?.code?.font || 'SF Mono')};font-style:normal;font-size:clamp(0.9rem,1.6vw,1.2rem);padding:20px 24px;border-radius:12px;background:${d.typography?.code?.background || 'rgba(139,92,246,0.1)'};border:${d.typography?.code?.border || '1px solid rgba(139,92,246,0.2)'}">${clean}</div>`;
      }
      default:
        return '';
    }
  }

  extractIcons(scene, d) {
    const iconMap = {
      'AI': '🤖', 'Agent': '🦾', 'Devin': '⚡', 'Transformer': '🧠',
      'RL': '🔄', 'RSI': '🔁', 'CEO': '👔', '制度': '🏛️', '墙': '🧱',
      '月报': '📊', '总结': '🎯', '突破': '🚀'
    };
    const text = (scene.body || []).join(' ');
    return Object.entries(iconMap)
      .filter(([kw]) => text.includes(kw))
      .map(([, emoji]) => emoji);
  }

  resolveFont(fontName, isApple) {
    const fallbacks = {
      'SF Pro Display': 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
      'SF Pro Text': 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
      'Space Grotesk': 'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif',
      'PingFang SC': 'PingFang SC, Microsoft YaHei, sans-serif',
      'Noto Sans SC': 'Noto Sans SC, Microsoft YaHei, sans-serif',
      'JetBrains Mono': 'JetBrains Mono, Menlo, Monaco, monospace'
    };
    return fallbacks[fontName] || fontName;
  }

  getContainerClass(scene, d, isApple) {
    // scene.type 直接决定布局策略
    const type = scene.type || 'content';
    const direction = (d.page_directions || []).find(p => p.id === scene.id) || {};

    // type → layoutHint 映射
    const typeToLayout = {
      cover: 'center_focus',
      summary: 'center_focus',
      end: 'center_focus',
      hero: 'center_focus',
      content: direction.alignment === 'center' ? 'center_focus' : 'left_text_right_space'
    };

    const layoutHint = d.layout_hint || typeToLayout[type] || 'left_text_right_space';
    const alignItems = layoutHint === 'center_focus' ? 'items-center justify-center text-center' : 'items-start justify-start text-left';
    return `relative z-10 w-full max-w-${d.max_width || '1400'} px-${isApple ? '20' : '40'} flex flex-col ${alignItems}`;
  }

  // 根据 scene.type 生成类型专属 CSS 变量
  buildPageTypeCSS(scene, d) {
    // scene.type 直接决定布局策略（page_directions 缺失时兜底）
    const type = scene.type || 'content';
    const accent = d.colorScheme?.primary || '#4361ee';
    const textSec = d.colorScheme?.textSecondary || '#aaaaaa';

    // Fix: use !important so these override the later buildCSS .title { font-size } rule
    if (type === 'cover') {
      return `
        :root { --page-accent: ${accent}; }
        .title { font-size: clamp(2.5rem, 6vw, 5rem) !important; font-weight: 700 !important; letter-spacing: -0.04em !important; }
        .subtitle { font-size: clamp(1rem, 2vw, 1.5rem); color: ${textSec}; margin-top: 16px; }
        .page-type-label { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: ${accent}; margin-bottom: 24px; }
      `;
    }
    if (type === 'summary') {
      return `
        .title { font-size: clamp(2rem, 4.5vw, 3.5rem) !important; font-weight: 700 !important; letter-spacing: -0.03em !important; }
        .big-number { font-size: clamp(4rem, 10vw, 8rem); font-weight: 700; color: ${accent}; }
      `;
    }
    // content (default)
    return `
      .title { font-size: clamp(1.75rem, 3.5vw, 3rem) !important; font-weight: 700 !important; letter-spacing: -0.03em !important; }
    `;
  }

  getContainerClass(scene, d) {
    // scene.type 直接决定布局（page_directions 缺失时兜底）
    const type = scene.type || 'content';
    const direction = (d.page_directions || []).find(p => String(p.id) === String(scene.id)) || {};

    // page_directions 有效时优先用它，否则用 scene.type 兜底
    const hasDirection = direction && Object.keys(direction).length > 0;
    let layoutHint;
    if (hasDirection) {
      layoutHint = direction.alignment === 'center' ? 'center_focus' : 'left_text_right_space';
    } else {
      // scene.type → layoutHint 映射（兜底）
      layoutHint = (type === 'cover' || type === 'summary' || type === 'end')
        ? 'center_focus'
        : 'left_text_right_space';
    }

    const alignItems = layoutHint === 'center_focus'
      ? 'items-center justify-center text-center'
      : 'items-start justify-start text-left';
    return `relative z-10 w-full max-w-${d.max_width || '1400'} px-40 flex flex-col ${alignItems}`;
  }
}

module.exports = {
  HtmlBuilder,
  ICON_SVG,
  STYLE_PRESETS
};
