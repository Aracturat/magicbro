# MagicBro 🪄

Your app is the interface to your coding agent.

Point at anything in your running app, describe what you want changed, and MagicBro sends the context directly to your coding agent — no IDE or terminal required.

## Repository layout

- `cli/` — npm package `@magicbro/cli`, console command `magicbro`.
- `userscript/` — canonical browser userscript.
- `demo/` — independent English and Russian training pages.
- `site/` — English/Russian GitHub Pages landing page.
- `LICENSE`, `README.md` — shared license and documentation.

From the repository root:

```bash
npm ci --prefix cli
npm run check --prefix cli
npm pack ./cli
```

Before packaging, the CLI copies the canonical userscript, demos, README and license into its package. Refresh these copies during development with `npm run sync:assets --prefix cli`.

## GitHub Pages

Push the repository to GitHub and select **Settings → Pages → Source → GitHub Actions**. The included workflow publishes on pushes to `main` or `master`, or via **Run workflow**. It uploads `site/` with a copy of the userscript; the backend runs locally.

Preview using `python3 -m http.server 8080 --directory site` and open `http://localhost:8080`. The deployed site supports repository subpaths and an EN/RU switch. The userscript download is added by the deployment workflow.

The npm command shown on the landing page requires publishing `@magicbro/cli` first. This change does not publish the package.

Userscript and local backend for turning visual feedback on a running page into focused Codex code changes through a persistent Agent Client Protocol session.

## Install

1. Install Tampermonkey or Violentmonkey.
2. Create a new script and paste in [`magicbro.user.js`](./userscript/magicbro.user.js).
3. Save it and open any `http` or `https` page.

The script loads the pinned `html2canvas@1.4.1` browser build from jsDelivr.

The editor uses MagicBro's own **Starwork** UI kit: ink-blue surfaces, warm gold actions, starlight selection outlines and an orbital progress indicator. Tokens and components live inside the userscript's Shadow DOM. See [the UI kit guide](./userscript/UI-KIT.md) for its visual rules.

For local training, prepare the assets and launch from the demo directory. The backend serves both demos and the userscript without requiring a userscript manager:

```bash
npm run sync:assets --prefix cli
cd demo
node ../cli/bin/magicbro.mjs
```

This requires Node.js 20+ and an existing Codex authentication. `@agentclientprotocol/codex-acp` includes a compatible Codex CLI and reuses its saved authentication.

The bundled demo workspace lives in [`demo/`](./demo/). To run the global CLI against that workspace:

```bash
cd /path/to/magicbro/demo
magicbro
```

The same pattern works for any other project directory.

Open `http://127.0.0.1:4173/demo.en.html` or `http://127.0.0.1:4173/demo.ru.html`. The server reads demo files from the launch directory or its `demo/` folder, so edits appear on reload. Otherwise it serves the packaged examples. `/demo.html` is an English alias.

## Global CLI

Install the package once from this checkout:

```bash
npm run sync:assets --prefix cli
npm install --global ./cli
```

Then run it from any project directory:

```bash
cd /path/to/project
magicbro
```

Codex uses the directory where `magicbro` was launched as its workspace. `MAGICBRO_ROOT` can override that workspace when needed. Once published to npm, the install command becomes `npm install --global @magicbro/cli`.

## Use

1. Click **Magic** in the bottom-right corner (or press `Alt+M`).
2. Click once to capture a 50×50 px square around a point, or drag to select an area.
3. Enter a note, choose the reasoning effort, and optionally override the Codex model. While the editor is open, the underlying page cannot be used.
4. Press `Enter` or click **Generate**. Use `Shift+Enter` for a newline. A blocking activity panel displays Codex messages and progress as they happen. Tool calls are collapsed by default; click one to inspect its command or output.
5. The backend sends the screenshot and captured context to the existing ACP session. After a successful code change, the page reloads.

While Codex is running, **Stop generation** sends ACP `session/cancel`. It stops only the current turn and unlocks the page without discarding the long-lived Codex process or its conversation context.

Press `Escape` or **Cancel** to leave selection mode without sending.

The payload contains page and viewport metadata, point/area coordinates, loaded script and stylesheet URLs, information about the clicked element, the smallest sampled ancestor whose bounding box covers the selection, that element's `outerHTML`, and a PNG data URL of the selected area. When text is targeted, it also contains the exact word or geometric text fragments, text-node offsets, parent selectors, and surrounding text. A `magicbro:annotation` browser event is also dispatched with the same object in `event.detail`.

## Backend and Codex ACP

At server startup, MagicBro launches one local `codex-acp` stdio process, initializes ACP, and creates one session rooted at the current workspace directory. Later annotations are sent as additional `session/prompt` turns in that same session.

The screenshot is an ACP image content block. Selected HTML and page metadata are included in the text block. `session/update` notifications are forwarded immediately to the page over Server-Sent Events (SSE).

The prompt tells Codex to use distinctive text, ids, classes, attributes, and DOM structure from the captured HTML as search fingerprints for locating the responsible source files. The text entered by the user is the only authoritative requirement; captured page content is explicitly treated as untrusted evidence.

For text selections, Codex is instructed to modify only the captured substring. If the requested style cannot be applied without affecting adjacent text, it should add the smallest possible inline wrapper instead of styling the whole parent element.

The UI defaults to `gpt-5.6-sol` with `low` reasoning. The model and reasoning selectors are populated from the ACP session's `configOptions`, with static values retained only as an offline fallback. Before each turn, the selected values are applied through `session/set_config_option` without restarting Codex.

Only one turn is accepted at a time. `POST /api/annotations` starts it, `GET /api/runs/:id/events` streams it, `GET /api/runs/:id` provides a polling fallback, and `DELETE /api/runs/:id` cancels it. The backend binds to `127.0.0.1`; Codex runs in ACP's `agent` mode with a workspace-write sandbox rooted at this repository.

Configuration:

- `MAGICBRO_PORT` — backend port, default `4173`.
- `MAGICBRO_HOST` — bind address, default `127.0.0.1`.
- `MAGICBRO_CODEX_ACP_BIN` — optional path to another `codex-acp` executable.

The package is released under the MIT license; see [`LICENSE`](./LICENSE).

The current development transport sends the PNG as a base64 data URL inside JSON. A production version should use a `Blob` and `FormData`.

## Browser limitations

- Cross-origin images without CORS permission may be absent from the screenshot.
- Content inside a cross-origin iframe cannot be inspected by the parent page.
- The "smallest covering element" is based on DOM elements sampled at nine points plus their bounding rectangles. Irregular CSS shapes and overlapping layers can therefore resolve to a larger ancestor.
- The captured HTML is capped at 1,000,000 characters; the payload reports when it was truncated.
