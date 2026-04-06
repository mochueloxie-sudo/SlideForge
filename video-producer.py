#!/usr/bin/env python3
"""
video-producer - 将任意文档转化为视频演示稿
完整工作流：Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7

用法：
  python3 video-producer.py --document_url="..." --audience="auto" --design_mode="optimized"

依赖：
  - ffmpeg: /Users/teeclaw/bin/ffmpeg
  - node: v24+ + puppeteer
  - lark-cli: 飞书 API 调用
"""

import argparse
import sys
from pathlib import Path

# 添加 steps 目录到路径
sys.path.insert(0, str(Path(__file__).parent / "steps"))

# 全局上下文（Step 0 写入，后续步骤读取）
context = {}

def parse_args():
  parser = argparse.ArgumentParser(description="将文档转化为视频演示稿")
  parser.add_argument("--document_url", type=str, required=True, help="文档地址（支持：file://路径、http(s)://公开网页、飞书 docx 链接）")
  parser.add_argument("--audience", type=str, default="auto", help="目标受众：auto/general/students/executives/developers/internal")
  parser.add_argument("--design_mode", type=str, default="optimized", help="设计模式：default/optimized/minimal")
  parser.add_argument("--tts_provider", type=str, default="minimax", help="TTS 提供商：say/minimax/tencent")
  parser.add_argument("--output_quality", type=str, default="high", help="输出质量：high/medium/low")
  return parser.parse_args()

def main():
  args = parse_args()

  print("=" * 60)
  print("🎬 video-producer 开始执行")
  print("=" * 60)
  print(f"  文档: {args.document_url}")
  print(f"  受众: {args.audience}")
  print(f"  设计模式: {args.design_mode}")
  print(f"  TTS: {args.tts_provider}")
  print(f"  质量: {args.output_quality}")
  print("=" * 60)

  # === Step 0: 内容分析 ===
  print("\n🔍 Step 0: 内容分析...")
  from step0_analyze import step0_analyze
  result = step0_analyze(args.document_url, args.audience, context)
  print(f"  内容类型: {result['content_type']}")
  print(f"  推断受众: {result['audience_inferred']}")
  print(f"  推荐设计: {result['design_recommendation']}")

  # === Step 1: 提炼核心要点 ===
  print("\n📝 Step 1: 提炼核心要点...")
  from step1_extract import step1_extract
  key_points = step1_extract(result['content_type'], result['audience_inferred'], context)
  print(f"  提炼 {len(key_points)} 个核心观点")
  print(f"  前 3 个: {key_points[:3]}")

  # === Step 2: 生成逐字稿 ===
  print("\n🎙️  Step 2: 生成逐字稿...")
  from step2_script import step2_script
  scripts = step2_script(key_points, result['audience_inferred'], context)
  print(f"  生成 {len(scripts)} 页逐字稿")
  print(f"  示例第 1 页: {scripts[0][:60]}...")

  # === Step 3: 确定视觉风格 ===
  print("\n🎨 Step 3: 确定视觉风格...")
  from step3_design import step3_get_design_params
  design_params = step3_get_design_params(
    result['content_type'],
    args.design_mode,
    result['audience_inferred'],
    context
  )
  print(f"  设计模式: {design_params['design_mode_used']}")
  print(f"  受众策略: {design_params['audience_applied']}")
  if design_params.get('design_recommendation_override'):
    print(f"  ⚠️  自动覆盖: {design_params['design_recommendation_override']} → {design_params['design_mode_used']}")

  # === Step 4: 生成 HTML + 内容模式检测 ===
  print("\n🖼️  Step 4: 生成 HTML + 检测内容模式...")
  from step4_html import step4_html
  html_files = step4_html(key_points, scripts, design_params, result['content_type'], context)
  print(f"  生成 {len(html_files)} 个 HTML 文件")
  print(f"  示例: {html_files[0] if html_files else '无'}")

  # === Step 5: TTS 语音生成 ===
  print("\n🎙️  Step 5: TTS 语音生成...")
  from step5_tts import step5_tts
  context["tts_engine"] = args.tts_provider
  audio_files = step5_tts(scripts, context)
  generated = [a for a in audio_files if a]
  print(f"  生成 {len(generated)} / {len(audio_files)} 个音频文件")
  if len(generated) < len(audio_files):
    print(f"  ⚠️  {len(audio_files) - len(generated)} 个音频生成失败，将使用静音替代")

  # === Step 6: ffmpeg 视频合成 ===
  print("\n🎬 Step 6: ffmpeg 视频合成...")
  from step6_video import step6_video
  video_path = step6_video(html_files, audio_files, context)
  if video_path:
    print(f"  视频输出: {video_path}")
  else:
    print("  ❌ 视频生成失败，终止流程")
    return 1

  # === Step 7: 飞书文档创建 + 视频上传 ===
  print("\n📄 Step 7: 飞书文档创建 + 视频上传...")
  from step7_doc import step7_doc
  doc_url = step7_doc(key_points, scripts, context.get('video_token'), context)
  if doc_url:
    print(f"  文档链接: {doc_url}")
  else:
    print("  ⚠️  文档创建失败（视频已生成）")

  print("\n" + "=" * 60)
  print("✅ video-producer 完整流程执行完毕！")
  print("=" * 60)
  return 0

if __name__ == "__main__":
  sys.exit(main())
