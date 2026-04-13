# GitHub Release 草稿（v3.1.3）

## Release 标题

```
v3.1.3 — SKILL / README / CLAUDE 与宿主元数据对齐；Onboarding 与工具诊断可移植
```

## Release 正文（Markdown）

```markdown
### 文档与 Agent（`SKILL.md`）

- **Onboarding**：意图确认 → **按 `format` / `channel` / `source` 收窄**的配置检查 → 拼 JSON → 交付与 HTML 说明；成套**中文话术**。
- **主题**：主动列出 **13** 个 `design_mode`；用户可说「自动」→ **不传** `design_mode`（Step0 推荐 + Step2 定稿）；**不向用户问**页内动效默认值。
- **流程**：不引导「外援 `scenes.json` 从 step2 跳过 Step0/1」；分步 `echo` 链前说明 **按 `format` 裁剪**（无 video 则跳过 step5 等）。
- **维护**：`description` 与 **`_meta.json`** 脚注约定见文末 **`[^maint]`**。

### README / CLAUDE

- 中英文 README 的跑前清单、依赖引用、快速开始示例与 **SKILL** 一致；章节分隔 **`***`**。
- **CLAUDE.md**：概述与外部依赖交叉引用指向 SKILL **Onboarding 第二步**。

### 工程

- **`check_tools.sh`**：按**仓库根**解析 `tool-locator.js`，不再写死 `~/.openclaw/...`。
- **`package.json` / `_meta.json` / `package-lock.json`**：版本 **3.1.3**；npm `description` 与 `_meta` 摘要一致。

**完整记录**：[CHANGELOG.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CHANGELOG.md)
```
