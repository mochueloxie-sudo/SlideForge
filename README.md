# SlideForge

> **Agent-first** 演示生成 Skill — 宿主 Agent（Cursor / Claude Code / OpenClaw 等）自己读源材料、写 `scenes.json`，本 Skill 把它渲染成可上台讲的 **1920×1080** 演示（**video** / **pdf** / **html**，可多选），附大纲与逐字稿。**v4.0 起完全移除外部 LLM 依赖**。

[English](README_en.md) · [更新记录](CHANGELOG.md) · [SKILL.md（执行说明）](SKILL.md) · [SCENES_SCHEMA（写 scenes.json）](docs/SCENES_SCHEMA.md) · [开发指南：CLAUDE.md](CLAUDE.md) · [License: MIT](LICENSE)

**用途**：宿主 Agent 把任意源材料（飞书 / Markdown / 网页）整理为结构化 `scenes.json` → SlideForge 渲染为 **1920×1080** 演示。入口为 `node executor.js` + stdin 一行 JSON；Cursor、Claude Code、OpenClaw 等客户端按各自「技能 / 工具」机制挂载本仓库。**执行细节以 [SKILL.md](SKILL.md) 为准**（平台元数据见 `_meta.json`）。

**13 套视觉主题** + **22 种内容变体**完全由样张驱动，主题可在 JSON 里用 `design_mode` 锁定，省略则由 `project.json` 推荐或 `design` 命令内容规则兜底。

**[查看示例输出 →](examples/demo-output/)** 在浏览器中打开 `presentation.html`（iframe 壳 + 同目录 `page_*.html`，支持 hover / 入场动画；**勿只拷贝单个 HTML**）；纯截图单文件轮播见 `presentation_static.html`。

---

## v4.0 重要变化

| | v3 | v4 |
|---|---|---|
| 谁产出 `scenes.json` | 内置 `step0` 调 MiniMax | **宿主 Agent** 在对话内按 `docs/SCENES_SCHEMA.md` 写出 |
| 谁写口播稿 `script` | 内置 `step1` 调 MiniMax | **宿主 Agent** 写到 `scenes[].script`（仅 video 必需） |
| `.env` LLM 配置 | `MINIMAX_*` / `LLM_*` 必填 | **不需要**（仅飞书源/交付保留 `FEISHU_*`） |
| `command: "all"` | source → deck（含 LLM 调用） | 别名指向 `render`：从已存在的 `scenes.json` 起跑 design → deliver |
| 命令命名 | `step0` … `step7`（数字编号） | 全部改语义动词：`extract` / `validate` / `design` / `html` / `screenshot` / `tts` / `package` / `deliver` / `render` |
| 新增工具 | — | `extract`（纯内容提取）、`validate`（本地 schema 校验） |

**升级路径**：原 `step0` / `step1` / `step2`-`step7` 命中时执行器抛错并指引到对应新命令；scenes.json 字段未变，已有 deck 用 `validate` 一遍通过即可继续 `render`。

---

## 文档分工

| 读者 | 文件 |
| --- | --- |
| **使用与执行** | [SKILL.md](SKILL.md) — Onboarding、`command`、Pipeline、13 主题 id、`presentation.html` / `presentation_static.html`、飞书与分步示例 |
| **写 scenes.json** | [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) — 22 个变体的字段表 + 最小示例 + `validate` 自检流程 |
| **开发与排障** | [CLAUDE.md](CLAUDE.md) — 样张与 token、`html_generator` / `design` 命令、Roadmap、调试 |

---

## 功能特性

- **13 种设计主题** — 7 深色 + 6 浅色，每套均为完整 1920×1080 样张包，气质与色板各不相同（见「设计主题」）
- **3 种输入源** — 飞书文档、本地 `.md`/`.txt`/`.docx`/`.pdf`、网页（由 `extract` 抽成 raw_content.txt 给 Agent 阅读）
- **3 种输出格式** — MP4 视频（含 TTS 配音）、PDF、交互式 HTML 幻灯片
- **22 种样式变体** — 叙事、数据、流程、对照、架构/漏斗、卡片与代码等版式一应俱全
- **布局提示** — 多数变体支持多种排布（密铺网格、卡片、宽左/右栏、泳道等）
- **自适应排版** — 字号、栅格列数、内容密度自动适应文字长度
- **页内动效（HTML / 截图）** — `design_params.page_animations` 与 `page_animation_preset`（`none` / `fade` / `stagger`）
- **9 个独立命令**（`extract` / `validate` / `design` / `html` / `screenshot` / `tts` / `package` / `deliver` / `render`） — 任意中间产物都可单独重跑
- **大纲 + 逐字稿** — 每次导出都附带 `outline.md` 和 `script.md`
- **本地校验** — `validate` 在不联网的前提下报告 schema 错误与节奏 warning

