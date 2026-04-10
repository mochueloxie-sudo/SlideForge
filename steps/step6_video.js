#!/usr/bin/env node
// Step 6: 视频合成（增强版 - 支持动态动画策略 + 工具自动发现）

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getLocator } = require('./utils/tool-locator');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const params = JSON.parse(input);
    const {
      screenshots_dir,
      audio_dir,
      design_params,
      scenes,
      output = './output/final_video.mp4'
    } = params;

    // 初始化工具定位器
    const locator = getLocator();

    // 获取工具路径（自动发现）
    const FFMPEG = locator.find('ffmpeg');
    const FFPROBE = locator.find('ffprobe');

    console.error(`🔧 工具定位:`);
    console.error(`   FFmpeg: ${FFMPEG}`);
    console.error(`   FFprobe: ${FFPROBE}`);

    // 验证工具可用性
    console.error(`✅ 验证工具可用性...`);
    const ffmpegOk = await locator.validate('ffmpeg');
    const ffprobeOk = await locator.validate('ffprobe');

    if (!ffmpegOk || !ffprobeOk) {
      throw new Error('Required tools (ffmpeg/ffprobe) not available. Run tool-locator.configure() to set paths.');
    }

    // 解析路径
    const screenshotDir = path.resolve(screenshots_dir || './output/screenshots');
    const audioDir = path.resolve(audio_dir || './output/audio');

    // 加载设计参数和分镜
    let design = typeof design_params === 'string'
      ? JSON.parse(fs.readFileSync(design_params))
      : design_params;
    const scenesData = typeof scenes === 'string'
      ? JSON.parse(fs.readFileSync(scenes))
      : scenes;

    console.error(`🎬 开始视频合成（增强动画系统）`);
    console.error(`📁 截图: ${screenshotDir}`);
    console.error(`📁 音频: ${audioDir}`);
    console.error(`🎨 设计模式: ${design.design_mode || 'unknown'}`);

    // 创建临时目录
    const baseDir = path.dirname(output);
    const pageVideoDir = path.join(baseDir, 'step6_pages');
    fs.mkdirSync(pageVideoDir, { recursive: true });

    const FPS = 25;

    // 逐页合成
    for (const scene of scenesData) {
      const pageNum = String(scene.id).padStart(3, '0');
      const imgPath = path.join(screenshotDir, `page_${pageNum}.png`);
      const audioPath = path.join(audioDir, `page_${pageNum}.mp3`);
      const outPath = path.join(pageVideoDir, `page_${pageNum}.mp4`);

      if (!fs.existsSync(imgPath)) {
        console.error(`❌ 缺失截图: ${imgPath}`);
        process.exit(1);
      }
      if (!fs.existsSync(audioPath)) {
        console.error(`❌ 缺失音频: ${audioPath}`);
        process.exit(1);
      }

      console.error(`🔄 第 ${scene.id} 页 (${scene.type}): ${imgPath}`);

      // 选择动画策略
      const strategy = selectAnimationStrategy(design, scene.type);
      console.error(`   🎭 动画: ${strategy.description} (${strategy.duration}s)`);

      // 获取音频时长
      const duration = await getAudioDuration(FFPROBE, audioPath);

      // 构建 FFmpeg filter
      const vfFilter = buildFFmpegFilter(strategy, duration);

      // 执行合成
      await synthesizePage(FFMPEG, imgPath, audioPath, outPath, {
        filter: vfFilter,
        fps: FPS,
        duration: strategy.duration
      });

      const size = fs.statSync(outPath).size;
      console.error(`   ✅ 完成: ${(size / 1024 / 1024).toFixed(2)} MB`);
    }

    // 合并
    await concatenateVideos(FFMPEG, pageVideoDir, output);

    console.log(JSON.stringify({
      success: true,
      step: "step6",
      outputs: [output],
      message: `视频合成完成（动画策略: ${design.design_mode || 'default'}）`,
      metadata: {
        total_pages: scenesData.length,
        animation_strategies: design.design_mode,
        tools: { ffmpeg: FFMPEG, ffprobe: FFPROBE }
      }
    }));
  } catch (err) {
    console.error('❌ Step 6 失败:', err.message);
    process.exit(1);
  }
});

/**
 * 获取音频时长
 */
async function getAudioDuration(ffprobe, audioPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffprobe, ['-i', audioPath], { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      const match = stderr.match(/Duration: ([0-9:.]+)/);
      if (match) {
        const parts = match[1].split(':').map(Number);
        const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        resolve(seconds);
      } else {
        resolve(5);
      }
    });
    proc.on('error', reject);
  });
}

/**
 * 合成单页
 */
async function synthesizePage(ffmpeg, img, audio, output, options) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-loop', '1', '-i', img,
      '-i', audio,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-r', String(options.fps),
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      output
    ];
    if (options.filter) {
      // -vf 须紧跟在全部输入之后、编码参数之前
      const encIdx = args.indexOf('-c:v');
      if (encIdx > 0) args.splice(encIdx, 0, '-vf', options.filter);
    }

    const proc = spawn(ffmpeg, args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0 && fs.existsSync(output) && fs.statSync(output).size > 0) {
        resolve(output);
      } else {
        reject(new Error(`FFmpeg failed: ${stderr}`));
      }
    });
    proc.on('error', reject);
  });
}

/**
 * 合并视频
 */
async function concatenateVideos(ffmpeg, pageDir, finalOutput) {
  return new Promise((resolve, reject) => {
    const listPath = path.join(pageDir, 'list.txt');
    const files = fs.readdirSync(pageDir)
      .filter(f => f.endsWith('.mp4'))
      .sort();

    if (files.length === 0) {
      reject(new Error('No page videos found'));
      return;
    }

    let listContent = '';
    for (const f of files) {
      listContent += `file '${path.join(pageDir, f)}'\n`;
    }
    fs.writeFileSync(listPath, listContent);

    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      '-y',
      finalOutput
    ];

    const proc = spawn(ffmpeg, args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0 && fs.existsSync(finalOutput) && fs.statSync(finalOutput).size > 0) {
        resolve(finalOutput);
      } else {
        reject(new Error(`Concat failed: ${stderr}`));
      }
    });
    proc.on('error', reject);
  });
}

// 导出动画策略函数（从独立模块导入）
function selectAnimationStrategy(design, sceneType) {
  const { selectAnimationStrategy: select } = require('./animations/animation-strategies.js');
  return select(design, sceneType);
}

function buildFFmpegFilter(strategy, audioDuration) {
  const { buildFFmpegFilter: build } = require('./animations/animation-strategies.js');
  return build(strategy, audioDuration);
}
