#!/usr/bin/env node
// Step 7: 飞书发布（完整实现）
// 流程：创建文档 → 写入内容 → 嵌入视频（自动上传）
// 使用 lark-cli docs +media-insert（自动处理文件上传 + 块创建）

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ensureDir, writeResult } = require('./utils/step-utils');

// 动态查找 lark-cli：env 变量 > PATH > nvm global > npm global > npx
function findLarkCli() {
  const { execSync } = require('child_process');

  // 1. 用户显式指定
  if (process.env.LARK_CLI_PATH) return process.env.LARK_CLI_PATH;

  // 2. 在 PATH 里直接可用
  try {
    const p = execSync('which lark-cli 2>/dev/null', { encoding: 'utf8' }).trim();
    if (p) return p;
  } catch {}

  // 3. nvm 管理的 node 全局包（当前用户所有版本）
  try {
    const home = process.env.HOME || '';
    const nvmDir = process.env.NVM_DIR || path.join(home, '.nvm');
    const pattern = path.join(nvmDir, 'versions/node/*/lib/node_modules/@larksuite/cli/bin/lark-cli');
    const glob = require('child_process').execSync(`ls ${pattern} 2>/dev/null | tail -1`, { encoding: 'utf8' }).trim();
    if (glob) return glob;
  } catch {}

  // 4. npm 全局路径
  try {
    const prefix = execSync('npm config get prefix 2>/dev/null', { encoding: 'utf8' }).trim();
    const p = path.join(prefix, 'bin', 'lark-cli');
    if (require('fs').existsSync(p)) return p;
    // Windows: prefix/lark-cli.cmd
    const pw = path.join(prefix, 'lark-cli');
    if (require('fs').existsSync(pw)) return pw;
  } catch {}

  // 5. 最终兜底：通过 npx 运行（会自动安装）
  return 'npx @larksuite/cli';
}

const LARK_CLI_PATH = findLarkCli();

// 统一调用入口，兼容直接路径和 npx 兜底
function spawnLark(args, opts = {}) {
  if (LARK_CLI_PATH.startsWith('npx ')) {
    const [, pkg] = LARK_CLI_PATH.split(' ');
    return spawn('npx', [pkg, ...args], { stdio: 'pipe', ...opts });
  }
  return spawn(LARK_CLI_PATH, args, { stdio: 'pipe', ...opts });
}

