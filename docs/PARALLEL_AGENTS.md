# 并行 Agent 分工（金标 × critique）

> **协调窗口**：当前 Cursor 会话（Agent C）——不负责大块实现，负责冲突合并、`npm run check:golden` 汇合验收、CHANGELOG 摘要。  
> **实现窗口**：另开两个 Agent，分别粘贴下方 Prompt A / Prompt B。

**已定**：第四金标主题 = **`paper-ink`**，金标 id = **`editorial_notes`**。

---

## 冲突面

| 文件 | Agent A | Agent B |
|------|---------|---------|
| `scripts/check-golden.js` | 只改 `GOLDEN_SCENES` / `GOLDEN_OUT` | 只加 critique 循环 |
| `examples/golden/*.json` | ✅ 拥有 | ❌ 不碰 |
| `samples/**` | ✅ 拥有 | ❌ 不碰 |
| `utils/critique_*.js` | ❌ 不碰 | ✅ 拥有 |

合并 `check-golden.js` 时：**保留双方 diff**（数组 + critique 块）。

---

## Agent C（本窗口）职责

1. 双方 PR/分支合入前：扫 `git diff`，确认无越界修改  
2. 合并后执行：

   ```bash
   npm run check:golden
   ```

3. 期望结果：
   - 4 套金标：`product_launch` / `business_report` / `humanities_narrative` / **`editorial_notes`**（paper-ink）
   - 无残留 `{{TOKEN}}`、无 `readability baseline` 泄漏（minimal）
   - critique：**仅 `error` 级失败**；placeholder 演示页 warning 可接受（见 `critique_baseline.json` 若 B 已加）

4. 汇总 `CHANGELOG.md` 一条（金标 + critique，若 A/B 未写）  
5. 冲突仲裁：样张 DOM 为修 critique 所需 → 退回 B，改由 A 在样张/金标侧修

---

## Prompt A — 金标 / 样张（复制到新 Agent）

```markdown
你在 slide-forge 仓库做 **金标 / 样张扩面（M1）**。主交付形态是 **PDF / HTML**，不要动 video 录帧。

### 已定决策
- 第四套金标主题：**`paper-ink`**
- 金标目录名：**`editorial_notes`**
- scenes：`examples/golden/editorial_notes_scenes.json`
- 输出：`output_golden/editorial_notes/`
- **不要修改** critique 相关代码（`utils/critique_static.js`、`utils/critique_rules.js`、`steps/critique.js` 等）

### 目标（按顺序）
**G0**
1. 更新 `examples/golden/README.md`：变体覆盖矩阵（含第 4 套）
2. 扩展 `examples/golden/VISUAL_DIFF.md`：**paper-ink** 小节

**G1**
3. 新增 `examples/golden/editorial_notes_scenes.json`（6–8 页）：cover → text(breathing/title-only) → panel(split-visual+hero_image) → quote_context/quote → two_col或panel → summary
4. `scripts/golden-render.js` SETS 增加 editorial_notes + paper-ink
5. `scripts/check-golden.js` **仅**增加 `GOLDEN_SCENES` / `GOLDEN_OUT` 两项
6. `npm run check:golden` 全绿
7. 样张：`_core/layouts/02_panel.html` 与 `samples/paper-ink/02_panel.html` 对齐金标 panel 页；浅色对比度可读

**G2（时间允许）**
8. neon VISUAL_DIFF 中 1–2 项同步到 paper-ink（如 stats_grid / compare）

### 验收
- 4 套 validate 通过；check:golden 通过
- 不碰 critique 实现
```

---

## Prompt B — critique 规则（复制到新 Agent）

