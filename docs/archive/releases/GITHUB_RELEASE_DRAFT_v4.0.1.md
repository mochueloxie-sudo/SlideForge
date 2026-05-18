# GitHub Release 草稿（v4.0.1）

## Release 标题

```
v4.0.1 — 文档密度优化：SCENES_SCHEMA §0 五分钟速通 + SKILL/README 精简 60%
```

## Release 类型

- ✅ **Set as the latest release**
- ⚠️ **Pre-release**：否
- 🚨 **Breaking changes**：否（纯 patch，无功能/API 变化）

## Release 正文（Markdown）

```markdown
> **本次无功能 / 无 API 变更**，纯文档迭代。目的：把 v4.0.0 发布后**首次接触本 Skill 的宿主 Agent** 的学习曲线尽可能压低，同时清理 v4.0 ship 时还留下的版本叙事噪音。

### ✨ 新增：SCENES_SCHEMA §0 五分钟速通版

针对外部反馈「scenes.json 编写复杂度对 Agent 还是有点重」，**坚持不加新工具**（违背 v4 Agent-first 哲学），改为在 [`docs/SCENES_SCHEMA.md`](https://github.com/mochueloxie-sudo/SlideForge/blob/main/docs/SCENES_SCHEMA.md) 顶部加入 §0 速通版：

- **§0.1**：3 句话理解 scenes.json
- **§0.2**：内容形态 → 变体决策图（ASCII 树，扫一眼就知道选哪个）
- **§0.3**：3 个最常用变体（`panel` / `stats_grid` / `quote_context`）的最小骨架
- **§0.4**：完整 4 页 deck 示例（**实测可直接复制 → `validate` 通过 → `render` 出 HTML**）
- **§0.5**：5 个最常见错误对照表（含字段名拼错、缺 `content_variant` 等）
- **§0.6**：高频字段速记

§1-§8 完整参考手册沉为「写复杂内容时翻」，**首次接触只读 §0 即可完成第一个 deck**。

### 📉 文档精简（保持单一信息源原则）

| 文件 | 改前 | 改后 | 削减 |
|------|------|------|------|
| `SKILL.md` | 277 | **162** | -41% |
| `README.md` | 401 | **163** | -59% |
| `README_en.md` | 467 | **163** | -65% |

主要砍掉：
- 各文档间重复的 13 主题表 / 22 变体速查（统一指向单一信息源）
- 已属 CHANGELOG 的「v4.0 重要变化对照表」
- 冗长的 ASCII 流程图、完整项目结构树
- 显式的「v4.0 起」「v3 时代」等版本叙事（使用文档只描述现状）

### 🗑 清理

- 删除 `docs/GITHUB_RELEASE_DRAFT_v3.1.{1,2,3}.md`（已发布过的历史草稿）

### 📋 文档分工原则（已写入 CHANGELOG）

| 文档 | 是否允许版本叙事 |
|------|---------------|
| `CHANGELOG` / `Release Notes` | ✅ 必须写 |
| `CLAUDE.md`（内部）| ✅ 「已删除清单」「v3→v4 映射」帮助追溯 |
| `SKILL.md` / `README.md` / `SCENES_SCHEMA.md`（使用文档）| ❌ 只描述现状 |

### 🚀 升级

`scenes.json` schema 和所有命令完全兼容 v4.0.0：

```bash
git pull
# 不需要 npm install（无依赖变化）
```

### 📖 参考

- 完整变更：[CHANGELOG.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CHANGELOG.md)
- Agent 速通版：[docs/SCENES_SCHEMA.md §0](https://github.com/mochueloxie-sudo/SlideForge/blob/main/docs/SCENES_SCHEMA.md#0-五分钟速通版首次必读)
- 执行说明：[SKILL.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/SKILL.md)
```

---

## 创建 Release（gh CLI）

```bash
gh release create v4.0.1 \
  --title "v4.0.1 — 文档密度优化：SCENES_SCHEMA §0 五分钟速通 + SKILL/README 精简 60%" \
  --notes-file <(awk '/^```markdown$/{flag=1;next}/^```$/{flag=0}flag' docs/GITHUB_RELEASE_DRAFT_v4.0.1.md) \
  --latest
```
