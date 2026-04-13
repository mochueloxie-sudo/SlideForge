# CLAUDE.md — slide-forge 内部开发指南

## 项目概述

把飞书文档、本地文件或网页一键转为 1920×1080 演示内容。
三种交付格式（视频 / PDF / 交互式 HTML），13 种主题自动匹配，所有产出附大纲和逐字稿。

**核心原则**：工具链固化 + 创意自由解放

- 底层工具固化：Puppeteer 截图、FFmpeg 合成、Edge TTS
- 设计层解放：HTML 渲染完全由样张 token 驱动

---

## 架构


| 层      | 文件                                 | 职责                                                                                                              |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 入口     | `executor.js`                      | 路由命令到各 Step，`run_all` 串联全流程                                                                                     |
| 核心渲染   | `utils/html_generator.js`          | 加载样张 → 替换 token → 注入 CSS → 写出 HTML                                                                              |
| 页内动画   | `utils/page_animations.js`         | P0：`design_params.page_animations` 时注入整页入场 CSS + 启动脚本（与 FFmpeg 的 `steps/animations/animation-strategies.js` 分离） |
| 截图     | `utils/screenshot.js`              | Puppeteer 批量截图 1920×1080                                                                                        |
| 样张     | `samples/{theme}/` + `samples/shared/` | 13 主题；每主题一组样张 + `shared/` 通用变体（含 compare / process_flow / architecture_stack / funnel），纯 HTML + CSS |
| Step 0 | `steps/step0_analyze.js`           | MiniMax LLM 分析内容 → scenes.json                                                                                  |
| Step 1 | `steps/step1_script.js`            | MiniMax LLM 生成逐字稿                                                                                               |
| Step 2 | `steps/step2_design.js`            | 规则引擎：主题选择 + 变体推断 + layout_hint                                                                                  |
| Step 3 | `steps/step3_html.js`              | 调用 html_generator                                                                                               |
| Step 4 | `steps/step4_screenshot.js`        | 调用 screenshot.js                                                                                                |
| Step 5 | `steps/step5_tts.js`               | edge-tts（降级 macOS say）                                                                                          |
| Step 6 | `steps/step6_format.js`            | 交付格式：video / pdf / html + outline + script                                                                      |
| Step 7 | `steps/step7_channel.js`           | 交付渠道：local / feishu                                                                                             |
| 内部     | `steps/step6_video.js`             | FFmpeg H.264+AAC 25fps（被 step6_format 调用）                                                                       |
| 内部     | `steps/step7_publish.js`           | lark-cli 飞书发布（被 step7_channel 调用）                                                                               |
| 工具     | `steps/utils/content_extractor.js` | 多源内容提取（飞书 / 本地 / 网页）                                                                                            |
| 工具     | `steps/utils/llm_client.js`        | MiniMax HTTP 封装                                                                                                 |
| 工具     | `steps/utils/tool-locator.js`      | ffmpeg / ffprobe / imagemagick 自动发现                                                                             |


---

## 样张系统

### 主题（13 个）

**深色**：`electric-studio`、`bold-signal`、`creative-voltage`、`dark-botanical`、`neon-cyber`、`terminal-green`、`deep-tech-keynote`

**浅色**：`notebook-tabs`、`paper-ink`、`pastel-geometry`、`split-pastel`、`swiss-modern`、`vintage-editorial`

### 变体文件

每个主题目录包含：

- `cover.html`
- `01_text_only.html` / `02_panel.html` / `04_number.html` / `05_quote.html`
- `10_icon_grid.html` / `11_code_block.html` / `12_table.html`
- `13_card_grid.html` / `14_nav_bar.html` / `15_chart_demo.html`

`shared/` 通用变体（主题无关，**全主题经 `loadTemplate` 回退共用**）：

- `03_stats_grid.html` / `07_timeline.html` / `08_two_col.html`
- `16_panel_stat.html` / `17_number_bullets.html` / `18_quote_context.html` / `19_text_icons.html`
- `20_compare.html` / `21_process_flow.html` / `22_architecture_stack.html` / `23_funnel.html`

### Token 规范

- 全大写 `{{NAME}}`，repeat marker 无下标（`{{KEY_POINT}}`），命名 slot 用 `{{NAME_0}}`
- 自适应 token 示例：`{{KP_FONT_SIZE}}`、`{{ICON_GRID_COLS}}`、`{{TABLE_FONT_SIZE}}`

### Layout Hint 机制

`layout_hint` 注入到 `<body class="layout-xxx">`，模板内任何元素通过 `body.layout-xxx .selector {}` 响应：