```markdown
你在 slide-forge 做 **critique 扩面（M1）**。PDF/HTML 发版前静态检查。

### 已定决策
- 第 4 金标由并行线添加：`editorial_notes` × `paper-ink`（你不要建 scenes，可等其合入后跑 golden）
- **不要修改**：`examples/golden/*.json`、`samples/**`、`golden-render.js` SETS

### 目标
**C0**
1. `utils/critique_rules.js` + 重构 `utils/critique_static.js`
2. `docs/CRITIQUE.md` 规则码表

**C1 规则**
- error: `CRIT_UNFILLED_TOKEN`, `CRIT_READABILITY_BASELINE`
- warning: `CRIT_PLACEHOLDER_IMAGE`, `CRIT_EXTERNAL_STYLESHEET`, `CRIT_NO_HERO`, `CRIT_MISSING_SF_THEME_TOKENS`
- info: `CRIT_SPARSE_TEXT`, `CRIT_HERO_NOT_DETECTED`（可合并 NO_HERO）
- 可选 `examples/golden/critique_baseline.json` 白名单

**挂钩 golden**
3. `scripts/check-golden.js`：每套 render 后 `runCritique`；**仅 error fail**

### 验收
- critique 命令 exit 0；check:golden 在 3～4 套上不破坏原检查
- 不碰金标 JSON / 样张
```

---

## 汇合清单（Agent C 勾选）

- [x] A：`editorial_notes_scenes.json` 存在且 validate 通过（7 scenes）  
- [x] A：`golden-render` / `check-golden` 含第 4 套（paper-ink）  
- [x] A：`samples/paper-ink/02_panel.html` split-visual + `.vp-visual-slot`  
- [x] B：`docs/CRITIQUE.md` + `utils/critique_rules.js`  
- [x] B：`check-golden` critique 挂钩（error-only fail）+ `critique_baseline.json`  
- [x] C：`npm run check:golden` 全绿（2026-05-18；已去掉 editorial 重复 critique 条目）  
- [x] C：`CHANGELOG` Unreleased 金标 M1 + 4.2.0 critique M1

---

## 完成后删除？

本文件为并行协作备忘，发版后可保留作运维说明，或合并进 `CLAUDE.md` 一节。

---

# 第二波 — shared 变体 × 主题 token × 商务金标（2026-05）

> **协调窗口**：本 Cursor 会话 — 合并分支、`npm run check:golden`、CHANGELOG、冲突仲裁。  
> **实现窗口**：三个 Agent 各贴下方 Prompt A / B / C。

## 冲突面（第二波）

| 路径 | Agent A | Agent B | Agent C |
|------|---------|---------|---------|
| `samples/shared/**` | ✅ | ❌ | ❌ |
| `examples/golden/variant_showcase_scenes.json` | ✅ 仅微调 | ❌ | ❌ |
| `samples/themes/**` | ❌ | ✅ | ❌ |
| `samples/_core/TOKENS.md` | ❌ | ✅ 文档 | ❌ |
| `examples/golden/*`（新金标 JSON） | ❌ | ❌ | ✅ |
| `scripts/golden-render.js` | ❌ | ❌ | ✅ |
| `scripts/check-golden.js` | ❌ | ❌ | ✅ **唯一** |
| `samples/_core/layouts/**` | ❌ 默认不碰 | ❌ | ❌ |

**合并规则**：`check-golden.js` 只接受 C 的 diff；样张 DOM 问题退回 A/B，不让 C 改 `samples/**`。

---

## Prompt A — shared 变体（第二波）

```markdown
你在 slide-forge 做 **shared 叙事变体升级**。主交付 PDF/HTML。

### 范围
- `samples/shared/13_card_grid.html`（card_grid）
- `samples/shared/10_icon_grid.html`
- `samples/shared/23_funnel.html`
- `samples/shared/22_architecture_stack.html`
- 可选：`samples/shared/07_timeline.html`
- `examples/golden/variant_showcase_scenes.json`（仅微调验收字段）

### 禁止
- `samples/themes/**`、`samples/_core/layouts/**`
- `scripts/check-golden.js`、`scripts/golden-render.js`
- 新建金标（除 variant_showcase 微调）
- critique 实现

### 目标
1. 用 `var(--sf-*)` 替代硬编码色；层级清晰
2. funnel / architecture_stack 减少「等宽灰条」模板感
3. 保持 1920×1080 与现有 `{{TOKEN}}` 契约

### 验收
- variant_showcase validate 通过
- 协调窗口会跑全量 check:golden
```

---

## Prompt B — 主题 token（第二波）

```markdown
你在 slide-forge 做 **主题设计系统扩面（Q1-A 续）**。

### 范围
- 新增 `samples/themes/swiss-modern/tokens.css`
- 新增 `samples/themes/electric-studio/tokens.css`
- 新增 `samples/themes/vintage-editorial/tokens.css`
- 更新 `samples/_core/TOKENS.md`

### 禁止
- `samples/shared/**`、金标 JSON、`scripts/*`
- 13 主题 × 8 layout 复制

### 目标
TOKENS.md 必填键齐全；浅色对比度可读；关掉 enhancement full 仍可辨认主题。

### 验收
生成 HTML 含非空 `--sf-accent` 等（任一金标 render 目测）
```

---

## Prompt C — 第六套金标（第二波）

```markdown
你在 slide-forge 做 **第六套金标（商务浅色）**。

### 已定
- 金标 id 建议：`swiss_brief`（或 `business_swiss`）
- 主题：`swiss-modern`
- 6–8 页：自 business_report 抽 cover / stats / panel+hero / compare / number / summary

### 范围
- `examples/golden/{id}_scenes.json`
- `scripts/golden-render.js` SETS
- `scripts/check-golden.js`（**仅此脚本**）
- `examples/golden/VISUAL_DIFF.md`、`examples/golden/README.md`

### 禁止
- `samples/**`（样张 bug 记给 A/B）

### 验收
- `npm run check:golden` 全绿（6 套）
```

---

## 汇合清单（第二波 · 协调窗口勾选）

- [x] A：`samples/shared` 四变体 + `timeline`；`variant_showcase` validate 通过  
- [x] B：`electric-studio` / `swiss-modern` / `vintage-editorial` `tokens.css` + `TOKENS.md`  
- [x] C：`business_swiss` 金标 + `golden-render` / `check-golden` 第六项  
- [x] 协调：无越界（C 未改 `samples/**`）  
- [x] 协调：`npm run check:golden` 全绿（2026-05-18）  
- [x] 协调：`CHANGELOG.md` **4.2.1**

```bash
# 协调窗口合并后
npm run check:golden
git diff --stat
```

---

# 第三波 — 深度回退 _core · shared 全量 · 13 主题 token（2026-05）

> **目标**：清掉盖住 `_core` 的旧样张；shared 叙事 + code/table/nav/chart 单源；13 主题均有 `tokens.css`；金标扩面。

## 冲突面（第三波）

| 路径 | Agent A | Agent B | Agent C |
|------|---------|---------|---------|
| 删主题内 `01`–`05`/`cover` 等（**保留** `paper-ink/**`、`notebook-tabs/cover.html`） | ✅ | ❌ | ❌ |
| `scripts/prune-theme-*.js` | ✅ | ❌ | ❌ |
| `samples/_core/layouts/**` | ❌ | ❌ | ❌ |
| `samples/shared/**`（含 `11`–`15` 新建） | ❌ | ✅ | ❌ |
| 删 `samples/shared/03,20,21` 重复 | ❌ | ✅ | ❌ |
| `scripts/prune-theme-utility-templates.js` | ❌ | ✅ 执行 | ❌ |
| `samples/themes/**/tokens.css` | ❌ | ❌ | ✅ |
| `examples/golden/variant_showcase_scenes.json` | ❌ | ❌ | ✅ |
| `TOKENS.md` / `VISUAL_DIFF` / `golden/README` | ❌ | ❌ | ✅ |
| `check-golden.js` | ❌ | ❌ | ❌（本波不增金标套数） |

## Prompt A — 深度回退 _core

```markdown
运行并提交：
- node scripts/prune-theme-depth-overrides.js
- 确认 neon/bold/dark 无 01–05 主题副本；paper-ink 定制保留
- 勿动 shared/
```

## Prompt B — shared 全量 + 工具变体单源

```markdown
- 升级 shared：08,16,17,18,19（--sf-*）
- 新建 shared：11_code_block, 12_table, 14_nav_bar, 15_chart_demo
- 删除 shared/03_stats_grid, 20_compare, 21_process_flow
- node scripts/prune-theme-utility-templates.js
- node scripts/wave3-finish.js（若 17–19/11 未完工）
```

## Prompt C — token + 金标扩面

```markdown
- 7 主题 tokens.css（paper-ink 等）
- variant_showcase +4 页：two_col, panel_stat, code, table
- TOKENS.md / VISUAL_DIFF / golden README
```

## 汇合清单（第三波）

- [x] A：47+ 主题深度文件已删，paper-ink 保留
- [x] B：shared 无 03/20/21 重复；11–15 存在；utility 主题副本已删（79）
- [x] C：13 主题 tokens；variant_showcase 10 页
- [x] `npm run check:golden` 全绿（2026-05-18）