---

## 设计主题

每一套主题都是 **独立的整包视觉系统**：字体、色板、面板质感、装饰元素与明暗氛围在 `samples/` 中一次性定稿，**同一套主题会驱动封面、正文、数据页与流程页等所有版式**，保证整场演示像「一套成片」而非零散拼凑。

仓库内置 **13 套** 成品主题（7 深色 / 6 浅色），并与 **22 种样式变体** 全量打通——换主题只换「电影调色与美术」，内容结构仍可走时间线、漏斗、对照、架构栈等任意组合。

在 JSON 里用 `design_mode` 可**锁定**某一主题 id；不传则由流水线自动选用。

### 深色主题

| 主题 | 强调色 | 适用场景 |
| --- | --- | --- |
| `electric-studio` | 蓝紫 + 天蓝 | 通用（默认兜底） |
| `bold-signal` | 橙红 | 商业、品牌、营销 |
| `creative-voltage` | 电蓝 | 创意、设计、艺术 |
| `dark-botanical` | 暖金 | 人文、教育、社科 |
| `neon-cyber` | 霓虹青 + 紫 | 科幻、AI、游戏 |
| `terminal-green` | GitHub 绿 + 蓝 | 技术文档、API |
| `deep-tech-keynote` | 天蓝 + 蓝紫 | 技术演讲 |

### 浅色主题

| 主题 | 强调色 | 适用场景 |
| --- | --- | --- |
| `swiss-modern` | 纯黑 | 极简、瑞士风 |
| `paper-ink` | 红 + 黑 | 编辑、出版 |
| `vintage-editorial` | 棕金 | 复古、文艺 |
| `notebook-tabs` | 薄荷绿 | 笔记、手账 |
| `pastel-geometry` | 粉 + 几何色块 | 轻快、活泼 |
| `split-pastel` | 柔粉 + 蓝 | 温柔、女性化 |

---

## 样式变体

**22 种**内置版式覆盖从「一句话讲清楚」到「复杂信息分层展示」的常见演示需求；所有变体均已接入 **13 套主题**。

- **叙事与阅读** — 大标题与纯文字重点、要点面板、双栏长文、高亮引言、单页大数字强调等
- **数据与指标** — 多指标看板、表格、轻量图表，以及「数字 + 列表」「列表 + 指标」等混合数据页
- **流程与结构** — 时间线、横向阶段条与泳道、分层架构栈、转化漏斗、双栏对照（Before/After 等）
- **展示与资产** — 图标/emoji 栅格、卡片墙、代码片段、章节导航条、图文混排等

完整字段、最小示例与决策树见 **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**。

---

## 执行与接入

将本仓库或 npm 包置于可执行路径后：**运行方式与 JSON 字段**以 **[SKILL.md](SKILL.md)** 为准；**[_meta.json](_meta.json)** 与包一并发布，供宿主发现、索引与机器校验。改样张或排障用 **[CLAUDE.md](CLAUDE.md)**。

| 文件 | 作用 |
| --- | --- |
| **SKILL.md** | 执行说明：Onboarding、按意图收窄的依赖核对、`command`、Pipeline、交付物、13 主题 id、分步示例 |
| **docs/SCENES_SCHEMA.md** | 宿主 Agent 自产 `scenes.json` 的 schema 信息源 |
| **CLAUDE.md** | 仓库内开发：样张与 token、`html_generator`、Roadmap |
| **_meta.json** | 宿主侧：`type: agent`、`executor`、机器可读 `input`/`output`，供 OpenClaw、npm、CI 等 |
| **executor.js** | 唯一入口：`stdin` 一行 JSON → `node executor.js` |

