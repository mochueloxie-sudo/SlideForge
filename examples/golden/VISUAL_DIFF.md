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

