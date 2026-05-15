# CLAUDE.md — slide-forge 内部开发指南

面向 **本仓库贡献者与深度排障**：**Agent 执行说明**以根目录 **[SKILL.md](SKILL.md)** 为唯一主文档（结构：**首次运行 — Onboarding** → **执行 — 日常调用** → 意图变更 / 主题表 / 变体摘要等）；本文负责样张、Step 实现与排障全景。

## 项目概述（v4.0 — Agent-first）

定位：**宿主 Agent 调用的渲染 Skill**。Agent 自己读源材料、按 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) 在对话内写 `scenes.json` 落盘；本 Skill 只把 `scenes.json` 渲染成 1920×1080 演示（HTML / PDF / video）。**v4.0 起完全移除外部 LLM 依赖**：不再调 MiniMax / OpenAI，原 `step0_analyze` / `step1_script` / `minimax_utils` / `llm_client` 已删除。

**核心原则**：工具链固化 + 设计层解放 + 智能交给宿主

- 底层工具固化：Puppeteer 截图、FFmpeg 合成、Edge TTS
- 设计层解放：HTML 渲染完全由样张 token 驱动
- 内容理解 / 结构化 / 写口播稿全部交给宿主 Agent

---

## 架构


| 层 | 文件 | 职责 |
|----|------|------|
| 入口 | `executor.js` | 路由命令到各 step 脚本；`run_render`（别名 `all`）串联 design → deliver |
| 提取 | `steps/extract.js` | 把 source（飞书 / 本地 / 网页）抽成 `raw_content.txt` + `source_meta.json`，**零 LLM** |
| 校验 | `steps/validate.js` | scenes.json schema 校验，输出 `errors[]` / `warnings[]`，**零 LLM、零网络**；永远 exit 0 |
| 核心渲染 | `utils/html_generator.js` | 加载样张 → 替换 token → 注入 CSS → 写出 HTML |
| 页内动画 | `utils/page_animations.js` | `design_params.page_animations` 时注入整页入场 CSS + 启动脚本（与 FFmpeg 的 `steps/animations/animation-strategies.js` 分离） |
| 截图 | `utils/screenshot.js` | Puppeteer 批量截图 1920×1080 |
| 样张 | `samples/{theme}/` + `samples/shared/` | 13 主题；每主题一组样张 + `shared/` 通用变体（含 compare / process_flow / architecture_stack / funnel），纯 HTML + CSS |
| design | `steps/design.js` | 规则引擎：主题选择（user override > project.json `recommended_design_mode` > 内容推断）+ 变体推断 + layout_hint |
| html | `steps/html.js` | 调用 html_generator |
| screenshot | `steps/screenshot.js` | 调用 utils/screenshot.js |
| tts | `steps/tts.js` | edge-tts（降级 macOS say）|
| package | `steps/package.js` | 打包交付格式：video / pdf / html + outline + script |
| deliver | `steps/deliver.js` | 交付渠道：local / feishu |
| 内部 | `steps/video.js` | FFmpeg H.264+AAC 25fps（被 `package` 调用） |
| 内部 | `steps/publish.js` | lark-cli 飞书发布（被 `deliver` 调用） |
| 工具 | `steps/utils/content_extractor.js` | 多源内容提取（飞书 / 本地 / 网页）；`extractBlockText` 按 `block_type` switch-case 覆盖 Heading1–9 / Bullet / Ordered / Code / Quote / Divider / Todo / Callout 等完整飞书块类型 |
| 工具 | `steps/utils/tool-locator.js` | ffmpeg / ffprobe / imagemagick 自动发现 |

### 已移除（v4.0 起不存在）

- `steps/step0_analyze.js`（MiniMax 内容分析）
- `steps/step1_script.js`（MiniMax 写口播稿）
- `steps/utils/minimax_utils.js`（OpenAI 兼容 HTTP + L1/L2/L3 容错）
- `steps/utils/llm_client.js`（历史 MiniMax 封装）
- `.env` 中 `MINIMAX_*` / `LLM_*` 字段（保留飞书凭证）
- `executor.js` 的 `step0` / `step1` / `step2`-`step7` 命令分支（命中时抛错并指引到新名）

### 命令重命名映射（v3 → v4）

