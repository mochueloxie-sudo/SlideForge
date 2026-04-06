#!/usr/bin/env python3
"""
Step 0: 内容分析 + 视觉风格推荐（支持多源文档）

职责：
1. 读取文档内容（飞书文档 / 公开网页 / 本地文件）
2. 分析内容类型、受众、设计推荐
3. 供后续步骤使用
"""

import re
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Optional

# 文档读取器注册表
READERS = {}


def register_reader(scheme: str):
  """装饰器：注册文档读取器"""
  def decorator(func):
    READERS[scheme] = func
    return func
  return decorator


@register_reader("file")
def read_local_file(url: str) -> str:
  """读取本地文件（file:// 或 绝对路径）"""
  path = url.replace("file://", "")
  if not Path(path).exists():
    raise FileNotFoundError(f"本地文件不存在: {path}")
  return Path(path).read_text(encoding="utf-8")


@register_reader("http")
@register_reader("https")
def read_web_page(url: str) -> str:
  """读取公开网页（用 curl 或 Python requests）"""
  try:
    import urllib.request
    with urllib.request.urlopen(url, timeout=10) as resp:
      charset = resp.headers.get_content_charset() or "utf-8"
      return resp.read().decode(charset, errors="replace")
  except Exception as e:
    raise RuntimeError(f"网页读取失败: {e}")


