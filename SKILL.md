---
name: "slide-forge"
description: "Agent-first 演示生成 Skill：你（宿主 Agent）自己读源材料、按 docs/SCENES_SCHEMA.md 写 scenes.json，本 Skill 把它渲染为 1920×1080 演示（HTML / PDF / video，可多选），13 套主题 + 22 变体由样张驱动。本 Skill 不依赖任何外部 LLM——scenes 与 script 全由你产出。可选工具：extract（飞书/网页/本地文件 → raw_content.txt）、validate（本地 schema 自检）。适用：你接到「把这堆材料做成 PPT」的任务，并能在用户本机执行 `node executor.js`。"
---

# SlideForge — Agent-first Skill

你（宿主 Agent）是**内容大脑**：理解、结构化、写口播稿全由你做；本 Skill 只把你写出的 `scenes.json` 渲染为 1920×1080 演示。**不调任何外部 LLM**。

**入口**：仓库根执行 `node executor.js`，stdin 一行 JSON，或 `node executor.js /path/to/request.json`。

**写 scenes 的字段细节**：[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)

---

## 推荐工作流（5 步）

```
1. 问意图    ── 跟用户确认 source / format / channel / 主题倾向
2. extract   ── (可选) 把外部素材抽成 raw_content.txt 供你阅读
3. 写 scenes ── 在对话内按 SCENES_SCHEMA 写 scenes.json 落盘
4. validate  ── 本地自检；valid:false 时按 errors[] 修订
5. render    ── 一把跑完 design → deliver，产出 HTML / PDF / video
```

---

## 第一步：明确用户意图

### 1.1 先识别输入模式（**必做、最早做**）

| 输入模式 | 触发信号 | 后续怎么走 |
|---------|---------|-----------|
| **单源** | 1 份材料（链接 / 文件 / 文本） | 直接走主表 |
| **多源融合** | N（≥2）份资料 **+ 一个内容框架/大纲** | 先看 §1.3，再走主表 |

**判断要点**：关键不是「资料多」，而是**「资料多 + 用户给了一个框架」**。只发几个相关链接没框架 → 按单源处理。

不确定时主动问：「你是想直接从这一份做演示，还是把这几份按你给的框架先合一份再做？」

### 1.2 主表

**对用户说话用语**：用「视觉风格 / 主题 / PDF / 网页版 / 视频 / 飞书链接 / 本地文件 / 网页」；**避免**说 `design_mode` / `format` / `source` / `step` 等实现层名词（除非用户主动看日志）。

| # | 问什么 | 写入 JSON |
|---|--------|-----------|
| 1 | 内容从哪来？ | `source`：飞书 URL / 本地 `.md`/`.txt`/`.docx`/`.pdf` / 网页 URL |
| 2 | 要哪些交付物？ | `format`：`pdf` / `html` / `video`，可数组。**默认建议 `pdf` 或 `html`**（主场景）；`video` 可选，耗时长且要 FFmpeg+TTS，页内动效不会进成片（录制动效帧未排期） |
| 3 | 输出去哪？ | `output_dir`（默认 `./output`）；`channel`：`local`（默认）/ `feishu` |
| 4 | 视觉主题？ | 用人话介绍 13 套（深色 7 / 浅色 6，id 见 [README](README.md) 主题节）；用户说「自动」时 JSON 省略 `design_mode` |
| 5 | 页内动效 | **不主动问**；用默认（开 + stagger）；用户明说才改 |

### 1.3 多源融合补充（仅当 §1.1 识别为多源融合）

跟用户额外确认两件事：

1. **内容框架在哪**：以**用户给的框架**为骨架（大纲 / 章节列表 / 模板 PPT 截图）。隐晦的话主动复述让对方确认。
2. **N 份资料的角色**：是「主稿 + 数据补充」还是「N 份地位平等的素材」？决定后续融合时的取舍优先级。

**主表填法**：`source` 只填主资料路径（其余 N-1 份记在工作记忆里，第三步 extract 各跑一次）；其他字段与单源完全一致。

第三步会做 N 次 extract；第四步在你脑里按框架对齐 N 份资料 → 直接产出 scenes.json，**与单源情况无差别**。**不需要**专门的策展 step 或中间稿 markdown。

---

## 第二步：检查依赖（按本次 format / source / channel 收窄）

**本 Skill 不需要任何 LLM 凭证**。只在用到对应链路时才需要：

