# refs — 设计参考（非构建依赖）

本目录下的文件仅供人读、给样张与动效对齐思路用，**不参与** `npm` 构建或运行时 `require`。

| 文件 | 说明 |
|------|------|
| [STYLE_PRESETS.md](STYLE_PRESETS.md) | 主题级视觉预设说明（字体、色板、版式气质） |
| [viewport-base.css](viewport-base.css) | 视口相关基础 CSS 参考 |
| [animation-patterns.md](animation-patterns.md) | 动效模式速查（与页内 CSS 动画、FFmpeg 策略分工见 `CLAUDE.md`） |

## 可选：完整 frontend-slides 副本

若要对齐 [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) 全量示例，可在本目录下自行 clone，例如：

```bash
git clone --depth 1 https://github.com/zarazhangrui/frontend-slides.git refs/frontend-slides
```

默认仓库 **不** 包含 `refs/frontend-slides/`，避免体积与许可证维护成本；将其加入 `.gitignore` 可避免误提交（如需可自行添加 `refs/frontend-slides/`）。
