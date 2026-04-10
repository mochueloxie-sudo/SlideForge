# SlideForge

[中文](README.md)
[Changelog](CHANGELOG.md)
[Agent skill: SKILL.md](SKILL.md)

> Turn any document into a polished 1920×1080 presentation — video, PDF, or interactive HTML — in under 10 minutes.

[Node.js](https://nodejs.org/)
[License: MIT](LICENSE)
[Version](_meta.json)

**This repo is primarily built for AI agents**: a standard skill file plus a JSON manifest let **Cursor, Codex, OpenClaw / Clawdbot**, and similar run the same `executor.js` pipeline (stdin JSON → stdout results) in a sandbox or locally. Human developers can also run `node executor.js` directly.

Feed in a Feishu doc, Markdown file, or any URL. The pipeline analyses your content with MiniMax LLM, picks one of **13 design themes**, renders pixel-perfect HTML slides, and packages the result in your chosen format — all fully automatic.

**[View demo output →](examples/demo-output/)** Open `presentation.html` (iframe slides: hover + entrance animations). For PNG-only carousel matching PDF frames, use `presentation_static.html`.

## Features

- **13 design themes** — 7 dark + 6 light; each is a full 1920×1080 template pack with its own palette and tone, wired to every style variant below (see **Design themes**)
- **3 input sources** — Feishu docs, local `.md`/`.txt` files, web pages
- **3 output formats** — MP4 video (with TTS narration), PDF, interactive HTML slideshow
- **22 style variants** — narrative, data, flow, compare, architecture/funnel, cards, code, and hybrid layouts—unified look per theme (see **Style variants**)
- **Layout hints** — many variants offer alternate compositions (dense grids, cards, wide left/right, swimlanes, …) without changing the base style
- **Adaptive typography** — font sizes, grid columns, and density classes adjust to content length automatically
- **In-slide motion (HTML / screenshots)** — `design_params.page_animations` and `page_animation_preset` (`none` \| `fade` \| `stagger`); interactive `presentation.html` replays entrance motion on page change; `presentation_static.html` is PNG-only frames aligned with PDF
- **8 independent steps** — run the full pipeline or any step in isolation; all intermediate artifacts are persisted to disk
- **Outline + script** — every export includes `outline.md` and `script.md`
- **Agent-ready** — `SKILL.md` + `_meta.json` ship with the npm package (see **Agent setup (required)** below)

---

## Design themes

Each theme is a **complete visual system**: typography, palette, panel treatment, ornament, and light/dark mood are authored once under `samples/` and applied across **covers, body slides, data, and flow layouts**—so the deck reads as one production, not a patchwork of one-offs.

The repo ships **13** finished themes (7 dark / 6 light), all wired to the **22 style variants** below—switching themes changes the “film grade and art direction” while timelines, funnels, compares, stacks, and the rest stay available.

Set `design_mode` in JSON to **pin** a theme id; omit it for automatic selection (priority and rules: **Agent setup → How `design_mode` is resolved** below).

### Dark

| Theme               | Accent                 | Best for                   |
| ------------------- | ---------------------- | -------------------------- |
| `electric-studio`   | Blue-purple + sky blue | General (default fallback) |
| `bold-signal`       | Orange-red             | Business, branding         |
| `creative-voltage`  | Electric blue          | Creative, design           |
| `dark-botanical`    | Warm gold              | Humanities, education      |
| `neon-cyber`        | Neon cyan + purple     | Sci-fi, AI, gaming         |
| `terminal-green`    | GitHub green + blue    | Tech docs, APIs            |
| `deep-tech-keynote` | Sky blue + blue-purple | Keynote talks              |

### Light

| Theme               | Accent            | Best for              |
| ------------------- | ----------------- | --------------------- |
| `swiss-modern`      | Pure black        | Minimalist            |
| `paper-ink`         | Red + black       | Editorial, publishing |
| `vintage-editorial` | Brown-gold        | Retro, literary       |
| `notebook-tabs`     | Mint green        | Notes, journaling     |
| `pastel-geometry`   | Pastel + geometry | Playful, casual       |
| `split-pastel`      | Soft pink + blue  | Gentle, feminine      |

---

## Style variants

**22** built-in layouts span everything from a single strong message to layered technical storytelling; **all variants work with all 13 themes**, so you can swap the art direction without giving up compare views, funnels, stacks, or timelines.

- **Narrative & reading** — hero text, bullet panels, two-column prose, pull quotes, big-number emphasis, and more.
- **Data & metrics** — multi-stat boards, tables, light charts, and hybrids (e.g. number + bullets, list + stat).
- **Flow & structure** — timelines, stage rails and swimlanes, layered architecture stacks, conversion funnels, side-by-side contrast (e.g. before/after).
- **Showcase & assets** — icon/emoji grids, card walls, code blocks, section nav bars, text + icon mixes.

Many variants also support **alternate compositions** (multi-column grids, card layouts, asymmetric columns, swimlanes, …) via `layout_hint`—**change layout without changing the base variant**. Field names, allowed values, and machine-readable variant ids are in **`SKILL.md`**; how they are inferred is under **Agent setup → How variants and layout hints are chosen** below.

---

## Agent setup (required)

For **Cursor, Codex, OpenClaw / Clawdbot**, and similar: after cloning or installing the package, **read and register `SKILL.md`** (full schema and examples align with `_meta.json`).

| File | Role |
|------|------|
| **`SKILL.md`** | **Required skill bundle**: YAML front matter (`type: agent`, `input`/`output` schema, **includes all 13 theme ids**) plus step-by-step CLI examples; register it with your platform’s Skills / Plugins rules. |
| **`_meta.json`** | Lightweight manifest (version, `command` enum, `executor` path) for discovery and tooling. |
| **`executor.js`** | Single entrypoint: `echo '<json>' \| node executor.js` — matches the examples in `SKILL.md`. |

**`npm pack` / `npm publish` tarballs include `SKILL.md` and `_meta.json`** alongside `steps/`, `samples/`, and other runtime files—no separate skill copy step.

### Ask the user before running (recommended)

Before invoking `executor.js` on the user’s behalf, the agent should **confirm a few choices** and map them to JSON fields such as `format`, `channel`, and `source`. **Do not** silently default to `format: "video"`—it is the slowest path and requires FFmpeg and TTS.

Suggested order (merge into one confirmation if the user already stated everything):

1. **Source** — Feishu doc URL, local `.md`/`.txt` path, or web page URL? (`source`)
2. **Output formats** — PDF only, HTML only, video only, or **multiple**? (`format` as a string or array, e.g. `["pdf","html"]`)  
   - If **video** is included, **FFmpeg** and **edge-tts** (or macOS `say` fallback) are required; Step 5 runs TTS.
3. **Delivery channel** — **Local** artifacts under `output_dir`, or **publish to Feishu**? (`channel`: `local` default / `feishu`)  
   - For **feishu**, Feishu app credentials in `.env` are required, plus values such as **`doc_title`** and **`folder_token`**; if anything is missing, do not set `channel: feishu` until the user supplies them.
4. **(Optional)** — Pin **`design_mode`**? Custom **`output_dir`**? Disable in-slide motion with **`page_animations: false`**?

For the full checklist and `request.json` usage (no shell pipe), see **`SKILL.md`** (“Agent 触发后的交互” and “OpenClaw / 受限 exec”).

### How `design_mode` is resolved

Matches the **Design themes** section above. When `design_mode` is **not** in the current request JSON, resolution order is:

1. **`recommended_design_mode`** from Step 0 in `project.json` (when the LLM returns the object wrapper with a valid theme id).
2. **`design_mode`** in `project.json` if set and not the default `electric-studio`.
3. **Content-keyword rules** (`inferContentType` + `CONTENT_TYPE_MAP`), e.g. humanities / curation → `dark-botanical`.

An explicit `design_mode` in the **current** `executor.js` JSON always wins.

### How variants and layout hints are chosen

Step 0 structures content into scenes with suggested layouts; Step 2 **infers and rhythm-corrects** variants (so consecutive slides do not all look identical). `layout_hint` tweaks composition **without swapping the HTML template**. For full manual control, edit `scenes.json` / `design_params.json` and re-run from the relevant step.

---

## Quick Start

```bash
# 1. Install
git clone https://github.com/mochueloxie-sudo/SlideForge.git
cd slide-forge
npm install

# 2. Configure
cp .env.example .env
# Edit .env → add MINIMAX_API_KEY (required)

# 3. Run (one command)
echo '{"command":"all","source":"./examples/test_article.md","format":"html","output_dir":"./output"}' | node executor.js
# Optional: pin a theme (see “Design themes” above)
# echo '{"command":"all","source":"./examples/test_article.md","format":"html","output_dir":"./output","design_mode":"deep-tech-keynote"}' | node executor.js

# 4. Open the result
open ./output/presentation.html   # primary; PNG carousel: presentation_static.html
```

### Other Formats

```bash
# PDF
echo '{"command":"all","source":"./article.md","format":"pdf","output_dir":"./out"}' | node executor.js

# Video (requires ffmpeg + edge-tts)
echo '{"command":"all","source":"./article.md","format":"video","output_dir":"./out"}' | node executor.js

# Multiple formats at once
echo '{"command":"all","source":"./article.md","format":["pdf","html"],"output_dir":"./out"}' | node executor.js
```

---

## Pipeline

```
Source (Feishu / .md / URL)
  │
  ▼
Step 0 ── Content Analysis ──────── MiniMax LLM → scenes.json
  │
  ▼
Step 1 ── Script Generation ─────── MiniMax LLM → scenes[].script
  │
  ▼
Step 2 ── Design Parameters ─────── Local presets → design_params.json
  │                                  (explicit design_mode, Step0 recommendation, saved theme, or content-keyword rules + variant/layout hints)
  ▼
Step 3 ── HTML Rendering ───────── Template tokens → page_XXX.html
  │
  ▼
Step 4 ── Screenshot ───────────── Puppeteer → page_XXX.png (1920×1080)
  │
  ▼
Step 5 ── TTS ──────────────────── edge-tts → page_XXX.mp3 (skipped if no video)
  │
  ▼
Step 6 ── Delivery Format ──────── video / pdf / html + outline.md + script.md
  │
  ▼
Step 7 ── Delivery Channel ─────── local (default) / feishu
```

Every step reads and writes JSON to disk. You can re-run any step in isolation, inspect intermediates, or hand-edit `scenes.json` before continuing.

---

## Requirements


| Dependency          | Purpose                               | Install                                   |
| ------------------- | ------------------------------------- | ----------------------------------------- |
| **Node.js ≥ 18**    | Runtime                               | [nodejs.org](https://nodejs.org/)         |
| **Google Chrome**   | Screenshots + PDF (Step 4/6)          | Usually pre-installed                     |
| **MiniMax API Key** | Content analysis + scripts (Step 0/1) | [minimax.chat](https://api.minimax.chat/) |
| `edge-tts`          | TTS narration (Step 5, video only)    | `pip install edge-tts`                    |
| `ffmpeg`            | Video encoding (Step 6, video only)   | `brew install ffmpeg`                     |
| `lark-cli`          | Feishu publishing (Step 7, optional)  | `npm i -g @larksuite/cli`                 |


### Environment Variables

Copy `.env.example` to `.env` and fill in:

```ini
# Required
MINIMAX_API_KEY=sk-...
MINIMAX_MODEL=MiniMax-M2.7-highspeed
MINIMAX_BASE_URL=https://api.minimax.chat/v1

# Optional — Feishu integration
FEISHU_APP_ID=cli_...
FEISHU_APP_SECRET=...
```

---

## Output Structure

```
output/
├── scenes.json            # Structured scene data + scripts
├── design_params.json     # Theme, variants, layout hints
├── page_001.html          # Rendered HTML slides
├── page_002.html
├── ...
├── screenshots/
│   ├── page_001.png       # 1920×1080 screenshots
│   └── ...
├── presentation.html        # Primary: iframe slides (hover + motion)
├── presentation_static.html # PNG carousel (same as PDF frames)
├── presentation.pdf       # PDF document (format=pdf)
├── presentation.mp4       # Video with narration (format=video)
├── outline.md             # Content outline
├── script.md              # Full narration script
└── MANIFEST.md            # Delivery manifest (channel=local)
```

### `format=html`: two browser entrypoints (important for agents)

- **`presentation.html`** loads **`page_*.html`** in the **same directory** via **iframe**—that is where **in-slide DOM, hover, and CSS entrance animations** work. Ship the **whole output folder** (at least `presentation.html` + every `page_*.html`), or a zip of it. **Do not** hand users a single “bundled” HTML and call it the interactive deck.
- **`presentation_static.html`** (or any **single-file** carousel that only embeds PNG screenshots) is a **bitmap flipbook** aligned with PDF frames—fine for one-file sharing, but **no** interactive behavior inside each slide’s template. Don’t label it the same as the iframe primary entry.

---

## Step-by-Step Usage

Run individual steps when you need fine-grained control:

```bash
P=./project

# Analyse content
echo '{"command":"step0","source":"./article.md","output_dir":"'"$P"'"}' | node executor.js

# Generate narration scripts
echo '{"command":"step1","scenes":"'"$P"'/scenes.json","output_dir":"'"$P"'"}' | node executor.js

# Design parameters (auto theme, or specify)
echo '{"command":"step2","scenes":"'"$P"'/scenes.json","output_dir":"'"$P"'","design_mode":"neon-cyber"}' | node executor.js

# Render HTML slides
echo '{"command":"step3","scenes":"'"$P"'/scenes.json","design_params":"'"$P"'/design_params.json","output_dir":"'"$P"'"}' | node executor.js

# Take screenshots
echo '{"command":"step4","html_dir":"'"$P"'","output_dir":"'"$P"'/screenshots"}' | node executor.js

# Generate delivery formats
echo '{"command":"step6","format":["pdf","html"],"scenes":"'"$P"'/scenes.json","screenshots_dir":"'"$P"'/screenshots","output_dir":"'"$P"'"}' | node executor.js

# Package for delivery
echo '{"command":"step7","channel":"local","output_dir":"'"$P"'"}' | node executor.js
```

---

## Agent Integration

SlideForge exposes a standard JSON-in / JSON-out interface via `stdin` → `executor.js` → `stdout`, making it compatible with any AI agent framework:

- **Claude Code** — use as a skill via `SKILL.md`
- **OpenClaw** — use `_meta.json` for auto-discovery
- **Custom agents** — pipe JSON commands to `node executor.js`

See `[_meta.json](_meta.json)` for the full input/output schema and `[SKILL.md](SKILL.md)` for the agent skill specification.

---

## Project Structure

```
slide-forge/
├── executor.js                     # Entry point — routes commands to steps
├── _meta.json                      # Agent integration schema
├── SKILL.md                        # Agent skill specification
├── steps/
│   ├── step0_analyze.js            # Content analysis (MiniMax LLM)
│   ├── step1_script.js             # Script generation (MiniMax LLM)
│   ├── step2_design.js             # Theme selection + variant inference
│   ├── step3_html.js               # HTML rendering (template engine)
│   ├── step4_screenshot.js         # Puppeteer screenshots
│   ├── step5_tts.js                # TTS (edge-tts → say fallback)
│   ├── step6_format.js             # Delivery formats (video/pdf/html)
│   ├── step6_video.js              # FFmpeg video encoding (internal)
│   ├── step7_channel.js            # Delivery channels (local/feishu)
│   ├── step7_publish.js            # Feishu publishing (internal)
│   └── utils/
│       ├── content_extractor.js    # Multi-source content extraction
│       ├── llm_client.js           # MiniMax HTTP client
│       ├── tool-locator.js         # System tool auto-discovery
│       └── step-utils.js           # Shared utilities
├── utils/
│   ├── html_generator.js           # Core: template loading + token replacement
│   └── screenshot.js               # Puppeteer wrapper
├── refs/                           # Design reference docs (see refs/README.md)
├── samples/                        # Design theme templates
│   ├── electric-studio/            # 13 theme directories, each with full variant set
│   ├── bold-signal/
│   ├── ...
│   └── shared/                     # Theme-agnostic variants (stats, timeline, etc.)
├── examples/
│   ├── test_article.md             # Sample article for testing
│   ├── tencent_intro_light.md      # Long-form corp. intro sample (e.g. swiss-modern)
│   ├── full_variant_test.md        # Full variant coverage test
│   ├── four_new_variants_scenes.json # compare / process_flow / architecture_stack / funnel smoke deck
│   └── scenes_example.json         # Manual scenes.json reference
├── SKILL.md                        # Agent skill (YAML + usage; published in npm tarball)
├── _meta.json                      # Agent manifest (version, schema, executor pointer)
├── .env.example                    # Environment variable template
├── CHANGELOG.md                    # Version history (user-facing)
└── package.json
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Follow the design principles:
  - **Templates over code** — all visual decisions live in `samples/*.html`, not in generator logic
  - **Fixed pixels** — templates use `px` units (1920×1080 target), never `rem`/`vw`
  - **Generator is a pipe** — load template → replace tokens → write file
  - **Token naming** — `{{UPPER_CASE}}`, repeat markers have no index
4. Test with `npm run test:e2e`
5. Open a PR

---

## License

[MIT](LICENSE)