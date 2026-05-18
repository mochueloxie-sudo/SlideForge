# Changelog

面向使用者的版本记录；架构与长期路线见 `[CLAUDE.md](CLAUDE.md)` **备忘与 Roadmap** → **（二）已明确的 Roadmap**。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [4.1.1] — 2026-05-18 — 飞书 deliver 支持 PDF（优先）

> **patch**：`scenes.json` 契约不变；仅扩展 `deliver` / `render` 与文档。

### 变更

- **`channel: "feishu"`**：`presentation.mp4` 与 `presentation.pdf` **至少嵌入其一**（可两者皆有），仍走 `lark-cli docs +media-insert`；两者都有时 **PDF 优先**（Markdown 段落与 `+media-insert` 顺序一致）。
- **`render`**：`format` 含 `pdf` 时自动向 `deliver` 传入 `pdf_path`（默认同目录 `presentation.pdf`）；仅 PDF 即可闭环飞书，无需 FFmpeg/TTS。
- **`publish` 元数据**：`pdf_token` / `pdf_block_id`；`block_id` 仍为视频块 id（与旧版兼容）。

---

## [4.1.0] — 2026-05-18 — Q1 视觉生产层（起步）

> **minor**：新增可选 scenes 字段与生成器能力；默认渲染行为不变（未写 `hero_image` 的 deck 与 4.0.x 一致）。

### 新增（Q1）

- **Q1-A 主题 tokens（阶段 1）**：`samples/_core/TOKENS.md`；neon / bold / dark 三套扩展 `tokens.css`；**深度 8 页** 已 `var(--sf-*)`，HTML 单源 **`samples/_core/layouts/`**（见 Q1-D）。
- **Q1-B 主视觉**：`hero_image` / `diagram` / `brand_mark` + `visual_alt`；`utils/visual_assets.js` 解析路径并填充 `.vp-visual-slot`；金标 `product_launch` 演示页示例 `examples/assets/orbit-demo.svg`。
- **Q1-C 排版**：`utils/typography.js`（`kpScale` 等）；`html_generator` 改用统一 kp 字号逻辑。
- **`design`**：`hero_image` + `panel` 时自动推断 `composition: split-visual`（可被 scene 覆盖）。
- **Q1-D（阶段 2）**：深度 **8** 布局单源 **`samples/_core/layouts/`**；**全部 13 主题** 删除主题内重复 HTML（**保留** `notebook-tabs/cover.html` 定制封面）；`loadTemplateWithSource`：**主题 → `_core` → `shared/`**；无 `tokens.css` 时 **`utils/depth_tokens_from_tpl.js`** 从 `DESIGN_TEMPLATES` 生成完整 `--sf-*`；`sync:depth-themes` 为 **no-op**。

### 文档

- **samples/_core/TOKENS.md**、**NEON_DEPTH**、**ROADMAP**（Q1-A / Q1-D）。

---

## [4.0.3] — 2026-05-18 — 输出品质 Q0（金标 + 样张深度 + Agent 指引）

> **patch 级**。宿主 Agent 写 `scenes.json` 的契约不变；渲染默认仍为 `enhancement: minimal`（样张主导排版）。

### 新增

- **Q0 输出品质路线**：[docs/ROADMAP_OUTPUT_QUALITY.md](docs/ROADMAP_OUTPUT_QUALITY.md)、[docs/NEON_DEPTH.md](docs/NEON_DEPTH.md)；金标 `examples/golden/`（product_launch / business_report / humanities_narrative）。
- **Art direction**：`visual_weight` / `composition` → `utils/art_direction.js`；summary 收尾 `layout_hint: cards` + 样张内 CTA pills。
- **品质 lint**：`steps/quality_lint.js` → `validate` 的 `quality_warnings[]`（不阻塞 render）。
- **`enhancement: minimal`（默认）\| `full`**：`utils/enhancement.js`；minimal 不注入全局 readability/density 盖样张。
- **深度样张（neon-cyber）**：… **4.1.0 起** HTML 单源 `samples/_core/layouts/` + `tokens.css` 换肤（见 4.1.0 节 Q1-D）；`sync:depth-themes` 为 no-op。
- **金标用 shared 变体主题化**：`npm run sync:shared-themes`（bold：`timeline` / `panel_stat`；dark：`two_col` / `quote_context`）。
- **`npm run check:golden`**：`validate` → `golden:render` → 检查未替换 `{{TOKEN}}` 与 `readability baseline` 泄漏；CI 已接入。
- **`npm run golden:render`**：三套金标一键 design + html。

