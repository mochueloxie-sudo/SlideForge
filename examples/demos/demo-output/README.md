# 通用主题演示（本地生成）

历史预渲染产物已移出仓库以减小体积。需要预览时在本地跑一遍：

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p examples/demos/demo-output
cp examples/fixtures/four_new_variants_scenes.json examples/demos/demo-output/scenes.json

echo '{"command":"render","scenes":"./examples/demos/demo-output/scenes.json","output_dir":"./examples/demos/demo-output","design_mode":"neon-cyber","format":["html","pdf"]}' | node executor.js

open examples/demos/demo-output/presentation.html
```

生成物目录见根目录 `.gitignore`（`page_*.html`、`presentation.*` 等）。

喜茶办公模板见 [`../heytea_demo/README.md`](../heytea_demo/README.md)。
