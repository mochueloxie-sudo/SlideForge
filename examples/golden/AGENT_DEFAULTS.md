# 金标 Agent 默认约定（P0 · 零样张）

> 宿主 Agent 写 **任意** deck 时建议默认遵循；7 套 `*_scenes.json` 已按此对齐，可直接抄结构。

## 三条默认

| # | 约定 | 做法 |
|---|------|------|
| 1 | **`content_variant: "auto"`** | 专用字段齐全时写 `auto`（`stats[]`、`process_stages[]`、`compare_*`…），勿手写错变体 |
| 2 | **至少 1 页主视觉** | `panel` + `composition:"split-visual"` + `hero_image` 或 `diagram`（路径相对 scenes.json） |
| 3 | **定稿前 strict** | `validate` + `"strict": true` 或 `npm run check:strict -- scenes.json` |

## 命令

```bash
npm run check:strict -- ./project/scenes.json
npm run check:golden    # 含金标 strict 回归
```

## 金标示范页

| 金标 | auto 示例 | 主视觉示例 |
|------|-----------|------------|
| product_launch | `pl-flow` / `pl-stats` | `pl-split` · orbit-demo.svg |
| business_report | `br-grid` | `br-dashboard` · board-dashboard.svg |
| business_swiss | `bsw-grid` / `bsw-visual` | `bsw-visual` · board-dashboard.svg |
| humanities_narrative | `hn-open` | `hn-room` · gallery-room.svg |
| editorial_notes | `en-stats` | split-visual 页 |
| variant_showcase | — | `vs-nav` / `vs-chart` 锚点 |
| tech_variants | `tv-flow-auto` | （技术叙事以变体为主） |
| ops_terminal | `ot-flow` / `ot-funnel` | terminal-green 换肤回归 |
| pastel_product | `pp-icons` / `pp-cards` | pastel-geometry 浅色回归 |
| creative_pitch | `cp-compare` / `cp-arch` | creative-voltage 高对比回归 |

详见 [docs/SCENES_SCHEMA.md](../../docs/SCENES_SCHEMA.md) §0.10。
