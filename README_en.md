# SlideForge

[中文](README.md) · [Changelog](CHANGELOG.md) · [SKILL.md](SKILL.md) · [SCENES_SCHEMA](docs/SCENES_SCHEMA.md) · [Dev guide: CLAUDE.md](CLAUDE.md) · [License: MIT](LICENSE)

> **Agent-first** slide generation skill — your host Agent (Cursor / Claude Code / OpenClaw, …) reads the source material itself, writes `scenes.json`, and SlideForge renders it into a stage-ready **1920×1080** deck (**video** / **pdf** / **html**, multi-select), with outline & narration script. **v4.0 fully removes external LLM dependency.**

**What it does**: host Agent turns any source (Feishu / Markdown / web) into structured `scenes.json` → SlideForge renders **1920×1080** decks. Entrypoint is `node executor.js` with one JSON object on stdin. Cursor, Claude Code, OpenClaw and similar clients register this repo per their own skill/tool rules. **Behavior and fields are documented in [SKILL.md](SKILL.md)** (host metadata in `_meta.json`).

**13 visual themes × 22 content variants** are entirely sample-driven. Pin a theme with `design_mode` in JSON; omit it to let `project.json` recommend or the `design` command's rules pick.

**[View demo output →](examples/demo-output/)** Open `presentation.html` (iframe shell + co-located `page_*.html`; **do not ship a single HTML alone**). For a **single-file** PNG flipbook aligned with PDF, use `presentation_static.html`.

---

## v4.0 Breaking Changes

| | v3 | v4 |
|---|---|---|
| Who produces `scenes.json` | Built-in `step0` calling MiniMax | **Host Agent** writes it per `docs/SCENES_SCHEMA.md` |
| Who writes narration `script` | Built-in `step1` calling MiniMax | **Host Agent** writes `scenes[].script` (only required for video) |
| `.env` LLM config | `MINIMAX_*` / `LLM_*` required | **Not needed** (only `FEISHU_*` for Feishu source/delivery) |
| `command: "all"` | source → deck (with LLM calls) | Alias for `render`: starts from existing `scenes.json`, runs design → deliver |
| Command names | `step0` … `step7` (numbered) | All renamed to semantic verbs: `extract` / `validate` / `design` / `html` / `screenshot` / `tts` / `package` / `deliver` / `render` |
| New tools | — | `extract` (pure content extraction), `validate` (local schema check) |

**Migration**: legacy `step0` / `step1` / `step2`-`step7` commands now throw with a hint pointing to the corresponding new command. `scenes.json` schema unchanged—run `validate` once on existing decks and continue with `render`.

---

## Documentation Split

| Audience | File |
| --- | --- |
| **Usage & execution** | [SKILL.md](SKILL.md) — Onboarding, `command`, pipeline, 13 theme ids, `presentation.html` / `presentation_static.html`, Feishu, step examples |
| **Writing scenes.json** | [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md) — field tables for 22 variants + minimal examples + `validate` workflow |
| **Development & debugging** | [CLAUDE.md](CLAUDE.md) — samples & tokens, `html_generator` / `design` command, Roadmap |

---

## Features

- **13 design themes** — 7 dark + 6 light, each a complete 1920×1080 sample pack
- **3 input sources** — Feishu, local files (`.md`/`.txt`/`.docx`/`.pdf`), web URLs (via `extract`)
- **3 output formats** — MP4 video (with TTS narration), PDF, interactive HTML
- **22 content variants** — narrative, data, flow, comparison, architecture/funnel, cards, code…
- **Layout hints** — most variants support multiple sub-layouts (dense grid, cards, swimlane, etc.)
- **Adaptive typography** — font sizes, columns, density auto-fit text length
- **Page-level animations (HTML / screenshot)** — `design_params.page_animations` + `page_animation_preset` (`none` / `fade` / `stagger`)
- **9 independent commands** (`extract` / `validate` / `design` / `html` / `screenshot` / `tts` / `package` / `deliver` / `render`) — any intermediate artifact can be re-run individually
- **Outline + script** — every export ships with `outline.md` and `script.md`
- **Local validation** — `validate` reports schema errors and pacing warnings without network

---

## Themes

Each theme is an **integrated visual system**: typography, palette, panel finish, decorative elements, and ambient lighting are codified once in `samples/` and **drive cover, body, data, and flow pages alike**. 13 ready-made themes (7 dark / 6 light) connect to all 22 variants—swap themes to re-grade the entire deck without changing structure.

