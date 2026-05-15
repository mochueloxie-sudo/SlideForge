#!/usr/bin/env node
/**
 * Extract — 纯内容提取（零 LLM 依赖）
 *
 * AI-GENERATED (Cursor)
 *
 * 把 source（飞书文档 / 本地 .md|.txt|.docx|.pdf / 网页 URL）抽取为纯文本，
 * 落到 output_dir/raw_content.txt + source_meta.json。
 *
 * 设计意图：
 *   - SlideForge v4 的定位是「智能体调用的 Skill」：内容理解和结构化
 *     由宿主 Agent 自己完成，本 Step 只负责把外部材料搬到本地。
 *   - 不调用任何 LLM；不写 scenes.json / project.json。
 *
 * Input (stdin JSON):
 *   { "source": "<feishu_url|local_path|web_url>",
 *     "output_dir": "./output" }
 *
 * Output:
 *   <output_dir>/raw_content.txt   — 提取出的原始正文
 *   <output_dir>/source_meta.json  — { source, source_type, title, char_count, ... }
 */

const fs   = require('fs');
const path = require('path');
const { ensureDir, writeResult } = require('./utils/step-utils');
const { extract } = require('./utils/content_extractor');

(function loadEnv() {
  const envFile = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim();
    if (k && v && !process.env[k]) process.env[k] = v;
  }
})();

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const params = JSON.parse(input);
    const { source, output_dir = './output' } = params;

    if (!source) {
      throw new Error('extract: missing required field "source"');
    }

    const outPath = path.resolve(output_dir);
    ensureDir(outPath);

    process.stderr.write(`📥 extract: source = ${source}\n`);
    const extracted = await extract(source);

    if (!extracted || !extracted.raw_text || !extracted.raw_text.trim()) {
      throw new Error(`extract: empty content from ${source}`);
    }

    const rawFile  = path.join(outPath, 'raw_content.txt');
    const metaFile = path.join(outPath, 'source_meta.json');

    fs.writeFileSync(rawFile, extracted.raw_text, 'utf8');

    const meta = {
      source,
      source_type: extracted.source_type,
      title: extracted.title || '',
      char_count: extracted.raw_text.length,
      extracted_at: new Date().toISOString()
    };
    if (extracted.source_url) meta.source_url = extracted.source_url;
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');

    process.stderr.write(`✅ extracted ${extracted.raw_text.length} chars → ${rawFile}\n`);

    writeResult({
      success: true,
      step: 'extract',
      outputs: [rawFile, metaFile],
      message: `Extracted ${extracted.raw_text.length} chars from ${extracted.source_type} source`,
      metadata: {
        source_type: extracted.source_type,
        title: meta.title,
        char_count: meta.char_count
      }
    });
  } catch (err) {
    process.stderr.write(`❌ extract failed: ${err.message}\n`);
    if (process.env.DEBUG) process.stderr.write(err.stack + '\n');
    process.exit(1);
  }
});
