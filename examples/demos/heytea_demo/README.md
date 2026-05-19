# heytea 主题演示案例

4 页示例 deck，展示喜茶办公模板能力。


| 页   | 类型                       | 说明                            |
| --- | ------------------------ | ----------------------------- |
| 1   | `cover`                  | 标准封面 + 右上固定 logo + 品牌字体       |
| 2   | `content` · `panel`      | 要点列举                          |
| 3   | `content` · `stats_grid` | 四宫格指标（演示可用全部变体）               |
| 4   | `summary`                | **固定尾页**（`closing-slide.png`） |


## 预览

```bash
# 推荐：本地预览壳（键盘翻页）
npm run preview:html -- examples/demos/heytea_demo

# 或直接打开 PDF
open examples/demos/heytea_demo/presentation.pdf

# 单页 HTML（需同目录 heytea-assets/）
open examples/demos/heytea_demo/page_001.html
```

## 复现

```bash
echo '{"command":"render","scenes":"./examples/demos/heytea_demo/scenes.json","output_dir":"./examples/demos/heytea_demo","design_mode":"heytea","format":["html","pdf"]}' | node executor.js
```