### 文档

- **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)** §0.7–§0.8：艺术指导 + **品质清单**（写 scenes 时自检）。
- **[SKILL.md](SKILL.md)**：第四步增加品质节奏表与 `quality_warnings` 处理说明。

### 升级

```bash
git pull && npm install
npm run check:golden    # 发版前建议跑一遍
```

---

## [4.0.2] — 2026-05-18 — CI + validate hint + 开发者校验脚本

> **patch 级**：无破坏性 API 变更。侧重宿主 Agent / 贡献者的校验体验与仓库卫生。

### 新增

- **GitHub Actions CI**（`.github/workflows/ci.yml`）：push/PR 到 `main` 时自动 `validate` 全部 `examples/*scenes*.json`，并对 `four_new_variants_scenes.json` 跑 `design` + `html` 冒烟；拒绝遗留 `stepN` 命令。`PUPPETEER_SKIP_DOWNLOAD=true` 以跳过 Chromium 下载（CI 不跑截图）。
- **`validate` 可执行 hint**：每条 `errors[]` / `warnings[]` 附带 `hint` 字段（`FIELD_HINTS` + `MSG_PATTERN_HINTS`），直接指引如何改 schema 违规。
- **`npm run check` / `check:all`**（`scripts/check-scenes.js`）：人类友好的 `validate` 包装；`check:all` 白名单覆盖 4 个示例 scenes。

### 修复 / 清理

- **示例 fixtures 升级到 v4 schema**：`tencent_intro_scenes_fixture.json`、`verify_notebook_shell_scenes.json` 补全 `content_variant` 与字段形态，CI 可通过。
- **仓库卫生**：删除死代码 `utils/html_builder.js`、历史 `patches/*.diff`；`.gitignore` 扩展临时输出目录；停止跟踪 `.claude/launch.json`。
- **README 徽章**：CI / latest-release / license / Node 版本徽章。

### 升级

```bash
git pull && npm install   # 无新运行时依赖；建议拉取以获 CI 与 hint
```

---

## [4.0.1] — 2026-05-18 — 文档密度优化

> **本次无功能/无 API 变更**，纯文档迭代。目的：把 v4.0.0 发布后首次接触本 Skill 的宿主 Agent 的「学习曲线」尽可能压低，同时清理 v4.0 ship 时还留下的版本叙事噪音。

### 新增

- **`docs/SCENES_SCHEMA.md` §0 五分钟速通版**：在文档顶部加入「3 句话理解 + 内容形态决策图 + 3 个常用变体最小骨架 + 1 个能直接跑通的 4 页 deck 完整示例 + 5 个最常见错误清单 + 高频字段速记」。Agent 首次接触只需读 §0 就能完成第一个 deck；§1-§8 沉为参考手册。**§0.4 的 deck 已实测能通过 `validate` 并渲染 4 页 HTML**。

### 文档精简（保持单一信息源原则）

