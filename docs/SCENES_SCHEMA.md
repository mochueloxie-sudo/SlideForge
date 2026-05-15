# SCENES_SCHEMA — Agent 自产 scenes.json 指南

> **读者**：宿主 Agent（Cursor / Claude Code / OpenClaw 等大模型驱动的智能体）
> **作用**：v4.0 起 SlideForge **不再调用任何外部 LLM**。Agent 在对话内读完源材料后，按本文档**自己写出** `scenes.json` 落盘，再交给 SlideForge 渲染。
> **自检**：写完用 `command: "validate"` 跑一遍，按报错改，直到 `valid: true`。

---

## 1. 整体形状

`scenes.json` 是一个 **JSON 数组**，每个元素是一页幻灯：

```json
[
  { "id": 1, "type": "cover",   "title": "...", "subtitle": "..." },
  { "id": 2, "type": "content", "content_variant": "panel", "title": "...", "key_points": [ ... ] },
  ...
  { "id": N, "type": "summary", "title": "...", "key_points": [ ... ] }
]
```

**硬约束（validate 报 error）**

- 必须是数组、非空
- 必须**恰好 1 个** `type: "cover"`，**位于第 1 个**
- 最多 1 个 `type: "summary"`（建议放最后）
- 每个 scene 必须有非空 `title`
- `type: "content"` 必须声明 `content_variant`，且为合法值
- 不同变体有各自的必填字段（见 §3）

**软约束（validate 报 warning，不阻断渲染）**

- 同一 `content_variant` 不要连续两页（`design` 命令会尝试纠正）
- `script` 字段过短（<30 字符）或过长（>600 字符）

---

## 2. 公共字段

所有 scene 都可以带：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 1-based 序号；不写也行，渲染前会自动补 |
| `type` | `"cover"` \| `"content"` \| `"summary"` | 必填 |
| `title` | string | 必填，主标题 |
| `eyebrow` | string | 标题上方的小标签，如「核心数据」「BACKGROUND」 |
| `secondary` / `subtitle` | string | 副标题 |
| `script` | string | 口播逐字稿；**可选**——只在要导出 video 时需要。zh 150–200 字 / en 50–80 词 |
| `script_hint` | string | 一句话提示「这页该怎么讲」；不写口播稿时给个 hint 也好 |
| `footnote` | string | 页脚一行注脚，可用于数据来源 |
| `layout_hint` | string | 同变体下的子布局微调（见 §4） |

`type: "content"` **额外必填**：`content_variant`。

---

## 3. 22 个 content_variant

> 选哪个？看你这页的**叙事意图**和**已有素材结构**，不看美学。
> 决策树速查：
> - 一个核心数字是主角 → `number` 或 `panel_stat`
> - 多个数字并列 → `stats_grid`
> - 流程时间线 → `timeline`（时间）/ `process_flow`（业务流） / `architecture_stack`（分层） / `funnel`（漏斗）
> - 对照比较 → `compare`
> - 列举要点 → `panel`（3-6） / `card_grid`（3-6） / `icon_grid`（4-9）
> - 大段散文 → `text`
> - 一句话引用 → `quote` / `quote_context`
> - 章节封面 → `nav_bar`
> - 代码片段 → `code`
> - 表格数据 → `table`
> - 趋势曲线 → `chart`
> - 散文 + 图标点缀 → `text_icons`

### 3.1 panel — 3-6 项要点列表

```json
{
  "type": "content", "content_variant": "panel",
  "title": "三个关键能力",
  "key_points": ["能力一", "能力二", "能力三"],
  "key_point_descs": ["1-2 句解释一", "1-2 句解释二", "1-2 句解释三"],
  "layout_hint": "grid-3"
}
```

- **必填**：`key_points`（3-6 项，每项 ≤30 字）
- `layout_hint`: `stack`（默认）/ `grid-3`（≤3 项）/ `cards`（4-6 项）/ `sidebar-left` / `numbered`
- **`grid-3` / `cards` 时**：`key_point_descs` 强烈建议同长，每项 1-2 句

### 3.2 stats_grid — 2-4 个并列数据

```json
{
  "type": "content", "content_variant": "stats_grid",
  "title": "三季度核心指标",
  "stats": [
    { "number": "+86%", "label": "同比增长", "desc": "覆盖国内全部一线城市" },
    { "number": "1.2 亿", "label": "MAU", "desc": "数据来源：内部 BI" }
  ],
  "layout_hint": "row"
}
```

- **必填**：`stats[]`（每项 `number` + `label` + `desc`）
- `layout_hint`: `row`（默认）/ `hero-1`（一项突出）/ `2x2`

