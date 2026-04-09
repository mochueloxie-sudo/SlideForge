// LLM client — MiniMax HTTP wrapper with retry helper
// Step 0 / Step 1 直接在各自文件中调用 MiniMax；此文件保留供未来扩展使用

const https = require('https');

/**
 * 调用 MiniMax Chat Completions API
 * @param {Object} params - { messages, model, temperature, ... }
 * @param {number} retries
 */
async function callMiniMax(params, retries = 3) {
  const apiKey   = process.env.MINIMAX_API_KEY;
  const model    = process.env.MINIMAX_MODEL    || 'MiniMax-M2.7-highspeed';
  const baseUrl  = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';

  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');

  const body = JSON.stringify({ model, ...params });
  const url  = new URL(`${baseUrl}/chat/completions`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const text = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: url.hostname,
          path:     url.pathname + url.search,
          method:   'POST',
          headers:  {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      const json = JSON.parse(text);
      if (json.error) throw new Error(JSON.stringify(json.error));
      return json;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
}

module.exports = { callMiniMax };
