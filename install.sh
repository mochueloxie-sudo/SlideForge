#!/bin/bash
# video-producer 一键安装脚本
# 支持：macOS (Homebrew) / Linux (apt)

set -e

echo "🎬 video-producer 安装脚本"
echo "================================"

# 1. 检测系统
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  OS="Linux"
else
  echo "❌ 不支持的操作系统: $OSTYPE"
  exit 1
fi

echo "✅ 检测到系统: $OS"

# 2. 安装 Homebrew (macOS)
if [ "$OS" == "macOS" ]; then
  if ! command -v brew &> /dev/null; then
    echo "📦 安装 Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  else
    echo "✅ Homebrew 已安装"
  fi
fi

# 3. 安装 ffmpeg
echo ""
echo "📦 安装 ffmpeg..."
if [ "$OS" == "macOS" ]; then
  brew install ffmpeg
else
  sudo apt update && sudo apt install -y ffmpeg
fi

# 4. 安装 Node.js
echo ""
echo "📦 安装 Node.js..."
if [ "$OS" == "macOS" ]; then
  brew install node
else
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# 5. 安装 lark-cli
echo ""
echo "📦 安装 lark-cli..."
npm install -g @larksuite/cli

# 6. 检查 Python
echo ""
echo "📦 检查 Python..."
if ! command -v python3 &> /dev/null; then
  echo "❌ 请先安装 Python 3.9+ (https://www.python.org/downloads/)"
  exit 1
fi
echo "✅ Python 版本: $(python3 --version)"

# 7. 创建配置模板
echo ""
echo "📝 创建配置模板..."
if [ ! -f config.json ]; then
  cp config.example.json config.json
  echo "✅ 已创建 config.json，请编辑填入 API keys："
  echo "   - minimax.api_key, minimax.group_id"
  echo "   - stepfun.api_key"
  echo "   - (可选) tencent.secret_id/secret_key"
else
  echo "⚠️  config.json 已存在，跳过"
fi

# 8. 提示登录飞书
echo ""
echo "================================"
echo "✅ 安装完成！"
echo ""
echo "后续步骤："
echo "1. 编辑 config.json 填入 API keys"
echo "2. 登录飞书：lark-cli auth login"
echo "3. 运行测试：python3 video-producer.py --document_url=example/demo.md"
echo ""
echo "更多信息请查看 SKILL.md"
echo "================================"
