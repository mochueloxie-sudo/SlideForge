# video-producer v1.0.0

将任意文档转化为专业视频演示稿 —— 自动生成逐字稿、TTS 语音、视频，并发布到飞书。

---

## ✨ 核心功能

- 📄 **多源文档读取**：本地文件 / 公开网页 / 飞书文档
- 🤖 **LLM 逐字稿**：StepFun GLM-4 生成（支持模板降级）
- 🗣️ **TTS 语音合成**：Minimax V2（首选）| 腾讯云 | macOS say（保底）
- 🎬 **视频自动合成**：ffmpeg 生成 1920×1080 H.264 视频
- ☁️ **飞书集成**：自动上传视频 + 创建含播放器的文档
- 🛡️ **稳定性优先**：三级降级策略，流程永不中断

---

## 🚀 快速开始

### 安装依赖
```bash
./install.sh
```

### 配置密钥
编辑 `config.json`，填入你的 API keys（参考 `config.example.json`）。

### 登录飞书
```bash
lark-cli auth login
```

### 运行
```bash
python3 video-producer.py \
  --document_url="file:///path/to/your/doc.md" \
  --audience="executives" \
  --design_mode="optimized"
```

---

## 📖 完整文档

- [SKILL.md](./SKILL.md) —— 详细用法、配置、故障排查
- [README.md](./README.md) —— 项目介绍与技术栈

---

## 🔧 技术栈

- **后端**：Python 3.9+
- **TTS**：Minimax T2A V2 / 腾讯云 TTS / macOS say
- **LLM**：StepFun GLM-4 / 内置模板
- **视频**：ffmpeg 8.1
- **截图**：Puppeteer (Node.js)
- **云服务**：飞书 Open API

---

## 🎯 使用场景

| 场景 | 推荐参数 |
|------|----------|
| 高管汇报 | `--audience=executives --design_mode=optimized` |
| 技术分享 | `--audience=developers --design_mode=default` |
| 教学材料 | `--audience=students --design_mode=optimized` |
| 内部培训 | `--audience=internal --design_mode=minimal` |

---

## 🛡️ 安全说明

- API keys 存储在本地 `config.json`（**勿分享**）
- `.gitignore` 已配置，自动排除敏感文件
- 飞书 API 调用通过 `lark-cli` 本地子进程执行（Secret 不离代码）

---

## ⚠️ 已知限制

- Minimax TTS 有配额限制（用尽后自动降级）
- 文档长度建议 < 1000 字（8-10 页）
- 需要稳定的网络环境（调用云端 API）

---

## 📄 License

MIT —— 可自由修改、分发、商用。

---

## 🙋 问题反馈

查看 [SKILL.md](./SKILL.md) 故障排查章节，或提交 Issue。

---

**Made by TeeClaw** · 2026-04-06
