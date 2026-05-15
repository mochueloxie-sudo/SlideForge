# SlideForge

> **Agent-first** 演示生成 Skill — 宿主 Agent（Cursor / Claude Code / OpenClaw 等）自己读源材料、写 `scenes.json`，本 Skill 把它渲染成可上台讲的 **1920×1080** 演示（**video** / **pdf** / **html**，可多选），附大纲与逐字稿。**不依赖任何外部 LLM**。

[English](README_en.md) · [SKILL.md](SKILL.md) · [SCENES_SCHEMA](docs/SCENES_SCHEMA.md) · [CLAUDE.md](CLAUDE.md) · [CHANGELOG](CHANGELOG.md) · [License: MIT](LICENSE)

**[查看示例输出 →](examples/demo-output/)** 在浏览器打开 `presentation.html`（iframe 壳 + 同目录 `page_*.html`，支持 hover / 入场动画；**勿只拷贝单个 HTML**）；纯截图单文件轮播见 `presentation_static.html`。

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

# 3. 自检
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js

# 4. 一把渲染（design → html → screenshot → tts → package → deliver）
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["html"],"design_mode":"deep-tech-keynote"}' | node executor.js

open ./project/presentation.html
```

更多命令、字段、排错见 **[SKILL.md](SKILL.md)**；`scenes.json` schema 见 **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**。

---

## 文档分工

| 读者 | 文件 | 作用 |
|------|------|------|
| 宿主 Agent | [SKILL.md](SKILL.md) | 5 步工作流、命令、排错、交付提醒 |
| Agent 写 scenes 时 | [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) | 22 变体的字段表 + 决策树 + 最小示例 |
| 贡献者 | [CLAUDE.md](CLAUDE.md) | 架构、样张、token、Roadmap、调试 |
| 升级用户 | [CHANGELOG.md](CHANGELOG.md) | 版本变化历史 |

---

## 功能特性

- **13 设计主题** × **22 内容变体**：完全由样张驱动，换主题不换 HTML 结构
- **3 输入源** / **3 输出格式**：飞书 / 本地（`.md`/`.txt`/`.docx`/`.pdf`）/ 网页 → MP4 / PDF / 交互 HTML
- **页内动效**：CSS 入场（`page_animation_preset`: `none` / `fade` / `stagger`）
- **9 个独立命令**：`extract` / `validate` / `design` / `html` / `screenshot` / `tts` / `package` / `deliver` / `render`，任意中间产物可单独重跑
- **大纲 + 逐字稿** + **本地 schema 校验**

---

## 设计主题

13 套成品主题，**深色 7** + **浅色 6**，每套都是独立整包视觉系统（字体 / 色板 / 面板 / 装饰 / 动画在 `samples/{theme}/` 中一次性定稿）。

| 色系 | 主题 id | 适用场景 |
|------|---------|---------|
| 深 | `electric-studio` | 通用兜底 |
| 深 | `bold-signal` | 商业 / 品牌 / 营销 |
| 深 | `creative-voltage` | 创意 / 设计 |
| 深 | `dark-botanical` | 人文 / 教育 / 社科 |
| 深 | `neon-cyber` | 科幻 / AI / 游戏 |
| 深 | `terminal-green` | 技术文档 / API |
| 深 | `deep-tech-keynote` | 技术演讲 |
| 浅 | `swiss-modern` | 极简 / 瑞士风 |
| 浅 | `paper-ink` | 编辑 / 出版 |
| 浅 | `vintage-editorial` | 复古 / 文艺 |
| 浅 | `notebook-tabs` | 笔记 / 手账 |
| 浅 | `pastel-geometry` | 轻快 / 活泼 |
| 浅 | `split-pastel` | 温柔 / 女性化 |

JSON 里 `design_mode` 锁定其一；省略则由 `design` 命令按内容关键词自动匹配。优先级：**当次 JSON > `project.json` 的 `recommended_design_mode` > 内容规则兜底**。

---

## 样式变体

22 种内置版式，覆盖叙事 / 数据 / 流程 / 对照 / 架构 / 卡片等常见演示需求。每种都接通了全部 13 主题。完整字段表、最小示例、决策树见 **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**。

---

## 流程图

```
源材料 ── (可选) extract ──▶ 你（Agent）写 scenes.json ──▶ validate ──▶
  design ──▶ html ──▶ screenshot ──▶ (可选) tts ──▶ package ──▶ deliver
```

每步读写磁盘 JSON / HTML / PNG 文件，任意命令可单独再跑。

---

## 环境要求

| 依赖 | 何时需要 | 安装 |
|------|---------|------|
| **Node.js ≥ 18** | 任何场景 | [nodejs.org](https://nodejs.org/) |
| **Google Chrome / Puppeteer 自带** | 截图 + PDF（screenshot / package） | 通常已预装 |
| `edge-tts` | 仅 video | `pip install edge-tts`（或用 macOS `say`） |
| `ffmpeg` | 仅 video | `brew install ffmpeg` |
| `lark-cli` + 飞书凭证 | 飞书源 / `channel:"feishu"` | `npm i -g @larksuite/cli` + `.env` 配 `FEISHU_*` |

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
npm run test:e2e
```

完整开发指南、调试技巧、Roadmap 见 **[CLAUDE.md](CLAUDE.md)**。

---

## 许可证

[MIT](LICENSE)
