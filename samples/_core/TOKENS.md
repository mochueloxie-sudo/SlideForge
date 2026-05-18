# 主题 Token 契约（Q1）

`html_generator` 在每页 `</head>` 前注入主题 tokens，顺序为：

1. **`samples/themes/{design_mode}/tokens.css`**（若存在）— 手写精调（neon / bold / dark 等）  
2. 否则 **`utils/depth_tokens_from_tpl.js`** — 由 `DESIGN_TEMPLATES` 行生成完整 `--sf-*`（其余主题默认）  
3. 再否则最小 **`tplToCssVars`** 兜底  

**深度布局**（`samples/_core/layouts/`）应使用 `var(--sf-*)`；换肤改 `tokens.css` 或改 `html_generator.js` 中对应 `DESIGN_TEMPLATES` 条目。

## 必填（手写 `tokens.css` 或 `depth_tokens_from_tpl` 生成结果）

| Token | 用途 |
|--------|------|
| `--sf-font` | `font-family` 首段 |
| `--sf-body-bg` | 单色底 / 兜底 |
| `--sf-body-gradient` | 常见竖向渐变（与 `--sf-page-bg-*` 可组合） |
| `--sf-text-primary` | 主标题 / 正文强调 |
| `--sf-text-secondary` | 副文、说明 |
| `--sf-text-muted` | 弱说明、单位 |
| `--sf-accent` | 主强调（链接、数字、CTA） |
| `--sf-accent-secondary` | 副强调（紫 / 第二色轨） |
| `--sf-accent-light` | 与 accent 同系高亮（兼容旧名） |
| `--sf-eyebrow-ring` | eyebrow 描边 |
| `--sf-text-subtitle` | 副标题 / 长说明（略亮于 secondary） |
| `--sf-panel-bg` | 玻璃面板背景 |
| `--sf-panel-border` | 面板主边框（`1px solid …`） |
| `--sf-panel-shadow` | 面板外阴影（可多条） |
| `--sf-panel-radius` | 圆角 |
| `--sf-hairline` | 底部分割线（单色或渐变见 `--sf-hairline-gradient`） |

## 页面背景（按样张选用其一）

| Token | 典型页 |
|--------|--------|
| `--sf-cover-bg` | `cover.html` |
| `--sf-page-bg-text` | `01_text_only` |
| `--sf-page-bg-panel` | `02_panel`、部分内页 |
| `--sf-page-bg-number` | `04_number` |
| `--sf-page-bg-stats` | `03_stats_grid` |
| `--sf-page-bg-compare` | `20_compare` |
| `--sf-page-bg-process` | `21_process_flow` |
| `--sf-page-bg-quote` | `05_quote` |

## 组件 / 装饰

| Token | 用途 |
|--------|------|
| `--sf-corner-accent` | 封面右上角光晕 |
| `--sf-bottom-line-gradient` | 封面底边渐变条 |
| `--sf-accent-bar-gradient` | 封面 accent 短条 |
| `--sf-page-num` | 页码色 |
| `--sf-subtitle-lede` | 封面副标题略亮 |
| `--sf-panel-border-top` | 面板上沿高光 |
| `--sf-panel-border-bottom` | 面板底阴影边 |
| `--sf-panel-shadow-inner` | 面板完整阴影（含 inset） |
| `--sf-kp-text` | key point 正文色 |
| `--sf-kp-divider` | kp 行间分割线 |
| `--sf-kp-arrow-glow` | 圆点箭头外发光 |
| `--sf-card-muted-border` / `--sf-card-muted-bg` | layout-cards / grid-3 卡片 |
| `--sf-visual-slot-*` | split-visual 右侧槽 |
| `--sf-cta-pill-border` / `--sf-cta-pill-bg` | summary CTA pills |
| `--sf-compare-*` | 对照页左列 / 右列 / 中线 / VS 徽章 |
| `--sf-process-*` | 流程轨、节点、卡片 |
| `--sf-stats-*` | 指标卡、hero-1 强调 |
| `--sf-quote-*` | 引号装饰、引用正文、来源 |

## 新增主题 checklist

1. 在 `html_generator.js` 的 `DESIGN_TEMPLATES` 登记该主题（`bodyBg` / `accent` / `panel*` 等）；无 `tokens.css` 时由 **`depth_tokens_from_tpl`** 自动生成深度 `--sf-*`。若要像素级调色，再新增 `samples/themes/<id>/tokens.css` 覆盖。
2. 任选 `design_mode:<id>` 跑 `html`，确认 `sf-theme-tokens` 注入且无未替换 `{{TOKEN}}`。
3. 布局 DOM 放在 **`samples/_core/layouts/`**（全主题复用）或主题目录覆盖单文件。

详见 [README.md](./README.md)。
