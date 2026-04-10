#!/usr/bin/env node
/**
 * screenshot.js — 用 Puppeteer 批量截图 HTML 页面
 * 用法: node screenshot.js <htmlDir> <outputDir> [designParams.json]
 * 输出: outputDir/page_XXX.png (1920×1080)
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { shouldWaitForVpAnimReady } = require('./page_animations');

async function main() {
  const [, , htmlDir, outputDir, designParamsPath] = process.argv;
  if (!htmlDir || !outputDir) {
    console.error('Usage: node screenshot.js <htmlDir> <outputDir> [designParams.json]');
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(htmlDir)
    .filter(f => f.endsWith('.html'))
    .sort();

  if (files.length === 0) {
    console.error(`No HTML files found in ${htmlDir}`);
    process.exit(1);
  }

  let waitVpAnim = false;
  if (designParamsPath && fs.existsSync(designParamsPath)) {
    try {
      const dp = JSON.parse(fs.readFileSync(designParamsPath, 'utf8'));
      waitVpAnim = shouldWaitForVpAnimReady(dp);
    } catch (e) {
      console.error('⚠️  design_params 解析失败，按无动画延迟截图');
    }
  }

  // Use system Chrome if Puppeteer's bundled Chrome is unavailable
  const SYSTEM_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  if (!process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(SYSTEM_CHROME)) {
    launchOpts.executablePath = SYSTEM_CHROME;
  }

  const browser = await puppeteer.launch(launchOpts);

  for (const file of files) {
    const htmlPath = path.resolve(htmlDir, file);
    const pngName = file.replace('.html', '.png');
    const outPath = path.join(outputDir, pngName);

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.evaluate(() => document.fonts.ready);

    if (waitVpAnim) {
      try {
        await page.waitForFunction(
          () => document.body && document.body.getAttribute('data-vp-anim-ready') === '1',
          { timeout: 8000, polling: 40 }
        );
      } catch (e) {
        console.error(`  ⚠️  ${pngName}: 未收到 vp-anim-ready，回退短延迟`);
        await new Promise(r => setTimeout(r, 500));
      }
      await new Promise(r => setTimeout(r, 80));
    } else {
      await new Promise(r => setTimeout(r, 500));
    }

    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    await page.close();

    const size = fs.statSync(outPath).size;
    console.error(`  ✅ ${pngName} (${(size / 1024).toFixed(0)}KB)`);
  }

  await browser.close();
  console.error(`截图完成: ${files.length} 张 → ${outputDir}`);
}

main().catch(err => {
  console.error('❌ screenshot 失败:', err.message);
  process.exit(1);
});