- **`SKILL.md`**：277 → 162 行（-41%）。删除与 `docs/SCENES_SCHEMA.md` 重复的 22 变体速查、删除 13 主题表（指向 README 主题节）、删除冗长的单步补跑 echo 命令块、删除「v4.0 核心变化」迁移提示（移到 CHANGELOG）。
- **`README.md`**：401 → 163 行（-59%）。删除「v4.0 重要变化对照表」（属 CHANGELOG）、删除 ASCII 流程图、删除完整项目结构树、合并「执行与接入」/「主题选择优先级」/「样式与布局如何被选中」三节。
- **`README_en.md`**：467 → 163 行（-65%）。镜像 `README.md` 结构精简。
- **`docs/SCENES_SCHEMA.md`**：移除文首「v4.0 起 SlideForge 不再调用任何外部 LLM」前缀（参考文档不带版本叙事）。
- **`examples/tencent_html_test/README.md`**：移除「v4.0 起」括号。

### 清理

- **删除** `docs/GITHUB_RELEASE_DRAFT_v3.1.1.md` / `v3.1.2.md` / `v3.1.3.md`（已发布过的历史草稿，无复用价值）。

### 设计原则确认（文档分工）

| 文档 | 谁的家 | 是否允许写版本叙事 |
|------|--------|----------------|
| `CHANGELOG.md` / `docs/GITHUB_RELEASE_DRAFT_*.md` | 版本历史 | ✅ 必须写 |
| `CLAUDE.md` | 贡献者 / 内部 | ✅ 写"已删除清单"和"v3→v4 映射"帮助追溯 |
| `SKILL.md` / `README.md` / `docs/SCENES_SCHEMA.md` | 当下使用 | ❌ 只描述现状 |

净 diff：**-672 行**（含删除 3 个历史草稿）。

---

## [4.0.0] — 2026-05-15 — Agent-first（破坏性变更）

> **核心定位变化**：从「Skill 内调外部 LLM 生成 PPT」转为 **「宿主 Agent 自产 scenes.json，Skill 只渲染」**。整个 LLM 调用链路被移除。

### 破坏性变更（必读）

- **删除 `command: "step0"` / `command: "step1"`**：命中时 `executor.js` 抛错并提示走新流程。
- **删除文件**：`steps/step0_analyze.js`、`steps/step1_script.js`、`steps/utils/minimax_utils.js`、`steps/utils/llm_client.js`。
- **`command: "all"` 语义变更**：原 `source → deck`（含 LLM 调用）改为 **从已存在的 `scenes.json` 起跑 design → deliver**；新增等价命名 `command: "render"`，建议优先使用。
- **`step2`-`step7` 全部重命名为语义动词**：`step2 → design`、`step3 → html`、`step4 → screenshot`、`step5 → tts`、`step6 → package`、`step7 → deliver`。文件 `steps/step6_video.js` → `steps/video.js`、`steps/step7_publish.js` → `steps/publish.js`（内部，被 `package` / `deliver` 调用）。旧名命中 executor 抛错并指引到新名。
- **`.env` 不再要求 LLM 凭证**：删去 `MINIMAX_API_KEY` / `MINIMAX_MODEL` / `MINIMAX_BASE_URL` / `LLM_*`；保留飞书凭证。
- **`project.json` 不再由内置命令自动生成**：宿主 Agent 自决是否落盘。`recommended_design_mode` 仍在 `design` 选主题链路中生效。

### 新增

- **`command: "extract"`**（`steps/extract.js`）：把 source（飞书 / 本地 / 网页）抽成 `raw_content.txt` + `source_meta.json`，**零 LLM**。供宿主 Agent 阅读并据此写 `scenes.json`。
- **`command: "validate"`**（`steps/validate.js`）：`scenes.json` 本地 schema 校验，输出 `errors[]` / `warnings[]`，**零 LLM、零网络**。永远 exit 0；valid 状态在 JSON 字段里。
- **`docs/SCENES_SCHEMA.md`**：宿主 Agent 自产 `scenes.json` 的唯一信息源，包含 22 个变体的字段表、最小示例、决策树、常见坑。

### 文档全量更新