`npm pack` / `npm publish` 发布的 tarball 已包含上述全部文件。

### 跑流水线前先确认（推荐）

在调用 `executor.js` **之前**宜与用户确认，再写入 `format`、`channel`、`source`、`design_mode` 等。**不要**在未确认时默认 `format: "video"`（耗时长，且依赖 FFmpeg、TTS）。

1. **内容来源** — 飞书 / 本地文件 / 网页 URL？（→ `extract` 输入）
2. **交付格式** — PDF / HTML / 视频 / 多选？（`format`）；含 **video** 需 **FFmpeg**、**edge-tts**（或 macOS **`say`**）
3. **交付渠道** — 本地 `output_dir` 或飞书？（`channel`）；**feishu** 需 `.env` 凭证及 `doc_title` / `folder_token`
4. **视觉主题** — 主动说明 13 个 `design_mode` id；用户指定其一写入 JSON，或说「自动」则不传

完整 Onboarding 话术与 JSON 模板见 [SKILL.md](SKILL.md)。

### 主题如何被选中（`design_mode`）

执行时的解析顺序（**当次 JSON 里显式传入的 `design_mode` 始终最高**）：

1. 当次 JSON 的 `design_mode`（用户/Agent 显式指定）
2. `project.json` 中 **`recommended_design_mode`**（v4 起由宿主 Agent 写入；id 须合法）
3. `project.json` 中的 `design_mode`（且不等于默认 `electric-studio`）
4. 正文与标题关键词规则（`inferContentType` + `CONTENT_TYPE_MAP`），例如人文 / 社科 / 策展等 → `dark-botanical`

### 样式与布局如何被选中（`content_variant` / `layout_hint`）

宿主 Agent 在写 `scenes.json` 时直接为每页指定 `content_variant`；`design` 命令做 **节奏校正**（避免连续多页同一构图）和 `layout_hint` 默认值推断。需要完全手工控制时，编辑 `scenes.json` / `design_params.json` 后从对应命令重跑。

---

## 快速开始

```bash
# 1. 安装
git clone https://github.com/mochueloxie-sudo/SlideForge.git
cd slide-forge
npm install

# 2. （可选）配置：v4.0 不需要任何 LLM 凭证
cp .env.example .env
# 仅当 source 是飞书链接 / channel=feishu 时才需填飞书凭证

# 3. 运行 demo（用仓库自带的 scenes.json 示例）
npm run demo:html-local
open ./demo_html_out/presentation.html
```

### 真实工作流（宿主 Agent 视角）

```bash
# 1. (可选) 把外部素材抽成纯文本，给你（Agent）阅读
echo '{"command":"extract","source":"./examples/tencent_intro_light.md","output_dir":"./project"}' \
  | node executor.js
# → ./project/raw_content.txt + source_meta.json

# 2. 你自己读原文 → 按 docs/SCENES_SCHEMA.md 写 ./project/scenes.json
#    （直接 Write 文件，不调任何 LLM API）

# 3. 自检
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js
# → { valid: true | false, errors: [...], warnings: [...] }

# 4. 一把渲染（design → html → screenshot → tts(若 video) → package → deliver）
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["html"],"design_mode":"deep-tech-keynote"}' \
  | node executor.js

# 5. 打开结果
open ./project/presentation.html
```

### 其他格式

```bash
# PDF
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":"pdf"}' | node executor.js

# 视频（需 ffmpeg + edge-tts；scenes 每页需含 script 字段）
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":"video"}' | node executor.js

# 同时生成多种格式
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["pdf","html"]}' | node executor.js
```

---

## 流程图

```
源材料（飞书 / .md / .docx / .pdf / URL）
  │
  ├── [可选] extract ─── content_extractor → raw_content.txt + source_meta.json
  │
  ▼
宿主 Agent 在对话内
  按 docs/SCENES_SCHEMA.md 写 scenes.json（可选写 project.json）
  │
  ▼
[可选] validate ──── 本地 schema 校验 → errors[] / warnings[]
  │
  ▼
design     ── 主题选择 + 变体推断 + layout_hint → design_params.json
  │
  ▼
html       ── 模板 token 替换 → page_XXX.html
  │
  ▼
screenshot ── Puppeteer → page_XXX.png (1920×1080)
  │
  ▼
tts        ── edge-tts → page_XXX.mp3（不生成视频时跳过）
  │
  ▼
package    ── video / pdf / html + outline.md + script.md
  │
  ▼
deliver    ── local（默认）/ feishu
```

