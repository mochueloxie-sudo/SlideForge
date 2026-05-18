# 腾讯主题 · HTML 交付测试案例

用预先写好的离线 `scenes.json` 直接跑 **design → html → screenshot → package**（默认工作流：宿主 Agent 自产 scenes.json），验证：

- `presentation.html`：iframe 主入口（入场动画 + **hover**）
- `presentation_static.html`：PNG 轮播（与 PDF 帧一致，无组件 hover）

## 数据源

- 分镜：`../../fixtures/tencent_intro_scenes_fixture.json`（由 `fixtures/tencent_intro_light.md` 提炼）

## 一键生成

在仓库根目录执行：

```bash
npm run test:tencent-html
```

产出目录：`test_tencent_html/`（已加入 `.gitignore`，需本地生成）。

## 打开方式

**必须打开 `presentation.html`（iframe 单页）** 才能看到组件 hover；`presentation_static.html` 是整页 PNG，没有 DOM，**没有 hover**。

```bash
open ./test_tencent_html/presentation.html
```

- 方向键 / 空格翻页；鼠标移到第 2 页要点、第 3 页统计卡、第 4 页时间线等上，应出现描边 + 浅底 + 阴影。
- 对比静态轮播：`open ./test_tencent_html/presentation_static.html`

## 手动逐步（等价于上面脚本）

```bash
mkdir -p test_tencent_html && cp examples/fixtures/tencent_intro_scenes_fixture.json test_tencent_html/scenes.json
echo '{"command":"design","scenes":"./test_tencent_html/scenes.json","output_dir":"./test_tencent_html","design_mode":"neon-cyber"}' | node executor.js
echo '{"command":"html","scenes":"./test_tencent_html/scenes.json","design_params":"./test_tencent_html/design_params.json","output_dir":"./test_tencent_html"}' | node executor.js
echo '{"command":"screenshot","html_dir":"./test_tencent_html","output_dir":"./test_tencent_html/screenshots","design_params":"./test_tencent_html/design_params.json"}' | node executor.js
echo '{"command":"package","scenes":"./test_tencent_html/scenes.json","screenshots_dir":"./test_tencent_html/screenshots","html_dir":"./test_tencent_html","output_dir":"./test_tencent_html","format":["html"]}' | node executor.js
```
