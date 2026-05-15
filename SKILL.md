---
name: "slide-forge"
description: "Agent-first 演示生成 Skill：你（宿主 Agent）自己读源材料、按 docs/SCENES_SCHEMA.md 写 scenes.json，本 Skill 把它渲染为 1920×1080 演示（HTML / PDF / video，可多选），13 套主题与 22+ 变体由样张驱动。本 Skill 不依赖任何外部 LLM——scenes 与 script 全由你产出。可选工具：extract（把飞书/网页/本地文件抽成 raw_content.txt 给你阅读）、validate（本地 schema 自检）。适用：你接到「把这堆材料做成 PPT」的任务，并能在用户本机执行 `node executor.js`。"
---

# SlideForge — Agent-first Skill

你（宿主 Agent）是这条链路里的「内容大脑」。本 Skill 提供**纯工具管道**——内容理解、结构化、写口播稿全由你完成；本 Skill 只负责把你写出的 `scenes.json` 渲染为 1920×1080 演示。**不调任何外部 LLM**。

**入口**：仓库根执行 `node executor.js`，stdin 一行 JSON，或 `node executor.js /path/to/request.json`。Schema、变体、token 细节见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) 与 [CLAUDE.md](CLAUDE.md)。[^maint]

---

## 推荐工作流（5 步）

```
1. 问意图    ── 跟用户确认 source / format / channel / 主题倾向
2. extract   ── (可选) 把外部素材抽成 raw_content.txt，供你阅读
3. 写 scenes ── 你在对话内按 SCENES_SCHEMA 写 scenes.json 落盘
4. validate  ── 本地自检；valid:false 时按 errors 修订
5. render    ── 一把跑完 design → deliver，产出 HTML / PDF / video
```

---

## 第一步：明确用户意图

逐项问清或根据上下文推断，用一句人话向用户复述后再执行。

### 先识别输入模式（**必做、最早做**）

用户的「内容供给方式」是**整个工作流最早的分叉点**。在问任何字段前先识别：


| 输入模式     | 触发信号                                       | 后续怎么走               |
| -------- | ------------------------------------------ | ------------------- |
| **单源**   | 用户给 1 份材料（一个链接 / 一个文件 / 一段文本）              | 直接走下方主表             |
| **多源融合** | 用户**同时**给 N（≥2）份资料 **+ 一个内容框架/大纲**，要求按框架整合 | 先看下方「多源融合补充」小节，再走主表 |


**判断要点**：多源融合的关键不是「资料多」，而是**「资料多 + 用户给了一个框架」**。如果用户只是连发几个相关链接、没有框架，按单源处理（你自行裁剪取舍即可）；如果用户明确说「按这个大纲，从这几篇里取材」，就是多源融合。

不确定时**主动问一句**：「你是想直接从这一份做演示，还是把这几份按你给的框架先合一份再做？」

### 主表

**对用户说话用语**

- 用「视觉风格 / 主题」，不要说 `design_mode`
- 用「PDF / 网页版 / 视频」，不要说 `format`
- 用「飞书链接 / 本地文件 / 网页」，不要说 `source`
- 实现层（`scenes.json` / `design`）只在用户主动要看日志时才提

**要落地的事实**


| 序号  | 问题      | 写入 JSON                                                                                       |
| --- | ------- | --------------------------------------------------------------------------------------------- |
| 1   | 内容从哪来？  | `source`：飞书 URL / 本地 `.md`/`.txt`/`.docx`/`.pdf` / 网页 URL（多源融合时见下方补充）                         |
| 2   | 要哪些交付物？ | `format`：`pdf` / `html` / `video`，可单选可数组。**默认建议先 `html`**，video 耗时且要 FFmpeg+TTS               |
| 3   | 输出去哪？   | `output_dir`（默认 `./output`）；`channel`：`local`（默认）/ `feishu`                                   |
| 4   | 视觉风格？   | 用人话介绍 13 套（见下表）；用户说「自动」时 JSON 省略 `design_mode`，由你（Agent）在写 `project.json` 时挑、或交给 `design` 内容推断兜底 |
| 5   | 页内动效    | **不主动问**；用默认（开 + stagger）；用户明说才改                                                              |


**13 套主题（用户选哪套你就把 id 填进 JSON）**


| 色系  | id                  | 气质           |
| --- | ------------------- | ------------ |
| 深   | `electric-studio`   | 通用兜底，深蓝黑     |
| 深   | `bold-signal`       | 商业 / 品牌      |
| 深   | `creative-voltage`  | 创意 / 设计      |
| 深   | `dark-botanical`    | 人文 / 教育      |
| 深   | `neon-cyber`        | 科幻 / 数字 / AI |
| 深   | `terminal-green`    | 技术 / 代码      |
| 深   | `deep-tech-keynote` | 深度技术演讲       |
| 浅   | `swiss-modern`      | 极简瑞士         |
| 浅   | `paper-ink`         | 印刷 / 编辑      |
| 浅   | `vintage-editorial` | 复古文艺         |
| 浅   | `notebook-tabs`     | 笔记 / 手账      |
| 浅   | `pastel-geometry`   | 轻快活泼         |
| 浅   | `split-pastel`      | 柔和温柔         |