Pin a theme via `design_mode`; omit to let the pipeline pick automatically.

### Dark themes

| Theme | Accent | Use case |
| --- | --- | --- |
| `electric-studio` | Blue-purple + sky | General (default fallback) |
| `bold-signal` | Orange-red | Business, brand, marketing |
| `creative-voltage` | Electric blue | Creative, design, art |
| `dark-botanical` | Warm gold | Humanities, education |
| `neon-cyber` | Neon cyan + purple | Sci-fi, AI, gaming |
| `terminal-green` | GitHub green + blue | Tech docs, APIs |
| `deep-tech-keynote` | Sky + blue-purple | Technical keynotes |

### Light themes

| Theme | Accent | Use case |
| --- | --- | --- |
| `swiss-modern` | Pure black | Minimal, Swiss |
| `paper-ink` | Red + black | Editorial, publishing |
| `vintage-editorial` | Brown-gold | Vintage, literary |
| `notebook-tabs` | Mint green | Notes, journaling |
| `pastel-geometry` | Pink + geo blocks | Lively, playful |
| `split-pastel` | Soft pink + blue | Gentle, feminine |

---

## Variants

22 built-in layouts cover everything from "one-line punchline" to "richly-layered information". All variants connect to all 13 themes.

- **Narrative & reading** — large titles + key bullets, panels, two-column long-form, pull quotes, hero numbers
- **Data & metrics** — multi-stat dashboards, tables, lightweight charts, hybrid "stat + bullets" layouts
- **Flow & structure** — timelines, horizontal stage rails & swimlanes, layered architecture stacks, conversion funnels, A vs B comparisons
- **Showcase & assets** — icon/emoji grids, card walls, code snippets, chapter nav bars, text+icon mixes

Full field tables, minimal examples, and the variant decision tree live in **[docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md)**.

---

## Execution & Integration

Place this repo (or the npm package) on an executable path: **invocation and JSON fields** are documented in **[SKILL.md](SKILL.md)**; **[_meta.json](_meta.json)** ships with the package for host discovery, indexing, and machine validation. For sample edits or troubleshooting see **[CLAUDE.md](CLAUDE.md)**.

| File | Purpose |
| --- | --- |
| **SKILL.md** | Execution notes: Onboarding, scoped dependency checks, `command`, pipeline, deliverables, 13 theme ids, step examples |
| **docs/SCENES_SCHEMA.md** | Schema source-of-truth for the host Agent producing `scenes.json` |
| **CLAUDE.md** | Internal dev: samples & tokens, `html_generator`, Roadmap |
| **_meta.json** | Host-side: `type: agent`, `executor`, machine-readable `input`/`output` for OpenClaw, npm, CI |
| **executor.js** | Sole entrypoint: `stdin` JSON → `node executor.js` |

`npm pack` / `npm publish` tarballs include all of the above.

### Confirm Before Running

Before invoking `executor.js`, confirm with the user—then write `format`, `channel`, `source`, `design_mode`, etc. **Do not** default to `format: "video"` without confirmation (long, requires FFmpeg + TTS).

1. **Source** — Feishu / local file / web URL? (→ `extract` input)
2. **Format** — PDF / HTML / video / multi-select? `video` requires **FFmpeg**, **edge-tts** (or macOS **`say`**)
3. **Channel** — local `output_dir` or Feishu? `feishu` requires `.env` credentials and `doc_title` / `folder_token`
4. **Theme** — proactively explain the 13 `design_mode` ids; user picks one or says "auto" (omit `design_mode`)

Full Onboarding script & JSON templates in [SKILL.md](SKILL.md).

### How `design_mode` Is Picked

Resolution order (**explicit `design_mode` in the JSON always wins**):

1. `design_mode` in current JSON
2. `recommended_design_mode` in `project.json` (v4: written by host Agent; must be a valid id)
3. `design_mode` in `project.json` (if not the default `electric-studio`)
4. Title/body keyword rules (`inferContentType` + `CONTENT_TYPE_MAP`)—e.g. humanities/social science → `dark-botanical`

### How Variants & Layout Hints Are Picked

The host Agent specifies `content_variant` per page directly when writing `scenes.json`. The `design` command applies **rhythm correction** (avoid two consecutive identical layouts) and infers `layout_hint` defaults. For full manual control, edit `scenes.json` / `design_params.json` and re-run from the corresponding command.

