#!/usr/bin/env node
/**
 * Step 3: HTML 生成
 * 使用 html_generator.js 直接复制样张 HTML 结构，替换内容 tokens
 */
const fs = require('fs');
const path = require('path');
const { generateHtml } = require('../utils/html_generator.js');

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const params = JSON.parse(input);
    const { scenes, design_params, design_mode = 'electric-studio', output_dir = './output/html', projectDir } = params;

    // Resolve scenes: 优先参数传入 > 从 projectDir/project.json 读取
    let scenesData = scenes;
    if (!scenesData && projectDir) {
      const projectFile = path.join(path.resolve(projectDir), 'project.json');
      if (fs.existsSync(projectFile)) {
        const raw = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
        scenesData = raw.scenes || raw;
        console.error(`   📄 从 project.json 加载 ${(scenesData || []).length} 个分镜`);
      }
    }
    if (typeof scenesData === 'string') {
      scenesData = JSON.parse(fs.readFileSync(scenesData, 'utf8'));
    }
    if (scenesData && !Array.isArray(scenesData) && scenesData.scenes) {
      scenesData = scenesData.scenes;
    }
    if (!Array.isArray(scenesData)) {
      throw new Error('scenes must be an array or object with .scenes');
    }

    // Resolve design_params: 支持文件路径或对象
    let designParamsData = null;
    if (design_params) {
      designParamsData = typeof design_params === 'string'
        ? JSON.parse(fs.readFileSync(path.resolve(design_params), 'utf8'))
        : design_params;
    }

    // Resolve design_mode: 优先来自 design_params，其次参数
    const resolvedDesignMode = designParamsData?.design_mode || design_mode;

    // Attach design_mode to each scene for template selection
    scenesData = scenesData.map(s => ({ ...s, design_mode: resolvedDesignMode || s.design_mode }));

    const outDir = path.resolve(output_dir);
    const files = generateHtml(scenesData, resolvedDesignMode, outDir, designParamsData);

    console.log(JSON.stringify({
      success: true,
      step: 'step3',
      outputs: files,
      design_mode: resolvedDesignMode,
      message: `生成 ${files.length} 个 HTML 页面 (${resolvedDesignMode} · 样张模式)`
    }));
  } catch (err) {
    console.error('❌ Step 3 失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
});
