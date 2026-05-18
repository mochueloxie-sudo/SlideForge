# 金标 deck（Q0-A）

人工作品级 `scenes.json`，用于：

1. **品质标杆** — 展示 `visual_weight` / `composition` 与变体节奏，而非 panel 堆砌
2. **回归** — `npm run check:golden`（validate + `golden:render` + 无残留 `{{TOKEN}}`）+ CI
3. **反推样张** — diff 金标 HTML 与默认输出，驱动样张/CSS 迭代（见 [docs/ROADMAP_OUTPUT_QUALITY.md](../../docs/ROADMAP_OUTPUT_QUALITY.md)）

| 文件 | 场景 | 建议主题 |
|------|------|----------|
| `product_launch_scenes.json` | 产品发布 / 技术路演 | `neon-cyber` |
| `business_report_scenes.json` | 商业报告 / 指标叙事 | `bold-signal` |
| `humanities_narrative_scenes.json` | 人文叙事 / 金句 | `dark-botanical` |

```bash
npm run check:golden    # 推荐：一键 validate + 渲染 + HTML 回归
npm run golden:render   # 仅渲染 → output_golden/<name>/
npm run sync:depth-themes   # no-op；深度布局见 samples/_core/layouts/
npm run sync:shared-themes  # 金标用到的 shared 变体拷入主题目录
```

| 金标 | 主题 |
|------|------|
| `product_launch_scenes.json` | `neon-cyber` |
| `business_report_scenes.json` | `bold-signal` |
| `humanities_narrative_scenes.json` | `dark-botanical` |
