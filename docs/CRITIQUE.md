# Critique — 发版前 HTML 静态检查

面向 **PDF / HTML** 交付：在 `package` / 截图之前，对已生成的 `page_*.html` 做本地静态扫描（**无网络、无 Puppeteer**）。

与 **`validate` + `quality_lint`** 的分工见下文。

---

## 命令

```bash
echo '{"command":"critique","html_dir":"./output","scenes":"./output/scenes.json"}' | node executor.js
```

产出（写入 `html_dir`）：

| 文件 | 说明 |
|------|------|
| `critique.json` | 机器可读报告 |
| `critique_report.md` | 人类可读摘要 |

**进程始终 exit 0**；是否通过以 `critique.json` 的 `ok` 与 `summary.errors` 为准。

Golden CI：`npm run check:golden` 在每套 `output_golden/<deck>/` 渲染成功后调用同一套 `runCritique`；**仅 `level: "error"` 会使 check 失败**；`warning` / `info` 打印到 stderr，不 fail。

---

## Level 含义

| level | 含义 | check:golden |
|-------|------|----------------|
| `error` | 应阻断发版（未替换 token、readability baseline 泄漏等） | **失败** |
| `warning` | 明显瑕疵，建议修；金标可用 baseline 白名单 | 仅 stderr |
| `info` | 启发式提示，不阻断 | 仅 stderr |

---

## 规则码表（P0）

实现：`utils/critique_rules.js`（注册表）→ `utils/critique_static.js`（按页遍历）。

| 代码 | level | 说明 |
|------|-------|------|
| `CRIT_UNFILLED_TOKEN` | error | 页面仍含 `{{TOKEN}}` |
| `CRIT_READABILITY_BASELINE` | error | 注入块含 `readability baseline`（`enhancement: minimal` 时不应出现） |
| `CRIT_PLACEHOLDER_IMAGE` | warning | 存在 `[data-vp-placeholder]`（资产未解析时的 SVG 占位） |
| `CRIT_EXTERNAL_STYLESHEET` | warning | `<link rel="stylesheet" href="http(s)://...">` |
| `CRIT_NO_HERO` | warning | `scene.hero_image` 或 `composition: "split-visual"`，但无有效主视觉（无 `img` 或仅占位） |
| `CRIT_MISSING_SF_THEME_TOKENS` | warning | **content** 页缺少 `<style id="sf-theme-tokens">` |
| `CRIT_SPARSE_TEXT` | info | `body` 可见文本极少（&lt; 20 字符） |
| `CRIT_HERO_NOT_DETECTED` | info | 声明了 `hero_image` 但 HTML 中无明显 hero 槽位标记（与 `CRIT_NO_HERO` 互补） |

系统级：

| 代码 | level | 说明 |
|------|-------|------|
| `CRIT_NO_HTML_DIR` | error | `html_dir` 不存在 |
| `CRIT_TOOL_ERROR` | error | critique 步骤异常（`steps/critique.js`） |

## 规则码表（C2 · deck + 启发式）

| 代码 | level | 说明 |
|------|-------|------|
| `CRIT_LOW_CONTRAST` | warning | 从 `body` / `:root` CSS 估算正文与背景对比度 &lt; 4.5:1（无 Puppeteer） |
| `CRIT_GENERIC_GRADIENT` | info | 疑似紫白 AI 渐变（`#6366f1` 等） |
| `CRIT_DECK_MONOTONY` | warning | **deck 级**：连续 3 页 HTML 结构指纹相同 |

Deck 级规则在 `utils/critique_static.js` 扫完所有 `page_*.html` 后由 `DECK_CRITIQUE_RULES` 执行。

---

## 与 `quality_lint` 的分工

| 维度 | `validate` + `quality_lint` | `critique` |
|------|-----------------------------|------------|
| 输入 | `scenes.json` | `page_*.html`（+ 可选 scenes 对照） |
| 时机 | 渲染前 | 渲染后 |
| 典型问题 | 字段/schema、节奏、过长标题、资产路径在 JSON 层缺失 | token 未替换、CSS 泄漏、占位图、缺 theme tokens |
| 输出 | `errors[]` / `quality_warnings[]` | `critique.json` `findings[]` |
| CI | validate 在 golden 流程开头 | `check-golden.js` 仅对 **error** fail |

两者互补：**JSON 层**保证结构与意图；**HTML 层**保证生成物可发版。

---

## Golden baseline 白名单

`examples/golden/critique_baseline.json`：按 deck 目录名（如 `editorial_notes`）列出 `allow: ["CRIT_..."]`，用于演示 deck 中**故意的** placeholder 等 warning，避免 stderr 噪音。 **error 不可被 suppress。**

---

## 扩展新规则

1. 在 `utils/critique_rules.js` 的 `CRITIQUE_RULES` 增加 `{ id, level, run({ $, raw, scene, pageNum, file, ctx }) }`。
2. 更新本文码表。
3. 若 golden 需豁免 warning，改 `critique_baseline.json`。
