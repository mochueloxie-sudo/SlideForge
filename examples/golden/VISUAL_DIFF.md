# 金标视觉 diff — product_launch × neon-cyber

对照 `examples/golden/product_launch_scenes.json` 反推的样张改动（Q0-A）。

## 已改文件


| 样张                   | 问题（改前）                                      | 改动                                                                |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `04_number.html`     | 标题塞进 `.label`、无 eyebrow/body、数字页像仪表盘 widget | 编辑型布局：eyebrow + headline + 左大数右叙述；`stat-context` 承载 body          |
| `01_text_only.html`  | 呼吸页空 `<p class="body-text">`、仅靠注入 CSS       | 样张内建 `vp-vw-breathing` / `title-only`；`:empty` 隐藏；lede 用 accent 色 |
| `02_panel.html`      | `split-visual` 用 body::after 占位，与 flex 冲突   | `.slide-split` + `.vp-visual-slot` 真 DOM 主视觉区                     |
| `20_compare.html`    | 共用 token 样张，左右列同质                           | 主题专用：右列 teal 高亮、左列 muted、VS 发光环                                   |
| `03_stats_grid.html` | 3 指标平铺、无主次                                  | 主题专用 + `composition:stat-hero` → `layout-hero-1` 首卡放大             |


## 管道改动


| 文件                        | 改动                                            |
| ------------------------- | --------------------------------------------- |
| `utils/html_generator.js` | `title-only` 时 body → secondary，避免空 body-text |
| `steps/design.js`         | `stats_grid` + `stat-hero` → `hero-1`         |
| `utils/art_direction.js`  | `.number` 纳入 stat-hero；禁用 split `::after`     |


## 本地复现

```bash
rm -rf output_golden && mkdir output_golden
echo '{"command":"design","scenes":"./examples/golden/product_launch_scenes.json","output_dir":"./output_golden","design_mode":"neon-cyber"}' | node executor.js
echo '{"command":"html","scenes":"./examples/golden/product_launch_scenes.json","design_params":"./output_golden/design_params.json","output_dir":"./output_golden"}' | node executor.js
open output_golden/page_002.html output_golden/page_003.html output_golden/page_004.html output_golden/page_007.html
```

## Q0-D（已落地）

- `design_params.enhancement` 默认 `**minimal**`：不注入 readability / glass / title 72px；保留 density + art-direction
- legacy 行为：`"enhancement": "full"`（design JSON 或 `design_params.json`）
- `**21_process_flow.html**`（neon）：发光节点 + 卡片，替代 shared 通用轨

## 主题扩展（Q0-A 续）


| 主题               | 已同步样张（自 neon 金标结构）           |
| ---------------- | ---------------------------- |
| `bold-signal`    | `01_text_only` / `04_number` |
| `dark-botanical` | `01_text_only` / `04_number` |


```bash
npm run golden:render
open output_golden/product_launch/page_005.html   # process_flow
```

---

## paper-ink × editorial_notes（M1 · 第四金标）

对照 `examples/golden/editorial_notes_scenes.json`；主题 **`paper-ink`**（浅色编辑 / 长文）。

### 已改 / 验收样张（paper-ink 主题目录）

| 样张 | 状态 | 说明 |
|------|------|------|
| `02_panel.html` | ✅ M1 | 与 `_core` 同构：`.slide-split` + `.vp-visual-slot`；浅底边框 `#c8c0b4`；非 split 时单栏 panel |
| `01_text_only.html` | ✅ M1 | `vp-vw-breathing` / `title-only`；lede 用 crimson accent |
| `cover.html` | ✅ 既有 | 衬线封面 + 顶栏 crimson，对比度自查 |
| `05_quote.html` | ✅ 既有 | 金标引用页 |

### G2 已同步（paper-ink 主题目录）

| 样张 | 状态 | 说明 |
|------|------|------|
| `03_stats_grid.html` | ✅ | 衬线 + crimson 首卡 `layout-hero-1` / `stat-hero` |
| `20_compare.html` | ✅ | 左 muted / 右 crimson 高亮 + 圆环 VS |
| `editorial_notes` 金标 | ✅ | 增 `stats_grid` + `compare` 页验收上述样张 |
| `variant_showcase` 金标 | ✅ | `card_grid` / `icon_grid` / `funnel` / `architecture_stack`（shared 变体） |

### 本地复现

```bash
npm run check:golden
open output_golden/editorial_notes/page_002.html   # breathing
open output_golden/editorial_notes/page_003.html   # split-visual + hero_image
```

---

## swiss-modern × business_swiss（第六金标 · 商务浅色）

对照 `examples/golden/business_swiss_scenes.json`；主题 **`swiss-modern`**（极简 / 瑞士风浅色）。内容自 `business_report_scenes.json` 抽取 7 页：`cover` → `number` → `stats_grid` → `panel_stat` → `compare` → 呼吸 `text` → `summary`。

### 验收变体（scenes 侧）

| 页 | content_variant | 要点 |
|----|-----------------|------|
| cover | — | 商务封面 + hero |
| number | `number` | `stat-hero` 单一大数 |
| stats_grid | `stats_grid` | `2x2` + `stat-hero` |
| panel_stat | `panel_stat` | `stat-hero` 主数字 + 要点 |
| compare | `compare` | 季环比对 |
| text | `text` | `title-only` + `breathing` |
| summary | — | 决议 CTA |

### 样张 diff（待 A/B）

| 样张 | 期望（金标反推） | 状态 |
|------|------------------|------|
| `cover.html` | 瑞士网格 / 高对比标题 | 待 diff |
| `04_number.html` | 左大数右叙述，非 widget 仪表盘 | 待 diff |
| `03_stats_grid.html` | `hero-1` 首卡放大 | 待 diff |
| `16_panel_stat.html` | 主数字层级清晰 | 待 diff |
| `20_compare.html` | 左右列对比度、VS 环 | 待 diff |
| `01_text_only.html` | 呼吸页 `title-only` | 待 diff |

> 样张改动在 `samples/**` 由 A/B 负责；本套仅落 scenes + golden 管道。若渲染暴露样张缺陷，记 issue 给 A/B。

### 本地复现

```bash
npm run check:golden
open output_golden/business_swiss/page_001.html   # cover
open output_golden/business_swiss/page_002.html   # number
open output_golden/business_swiss/page_005.html   # compare
```

