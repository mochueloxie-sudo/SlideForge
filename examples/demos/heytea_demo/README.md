# heytea 主题演示

源分镜：`scenes.json`（与 `examples/fixtures/heytea_office_scenes.json` 相同）。

| 页 | 类型 | 说明 |
|----|------|------|
| 1 | `cover` | 标准封面 + 右上固定 logo |
| 2 | `panel` | 要点列举 |
| 3 | `stats_grid` | 四宫格指标 |
| 4 | `summary` | 固定尾页 |

## 本地生成预览（不提交仓库）

```bash
cd "$(git rev-parse --show-toplevel)"

echo '{"command":"render","scenes":"./examples/demos/heytea_demo/scenes.json","output_dir":"./examples/demos/heytea_demo","design_mode":"heytea","format":["html","pdf"]}' | node executor.js

open examples/demos/heytea_demo/presentation.pdf
# 或：npm run preview:html -- examples/demos/heytea_demo
```

生成物（`page_*.html`、`presentation.pdf`、`screenshots/`、`heytea-assets/` 等）已在 `.gitignore` 中，勿提交。
