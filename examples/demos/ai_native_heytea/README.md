# AI Native 超级个体 — 喜茶办公主题示例

`scenes.json` 针对 **heytea** 主题优化：白底、品牌字、固定封面 logo 与尾页。

## 本地渲染

```bash
cd "$(git rev-parse --show-toplevel)"
echo '{"command":"render","scenes":"./examples/demos/ai_native_heytea/scenes.json","output_dir":"./examples/demos/ai_native_heytea","design_mode":"heytea","format":["html","pdf"]}' | node executor.js
open examples/demos/ai_native_heytea/presentation.html
```

生成物（HTML/PDF/截图等）已 gitignore，不会提交进仓库。