@register_reader("feishu")
@register_reader("lark")
def read_feishu_doc(url: str) -> str:
  """读取飞书文档（用 lark-cli）"""
  # 提取 token：支持 /docx/xxx 或 ?file_token=xxx
  token = None
  if "/docx/" in url:
    token = url.split("/docx/")[1].split("?")[0].split("/")[0]
  elif "file_token=" in url:
    token = url.split("file_token=")[1].split("&")[0]
  
  if not token:
    raise ValueError(f"无法从 URL 提取飞书文档 token: {url}")
  
  # 调用 lark-cli 读取文档
  LARK_CLI = "/Users/teeclaw/.nvm/versions/node/v24.14.1/lib/node_modules/@larksuite/cli/bin/lark-cli"
  
  try:
    result = subprocess.run(
      [LARK_CLI, "docs", "+read", "--file-token", token, "--as", "bot"],
      capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
      raise RuntimeError(f"lark-cli 读取失败: {result.stderr}")
    
    data = json.loads(result.stdout)
    # 返回文档内容（Markdown 或纯文本）
    return data.get("content") or data.get("markdown") or json.dumps(data, ensure_ascii=False)
  except FileNotFoundError:
    raise RuntimeError("lark-cli 未找到，请确认安装并配置")
  except Exception as e:
    raise RuntimeError(f"飞书文档读取异常: {e}")


def detect_scheme(url: str) -> Optional[str]:
  """检测 URL 协议类型"""
  if url.startswith("file://") or (url.startswith("/") and not url.startswith("//")):
    return "file"
  elif url.startswith("http://") or url.startswith("https://"):
    return "https" if url.startswith("https://") else "http"
  elif "/docx/" in url or "feishu.cn/docx" in url or "larksuite.com/docx" in url:
    return "feishu"
  else:
    return None


def read_document(url: str) -> str:
  """统一文档读取入口"""
  scheme = detect_scheme(url)
  if not scheme:
    raise ValueError(f"不支持的文档格式: {url}（支持：file://, http(s)://, 飞书 docx 链接）")
  
  reader = READERS.get(scheme)
  if not reader:
    raise ValueError(f"未注册读取器: {scheme}")
  
  print(f"  📄 读取文档 [{scheme}]: {url[:60]}...")
  content = reader(url)
  print(f"  ✅ 读取成功（{len(content)} 字符）")
  return content


def step0_analyze(document_url: str, audience: str, context: Dict[str, Any]) -> Dict[str, Any]:
  """Step 0: 分析文档内容"""
  print("\n🔍 Step 0: 内容分析...")
  
  # 1. 读取文档
  content = read_document(document_url)
  
  # 保存原文（供后续步骤使用）
  context["full_content"] = content
  context["document_url"] = document_url
  
  # 截取前 2000 字符用于分析（避免太长）
  sample = content[:2000]
  sample_lower = sample.lower()
  
  # 2. 内容类型检测（基于关键词 + 结构）
  content_type = guess_content_type(sample, content_lower=sample_lower)
  print(f"  内容类型: {content_type}")
  
  # 3. 受众推断
  if audience == "auto":
    audience_map = {
      "技术文档": "developers",
      "商业报告": "executives",
      "教学材料": "students",
      "产品介绍": "general",
      "品牌故事": "general",
      "其他": "general"
    }
    audience_inferred = audience_map.get(content_type, "general")
  else:
    audience_inferred = audience
  
  print(f"  推断受众: {audience_inferred}")
  
  # 4. 设计推荐
  design_map = {
    "技术文档": "default",
    "商业报告": "optimized",
    "教学材料": "default",
    "产品介绍": "optimized",
    "品牌故事": "minimal",
    "其他": "optimized"
  }
  design_recommendation = design_map.get(content_type, "optimized")
  print(f"  推荐设计: {design_recommendation}")
  
  return {
    "content_type": content_type,
    "audience_inferred": audience_inferred,
    "design_recommendation": design_recommendation,
    "content_preview": content[:200]
  }


def guess_content_type(sample: str, content_lower: str = None) -> str:
  """猜测文档类型（基于关键词 + 结构）"""
  if content_lower is None:
    content_lower = sample.lower()
  
  # 特征词权重
  scores = {
    "技术文档": 0,
    "商业报告": 0,
    "教学材料": 0,
    "产品介绍": 0,
    "品牌故事": 0
  }
  
  # 技术文档特征
  tech_keywords = ["代码", "函数", "API", "接口", "配置", "cursor.composer", "devin", "```", "def ", "class ", "import "]
  for kw in tech_keywords:
    if kw in content_lower or kw in sample:
      scores["技术文档"] += 2 if kw in sample else 1
  
  # 商业报告特征
  biz_keywords = ["营收", "增长", "用户", "市场", "竞争", "财务", "数据", "提升", "百分比", "%", "万元", "亿元"]
  for kw in biz_keywords:
    if kw in content_lower or kw in sample:
      scores["商业报告"] += 2 if kw in sample else 1
  
  # 教学材料特征
  edu_keywords = ["教程", "步骤", "学习", "课程", "指南", "如何", "首先", "然后", "最后", "注意"]
  for kw in edu_keywords:
    if kw in content_lower or kw in sample:
      scores["教学材料"] += 2 if kw in sample else 1
  
  # 产品介绍特征
  product_keywords = ["产品", "功能", "体验", "截图", "界面", "案例", "用户评价", "试用", "下载"]
  for kw in product_keywords:
    if kw in content_lower or kw in sample:
      scores["产品介绍"] += 2 if kw in sample else 1
  
  # 品牌故事特征
  brand_keywords = ["创始人", "愿景", "使命", "价值观", "初心", "历程", "故事", "成立于", "成立于"]
  for kw in brand_keywords:
    if kw in content_lower or kw in sample:
      scores["品牌故事"] += 2 if kw in sample else 1
  
  # 取最高分
  best_type = max(scores, key=scores.get)
  best_score = scores[best_type]
  
  # 如果分数太低，返回"其他"
  if best_score < 3:
    return "其他"
  
  return best_type


if __name__ == "__main__":
  # 测试多种文档读取
  test_cases = [
    ("file", "/tmp/test.txt"),
    ("https", "https://example.com"),
    ("feishu", "https://www.feishu.cn/docx/doxcnxxxxx")
  ]
  
  ctx = {}
  for scheme, url in test_cases:
    try:
      print(f"\n测试 [{scheme}]: {url}")
      result = step0_analyze(url, "auto", ctx)
      print(f"  结果: {result['content_type']} / {result['audience_inferred']}")
    except Exception as e:
      print(f"  ❌ 失败: {e}")
