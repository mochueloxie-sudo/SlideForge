# `_core` — Q1 布局语法（设计系统）

> **状态**：Q1-D + **wave6**（2026-05）深度 8 页 DOM 抛光（首项强调、呼吸页左条、compare/process 层级）。全部 **13** 个 `design_mode` 在缺主题内同名文件时回退 **`layouts/*.html`**；有 `samples/themes/{id}/tokens.css` 的用文件，否则 **`utils/depth_tokens_from_tpl.js`** 从 `DESIGN_TEMPLATES` 生成完整 `--sf-*`。

## 目录


| 路径                             | 用途                                           |
| ------------------------------ | -------------------------------------------- |
| [TOKENS.md](./TOKENS.md)       | **Token 契约**（必填键、页面背景、组件语义色）                 |
| `../themes/{theme}/tokens.css` | 主题色板 CSS 变量（`--sf-accent` 等）                 |
| `inject/visual-slot.css`       | 主视觉槽（`hero_image`）通用样式，由 `html_generator` 注入 |
| `layouts/`                     | 全主题共享 **8** 个深度页：`cover`、`01_text_only`、`02_panel`、`03_stats_grid`、`04_number`、`05_quote`、`20_compare`、`21_process_flow`。`loadTemplateWithSource`：**主题目录** → **`_core/layouts`** → **`shared/`** |


完整键表见 [TOKENS.md](./TOKENS.md)。样张可逐步从 `{{BODY_BG}}` 迁移到 `var(--sf-page-bg-*)` / `var(--sf-body-bg)`；生成器仍填充 legacy token 以兼容旧模板。

## 维护

1. 改深度布局 → 编辑 **`layouts/*.html`**，跑 `npm run check:golden`（`npm run sync:depth-themes` 现为 **no-op**，保留脚本入口）
2. 改 `tokens.css` → 三套金标 `npm run check:golden`
3. 见 [docs/ROADMAP_OUTPUT_QUALITY.md](../../docs/ROADMAP_OUTPUT_QUALITY.md) Q1 节