每个步骤都读写磁盘 JSON 文件；可对任意 Step 单独补跑。

---

## 环境要求

| 依赖 | 用途 | 安装方式 |
| --- | --- | --- |
| **Node.js ≥ 18** | 运行环境 | [nodejs.org](https://nodejs.org/) |
| **Google Chrome** | 截图 + PDF（screenshot / package） | 通常已预装 |
| `edge-tts` | TTS 配音（tts，仅视频格式） | `pip install edge-tts` |
| `ffmpeg` | 视频编码（package，仅视频格式） | `brew install ffmpeg` |
| `lark-cli` | 飞书发布（deliver，可选） | `npm i -g @larksuite/cli` |
| 飞书 App 凭证 | 飞书源 / 飞书发布 | `.env` 中 `FEISHU_APP_ID` / `FEISHU_APP_SECRET` |

**v4.0 不再需要任何 LLM API 凭证**——`scenes.json` 完全由宿主 Agent 在对话内产出。

### 环境变量

复制 `.env.example` 到 `.env`，**仅在用到飞书时**填写：

```ini
# 仅当 source 是飞书链接 / channel=feishu 时需要
FEISHU_APP_ID=cli_...
FEISHU_APP_SECRET=...
```

---

## 输出结构

```
output/
├── scenes.json            # 由 Agent 写入：结构化场景数据 + 可选逐字稿
├── (project.json)         # 可选：Agent 写入的 recommended_design_mode 等
├── design_params.json     # design 输出：主题、变体、布局提示
├── page_001.html          # 渲染后的 HTML 幻灯片
├── page_002.html
├── ...
├── screenshots/
│   ├── page_001.png       # 1920×1080 截图
│   └── ...
├── presentation.html        # 主入口：iframe 单页（hover + 动效）
├── presentation_static.html # PNG 轮播（与 PDF 画面一致）
├── presentation.pdf      # PDF 文档（format=pdf）
├── presentation.mp4       # 带配音视频（format=video）
├── outline.md             # 内容大纲
├── script.md              # 完整逐字稿
└── MANIFEST.md            # 交付清单（channel=local）
```

### format=html：两种浏览器入口（交付时注意）

| 文件 | 单文件能否独立使用 | 必须与谁一起分发 | 交互 / 动效 |
| --- | --- | --- | --- |
| **`presentation.html`** | **否**（iframe 壳） | **须**与同目录全部 `page_001.html` … `page_NNN.html` | 有：各页 hover、页内 CSS 入场 |
| **`presentation_static.html`** | **是**（内嵌 PNG base64） | 无 | 无模板内交互，静帧翻页，与 PDF 画面对齐 |

- 交付 **`presentation.html`** 时：至少该文件 + 全部 **`page_*.html`**（建议整目录或 zip）
- **单文件分享**：用 **`presentation_static.html`** 或 **PDF**

---

## 分步使用

需要细粒度控制时，单独运行各命令（**v4 起所有命令统一为语义动词，没有 stepN 编号**）：

```bash
P=./project

# 1. (可选) 提取源材料
echo '{"command":"extract","source":"./article.md","output_dir":"'"$P"'"}' | node executor.js

# 2. Agent 自己写 scenes.json 到 $P/scenes.json（不通过 executor）

# 3. 自检
echo '{"command":"validate","scenes":"'"$P"'/scenes.json"}' | node executor.js

# 4. 设计参数（自动主题或手动指定）
echo '{"command":"design","scenes":"'"$P"'/scenes.json","output_dir":"'"$P"'","design_mode":"neon-cyber"}' | node executor.js

# 5. HTML 渲染
echo '{"command":"html","scenes":"'"$P"'/scenes.json","design_params":"'"$P"'/design_params.json","output_dir":"'"$P"'"}' | node executor.js

# 6. 截图
echo '{"command":"screenshot","html_dir":"'"$P"'","output_dir":"'"$P"'/screenshots","design_params":"'"$P"'/design_params.json"}' | node executor.js

# 7. 打包成交付格式
echo '{"command":"package","format":["pdf","html"],"scenes":"'"$P"'/scenes.json","screenshots_dir":"'"$P"'/screenshots","html_dir":"'"$P"'","output_dir":"'"$P"'"}' | node executor.js

# 8. 交付到本地或飞书
echo '{"command":"deliver","channel":"local","output_dir":"'"$P"'"}' | node executor.js
```

---

## 自动化与工具接入

`stdin` → `executor.js` → `stdout`，JSON 契约见 [_meta.json](_meta.json)；**人类可读执行说明**见 [SKILL.md](SKILL.md)；**Agent 自产 schema** 见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)。