```
step0_analyze        → 移除（Agent 自己读源材料）
step1_script         → 移除（Agent 自己写 scenes[].script）
step2_design.js      → steps/design.js          (command: design)
step3_html.js        → steps/html.js            (command: html)
step4_screenshot.js  → steps/screenshot.js      (command: screenshot)
step5_tts.js         → steps/tts.js             (command: tts)
step6_format.js      → steps/package.js         (command: package)
step6_video.js       → steps/video.js           (内部，被 package 调用)
step7_channel.js     → steps/deliver.js         (command: deliver)
step7_publish.js     → steps/publish.js         (内部，被 deliver 调用)
```


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

`shared/` 通用变体（主题无关，**全主题经 `loadTemplate` / `loadTemplateWithSource` 回退共用**）：

- `03_stats_grid.html` / `07_timeline.html` / `08_two_col.html`
- `16_panel_stat.html` / `17_number_bullets.html` / `18_quote_context.html` / `19_text_icons.html`
- `20_compare.html` / `21_process_flow.html` / `22_architecture_stack.html` / `23_funnel.html`

### Token 规范

- 全大写 `{{NAME}}`，repeat marker 无下标（`{{KEY_POINT}}`），命名 slot 用 `{{NAME_0}}`
- 自适应 token 示例：`{{KP_FONT_SIZE}}`、`{{ICON_GRID_COLS}}`、`{{TABLE_FONT_SIZE}}`

### Layout Hint 机制

`layout_hint` 注入到 `<body class="layout-xxx">`，模板内任何元素通过 `body.layout-xxx .selector {}` 响应：


| 变体                   | 可用 hint                                                       |
| -------------------- | ------------------------------------------------------------- |
| `panel`              | `stack`（默认）/ `grid-3` / `sidebar-left` / `cards` / `numbered` |
| `stats_grid`         | `row`（默认）/ `hero-1` / `2x2`                                   |
| `timeline`           | `vertical`（默认）/ `horizontal` / `alternating`                  |
| `two_col`            | `equal`（默认）/ `wide-left` / `wide-right`                       |
| `quote`              | `center`（默认）/ `left-bar` / `full`                             |
| `number`             | `center`（默认）/ `split`                                         |
| `card_grid`          | 默认 / `2x2`                                                    |
| `icon_grid`          | 自动（按数量推断列数）                                                   |
| `compare`            | `equal`（默认）/ `wide-left` / `wide-right`                       |
| `process_flow`       | `horizontal`（默认，阶段条）/ `swimlane`（需 `flow_lanes[]`）            |
| `architecture_stack` | 默认 / `compact`（层数多）                                           |
| `funnel`             | 默认 / `compact`（层数多）                                           |


---

## html_generator.js 核心逻辑

入口：`generateHtml(scenes, designMode, htmlDir, designParams)`  
第四参为 `design` 命令产出的完整 `design_params`（含 `page_directions`、`page_animations` 等）；兼容旧调用传入 **仅** `page_directions` 数组。

```
1. scene.type → generateCover / generateContent / generateSummary
2. generateContent：按 content_variant 加载样张（`notebook-tabs` 且实际来自 `shared/` 时先合并 `_content_shell.html`）
3. 扫描 {{TOKEN}} markers → 替换
4. repeat marker → 按数组长度重复对应 HTML 片段（`{{KEY_POINT}}` / `{{BODY}}` 行在 stagger 预设下对首标签注入 `data-vp-animate`）
5. 注入全局 CSS：readability + density + glass + title + centering
6. 若 `page_animations !== false` 且预设非 `none`：再注入页内动画（见 `page_animations.js`）
7. 写出 page_XXX.html
```

关键函数：

- `loadTemplate(theme, variant)` — 先找主题目录，fallback 到 shared/（`loadTemplateWithSource` 同路径并额外返回 `fromShared`）
- `**notebook-tabs` + shared 回退**：`generateContent` 在 `design_mode === 'notebook-tabs'` 且 `fromShared` 时，用 `samples/notebook-tabs/_content_shell.html` 包一层（`.paper` / `.tabs` / `body.vp-notebook-outer`），把共享模板的 `<head>` 片段与 `<body>` 内层并入壳内；`layout_hint` / `density` 仍只注入最终文档的单个 `<body>`，无需为主题复制整套 shared 变体文件
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

## design.js 核心逻辑

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
3. 在 `steps/design.js` 的 `inferContentVariant()` 中添加推断分支
4. 在 `docs/SCENES_SCHEMA.md` 中补充该变体的字段表与最小示例（**这是 Agent 自产 scenes.json 的唯一信息源**）
5. 在 `steps/validate.js` 的 `VALID_VARIANTS` 与 `REQUIRED_BY_VARIANT` 中登记必填字段

