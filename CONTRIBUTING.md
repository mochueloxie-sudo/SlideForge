# 贡献指南

欢迎贡献 video-producer！请阅读以下指南。

---

## 📝 行为准则

尊重、友好的沟通。禁止歧视、骚扰。

---

## 🐛 报告 Bug

使用 [Bug Report 模板](?template=bug_report.md)，提供：
- 复现步骤
- 环境信息
- 错误日志

---

## 💡 提出建议

使用 [Feature Request 模板](?template=feature_request.md)，描述：
- 要解决的问题
- 建议方案
- 使用场景

---

## 🔧 提交代码

### 开发环境
```bash
git clone https://github.com/mochueloxie-sudo/Video-producer.git
cd video-producer
./install.sh
cp config.example.json config.json  # 填入 keys
```

### 修改代码
1. 创建功能分支：`git checkout -b feat/my-feature`
2. 遵循现有代码风格（PEP 8）
3. 添加测试（如有）
4. 提交信息格式：`type(scope): description`
   - 例如：`feat(step5): add tencent tts support`
   - 类型：feat, fix, docs, chore, test

### 提交 PR
1. 推送到 fork：`git push origin feat/my-feature`
2. 打开 Pull Request
3. 描述变更、关联 Issue
4. 等待审查（通常 1-2 天）

---

## 🧪 测试
在提交前，请确保：
- [ ] 代码通过语法检查（`python3 -m py_compile steps/*.py`）
- [ ] 至少跑通一个完整流程（使用 example/demo.md）
- [ ] 更新了相关文档（README/SKILL.md）

---

## 📜 许可证
贡献代码即表示您同意 MIT 许可证。