---

## Quick Start

```bash
# 1. Install
git clone https://github.com/mochueloxie-sudo/SlideForge.git
cd slide-forge
npm install

# 2. (optional) Configure: v4.0 needs no LLM credentials
cp .env.example .env
# Only fill FEISHU_* if source is a Feishu link or channel=feishu

# 3. Run the bundled demo
npm run demo:html-local
open ./demo_html_out/presentation.html
```

### Real workflow (host Agent perspective)

```bash
# 1. (optional) Extract external material into plain text for the Agent to read
echo '{"command":"extract","source":"./examples/tencent_intro_light.md","output_dir":"./project"}' \
  | node executor.js
# → ./project/raw_content.txt + source_meta.json

# 2. The Agent reads the text → writes ./project/scenes.json
#    per docs/SCENES_SCHEMA.md (direct file write, no LLM API calls)

# 3. Self-check
echo '{"command":"validate","scenes":"./project/scenes.json"}' | node executor.js
# → { valid: true | false, errors: [...], warnings: [...] }

# 4. Render in one shot (design → html → screenshot → tts if video → package → deliver)
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["html"],"design_mode":"deep-tech-keynote"}' \
  | node executor.js

# 5. Open
open ./project/presentation.html
```

### Other formats

```bash
# PDF
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":"pdf"}' | node executor.js

# Video (requires ffmpeg + edge-tts; each scene needs a `script` field)
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":"video"}' | node executor.js

# Multiple at once
echo '{"command":"render","scenes":"./project/scenes.json","output_dir":"./project","format":["pdf","html"]}' | node executor.js
```

---

## Pipeline

```
Source (Feishu / .md / .docx / .pdf / URL)
  │
  ├── [optional] extract ── content_extractor → raw_content.txt + source_meta.json
  │
  ▼
Host Agent (in chat) writes scenes.json per docs/SCENES_SCHEMA.md (and optional project.json)
  │
  ▼
[optional] validate ──── local schema check → errors[] / warnings[]
  │
  ▼
design     ── theme + variant + layout_hint → design_params.json
  │
  ▼
html       ── template token replacement → page_XXX.html
  │
  ▼
screenshot ── Puppeteer → page_XXX.png (1920×1080)
  │
  ▼
tts        ── edge-tts → page_XXX.mp3 (skipped if not video)
  │
  ▼
package    ── video / pdf / html + outline.md + script.md
  │
  ▼
deliver    ── local (default) / feishu
```

Every step persists to disk; any step can be re-run individually.

---

## Requirements