### 调试 HTML 生成

```bash
echo '{"command":"html","design_params":"./output/design_params.json","scenes":"./output/scenes.json","output_dir":"./debug"}' | node executor.js
grep -o '{{[A-Z_]*}}' ./debug/page_*.html   # 应为空
open ./debug/page_002.html
```

### 全流程测试（v4 — 从 scenes.json 起）

```bash
mkdir -p test_e2e && cp examples/four_new_variants_scenes.json test_e2e/scenes.json
echo '{"command":"validate","scenes":"./test_e2e/scenes.json"}' | node executor.js
echo '{"command":"render","scenes":"./test_e2e/scenes.json","output_dir":"./test_e2e","format":["pdf","html"]}' | node executor.js
open ./test_e2e/presentation.html
# 或一句话：
npm run test:e2e
```

### 单步调试（v4 命令）

```bash
P=./test_e2e
echo '{"command":"design","scenes":"'"$P"'/scenes.json","output_dir":"'"$P"'","design_mode":"neon-cyber"}' | node executor.js
echo '{"command":"html","scenes":"'"$P"'/scenes.json","design_params":"'"$P"'/design_params.json","output_dir":"'"$P"'"}' | node executor.js
echo '{"command":"screenshot","html_dir":"'"$P"'","output_dir":"'"$P"'/screenshots","design_params":"'"$P"'/design_params.json"}' | node executor.js
echo '{"command":"package","scenes":"'"$P"'/scenes.json","screenshots_dir":"'"$P"'/screenshots","html_dir":"'"$P"'","output_dir":"'"$P"'","format":["pdf","html"]}' | node executor.js
```

---

## 设计原则参考（`refs/`）

视觉与动效参考材料见 **[refs/README.md](refs/README.md)**（当前仓库内含 `STYLE_PRESETS.md`、`viewport-base.css`、`animation-patterns.md`）。完整 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) 树为**可选本地 clone**，默认不 vendored。动画范式另可参考 [frontend.slides](https://github.com/nicolo-ribaudo/frontend-slides)（与 FFmpeg 滤镜策略勿混用，见下文 **（二）已明确的 Roadmap**）。

---

## 备忘与 Roadmap（`refs/` 之后）

以下只保留 **两类正文**：（**一**）开发者记录——工程约定、已知限制、与当前代码一致的行为说明、以及对照 frontend-slides 的 **借鉴**（条目标注是否已映射到 Px）；（**二**）**Roadmap**——已编号的 P0 / P1 / P2，作排期与规格主文。**若同一能力在（一）与（二）均有描述，以（二）为准。**

### （一）开发者记录（未纳入 Roadmap 或仅作说明）

含**优化想法 / 暂缓对照 / 运行事实**，不等同于「已承诺排期」。已写入 Roadmap 的能力**不**在本节重复展开，仅保留交叉引用。

- **Agent 自产 `scenes.json`**：v4.0 已落地。schema 与变体字段以 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) 为唯一信息源；本地校验走 `steps/validate.js`。

#### 注意事项

- **样张 > 代码**：样式决策以样张 HTML 为准，不在 generator 里硬编码 CSS
- **固定 1920×1080**：样张用 px，不用 rem/vw
- **Generator 只做管道**：读取样张 → 替换 token → 写出
- **scene.body / scene.secondary 可能是 string 或 string[]**：访问前做 `Array.isArray` 判断
- **副标题 fallback 链**：`scene.subtitle || scene.secondary || scene.body?.[0] || ''`
- **系统 Chrome 降级**：`utils/screenshot.js` 和 `steps/package.js` 在 Puppeteer 找不到 bundled Chrome 时 fallback 到 `/Applications/Google Chrome.app`
- **`validate` 永远 exit 0**：`valid:false` 不是工具崩溃而是检查发现问题；调用方读 JSON 字段判断。仅在文件不存在 / JSON 解析错等系统级错时 exit 1。
- **外部依赖与预检**：实现上**无**统一「跑前一键检测」；缺 FFmpeg/ffprobe、TTS、飞书凭证等会在 **screenshot / tts / package / deliver** 等命令处失败。给用户与 Agent 的**收窄规则、条件表、典型报错落点**已写在 **[SKILL.md](SKILL.md)** 第二步；README 接入节与之对齐。

#### 已知限制

