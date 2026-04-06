"""
Step 7: 飞书文档创建 + 视频上传

职责：
1. 将视频上传到飞书云空间（AI新鲜事 文件夹）—— Bot 身份
2. 创建飞书文档，嵌入视频播放器 —— User 身份（Bot 无文件夹写权限）
3. 添加内容导览表格 + 逐字稿
"""

import subprocess
import json
import os
from pathlib import Path
from typing import List, Dict, Any

# 加载配置
def load_config() -> Dict[str, Any]:
  config_path = Path("/Users/teeclaw/.openclaw/workspace/video-producer/config.json")
  if config_path.exists():
    with open(config_path) as f:
      cfg = json.load(f)
      if "paths" in cfg:
        cfg.update(cfg["paths"])
      return cfg
  return {}

CONFIG = load_config()

# 配置
FOLDER_TOKEN = "ADuufEdBslE6RcdrBwDc0bU4nHe"  # AI新鲜事
VIDEO_PATH = Path("/tmp/video-producer-output/presentation.mp4")

# lark-cli 绝对路径（可从 config 覆盖）
LARK_CLI = CONFIG.get("lark_cli", "/Users/teeclaw/.nvm/versions/node/v24.14.1/lib/node_modules/@larksuite/cli/bin/lark-cli")


def run_lark_cli(args: List[str], timeout: int = 60) -> dict:
  """统一调用 lark-cli，返回解析后的 JSON"""
  cmd = [LARK_CLI] + args
  print(f"  🔧 执行: {' '.join(cmd)}")

  result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

  if result.returncode != 0:
    raise RuntimeError(f"lark-cli 失败: {result.stderr.strip() or result.stdout.strip()}")

  try:
    return json.loads(result.stdout)
  except json.JSONDecodeError:
    return {"raw": result.stdout.strip()}


def upload_video_to_feishu(video_path: str, context: Dict[str, Any]) -> str:
  """上传视频到飞书云空间（Bot 身份——有上传权限）"""
  video_file = Path(video_path)
  if not video_file.exists():
    raise FileNotFoundError(f"视频文件不存在: {video_path}")

  video_dir = video_file.parent
  video_name = video_file.name

  try:
    original_cwd = os.getcwd()
    os.chdir(video_dir)

    try:
      data = run_lark_cli([
        "drive", "+upload",
        "--file", video_name,
        "--folder-token", FOLDER_TOKEN,
        "--as", "bot"
      ])
    finally:
      os.chdir(original_cwd)

    file_token = data.get("file_token") or data.get("token") or data.get("id")
    if not file_token and isinstance(data.get("data"), dict):
      file_token = data["data"].get("file_token") or data["data"].get("token")
    if not file_token:
      raise ValueError(f"响应中缺少 file_token: {data}")

    print(f"  ✅ 视频上传成功: token={file_token}")
    context["video_token"] = file_token
    context["video_file_id"] = file_token
    return file_token

  except Exception as e:
    print(f"  ❌ 上传失败: {e}")
    raise


def create_feishu_doc(title: str, key_points: List[str], scripts: List[str], video_token: str, context: Dict[str, Any]) -> str:
  """创建飞书文档（User 身份——Bot 对文件夹无创建权限）"""
  content_lines = [
    f"# {title}",
    "",
    "## 视频概览",
    f"- 页数：{len(key_points)}",
    f"- 时长：约 {len(scripts) * 30} 秒",
    f"- 分辨率：1920×1080",
    "",
    "---",
    "",
    "## 内容导览",
    "",
    "| 页码 | 主题 | 关键词 |",
    "|------|------|--------|",
  ]

  for i, (point, script) in enumerate(zip(key_points, scripts)):
    keywords = "".join(w for w in point[:10] if w not in "，。、；：「」''\"\"") if point else ""
    content_lines.append(f"| {i+1} | {point} | {keywords} |")

  content_lines.extend([
    "",
    "---",
    "",
    "## 逐字稿",
    ""
  ])

  for i, (point, script) in enumerate(zip(key_points, scripts)):
    content_lines.append(f"### 第 {i+1} 页：{point}")
    content_lines.append("")
    content_lines.append(script)
    content_lines.append("")
    content_lines.append("---")
    content_lines.append("")

  content_lines.extend([
    "",
    "---",
    "",
    "## 原始视频",
    f"<video src=\"https://open.feishu.cn/open-apis/drive/v1/files/{video_token}/video_url\" controls width=\"800\"></video>",
    "",
    "> 视频文件已上传至飞书云空间「AI新鲜事」文件夹"
  ])

  content = "\n".join(content_lines)

  try:
    # ⚠️  用 user 身份（Bot 只有上传权限，无文件夹创建权限）
    data = run_lark_cli([
      "docs", "+create",
      "--title", title,
      "--markdown", content,
      "--folder-token", FOLDER_TOKEN,
      "--as", "user"
    ])

    doc_url = data.get("url") or (data.get("data") or {}).get("doc_url") or (data.get("data") or {}).get("url") or data.get("link")
    if not doc_url:
      raise ValueError(f"响应中缺少文档 URL: {data}")

    print(f"  ✅ 文档创建成功: {doc_url}")
    context["doc_url"] = doc_url
    return doc_url

  except Exception as e:
    print(f"  ❌ 文档创建失败: {e}")
    raise


def step7_doc(key_points: List[str], scripts: List[str], video_token: str, context: Dict[str, Any]) -> str:
  """Step 7: 创建飞书文档 + 关联视频"""
  print(f"\n📄 Step 7: 创建飞书文档...")

  if not video_token:
    print("  ℹ️  视频未上传，开始上传...")
    if "video_path" not in context:
      raise ValueError("context 中缺少 video_path")
    video_path = context["video_path"]
    video_token = upload_video_to_feishu(video_path, context)

  if not video_token:
    raise ValueError("video_token 为空")

  title = f"AI 视频稿 {context.get('date', '2026-04-06')}"
  doc_url = create_feishu_doc(title, key_points, scripts, video_token, context)

  return doc_url


if __name__ == "__main__":
  ctx = {"video_path": str(VIDEO_PATH), "date": "2026-04-06"}
  if not VIDEO_PATH.exists():
    print(f"⚠️  测试视频不存在: {VIDEO_PATH}")
  else:
    try:
      result = step7_doc(["测试要点"], ["测试稿"], None, ctx)
      print(f"✅ Step 7 测试成功: {result}")
    except Exception as e:
      print(f"❌ Step 7 测试失败: {e}")
