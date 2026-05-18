/**
 * Q2-C — Static HTML critique (cheerio-based, no network).
 *
 * AI-GENERATED (Cursor)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { CRITIQUE_RULES, DECK_CRITIQUE_RULES, pageStructureFingerprint } = require('./critique_rules');

const DEFAULT_BASELINE_PATH = path.join(__dirname, '..', 'examples/golden/critique_baseline.json');

/**
 * @param {string} [baselinePath]
 * @returns {Record<string, { allow?: string[] }>|null}
 */
function loadCritiqueBaseline(baselinePath = DEFAULT_BASELINE_PATH) {
  const abs = path.resolve(baselinePath);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * @param {object[]} findings
 * @param {string} deckName
 * @param {Record<string, { allow?: string[] }>|null} baseline
 * @returns {{ findings: object[], suppressed: object[] }}
 */
function applyCritiqueBaseline(findings, deckName, baseline) {
  const allow = new Set(baseline?.[deckName]?.allow || []);
  if (!allow.size) return { findings, suppressed: [] };
  const kept = [];
  const suppressed = [];
  for (const f of findings) {
    if (allow.has(f.code)) suppressed.push({ ...f, suppressed: true });
    else kept.push(f);
  }
  return { findings: kept, suppressed };
}

/**
 * @param {object[]} findings
 * @returns {{ errors: number, warnings: number, info: number }}
 */
function summarizeFindings(findings) {
  const counts = { errors: 0, warnings: 0, info: 0 };
  for (const f of findings) {
    if (f.level === 'error') counts.errors++;
    else if (f.level === 'warning') counts.warnings++;
    else counts.info++;
  }
  return counts;
}

/**
 * @param {string} htmlDir
 * @param {{ scenesPath?: string|null, deckName?: string|null, baselinePath?: string|null, applyBaseline?: boolean }} [opts]
 * @returns {object}
 */
function runCritique(htmlDir, opts = {}) {
  const abs = path.resolve(htmlDir);
  const deckName = opts.deckName || path.basename(abs);
  let scenesMeta = null;
  if (opts.scenesPath && fs.existsSync(opts.scenesPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(opts.scenesPath, 'utf8'));
      scenesMeta = Array.isArray(parsed) ? parsed : parsed.scenes;
    } catch (_) {
      scenesMeta = null;
    }
  }

  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    return {
      ok: false,
      html_dir: abs,
      deck: deckName,
      pages: [],
      summary: { errors: 1, warnings: 0, info: 0 },
      findings: [{
        level: 'error',
        code: 'CRIT_NO_HTML_DIR',
        message: `html_dir missing or not a directory: ${abs}`
      }]
    };
  }

  const files = fs.readdirSync(abs)
    .filter(f => /^page_\d+\.html$/i.test(f))
    .sort();

  const ctx = { scenesMeta, deckName, htmlDir: abs };
  let findings = [];
  const pageMeta = [];

  for (const file of files) {
    const fp = path.join(abs, file);
    const raw = fs.readFileSync(fp, 'utf8');
    const $ = cheerio.load(raw, { decodeEntities: false });
    const pageNum = parseInt(file.match(/(\d+)/)?.[1] || '0', 10);
    const scene = Array.isArray(scenesMeta) ? scenesMeta[pageNum - 1] : null;
    const pageCtx = { $, raw, scene, pageNum, file, ctx };

    pageMeta.push({
      file,
      pageNum,
      fingerprint: pageStructureFingerprint($, scene)
    });

    for (const rule of CRITIQUE_RULES) {
      const hits = rule.run(pageCtx) || [];
      findings.push(...hits);
    }
  }

  for (const rule of DECK_CRITIQUE_RULES) {
    const hits = rule.runDeck({ pages: pageMeta, scenesMeta, ctx }) || [];
    findings.push(...hits);
  }

  let suppressed = [];
  if (opts.applyBaseline !== false) {
    const baseline = loadCritiqueBaseline(opts.baselinePath || DEFAULT_BASELINE_PATH);
    const applied = applyCritiqueBaseline(findings, deckName, baseline);
    findings = applied.findings;
    suppressed = applied.suppressed;
  }

  const summary = summarizeFindings(findings);

  return {
    ok: summary.errors === 0,
    html_dir: abs,
    deck: deckName,
    pages: files,
    summary,
    findings,
    ...(suppressed.length ? { suppressed } : {})
  };
}

function critiqueReportMarkdown(report) {
  const lines = [
    '# SlideForge critique report',
    '',
    `- **html_dir**: \`${report.html_dir}\``,
    `- **deck**: \`${report.deck || path.basename(report.html_dir)}\``,
    `- **pages scanned**: ${report.pages.length}`,
    `- **summary**: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    ''
  ];
  if (report.suppressed?.length) {
    lines.push(
      `- **baseline suppressed**: ${report.suppressed.length} finding(s)`,
      ''
    );
  }
  if (!report.findings.length && !report.suppressed?.length) {
    lines.push('_No findings._', '');
    return lines.join('\n');
  }
  for (const f of report.findings) {
    lines.push(`## ${f.level.toUpperCase()}: ${f.code}`, '');
    if (f.file) lines.push(`- **file**: \`${f.file}\``);
    lines.push(`- ${f.message}`, '');
  }
  if (report.suppressed?.length) {
    lines.push('## Suppressed (critique baseline)', '');
    for (const f of report.suppressed) {
      lines.push(`- \`${f.code}\`${f.file ? ` — ${f.file}` : ''}: ${f.message}`, '');
    }
  }
  return lines.join('\n');
}

module.exports = {
  runCritique,
  critiqueReportMarkdown,
  loadCritiqueBaseline,
  applyCritiqueBaseline,
  summarizeFindings
};
