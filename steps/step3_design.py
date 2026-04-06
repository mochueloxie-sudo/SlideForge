"""
Step 3: 确定视觉风格（纯内置规则）

职责：
1. 从 context 读取 content_type、audience_inferred、design_recommendation
2. 根据 design_mode 获取基础参数
3. 应用受众适配策略
4. 返回 design_params 并保存到 context
"""

from typing import Dict, Any

def get_optimized_params(content_type: str) -> Dict[str, Any]:
  """optimized 模式参数（增强版）"""
  base = {
    "colors": {
      "background": "#0a0a12",
      "primary": "#8b5cf6",
      "accent": "#14b8a6",  # 青色强调
      "text_main": "#ffffff",
      "text_secondary": "#94a3b8",
      "code_bg": "rgba(139,92,246,0.1)",
      "code_border": "rgba(139,92,246,0.2)"
    },
    "typography": {
      "title": {"size": 72, "font": "Space Grotesk", "weight": 700},  # 封面
      "heading": {"size": 52, "font": "Space Grotesk", "weight": 700},  # 内容页
      "subheading": {"size": 32, "font": "Space Grotesk", "weight": 600},
      "body": {"size": 22, "font": "PingFang SC", "weight": 400, "line_height": 1.6},
      "code": {"size": 18, "font": "SF Mono, Consolas, monospace"}
    },
    "layout": {
      "max_width": 1500,
      "spacing": "normal",
      "decoration_count": 2  # 可 1-2 个装饰
    },
    "special_elements": {
      "numbers": "xl",  # 数字大字号
      "code_styling": "enhanced",
      "quotes": "purple-left-border",
      "key_points": "callout-box"
    }
  }
  
  # 根据内容类型微调
  if content_type == "技术文档":
    base["layout"]["spacing"] = "compact"
    base["special_elements"]["code_styling"] = "enhanced"
  elif content_type == "商业报告":
    base["special_elements"]["kpi_cards"] = True
  elif content_type == "教学材料":
    base["special_elements"]["show_step_numbers"] = True
  
  return base

def get_default_params(content_type: str) -> Dict[str, Any]:
  """default 模式参数（基础版）"""
  return {
    "colors": {
      "background": "#0a0a12",
      "primary": "#8b5cf6",
      "accent": None,
      "text_main": "#ffffff",
      "text_secondary": "#94a3b8"
    },
    "typography": {
      "title": {"size": 60, "font": "Space Grotesk", "weight": 700},
      "heading": {"size": 48, "font": "Space Grotesk", "weight": 700},
      "body": {"size": 20, "font": "PingFang SC", "weight": 400, "line_height": 1.5},
      "code": {"size": 16, "font": "SF Mono, Consolas, monospace"}
    },
    "layout": {
      "max_width": 1400,
      "spacing": "normal",
      "decoration_count": 1
    },
    "special_elements": {}
  }

def get_minimal_params(content_type: str) -> Dict[str, Any]:
  """minimal 模式参数（极简）"""
  return {
    "colors": {
      "background": "#0a0a12",
      "primary": "#8b5cf6",
      "accent": None,
      "text_main": "#ffffff",
      "text_secondary": "#94a3b8"
    },
    "typography": {
      "title": {"size": 48, "font": "Space Grotesk", "weight": 700},
      "heading": {"size": 40, "font": "Space Grotesk", "weight": 600},
      "body": {"size": 18, "font": "PingFang SC", "weight": 400, "line_height": 1.4},
      "code": {"size": 16, "font": "SF Mono, Consolas, monospace"}
    },
    "layout": {
      "max_width": 1200,
      "spacing": "compact",
      "decoration_count": 0  # 无装饰
    },
    "special_elements": {}
  }

def apply_audience_strategy(params: Dict[str, Any], audience: str, content_type: str) -> Dict[str, Any]:
  """根据受众类型微调设计参数"""
  
  if audience == "general":
    # 非设计师：保守、简洁
    params["layout"]["spacing"] = "comfortable"
    params["typography"]["body"]["size"] = min(params["typography"]["body"]["size"], 20)
  
  elif audience == "students":
    # 学生：教学友好
    params["layout"]["show_step_numbers"] = True
    params["special_elements"]["key_point_highlight"] = "callout"
    params["typography"]["title"]["size"] = max(params["typography"]["title"]["size"], 56)
  
  elif audience in ("executives", "managers"):
    # 高管：数据驱动
    params["layout"]["priority"] = "data-first"
    params["special_elements"]["numbers"] = "xl"
    params["special_elements"]["kpi_cards"] = True
    params["special_elements"]["content_density"] = "low"
  
  elif audience in ("developers", "technical"):
    # 开发者：技术细节
    params["special_elements"]["code_styling"] = "enhanced"
    params["typography"]["code"]["size"] = 20
    params["special_elements"]["show_arch_diagram"] = True
  
  elif audience == "internal":
    # 内部团队：高密度
    params["layout"]["columns"] = "multi"
    params["special_elements"]["content_density"] = "high"
    params["special_elements"]["show_checkboxes"] = True
  
  return params

def step3_get_design_params(content_type: str, design_mode: str, audience_inferred: str, context: Dict[str, Any]) -> Dict[str, Any]:
  """
  生成设计参数
  
  输入：
    - content_type: 内容类型（来自 Step 0）
    - design_mode: 设计模式（用户指定或默认 "optimized"）
    - audience_inferred: 受众（来自 Step 0）
    - context: 全局上下文（可读取 design_recommendation）
  
  输出：
    - design_params: dict，包含 colors/typography/layout/special_elements
  
  自动应用规则：
    如果 design_mode == "optimized" 且 design_recommendation != "optimized"，
    则覆盖 design_mode = design_recommendation
  
  保存到 context：
    - context["design_params"] = design_params
  """
  
  # 1. 自动应用 Step 0 推荐
  design_recommendation = context.get("design_recommendation", "optimized")
  if design_mode == "optimized" and design_recommendation in ("default", "minimal"):
    design_mode = design_recommendation
  
  # 2. 获取基础参数
  if design_mode == "optimized":
    base_params = get_optimized_params(content_type)
    base_params["source"] = "builtin-optimized"
  elif design_mode == "default":
    base_params = get_default_params(content_type)
    base_params["source"] = "builtin-default"
  elif design_mode == "minimal":
    base_params = get_minimal_params(content_type)
    base_params["source"] = "builtin-minimal"
  else:
    raise ValueError(f"Unknown design_mode: {design_mode}")
  
  # 3. 应用受众适配
  adjusted_params = apply_audience_strategy(base_params, audience_inferred, content_type)
  
  # 4. 记录策略来源
  adjusted_params["audience_applied"] = audience_inferred
  adjusted_params["design_mode_used"] = design_mode
  if design_mode != design_recommendation:
    adjusted_params["design_recommendation_override"] = design_recommendation
  
  # 5. 保存到上下文
  context["design_params"] = adjusted_params
  
  return adjusted_params

if __name__ == "__main__":
  # 测试
  ctx = {
    "content_type": "技术文档",
    "audience_inferred": "developers",
    "design_recommendation": "minimal"
  }
  params = step3_get_design_params(ctx["content_type"], "optimized", ctx["audience_inferred"], ctx)
  print("Step 3 输出设计参数:")
  print(json.dumps(params, indent=2, ensure_ascii=False))