- **`SKILL.md`**：重写 Onboarding 为 5 步流程（意图 → extract → 写 scenes → validate → render）；删除「.env LLM 配置」「Step0/1 在子进程调 API」等所有 LLM 引导。
- **`CLAUDE.md`**：架构表移除 Step0 / Step1 / minimax_utils / llm_client 行；新增「extract / validate」「主题选择 v4 链路」；标 P1 末条 Agent 解耦完成；P2 LLM 稳定性章标记为 v4 不再适用并指向 v3.x 标签。
- **`README.md` / `README_en.md`**：重写顶部定位、快速开始、流程图、环境要求、项目结构。新增「v4.0 重要变化」对照表。
- **`_meta.json`**：`version: 4.0.0`；`description` 与 `SKILL.md` 文首对齐；`command.enum` 移除 `step0` / `step1`，新增 `extract` / `validate` / `render`。
- **`.env.example`**：仅保留 `FEISHU_*` 与可选 `LARK_CLI_PATH` / `CHROME_PATH`。
- **`package.json`**：`version: 4.0.0`；移除 `minimax` / `llm` keywords；`scripts` 重写 `start` / `test:e2e` 等改为从 `scenes.json` 起跑；新增 `test:validate`。

### 升级指引

| 你原来的用法 | v4 怎么做 |
|---|---|
| `echo '{"command":"all","source":"...","format":"html"}' \| node executor.js` | (1) `extract` 拿 raw_content.txt（可选）；(2) Agent 自己写 scenes.json；(3) `validate`；(4) `render` |
| `echo '{"command":"step0","source":"..."}' \| node executor.js` | `extract` + Agent 写 scenes.json |
| `echo '{"command":"step1","scenes":"..."}' \| node executor.js` | Agent 给每页补 `script` 字段后直接走 `tts` / `package` |
| `echo '{"command":"step2","scenes":"..."}' \| node executor.js` | `command: "design"` |
| `echo '{"command":"step3","scenes":"..."}' \| node executor.js` | `command: "html"` |
| `echo '{"command":"step4","html_dir":"..."}' \| node executor.js` | `command: "screenshot"` |
| `echo '{"command":"step5","scenes":"..."}' \| node executor.js` | `command: "tts"` |
| `echo '{"command":"step6","format":...}' \| node executor.js` | `command: "package"` |
| `echo '{"command":"step7","channel":"..."}' \| node executor.js` | `command: "deliver"` |
| `.env` 配 `MINIMAX_*` | 删掉，v4 不需要 |

### 已知影响

- 现存依赖 `command: "all"` + `source` 自动跑通的脚本会失败，需要按上表迁移。
- 已存在的 `scenes.json` 字段未变，`validate` 一遍通过即可继续 `render`。
- 历史 v3 的 LLM 容错细节（L1/L2/L3）若需查阅，请回 v3.x git tag。

---

## [3.2.0] — 2026-05-13

### 修复

- **`steps/utils/content_extractor.js`** — `extractBlockText` 全面重写为按 `block_type` 的 `switch-case`，覆盖 Heading1–9、Bullet、Ordered、Code、Quote、Divider、Todo、Callout 等全部飞书块类型；新增 `getElementsText` 统一处理元素数组，支持 `docs_link`、`equation` 等非纯文本元素。
  - **之前**：飞书 block 被拍平成纯文本，层级结构丢失，LLM 只输出 3 个关键词
  - **之后**：Markdown `#`/`##`/`-`/`>` 保留，LLM 正确输出 10 页完整幻灯片
- **`steps/step1_script.js`** — JSON 输出提示大幅强化：明确转义规则、增加格式示例、强化围栏禁止说明；System 消息追加输出格式指令；**temperature 从 0.7 降至 0.3**，提升 JSON 格式稳定性。

## [Unreleased]

> 当前迭代工作区。

### 候选

