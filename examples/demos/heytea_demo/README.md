# heytea 主题演示

源分镜：`scenes.json`（与 `examples/fixtures/heytea_office_minimal_4p_scenes.json` 相同；旧名 `heytea_office_scenes.json` 为别名）。

> **说明**：下表是 **4 页短示例**（1 封面 + 2 内容 + 1 固定尾页），用于本地预览与抄结构。`heytea` **不限页数**——中间可任意追加 `content` 页，用法与其它 13 套主题相同；仅封面 logo 与末页位图为品牌锁定。见 [docs/SCENES_SCHEMA.md](../../docs/SCENES_SCHEMA.md) §0.8a。

| 页   | 类型           | 说明               |
| --- | ------------ | ---------------- |
| 1   | `cover`      | 标准封面 + 右上固定 logo |
| 2   | `panel`      | 要点列举             |
| 3   | `stats_grid` | 四宫格指标            |
| 4   | `summary`    | 固定尾页             |


## 本地生成预览（不提交仓库）

```bash
cd "$(git rev-parse --show-toplevel)"

echo '{"command":"render","scenes":"./examples/demos/heytea_demo/scenes.json","output_dir":"./examples/demos/heytea_demo","design_mode":"heytea","format":["html","pdf"]}' | node executor.js

open examples/demos/heytea_demo/presentation.pdf
# 或：npm run preview:html -- examples/demos/heytea_demo
```

生成物（`page_*.html`、`presentation.pdf`、`screenshots/`、`heytea-assets/` 等）已在 `.gitignore` 中，勿提交。