| 条件 | 需要什么 |
|------|----------|
| 任何场景 | `node -v` 可用；项目根已 `npm install` |
| `source` 是飞书 URL | `.env` 里 `FEISHU_APP_ID` / `FEISHU_APP_SECRET` |
| `format` 含 `video` | `ffmpeg` / `ffprobe`；TTS：`edge-tts`（`pip install edge-tts`）或 macOS `say` |
| `format` 含 `pdf` 或 `html` | Puppeteer 能启动浏览器（随依赖安装） |
| `channel` 为 `feishu` | `lark-cli` + 飞书凭证 + `doc_title` / `folder_token`；**附件**：`presentation.mp4` 与/或 `presentation.pdf`（至少其一，`format` 含 `video` / `pdf` 或手传路径） |

**典型报错落点**：`extract` 飞书源失败 → 飞书凭证；`screenshot` 浏览器启动失败 → Puppeteer Chrome；`tts` 找不到 → `edge-tts` / `say`；`package` video → `ffmpeg`；`deliver feishu` → `lark-cli` + 凭证；飞书交付缺附件 → `format` 至少含 `pdf` 或 `video`（或显式 `pdf_path` / `video_path`）。

---

## 第三步：（可选）extract 把素材抽到本地

**何时跑**：飞书 / 网页 / 你还没读过的本地长文件。
**何时跳过**：用户已贴全文 / 简短 markdown 你已读过。

```bash
echo '{"command":"extract","source":"<URL或路径>","output_dir":"./project"}' | node executor.js
```

产物：`./project/raw_content.txt`（纯文本，你接着 read 它）+ `source_meta.json`。

**多源融合时**：每份资料各跑一次，传不同 `output_dir`（如 `./project/src1`、`./project/src2`）避免互相覆盖。融合在第四步你脑里完成，不需要落中间 markdown。

---

## 第四步：你写 scenes.json（核心）

**完整 schema、22 个变体的字段表与最小示例见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**。本节只列原则。

### 先字段、后变体（四步 · 必读）

