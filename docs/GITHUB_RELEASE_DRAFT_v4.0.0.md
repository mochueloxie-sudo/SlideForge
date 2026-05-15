# GitHub Release 草稿（v4.0.0）

## Release 标题

```
v4.0.0 — Agent-first refactor: 移除外部 LLM 依赖，命令空间语义化
```

## Release 类型

- ✅ **Set as the latest release**
- ⚠️ **Pre-release**：否
- 🚨 **Breaking changes**：是（主版本号 bump）

## Release 正文（Markdown）

```markdown
> **重大版本变更**：v4.0 把 SlideForge 从「内置 LLM 调用的工具」彻底重构为「宿主 Agent 调用的纯渲染 Skill」。原 `step0_analyze` / `step1_script` 与 MiniMax 调用全部移除，命令空间从数字编号 (`step2`-`step7`) 全面改为语义动词。这是一次破坏性变更，已存在 v3.x 调用的脚本需按下表迁移；从 v3.x 升级前请阅读 [CHANGELOG.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CHANGELOG.md#400--2026-05-15--agent-first破坏性变更) 完整说明。

### 🎯 核心定位变化

| 维度 | v3.x | v4.0 |
|------|------|------|
| 谁产出 `scenes.json` | 内置 `step0` 调 MiniMax | **宿主 Agent**（Cursor / Claude Code / OpenClaw …） |
| 谁写口播稿 `script` | 内置 `step1` 调 MiniMax | **宿主 Agent**（仅 video 必需） |
| `.env` LLM 凭证 | 必填 `MINIMAX_*` / `LLM_*` | **不需要**（仅飞书源/交付保留 `FEISHU_*`） |
| 命令命名 | `step0` … `step7`（数字编号） | 语义动词：`extract` / `validate` / `design` / `html` / `screenshot` / `tts` / `package` / `deliver` / `render` |
| `command: "all"` | source → deck（含 LLM 调用） | 别名指向 `render`：从已存在的 `scenes.json` 起跑 design → deliver |

### ✨ 新增

- **`command: "extract"`**（`steps/extract.js`）：把飞书 / 本地 / 网页素材抽成 `raw_content.txt` + `source_meta.json`，**零 LLM**
- **`command: "validate"`**（`steps/validate.js`）：本地 schema 校验 `scenes.json`，输出结构化 `errors[]` / `warnings[]`，永远 exit 0（让 Agent 能读 JSON 判断结果）
- **`docs/SCENES_SCHEMA.md`**：宿主 Agent 自产 `scenes.json` 的唯一信息源，含 22 个变体的字段表 + 决策树 + 最小示例 + 常见坑

### 💥 破坏性变更

**命令删除**：
- `command: "step0"` / `command: "step1"` 命中时 executor 抛错并指引到新流程
- 删除文件：`steps/step0_analyze.js` / `steps/step1_script.js` / `steps/utils/minimax_utils.js` / `steps/utils/llm_client.js`

**命令重命名**（旧名命中 executor 抛错并指引到新名）：

| v3.x | v4.0 |
|------|------|
| `step2` | `design`（`steps/design.js`） |
| `step3` | `html`（`steps/html.js`） |
| `step4` | `screenshot`（`steps/screenshot.js`） |
| `step5` | `tts`（`steps/tts.js`） |
| `step6` | `package`（`steps/package.js`） |
| `step7` | `deliver`（`steps/deliver.js`） |

内部 helper 文件也同步重命名：`step6_video.js` → `video.js`（被 `package` 调用）、`step7_publish.js` → `publish.js`（被 `deliver` 调用）。

**配置变更**：
- `.env` 删去 `MINIMAX_*` / `LLM_*`，仅保留 `FEISHU_*`
- `project.json` 不再由内置命令自动生成；宿主 Agent 自决是否落盘 `recommended_design_mode`

### 📚 文档全量更新

- **`SKILL.md`**：重写为 5 步 Agent-first 工作流（意图 → extract → 写 scenes → validate → render）。第一步显式加入「输入模式识别」（单源 vs 多源融合 + 框架），让 Agent 在意图阶段就识别多源场景，避免后期返工。所有命令引用使用新语义动词
- **`docs/SCENES_SCHEMA.md`**：新增。宿主 Agent 写 `scenes.json` 的唯一参考文档
- **`CLAUDE.md`**：架构表更新文件名 + 加入 v3→v4 命名映射；P1 LLM-decoupling 标记完成；P2 LLM 稳定性章标记 v4 不再适用
- **`README.md` / `README_en.md`**：重写顶部定位 + 加入 v3→v4 迁移对照表 + 新流程图
- **`_meta.json`**：`command.enum` 切换到新动词；字段描述全更新；版本 4.0.0
- **`package.json`**：`scripts` 全用新命令名；移除 `minimax` / `llm` keywords

### 🔄 升级指引

| 你原来的用法 | v4 怎么做 |
|---|---|
| `echo '{"command":"all","source":"...","format":"html"}' \| node executor.js` | (1) `extract` 拿 raw_content.txt（可选）；(2) Agent 自己写 scenes.json；(3) `validate`；(4) `render` |
| `echo '{"command":"step0","source":"..."}' \| node executor.js` | `extract` + Agent 写 scenes.json |
| `echo '{"command":"step1","scenes":"..."}' \| node executor.js` | Agent 给每页补 `script` 字段后直接走 `tts` / `package` |
| `echo '{"command":"step2","scenes":"..."}'` | `command: "design"` |
| `echo '{"command":"step3","scenes":"..."}'` | `command: "html"` |
| `echo '{"command":"step4","html_dir":"..."}'` | `command: "screenshot"` |
| `echo '{"command":"step5","scenes":"..."}'` | `command: "tts"` |
| `echo '{"command":"step6","format":...}'` | `command: "package"` |
| `echo '{"command":"step7","channel":"..."}'` | `command: "deliver"` |
| `.env` 配 `MINIMAX_*` | 删掉，v4 不需要 |

`scenes.json` 字段未变，已存在的 deck 用 `validate` 一遍通过即可继续 `render`。

### 🚀 快速验证

```bash
git pull
npm install
npm run demo:html-local
open ./demo_html_out/presentation.html
```

或宿主 Agent 工作流：

```bash
# 1. 把外部素材抽成本地纯文本
echo '{"command":"extract","source":"./examples/tencent_intro_light.md","output_dir":"./project"}' \
  | node executor.js

