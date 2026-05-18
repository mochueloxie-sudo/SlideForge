# samples/ — 样张与主题

## 加载顺序（`loadTemplateWithSource`）

1. **`themes/{design_mode}/overrides/{variant}.html`** — 主题覆盖（cover、legacy `content.html`、notebook 壳等）
2. **`_core/layouts/{variant}.html`** — 深度 8 页（全主题默认）
3. **`shared/{variant}.html`** — 其余 content 变体

配色：**`themes/{design_mode}/tokens.css`** → 缺省由 `utils/depth_tokens_from_tpl.js` 生成。

## 目录

| 路径 | 用途 |
|------|------|
| `_core/layouts/` | 深度 DOM（wave6） |
| `_core/inject/` | 主视觉槽等注入 CSS |
| `shared/` | 14 个叙事变体（wave7） |
| `themes/*/tokens.css` | 13 主题 token |
| `themes/*/overrides/` | **仅**放与 `_core`/`shared` 不同的 HTML |

## 维护约定

- 改版式默认只动 `_core` 或 `shared`，再跑 `npm run check:golden`
- 新主题覆盖：在 `themes/<id>/overrides/` 增加文件，**不要**在 `samples/` 根下再建 `<id>/` 目录
- `content.html` 为 legacy 兜底变体，新 deck 请用 `01_text_only` 等深度/共享变体

详见 [`_core/README.md`](./_core/README.md)、[`docs/SCENES_SCHEMA.md`](../docs/SCENES_SCHEMA.md)。
