"""
Step 2: 生成逐字稿（LLM 驱动）

职责：
1. 读取文档全文和核心要点（来自 Step 0/1）
2. 为每个要点生成 150-200 字的逐字稿
3. 根据受众调整语气和详略
4. 保存到 context["scripts"]
"""

import os
from typing import Dict, Any, List
from llm_client import LLMClient, get_llm_client


def build_script_prompt(point: str, context: Dict[str, Any], audience: str, page_num: int, total_pages: int) -> str:
  """构建生成逐字稿的提示词"""
  
  full_content = context.get("full_content", "")
  content_type = context.get("content_type", "其他")
  
  # 提取与当前要点相关的段落（简单：找要点标题后的内容）
  # 假设文档是 Markdown，格式为 "## point\n内容..."
  relevant_text = ""
  lines = full_content.split('\n')
  found = False
  for line in lines:
    if f"## {point}" in line or point in line:
      found = True
      continue
    if found:
      if line.startswith("## "):  # 下一个标题，停止
        break
      relevant_text += line + "\n"
  
  # 截取相关文本（最多 1000 字）
  relevant_text = relevant_text[:1000].strip()
  
  # 受众语气指导
  tone_guides = {
    "executives": "面向高管：简洁直接，先说结论，强调关键数字和决策点，避免细节",
    "developers": "面向开发者：保留技术术语，讲解实现逻辑，可提及代码/架构",
    "students": "面向学生：教学语气，用比喻，一步步解释，鼓励思考",
    "internal": "面向内部团队：高效，明确行动项，聚焦执行",
    "general": "面向大众：通俗易懂，故事化表达，避免行话"
  }
  
  tone = tone_guides.get(audience, tone_guides["general"])
  
  # 页面位置提示
  if page_num == 1:
    position_guide = "这是第一页，需要开场白：'大家好，今天我们要讲：{point}。'"
  elif page_num == total_pages:
    position_guide = "这是最后一页，需要总结收尾：'总结：...'"
  else:
    position_guide = f"这是第 {page_num}/{total_pages} 页，用'接下来，{point}。'过渡"
  
  prompt = f"""你是一位专业演示者，正在制作一份视频演示稿的逐字稿。

**任务：** 为以下页面生成 150-200 字的口语化讲解稿。

**页面信息：**
- 标题：{point}
- 内容类型：{content_type}
- 受众：{audience}
- 语气要求：{tone}
- {position_guide}

**参考文档（相关段落）：**
{relevant_text if relevant_text else "（文档未提供详细内容，请根据标题合理展开）"}

**格式要求：**
1. 开头：根据页面位置使用合适的开场白
2. 主体：围绕标题展开，口语化，有节奏感
3. 结尾：最后一页要有总结，其他页自然过渡到下一页
4. 字数：150-200 字

**输出：** 只返回逐字稿正文（不要包含"第 X 页"等标记）"""
  
  return prompt


def step2_script(key_points: List[str], audience_inferred: str, context: Dict[str, Any]) -> List[str]:
  """
  为每个要点生成逐字稿（LLM 驱动）
  
  输入：
    - key_points: 8-12 个页面标题
    - audience_inferred: 目标受众
    - context: 包含 full_content (Step 0 读取的全文)
  
  输出：
    - scripts: List[str]，每页 150-200 字的逐字稿
  
  保存到 context：
    - context["scripts"] = scripts
    - context["llm_provider"]: 使用的 LLM 提供商
  """
  
  full_content = context.get("full_content", "")
  if not full_content:
    raise ValueError("Step 0 未读取文档内容，context 中缺少 full_content")
  
  print(f"\n🎙️  Step 2: 生成逐字稿（LLM 驱动）...")
  
  # 初始化 LLM 客户端（优先用环境变量 LLM_PROVIDER）
  provider = os.environ.get("LLM_PROVIDER", "stepfun")  # 默认 stepfun（你已有 key）
  try:
    llm = LLMClient(provider=provider)
    print(f"  LLM 提供商: {llm.provider} / 模型: {llm.model}")
  except Exception as e:
    print(f"  ⚠️  LLM 客户端初始化失败: {e}")
    print(f"  ℹ️  降级为模板生成（无 LLM）")
    return step2_script_fallback(key_points, audience_inferred, context)
  
  scripts = []
  total_pages = len(key_points)
  
  for i, point in enumerate(key_points, 1):
    print(f"  生成第 {i}/{total_pages} 页: {point[:40]}...")
    
    # 构建 prompt
    prompt = build_script_prompt(point, context, audience_inferred, i, total_pages)
    
    try:
      # 调用 LLM
      script = llm.generate(
        prompt=prompt,
        system="你是一位专业的内容创作者，擅长将复杂内容转化为易懂的口头讲解。",
        max_tokens=400,  # 200 字约 400 tokens
        temperature=0.7
      )
      
      # 清理输出（去掉可能的标记）
      script = script.strip()
      if script.startswith('"') and script.endswith('"'):
        script = script[1:-1]
      
      scripts.append(script)
      print(f"  ✅ 第 {i} 页生成成功（{len(script)} 字）")
      
    except Exception as e:
      print(f"  ❌ LLM 生成失败: {e}")
      print(f"  ⚠️  降级为模板")
      fallback = step2_script_fallback([point], audience_inferred, context)[0]
      scripts.append(fallback)
  
  # 保存到上下文
  context["scripts"] = scripts
  context["llm_provider"] = llm.provider
  context["llm_model"] = llm.model
  
  print(f"\n  ✅ 逐字稿生成完成（{len(scripts)} 页）")
  return scripts


def step2_script_fallback(key_points: List[str], audience_inferred: str, context: Dict[str, Any]) -> List[str]:
  """降级方案：模板生成（当 LLM 不可用时）"""
  scripts = []
  
  tone_templates = {
    "executives": {"opener": "各位高管，今天核心结论是：", "closing": "总结：这是我们的关键洞察。"},
    "developers": {"opener": "让我们深入技术细节：", "closing": "更多细节请参考文档。"},
    "students": {"opener": "我们来一步步理解：", "closing": "大家有什么问题？"},
    "internal": {"opener": "团队同步：", "closing": "下一步：执行。"},
    "general": {"opener": "今天我们来聊聊：", "closing": "感谢收听。"}
  }
  
  tone = tone_templates.get(audience_inferred, tone_templates["general"])
  
  for i, point in enumerate(key_points):
    if i == 0:
      script = f"大家好，今天我们要讲：{point}。{tone['opener']}\n\n"
    elif i == len(key_points) - 1:
      script = f"最后，{point}。\n\n{tone['closing']}"
    else:
      script = f"接下来，{point}。\n\n"
    
    # 简单模板内容
    script += f"{point}数据显示，本季度我们实现了显著增长。核心数据已高亮显示，详情可参考后续章节。"
    scripts.append(script)
  
  return scripts


if __name__ == "__main__":
  # 测试
  ctx = {
    "full_content": open("/tmp/real-report.md").read(),
    "content_type": "商业报告"
  }
  
  # 测试 LLM（需要配置 API key）
  # llm = LLMClient(provider="minimax")
  # result = llm.generate("测试", "系统提示")
  # print(result)
  
  # 测试降级模板
  scripts = step2_script_fallback(["要点1", "要点2"], "executives", ctx)
  for s in scripts:
    print(f"📝 {s[:60]}...")