### 3.3 timeline — 3-5 个时间节点

```json
{
  "type": "content", "content_variant": "timeline",
  "title": "三年规划",
  "steps": [
    { "num": "01", "label": "2024 — 起步", "desc": "核心团队搭建" },
    { "num": "02", "label": "2025 — 增长", "desc": "全国 30 城落地" }
  ],
  "layout_hint": "horizontal"
}
```

- **必填**：`steps[]`（每项 `label` + `desc`）
- `layout_hint`: `vertical`（默认）/ `horizontal`（≤4 项）/ `alternating`

### 3.4 two_col — 散文 + 要点

```json
{
  "type": "content", "content_variant": "two_col",
  "title": "为什么选 X",
  "left_body": "X 的核心优势是 …（2-3 句散文铺背景）",
  "right_label": "三个关键证据",
  "key_points": ["证据一", "证据二", "证据三"],
  "layout_hint": "equal"
}
```

- **必填**：`left_body`（2-3 句）
- 建议同时给 `key_points[]`
- `layout_hint`: `equal`（默认）/ `wide-left` / `wide-right`

### 3.5 number — 单一巨型数字

```json
{
  "type": "content", "content_variant": "number",
  "title": "市场规模",
  "big_number": "3.4 万亿",
  "body": "2027 年中国 AI 应用市场预测",
  "layout_hint": "split"
}
```

- **必填**：`big_number`
- `layout_hint`: `center`（默认）/ `split`

### 3.6 quote — 一句话引用

```json
{
  "type": "content", "content_variant": "quote",
  "title": "用户原声",
  "quote_body": "用了 SlideForge 之后，我再也不熬夜做 PPT 了。",
  "quote_source": "—— 某产品经理",
  "layout_hint": "left-bar"
}
```

- **必填**：`quote_body`
- `layout_hint`: `center`（默认）/ `left-bar` / `full`

### 3.7 text — 长段散文

```json
{
  "type": "content", "content_variant": "text",
  "title": "为什么是现在",
  "body": "段落一……\n\n段落二……"
}
```

- **必填**：`body`（用 `\n\n` 分段）

### 3.8 code — 代码片段

```json
{
  "type": "content", "content_variant": "code",
  "title": "调用方式",
  "code_label": "executor.js",
  "code_snippet": "echo '{\"command\":\"render\", ...}' | node executor.js"
}
```

- **必填**：`code_snippet`

### 3.9 table — 表格

```json
{
  "type": "content", "content_variant": "table",
  "title": "方案对比",
  "table_headers": ["维度", "方案 A", "方案 B"],
  "table_rows": [
    ["上手成本", "低", "中"],
    ["可扩展性", "中", "高"]
  ]
}
```

- **必填**：`table_headers`、`table_rows`

### 3.10 chart — 趋势/对比图

```json
{
  "type": "content", "content_variant": "chart",
  "title": "用户增长",
  "chart_series": ["2024", "2025"],
  "chart_data": [
    { "label": "Q1", "values": [120, 280] },
    { "label": "Q2", "values": [180, 410] }
  ],
  "chart_stats": [
    { "value": "+138%", "label": "同比" }
  ]
}
```

- **必填**：`chart_data`

### 3.11 nav_bar — 章节封面

```json
{
  "type": "content", "content_variant": "nav_bar",
  "title": "第二章 · 落地路径",
  "nav_logo": "SlideForge",
  "nav_items": ["概述", "落地", "效果", "未来"],
  "nav_active": 1,
  "section_label": "Chapter 02 · 04",
  "progress_pct": 50
}
```

- **必填**：`nav_items`（3-6 项）

### 3.12 panel_stat — 要点 + 一个大数字

```json
{
  "type": "content", "content_variant": "panel_stat",
  "title": "增长背后",
  "key_points": ["原因一", "原因二", "原因三"],
  "stat_value": "1200 万",
  "stat_unit": "用户",
  "stat_label": "月活跃",
  "stat_eyebrow": "核心指标"
}
```

- **必填**：`key_points`、`stat_value`

### 3.13 number_bullets — 大数字 + 多条解释

```json
{
  "type": "content", "content_variant": "number_bullets",
  "title": "为什么 240%",
  "stat_value": "240%",
  "stat_label": "ROI 增幅",
  "key_points": ["渠道复用", "工具自动化", "团队效率"],
  "key_point_descs": ["共用素材库", "脚本一键产出", "节省 60% 沟通成本"]
}
```