### 多源融合补充（**仅当上面识别为「多源融合」时**）

跟用户额外确认两件事：

1. **内容框架在哪**：以**用户给的框架**为骨架（一段大纲 / 一个章节列表 / 一份模板 PPT 截图）。如果用户只是隐晦地提了几条要点，主动复述一遍让对方确认。
2. **N 份资料分别是什么角色**：是「主稿 + 数据补充」，还是「N 份地位平等的素材」？这决定了你后续融合时的取舍优先级。

**主表怎么填**

- `source` 字段：**只填主资料路径**（或留空，多源完全在你脑里融合）；其余 N-1 份记在你的工作记忆里，第三步 extract 各自跑一次
- `output_dir`：和单源一样，一个就够（融合产物、scenes.json、最终交付都在这里）
- 其他字段（`format` / `channel` / `design_mode` / `page_animations`）与单源完全一致

**后续步骤会做的事**（提前心里有数）

- 第三步 `extract`：对每份资料各跑一次（落到 `<output_dir>/raw_<n>.txt` 或独立子目录）
- 第四步写 `scenes.json`：先**在你脑里**按用户框架对齐 N 份资料 → 再产出 scenes.json，与单源情况下的产出**结构无差别**
- **不需要**专门的「策展 step」或「中间稿 markdown」（除非用户要求复审融合结果）

---

## 第二步：检查依赖（按本次 format / source / channel 收窄）

**本 Skill 不需要任何 LLM 凭证**。只在用到对应链路时才需要：


| 条件                        | 需要什么                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| 任何场景                      | `node -v` 可用；项目根已 `npm install`                                          |
| `source` 是飞书 URL          | `.env` 里 `FEISHU_APP_ID` / `FEISHU_APP_SECRET`（见 `.env.example`）         |
| `format` 含 `video`        | `ffmpeg` / `ffprobe`；TTS：`edge-tts`（`pip install edge-tts`）或 macOS `say` |
| `format` 含 `pdf` 或 `html` | Puppeteer 能启动浏览器（随依赖安装）                                                  |
| `channel` 为 `feishu`      | `lark-cli` + 飞书凭证 + JSON 里的 `doc_title` / `folder_token`                 |


**典型报错落点**


| 现象                 | 优先查                                              |
| ------------------ | ------------------------------------------------ |
| `extract` 飞书源失败       | 飞书凭证、应用权限 `docx:document`                        |
| `screenshot` 启动浏览器失败 | Puppeteer 的 Chrome 是否就绪、沙箱权限                     |
| `tts` 找不到 TTS          | `edge-tts` / `python3 -m edge_tts` / macOS `say` |
| `package` video 报缺工具  | `ffmpeg` / `ffprobe`                             |
| `deliver feishu` 失败    | `lark-cli`、飞书凭证、`doc_title` / `folder_token`     |


---

## 第三步：（可选）extract 把素材抽到本地

**何时跑**：用户给的是飞书 / 网页 / 你还没读过的本地文件，且内容较长。
**何时跳过**：用户已把全文贴在对话里，或源是简短 markdown 你已读过。

```bash
echo '{"command":"extract","source":"<URL或路径>","output_dir":"./project"}' | node executor.js
```

产物：

- `./project/raw_content.txt` — 抽出的纯文本（你接着 read 它）
- `./project/source_meta.json` — `{ source, source_type, title, char_count, ... }`

**多源融合时**：对每份资料各跑一次 `extract`；为避免互相覆盖，每次传不同的 `output_dir`（如 `./project/src1`、`./project/src2`），或跑完立即把 `raw_content.txt` 改名为 `raw_<n>.txt` 收到主目录。融合工作在第四步你脑里完成，不需要落中间 markdown。

---

## 第四步：你写 scenes.json（核心）

**完整 schema 见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**。本节是速查与原则。

### 决策清单

1. **页数**：短文（≤800 字）5–7 页 / 中（800–3000）7–10 / 长（>3000）10–14
2. **首页必须 `type:"cover"`**；末页通常 `type:"summary"`
3. **每页选最贴合叙事意图的 `content_variant`**（22 种，决策树见 SCENES_SCHEMA §3）
4. **不要连续两页同变体**——会被 validate 报 warning
5. `**script`（口播稿）字段可选**：只在 `format` 含 `video` 时必填，zh 150–200 字 / en 50–80 词
6. `**recommended_design_mode` 可选**：写在 `project.json` 里；不写则交 `design` 内容推断兜底

### 22 个变体一句话速查