- **交付 HTML**：`presentation.html` 键盘说明写入 README / 首次打开轻提示（可选）。
- **`SCENES_SCHEMA.md` 决策树**：补充「按内容长度推荐变体组合」的快查表，进一步降低 Agent 写 scenes.json 的门槛。

### 文档微调

- **`SKILL.md`**：第一步开头新增「先识别输入模式」（单源 / 多源融合）+ 主表后追加「多源融合补充」小节；第三步 `extract` 加一句多源时分别跑的指引；删除第四步原「多源场景」小节（信息已前置到第一步，避免遗漏识别）。**目的**：把「多源融合」从「第四步的特殊情况」提到「第一步的输入模式分叉」，避免 Agent 在意图阶段漏识别导致后期返工。

### 待定

- `**npm audit`（`basic-ftp`）**：结论、风险判断与后续动作以 **`CLAUDE.md`**「备忘与 Roadmap」→「（一）开发者记录」→「已知限制」第 2 条为准；此处仅作占位。

---

## [3.1.3] — 2026-04-10

### 文档与 Agent 体验

- **`SKILL.md`**：Onboarding 四段（意图 → **按 `format`/`channel`/`source` 收窄**的配置检查 → 拼 JSON → 交付/HTML）；**主动列 13 主题 +「自动」不传 `design_mode`**；Onboarding **不问**页内动效；**不引导**手持外援 `scenes.json` 跳过 Step0/1；分步模板前注明 **按 `format` 裁剪**；维护约定改为文末脚注 **`[^maint]`**；示例 `source` 为 **`./examples/tencent_intro_light.md`**；Step4 须带 **`design_params`**；HTML 预览 **`npm run preview:html -- <output_dir>`**、勿依赖 `file://` 打开 iframe 壳。
- **`_meta.json`**：`version` **3.1.3**；`description` 与 `SKILL.md` 文首 **逐字一致**（叙事摘要 + 适用场景 + LLM 与对话模型分流说明）。
- **`README.md` / `README_en.md`**：摘要与「跑前确认」与 SKILL 对齐（主题第 4 条、动效不问、依赖节指向 Onboarding 第二步 / **E**）；快速开始示例与 SKILL 同源；章节分隔统一为 **`***`**；流程说明与「仅在有本机前置产物时补跑」一致。
- **`CLAUDE.md`**：项目概述与「外部依赖」交叉引用改为指向 SKILL **Onboarding 第二步**；主文档结构描述与当前 SKILL 章节名对齐。

### 工程

- **`check_tools.sh`**：`tool-locator.js` 改为**相对仓库根**加载（去掉硬编码 `~/.openclaw/...`），便于本地诊断。
- **`package.json` / `package-lock.json`**：版本号 **3.1.3**；`package.json` 的 `description` 与 **`_meta.json`** 对齐。

---

## [3.1.2] — 2026-04-13

### 页内动画与截图

- **`design_params.page_animations`** / **`page_animation_preset`**（`none` / `fade` / `stagger`）：`utils/page_animations.js` 注入样式与就绪标记；`html_generator` 在统计卡、时间线、要点、图表等块上输出 `data-vp-animate` 与 stagger；`{{KEY_POINT}}` / `{{BODY}}` 行重复与图例行同样注入。
- **Step4**：将 `design_params` 传给 `screenshot.js`，开启动画时等待 `data-vp-anim-ready` 再截图。
- **交互 hover（克制）**：`shared` 变体 + `panel` / `icon_grid` / `card_grid`；仅用 outline / background / box-shadow，避免与入场 `transform` 冲突；`@media (hover:hover) and (pointer:fine)`。

### HTML 交付与本地预览

- **`presentation.html`**：iframe 单页主入口（翻页重播入场 + 组件 hover）；**`presentation_static.html`**：PNG 轮播（与 PDF 画面一致）。
- **`step6_format.js`**：`presentation.html` 增加分发说明注释；终端提示勿用 `file://` 打开 iframe 目录，并给出 **`npm run preview:html -- <output_dir>`**；壳内轻提示对齐。
- **`utils/preview_server.js`**：本地静态 HTTP 预览（默认端口 8765）；`package.json` 脚本 **`preview:html`**。

