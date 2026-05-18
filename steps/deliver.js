#!/usr/bin/env node
/**
 * Step 7: 交付渠道
 *
 *   - "local"  → 汇总所有产出文件清单，打包到 output_dir（默认）
 *   - "feishu" → 创建飞书文档，写入导览 + 逐字稿，并用 lark-cli 嵌入 **presentation.mp4 和/或 presentation.pdf**（至少其一；同 `docs +media-insert`）
 */

const fs   = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const params = JSON.parse(input);
    const {
      channel = 'local',
      output_dir = './output',
      scenes,
      video_path,
      pdf_path,
      doc_title,
      folder_token,
      source_url
    } = params;

    const outputPath = path.resolve(output_dir);
    console.error('📤 Step 7: 交付渠道');
    console.error(`   渠道: ${channel}`);

    let result;
    switch (channel) {
      case 'local':
        result = deliverLocal(outputPath);
        break;
      case 'feishu':
        result = await deliverFeishu({
          output_dir,
          scenes,
          video_path,
          pdf_path,
          doc_title,
          folder_token,
          source_url
        });
        break;
      default:
        throw new Error(`未知渠道: ${channel}。支持: local, feishu`);
    }

    console.log(JSON.stringify(result));
  } catch (err) {
    console.error('❌ Step 7 失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Local delivery: list all output files
// ═══════════════════════════════════════════════════════════════════════════════

function deliverLocal(outputPath) {
  const deliverables = [];
  const manifest = [];

  const mainFiles = [
    'presentation.mp4',
    'presentation.pdf',
    'presentation.html',
    'presentation_static.html',
    'outline.md',
    'script.md',
  ];
  for (const f of mainFiles) {
    const fp = path.join(outputPath, f);
    if (fs.existsSync(fp)) {
      const size = fs.statSync(fp).size;
      deliverables.push(fp);
      manifest.push({ file: f, size: formatSize(size) });
    }
  }

  // Also list scenes.json and design_params.json if present
  for (const f of ['scenes.json', 'design_params.json']) {
    const fp = path.join(outputPath, f);
    if (fs.existsSync(fp)) {
      deliverables.push(fp);
      manifest.push({ file: f, size: formatSize(fs.statSync(fp).size) });
    }
  }

  // Write manifest
  const manifestPath = path.join(outputPath, 'MANIFEST.md');
  const lines = [
    '# 交付清单',
    '',
    `> 输出目录: \`${outputPath}\``,
    '',
    '| 文件 | 大小 |',
    '|------|------|',
    ...manifest.map(m => `| ${m.file} | ${m.size} |`),
    '',
    `共 ${manifest.length} 个文件`,
  ];
  fs.writeFileSync(manifestPath, lines.join('\n'), 'utf8');
  deliverables.push(manifestPath);

  console.error(`   ✅ 本地交付完成，共 ${manifest.length} 个文件`);
  manifest.forEach(m => console.error(`      ${m.file} (${m.size})`));

  return {
    success: true,
    step: 'deliver',
    outputs: deliverables,
    message: `本地交付完成: ${manifest.length} 个文件 → ${outputPath}`,
    metadata: { channel: 'local', manifest, output_dir: outputPath }
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Feishu delivery: delegates to publish.js
// ═══════════════════════════════════════════════════════════════════════════════

function resolveDeliverAttachment(params, key, basename) {
  let p = params[key];
  const out = path.resolve(params.output_dir);
  if (p && typeof p === 'string') {
    p = path.resolve(p);
    if (fs.existsSync(p)) return p;
  }
  const candidate = path.join(out, basename);
  return fs.existsSync(candidate) ? candidate : null;
}

async function deliverFeishu(params) {
  const videoPath = resolveDeliverAttachment(params, 'video_path', 'presentation.mp4');
  const pdfPath = resolveDeliverAttachment(params, 'pdf_path', 'presentation.pdf');

  if (!videoPath && !pdfPath) {
    throw new Error(
      'channel=feishu 需要 presentation.mp4 和/或 presentation.pdf。' +
        '请先用 format 包含 video 和/或 pdf 跑 package，或显式传入 video_path / pdf_path。'
    );
  }

  const publishScript = path.resolve(__dirname, 'publish.js');
  const payload = { ...params, video_path: videoPath || undefined, pdf_path: pdfPath || undefined };
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [publishScript], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => { stderr += d; process.stderr.write(d); });
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
    proc.on('close', code => {
      if (code === 0) {
        try { resolve(JSON.parse(stdout)); }
        catch { resolve({ success: true, step: 'deliver', outputs: [], message: '飞书发布完成' }); }
      } else {
        reject(new Error(`Feishu publish failed: ${stderr}`));
      }
    });
    proc.on('error', reject);
  });
}