```
panel / card_grid / icon_grid       — 列举要点
stats_grid / number / panel_stat    — 数字主导
timeline / process_flow / funnel    — 时序 / 流程 / 漏斗
architecture_stack                  — 系统分层
two_col / text / text_icons         — 散文 + 旁注
quote / quote_context               — 引用
compare                             — A vs B 对照
table / chart                       — 结构化数据 / 趋势
nav_bar                             — 章节封面
code                                — 代码片段
number_bullets / quote_context …    — 混合变体（详见 SCENES_SCHEMA）
```

### 落盘

把 JSON 写到 `<output_dir>/scenes.json`。需要锁定主题时，再写 `<output_dir>/project.json`：

```json
{
  "title": "演示标题",
  "language": "zh",
  "recommended_design_mode": "deep-tech-keynote"
}
```

### 自检

```bash
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js
```

输出含 `valid: true|false`、`errors[]`、`warnings[]`。`**valid: false` 时按 `errors[]` 修订 scenes.json，再跑一次**，直到通过。

> 多源融合的处理已在「第一步 → 多源融合补充」与「第三步 extract」中说明；本步骤对单/多源**没有差别**——你拿到融合后的内容素材后，按 SCENES_SCHEMA 写 scenes.json 即可。

---

## 第五步：render

把 `scenes.json` 一把渲染为最终交付。

```bash
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["html"],"design_mode":"deep-tech-keynote"}' | node executor.js
```

**字段速查**


| 字段                                          | 说明                                                          |
| ------------------------------------------- | ----------------------------------------------------------- |
| `command`                                   | `"render"`（或别名 `"all"`）                                     |
| `scenes`                                    | scenes.json 路径，**必填**                                       |
| `output_dir`                                | 默认 `./output`                                               |
| `format`                                    | `"html"` / `"pdf"` / `"video"` 或数组                          |
| `design_mode`                               | 可省略；用户明确选过就填                                                |
| `channel`                                   | `"local"`（默认）/ `"feishu"`（须配套 `doc_title` / `folder_token`） |
| `page_animations` / `page_animation_preset` | 默认开 + stagger，一般无需写                                         |


`render` 会依次跑：**design 设计参数 → html 渲染 → screenshot 截图 → tts 配音（仅 format 含 video）→ package 打包格式 → deliver 交付渠道**。

### 单步补跑

任何中间产物都可以单独再跑：

```bash
P=./project
# 仅换主题 / 微调字段
echo '{"command":"design","scenes":"'"$P"'/scenes.json","output_dir":"'"$P"'","design_mode":"neon-cyber"}' | node executor.js
echo '{"command":"html","scenes":"'"$P"'/scenes.json","design_params":"'"$P"'/design_params.json","output_dir":"'"$P"'"}' | node executor.js
echo '{"command":"screenshot","html_dir":"'"$P"'","output_dir":"'"$P"'/screenshots","design_params":"'"$P"'/design_params.json"}' | node executor.js
# 仅重出 PDF / HTML（已有截图）
echo '{"command":"package","scenes":"'"$P"'/scenes.json","screenshots_dir":"'"$P"'/screenshots","html_dir":"'"$P"'","output_dir":"'"$P"'","format":["pdf","html"]}' | node executor.js
```

---

## 交付提醒（HTML 必读）

- `presentation.html` 是 **iframe 壳**，**不能**单文件分发；要带上同目录所有 `page_*.html`（建议整个 `output_dir` 打包）
- 单文件分享请用 `presentation_static.html`（内嵌图）或导出的 PDF
- 本地预览壳页：仓库根执行 `npm run preview:html -- <output_dir>`，**勿**直接 `file://` 打开壳页

跑完后用人话告诉用户：

> 生成结果在「……」，含 `outline.md`、`script.md` 与你选的格式产物。HTML 须连同 `page_*.html` **整目录** 一起发；想单文件分享请用 `presentation_static.html` 或 PDF。

---

## 意图变更 — 最小重跑


| 用户目标           | 做法                                                                       |
| -------------- | ------------------------------------------------------------------------ |
| 只换主题           | `design`（带新 `design_mode`）→ `html` → `screenshot` → `package`            |
| 只改某页文案         | 你直接改 `scenes.json` → `validate` → `html` → `screenshot` → `package`     |
| 加/换口播稿         | 你给每页补 `script` 字段 → `tts` → `package`（`format` 含 `video`）                 |
| 只重出 PDF / HTML | 已有 `screenshots/` + `html_dir/`，跑 `package`                              |
| 换源文档           | 新 `output_dir`：extract（可选）→ 重写 scenes → validate → render                |


---

## `_meta.json` 维护

`_meta.json` 供宿主做输入输出 schema 发现；`description` 应与本文 YAML `description` 对齐。执行语义以 `executor.js` 与本文为准。

[^maint]: 维护约定：文首 `description` 与 `_meta.json` 的 `description` **保持同义**（措辞可有差异，但「Agent 自产 scenes.json」「不调外部 LLM」「适用场景与执行入口」三件事必须都覆盖到）。正文章节分隔请用单独一行的三星号，勿用 `---` 以免与 YAML 边界混淆。