- **必填**：`stat_value`、`key_points`
- `key_point_descs` 强烈建议同长

### 3.14 quote_context — 引用 + 上下文

```json
{
  "type": "content", "content_variant": "quote_context",
  "title": "权威背书",
  "quote_body": "AI 不是替代设计师，而是放大设计师的杠杆。",
  "quote_source": "Andreessen",
  "quote_role": "a16z 联合创始人",
  "context_body": "在 2026 年 a16z 春季信中，他用一整章讨论 AI 与设计的协作边界。"
}
```

- **必填**：`quote_body`、`context_body`

### 3.15 text_icons — 散文 + 2-4 个图标

```json
{
  "type": "content", "content_variant": "text_icons",
  "title": "三大支柱",
  "body": "我们用三个原则保证产品定力（2-3 句）……",
  "icons": [
    { "emoji": "🎯", "label": "聚焦" },
    { "emoji": "⚡", "label": "速度" },
    { "emoji": "🤝", "label": "协作" }
  ]
}
```

- **必填**：`body`、`icons`

### 3.16 icon_grid — 4-9 个图标卡

```json
{
  "type": "content", "content_variant": "icon_grid",
  "title": "能力矩阵",
  "icons": [
    { "emoji": "📝", "label": "结构化",   "desc": "自动生成 scenes.json" },
    { "emoji": "🎨", "label": "样张驱动", "desc": "13 套主题任选" }
  ]
}
```

- **必填**：`icons[]`（每项 `emoji` + `label` + `desc`）

### 3.17 card_grid — 3-6 张卡片

```json
{
  "type": "content", "content_variant": "card_grid",
  "title": "三类典型用户",
  "cards": [
    { "number": "01", "title": "产品经理", "body": "把需求文档秒变汇报 deck",   "tag": "高频" },
    { "number": "02", "title": "技术 Lead", "body": "复盘和方案评审一键到位", "tag": "高频" }
  ],
  "cards_numbered": true,
  "layout_hint": "2x2"
}
```

- **必填**：`cards[]`（每张 `title` + `body`）
- `card.number` 与 `card.icon` 二选一
- `layout_hint`: 默认 3 列；`2x2` 用于恰好 4 张

### 3.18 compare — A vs B 双栏对照

```json
{
  "type": "content", "content_variant": "compare",
  "title": "v3 vs v4",
  "compare_left_title": "v3 旧流程",
  "compare_right_title": "v4 新流程",
  "compare_center_label": "→",
  "compare_left_points": ["调远端 LLM", "等 30s+", "JSON 偶尔崩"],
  "compare_right_points": ["Agent 直接写", "无外部依赖", "可校验自检"],
  "layout_hint": "equal"
}
```

- **必填**：`compare_left_points`、`compare_right_points`（建议等长 3-5 项）

### 3.19 process_flow — 流程链路

**横向条（默认）**：

```json
{
  "type": "content", "content_variant": "process_flow",
  "title": "落地路径",
  "process_stages": [
    { "label": "调研", "desc": "1 周访谈 20 名用户" },
    { "label": "原型", "desc": "2 周交付可点击原型" },
    { "label": "灰度", "desc": "10% 流量验证 ROI" }
  ]
}
```

**泳道**（`layout_hint: "swimlane"`）：

```json
{
  "type": "content", "content_variant": "process_flow",
  "title": "跨团队协同",
  "flow_lanes": [
    { "lane_label": "产品", "cells": [{ "label": "PRD", "desc": "..." }, { "label": "UAT", "desc": "..." }] },
    { "lane_label": "工程", "cells": [{ "label": "排期", "desc": "..." }, { "label": "上线", "desc": "..." }] }
  ],
  "layout_hint": "swimlane"
}
```

- **必填**：`process_stages[]` 或 `flow_lanes[]`（至少一个非空）

### 3.20 architecture_stack — 3-5 个分层

```json
{
  "type": "content", "content_variant": "architecture_stack",
  "title": "系统分层",
  "layers": [
    { "title": "接入层", "desc": "Webhook / SDK / CLI" },
    { "title": "服务层", "desc": "scenes 渲染、截图、TTS" },
    { "title": "数据层", "desc": "样张库、主题预设" }
  ]
}
```

- **必填**：`layers[]`（每层 `title` + `desc`）

### 3.21 funnel — 3-5 层漏斗

```json
{
  "type": "content", "content_variant": "funnel",
  "title": "获客漏斗",
  "funnel_stages": [
    { "label": "曝光",   "desc": "1000 万 PV" },
    { "label": "线索",   "desc": "12 万有效线索" },
    { "label": "成交",   "desc": "8500 单付费" }
  ]
}
```