- **Cursor / Claude Code 等** — 按客户端要求注册 `SKILL.md` + `docs/SCENES_SCHEMA.md`
- **OpenClaw** — 通过 `_meta.json` 发现包与 schema
- **脚本 / CI** — 管道传入一行 JSON 或 `node executor.js ./request.json`

开发与排障：[CLAUDE.md](CLAUDE.md)。

---

## 项目结构

```
slide-forge/
├── executor.js                     # 入口 — 将命令路由到各步骤
├── _meta.json                      # 宿主 schema（与 npm 同发）
├── SKILL.md                        # 执行说明（command / 依赖 / 交付）
├── CLAUDE.md                       # 仓库内开发指南（样张、Step、Roadmap）
├── docs/
│   └── SCENES_SCHEMA.md            # 宿主 Agent 自产 scenes.json 的 schema
├── steps/
│   ├── extract.js                  # 内容提取（飞书 / 本地 / 网页）
│   ├── validate.js                 # scenes.json 本地校验
│   ├── design.js                   # 主题选择 + 变体推断
│   ├── html.js                     # HTML 渲染（模板引擎）
│   ├── screenshot.js               # Puppeteer 截图
│   ├── tts.js                      # TTS（edge-tts → say 降级）
│   ├── package.js                  # 交付格式（video/pdf/html）
│   ├── video.js                    # FFmpeg 视频编码（内部，被 package 调用）
│   ├── deliver.js                  # 交付渠道（local/feishu）
│   ├── publish.js                  # 飞书发布（内部，被 deliver 调用）
│   └── utils/
│       ├── content_extractor.js    # 多源内容提取
│       ├── tool-locator.js         # 系统工具自动发现
│       └── step-utils.js           # 共享工具
├── utils/
│   ├── html_generator.js           # 核心：模板加载 + token 替换
│   └── screenshot.js               # Puppeteer 封装
├── refs/                           # 设计参考（STYLE_PRESETS 等）
├── samples/                        # 设计主题模板
│   ├── electric-studio/            # 13 个主题目录，每个含完整变体集
│   ├── bold-signal/
│   ├── ...
│   └── shared/                     # 主题无关变体（stats、timeline 等）
├── examples/
│   ├── scenes_example.json         # 最小 scenes.json 示例（v4 schema）
│   ├── four_new_variants_scenes.json # compare / process_flow / architecture_stack / funnel 目检
│   ├── tencent_intro_scenes_fixture.json
│   ├── tencent_intro_light.md      # 长文示例（用 extract 抽取）
│   └── full_variant_test.md
├── .env.example                    # 环境变量模板（仅飞书）
├── CHANGELOG.md                    # 版本与用户向变更记录
└── package.json
```

---

## 参与贡献

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feat/my-feature`）
3. 遵循设计原则（扩展步骤与 grep 调试见 **[CLAUDE.md](CLAUDE.md)**）：
   - **模板优于代码** — 所有视觉决策放在 `samples/*.html`，不写在生成器逻辑里
   - **固定像素** — 模板使用 `px` 单位（目标 1920×1080），不用 `rem`/`vw`
   - **生成器是管道** — 加载模板 → 替换 token → 写出文件
   - **Token 命名** — `{{UPPER_CASE}}`，重复标记不带索引
   - **新增变体** — 同步更新 `docs/SCENES_SCHEMA.md` 与 `steps/validate.js`
4. 用 `npm run test:e2e` 测试
5. 提交 PR

---

## 许可证

[MIT](LICENSE)