# 2. Agent 在对话内按 docs/SCENES_SCHEMA.md 写 ./project/scenes.json

# 3. 自检
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js

# 4. 一把渲染
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["html"],"design_mode":"deep-tech-keynote"}' \
  | node executor.js

# 5. 打开
open ./project/presentation.html
```

### 📖 参考

- 完整变更记录：[CHANGELOG.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CHANGELOG.md)
- 宿主 Agent 写 `scenes.json` 指南：[docs/SCENES_SCHEMA.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/docs/SCENES_SCHEMA.md)
- Skill 使用说明：[SKILL.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/SKILL.md)
- 仓库内开发指南：[CLAUDE.md](https://github.com/mochueloxie-sudo/SlideForge/blob/main/CLAUDE.md)
```

---

## 创建 Release 的两种方式

### A. 用 gh CLI（推荐，但当前 token 失效）

```bash
# 1. 重新登录
gh auth login -h github.com

# 2. 创建（用本草稿文件作为 body）
gh release create v4.0.0 \
  --title "v4.0.0 — Agent-first refactor: 移除外部 LLM 依赖，命令空间语义化" \
  --notes-file <(awk '/^```markdown$/{flag=1;next}/^```$/{flag=0}flag' docs/GITHUB_RELEASE_DRAFT_v4.0.0.md) \
  --latest
```

### B. GitHub 网页

1. 打开 https://github.com/mochueloxie-sudo/SlideForge/releases/new?tag=v4.0.0
2. **Title**：复制本文件「Release 标题」
3. **Description**：复制本文件 `markdown` 代码块内的全部内容
4. 勾选 **Set as the latest release**
5. 点 **Publish release**