| 变体           | 可用 hint                                                       |
| ------------ | ------------------------------------------------------------- |
| `panel`      | `stack`（默认）/ `grid-3` / `sidebar-left` / `cards` / `numbered` |
| `stats_grid` | `row`（默认）/ `hero-1` / `2x2`                                   |
| `timeline`   | `vertical`（默认）/ `horizontal` / `alternating`                  |
| `two_col`    | `equal`（默认）/ `wide-left` / `wide-right`                       |
| `quote`      | `center`（默认）/ `left-bar` / `full`                             |
| `number`     | `center`（默认）/ `split`                                         |
| `card_grid`  | 默认 / `2x2`                                                    |
| `icon_grid`  | 自动（按数量推断列数）                                                   |
| `compare`    | `equal`（默认）/ `wide-left` / `wide-right`                         |
| `process_flow` | `horizontal`（默认，阶段条）/ `swimlane`（需 `flow_lanes[]`）          |
| `architecture_stack` | 默认 / `compact`（层数多）                                  |
| `funnel`     | 默认 / `compact`（层数多）                                        |


---

## html_generator.js 核心逻辑

入口：`generateHtml(scenes, designMode, htmlDir, designParams)`  
第四参为 Step2 产出的完整 `design_params`（含 `page_directions`、`page_animations` 等）；兼容旧调用传入 **仅** `page_directions` 数组。

```
1. scene.type → generateCover / generateContent / generateSummary
2. generateContent：按 content_variant 加载样张
3. 扫描 {{TOKEN}} markers → 替换
4. repeat marker → 按数组长度重复对应 HTML 片段（`{{KEY_POINT}}` / `{{BODY}}` 行在 stagger 预设下对首标签注入 `data-vp-animate`）
5. 注入全局 CSS：readability + density + glass + title + centering
6. 若 `page_animations !== false` 且预设非 `none`：再注入页内动画（见 `page_animations.js`）
7. 写出 page_XXX.html
```

关键函数：

- `loadTemplate(theme, variant)` — 先找主题目录，fallback 到 shared/
- `buildTokens(scene, total)` — 构建 token map
- `replaceTokens(html, tokens)` — `{{NAME}}` → 值
- `getReadabilityCSS()` — 全局最小字号基线
- `getDensityCSS()` — 内容密度自适应
- `getGlassEnhancementCSS(tpl)` — 毛玻璃 / 液体效果
- `getTitleEnhancementCSS(pageType)` — 标题字号增强

### CSS 注入顺序

每个页面的 `</head>` 前注入：

1. `readCSS` — 可读性基线
2. `densityCSS` — 密度自适应
3. `glassCSS` — 毛玻璃效果
4. `titleCSS` — 标题增强
5. 居中 CSS — flexbox 垂直居中
6. （可选）`#vp-page-animations` — 整页 `fade-up` 入场 + `body` 启动类（`page_animations` 开启时）

---

## step2_design.js 核心逻辑

- `inferContentVariant(scene)` — 按字段优先级推断变体
- `computeLayoutHint(scene)` — 按条目数选择 layout hint
- `autoSelectDesignMode(scenes)` — 关键词打分选主题
- `computeDensity(scene)` — 内容密度分类（sparse / normal / rich）
- 节奏纠正 — 连续相同 layout_hint 自动交替

---

## 常见开发任务

### 添加新 Token

```js
// utils/html_generator.js 对应变体块：
tokens.MY_TOKEN = escapeHtml(scene.my_field || '');
// 样张中：{{MY_TOKEN}}
```

### 新增页面变体

1. 在 `samples/{theme}/` 或 `samples/shared/` 创建样张
2. 在 `variantMap` 中添加映射
3. 在 `step2_design.js` 的 `inferContentVariant()` 中添加推断分支
4. 在 `step0_analyze.js` 的 LLM prompt 中添加变体 schema

### LLM 调用稳定性（重要）

**已知问题**：MiniMax LLM 有概率返回畸形 JSON（非 JSON 纯文本混入、截断等），导致 Step0 / Step1 等依赖 LLM 的步骤失败，报 `Unexpected end of JSON input`。

**根因**：`callMiniMax` 函数（定义在各 Step 入口文件内）**没有内置重试机制**。`utils/llm_client.js` 有 `callMiniMax` 带重试，但各 Step 实际未调用它，而是各自内联了 `callMiniMax`（无重试）。

**临时解法**：在 executor 外部加循环重试 wrapper（见 `/tmp/run-sf3.js` 模式）。

