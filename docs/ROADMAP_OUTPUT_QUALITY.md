# 输出品质 Roadmap（Q 系列）

> **定位**：SlideForge 是视觉内容生产工具。13 主题 × 22 变体解决的是「能稳定出片」；本路线解决「从好看模板 → 设计作品」。
> **优先级**：**高于**新增主题数量、高于 PPT 导入（Q 系列与导入正交，可并行但资源上 Q 优先）。
> **与动效 P0 的关系**：**P0 阶段 0–1**（`page_animations`、HTML 内 stagger）已落地，服务 **PDF/HTML** 主场景（截图等关键帧、浏览器内播放）。**P0 阶段 2**（video 录制动效帧）**低优先级 / 暂缓**——多数用户只要 PDF，video 仍可用静态帧合成。品质 **Q 系列**为 2026-05 起的产品主轴。

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

## Q1 — 视觉生产层（**全 4 阶段完成**，2026-05-18）


| ID       | 项      | 状态 | 说明                                                          |
| -------- | ------ | ---- | ----------------------------------------------------------- |
| **Q1-A** | 主题设计系统 | ✅ | `TOKENS.md`；neon/bold/dark 手写 `tokens.css`；其余主题 **`utils/depth_tokens_from_tpl.js`** 从 `DESIGN_TEMPLATES` 生成 `--sf-*`（含亮/暗判定、文色对比修正） |
| **Q1-B** | 主视觉管线  | ✅ | `hero_image` / `diagram` / `brand_mark` + `visual_alt` → `utils/visual_assets.js`；`validate` 报 `QUALITY_VISUAL_ASSET_MISSING`；缺图 → SVG 占位（`data-vp-placeholder`）；3 套金标各 1 张演示 |
| **Q1-C** | 内容感知排版 | ✅ | `utils/typography.js`：`kpScale` / `titleScale` / `statNumberScale`；`scene.typography:"adapt"` / `design_params.typography_scale:"adapt"` / `enhancement:"full"` 任一开启即注入 `--sf-title-size` / `--sf-cover-title-size` / `--sf-stat-number-size`，深度 8 页通过 `var(--sf-…, fallback)` 消费 |
| **Q1-D** | 样张构图升级 | ✅ | 深度 8 页 **`samples/_core/layouts/`**；全主题统一回退链；仅 `notebook-tabs/cover.html` 保留主题内封面覆盖 |

**入口**：`samples/_core/README.md` · `npm run check:golden`


---

## Q2 — 产品形态（**首批已落地**，2026-05-18）


| ID       | 项             | 状态 | 说明                                                |
| -------- | ------------- | ---- | ------------------------------------------------- |
| **Q2-A** | 双模式           | ✅ | `scene.mode` / `design_params.render_mode`；`custom_css` + `custom_css_file`；`utils/art_directed_css.js` 消毒后注入 `<style id="sf-art-directed">`（在 Q1-C typography 之后） |
| **Q2-B** | 风格预览         | ✅ | `preview` 命令：封面 + 首内容 2 页 × N 主题；未传 `themes` 时 `suggestPreviewThemes` Top 3；根目录 `preview.html` 并排 iframe |
| **Q2-C** | `critique` 命令 | ✅ | `critique` 命令：`html_dir` 必填；`cheerio` 静态扫描 → `critique.json` + `critique_report.md`；进程 **始终 exit 0** |


---

## 与既有 Roadmap 对照


| 原项                   | 建议                                   |
| -------------------- | ------------------------------------ |
| P0 动效 阶段 2（video 录帧） | **低优先级 / 暂缓**；PDF/HTML 不依赖；video 继续静态截图合成即可 |
| P1 更多主题/变体           | **边际递减**；Q0-D 后再加，且须带新构图             |
| P1 PPT 导入            | Q1 后或与 Q1-B 对齐                       |
| Anti-AI-Slop（备忘）     | 并入 Q0 金标 + `refs/STYLE_PRESETS` 气质清单 |


---

## 执行顺序（固定）

```
✅ Q0-C 品质 lint → ✅ Q0-B art direction → ✅ Q0-A 金标 deck → ✅ Q0-D 缩减全局 CSS
→ ✅ Q1-A 设计系统 → ✅ Q1-D 单源布局 → ✅ Q1-B 主视觉 → ✅ Q1-C 自适应排版
→ ✅ Q2-A 双模式 / ✅ Q2-B 风格预览 / ✅ Q2-C critique
```

实现追踪：见 [CHANGELOG.md](../CHANGELOG.md)；代码入口 `steps/quality_lint.js`、`utils/art_direction.js`、`utils/typography.js`、`utils/visual_assets.js`。