1. **定本页数据结构** — 对照 [SCENES_SCHEMA §0.2a](docs/SCENES_SCHEMA.md#02a-字段--变体优先于决策树)：有 `stats[]` 就准备 `stats_grid`，有 `big_number` 就准备 `number`，有左右对照列就准备 `compare`……**不要先写 `panel` 再往里面硬塞数字**。
2. **写 `content_variant` + 必填字段** — 专用字段齐全时优先 **`"content_variant":"auto"`**（§0.2c）；仅当本页**只有** `key_points[]` 时显式 `panel`；呼吸页用 `text` + `composition:"title-only"`。
3. **主题 + 主视觉** — 选 `design_mode` 前扫 [refs/STYLE_PRESETS.md](refs/STYLE_PRESETS.md) 气质表；全 deck **至多 1～2 页** `composition:"split-visual"` + `diagram` / `hero_image` / `brand_mark`（§0.9；用户无图时优先 `diagram` + SVG，见 §主视觉补图）。
4. **`validate` 自检** — 探索阶段普通 `validate`；**定稿前**加 `"strict": true`（见 [SCENES_SCHEMA §0.10](docs/SCENES_SCHEMA.md#010-agent-品质清单写完后自检--v425)）。再 `render`。

**金标抄作业**（字段 + 节奏已对齐）：`examples/golden/business_swiss_scenes.json`（商务 7 页）、`product_launch_scenes.json`（发布 8 页）、`editorial_notes_scenes.json`（编辑 9 页）。

### 决策清单

1. **页数**：短文（≤800 字）5–7 页 / 中（800–3000）7–10 / 长（>3000）10–14
2. **首页必须 `type:"cover"`**；末页通常 `type:"summary"`
3. **变体**：按 §0.2a 字段表选；决策树见 SCENES_SCHEMA §0.2b / §3
4. **不要连续两页同变体**——会被 validate 报 warning
5. **`script` 字段可选**：只在 `format` 含 `video` 时必填，zh 150–200 字 / en 50–80 词
6. **`recommended_design_mode` 可选**：写在 `<output_dir>/project.json` 里；不写则交 `design` 命令兜底

### `nav_bar` 章节页（易错 · 必读）

**用途**：全 deck **章节过渡 / 目录锚点**（顶栏显示各章名 + 当前章高亮），**不是**要点列表页、也不是卡片矩阵页。

| 区域 | 填什么 | 常见误用 |
|------|--------|----------|
| 顶栏 `nav_items` | 3–6 个**短章节名**（建议 ≤12 字，可带 emoji） | 把四条正文要点只写进 `nav_items` → 中间大块空白 |
| 标题下正文 | **`subtitle`**（1–2 句）**或** `key_points`（2–4 条摘要）**至少其一** | 只有 `title` + `nav_items` |
| `nav_active` | 当前章在 `nav_items` 中的下标（0 起） | 省略导致高亮错位 |
| `visual_weight:"breathing"` | 可与「短标题 + 短副文」同用 | 不能代替 `subtitle` / `key_points` |

**何时改用别的变体**：若本页要展示 3–4 个并列概念（带说明）→ `card_grid` 或 `icon_grid`；若是一串流程 → `timeline` / `process_flow`。

```json
{
  "type": "content",
  "content_variant": "nav_bar",
  "title": "今日看点",
  "subtitle": "语音界面 · Agent · 专家差距 · 月报素材四条线",
  "nav_items": ["ElevenLabs", "GPT Agent", "专家 vs 新手", "CEO 月报"],
  "nav_active": 0,
  "section_label": "SECTION 02 · 10",
  "progress_pct": 20
}
```

无 `subtitle` 时可写 `key_points`（渲染为标题下要点列表）。

**渲染兜底（v4.2+）**：若仅有 `title` + `nav_items`、无 `subtitle`/`key_points`，`html` 会用 `nav_items` 自动生成标题下摘要列表（顶栏仍显示完整 `nav_items`）。`validate` 会报 **`QUALITY_NAV_BAR_LEDE_INFERRED`**（建议仍显式写 `subtitle`）；若连 `nav_items` 都没有则 **`QUALITY_NAV_BAR_NO_LEDE`**。均不阻塞 render。

### 品质清单（要「作品感」时必做）

完整字段表见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) **§0.7–§0.8**。写完后 `validate` 会额外给出 `quality_warnings[]`（**不阻塞** render，但应优先处理）。

| 原则 | 怎么做 |
|------|--------|
| **节奏** | 全 deck 至少 3 种页型能量：冲击（`visual_weight:"hero"` + `number` / `compare` / `quote`）· 信息（`panel` / `stats_grid`）· 呼吸（`breathing` + `composition:"title-only"`） |
| **少堆 panel** | 不要连续 ≥3 页 `panel`；长 deck 至少 1 页高能变体（`number` / `quote` / `compare` / `stats_grid` / `process_flow` 等） |
| **标题** | content 页 `title` 建议 ≤48 字；细节放进 `key_points` / `body` |
| **收尾** | `summary` 用 2–4 条短 CTA（`key_points`）；可加 `visual_weight:"breathing"`（`design` 会为 summary 选 `layout_hint: cards`） |
| **封面** | `cover` 可加 `visual_weight:"hero"` |
| **示范** | `examples/golden/*.json`（7 套：product_launch / business_report / **business_swiss** / humanities / editorial_notes / variant_showcase / **tech_variants**） |
| **主视觉（Q1）** | 至多 1～2 页 `panel` + `split-visual` + `diagram` 或 `hero_image`；见 §主视觉补图、SCENES_SCHEMA §0.9 |

```json
{
  "type": "content",
  "content_variant": "number",
  "visual_weight": "hero",
  "composition": "stat-hero",
  "eyebrow": "北极星",
  "title": "上线首周",
  "big_number": "3.2×",
  "body": "一句解释指标含义"
}
```

### 自检

```bash
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js

# 定稿前严格模式（品质 warning → error）：
echo '{"command":"validate","scenes":"./project/scenes.json","strict":true}' | node executor.js

# 人类开发者的快捷方式（与上面等价，少打字）：
npm run check -- ./project/scenes.json
npm run check:strict -- ./project/scenes.json
```

输出 `valid: true|false` + `errors[]` + `warnings[]` + `quality_warnings[]`，每条可带 `hint`。**`valid: false` 时按 `errors[]` 修订**；`quality_warnings` 用于抬品质（**`QUALITY_VARIANT_MISMATCH`**、panel 堆砌、缺高能页等），建议改完再 render。`strict:true` 时上述品质项会进入 `errors[]`。`validate` 永远 exit 0，结果在 JSON 字段里。

**排版默认**：`design` 默认开启内容感知字号（`typography_scale:"adapt"`）；若需旧行为，JSON 传 `"typography_scale":"static"`。

开发/发版前可跑：`npm run check:golden`（金标 validate + 渲染 + HTML 回归）。

> 多源融合的处理已在 §1.3 与第三步说明；本步骤对单/多源**无差别**。

---

## 第五步：render

```bash
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["html"],"design_mode":"deep-tech-keynote"}' | node executor.js
```

| 字段 | 说明 |
|------|------|
| `command` | `"render"`（或别名 `"all"`） |
| `scenes` | scenes.json 路径，**必填** |
| `output_dir` | 默认 `./output` |
| `format` | `"html"` / `"pdf"` / `"video"` 或数组 |
| `design_mode` | 可省略；用户明确选过就填 |
| `channel` | `"local"`（默认）/ `"feishu"`（须配套 `doc_title` / `folder_token`） |
| `page_animations` / `page_animation_preset` | 默认开 + stagger，一般无需写 |

`render` 会依次跑：**design → html → screenshot → tts（仅 video）→ package → deliver**。

**单步补跑 / 单独调用某个命令**：所有命令同等可单独调用，字段契约见 `_meta.json`。常见场景见下节。

---

## 意图变更 — 最小重跑

多数情况下直接重跑 `render` 最简单。少数细粒度场景：

- **只换主题**：`design`（新 `design_mode`）→ `html` → `screenshot` → `package`
- **只改某页文案**：改 `scenes.json` → `validate` → `html` → `screenshot` → `package`
- **加/换口播稿**：补 `script` 字段 → `tts` → `package`（`format` 含 `video`）
- **只重出 PDF / HTML**：已有 `screenshots/` + `html_dir/`，跑 `package`
- **换源文档**：新 `output_dir`，从第三步重新走
- **多主题快速看版**（不跑全 deck）：`{"command":"preview","scenes":"./project/scenes.json","output_dir":"./project/preview"}` → 打开 `preview.html`；选定主题后写 `recommended_design_mode` 或传 `design_mode` 再 `render`
- **HTML 静态点评**：`{"command":"critique","html_dir":"./project","scenes":"./project/scenes.json"}` → `critique.json` + `critique_report.md`（进程 exit 0）
- **用户补图（第二轮）**：更新 `scenes.json` 资产路径 → `html` →（`screenshot` →）`package`；见 §主视觉补图

---

### 主视觉补图（用户素材无图时 · 必读）

用户输入**多半只有文字**；主视觉是**可选品质层**，不是每页必填。

| 策略 | 何时用 | scenes 写法 |
|------|--------|-------------|
| **不强行要图** | 默认多数页 | 不用 `split-visual`；或 `diagram` 指向仓库/自产 SVG（`examples/assets/*.svg`） |
| **预留补图位** | 产品 demo / 封面级截图 | `composition:"split-visual"` + `hero_image` 或 `diagram`；路径可先写 `assets/xxx.png` |
| **等用户供图** | 首轮先交付 PDF/HTML | 占位渲染 + 交付后主动列出补图页 |

**写稿**：路径相对 **`scenes.json` 所在目录**（推荐 `project/assets/`）。支持 `https://` URL。缺文件时引擎用 **SVG 占位**（不挡 render）；`validate` → `QUALITY_VISUAL_ASSET_MISSING`；`critique` → `CRIT_PLACEHOLDER_IMAGE`。

**首轮 render 后（Agent 必做）**：

1. 跑 `critique`（带 `scenes` 路径）→ 读 `visual_slots_report.json`（有缺口时生成）或 `critique_report.md` 末尾 **Visual slots** 表。
2. 若 `gaps_for_user` 非空，**用人话告诉用户**哪几页可补图、建议文件名、放哪条路径。
3. 用户供图后：落盘 → 改 `scenes[i].hero_image` / `diagram` → `validate` → **`html`** → 若需 PDF 再 `screenshot` → `package`（不必整份重讲稿）。

```bash
echo '{"command":"critique","html_dir":"./project","scenes":"./project/scenes.json"}' | node executor.js
# → project/visual_slots_report.json（有待补位时）
# → project/critique_report.md（含补图表）

# 用户供图后（示例）
echo '{"command":"html","scenes":"./project/scenes.json","design_params":"./project/design_params.json","output_dir":"./project"}' | node executor.js
echo '{"command":"package","scenes":"./project/scenes.json","screenshots_dir":"./project/screenshots","html_dir":"./project","output_dir":"./project","format":["pdf","html"]}' | node executor.js
```

**对用户话术模板**（按需改页码/标题）：

> 初版已生成。第 **6** 页「现场演示」留了主视觉位（目前是占位网格）。若你有产品截图，请放到 `project/assets/demo-ui.png`，告诉我一声我会重出 PDF；也可直接把图发在对话里由我写入工程。

字段说明见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) §0.9。

---

## 交付提醒（HTML 必读）

- `presentation.html` 是 **iframe 壳**，**不能**单文件分发；必须带上同目录所有 `page_*.html`（建议整个 `output_dir` 打包）
- **单文件分享**请用 `presentation_static.html`（内嵌图）或导出的 PDF
- 本地预览壳页：`npm run preview:html -- <output_dir>`；**勿**直接 `file://` 打开

跑完后用人话告诉用户：交付目录、含哪些文件、HTML 必须整目录一起发、单文件分享用 static 或 PDF。**若 `visual_slots_report.json` 有 `gaps_for_user`**，同一轮回复里附上补图指引（见 §主视觉补图）。