- **必填**：`funnel_stages[]`

---

## 4. layout_hint 速查

| 变体 | 可用 layout_hint |
|------|------------------|
| `panel` | `stack`(默认) / `grid-3` / `sidebar-left` / `cards` / `numbered` |
| `stats_grid` | `row`(默认) / `hero-1` / `2x2` |
| `timeline` | `vertical`(默认) / `horizontal` / `alternating` |
| `two_col` | `equal`(默认) / `wide-left` / `wide-right` |
| `quote` | `center`(默认) / `left-bar` / `full` |
| `number` | `center`(默认) / `split` |
| `card_grid` | 默认 / `2x2`（恰好 4 张时） |
| `compare` | `equal`(默认) / `wide-left` / `wide-right` |
| `process_flow` | `horizontal`(默认) / `swimlane`（需 `flow_lanes[]`） |
| `architecture_stack` | 默认 / `compact`（≥5 层时） |
| `funnel` | 默认 / `compact`（≥5 层时） |

---

## 5. 可选 `project.json`

写在 `output_dir/project.json`，给 `design` 命令一些上下文（**全部可选**）：

```json
{
  "title": "SlideForge v4.0 介绍",
  "language": "zh",
  "recommended_design_mode": "deep-tech-keynote",
  "source": "https://example.com/source-doc",
  "source_type": "web"
}
```

- `recommended_design_mode`：13 个合法主题 id 之一。`design` 优先级为：**当次 JSON 显式 `design_mode` > project.json `recommended_design_mode` > 内容自动推断**。

13 套主题 id 见 `_meta.json` 中 `design_mode.enum`，气质对照见 `README.md`。

---

## 6. 推荐工作流（Agent 视角）

```
1. (可选) extract                ← 把飞书/网页/本地文件抽成 raw_content.txt
   └─ Agent 读取 raw_content.txt + source_meta.json

2. Agent 在对话内：
   a. 决定页数（短文 5-7、中文 7-10、长文 10-14）
   b. 给每页选 content_variant + 写字段
   c. 落盘 scenes.json（可选写 project.json）

3. validate                       ← 自检
   ├─ valid: true  → 进入 4
   └─ errors[]      → Agent 修订后重跑

4. render                         ← 一把跑完 design → deliver
   或分步：design → html → screenshot → (tts if video) → package → deliver
```

---

## 7. 完整最小例（可直接 cp 跑通）

```json
[
  { "id": 1, "type": "cover",
    "title": "SlideForge v4.0",
    "subtitle": "Agent-first 演示生成 Skill" },

  { "id": 2, "type": "content",
    "content_variant": "panel",
    "title": "三个关键变化",
    "eyebrow": "核心",
    "key_points": ["移除外部 LLM", "Agent 自产 scenes.json", "validate 本地自检"],
    "key_point_descs": [
      "v3 调 MiniMax，v4 完全去除外部 LLM 依赖",
      "宿主 Agent 在对话内按 SCENES_SCHEMA 写文件",
      "schema 校验 + 警告全在本地，无网络往返"
    ],
    "layout_hint": "grid-3"
  },

  { "id": 3, "type": "summary",
    "title": "下一步",
    "key_points": ["试跑 demo:html-local", "读 docs/SCENES_SCHEMA.md", "把现有项目升级到 v4"]
  }
]
```

把上面的 JSON 存成 `my_deck/scenes.json`，跑：

```bash
echo '{"command":"validate","scenes":"./my_deck/scenes.json"}' | node executor.js
echo '{"command":"render","scenes":"./my_deck/scenes.json","output_dir":"./my_deck","format":["html"]}' | node executor.js
open ./my_deck/presentation.html
```

完成。

---

## 8. 常见坑

| 现象 | 原因 / 处理 |
|------|------------|
| `validate` 报 `expected exactly 1 cover scene` | 缺少 cover 或多了；首页必须 type=cover |
| `validate` 报 `content_variant="panel" requires non-empty "key_points"` | 必填字段缺；按 §3 对应小节补上 |
| 截图全是空白 | 多半 scenes.json 字段名拼错（如 `key_point` 单数）；validate 不会捕获拼写错误，对照 §3 字段名 |
| 多页同变体连续被 warning | 软约束。可换变体或忽略 |
| 想要逐字稿但 script 字段缺 | format 含 video 时需要；纯 PDF/HTML 不需要 |
| recommended_design_mode 不生效 | 当次 JSON 传了显式 `design_mode` 会覆盖 project.json 的推荐 |
