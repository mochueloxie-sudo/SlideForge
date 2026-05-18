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
const { buildVisualSlotReport, visualSlotsReportMarkdown } = require('../utils/visual_slot_report');

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

    let scenesMeta = null;
    if (scenesPath && fs.existsSync(scenesPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(scenesPath, 'utf8'));
        scenesMeta = Array.isArray(parsed) ? parsed : parsed.scenes;
      } catch (_) {
        scenesMeta = null;
      }
    }

    const report = runCritique(outDir, { scenesPath });
    const visualSlots = scenesMeta
      ? buildVisualSlotReport(scenesMeta, { scenesPath, htmlDir: outDir })
      : { slots: [], gaps_for_user: [], has_gaps: false };

    const jsonPath = path.join(outDir, 'critique.json');
    const mdPath = path.join(outDir, 'critique_report.md');
    const visualSlotsPath = path.join(outDir, 'visual_slots_report.json');
    const mdBody = critiqueReportMarkdown(report) + visualSlotsReportMarkdown(visualSlots);

    fs.writeFileSync(jsonPath, JSON.stringify({ ...report, visual_slots: visualSlots }, null, 2), 'utf8');
    if (visualSlots.has_gaps) {
      fs.writeFileSync(visualSlotsPath, JSON.stringify(visualSlots, null, 2), 'utf8');
    } else if (fs.existsSync(visualSlotsPath)) {
      fs.unlinkSync(visualSlotsPath);
    }
    fs.writeFileSync(mdPath, mdBody, 'utf8');

    const outputs = [jsonPath, mdPath];
    if (visualSlots.has_gaps) outputs.push(visualSlotsPath);

    writeResult({
      success: true,
      step: 'critique',
      outputs,
      message: `Critique: ${report.summary.errors} errors, ${report.summary.warnings} warnings`
        + (visualSlots.has_gaps ? `; ${visualSlots.gaps_for_user.length} visual slot(s) for user` : ''),
      metadata: {
        critique: report,
        visual_slots: visualSlots,
        critique_json: path.relative(process.cwd(), jsonPath),
        critique_report: path.relative(process.cwd(), mdPath),
        visual_slots_report: visualSlots.has_gaps
          ? path.relative(process.cwd(), visualSlotsPath)
          : null
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