1. FFmpeg 需用户手动安装（`brew install ffmpeg`）
2. **依赖审计（待定）**：`npm audit` 可能报传递依赖 `**basic-ftp`** [High — GHSA-chqc-8p9q-pq6q](https://github.com/advisories/GHSA-chqc-8p9q-pq6q)（FTP 相关 CRLF / 命令注入类）。本仓库典型用法是本地或 CI 跑流水线、**不**以「对不可信 FTP 服务端发起客户端连接」为核心能力，**实际风险极低**。若需清零告警或满足合规，再执行 `npm audit fix` 并跑 `npm run test:e2e` 验证 Puppeteer 链路。发版时可将结论摘要抄入 `CHANGELOG.md` 对应版本节。

#### 主题选择链路（与当前代码一致）

实现见 `steps/design.js`。**未**在当次 JSON 传入 `design_mode` 时，优先级为：

1. `project.json` 的 `recommended_design_mode`（v4 起由**宿主 Agent** 写入；须为 13 个合法主题 id 之一）→ `mode_source: project.json`
2. `project.json` 的 `design_mode`（且不等于默认 `electric-studio`）→ `mode_source: project.json`
3. `inferContentType()` + `CONTENT_TYPE_MAP` 内容规则兜底 → `mode_source: auto`

当次 JSON 里显式传入的 `design_mode` 始终最高优先级（`mode_source: user`）。

v4 起 `project.json` 不再由内置命令自动生成，全部由宿主 Agent 自决是否落盘。`scenes.json` 仍为**纯 scenes 数组**；当 Agent 既不传 `design_mode` 又不写 `project.json` 时，`design` 走内容规则兜底选主题。

**dark-botanical**：已映射内容类型 **人文社科**（中/英键），`inferContentType()` 含人文/社科/策展/心理学等关键词时命中；与 **文化艺术** → **vintage-editorial** 并列分流。

**`design` preset 来源**：仅 `steps/presets/frontend-presets.json`（`getFallbackPreset`）与专业模式的 `getDeepTechKeynotePreset`；**不再**调用 OpenClaw 的 `graphic-design` executor（历史上曾硬编码 `~/.openclaw/.../executor.js` 并导致 30s 超时）。若将来再接外部设计 agent，建议用**显式环境变量**（例如仅当 `GRAPHIC_DESIGN_EXECUTOR` 指向可读脚本时才 `spawn`），默认关闭。

#### 借鉴 — frontend-slides（对照参考）

与 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) 对照的**想法库**；各 § 条首 **Roadmap** 标签标明是否已映射到（二）中 Px。**未标注「→ Px」者**尚未写入下方 Roadmap 表体，属备忘级。

##### 1. 视觉风格预览机制（值得优先借鉴）

**Roadmap**：未纳入（暂缓；未写入 P0/P1/P2 表）。

**当前排期：暂缓。** 完整落地依赖「选风格 → 回写 `design_mode` / 会话 → 再走 design → package 或分支入口」等产品闭环改造，触面大；近期不推进，仅作长期参考。在此之前仍可通过 **当次 JSON 显式传入 `design_mode`**、**宿主 Agent 在 `project.json` 写 `recommended_design_mode`**、或 **`design` 命令的内容规则兜底** 控制风格。

**机制**：生成 3 个单页封面 HTML（不同 CSS 变量组合）→ 用户看图选 → 选定风格后批量生成完整演示。

**实现思路**：

- `design` / `html` 新增 "preview" 模式：只生成封面页（或前 3 页）的预览 HTML
- 3 个预览用不同 `design_mode`（或同一主题的不同 CSS 变量组合）渲染
- 预览截图发给用户，用户点选后以此风格生成完整演示
- 核心原理：风格切换 = 切换 CSS 变量，不换 HTML 结构，所以预览成本极低

**收益**：用户在批量生成前确认风格，大幅降低「生成完整演示后发现风格不对」的重跑成本。

##### 2. 渐进式文档（Progressive Disclosure）

**Roadmap**：未纳入（文档结构演进，未写入 P0/P1/P2 表）。

**机制**：主 SKILL.md 只放核心流程（~180行），详细文档（STYLE_PRESETS.md / animation-patterns.md / html-template.md）按需加载。

**SlideForge 可借鉴**：

- 当前 CLAUDE.md 内容较重，可拆分出 "快速参考" 和 "深度开发指南" 两层
- SKILL.md：**Agent 单读者**、文内渐进式；CLAUDE.md（内部开发）保留完整细节

##### 3. Anti-AI-Slop 意识

**Roadmap**：未纳入（prompt / 可选 lint；未写入 P0/P1/P2 表）。

