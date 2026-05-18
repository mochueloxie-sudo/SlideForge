# Neon 深度路线（Q0-A depth-first）

> **策略**：先把 **neon-cyber × product_launch 金标** 做到稳定 **8/10**；深度 8 页 HTML 现由 **全主题** 共用 `samples/_core/layouts/`，换肤靠 `tokens.css`（neon/bold/dark）或 **`depth_tokens_from_tpl`**（其余主题）。  
> **验收**：`npm run golden:render` 后肉眼过 8 页；无 `readability baseline` / `density-sparse` 盖样张（`enhancement: minimal`）。

## 8/10 自检（每改一页勾一项）

| # | 标准 | 金标页 |
|---|------|--------|
| 1 | 有明确 hero 层级（封面 / 大数 / 对照） | 001, 002, 004 |
| 2 | 有呼吸页（大标题 + 一句 lede） | 003 |
| 3 | 非 panel 堆砌（≤1 段连续 panel） | 全 deck |
| 4 | 样张字号主导，无引擎 72px 硬抬 | 全 deck |
| 5 | 收尾像 CTA 而非 bullet 列表 | 008 |

## 样张状态（neon-cyber）

| 文件 | 状态 | 说明 |
|------|------|------|
| `cover.html` | ✅ | 源 **`samples/_core/layouts/cover.html`**；`vp-cover` + 样张主导字号 |
| `04_number.html` | ✅ | **`_core/layouts/04_number.html`** |
| `01_text_only.html` | ✅ | **`_core/layouts/01_text_only.html`** · breathing / title-only |
| `20_compare.html` | ✅ | **`_core/layouts/20_compare.html`** |
| `21_process_flow.html` | ✅ | **`_core/layouts/21_process_flow.html`** |
| `03_stats_grid.html` | ✅ | **`_core/layouts/03_stats_grid.html`** · hero-1 首卡 |
| `02_panel.html` | ✅ | **`samples/_core/layouts/02_panel.html`** |
| `05_quote.html` | ✅ | **`_core/layouts/05_quote.html`** |

## 管道（深度相关）

| 改动 | 文件 |
|------|------|
| `minimal` 不注入 density 覆盖 | `utils/enhancement.js` |
| **Q1-A** 深度样张用 `var(--sf-*)` + 主题 tokens | `samples/_core/TOKENS.md`，HTML 单源 **`samples/_core/layouts/`**；无手写 `tokens.css` 时 **`depth_tokens_from_tpl`** |
| **Q1-B** `hero_image` / `diagram` / `brand_mark` → `.vp-visual-slot` | `utils/visual_assets.js`；缺图 → SVG 占位 (`data-vp-placeholder`) |
| **Q1-C** `scene.typography:"adapt"` 注入 `--sf-title-size` / `--sf-stat-number-size` | `utils/typography.js`；深度 8 页 `font-size: var(--sf-…, fallback)` |
| summary → `layout-cards` + `vp-closing` | `design.js`, `html_generator.js`；CTA 样式在 `_core/layouts/02_panel`（或主题内覆盖） |
| cover → `vp-cover`，不套 content 用 hero 字号 | `art_direction.js` |

## 复制门槛（→ bold / dark）

满足后再复制到其它主题：

1. product_launch 8 页你主观 ≥8/10  
2. `grep readability baseline output_golden/product_launch` 为 0  
3. `docs/NEON_DEPTH.md` 样张表全部 ✅  

**深度 HTML（2026-05，Q1-D）**：8 页结构单源 **`samples/_core/layouts/`**；各主题目录内无同名文件时由 **`loadTemplateWithSource`** 加载；配色来自 **`samples/themes/<id>/tokens.css`**（若有）或 **`depth_tokens_from_tpl`**（否则）。金标收尾页已加 `layout_hint: cards`。

| 脚本 | 说明 |
|------|------|
| `sync:depth-themes` | `scripts/sync-depth-from-neon.js`（**no-op**，保留 npm 入口；曾用于 neon→bold/dark 逐文件复制） |

```bash
npm run sync:depth-themes   # 无复制；改深度布局请编辑 samples/_core/layouts/*.html
npm run golden:render
npm run preview:html -- ./output_golden/product_launch 8877
npm run preview:html -- ./output_golden/business_report 8878
npm run preview:html -- ./output_golden/humanities_narrative 8879
```
