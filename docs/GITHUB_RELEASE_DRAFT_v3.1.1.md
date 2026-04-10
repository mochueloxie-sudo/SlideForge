# GitHub Release 草稿（v3.1.1）

## Release 标题

```
v3.1.1 — 视频黑场修复、HTML 兜底与 Agent 文档
```

## Release 正文（Markdown）

```markdown
### 修复

- **视频**：去掉逐页 FFmpeg 策略中的 `fade=in`，解决 `concat` 后 **封面黑屏** 与 **翻页黑幕**；修正 `-vf` 参数顺序。
- **HTML**：`summary` → `02_panel`；`nav_bar` 在缺 `body`/`subtitle` 时用 `script` 填 `SUBTITLE`。

### Agent / 工具

- `node executor.js ./request.json` 文件传参。
- SKILL / README：调用前确认格式与渠道；区分 iframe 主入口与静态 PNG 轮播。

**完整记录**：[CHANGELOG.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CHANGELOG.md)
```
