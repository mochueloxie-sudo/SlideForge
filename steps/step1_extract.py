"""
Step 1: 提炼核心要点（从真实文档内容提取）

职责：
1. 读取 context 中的文档全文（来自 Step 0）
2. 提取 Markdown 二级标题（## 标题）作为要点候选
3. 过滤噪声标题（附录、参考资料等）
4. 输出 8-12 个核心观点
5. 保存到 context["key_points"]
"""

import re
from typing import Dict, Any, List

def clean_title(title: str) -> str:
  """清理标题：去掉 emoji、markdown 符号、多余空格"""
  # 去掉开头的 emoji（如 📊、💡 等）
  title = re.sub(r'^\W+\s*', '', title)
  # 去掉 ** 加粗标记
  title = re.sub(r'\*\*', '', title)
  # 去掉末尾的 # 号（如果有）
  title = title.rstrip('#').strip()
  return title


def is_noise_title(title: str) -> bool:
  """判断是否为噪声标题（应过滤）"""
  noise_keywords = [
    "附录", "参考资料", "参考", "目录", "总结", "结语",
    "详细数据", "数据见附录", "Q&A", "问题", "谢谢",
    "感谢", "致谢", "备注", "说明", "注释"
  ]
  title_lower = title.lower()
  return any(kw in title_lower for kw in noise_keywords)


def step1_extract(content_type: str, audience_inferred: str, context: Dict[str, Any]) -> List[str]:
  """
  从文档内容中提炼核心要点
  
  输入：
    - content_type: 内容类型
    - audience_inferred: 目标受众
    - context: 包含 full_content (Step 0 读取的全文)
  
  输出：
    - key_points: List[str]，8-12 个页面标题
  """
  
  full_content = context.get("full_content", "")
  if not full_content:
    raise ValueError("Step 0 未读取文档内容，context 中缺少 full_content")
  
  print(f"  原文长度: {len(full_content)} 字符")
  
  # === 1. 提取 Markdown 二级标题（## 标题）===
  headings = re.findall(r'^##\s+(.+)$', full_content, re.MULTILINE)
  print(f"  找到 {len(headings)} 个二级标题")
  
  # === 2. 清理 + 过滤 ===
  cleaned = []
  for h in headings:
    title = clean_title(h)
    if len(title) < 2:  # 太短跳过
      continue
    if is_noise_title(title):
      print(f"    ⚠️  过滤噪声标题: {title}")
      continue
    if title not in cleaned:
      cleaned.append(title)
  
  print(f"  过滤后: {len(cleaned)} 个有效标题")
  
  # === 3. 数量调整（8-12 个）===
  if len(cleaned) >= 8:
    key_points = cleaned[:12]  # 最多取前 12 个
  else:
    # 不足 8 个：从一级标题或首段补充
    h1s = re.findall(r'^#\s+(.+)$', full_content, re.MULTILINE)
    h1_clean = [clean_title(h) for h in h1s if not is_noise_title(clean_title(h))]
    if h1_clean:
      key_points = cleaned + h1_clean[:8-len(cleaned)]
    else:
      # 实在不够，重复最后一个凑数（不完美但保底）
      key_points = cleaned + [cleaned[-1]] * (8 - len(cleaned))
  
  # 确保不超过 12
  key_points = key_points[:12]
  
  print(f"  最终提炼: {len(key_points)} 个要点")
  for i, p in enumerate(key_points, 1):
    print(f"    {i:02d}. {p}")
  
  # === 4. 保存 ===
  context["key_points"] = key_points
  context["content_type"] = content_type  # 确保存在
  
  return key_points


if __name__ == "__main__":
  # 测试
  test_md = """# 标题
  
## 核心数据摘要
内容...

## 营收增长分析
内容...

## 详细数据见附录
跳过这个...

## 用户增长趋势
内容...
"""
  ctx = {"full_content": test_md}
  result = step1_extract("商业报告", "executives", ctx)
  print("\n测试结果:", result)
  # 期望: ['核心数据摘要', '营收增长分析', '用户增长趋势']
