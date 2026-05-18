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
