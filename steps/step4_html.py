"""
Step 4: 生成 HTML + Puppeteer 截图

职责：
1. 读取 key_points（页面标题）和 scripts（逐字稿）
2. 检测每页的内容模式（code、numbers、timeline 等）
3. 根据 design_params 和内容模式生成 HTML
4. 保存 HTML 文件，供 Puppeteer 截图
"""

import os
import re
from typing import Dict, Any, List
from pathlib import Path

TEMP_DIR = Path("/tmp/video-producer-slides")
TEMP_DIR.mkdir(parents=True, exist_ok=True)


# ============ 内容模式检测 ============

def detect_content_patterns(page_content: str, key_point: str, content_type: str) -> List[str]:
  """检测页面中出现的特定内容模式"""
  patterns = []
  text_lower = page_content.lower()
  key_lower = key_point.lower()

  # 1. 代码模式
  code_indicators = ["```", "function", "class", "def ", "import ", "API", "接口", "cursor.composer", "devin", "代码"]
  if any(ind in text_lower or ind in key_lower for ind in code_indicators):
    patterns.append("code")

  # 2. 数字模式
  if re.search(r'\b\d+(?:\.\d+)?[xX%年亿万千]?\b', page_content):
    if any(w in text_lower for w in ["增长", "提升", "达到", "超过"]):
      patterns.append("numbers")

  # 3. 时间线模式
  years = re.findall(r'\b(19|20)\d{2}\b', page_content)
  time_words = sum(1 for w in ["首先", "然后", "最终", "此后", "起源于", "发展于"] if w in text_lower)
  if len(years) >= 3 or time_words >= 3:
    patterns.append("timeline")

  # 4. 对比模式
  if any(ind in text_lower for ind in ["vs", "对比", "AB测试", "比较", "优势", "劣势"]):
    patterns.append("comparison")

  # 5. 引用模式
  if '>' in page_content or any(w in text_lower for w in ["表示", "说道", "回忆道", "指出"]):
    patterns.append("quote")

  # 6. 核心观点
  if any(w in text_lower for w in ["总结", "核心", "关键", "结论", "最重要的是"]):
    patterns.append("key_point")

  # 7. 产品介绍
  if content_type == "产品介绍":
    if any(ind in text_lower or ind in key_lower for ind in ["截图", "界面", "功能", "体验", "案例"]):
      patterns.append("product_showcase")

  # 8. 品牌故事
  if content_type == "品牌故事":
    if any(ind in text_lower or ind in key_lower for ind in ["创始人", "故事", "愿景", "使命", "价值观"]):
      patterns.append("brand_story")

  return patterns


# ============ HTML 生成 ============