| Dependency | Purpose | Install |
| --- | --- | --- |
| **Node.js ≥ 18** | Runtime | [nodejs.org](https://nodejs.org/) |
| **Google Chrome** | Screenshots + PDF (screenshot / package) | Usually pre-installed |
| `edge-tts` | TTS (tts, video only) | `pip install edge-tts` |
| `ffmpeg` | Video encoding (package, video only) | `brew install ffmpeg` |
| `lark-cli` | Feishu publish (deliver, optional) | `npm i -g @larksuite/cli` |
| Feishu app credentials | Feishu source / delivery | `.env` `FEISHU_APP_ID` / `FEISHU_APP_SECRET` |

**v4.0 needs no LLM API credentials**—`scenes.json` is fully produced by the host Agent.

### Environment

Copy `.env.example` to `.env`, **only fill if using Feishu**:

```ini
# Only when source is a Feishu link or channel=feishu
FEISHU_APP_ID=cli_...
FEISHU_APP_SECRET=...
```

---

## Output

```
output/
├── scenes.json            # Written by Agent: scenes + optional script
├── (project.json)         # Optional: Agent-written recommended_design_mode
├── design_params.json     # design output
├── page_001.html          # Rendered slides
├── page_002.html
├── ...
├── screenshots/
│   ├── page_001.png       # 1920×1080
│   └── ...
├── presentation.html        # Main entry: iframe single page (hover + motion)
├── presentation_static.html # PNG flipbook (matches PDF)
├── presentation.pdf
├── presentation.mp4
├── outline.md
├── script.md
└── MANIFEST.md             # Delivery manifest (channel=local)
```

### `format=html`: two browser entrypoints (delivery notes)

| File | Standalone? | Must ship with | Interactivity |
| --- | --- | --- | --- |
| **`presentation.html`** | **No** (iframe shell) | All co-located `page_001.html` … `page_NNN.html` | Yes: hover, page-level CSS entrance |
| **`presentation_static.html`** | **Yes** (embedded base64 PNGs) | Nothing | None inside templates; aligned with PDF |

- Ship `presentation.html` together with the entire `page_*.html` set (a folder or zip).
- For **single-file** sharing, use `presentation_static.html` or the PDF.

---

## Step-by-Step

For fine-grained control (**v4 unifies all commands as semantic verbs; no stepN numbering**):

```bash
P=./project

# 1. (optional) extract source
echo '{"command":"extract","source":"./article.md","output_dir":"'"$P"'"}' | node executor.js

# 2. Agent writes scenes.json to $P/scenes.json (not via executor)

# 3. Validate
echo '{"command":"validate","scenes":"'"$P"'/scenes.json"}' | node executor.js

# 4. Design params
echo '{"command":"design","scenes":"'"$P"'/scenes.json","output_dir":"'"$P"'","design_mode":"neon-cyber"}' | node executor.js

# 5. HTML render
echo '{"command":"html","scenes":"'"$P"'/scenes.json","design_params":"'"$P"'/design_params.json","output_dir":"'"$P"'"}' | node executor.js

# 6. Screenshots
echo '{"command":"screenshot","html_dir":"'"$P"'","output_dir":"'"$P"'/screenshots","design_params":"'"$P"'/design_params.json"}' | node executor.js

# 7. Package (pdf/html/video)
echo '{"command":"package","format":["pdf","html"],"scenes":"'"$P"'/scenes.json","screenshots_dir":"'"$P"'/screenshots","html_dir":"'"$P"'","output_dir":"'"$P"'"}' | node executor.js

# 8. Deliver (local/feishu)
echo '{"command":"deliver","channel":"local","output_dir":"'"$P"'"}' | node executor.js
```

---

## Automation & Tool Integration

`stdin` → `executor.js` → `stdout`; JSON contract in [_meta.json](_meta.json); execution notes in [SKILL.md](SKILL.md); Agent-side schema in [docs/SCENES_SCHEMA.md](docs/SCENES_SCHEMA.md).

- **Cursor / Claude Code etc.** — register `SKILL.md` + `docs/SCENES_SCHEMA.md` per the client's mechanism
- **OpenClaw** — discovers package & schema via `_meta.json`
- **Scripts / CI** — pipe one JSON line into stdin, or `node executor.js ./request.json`

Development & troubleshooting: [CLAUDE.md](CLAUDE.md).

---

## Project Structure

```
slide-forge/
├── executor.js
├── _meta.json
├── SKILL.md
├── CLAUDE.md
├── docs/
│   └── SCENES_SCHEMA.md
├── steps/
│   ├── extract.js
│   ├── validate.js
│   ├── design.js
│   ├── html.js
│   ├── screenshot.js
│   ├── tts.js
│   ├── package.js
│   ├── video.js                    # internal, called by package
│   ├── deliver.js
│   ├── publish.js                  # internal, called by deliver
│   └── utils/
│       ├── content_extractor.js
│       ├── tool-locator.js
│       └── step-utils.js
├── utils/
│   ├── html_generator.js
│   └── screenshot.js
├── refs/
├── samples/
│   ├── electric-studio/
│   ├── bold-signal/
│   ├── ...
│   └── shared/
├── examples/
│   ├── scenes_example.json
│   ├── four_new_variants_scenes.json
│   ├── tencent_intro_scenes_fixture.json
│   ├── tencent_intro_light.md
│   └── full_variant_test.md
├── .env.example
├── CHANGELOG.md
└── package.json
```

---

## Contributing

1. Fork
2. Branch (`git checkout -b feat/my-feature`)
3. Follow the design principles (extension steps & grep debugging in **[CLAUDE.md](CLAUDE.md)**):
   - **Templates over code** — visual decisions in `samples/*.html`, not generator logic
   - **Fixed pixels** — templates use `px` (target 1920×1080), not `rem`/`vw`
   - **Generator is a pipe** — load template → replace tokens → write
   - **Token naming** — `{{UPPER_CASE}}`, repeat markers without indices
   - **New variants** — also update `docs/SCENES_SCHEMA.md` and `steps/validate.js`
4. Test with `npm run test:e2e`
5. Open a PR

---

## License

[MIT](LICENSE)