### 主题与 `html_generator`

- **`notebook-tabs`**：对仅存在于 `samples/shared/` 的变体，经 **`samples/notebook-tabs/_content_shell.html`** 将 shared 整页嵌入主题纸面 / tabs 壳（`loadTemplateWithSource` + `mergeNotebookTabsSharedIntoShell`），避免 shared 页脱离笔记本视觉。

### Step0 / Step1 与 LLM

- 新增 **`steps/utils/minimax_utils.js`**：OpenAI Chat Completions 兼容 HTTP、**L3** 系统约束、**L1** 围栏剥离与括号配平抽取、**L2** HTTP 退避、解析失败整段重请求；Step0 / Step1 统一 `require` 该模块。
- **环境变量**：**`MINIMAX_*` 优先**（建议 MiniMax），否则 **`LLM_*`**；二者皆缺时错误信息指向两处；**`getLlmConfig()`** 导出供日志与诊断。
- **`llm_client.js`**：与 `minimax_utils` 对齐的配置读取；**`.env.example` / README / README_en / SKILL** 同步说明。
- **`package-lock.json`**：与当前 `dependencies` 对齐（已移除未使用的 `@anthropic-ai/sdk` 树）。

### Agent、文档与元数据

- **`SKILL.md`**：YAML 摘要 + 依赖清单、失败对照、执行话术；修正表格/行内代码与加粗混排以免预览乱码；宿主说明见 **`_meta.json`** 附录。
- **`CLAUDE.md`**：`refs/` 之后改为 **（一）开发者记录** / **（二）已明确的 Roadmap** 双轨；借鉴各 § 标注 Roadmap 映射；**§5** 与 **P1**、`steps/step_import.js` 对齐；**P1** 增补 Step0–2 与 Agent 产出 **`scenes.json`** 方向。
- **`README.md` / `README_en.md`**：与上述 LLM 策略、交付说明、`CLAUDE` 中 P2 引用路径一致。
- **`refs/STYLE_PRESETS.md`**：与当前主题参考一致的小幅修订。

### 示例与工程卫生

- **`npm run demo:html-local`**：`examples/scenes_example.json` 跑 step2→3→4→6（仅 `html`），不依赖 Step0 LLM。
- 示例分镜 **`examples/verify_notebook_shell_scenes.json`**：用于验证 `notebook-tabs` + shared 壳与动效。
- **`.gitignore`**：忽略 **`verify_notebook_shell/`** 等本地验证输出目录。

---

## [3.1.1] — 2026-04-12

### 视频合成

- `**steps/animations/animation-strategies.js`**：去掉各策略中的 `**fade=in`**。每页单独编码后再 `**concat**` 时，片头 `fade=in` 会从黑场拉起，表现为 封面黑屏 与 翻页黑幕。保留 zoompan / hue / crop / boxblur 等不引入全透明起手的滤镜；`professional` 改为 `**setsar=1**`。
- `**steps/step6_video.js**`：`-vf` 插入在所有输入之后、`-c:v` 之前，避免 FFmpeg 参数顺序错误。

### HTML 渲染

- `**utils/html_generator.js**`：`content_variant` `**summary**` 映射到 `**02_panel**`，避免误落 `01_text_only` 导致 `key_points` 不渲染。
- `**nav_bar**`：`subtitle` / `secondary` / `body` 皆空时，用 `**script**` 写入 `**SUBTITLE**`（模板正文区为 `{{SUBTITLE}}` 而非 `{{BODY}}`）。

### Agent 与文档