**机制**：有意识地避免 AI 味视觉（告别紫白渐变），提供有辨识度的设计风格。

**SlideForge 可借鉴**（建议优先低成本路径）：

- 在 `refs/STYLE_PRESETS.md`（或主题 preset 说明）中写清各主题的 **推荐气质 / 避免清单**，并在 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) 引导宿主 Agent「少用通用模板腔」
- 自动「检测紫白渐变并改主题」可作为可选 lint（仅告警），**默认不做**，以免误判品牌色

##### 4. 单文件 HTML 输出（vs SlideForge 的 iframe 多文件）

**Roadmap**：部分与 **P0**（动效 / 呈现）正交；**多页内联单文件 / zip** 等产品项**未纳入** P0/P1/P2 表；**文档与 `presentation_static` 等已落实**见下列「SlideForge 可借鉴」。

**frontend-slides**：输出真正零依赖的单文件 HTML（内联 CSS + JS），分享无障碍。

**SlideForge 当前问题**：`presentation.html` 实际是 iframe 壳，需要整个目录才能使用，容易被误认为是单文件。

**SlideForge 可借鉴**：

- **文档与生成物（已落实）**：`SKILL.md` 交付格式节含 **iframe 壳 vs 单文件静帧** 对照表；`steps/package.js` 写出的 `**presentation.html` 在 `<!DOCTYPE>` 下带 HTML 注释**，提示须与同目录 `**page_*.html`** 一并分发；单文件分享场景用 `**presentation_static.html`** 或 PDF。
- **产品（后续）**：`executor` / `package` 增加 `**--single-file`** 或等价 JSON 开关，将多页内联为单 HTML（工作量大）；或提供 **zip 整包**。

##### 5. PPT / 文档导入（与 P1、`step_import` 对齐）

**Roadmap**：**→ P1**（`step_import`、自定义主题样张；**规格正文以（二）P1 为准**）。

**产品叙事**：用户上传 `**.pptx` / `.pdf` / `.png`** → 抽取文本、版式与素材 → 选定主题后接入与 Markdown / 飞书源相同的 **design → package**，产出 1920×1080 演示（HTML / PDF / video）。

**工程主线（与（二）P1 一致；拆解步骤见（二）「P1 → 用户自定义主题 → 实现路径」）**：


| 项 | 约定 |
|----|------|
| **Step** | 新增 `steps/step_import.js`（规划；落地后由 `executor` 路由，作为可选上游工具，不替代 Agent 写 scenes.json） |
| **输入** | `.pptx`、`.pdf`、`.png` |
| **PPT 路径** | `pptx-parser` 等解析母版 → 色板 / 字体 / 版式 → `samples/custom-{name}/` |
| **图片路径** | **由宿主 Agent** 用其 vision 能力推断布局 → 同上生成自定义主题样张（v4 不在 Skill 内调外部 vision API） |
| **输出** | `cover.html` + 变体 HTML，注册 `DESIGN_TEMPLATES`，后续由 `html_generator` 与现有 Step 消费 |
| **脚手架** | `samples/_template/` 先行手工主题（P1 同段） |


**外部参考**：可借鉴 frontend-slides 仓库内 `scripts/extract-pptx.py` 一类抽取思路，**不必**在 slide-forge 内复制其整树。

---

### （二）已明确的 Roadmap

**当前工程侧优先保证的交付形态**：`format` 为 `**html`** / `**pdf`**（或二者组合）时，design → package 链路在具备 Node + Puppeteer/Chrome 的环境下可完整跑通；`**video`** 另依赖 FFmpeg、TTS。发版前 smoke 可用 `examples/four_new_variants_scenes.json` + 显式 `design_mode` 跑 design → screenshot → package（详见 `.gitignore` 中的 `release_smoke_*` 约定）。

#### P0 — HTML 动画支持

当前截图是静态 1920×1080 PNG，交互式 HTML 演示也是图片轮播。下一步让 HTML 页面本身具备动画能力；`format=html` 时直接播放动画，`format=video` 长期可用 Puppeteer 录制动效帧。

