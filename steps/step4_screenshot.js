#!/usr/bin/env node
// Step 4: 截图（增强版 - 支持图像预处理 + 工具自动发现）

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
      html_dir,
      output_dir = './output/screenshots',
      design_params,
      preprocessing = false
    } = params;

    // 初始化工具定位器
    const locator = getLocator();

    // 获取工具路径
    let convertPath = null;
    let identifyPath = null;

    try {
      convertPath = locator.find('imagemagick');
      identifyPath = locator.find('identify');
      console.error(`🔧 ImageMagick: ${convertPath || 'not found'}`);
    } catch (e) {
      console.error(`⚠️ ImageMagick 未配置，图像预处理将跳过`);
    }

    const htmlDir = path.resolve(html_dir || './output/html');
    const outDir = path.resolve(output_dir);

    fs.mkdirSync(outDir, { recursive: true });
    console.error(`📁 截图输出: ${outDir}`);

    // 图像预处理
    if (preprocessing && design_params && convertPath && identifyPath) {
      await preprocessImages(htmlDir, design_params, { convert: convertPath, identify: identifyPath });
    } else if (preprocessing) {
      console.error(`⏭️ 预处理跳过（ImageMagick 不可用）`);
    }

    // 截图（优先用本地脚本，回退到旧路径）
    const localScript = path.resolve(__dirname, '..', 'utils', 'screenshot.js');
    const legacyScript = path.resolve(
      process.env.HOME,
      '.openclaw/workspace/video-manual-20260407/screenshot.js'
    );
    const screenshotScript = fs.existsSync(localScript) ? localScript : legacyScript;

    if (!fs.existsSync(screenshotScript)) {
      throw new Error(`Screenshot script not found: ${screenshotScript}`);
    }

    await runCommand('node', [screenshotScript, htmlDir, outDir]);

    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));

    console.log(JSON.stringify({
      success: true,
      step: "step4",
      outputs: files.map(f => path.join(outDir, f)),
      message: `截图完成: ${files.length} 张`,
      preprocessing: preprocessing ? 'applied' : 'none'
    }));
  } catch (err) {
    console.error('❌ Step 4 失败:', err.message);
    process.exit(1);
  }
});

/**
 * 图像预处理
 */
async function preprocessImages(htmlDir, design, tools) {
  console.error('🔧 开始图像预处理...');

  const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(htmlDir, htmlFile);
    const html = fs.readFileSync(htmlPath, 'utf-8');

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgSrc = match[1];
      const imgPath = path.join(htmlDir, imgSrc);

      if (fs.existsSync(imgPath)) {
        await processSingleImage(imgPath, design, tools);
      }
    }
  }

  console.error('✅ 图像预处理完成');
}

/**
 * 处理单张图片
 */
async function processSingleImage(imgPath, design, tools) {
  const stats = fs.statSync(imgPath);
  const isLogo = imgPath.includes('logo') || imgPath.includes('icon');

  // 1. 大图片压缩
  if (stats.size > 500 * 1024) {
    console.error(`   📦 压缩: ${path.basename(imgPath)} (${(stats.size/1024).toFixed(0)}KB)`);
    await compressImage(imgPath, tools.convert);
  }

  // 2. Logo 圆形化
  if (isLogo && design.decoration?.images?.circleCrop) {
    console.error(`   ⭕ 圆形裁剪: ${path.basename(imgPath)}`);
    await cropToCircle(imgPath, tools.convert);
  }

  // 3. 宽高比修正
  const { width, height } = await getImageDimensions(imgPath, tools.identify);
  if (width / height > 2) {
    console.error(`   ✂️ 修正宽高比: ${path.basename(imgPath)} (${width}x${height})`);
    await resizeToFit(imgPath, 1200, 400, tools.convert);
  }
}

/**
 * 压缩图片
 */
async function compressImage(imgPath, convert) {
  return new Promise((resolve) => {
    const args = ['-quality', '85', '-resize', '1200x1200>', imgPath];
    const proc = spawn(convert, args, { stdio: 'pipe' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else resolve(); // 忽略失败
    });
    proc.on('error', () => resolve());
  });
}

/**
 * 圆形裁剪
 */
async function cropToCircle(imgPath, convert) {
  return new Promise((resolve) => {
    const args = [
      imgPath,
      '-alpha', 'set',
      '-virtual-pixel', 'transparent',
      '-channel', 'A',
      '-blur', '0x8',
      '-fill', 'none',
      '-draw', 'circle 50% 50% 50% 0',
      imgPath
    ];
    const proc = spawn(convert, args, { stdio: 'pipe' });
    proc.on('close', code => code === 0 ? resolve() : resolve());
    proc.on('error', () => resolve());
  });
}

/**
 * 调整尺寸
 */
async function resizeToFit(imgPath, maxWidth, maxHeight, convert) {
  return new Promise((resolve) => {
    const args = [imgPath, '-resize', `${maxWidth}x${maxHeight}>`, imgPath];
    const proc = spawn(convert, args, { stdio: 'pipe' });
    proc.on('close', code => code === 0 ? resolve() : resolve());
    proc.on('error', () => resolve());
  });
}

/**
 * 获取图片尺寸
 */
async function getImageDimensions(imgPath, identify) {
  return new Promise((resolve) => {
    const proc = spawn(identify, ['-format', '%w %h', imgPath], { stdio: 'pipe' });
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => {
      const parts = stdout.trim().split(/\s+/).map(Number);
      resolve({ width: parts[0] || 0, height: parts[1] || 0 });
    });
    proc.on('error', () => resolve({ width: 0, height: 0 }));
  });
}

/**
 * 执行命令
 */
function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'pipe' });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} failed: ${stderr}`));
    });
    proc.on('error', reject);
  });
}
