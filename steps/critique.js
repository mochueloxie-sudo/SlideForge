#!/usr/bin/env node
/**
 * Q2-C — Static critique of generated HTML (separate from validate).
 *
 * AI-GENERATED (Cursor)
 */

const fs = require('fs');
const path = require('path');
const { writeResult } = require('./utils/step-utils');
const { runCritique, critiqueReportMarkdown } = require('../utils/critique_static');

let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const params = JSON.parse(input);
    const html_dir = params.html_dir;
    if (!html_dir) {
      throw new Error('critique: required field "html_dir"');
    }
    const scenesPath = params.scenes ? path.resolve(params.scenes) : null;
    const outDir = path.resolve(html_dir);

    const report = runCritique(outDir, { scenesPath });
    const jsonPath = path.join(outDir, 'critique.json');
    const mdPath = path.join(outDir, 'critique_report.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(mdPath, critiqueReportMarkdown(report), 'utf8');

    writeResult({
      success: true,
      step: 'critique',
      outputs: [jsonPath, mdPath],
      message: `Critique: ${report.summary.errors} errors, ${report.summary.warnings} warnings`,
      metadata: {
        critique: report,
        critique_json: path.relative(process.cwd(), jsonPath),
        critique_report: path.relative(process.cwd(), mdPath)
      }
    });
  } catch (err) {
    const report = {
      ok: false,
      html_dir: null,
      pages: [],
      summary: { errors: 1, warnings: 0, info: 0 },
      findings: [{ level: 'error', code: 'CRIT_TOOL_ERROR', message: err.message }]
    };
    writeResult({
      success: false,
      step: 'critique',
      outputs: [],
      message: err.message,
      metadata: { critique: report }
    });
  }
  process.exit(0);
});