**参考**：[frontend.slides](https://github.com/nicolo-ribaudo/frontend-slides) 的 CSS Animation +（后续）Intersection Observer。

**分阶段（执行顺序）**


| 阶段    | 内容                                                                                                                                            | 状态      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **0** | `design_params.page_animations`（`design` 命令默认 `true`）+ `utils/page_animations.js` 注入 CSS + boot 脚本；`screenshot.js` 在开启动画时等待 `data-vp-anim-ready`   | **已落地** |
| **1** | `html_generator` 为列表/卡片/时间线等块加 `data-vp-animate` + 行内 stagger；`page_animation_preset`: `none` / `fade` / `stagger`；`html` 命令传入完整 `design_params` | **已落地** |
| **2** | `format=video`：Puppeteer 录制动效帧；与 `presentation.html`（iframe 单页）动效策略对齐                                                                         | 待做      |


**与现有文件分工**

- `**utils/page_animations.js`**：单页 HTML 的 CSS + 极短启动脚本（P0）。
- `**steps/animations/animation-strategies.js`**：FFmpeg 滤镜策略；语义与页内 CSS 动画分离，勿混用。

**后续实现思路（阶段 1+）**

1. 在重点变体样张或 `html_generator` 内联块上增加 `data-vp-animate` + stagger delay
2. `html` 按 `page_animation_preset` 选择 CSS 包
3. `screenshot` / `package`：无动画分支保持短延迟；有动画分支已等待关键帧后再截图（视频路径后续扩展 `screencast` 或逐帧）

#### P1 — 样张丰富度 + 用户自定义主题

当前 13 主题 + **22** 个 `content_variant`（含 `shared/` 四款叙事变体）覆盖大部分场景，但用户可能有自己的品牌风格。**PPT / PDF / 图片导入**与（一）「借鉴」**§5** 为同一条能力线：§5 用表格总览 `**steps/step_import.js`** 与输入输出；**拆解步骤与依赖以本节下列为准**。

- **持续拓展内置样张**：
  - 新增行业垂直主题（医疗、教育、金融等）
  - 新增变体类型（对比图、流程图、组织架构、漏斗图等）
  - 定期从优秀 PPT 模板中提取新样张
- **用户自定义主题（通用方案）**：
  1. **上传 PPT / 图片 → 自动提取样张**：用户上传自己喜欢的 PPT 或设计截图，系统自动分析版式结构（标题位置、配色、字体、布局模式），生成对应的 HTML 样张 + token 映射
  2. **实现路径**：
    - 新增 `steps/step_import.js`：接收 `.pptx` / `.pdf` / `.png` 输入
    - PPT 路径：用 `pptx-parser` 解析母版 → 提取色板、字体、版式 → 生成 `samples/custom-{name}/` 目录
    - 图片路径：**由宿主 Agent 用其 vision 能力**推断 HTML 结构 + CSS → 生成样张（v4 不在 Skill 内调外部 vision API）
    - 输出标准的 `cover.html` + 变体文件，自动注册到 `DESIGN_TEMPLATES`
  3. **简化方案（先行）**：提供 `samples/_template/` 脚手架目录，用户只需填色值和字体即可快速创建新主题

#### P1.5 — Agent-first 落地（v4.0 已完成）✅

原 P1 末条「Step0–2 与外部 LLM 解耦」已在 **v4.0** 全量落地：

- 删除 `step0_analyze` / `step1_script` / `minimax_utils` / `llm_client`
- 新增 `extract`（纯内容提取）+ `validate`（本地 schema 校验）命令
- `executor` 的 `command: "all"` 改为 `command: "render"`（保留 `all` 别名），从 `scenes.json` 起串联 design → deliver
- v3 数字编号 `step2`-`step7` 全部重命名为语义动词 `design` / `html` / `screenshot` / `tts` / `package` / `deliver`
- `_meta.json` / `package.json` / `.env.example` / `SKILL.md` / `README*` 同步更新
- `docs/SCENES_SCHEMA.md` 作为宿主 Agent 自产 `scenes.json` 的唯一 schema 信息源

**v3 → v4 升级要点（如需向后兼容某些用例）**：

- `step0` / `step1` 命中时 executor 抛错并提示走 `extract` + Agent 自产 + `render`
- `project.json` 不再由内置 Step 自动生成；宿主 Agent 想锁主题时自己写 `recommended_design_mode`
- `.env` 中删去 `MINIMAX_*` / `LLM_*`；保留 `FEISHU_*`

#### ~~P2 — LLM 稳定性优化~~（v4.0 已不适用）

v3 的 L1/L2/L3 容错方案随 `minimax_utils.js` 一同移除。**v4 起 SlideForge 不再调用任何外部 LLM**，原 JSON 解析失败、HTTP 429 退避、整段重请求等问题不复存在。如需历史细节请查阅 v3.x 标签的 `steps/utils/minimax_utils.js`。