const DEFAULT_FOLDER = 'ADuufEdBslE6RcdrBwDc0bU4nHe'; // AI新鲜事

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const params = JSON.parse(input);
    const {
      video_path,
      scenes,
      doc_title = 'AI 新鲜事',
      folder_token = DEFAULT_FOLDER,
      source_url,
      output_dir = './output'
    } = params;

    console.error('📹 Step 7: 飞书发布');
    console.error('========================');

    // 1. 验证输入
    const videoPath = typeof video_path === 'string' ? path.resolve(video_path) : video_path;
    const scenesData = typeof scenes === 'string' ? JSON.parse(fs.readFileSync(scenes)) : scenes;

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video not found: ${videoPath}`);
    }

    console.error(`✅ 视频: ${videoPath}`);
    console.error(`✅ 标题: ${doc_title}`);

    // 2. 创建文档
    console.error('');
    console.error('📝 步骤 1/3: 创建飞书文档...');
    const { docToken, docUrl } = await createDoc(doc_title, folder_token);
    console.error(`✅ 文档已创建: ${docUrl}`);

    // 3. 生成并写入文档内容（不含视频）
    console.error('');
    console.error('✍️  步骤 2/3: 写入内容（导览 + 逐字稿）...');
    const markdown = generateMarkdownContent(scenesData, source_url);
    await updateDoc(docToken, markdown);
    console.error('✅ 内容已写入');

    // 4. 嵌入视频播放器（自动上传本地文件）
    console.error('');
    console.error('🎬 步骤 3/3: 嵌入视频播放器...');
    const { fileToken, blockId } = await embedVideo(docToken, videoPath);
    console.error(`✅ 视频已嵌入 (file_token: ${fileToken})`);

    // 完成
    console.error('');
    console.error('🎉 发布完成！');
    console.error(`📄 文档: ${docUrl}`);

    writeResult({
      success: true,
      step: "step7",
      outputs: [docToken, fileToken],
      message: "飞书发布完成",
      metadata: {
        doc_token: docToken,
        video_token: fileToken,
        block_id: blockId,
        doc_url: docUrl,
        pages: scenesData.length
      }
    });

  } catch (err) {
    console.error('❌ Step 7 失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
});

/**
 * 创建飞书文档
 */
async function createDoc(title, folderToken) {
  return new Promise((resolve, reject) => {
    const args = [
      'docs', '+create',
      '--folder-token', folderToken,
      '--title', title,
      '--markdown', '文档加载中...', // 占位内容，后续覆盖
      '--as', 'bot'
    ];

    const proc = spawnLark(args);
    let stdout = '', stderr = '';

    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);

    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`创建文档失败: ${stderr}`));
      }
      try {
        const result = JSON.parse(stdout);
        if (result.ok !== true) {
          throw new Error(result.msg || 'API 返回错误');
        }
        const docToken = result.data.doc_id || result.data.document_id;
        const docUrl = result.data.doc_url || `https://larksuite.com/docx/${docToken}`;
        resolve({ docToken, docUrl });
      } catch (e) {
        reject(new Error(`解析响应失败: ${e.message}\n原始输出: ${stdout}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * 更新文档内容（覆盖模式）
 */
async function updateDoc(docToken, markdown) {
  return new Promise((resolve, reject) => {
    const args = [
      'docs', '+update',
      '--doc', docToken,
      '--mode', 'overwrite',
      '--markdown', markdown,
      '--as', 'bot'
    ];

    const proc = spawnLark(args);
    let stdout = '', stderr = '';

    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);

    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`更新文档失败: ${stderr}`));
      }
      try {
        const result = JSON.parse(stdout);
        if (result.ok !== true) {
          throw new Error(result.msg || '更新失败');
        }
        resolve(result);
      } catch (e) {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}

/**
 * 嵌入视频（自动上传 + 插入）
 */
async function embedVideo(docToken, videoPath) {
  return new Promise((resolve, reject) => {
    const videoDir = path.dirname(videoPath);
    const videoFile = path.basename(videoPath);
    try {
      const args = [
        'docs', '+media-insert',
        '--doc', docToken,
        '--file', videoFile,
        '--type', 'file',
        '--as', 'bot'
      ];

      // 在视频目录下执行，+media-insert 要求相对路径
      const proc = spawnLark(args, { cwd: videoDir });
      let stdout = '', stderr = '';

      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);

      proc.on('close', code => {
        if (code !== 0) {
          return reject(new Error(`视频嵌入失败: ${stderr}`));
        }
        try {
          const result = JSON.parse(stdout);
          if (result.ok !== true) {
            throw new Error(result.msg || '嵌入失败');
          }
          resolve({
            fileToken: result.data.file_token,
            blockId: result.data.block_id
          });
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}\n原始输出: ${stdout}`));
        }
      });

      proc.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 生成文档 Markdown 内容（视频区 + 导览 + 逐字稿 + 原文）
 */
function generateMarkdownContent(scenes, sourceUrl) {
  const lines = [];

  // 1. 视频概览（自动插入在文档开头）
  lines.push('## 📹 视频概览');
  lines.push('');
  lines.push(`- **页数**: ${scenes.length} 页`);
  lines.push(`- **时长**: 约 ${Math.ceil(scenes.length * 0.8)} 分钟`);
  lines.push(`- **分辨率**: 1920×1080 (H.264)`);
  lines.push('');

  // 2. 内容导览表格
  lines.push('## 📋 内容导览');
  lines.push('');
  lines.push('| 页码 | 主题 | 关键词 |');
  lines.push('|------|------|--------|');

  scenes.forEach(s => {
    const keywords = (s.body || []).slice(0, 2).join(', ');
    lines.push(`| ${s.id} | ${s.title || '无标题'} | ${keywords} |`);
  });
  lines.push('');

  // 3. 分隔线
  lines.push('---');
  lines.push('');

  // 4. 逐字稿
  lines.push('## 📝 逐字稿');
  lines.push('');

  scenes.forEach((s, idx) => {
    lines.push(`### 第 ${s.id} 页: ${s.title || '无标题'}`);
    lines.push('');
    const content = s.script || (s.body || []).join('\n') || '';
    lines.push(content);
    lines.push('');
    if (idx < scenes.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  // 5. 原文链接（可选）
  if (sourceUrl) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 🔗 原文');
    lines.push('');
    lines.push(`<callout emoji="🔗" background-color="gray">${sourceUrl}</callout>`);
  }

  return lines.join('\n');
}
