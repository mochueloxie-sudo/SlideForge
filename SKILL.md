# video-producer

将任意文档（Markdown/网页/飞书文档）转化为专业视频演示稿，自动生成逐字稿、TTS 语音、视频，并发布到飞书。

## 工作流

```
Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
  读取     提炼     LLM    视觉    HTML     TTS    视频    飞书
```

- **Step 0**：多协议文档读取（file/http/feishu）+ 内容类型检测
- **Step 1**：从 Markdown 标题提取核心要点（过滤噪声）
- **Step 2**：LLM 生成逐字稿（StepFun API，降级模板）
- **Step 3**：根据受众和内容类型确定视觉风格
- **Step 4**：生成 8 页 HTML（响应式，含内容模式检测）
- **Step 5**：TTS 语音合成（Minimax → Tencent → say 三级降级）
- **Step 6**：ffmpeg 视频合成（1920×1080，H.264 + AAC）
- **Step 7**：飞书视频上传 + 文档创建（含播放器）

## 快速开始

### 1. 安装依赖

```bash
# 系统工具
brew install ffmpeg
brew install node
npm install -g @larksuite/cli
lark-cli auth login  # 首次登录飞书
```

### 2. 配置密钥

编辑 `config.json`：
```json
{
  "minimax": {
    "api_key": "sk-...",
    "group_id": "group_...",
    "voice_id": "female-tianmei"
  },
  "stepfun": {
    "api_key": "1omUi..."
  }
}
```

### 3. 运行

```bash
python3 video-producer.py \
  --document_url="file:///path/to/doc.md" \
  --audience="executives" \
  --design_mode="optimized"
```

输出：
- 🎬 视频：`/tmp/video-producer-output/presentation.mp4`
- 📄 飞书文档：自动创建并嵌入视频

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--document_url` | 必填 | 文档地址（file:///... 或 https://...） |
| `--audience` | auto | 目标受众：auto/general/students/executives/developers/internal |
| `--design_mode` | optimized | 设计模式：default/optimized/minimal |
| `--tts_provider` | minimax | TTS 引擎：say/minimax/tencent |
| `--output_quality` | high | 输出质量：high/medium/low |

## 配置项（config.json）

```json
{
  "minimax": {
    "api_key": "...",
    "group_id": "...",
    "model": "speech-2.8-hd",
    "voice_id": "female-tianmei"
  },
  "stepfun": {
    "api_key": "..."
  },
  "tencent": {
    "secret_id": "...",
    "secret_key": "...",
    "region": "ap-shanghai"
  },
  "tts": {
    "provider": "minimax"
  },
  "llm": {
    "provider": "stepfun",
    "model": "step-1-8k"
  }
}
```

## 降级策略

### TTS 三级降级
1. **Minimax**（首选，音质最佳）
2. **Tencent**（备选，需配置密钥）
3. **macOS say**（保底，始终可用）

任一引擎失败自动降级到下一级。

### LLM 降级
- StepFun API 失败 → 使用内置模板生成（内容泛化但不中断）

## 输出文件结构

```
/tmp/
├── video-producer-slides/     # HTML 页面
│   ├── slide-01.html
│   └── ...
├── video-producer-audio/      # AAC 音频
│   ├── audio-01.aac
│   └── ...
└── video-producer-output/
    └── presentation.mp4       # 最终视频
```

## 飞书集成

- **视频上传**：Bot 身份（`cli_a95b8050e7f89bc9`）上传到指定文件夹
- **文档创建**：User 身份在文件夹内创建文档（Bot 无写权限）
- 文档自动嵌入视频播放器 + 内容导览 + 逐字稿

## 故障排查

### Minimax TTS 报错 `usage limit exceeded`
原因：配额用尽。自动降级到 Tencent 或 say。

### ffmpeg 报错 `height not divisible by 2`
原因：截图高度为奇数。已自动添加 `scale` 滤镜修复。

### LLM 使用模板生成
原因：`STEP_API_KEY` 未配置。检查 `config.json` 或环境变量。

## 技术栈

- **后端**：Python 3.9+（标准库 + subprocess）
- **TTS**：Minimax T2A V2 API / 腾讯云 TTS / macOS say
- **LLM**：StepFun GLM-4 / 内置模板
- **视频**：ffmpeg 8.1
- **截图**：Puppeteer (Node.js)
- **云服务**：飞书 Open API（lark-cli）

## License

MIT