def generate_html_slide(page_index: int, key_point: str, script: str, design_params: Dict[str, Any], patterns: List[str], content_type: str) -> str:
  """生成单页 HTML"""

  colors = design_params["colors"]
  typography = design_params["typography"]
  layout = design_params["layout"]
  special = design_params.get("special_elements", {})

  # --- 基础结构 ---
  html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>第{page_index+1}页：{key_point}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      background: {colors["background"]};
      font-family: {typography["body"]["font"]};
      color: {colors["text_main"]};
      overflow: hidden;
    }}
    .container {{
      max-width: {layout["max_width"]}px;
      margin: 0 auto;
      padding: 40px;
      position: relative;
      height: 100%;
      box-sizing: border-box;
    }}
    .glow {{
      position: absolute;
      width: 300px;
      height: 300px;
      background: {colors["primary"]};
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.15;
      top: -80px;
      right: 100px;
    }}
    .tag {{
      display: inline-block;
      background: {colors["primary"]};
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 18px;
      margin-bottom: 20px;
    }}
    h1 {{
      font-family: {typography["title"]["font"]};
      font-size: {typography["title"]["size"]}px;
      font-weight: {typography["title"]["weight"]};
      margin: 0 0 30px 0;
      line-height: 1.2;
    }}
    .content {{
      font-size: {typography["body"]["size"]}px;
      line-height: {typography["body"]["line_height"]};
      color: {colors["text_main"]};
    }}
    .code {{
      font-family: {typography["code"]["font"]};
      font-size: {typography["code"]["size"]}px;
      background: {colors["code_bg"]};
      border: 1px solid {colors["code_border"]};
      border-radius: 6px;
      padding: 4px 12px;
      display: inline-block;
      margin: 5px 0;
    }}
    .highlight-number {{
      font-size: 64px;
      font-weight: 700;
      color: {colors.get("accent", "#14b8a6")};
      display: block;
      margin: 10px 0;
    }}
    .quote {{
      border-left: 4px solid {colors["primary"]};
      padding-left: 20px;
      margin: 20px 0;
      color: {colors["text_secondary"]};
      font-style: italic;
    }}
    .key-point {{
      background: rgba(20,184,166,0.1);
      border: 2px solid rgba(20,184,166,0.3);
      border-radius: 12px;
      padding: 25px 40px;
      text-align: center;
      font-size: 28px;
      color: #2dd4bf;
      font-weight: 600;
      margin: 30px 0;
    }}
    .product-screenshot {{
      border: 2px solid {colors["primary"]};
      border-radius: 12px;
      padding: 10px;
      margin: 20px auto;
      max-width: 80%;
      text-align: center;
    }}
    .cta-button {{
      display: inline-block;
      background: {colors["primary"]};
      color: white;
      padding: 15px 40px;
      border-radius: 12px;
      font-size: 20px;
      font-weight: 600;
      margin: 20px 0;
    }}
    .timeline {{
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin: 40px 0;
      position: relative;
    }}
    .timeline::before {{
      content: "";
      position: absolute;
      top: 50%;
      left: 10%;
      right: 10%;
      height: 2px;
      background: {colors["primary"]};
      z-index: 0;
    }}
    .timeline-node {{
      width: 60px;
      height: 60px;
      background: {colors["primary"]};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      z-index: 1;
      position: relative;
    }}
    .timeline-label {{
      margin-top: 10px;
      font-size: 18px;
      color: {colors["text_secondary"]};
    }}
    .comparison {{
      display: flex;
      gap: 40px;
      margin: 30px 0;
    }}
    .comparison-left, .comparison-right {{
      flex: 1;
      padding: 20px;
      border-radius: 12px;
      background: rgba(139,92,246,0.05);
      border: 1px solid rgba(139,92,246,0.2);
    }}
    .comparison-left h3, .comparison-right h3 {{
      margin-top: 0;
      color: {colors["primary"]};
    }}
  </style>
</head>
<body>
  <div class="glow"></div>
'''

  if layout.get("decoration_count", 1) >= 2:
    html += '  <div class="glow-2"></div>\n'

  html += f'''
  <div class="container">
    <div class="tag">{content_type}</div>
    <h1>{key_point}</h1>
    <div class="content">
