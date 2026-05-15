#!/usr/bin/env node
/**
 * slide-forge skill (Agent-First v4.0)
 *
 * AI-GENERATED (Cursor)
 *
 * 定位：宿主 Agent 调用的 Skill。Agent 自己读源材料、按
 * docs/SCENES_SCHEMA.md 写 scenes.json；本执行器只提供管道工具：
 *
 *   extract  → 把 source 抽成 raw_content.txt（零 LLM）
 *   validate → 校验 scenes.json（零 LLM、零网络）
 *   design   → 主题 + 变体推断 → design_params.json
 *   html     → 渲染 HTML 页面
 *   screenshot → Puppeteer 截图
 *   tts      → 文字转语音
 *   package  → 打包成 video / pdf / html
 *   deliver  → 交付到 local / feishu
 *   render   → 一把跑完 design → deliver
 *
 * v4.0 移除：step0_analyze / step1_script / minimax_utils / llm_client
 *           （不再调用任何外部大语言模型）
 *           原 step2..step7 已重命名为上述语义动词
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

(function loadEnv() {
  const envFile = path.join(__dirname, '.env');
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && val && !process.env[key]) process.env[key] = val;
  }
})();

async function dispatch(params) {
  const { command } = params;

  console.log(`🎬 slide-forge: executing command="${command}"`);

  let result;
  switch (command) {
    case 'extract':
      result = await extract(params);
      break;
    case 'validate':
      result = await validate(params);
      break;
    case 'design':
      result = await design(params);
      break;
    case 'html':
      result = await html(params);
      break;
    case 'screenshot':
      result = await screenshot(params);
      break;
    case 'tts':
      result = await tts(params);
      break;
    case 'package':
      result = await pkg(params);
      break;
    case 'deliver':
      result = await deliver(params);
      break;
    case 'render':
    case 'all':
      result = await run_render(params);
      break;
    case 'step0':
    case 'step1':
      throw new Error(
        `command "${command}" was removed in v4.0. SlideForge no longer calls any external LLM. ` +
        `The host Agent should now read source content (use command "extract" to fetch it) and ` +
        `produce scenes.json directly per docs/SCENES_SCHEMA.md, then call "render" ` +
        `(or design / html / screenshot / tts / package / deliver).`
      );
    case 'step2':
    case 'step3':
    case 'step4':
    case 'step5':
    case 'step6':
    case 'step7': {
      const renamed = {
        step2: 'design',
        step3: 'html',
        step4: 'screenshot',
        step5: 'tts',
        step6: 'package',
        step7: 'deliver'
      }[command];
      throw new Error(
        `command "${command}" was renamed in v4.0. Use command "${renamed}" instead. ` +
        `Full pipeline aliases: extract / validate / design / html / screenshot / tts / package / deliver / render.`
      );
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  // OpenClaw / 部分沙箱的 exec preflight 会拦截 `echo '{...}' | node executor.js` 管道；
  // 子进程之间 stdin 仍是 spawn 内部传递，与此无关。文件传参可绕过外层管道限制：
  //   node executor.js ./request.json
  const fileArg = process.argv[2];
  if (fileArg && /\.json$/i.test(fileArg)) {
    const abs = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
    if (fs.existsSync(abs)) {
      try {
        const params = JSON.parse(fs.readFileSync(abs, 'utf8'));
        await dispatch(params);
      } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
      }
      return;
    }
  }

  let input = '';
  process.stdin.on('data', chunk => (input += chunk));
  process.stdin.on('end', async () => {
    try {
      const params = JSON.parse(input);
      await dispatch(params);
    } catch (err) {
      console.error('❌ Error:', err.message);
      console.error(err.stack);
      process.exit(1);
    }
  });
}

// ============================================
// 参数标准化：统一 executor 外部名 → step 内部名
// ============================================
function normalizeParams(params) {
  const p = { ...params };
  if (p.projectDir && !p.output_dir) p.output_dir = p.projectDir;
  if (p.designMode && !p.design_mode) p.design_mode = p.designMode;
  if (p.docUrl && !p.doc_url) p.doc_url = p.docUrl;
  return p;
}

// ============================================
// v4.0 命令分派（每个命令对应 steps/<name>.js）
// ============================================
async function extract(params)    { return runStepScript('extract.js',    normalizeParams(params)); }
async function validate(params)   { return runStepScript('validate.js',   normalizeParams(params)); }
async function design(params)     { return runStepScript('design.js',     normalizeParams(params)); }
async function html(params)       { return runStepScript('html.js',       normalizeParams(params)); }
async function screenshot(params) { return runStepScript('screenshot.js', normalizeParams(params)); }
async function tts(params)        { return runStepScript('tts.js',        normalizeParams(params)); }
async function pkg(params)        { return runStepScript('package.js',    normalizeParams(params)); }
async function deliver(params)    { return runStepScript('deliver.js',    normalizeParams(params)); }

// ============================================
// render（原 "all"）：从 scenes.json 起，跑 design → deliver
// v4.0 起：本命令不再调用 LLM；scenes.json 必须由宿主 Agent 预先准备
// ============================================
async function run_render(params) {
  const results = [];

  if (!params.scenes) {
    throw new Error(
      'render: missing required field "scenes". ' +
      'Provide a path to scenes.json (produced by the host Agent per docs/SCENES_SCHEMA.md). ' +
      'If you need to fetch raw content first, run command "extract".'
    );
  }
  if (!params.output_dir) params.output_dir = './output';

  console.log("\n🔄 design: 生成设计参数...");
  const rDesign = await design(params);
  params.design_params = rDesign.outputs[0];
  results.push(rDesign);

  console.log("🔄 html: 渲染 HTML...");
  const rHtml = await html({
    ...params,
    scenes: params.scenes,
    design_params: params.design_params
  });
  params.html_dir = params.output_dir;
  results.push(rHtml);

  console.log("🔄 screenshot: 截图...");
  const screenshotsDir = path.join(params.output_dir, 'screenshots');
  const rShot = await screenshot({
    ...params,
    html_dir: params.html_dir,
    output_dir: screenshotsDir,
    design_params: params.design_params
  });
  params.screenshots_dir = screenshotsDir;
  results.push(rShot);

  const formats = Array.isArray(params.format) ? params.format : [params.format || 'html'];
  const needsAudio = formats.includes('video');

  if (needsAudio) {
    console.log("🔄 tts: 文字转语音...");
    const rTts = await tts({ ...params, scenes: params.scenes });
    results.push(rTts);
  } else {
    console.log("⏭️  tts: 跳过（当前格式不需要音频）");
  }

  console.log("🔄 package: 打包交付格式...");
  const rPkg = await pkg({
    ...params,
    format: formats,
    scenes: params.scenes,
    screenshots_dir: params.screenshots_dir || path.join(params.output_dir, 'screenshots'),
    audio_dir: params.audio_dir || path.join(params.output_dir, 'audio'),
    html_dir: params.html_dir || params.output_dir
  });
  results.push(rPkg);

  const channel = params.channel || 'local';
  console.log(`🔄 deliver: 交付渠道 (${channel})...`);
  const rDeliver = await deliver({
    ...params,
    channel,
    scenes: params.scenes,
    video_path: formats.includes('video') ? path.join(params.output_dir, 'presentation.mp4') : undefined
  });
  results.push(rDeliver);

  return {
    success: true,
    step: "render",
    results,
    message: `渲染流程执行完毕 → 格式: ${formats.join('+')} / 渠道: ${channel}`
  };
}

async function runStepScript(scriptName, params) {
  const stepScript = path.resolve(__dirname, 'steps', scriptName);
  const { stdout } = await runCommand('node', [stepScript], { input: JSON.stringify(params) });
  return JSON.parse(stdout);
}

function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    if (options.input) {
      proc.stdin.write(options.input);
      proc.stdin.end();
    }
    proc.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} failed: ${stderr}`));
    });
    proc.on('error', reject);
  });
}

main();
