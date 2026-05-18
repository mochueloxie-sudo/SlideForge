# GitHub Release 草稿（v4.0.2）

## Release 标题

```
v4.0.2 — CI 自动校验 + validate 可执行 hint + npm run check
```

## Release 类型

- ✅ **Set as the latest release**
- ⚠️ **Pre-release**：否
- 🚨 **Breaking changes**：否（patch；`scenes.json` schema 与命令契约不变）

## Release 正文（Markdown）

```markdown
> **patch 级**：无破坏性 API 变更。侧重宿主 Agent / 贡献者的校验体验与仓库卫生。

### ✨ GitHub Actions CI

push / PR 到 `main` 时自动：

- `validate` 全部 `examples/*scenes*.json`
- 对 `four_new_variants_scenes.json` 跑 `design` + `html` 冒烟（不下载 Chromium，不跑截图）
- 拒绝遗留 `step0` / `step1` / `stepN` 命令

### ✨ validate 可执行 hint

每条 `errors[]` / `warnings[]` 现在附带 **`hint`** 字段，直接说明如何改（缺 `content_variant`、变体字段不匹配、主题 id 非法等）。宿主 Agent 收到校验 JSON 后可按 hint 自修复，无需翻完整 schema。

### ✨ 开发者：`npm run check`

```bash
npm run check -- path/to/scenes.json
npm run check:all    # 4 个示例 scenes 白名单
```

Agent 仍应直接调 `executor.js` 的 JSON 契约；此脚本仅供人类 / 本地快速自检。

### 🧹 仓库卫生

- 示例 fixtures 升级到 v4 schema（CI 全绿）
- 删除死代码 `utils/html_builder.js`、历史 `patches/`
- `.gitignore` 扩展；停止跟踪 IDE 元数据

### 🚀 升级

```bash
git pull
npm install   # 无新运行时依赖
```

### 📖 参考

- 完整变更：[CHANGELOG.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CHANGELOG.md)
- Schema：[docs/SCENES_SCHEMA.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/docs/SCENES_SCHEMA.md)
- 执行说明：[SKILL.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/SKILL.md)
```

---

## 创建 Release（gh CLI）

```bash
gh release create v4.0.2 \
  --title "v4.0.2 — CI 自动校验 + validate 可执行 hint + npm run check" \
  --notes-file <(awk '/^```markdown$/{flag=1;next}/^```$/{flag=0}flag' docs/GITHUB_RELEASE_DRAFT_v4.0.2.md) \
  --latest
```