- `**executor.js**`：支持 `**node executor.js ./request.json**`，便于 OpenClaw 等禁止 shell 管道的环境。
- `**SKILL.md**` / `**README.md**` / `**README_en.md**`：触发技能前建议向用户确认 `format` / `channel`；说明 `**presentation.html`（iframe + `page_*.html`）** 与 `**presentation_static.html`（PNG 单文件轮播）** 的差异，避免误称「交互式」。

---

## [3.1.0] — 2026-04-11

### 内容变体（四款 · 全主题可用）

- `**compare`**（`samples/shared/20_compare.html`）：双列对照 / Before·After / 优劣列表；字段 `compare_left_title`、`compare_right_title`、`compare_left_points[]`、`compare_right_points[]`，可选 `compare_center_label`（如 `VS`、`→`）。布局提示：`equal`  `wide-left`  `wide-right`。
- `**process_flow`**（`21_process_flow.html`）：叙事型流程——横向阶段条（`process_stages[]`）或泳道（`flow_lanes[]` + `cells[]`）。布局提示：`horizontal`  `swimlane`。显式 `content_variant: process_flow` 时可用 `steps[]` 降级映射为横向 rail。
- `**architecture_stack**`（`22_architecture_stack.html`）：系统分层 / 架构栈，`layers[{ title, desc }]`。层数 ≥5 时 Step2 可给 `layout_hint: compact`。
- `**funnel**`（`23_funnel.html`）：转化漏斗 3～5 层，`funnel_stages[{ label, desc }]`；可选 `compact` 高密度。

### 流水线

- **Step0**：`steps/step0_analyze.js` 补充上述变体的选用说明、容量表与 JSON schema。
- **Step2**：`steps/step2_design.js` 在 hybrid 之后、chart 之前识别四类场景；`computeLayoutHint` 覆盖 `compare` / `process_flow` / `architecture_stack` / `funnel`。
- **HTML**：`utils/html_generator.js` 注册 `variantMap`、预渲染 token、`inferVariant` 字段推断、缺数据时降级为 `panel`；`process_flow` 默认 `layout-horizontal`。

### 示例与文档

- 示例分镜：`examples/four_new_variants_scenes.json`（四变体 + 封面/过渡/收尾，便于 step2→3 目检）。
- 中英 README 变体表与特性描述已同步；`CLAUDE.md` 中 `shared/` 样张列表已更新。
- `**npm pack` / `npm publish`**：`package.json` 增加 `**files` 白名单**， tarball 含 `**SKILL.md`**、`**_meta.json`**、`executor.js`、`steps/`、`samples/`、`examples/`、`refs/` 等运行与 Agent 接入所需路径；不再打入 `demo_html_out`、`preview_*`、`test_*` 试跑目录、`.claude`、仓库内 `docs/` 草稿等。`.gitignore` 补充常见试跑目录，避免误提交。

---

## [3.0.1] — 2026-04-10

### 交互式网页（`presentation.html`）

- 翻页按钮缩小，中性毛玻璃样式，在浅色 / 深色幻灯片上更易辨认。
- 「逐字稿」按钮：面板打开时隐藏，关闭面板后恢复；短逐字稿时抽屉排版更紧凑。
- 键盘：方向键与空格翻页，`S` 开关逐字稿，`Esc` 关闭。

### 主题与流水线

- Step0 可写 `recommended_design_mode`；Step2 与文档对齐：显式参数 → 推荐 → `project.json` 保存值 → 关键词规则（含 `dark-botanical` / 人文社科）。
- Step2 设计参数统一走本地 `frontend-presets.json`（移除历史 graphic-design 外部调用路径）。

### 文档与仓库

- 中英 README：修正 clone 地址、主题解析顺序、示例 `tencent_intro_light.md`。
- `.gitignore`：忽略常见本地试跑输出目录。

---

## [3.0.0] — 2026-04-09

- SlideForge 品牌化与 v3 能力基线（13 主题、多格式、8 Step 等）。详见仓库 tag `v3.0.0` 及对应 Release。