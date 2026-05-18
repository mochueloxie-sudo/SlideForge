# SlideForge

[![CI](https://github.com/mochueloxie-sudo/SlideForge/actions/workflows/ci.yml/badge.svg)](https://github.com/mochueloxie-sudo/SlideForge/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/mochueloxie-sudo/SlideForge?display_name=tag&color=blue&label=release)](https://github.com/mochueloxie-sudo/SlideForge/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen)](https://nodejs.org/)

> **Agent-first** slide generation skill — your host Agent writes `scenes.json`; SlideForge renders **1920×1080** decks. **Primary delivery: PDF / HTML** (video optional). **No external LLM dependency.**

**v4.2 highlights**: `preview` (theme try-on) · `critique` (pre-ship HTML checks) · optional per-page `art-directed` CSS. Visual quality from 4.1 (hero slots, typography adapt, depth layouts) in [CHANGELOG](CHANGELOG.md#420--2026-05-18--q2-双模式预览与-critique).

[中文](README.md) · [SKILL.md](SKILL.md) · [SCENES_SCHEMA](docs/SCENES_SCHEMA.md) · [CRITIQUE](docs/CRITIQUE.md) · [CLAUDE.md](CLAUDE.md) · [CHANGELOG](CHANGELOG.md)

**[View demo output →](examples/demo-output/)** Open `presentation.html` (iframe shell + co-located `page_*.html`; **never ship a single HTML alone**). For single-file sharing use `presentation_static.html`.

---

## Quick Start

```bash
git clone https://github.com/mochueloxie-sudo/SlideForge.git && cd slide-forge
npm install
npm run demo:html-local
open ./demo_html_out/presentation.html
```

**Real workflow** (host Agent perspective):

```bash
# 1. (optional) Extract external material into plain text
echo '{"command":"extract","source":"<URL or path>","output_dir":"./project"}' | node executor.js

# 2. Agent reads the text → writes ./project/scenes.json per docs/SCENES_SCHEMA.md

# 3. Self-check (while writing scenes)
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js

# 3b. (optional) Try Top 3 themes — cover + first content page only
echo '{"command":"preview","scenes":"./project/scenes.json","output_dir":"./project/preview"}' | node executor.js
open ./project/preview/preview.html

# 4. Render (design → html → screenshot → tts → package → deliver)
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["pdf","html"],"design_mode":"deep-tech-keynote"}' | node executor.js

# 5. (optional) Pre-ship HTML critique
echo '{"command":"critique","html_dir":"./project","scenes":"./project/scenes.json"}' | node executor.js

open ./project/presentation.html
```

More in **[SKILL.md](SKILL.md)**; schema **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**; critique rules **[docs/CRITIQUE.md](docs/CRITIQUE.md)**.

---

## Documentation Map

| Audience | File | Purpose |
|----------|------|---------|
| Host Agent | [SKILL.md](SKILL.md) | 5-step workflow, commands, troubleshooting, delivery notes |
| Agent writing scenes | [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) | Field tables for 22 variants + decision tree + minimal examples |
| Contributors | [CLAUDE.md](CLAUDE.md) | Architecture, samples, tokens, Roadmap, debugging |
| Upgraders | [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Features

- **13 themes** × **22 variants**: sample-driven; depth layouts in `samples/_core/layouts/` + per-theme tokens
- **3 input sources** / **3 output formats**: Feishu / local / web → **PDF / HTML (recommended)** / MP4 (optional)
- **Pre-ship QA**: `validate` (JSON + `quality_warnings`) → post-render `critique` (static HTML scan)
- **Theme preview**: `preview` — Top 3 themes × 2-page slice → `preview.html` grid
- **Hero & typography (optional)**: `hero_image` / `diagram`; `typography: "adapt"` or `typography_scale: "adapt"`
- **Per-page CSS**: `mode: "art-directed"` + `custom_css` / `custom_css_file` (sanitized injection)
- **Page animations**: CSS entrance in browser; **video export still uses static screenshot frames**
- **11 commands**: `extract` / `validate` / `preview` / `design` / `html` / `critique` / `screenshot` / `tts` / `package` / `deliver` / `render`
- **5 golden decks** regression (`npm run check:golden`)

---

## Themes

13 ready-made themes, **7 dark** + **6 light**, each a fully integrated visual system (typography / palette / panels / decorations / motion codified once in `samples/{theme}/`).

| Mode | Theme id | Use case |
|------|----------|----------|
| Dark | `electric-studio` | General fallback |
| Dark | `bold-signal` | Business / brand / marketing |
| Dark | `creative-voltage` | Creative / design |
| Dark | `dark-botanical` | Humanities / education |
| Dark | `neon-cyber` | Sci-fi / AI / gaming |
| Dark | `terminal-green` | Tech docs / APIs |
| Dark | `deep-tech-keynote` | Technical keynotes |
| Light | `swiss-modern` | Minimal / Swiss |
| Light | `paper-ink` | Editorial / publishing (golden: `editorial_notes`) |
| Light | `vintage-editorial` | Vintage / literary |
| Light | `notebook-tabs` | Notes / journaling |
| Light | `pastel-geometry` | Lively / playful |
| Light | `split-pastel` | Gentle / feminine |

Pin one with `design_mode` in JSON; omit and the `design` command auto-matches by content keywords. Resolution order: **explicit JSON > `project.json` `recommended_design_mode` > content rules**.

---

## Variants

22 built-in layouts cover narrative / data / flow / comparison / architecture / cards / etc. All variants connect to all 13 themes. Full field tables, minimal examples, and decision tree in **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**.

---

## Pipeline

```
source ── (optional) extract ──▶ Agent writes scenes.json ──▶ validate
       ──▶ (optional) preview pick theme ──▶ render ──▶ (optional) critique
```

Every step persists artifacts to disk; any command can be re-run. Run `critique` after `html`, before `package`.

---

## Requirements

| Dependency | When needed | Install |
|------------|-------------|---------|
| **Node.js ≥ 18** (**20+ for critique**) | Always | [nodejs.org](https://nodejs.org/) |
| **npm deps (incl. cheerio)** | `critique` / `check:golden` | `npm install` in repo |
| **Google Chrome / bundled Puppeteer** | Screenshots + PDF (screenshot / package) | Usually pre-installed |
| `edge-tts` | video only | `pip install edge-tts` (or macOS `say`) |
| `ffmpeg` | video only | `brew install ffmpeg` |
| `lark-cli` + Feishu credentials | Feishu source / `channel:"feishu"` (embed **mp4 and/or pdf** in doc) | `npm i -g @larksuite/cli` + `.env` `FEISHU_*` |

**No LLM API credentials required.**

---

## Output Structure

```
output/
├── scenes.json                  # Written by Agent
├── (project.json)               # Optional, Agent-written
├── design_params.json           # design command output
├── page_001.html ... page_N.html
├── screenshots/page_*.png       # 1920×1080
├── presentation.html            # iframe shell — MUST ship with all page_*.html
├── presentation_static.html     # Embedded PNGs, single-file shareable
├── presentation.pdf
├── presentation.mp4             # when format=video
├── critique.json / critique_report.md   # critique command
├── outline.md / script.md
└── MANIFEST.md                  # channel=local
```

**HTML delivery note**: `presentation.html` is an iframe shell; you **must** ship it together with the entire `page_*.html` set. For single-file sharing use `presentation_static.html` or the PDF.

---

## Automation & Tool Integration

`stdin` JSON → `node executor.js` → `stdout` JSON. Machine-readable contract in [_meta.json](_meta.json); execution details in [SKILL.md](SKILL.md); scenes authoring in [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md).

- **Cursor / Claude Code / OpenClaw**: register `SKILL.md` + `docs/SCENES_SCHEMA.md` per the client's mechanism
- **Scripts / CI**: pipe one JSON line into stdin or `node executor.js ./request.json`

---

## Contributing

```bash
git checkout -b feat/my-feature
# Visual decisions go in samples/*.html (not in generator code)
# Templates use px (target 1920×1080); token naming {{UPPER_CASE}}
# New variants must also update docs/SCENES_SCHEMA.md and steps/validate.js
npm run check:golden   # or npm run test:e2e
```

Full dev guide, debugging tips, and Roadmap in **[CLAUDE.md](CLAUDE.md)**.

---

## License

[MIT](LICENSE)
