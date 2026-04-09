// Content extractor — handles Feishu docs, local files, and web URLs
// Returns { source_type, title, raw_text, raw_html? }

const fs = require('fs');
const path = require('path');

// ─── Source type detection ───────────────────────────────────────────────────

function detectSourceType(input) {
  if (!input) throw new Error('No input source provided');
  if (isFeishuUrl(input)) return 'feishu';
  if (isWebUrl(input)) return 'web';
  if (fs.existsSync(input)) return 'local';
  throw new Error(`Cannot determine source type for: ${input}`);
}

function isFeishuUrl(s) {
  return /feishu\.cn|larksuite\.com/.test(s);
}

function isWebUrl(s) {
  return /^https?:\/\//i.test(s);
}

// ─── Feishu doc extraction ───────────────────────────────────────────────────

async function extractFeishu(url) {
  // Parse document token from URL
  // e.g. https://xxx.feishu.cn/docx/AbCdEfGhIjKl
  const match = url.match(/\/(docx|docs|wiki)\/([A-Za-z0-9_-]{10,})/);
  if (!match) throw new Error(`Cannot parse Feishu doc token from URL: ${url}`);
  const docToken = match[2];

  // Require env vars
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      'FEISHU_APP_ID and FEISHU_APP_SECRET env vars required for Feishu extraction'
    );
  }

  process.stderr.write(`📄 Fetching Feishu doc token: ${docToken}\n`);

  // 1. Get tenant access token
  const tokenRes = await fetchJSON('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  if (!tokenRes.tenant_access_token) {
    throw new Error(`Feishu auth failed: ${JSON.stringify(tokenRes)}`);
  }
  const token = tokenRes.tenant_access_token;

  // 2. Fetch document metadata for title
  let docTitle = `Feishu Doc ${docToken}`;
  try {
    const metaRes = await fetchJSON(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (metaRes.code === 0 && metaRes.data?.document?.title) {
      docTitle = metaRes.data.document.title;
    }
  } catch (e) {
    process.stderr.write(`⚠️  Could not fetch doc title: ${e.message}\n`);
  }

  // 3. Fetch doc content (plain text via blocks API, fallback to raw content API)
  let rawText = '';
  try {
    rawText = await fetchFeishuDocxBlocks(docToken, token);
  } catch (e) {
    process.stderr.write(`⚠️  Blocks API failed (${e.message}), trying raw content API\n`);
    rawText = await fetchFeishuRawContent(docToken, token);
  }

  return {
    source_type: 'feishu',
    title: docTitle,
    raw_text: rawText
  };
}

async function fetchFeishuDocxBlocks(docToken, token) {
  const res = await fetchJSON(
    `https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}/blocks?document_revision_id=-1&page_size=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.code !== 0) throw new Error(`blocks API error: ${res.msg}`);
  // Flatten block text
  const lines = [];
  for (const block of res.data?.items || []) {
    const text = extractBlockText(block);
    if (text) lines.push(text);
  }
  return lines.join('\n');
}

function extractBlockText(block) {
  const bt = block.block_type;
  // Heading and text blocks
  const elements = block.heading1?.elements || block.heading2?.elements ||
    block.heading3?.elements || block.text?.elements || block.code?.elements || [];
  if (elements.length) {
    return elements.map(e => e.text_run?.content || '').join('');
  }
  // Bullet / ordered list
  const bullet = block.bullet?.elements || block.ordered?.elements || [];
  if (bullet.length) {
    return '• ' + bullet.map(e => e.text_run?.content || '').join('');
  }
  return '';
}

async function fetchFeishuRawContent(docToken, token) {
  // Fallback: use docs v2 content API
  const res = await fetchJSON(
    `https://open.feishu.cn/open-apis/docs/v2/documents/${docToken}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.code !== 0) throw new Error(`content API error: ${res.msg}`);
  return res.data?.content || '';
}

// ─── Local file extraction ───────────────────────────────────────────────────

async function extractLocal(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  process.stderr.write(`📁 Reading local file: ${filePath} (${ext})\n`);

  if (ext === '.md' || ext === '.txt') {
    const raw = fs.readFileSync(filePath, 'utf8');
    const title = extractMdTitle(raw) || path.basename(filePath, ext);
    return { source_type: 'local', title, raw_text: raw };
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    const title = path.basename(filePath, '.docx');
    return { source_type: 'local', title, raw_text: result.value };
  }

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const title = data.info?.Title || path.basename(filePath, '.pdf');
    return { source_type: 'local', title, raw_text: data.text };
  }

  throw new Error(`Unsupported local file type: ${ext}. Supported: .md .txt .docx .pdf`);
}

function extractMdTitle(text) {
  const m = text.match(/^#\s+(.+)/m);
  return m ? m[1].trim() : null;
}

// ─── Web URL extraction ──────────────────────────────────────────────────────

async function extractWeb(url) {
  process.stderr.write(`🌐 Fetching web page: ${url}\n`);

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    throw new Error('puppeteer not installed — cannot extract web content');
  }

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const extracted = await page.evaluate(() => {
      // Remove noise elements
      const remove = ['script', 'style', 'nav', 'header', 'footer', 'iframe',
        'aside', '.ad', '.advertisement', '.sidebar', '#sidebar', '.cookie',
        '.popup', '.modal', '.banner'];
      remove.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      const title = document.title || document.querySelector('h1')?.textContent?.trim() || '';

      // Try article / main content first, fall back to body
      const container = document.querySelector('article, main, [role="main"], .content, #content, .post-content, .article-body') || document.body;

      // Extract text preserving paragraph structure
      const lines = [];
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        const tag = node.tagName.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'h4', 'li', 'td', 'th', 'blockquote'].includes(tag)) {
          const text = node.textContent.trim();
          if (text.length > 10) lines.push(text);
        }
      }

      // Deduplicate adjacent duplicates
      const deduped = lines.filter((l, i) => l !== lines[i - 1]);
      return { title, text: deduped.join('\n') };
    });

    return {
      source_type: 'web',
      title: extracted.title,
      raw_text: extracted.text,
      source_url: url
    };
  } finally {
    await browser.close();
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

async function extract(input) {
  const sourceType = detectSourceType(input);
  switch (sourceType) {
    case 'feishu': return extractFeishu(input);
    case 'local':  return extractLocal(input);
    case 'web':    return extractWeb(input);
  }
}

// ─── Tiny HTTP helper ─────────────────────────────────────────────────────────

async function fetchJSON(url, opts = {}) {
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(url, {
      method: opts.method || 'GET',
      headers: opts.headers || {}
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

module.exports = { extract, detectSourceType };
