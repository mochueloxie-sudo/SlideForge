# 安全政策

## 报告漏洞

如果您发现安全漏洞，请**不要公开提交 Issue**。

请直接联系：@mochueloxie-sudo（通过 GitHub Security Advisory）

## 安全更新
- 定期更新依赖
- API keys 永不提交到仓库
- 使用 `config.example.json` 作为模板

## 已知风险
- TTS API keys 存储在本地 `config.json`，确保文件权限为 600
- 避免在 CI/CD 中暴露 keys
