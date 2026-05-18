# 输出品质 Roadmap（Q 系列）

> **定位**：SlideForge 是视觉内容生产工具。13 主题 × 22 变体解决的是「能稳定出片」；本路线解决「从好看模板 → 设计作品」。
> **优先级**：**高于**新增主题数量、高于 PPT 导入（Q 系列与导入正交，可并行但资源上 Q 优先）。
> **与动效 P0 的关系**：原 Roadmap **P0 — HTML 动画**（`page_animations`）阶段 0–1 已落地；**品质 Q0** 为 2026-05 起的产品主轴，二者并行不冲突。

---

## 品质验收标准（内部定义）


| #   | 标准       | 说明                                   |
| --- | -------- | ------------------------------------ |
| 1   | **层级**   | 一眼分出 hero / support / footnote       |
| 2   | **节奏**   | 全 deck 至少 3 种「页型能量」（冲击 / 信息 / 呼吸）    |
| 3   | **构图**   | 存在非常规构图页（非默认 panel 堆叠）               |
| 4   | **字体**   | 长标题缩、短金句放大（内容感知，非全 deck 同一 title 字号） |
| 5   | **资产**   | 关键页有主视觉占位（图/示意/品牌块）— Q1 起            |
| 6   | **主题个性** | 关掉全局 enhancement 后主题仍可辨认             |


CI 的 `validate` 保证 **能渲染**；`quality_warnings` 指向 **品质**（不阻塞 render）。

---

## Q0 — 抬天花板（当前执行，2–4 周可感知）


| ID       | 项                    | 状态     | 交付物                                                                  |
| -------- | -------------------- | ------ | -------------------------------------------------------------------- |
| **Q0-A** | 金标 deck 反推样张         | ✅ 首批（neon-cyber） | `examples/golden/` + [VISUAL_DIFF.md](../examples/golden/VISUAL_DIFF.md)；5 张主题样张已改 |
| **Q0-B** | Art direction 字段     | ✅ 已落地 | `visual_weight` / `composition` → `design` → `utils/art_direction.js` |
| **Q0-C** | 品质 lint              | ✅ 已落地 | `steps/quality_lint.js`；`validate` → `quality_warnings[]` |
| **Q0-D** | 缩减全局 `!important` 覆盖 | ✅ 已落地 | `design_params.enhancement`: `minimal`（默认）\| `full`；见 `utils/enhancement.js` |


### Q0-B 字段约定（scenes.json 可选）

`**visual_weight`**（content / summary 页）


| 值           | 意图            | 渲染侧                                  |
| ----------- | ------------- | ------------------------------------ |
| `hero`      | 冲击页：大标题、主元素独占 | `vp-vw-hero`                         |
| `normal`    | 默认            | （无额外 class）                          |
| `dense`     | 信息密、字号收紧      | `vp-vw-dense` + `density-rich`       |
| `breathing` | 呼吸页：大留白、少元素   | `vp-vw-breathing` + `density-sparse` |


`**composition**`


| 值              | 意图                        | 渲染侧                    |
| -------------- | ------------------------- | ---------------------- |
| `default`      | 变体默认构图                    | —                      |
| `title-only`   | 整页只传达一句（隐藏 panel/列表）      | `vp-comp-title-only`   |
| `stat-hero`    | 数字/指标为绝对主角                | `vp-comp-stat-hero`    |
| `split-visual` | 预留主视觉区（Q1 接 `hero_image`） | `vp-comp-split-visual` |


### Q0-C 品质规则（首批）

- 连续 ≥3 页 `panel` → 警告（模板堆砌）
- content 页 `panel` 占比 >70%（且 ≥4 页）→ 警告
- deck ≥6 页且无「高能变体」（number / quote / compare / stats_grid / process_flow）→ 警告
- content 标题 >48 字 → 警告
- `panel` 且 `key_points.length` >5 → 警告
- 非法 `visual_weight` / `composition` → 警告

---

## Q1 — 视觉生产层（1–2 月）


| ID       | 项      | 状态 | 说明                                                          |
| -------- | ------ | ---- | ----------------------------------------------------------- |
| **Q1-A** | 主题设计系统 | ✅ | `TOKENS.md`；neon/bold/dark 手写 `tokens.css`；其余主题 **`depth_tokens_from_tpl`** 从 `DESIGN_TEMPLATES` 生成 `--sf-*` |
| **Q1-B** | 主视觉管线  | 🔄 起步 | `hero_image` / `diagram` / `brand_mark` → `utils/visual_assets.js`；金标 `pl-split` 示例 |
| **Q1-C** | 内容感知排版 | 🔄 起步 | `utils/typography.js`（`kpScale` 已接入）；标题自适应 CSS 待样张迁移 |
| **Q1-D** | 样张构图升级 | ✅ | 深度 8 页 **`_core/layouts/`**；全主题统一回退链；`notebook-tabs/cover.html` 唯一主题内封面覆盖 |

**入口**：`samples/_core/README.md` · `npm run check:golden`


---

## Q2 — 产品形态


| ID       | 项             | 说明                                                |
| -------- | ------------- | ------------------------------------------------- |
| **Q2-A** | 双模式           | Production（快） vs Art-directed（单页 `custom_css` 受控） |
| **Q2-B** | 风格预览闭环        | 3 页金标预览 → 选主题 → 全量 render                         |
| **Q2-C** | `critique` 命令 | 可选独立品质报告（或扩展 validate）                            |


---

## 与既有 Roadmap 对照


| 原项                   | 建议                                   |
| -------------------- | ------------------------------------ |
| P0 动效 阶段 2（video 录帧） | 保留，品质 Q0 不替代                         |
| P1 更多主题/变体           | **边际递减**；Q0-D 后再加，且须带新构图             |
| P1 PPT 导入            | Q1 后或与 Q1-B 对齐                       |
| Anti-AI-Slop（备忘）     | 并入 Q0 金标 + `refs/STYLE_PRESETS` 气质清单 |


---

## 执行顺序（固定）

```
Q0-C 品质 lint → Q0-B art direction → Q0-A 金标 deck → Q0-D 缩减全局 CSS
→ Q1 设计系统 + 主视觉 → Q2 双模式 / 预览
```

实现追踪：见 [CHANGELOG.md](../CHANGELOG.md) 未发版条目；代码入口 `steps/quality_lint.js`、`utils/art_direction.js`。