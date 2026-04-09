#!/usr/bin/env node
// Step 5: TTS 合成
// 默认使用 Microsoft Edge TTS（edge-tts Python CLI）
// 降级顺序：edge-tts → say（macOS）

const { spawn, execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { ensureDir, writeResult } = require('./utils/step-utils');

// ── Edge TTS 配置 ──────────────────────────────────────────────────────────────
const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';   // 小晓，中文女声
const VOICE_MAP = {
  'zh':    'zh-CN-XiaoxiaoNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-TW': 'zh-TW-HsiaoYuNeural',
  'en':    'en-US-JennyNeural',
  'en-US': 'en-US-JennyNeural',
};

// ── 工具检测 ───────────────────────────────────────────────────────────────────
function findEdgeTts() {
  try { execSync('edge-tts --version', { stdio: 'ignore' }); return 'edge-tts'; } catch {}
  try { execSync('python3 -m edge_tts --version', { stdio: 'ignore' }); return 'python3 -m edge_tts'; } catch {}
  return null;
}

function findSay() {
  try { execSync('which say', { stdio: 'ignore' }); return true; } catch { return false; }
}

// ── 单页 TTS ──────────────────────────────────────────────────────────────────
function edgeTts(text, outputFile, voice, edgeCmd) {
  return new Promise((resolve, reject) => {
    const args = edgeCmd.includes('python3')
      ? ['-m', 'edge_tts', '--text', text, '--voice', voice, '--write-media', outputFile]
      : ['--text', text, '--voice', voice, '--write-media', outputFile];
    const cmd = edgeCmd.includes('python3') ? 'python3' : 'edge-tts';
    const proc = spawn(cmd, args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`edge-tts 失败: ${stderr}`)));
    proc.on('error', reject);
  });
}

function sayTts(text, outputFile) {
  return new Promise((resolve, reject) => {
    // say 输出 aiff，再转 mp3（如有 ffmpeg）；否则保留 aiff
    const aiff = outputFile.replace(/\.(mp3|wav)$/, '.aiff');
    const proc = spawn('say', ['-o', aiff, text], { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`say 失败: ${stderr}`));
      // 如果要求 mp3 但只有 aiff，重命名即可（视频合成时 ffmpeg 能处理）
      if (outputFile !== aiff) fs.renameSync(aiff, outputFile.replace(/\.mp3$/, '.aiff'));
      resolve();
    });
    proc.on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const params = JSON.parse(input);
    const {
      scenes,
      output_dir    = './output/audio',
      tts_provider  = 'edge',        // 'edge' | 'say'
      voice         = null,
      language      = 'zh-CN',
    } = params;

    const scenesData = typeof scenes === 'string'
      ? JSON.parse(fs.readFileSync(scenes))
      : scenes;

    if (!scenesData || !Array.isArray(scenesData)) throw new Error('Invalid scenes data');

    const AUDIO_DIR = path.resolve(output_dir);
    ensureDir(AUDIO_DIR);

    // 检测可用工具
    const edgeCmd  = findEdgeTts();
    const hasSay   = findSay();
    const useVoice = voice || VOICE_MAP[language] || DEFAULT_VOICE;

    let provider = tts_provider;
    if (provider === 'edge' && !edgeCmd) {
      if (hasSay) {
        console.error('⚠️  edge-tts 未找到，降级到 macOS say');
        provider = 'say';
      } else {
        throw new Error('未找到可用的 TTS 工具（需要 edge-tts 或 macOS say）\n安装：pip install edge-tts');
      }
    }

    console.error(`🎵 TTS 合成（${provider === 'edge' ? `edge-tts / ${useVoice}` : 'macOS say'}）`);
    console.error(`   输出目录: ${AUDIO_DIR}`);

    const outputs = [];
    for (let i = 0; i < scenesData.length; i++) {
      const scene   = scenesData[i];
      const pageNum = String(i + 1).padStart(3, '0');
      const text    = scene.script || `${scene.title || ''}。${Array.isArray(scene.body) ? scene.body.join('。') : (scene.body || '')}`.trim();
      const outFile = path.join(AUDIO_DIR, `page_${pageNum}.mp3`);

      if (!text) {
        console.error(`   ⏭  Page ${pageNum} 无文本，跳过`);
        continue;
      }

      process.stderr.write(`   🔊 Page ${pageNum} ...`);
      if (provider === 'edge') {
        await edgeTts(text, outFile, useVoice, edgeCmd);
      } else {
        await sayTts(text, outFile);
      }
      process.stderr.write(' ✓\n');
      outputs.push(outFile);
    }

    writeResult({
      success: true,
      step: 'step5',
      outputs,
      message: `TTS 完成: ${outputs.length} 个音频文件（${provider}）`,
      metadata: { provider, voice: useVoice, file_count: outputs.length }
    });
  } catch (err) {
    console.error('❌ Step 5 失败:', err.message);
    process.exit(1);
  }
});
