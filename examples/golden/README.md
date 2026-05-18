# 金标 deck（Q0-A / M1）

人工作品级 `scenes.json`，用于：

1. **品质标杆** — 展示 `visual_weight` / `composition` 与变体节奏，而非 panel 堆砌
2. **回归** — `npm run check:golden`（validate + `golden:render` + 无残留 `{{TOKEN}}`）+ CI
3. **反推样张** — diff 金标 HTML 与默认输出，驱动样张/CSS 迭代（见 [docs/ROADMAP_OUTPUT_QUALITY.md](../../docs/ROADMAP_OUTPUT_QUALITY.md)）

**Agent 默认约定（P0）**：每套金标对齐 `auto` + 主视觉 + 定稿 `strict` — 见 [AGENT_DEFAULTS.md](./AGENT_DEFAULTS.md)。

## 金标一览

| 目录名 / `output_golden/` | scenes 文件 | 主题 | 场景 |
|---------------------------|-------------|------|------|
| `product_launch` | `product_launch_scenes.json` | `neon-cyber` | 产品发布 / 技术路演 |
| `business_report` | `business_report_scenes.json` | `bold-signal` | 商业报告 / 指标叙事 |
| `humanities_narrative` | `humanities_narrative_scenes.json` | `dark-botanical` | 人文叙事 / 金句 |
| `editorial_notes` | `editorial_notes_scenes.json` | `paper-ink` | 编辑手记 / 长文浅色 |
| `variant_showcase` | `variant_showcase_scenes.json` | `paper-ink` | shared 变体 + **nav_bar / chart** 锚点（12 页） |
| `business_swiss` | `business_swiss_scenes.json` | `swiss-modern` | 商务浅色 / 8 页含 split-visual 主视觉 |
| `tech_variants` | `tech_variants_scenes.json` | `deep-tech-keynote` | 技术叙事变体 + `content_variant:"auto"`（第七金标） |

## 变体覆盖矩阵

行 = 金标 deck；列 = 该套 scenes 中**至少出现一次**的 `content_variant`（cover / summary 单独标注）。

| 金标 | cover | text | panel | number | quote | quote_context | compare | stats_grid | process_flow | two_col | panel_stat | timeline | summary |
|------|:-----:|:----:|:-----:|:------:|:-----:|:-------------:|:-------:|:----------:|:------------:|:-------:|:----------:|:--------:|:-------:|
| product_launch | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | — | — | ✓ |
| business_report | ✓ | ✓ | ✓ | — | ✓ | — | — | ✓ | — | — | ✓ | ✓ | ✓ |
| humanities_narrative | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | — | ✓ | — | — | ✓ |
| editorial_notes | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | — | — | — | — | ✓ |
| variant_showcase | ✓ | — | — | — | — | — | — | — | — | — | — | — | ✓ |
| business_swiss | ✓ | ✓ | — | ✓ | — | — | ✓ | ✓ | — | — | ✓ | — | ✓ |
| tech_variants | ✓ | — | — | — | — | — | ✓ | — | ✓ | — | — | — | ✓ |

> **M1 / G2**：`editorial_notes` 验收 split-visual、stats、compare；`variant_showcase` 另含 **card_grid / icon_grid / funnel / architecture_stack**（见 `variant_showcase_scenes.json`）。见 [VISUAL_DIFF.md](./VISUAL_DIFF.md)。

```bash
npm run check:golden    # validate + strict + 渲染 + HTML 回归
npm run golden:render   # 仅渲染 → output_golden/<name>/
npm run sync:depth-themes   # no-op；深度布局见 samples/_core/layouts/
npm run sync:shared-themes  # 金标用到的 shared 变体拷入主题目录（bold / dark）
```
