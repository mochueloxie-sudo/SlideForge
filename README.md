# SlideForge

[![English](https://img.shields.io/badge/lang-English-blue)](README_en.md)
[![CI](https://github.com/mochueloxie-sudo/SlideForge/actions/workflows/ci.yml/badge.svg)](https://github.com/mochueloxie-sudo/SlideForge/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/mochueloxie-sudo/SlideForge?display_name=tag&color=blue&label=release)](https://github.com/mochueloxie-sudo/SlideForge/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen)](https://nodejs.org/)

> **Agent-first** 演示生成 Skill — 宿主 Agent（Cursor / Claude Code / OpenClaw 等）自己读源材料、写 `scenes.json`，本 Skill 把它渲染成 **1920×1080** 演示。**主交付形态为 PDF / HTML**（也可选 video）；附大纲与逐字稿。**不依赖任何外部 LLM**。

**v4.2 要点**：`preview` 多主题试看 · `critique` HTML 发版前检查 · 可选单页 `art-directed` 自定义 CSS；4.1 起的视觉品质（主视觉槽、排版自适应、深度样张）见 [CHANGELOG](CHANGELOG.md#420--2026-05-18--q2-双模式预览与-critique)。

[SKILL.md](SKILL.md) · [SCENES_SCHEMA](docs/SCENES_SCHEMA.md) · [CRITIQUE](docs/CRITIQUE.md) · [CLAUDE.md](CLAUDE.md) · [CHANGELOG](CHANGELOG.md)

**[查看示例输出 →](examples/demos/demo-output/)** 在浏览器打开 `presentation.html`（iframe 壳 + 同目录 `page_*.html`，支持 hover / 入场动画；**勿只拷贝单个 HTML**）；纯截图单文件轮播见 `presentation_static.html`。

---

## 快速开始

```bash
git clone https://github.com/mochueloxie-sudo/SlideForge.git && cd slide-forge
npm install
npm run demo:html-local
open ./demo_html_out/presentation.html
```

**真实工作流**（宿主 Agent 视角）：

```bash
# 1. (可选) 把外部素材抽成纯文本
echo '{"command":"extract","source":"<URL或路径>","output_dir":"./project"}' | node executor.js

# 2. Agent 自己读原文 → 按 docs/SCENES_SCHEMA.md 写 ./project/scenes.json

# 3. 自检（写稿阶段）
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js

# 3b. (可选) 试 3 个主题 — 封面 + 首内容页，不跑全 deck
echo '{"command":"preview","scenes":"./project/scenes.json","output_dir":"./project/preview"}' | node executor.js
open ./project/preview/preview.html

# 4. 一把渲染（design → html → screenshot → tts → package → deliver）
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["pdf","html"],"design_mode":"deep-tech-keynote"}' | node executor.js

# 5. (可选) HTML 发版前检查 → critique.json / critique_report.md
echo '{"command":"critique","html_dir":"./project","scenes":"./project/scenes.json"}' | node executor.js

open ./project/presentation.html
```

更多命令、字段、排错见 **[SKILL.md](SKILL.md)**；`scenes.json` schema 见 **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**；critique 规则见 **[docs/CRITIQUE.md](docs/CRITIQUE.md)**。

---

## 文档分工


| 读者               | 文件                                             | 作用                     |
| ---------------- | ---------------------------------------------- | ---------------------- |
| 宿主 Agent         | [SKILL.md](SKILL.md)                           | 5 步工作流、命令、排错、交付提醒      |
| Agent 写 scenes 时 | [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) | 22 变体的字段表 + 决策树 + 最小示例 |
| 贡献者              | [CLAUDE.md](CLAUDE.md)                         | 架构、样张、token、Roadmap、调试 |
| 升级用户             | [CHANGELOG.md](CHANGELOG.md)                   | 版本变化历史                 |


---

## 功能特性

- **13 设计主题** × **22 内容变体**：样张驱动；深度 8 页统一 `samples/_core/layouts/` + 主题 token（换主题不换结构）
- **3 输入源** / **3 输出格式**：飞书 / 本地 / 网页 → **PDF / HTML（推荐）** / MP4（可选）
- **发版前质检**：`validate`（JSON + `quality_warnings`）→ 渲染后 `critique`（HTML 静态扫描）
- **选主题**：`preview` — 自动 Top 3 主题 × 2 页切片，输出 `preview.html` 并排对比
- **主视觉与排版（可选字段）**：`hero_image` / `diagram`；`typography: "adapt"` 或 `design_params.typography_scale: "adapt"` 长标题缩字
- **单页定制**：`mode: "art-directed"` + `custom_css` / `custom_css_file`（消毒后注入）
- **页内动效**：CSS 入场（`page_animation_preset`: `none` / `fade` / `stagger`）；浏览器内可播，**video 成片仍为静态截图轮播**
- **11 个独立命令**：`extract` / `validate` / `preview` / `design` / `html` / `critique` / `screenshot` / `tts` / `package` / `deliver` / `render`（`render` 为 `all` 别名）
- **大纲 + 逐字稿** + **5 套金标回归**（`npm run check:golden`）

---

## 设计主题

14 套成品主题：**品牌** `heytea`（喜茶办公：白底 + 内置字体 + 尾页固定）+ **深色 7** + **浅色 6**。`heytea` 的封面 / 内容与其它主题共用 `_core` / `shared` 变体；仅 `summary` 为固定尾页。


| 色系  | 主题 id               | 适用场景                            |
| --- | ------------------- | ------------------------------- |
| 深   | `electric-studio`   | 通用兜底                            |
| 深   | `bold-signal`       | 商业 / 品牌 / 营销                    |
| 深   | `creative-voltage`  | 创意 / 设计                         |
| 深   | `dark-botanical`    | 人文 / 教育 / 社科                    |
| 深   | `neon-cyber`        | 科幻 / AI / 游戏                    |
| 深   | `terminal-green`    | 技术文档 / API                      |
| 深   | `deep-tech-keynote` | 技术演讲                            |
| 浅   | `swiss-modern`      | 极简 / 瑞士风                        |
| 浅   | `paper-ink`         | 编辑 / 出版（金标示例 `editorial_notes`） |
| 浅   | `vintage-editorial` | 复古 / 文艺                         |
| 浅   | `notebook-tabs`     | 笔记 / 手账                         |
| 浅   | `pastel-geometry`   | 轻快 / 活泼                         |
| 浅   | `split-pastel`      | 温柔 / 女性化                        |
| 品牌 | `heytea`            | 喜茶内部办公（内置字体 + 固定尾页；内容可用全部变体）   |


JSON 里 `design_mode` 锁定其一；省略则由 `design` 命令按内容关键词自动匹配。优先级：**当次 JSON > `project.json` 的 `recommended_design_mode` > 内容规则兜底**。

---

## 样式变体

22 种内置版式，覆盖叙事 / 数据 / 流程 / 对照 / 架构 / 卡片等常见演示需求。全部 14 主题（含 `heytea`）均接通这 22 变体。完整字段表、最小示例、决策树见 **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**。

---

## 流程图

```
源材料 ── (可选) extract ──▶ Agent 写 scenes.json ──▶ validate
       ──▶ (可选) preview 选主题 ──▶ render（design → html → … → deliver）
       ──▶ (可选) critique 检查 page_*.html
```

每步读写磁盘 JSON / HTML / PNG；任意命令可单独重跑。`critique` 在 `html` 之后、`package` 之前最有用。

---

## 环境要求


| 依赖                                    | 何时需要                                           | 安装                                              |
| ------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| **Node.js ≥ 18**（**critique 建议 20+**） | 任何场景                                           | [nodejs.org](https://nodejs.org/)               |
| **npm 依赖（含 cheerio）**                 | `critique` / `check:golden`                    | 仓库内 `npm install`                               |
| **Google Chrome / Puppeteer 自带**      | 截图 + PDF（screenshot / package）                 | 通常已预装                                           |
| `edge-tts`                            | 仅 video                                        | `pip install edge-tts`（或用 macOS `say`）          |
| `ffmpeg`                              | 仅 video                                        | `brew install ffmpeg`                           |
| `lark-cli` + 飞书凭证                     | 飞书源 / `channel:"feishu"`（文档内嵌 **mp4 和/或 pdf**） | `npm i -g @larksuite/cli` + `.env` 配 `FEISHU_`* |


**不需要**任何 LLM API 凭证。

---

## 输出结构

```
output/
├── scenes.json                  # Agent 写入
├── (project.json)               # 可选，Agent 写入
├── design_params.json           # design 命令输出
├── page_001.html ... page_N.html
├── screenshots/page_*.png       # 1920×1080
├── presentation.html            # iframe 壳 — 必须连同 page_*.html 一起分发
├── presentation_static.html     # 内嵌 PNG，单文件可分享
├── presentation.pdf
├── presentation.mp4             # format=video 时
├── critique.json / critique_report.md   # critique 命令
├── outline.md / script.md
└── MANIFEST.md                  # channel=local
```

**HTML 交付提醒**：`presentation.html` 是 iframe 壳，**必须**与同目录全部 `page_*.html` 一起打包；单文件分享请用 `presentation_static.html` 或 PDF。

---

## 自动化与工具接入

`stdin` JSON → `node executor.js` → `stdout` JSON。机器可读契约见 [_meta.json](_meta.json)；执行细节见 [SKILL.md](SKILL.md)；scenes 写法见 [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)。

- **Cursor / Claude Code / OpenClaw**：按客户端机制注册 `SKILL.md` + `docs/SCENES_SCHEMA.md`
- **脚本 / CI**：管道传入一行 JSON 或 `node executor.js ./request.json`

---

## 贡献

```bash
git checkout -b feat/my-feature
# 视觉决策放 samples/*.html（不写在 generator 里）
# 模板用 px（目标 1920×1080），token 命名 {{UPPER_CASE}}
# 新增变体须同步更新 docs/SCENES_SCHEMA.md 与 steps/validate.js
npm run check:golden   # 或 npm run test:e2e
```

完整开发指南、调试技巧、Roadmap 见 **[CLAUDE.md](CLAUDE.md)**。

---

## 许可证

[MIT](LICENSE)