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

### 决策清单

1. **页数**：短文（≤800 字）5–7 页 / 中（800–3000）7–10 / 长（>3000）10–14
2. **首页必须 `type:"cover"`**；末页通常 `type:"summary"`
3. **每页选最贴合叙事的 `content_variant`**（决策树见 SCENES_SCHEMA §3）
4. **不要连续两页同变体**——会被 validate 报 warning
5. **`script` 字段可选**：只在 `format` 含 `video` 时必填，zh 150–200 字 / en 50–80 词
6. **`recommended_design_mode` 可选**：写在 `<output_dir>/project.json` 里；不写则交 `design` 命令兜底

### 品质清单（要「作品感」时必做）

完整字段表见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) **§0.7–§0.8**。写完后 `validate` 会额外给出 `quality_warnings[]`（**不阻塞** render，但应优先处理）。

| 原则 | 怎么做 |
|------|--------|
| **节奏** | 全 deck 至少 3 种页型能量：冲击（`visual_weight:"hero"` + `number` / `compare` / `quote`）· 信息（`panel` / `stats_grid`）· 呼吸（`breathing` + `composition:"title-only"`） |
| **少堆 panel** | 不要连续 ≥3 页 `panel`；长 deck 至少 1 页高能变体（`number` / `quote` / `compare` / `stats_grid` / `process_flow` 等） |
| **标题** | content 页 `title` 建议 ≤48 字；细节放进 `key_points` / `body` |
| **收尾** | `summary` 用 2–4 条短 CTA（`key_points`）；可加 `visual_weight:"breathing"`（`design` 会为 summary 选 `layout_hint: cards`） |
| **封面** | `cover` 可加 `visual_weight:"hero"` |
| **示范** | 可参考 `examples/golden/*.json`（产品 / 商业 / 人文三套金标） |
| **主视觉（Q1）** | `panel` + `composition:"split-visual"` + `hero_image`（相对路径或 URL）；见 SCENES_SCHEMA §0.9 |

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

# 人类开发者的快捷方式（与上面等价，少打字）：
npm run check -- ./project/scenes.json
```

输出 `valid: true|false` + `errors[]` + `warnings[]` + `quality_warnings[]`，每条可带 `hint`。**`valid: false` 时按 `errors[]` 修订**；`quality_warnings` 用于抬品质（panel 堆砌、缺高能页、标题过长等），建议改完再 render。`validate` 永远 exit 0，结果在 JSON 字段里。

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

---

## 交付提醒（HTML 必读）

- `presentation.html` 是 **iframe 壳**，**不能**单文件分发；必须带上同目录所有 `page_*.html`（建议整个 `output_dir` 打包）
- **单文件分享**请用 `presentation_static.html`（内嵌图）或导出的 PDF
- 本地预览壳页：`npm run preview:html -- <output_dir>`；**勿**直接 `file://` 打开

跑完后用人话告诉用户：交付目录、含哪些文件、HTML 必须整目录一起发、单文件分享用 static 或 PDF。