'''

  # --- 处理逐字稿文本 ---
  script_processed = script

  # 数字高亮
  if "numbers" in patterns:
    script_processed = re.sub(r'(\d+(?:\.\d+)?[xX%年亿万千]?)', r'<span class="highlight-number">\1</span>', script_processed)

  # 代码高亮（简单替换）
  if "code" in patterns:
    code_keywords = ["API", "function", "class", "cursor.composer", "Devin", "代码"]
    for kw in code_keywords:
      script_processed = script_processed.replace(kw, f'<span class="code">{kw}</span>')

  # 引用处理
  if "quote" in patterns:
    quoted_lines = []
    for line in script_processed.split('\n'):
      if any(w in line for w in ["表示", "说道", "回忆道", "指出"]):
        quoted_lines.append(f'  <div class="quote">{line}</div>')
      else:
        quoted_lines.append(f'  <p>{line}</p>')
    script_processed = '\n'.join(quoted_lines)
  else:
    paragraphs = script_processed.split('\n')
    script_processed = '\n  '.join(f'<p>{p}</p>' for p in paragraphs if p.strip())

  html += script_processed

  # --- 特殊元素 ---
  if "key_point" in patterns or page_index == 7:
    html += f'''
    <div class="key-point">
      {key_point}
    </div>
    '''

  if "product_showcase" in patterns and content_type == "产品介绍":
    html += f'''
    <div class="product-screenshot">
      <img src="placeholder.png" alt="产品截图" style="max-width:100%;">
      <p style="margin:10px 0;color:{colors["text_secondary"]};">产品界面展示</p>
    </div>
    <div class="cta-button">立即试用</div>
    '''

  if "brand_story" in patterns and content_type == "品牌故事":
    html += f'''
    <blockquote style="font-size:24px;color:{colors["text_secondary"]};text-align:center;margin:30px 0;">
      "我们的初心是……"
      <br>—— 创始人
    </blockquote>
    '''

  if "timeline" in patterns:
    html += f'''
    <div class="timeline">
      <div><div class="timeline-node">2020</div><div class="timeline-label">起步</div></div>
      <div><div class="timeline-node">2022</div><div class="timeline-label">成长</div></div>
      <div><div class="timeline-node">2024</div><div class="timeline-label">爆发</div></div>
    </div>
    '''

  if "comparison" in patterns:
    html += f'''
    <div class="comparison">
      <div class="comparison-left">
        <h3>方案 A</h3>
        <p>优势：效率提升 50%</p>
      </div>
      <div class="comparison-right">
        <h3>方案 B</h3>
        <p>优势：成本降低 30%</p>
      </div>
    </div>
    '''

  html += '''
    </div> <!-- end .content -->
  </div> <!-- end .container -->
</body>
</html>
'''

  return html


# ============ 主函数 ============

def step4_html(key_points: List[str], scripts: List[str], design_params: Dict[str, Any], content_type: str, context: Dict[str, Any]) -> List[str]:
  """生成所有页面的 HTML"""
  html_files = []

  for i, (point, script) in enumerate(zip(key_points, scripts)):
    patterns = detect_content_patterns(script, point, content_type)
    print(f"  第{i+1}页: {point[:30]}... | 模式: {patterns}")

    html = generate_html_slide(i, point, script, design_params, patterns, content_type)

    filename = TEMP_DIR / f"slide-{i+1:02d}.html"
    with open(filename, 'w', encoding='utf-8') as f:
      f.write(html)
    html_files.append(str(filename))

  context["html_files"] = html_files
  context["total_slides"] = len(html_files)
  return html_files


if __name__ == "__main__":
  # 测试
  ctx = {
    "key_points": ["核心数据摘要", "营收增长分析", "用户增长趋势", "市场竞争格局"],
    "scripts": [
      "大家好，今天我们要讲：核心数据摘要。数据显示，本季度我们实现了显著增长。",
      "营收增长分析：本季度营收环比提升 25%，用户量达到 100 万。",
      "用户增长趋势：月活跃用户同比增长 80%，retention rate 提升至 60%。",
      "市场竞争格局：我们在细分市场排名第一，份额达到 35%。"
    ],
    "design_params": {
      "colors": {"background": "#0a0a12", "primary": "#8b5cf6", "accent": "#14b8a6", "text_main": "#ffffff", "text_secondary": "#94a3b8", "code_bg": "rgba(139,92,246,0.1)", "code_border": "rgba(139,92,246,0.2)"},
      "typography": {"title": {"size": 72, "font": "Space Grotesk", "weight": 700}, "body": {"size": 22, "font": "PingFang SC", "line_height": 1.6}, "code": {"size": 18, "font": "SF Mono"}},
      "layout": {"max_width": 1500, "decoration_count": 2},
      "special_elements": {"code_styling": "enhanced"}
    },
    "content_type": "商业报告"
  }
  html_files = step4_html(ctx["key_points"], ctx["scripts"], ctx["design_params"], ctx["content_type"], ctx)
  print(f"\nStep 4 完成: {len(html_files)} 个 HTML 文件")