**根本解法（待实现）**：
1. 统一各 Step 的 LLM 调用走 `utils/llm_client.js` 的 `callMiniMax(retries=3)`
2. 或者在 `callMiniMax` 定义处增加 `while retry` 重试逻辑（影响范围最小）
3. 重试间隔建议：`attempt * 2000ms`（指数退避）

```js
// 在各 Step 入口文件的 callMiniMax 定义处替换为：
async function callMiniMax(messages, { maxTokens = 8000, retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // ...现有逻辑...
      return json;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
}
```

### 调试 HTML 生成

```bash
echo '{"command":"step3","design_params":"./output/design_params.json","scenes":"./output/scenes.json","output_dir":"./debug"}' | node executor.js
grep -o '{{[A-Z_]*}}' ./debug/page_*.html   # 应为空
open ./debug/page_002.html
```

### 全流程测试

```bash
echo '{"command":"all","source":"./examples/full_variant_test.md","format":["pdf","html"],"output_dir":"./test_e2e"}' | node executor.js
open ./test_e2e/presentation.html
```

---

## 设计原则参考（`refs/`）

视觉与动效参考材料见 **[refs/README.md](refs/README.md)**（当前仓库内含 `STYLE_PRESETS.md`、`viewport-base.css`、`animation-patterns.md`）。完整 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) 树为**可选本地 clone**，默认不 vendored。动画范式另可参考 [frontend.slides](https://github.com/nicolo-ribaudo/frontend-slides)（与 FFmpeg 滤镜策略勿混用，见下文 Roadmap）。

---

## 注意事项

- **样张 > 代码**：样式决策以样张 HTML 为准，不在 generator 里硬编码 CSS
- **固定 1920×1080**：样张用 px，不用 rem/vw
- **Generator 只做管道**：读取样张 → 替换 token → 写出
- **scene.body / scene.secondary 可能是 string 或 string[]**：访问前做 `Array.isArray` 判断
- **副标题 fallback 链**：`scene.subtitle || scene.secondary || scene.body?.[0] || ''`
- **系统 Chrome 降级**：screenshot.js 和 step6_format.js 在 Puppeteer 找不到 bundled Chrome 时 fallback 到 `/Applications/Google Chrome.app`

### 已知限制

1. FFmpeg 需用户手动安装（`brew install ffmpeg`）

2. **notebook-tabs 主题内容页背景色问题**：
   - **症状**：内容页（使用 `shared/` 模板回退时，如 `08_two_col`、`07_timeline`、`20_compare` 等）body 背景为 `#2d2d2d` 深灰，但没有 `.paper`（浅奶油色覆盖层 `#f8f6f1`）和 `.tabs`（左侧彩色侧边栏），导致文字在深灰背景上对比度极低。
   - **根因**：`loadTemplate` 回退链中，shared 模板本身没有 `.paper` 和 `.tabs` 结构，而 `notebook-tabs` 主题目录下缺失这些变体模板文件（只有 `01_text_only`、`02_panel`、`04_number`、`05_quote` 等 12 个，缺少 `08_two_col`、`07_timeline`、`20_compare` 等 10+ 个）。
   - **正确效果**：参照 `samples/notebook-tabs/02_panel.html`，结构为 `<body style="background:#2d2d2d"> → <div class="paper" style="background:#f8f6f1"> → 内容</div></body>`，外层深灰内层奶油，且 `.tabs` 侧边栏标签通过 `position:absolute; left:-18px` 定位在 paper 左侧。
   - **方案B（推荐）**：在 `samples/notebook-tabs/` 下补充缺失的 shared 变体模板副本（`08_two_col.html`、`07_timeline.html`、`20_compare.html`、`21_process_flow.html`、`03_stats_grid.html`、`16_panel_stat.html`、`18_quote_context.html`、`22_architecture_stack.html`、`23_funnel.html`），每个模板参照 `02_panel.html` 的 `<body> → <div class="paper">` 结构。
   - **方案A（已回滚）**：在 `generateContent` 里对 notebook-tabs + shared 回退模板动态注入 paper + tabs 的 CSS 和 HTML 结构（技术上可行但被用户主动放弃）。
   - **方案C（未实施）**：改造所有 shared 模板，在 `<body>` 后加 `{{#if PAPER_WRAPPER}}...{{/if}}` 条件结构，需要 handlebars 条件支持。

3. **依赖审计（待定）**：`npm audit` 可能报传递依赖 `**basic-ftp`** [High — GHSA-chqc-8p9q-pq6q](https://github.com/advisories/GHSA-chqc-8p9q-pq6q)（FTP 相关 CRLF / 命令注入类）。本仓库典型用法是本地或 CI 跑流水线、**不**以「对不可信 FTP 服务端发起客户端连接」为核心能力，**实际风险极低**。若需清零告警或满足合规，再执行 `npm audit fix` 并跑 `npm run test:e2e` 验证 Puppeteer 链路。发版时可将结论摘要抄入 `CHANGELOG.md` 对应版本节。

---

## 主题选择链路（与当前代码一致）

实现见 `steps/step2_design.js`。**未**在当次 JSON 传入 `design_mode` 时，优先级为：

1. `project.json` 的 `recommended_design_mode`（Step0 LLM 对象响应写入；须为 13 个合法主题 id 之一）→ `mode_source: step0-llm`
2. `project.json` 的 `design_mode`（且不等于默认 `electric-studio`）→ `mode_source: project.json`
3. `inferContentType()` + `CONTENT_TYPE_MAP` 内容规则兜底 → `mode_source: auto`

当次 JSON 里显式传入的 `design_mode` 始终最高优先级（`mode_source: user`）。

Step0：`scenes.json` 仍为**纯 scenes 数组**；`project.json` 可含 `recommended_design_mode`。若模型只返回数组（无推荐字段），Step2 走规则自动选主题。

**dark-botanical**：已映射内容类型 **人文社科**（中/英键），`inferContentType()` 含人文/社科/策展/心理学等关键词时命中；与 **文化艺术** → **vintage-editorial** 并列分流。

**Step2 preset 来源**：仅 `steps/presets/frontend-presets.json`（`getFallbackPreset`）与专业模式的 `getDeepTechKeynotePreset`；**不再**调用 OpenClaw 的 `graphic-design` executor（历史上曾硬编码 `~/.openclaw/.../executor.js` 并导致 30s 超时）。若将来再接外部设计 agent，建议用**显式环境变量**（例如仅当 `GRAPHIC_DESIGN_EXECUTOR` 指向可读脚本时才 `spawn`），默认关闭。

---

## 借鉴 — frontend-slides 的核心亮点

参考仓库：https://github.com/zarazhangrui/frontend-slides

### 1. 视觉风格预览机制（值得优先借鉴）

**机制**：生成 3 个单页封面 HTML（不同 CSS 变量组合）→ 用户看图选 → 选定风格后批量生成完整演示。

**实现思路**：
- Step0 或 Step2 新增 "preview" 模式：只生成封面页（或前 3 页）的预览 HTML
- 3 个预览用不同 `design_mode`（或同一主题的不同 CSS 变量组合）渲染
- 预览截图发给用户，用户点选后以此风格生成完整演示
- 核心原理：风格切换 = 切换 CSS 变量，不换 HTML 结构，所以预览成本极低

**收益**：用户在批量生成前确认风格，大幅降低「生成完整演示后发现风格不对」的重跑成本。

### 2. 渐进式文档（Progressive Disclosure）

**机制**：主 SKILL.md 只放核心流程（~180行），详细文档（STYLE_PRESETS.md / animation-patterns.md / html-template.md）按需加载。

**SlideForge 可借鉴**：
- 当前 CLAUDE.md 内容较重，可拆分出 "快速参考" 和 "深度开发指南" 两层
- SKILL.md（对外用户）保持精简，CLAUDE.md（内部开发）保留完整细节

### 3. Anti-AI-Slop 意识

**机制**：有意识地避免 AI 味视觉（告别紫白渐变），提供有辨识度的设计风格。

**SlideForge 可借鉴**：
- 13 个主题可以增加「AI 味检测」：生成后检查是否有紫白渐变等典型 AI 风格，自动替换为更独特的变体
- 或者在 STYLE_PRESETS.md 中明确标注每个主题的「避免风格」

### 4. 单文件 HTML 输出（vs SlideForge 的 iframe 多文件）

**frontend-slides**：输出真正零依赖的单文件 HTML（内联 CSS + JS），分享无障碍。

**SlideForge 当前问题**：`presentation.html` 实际是 iframe 壳，需要整个目录才能使用，容易被误认为是单文件。

**SlideForge 可借鉴**：
- 新增 `--single-file` 选项：将所有 `page_*.html` 内联为 `<section>` 拼接成一个文件
- 或者在 SKILL.md 中明确区分「单文件（单 page_*.html）」vs「多文件（iframe 入口）」

### 5. PPT 导入能力

**机制**：上传 `.pptx` → 自动提取文本、图片、备注 → 选择风格 → 生成 HTML。

**SlideForge Roadmap P1 已规划**：新增 `step_import.js`，可参考 frontend-slides 的 `scripts/extract-pptx.py` 实现思路。

---

## Roadmap

### P0 — HTML 动画支持

当前截图是静态 1920×1080 PNG，交互式 HTML 演示也是图片轮播。下一步让 HTML 页面本身具备动画能力；`format=html` 时直接播放动画，`format=video` 长期可用 Puppeteer 录制动效帧。

**参考**：[frontend.slides](https://github.com/nicolo-ribaudo/frontend-slides) 的 CSS Animation +（后续）Intersection Observer。

**分阶段（执行顺序）**


| 阶段    | 内容                                                                                                                                                    | 状态               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **0** | `design_params.page_animations`（Step2 默认 `true`）+ `utils/page_animations.js` 注入 CSS + boot 脚本；`screenshot.js` 在开启动画时等待 `data-vp-anim-ready` | **已落地**         |
| **1** | `html_generator` 为列表/卡片/时间线等块加 `data-vp-animate` + 行内 stagger；`page_animation_preset`: `none` / `fade` / `stagger`；Step3 传入完整 `design_params` | **已落地**         |
| **2** | `format=video`：Puppeteer 录制动效帧；与 `presentation.html`（iframe 单页）动效策略对齐                                                                                | 待做               |


**与现有文件分工**

- `**utils/page_animations.js`**：单页 HTML 的 CSS + 极短启动脚本（P0）。
- `**steps/animations/animation-strategies.js`**：FFmpeg 滤镜策略；语义与页内 CSS 动画分离，勿混用。

**后续实现思路（阶段 1+）**

1. 在重点变体样张或 `html_generator` 内联块上增加 `data-vp-animate` + stagger delay
2. Step3 按 `page_animation_preset` 选择 CSS 包
3. Step4 / Step6：无动画分支保持短延迟；有动画分支已等待关键帧后再截图（视频路径后续扩展 `screencast` 或逐帧）

### P1 — 样张丰富度 + 用户自定义主题

当前 13 主题 + **22** 个 `content_variant`（含 `shared/` 四款叙事变体）覆盖大部分场景，但用户可能有自己的品牌风格：

- **持续拓展内置样张**：
  - 新增行业垂直主题（医疗、教育、金融等）
  - 新增变体类型（对比图、流程图、组织架构、漏斗图等）
  - 定期从优秀 PPT 模板中提取新样张
- **用户自定义主题（通用方案）**：
  1. **上传 PPT / 图片 → 自动提取样张**：用户上传自己喜欢的 PPT 或设计截图，系统自动分析版式结构（标题位置、配色、字体、布局模式），生成对应的 HTML 样张 + token 映射
  2. **实现路径**：
    - 新增 `steps/step_import.js`：接收 `.pptx` / `.pdf` / `.png` 输入
    - PPT 路径：用 `pptx-parser` 解析母版 → 提取色板、字体、版式 → 生成 `samples/custom-{name}/` 目录
    - 图片路径：用 LLM Vision 分析截图布局 → 推断 HTML 结构 + CSS → 生成样张
    - 输出标准的 `cover.html` + 变体文件，自动注册到 `DESIGN_TEMPLATES`
  3. **简化方案（先行）**：提供 `samples/_template/` 脚手架目录，用户只需填色值和字体即可快速创建新主题

### P2 — LLM 稳定性优化

**问题**：MiniMax LLM 有概率返回畸形 JSON（混普通文本、截断等），导致 Step0/1 等 LLM 依赖步骤失败，平均 2~3 次才能成功。

**解决方案（三层）**：

| 层级 | 方案 | 影响范围 | 工作量 |
|------|------|----------|--------|
| **L1** | JSON 容错提取：LLM 响应先用正则匹配 `(\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\])`，再 parse | 各 Step 入口文件（step0/1） | 小 |
| **L2** | `callMiniMax` 加内置 retry（for 循环，指数退避） | 各 Step 入口文件 | 中 |
| **L3** | Prompt 加约束：system prompt 明确「只输出 JSON，不要解释性文字」 | 各 Step 入口文件 | 极小 |

**优先级**：L3 → L1 → L2，建议全部实现。

**参考代码（JSON 容错提取）**：
```js
let json;
try { json = JSON.parse(text); }
catch {
  const match = text.match(/(\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\])/);
  json = match ? JSON.parse(match[0]) : null;
}
if (!json) throw new Error('无法从响应中提取 JSON');
```

**参考代码（retry）**：
```js
for (let attempt = 1; attempt <= retries; attempt++) {
  try { /* ...调用逻辑... */ return json; }
  catch (err) {
    if (attempt === retries) throw err;
    await new Promise(r => setTimeout(r, attempt * 2000));
  }
}
```

