// ==UserScript==
// @name         MagicBro page annotation
// @namespace    https://github.com/ndozmorov/magicbro
// @version      0.6.3
// @description  Select a point or an area, attach a note, and collect the surrounding HTML and a screenshot.
// @match        http://*/*
// @match        https://*/*
// @require      https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// @connect      127.0.0.1
// @connect      localhost
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  const HOST_ID = "magicbro-userscript-root";
  const DRAG_THRESHOLD = 5;
  const POINT_SIZE = 50;
  const MAX_HTML_LENGTH = 1_000_000;
  const MAX_TEXT_SCAN_LENGTH = 20_000;
  const MAX_TEXT_FRAGMENTS = 80;
  const BACKEND_URL = "http://127.0.0.1:4173/api/annotations";

  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = [
    "all: initial",
    "position: fixed",
    "inset: 0",
    "z-index: 2147483647",
    "pointer-events: none",
  ].join(";");
  document.documentElement.append(host);

  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        --mb-night: #101b30;
        --mb-surface: #182740;
        --mb-line: #435570;
        --mb-ink: #f5f0e5;
        --mb-muted: #b1bfd2;
        --mb-gold: #f4cf87;
        --mb-star: #a6dedb;
        --mb-danger: #ffb2ad;
        --mb-radius: 16px;
        --mb-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        color: var(--mb-ink);
        font: 14px/1.5 var(--mb-font);
      }
      *, *::before, *::after { box-sizing: border-box; }
      button, textarea, select, input { font: inherit; }
      button { cursor: pointer; color: inherit; }
      button:focus-visible, textarea:focus-visible, select:focus-visible, input:focus-visible {
        outline: 2px solid var(--mb-gold);
        outline-offset: 4px;
      }
      button:disabled { cursor: not-allowed; opacity: .5; }
      #magic-button {
        position: fixed;
        right: 24px;
        bottom: 24px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        padding: 0 22px;
        border: 1px solid var(--mb-gold);
        border-radius: 18px 18px 18px 5px;
        background: var(--mb-night);
        color: var(--mb-ink);
        box-shadow: 0 12px 32px #0006, 0 0 24px #f4cf8720;
        font-weight: 650;
        transition: transform .2s, box-shadow .2s;
      }
      #magic-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 35px #0006, 0 0 30px #f4cf8750;
      }
      .magic-glyph, .editor-spark {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        color: var(--mb-gold);
        font-size: 24px;
        text-shadow: 0 0 16px #f4cf8780;
      }
      #picker, #blocker {
        display: none;
        position: fixed;
        inset: 0;
        pointer-events: auto;
      }
      #picker { cursor: crosshair; background: #101b3015; touch-action: none; }
      #blocker { background: #07122470; backdrop-filter: blur(2px); }
      #picker.active, #blocker.active { display: block; }
      #hint {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: max-content;
        max-width: calc(100vw - 32px);
        padding: 12px 18px;
        border: 1px solid var(--mb-line);
        border-radius: var(--mb-radius);
        background: var(--mb-night);
        color: var(--mb-ink);
        box-shadow: 0 8px 28px #0004;
        font: 12px/1.5 var(--mb-font);
        pointer-events: none;
      }
      #selection, #highlight {
        display: none;
        position: fixed;
        border: 2px solid var(--mb-gold);
        border-radius: 4px;
        background: #f4cf8710;
        box-shadow: 0 0 0 3px #101b3050, 0 0 22px #f4cf8745;
        pointer-events: none;
      }
      #selection.active, #highlight.active { display: block; }
      #editor {
        display: none;
        position: fixed;
        width: min(480px, calc(100vw - 24px));
        max-height: calc(100dvh - 24px);
        overflow: auto;
        padding: 14px;
        border: 1px solid var(--mb-line);
        border-top: 2px solid var(--mb-gold);
        border-radius: 22px;
        background: radial-gradient(ellipse at 100% 0, #a6dedb15, transparent 55%), var(--mb-night);
        color: var(--mb-ink);
        box-shadow: 0 26px 80px #0008, 0 0 50px #a6dedb12;
        pointer-events: auto;
        animation: materialize .2s ease-out;
      }
      #editor.active { display: block; }
      .editor-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .editor-spark { border: 1px solid #f4cf8750; border-radius: 50%; width: 36px; height: 36px; flex-shrink: 0; }
      #editor-title { margin: 0; font: 600 17px/1.3 var(--mb-font); }
      .editor-kicker { margin-left: auto; color: var(--mb-gold); font: 10px/1.4 var(--mb-font); letter-spacing: .12em; text-transform: uppercase; }
      #text-target { display: none; padding: 9px 12px; margin-bottom: 12px; border-left: 2px solid var(--mb-star); background: #a6dedb08; color: var(--mb-star); font: 12px/1.5 monospace; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      #text-target.active { display: block; }
      #text-target::before { content: "Selected text · "; color: var(--mb-muted); }
      #spell-composer { display: grid; gap: 8px; }
      #note {
        display: block;
        width: 100%;
        min-height: 52px;
        max-height: 110px;
        resize: none;
        padding: 10px 12px;
        border: 1px solid var(--mb-line);
        border-radius: 12px;
        background: #0b1526;
        color: var(--mb-ink);
        caret-color: var(--mb-gold);
        font: 15px/1.6 var(--mb-font);
      }
      #note::placeholder { color: var(--mb-muted); }
      #submit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        min-height: 36px;
        border: 1px solid #ffe2ab;
        border-radius: 12px;
        background: var(--mb-gold);
        color: #192338;
        font-weight: 750;
        transition: box-shadow .2s, transform .2s;
      }
      #submit:hover:not(:disabled) { box-shadow: 0 0 24px #f4cf8740; transform: translateY(-1px); }
      #execution-options { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; margin-top: 10px; }
      #execution-options label { display: grid; gap: 6px; min-width: 0; color: var(--mb-muted); font: 11px/1.5 var(--mb-font); }
      #execution-options select, #execution-options input { width: 100%; min-width: 0; min-height: 38px; padding: 7px 9px; border: 1px solid var(--mb-line); border-radius: 8px; color: var(--mb-ink); background: var(--mb-surface); color-scheme: dark; font: 12px/1.5 var(--mb-font); }
      #actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
      #actions::before { content: "Enter to send · Shift+Enter for newline"; color: var(--mb-muted); font: 10px/1.5 var(--mb-font); }
      #cancel, #stop { padding: 8px 12px; min-height: 36px; border: 1px solid var(--mb-line); border-radius: 8px; background: transparent; color: var(--mb-muted); }
      #cancel:hover { background: var(--mb-surface); color: var(--mb-ink); }
      #status { margin-top: 12px; padding: 10px; border-left: 2px solid var(--mb-gold); color: var(--mb-ink); background: #f4cf8708; font: 12px/1.5 var(--mb-font); }
      #status:empty { display: none; }
      #working { display: none; align-items: center; gap: 12px; padding: 8px 0 20px; }
      #editor.submitting { left: 50% !important; top: 50% !important; transform: translate(-50%, -50%); width: min(660px, calc(100vw - 24px)); animation: none; }
      #editor.submitting #spell-composer, #editor.submitting #execution-options, #editor.submitting #actions { display: none; }
      #editor.submitting #working { display: flex; }
      #spinner { width: 30px; height: 30px; flex-shrink: 0; border: 1px solid #f4cf8740; border-top-color: var(--mb-gold); border-radius: 50%; position: relative; animation: orbit 2s linear infinite; }
      #spinner::after { content: "✦"; position: absolute; top: -10px; left: 8px; color: var(--mb-gold); font-size: 15px; text-shadow: 0 0 12px #f4cf87; }
      #working-text { color: var(--mb-ink); font: 600 14px/1.5 var(--mb-font); }
      #stop { margin-left: auto; color: var(--mb-danger); border-color: #ffb2ad60; white-space: nowrap; }
      #stop:hover { background: #ffb2ad10; }
      #activity { display: none; max-height: min(340px, 45dvh); overflow: auto; padding: 10px; border: 1px solid var(--mb-line); border-radius: 12px; background: #0b1526; scrollbar-width: thin; scrollbar-color: var(--mb-line) transparent; }
      #editor.submitting #activity { display: grid; gap: 8px; }
      .activity-row { padding: 10px 12px; border-left: 2px solid var(--mb-line); color: var(--mb-muted); background: #ffffff03; font: 12px/1.6 var(--mb-font); white-space: pre-wrap; overflow-wrap: anywhere; }
      .activity-row.agent { color: var(--mb-ink); border-color: var(--mb-gold); }
      .activity-row.thought { font-style: italic; }
      .activity-row.tool { border-color: var(--mb-star); }
      .activity-row.success { color: #b7e9bf; border-color: #b7e9bf; }
      .activity-row.error { color: var(--mb-danger); border-color: var(--mb-danger); }
      details.activity-row > summary { cursor: pointer; color: var(--mb-star); }
      .tool-output { margin: 10px 0 0; padding: 10px; max-height: 220px; overflow: auto; color: var(--mb-muted); background: #0002; white-space: pre-wrap; overflow-wrap: anywhere; font: 11px/1.6 monospace; }
      .tool-output:empty { display: none; }
      .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      @keyframes orbit { to { transform: rotate(360deg); } }
      @keyframes materialize { from { opacity: 0; } to { opacity: 1; } }
      @media (max-width: 520px) {
        #editor { padding: 12px; }
        .editor-kicker { display: none; }
        #actions::before { content: "Enter to send"; }
        #working { flex-wrap: wrap; }
        #hint { font-size: 11px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }
    </style>
    <button id="magic-button" type="button" title="Select an area (Alt+M)"><span class="magic-glyph">✦</span><span>Magic</span></button>
    <div id="picker">
      <div id="hint">Click a point or drag to select an area · Esc to cancel</div>
      <div id="selection"></div>
    </div>
    <div id="blocker"></div>
    <div id="highlight"></div>
    <section id="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div class="editor-heading">
        <span class="editor-spark" aria-hidden="true">✦</span>
        <p id="editor-title">Make a little magic.</p>
        <span class="editor-kicker">MagicBro</span>
      </div>
      <div id="text-target" title="Exact text fragment sent to Codex"></div>
      <div id="spell-composer">
        <textarea id="note" aria-label="Describe your change" rows="1" placeholder="Describe what you want to change…"></textarea>
        <button id="submit" type="button" disabled title="Generate change">
          <span>Generate</span><span class="submit-spark" aria-hidden="true">✦</span>
        </button>
      </div>
      <div id="execution-options">
        <label>Reasoning
          <select id="reasoning">
            <option value="">Codex default</option>
            <option value="minimal">Minimal</option>
            <option value="low" selected>Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="xhigh">Extra high</option>
          </select>
        </label>
        <label>Model
          <select id="model">
            <option value="gpt-6-astra">6 Astra</option>
            <option value="gpt-5.6-sol" selected>5.6 Sol</option>
            <option value="gpt-5.6-terra">5.6 Terra</option>
            <option value="gpt-5.6-luna">5.6 Luna</option>
            <option value="gpt-5.5">5.5</option>
          </select>
        </label>
      </div>
      <div id="actions">
        <button id="cancel" type="button">Cancel</button>
      </div>
      <div id="working">
        <div id="spinner"></div>
        <div id="working-text">Magic is coming…</div>
        <button id="stop" type="button" disabled>Stop generation</button>
      </div>
      <div id="activity" role="log" aria-live="polite" aria-label="Codex activity"></div>
      <div id="status" aria-live="polite"></div>
    </section>
  `;

  const ui = Object.fromEntries(
    [
      "magic-button",
      "picker",
      "selection",
      "blocker",
      "highlight",
      "editor",
      "text-target",
      "note",
      "reasoning",
      "model",
      "cancel",
      "submit",
      "stop",
      "working-text",
      "activity",
      "status",
    ].map((id) => [id, shadow.getElementById(id)]),
  );

  let phase = "idle";
  let pointerStart = null;
  let annotation = null;
  let backendRunId = null;
  const activityRows = new Map();
  const toolRows = new Map();

  function setRect(element, rect) {
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
  }

  function normalizedRect(a, b) {
    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    return {
      left,
      top,
      width: Math.abs(a.x - b.x),
      height: Math.abs(a.y - b.y),
    };
  }

  function pointRect(point) {
    const half = POINT_SIZE / 2;
    const left = Math.max(
      0,
      Math.min(window.innerWidth - POINT_SIZE, point.x - half),
    );
    const top = Math.max(
      0,
      Math.min(window.innerHeight - POINT_SIZE, point.y - half),
    );
    return {
      left,
      top,
      width: Math.min(POINT_SIZE, window.innerWidth),
      height: Math.min(POINT_SIZE, window.innerHeight),
    };
  }

  function startPicking() {
    if (phase !== "idle") return;
    phase = "picking";
    ui["magic-button"].style.display = "none";
    ui.picker.classList.add("active");
  }

  function reset() {
    phase = "idle";
    pointerStart = null;
    annotation = null;
    backendRunId = null;
    ui.picker.classList.remove("active");
    ui.selection.classList.remove("active");
    ui.blocker.classList.remove("active");
    ui.highlight.classList.remove("active");
    ui.editor.classList.remove("active");
    ui.editor.classList.remove("submitting");
    ui["text-target"].classList.remove("active");
    ui["text-target"].textContent = "";
    ui["magic-button"].style.display = "";
    ui.note.value = "";
    ui.note.style.height = "";
    ui.note.disabled = false;
    ui.cancel.disabled = false;
    ui.submit.disabled = true;
    ui.stop.disabled = false;
    ui.activity.replaceChildren();
    activityRows.clear();
    toolRows.clear();
    ui.status.textContent = "";
  }

  function withUiHidden(callback) {
    const oldVisibility = host.style.visibility;
    host.style.visibility = "hidden";
    try {
      return callback();
    } finally {
      host.style.visibility = oldVisibility;
    }
  }

  function elementAt(x, y) {
    return withUiHidden(() => document.elementFromPoint(x, y));
  }

  function rectIntersects(a, b) {
    return (
      a.right > b.left &&
      a.left < b.left + b.width &&
      a.bottom > b.top &&
      a.top < b.top + b.height
    );
  }

  function rectContainsPoint(rect, point) {
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  }

  function unionRects(rects) {
    if (!rects.length) return null;
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    return { left, top, width: right - left, height: bottom - top };
  }

  function caretAtPoint(point) {
    return withUiHidden(() => {
      if (typeof document.caretPositionFromPoint === "function") {
        const position = document.caretPositionFromPoint(point.x, point.y);
        return position
          ? { node: position.offsetNode, offset: position.offset }
          : null;
      }
      if (typeof document.caretRangeFromPoint === "function") {
        const range = document.caretRangeFromPoint(point.x, point.y);
        return range
          ? { node: range.startContainer, offset: range.startOffset }
          : null;
      }
      return null;
    });
  }

  function textNodeIndex(node) {
    return node.parentNode ? [...node.parentNode.childNodes].indexOf(node) : -1;
  }

  function describeTextFragment(node, startOffset, endOffset) {
    const value = node.data.slice(startOffset, endOffset);
    const leadingWhitespace = value.match(/^\s*/)?.[0].length || 0;
    const trailingWhitespace = value.match(/\s*$/)?.[0].length || 0;
    const start = startOffset + leadingWhitespace;
    const end = Math.max(start, endOffset - trailingWhitespace);
    if (start === end) return null;
    const parent = node.parentElement;
    return {
      text: node.data.slice(start, end),
      startOffset: start,
      endOffset: end,
      nodeIndex: textNodeIndex(node),
      parentSelector: cssSelector(parent),
      parentTagName: parent?.tagName.toLowerCase() || null,
      contextBefore: node.data.slice(Math.max(0, start - 80), start),
      contextAfter: node.data.slice(end, end + 80),
    };
  }

  function wordSelectionAtPoint(point) {
    const caret = caretAtPoint(point);
    if (
      !caret ||
      caret.node.nodeType !== Node.TEXT_NODE ||
      !caret.node.data.trim()
    )
      return null;
    const text = caret.node.data;
    const probeOffset = Math.min(
      Math.max(0, caret.offset),
      Math.max(0, text.length - 1),
    );
    let start = probeOffset;
    let end = probeOffset;

    if (typeof Intl.Segmenter === "function") {
      const segments = [
        ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text),
      ];
      const segment = segments.find(
        (entry) =>
          entry.isWordLike &&
          probeOffset >= entry.index &&
          probeOffset < entry.index + entry.segment.length,
      );
      if (segment) {
        start = segment.index;
        end = segment.index + segment.segment.length;
      }
    }

    if (start === end) {
      const isToken = (character) => character && !/\s/u.test(character);
      while (start > 0 && isToken(text[start - 1])) start -= 1;
      while (end < text.length && isToken(text[end])) end += 1;
    }

    const fragment = describeTextFragment(caret.node, start, end);
    if (!fragment) return null;
    const range = document.createRange();
    range.setStart(caret.node, fragment.startOffset);
    range.setEnd(caret.node, fragment.endOffset);
    const rects = [...range.getClientRects()].filter(
      (rect) => rect.width || rect.height,
    );
    if (!rects.some((rect) => rectContainsPoint(rect, point))) return null;
    const bounds = unionRects(rects);
    return {
      kind: "word",
      text: fragment.text,
      fragments: [fragment],
      viewportRect: bounds ? serializeRect(bounds) : null,
    };
  }

  function textSelectionInRect(root, rect) {
    if (!(root instanceof Element)) return null;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (
          !parent ||
          !node.data.trim() ||
          ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(parent.tagName)
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        const style = getComputedStyle(parent);
        return style.display === "none" || style.visibility === "hidden"
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const fragments = [];
    const selectedRects = [];
    let scanned = 0;

    for (
      let node = walker.nextNode();
      node &&
      scanned < MAX_TEXT_SCAN_LENGTH &&
      fragments.length < MAX_TEXT_FRAGMENTS;
      node = walker.nextNode()
    ) {
      const length = Math.min(node.data.length, MAX_TEXT_SCAN_LENGTH - scanned);
      scanned += length;
      const wholeNode = document.createRange();
      wholeNode.selectNodeContents(node);
      if (
        ![...wholeNode.getClientRects()].some((candidate) =>
          rectIntersects(candidate, rect),
        )
      )
        continue;

      let runStart = null;
      for (let offset = 0; offset < length; offset += 1) {
        const character = document.createRange();
        character.setStart(node, offset);
        character.setEnd(node, offset + 1);
        const matchingRects = [...character.getClientRects()].filter(
          (candidate) => rectIntersects(candidate, rect),
        );
        const selected = matchingRects.length > 0;
        if (selected && runStart === null) runStart = offset;
        if (selected) selectedRects.push(...matchingRects);
        if ((!selected || offset === length - 1) && runStart !== null) {
          const end = selected && offset === length - 1 ? offset + 1 : offset;
          const fragment = describeTextFragment(node, runStart, end);
          if (fragment) fragments.push(fragment);
          runStart = null;
          if (fragments.length >= MAX_TEXT_FRAGMENTS) break;
        }
      }
    }

    if (!fragments.length) return null;
    const bounds = unionRects(selectedRects);
    return {
      kind: fragments.length === 1 ? "fragment" : "fragments",
      text: fragments.map((fragment) => fragment.text).join("\n"),
      fragments,
      viewportRect: bounds ? serializeRect(bounds) : null,
      truncated:
        scanned >= MAX_TEXT_SCAN_LENGTH ||
        fragments.length >= MAX_TEXT_FRAGMENTS,
    };
  }

  function containsRect(element, rect) {
    const bounds = element.getBoundingClientRect();
    const epsilon = 1;
    return (
      bounds.left <= rect.left + epsilon &&
      bounds.top <= rect.top + epsilon &&
      bounds.right >= rect.left + rect.width - epsilon &&
      bounds.bottom >= rect.top + rect.height - epsilon
    );
  }

  function ancestors(element) {
    const result = [];
    for (let current = element; current; current = current.parentElement)
      result.push(current);
    return result;
  }

  function lowestCommonAncestor(elements) {
    if (!elements.length) return document.documentElement;
    const rest = elements
      .slice(1)
      .map((element) => new Set(ancestors(element)));
    return (
      ancestors(elements[0]).find((candidate) =>
        rest.every((set) => set.has(candidate)),
      ) || document.documentElement
    );
  }

  function findCoveringElement(rect) {
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;
    const xs = [rect.left + 1, rect.left + rect.width / 2, right - 1];
    const ys = [rect.top + 1, rect.top + rect.height / 2, bottom - 1];
    const sampled = [];

    withUiHidden(() => {
      for (const x of xs) {
        for (const y of ys) {
          const element = document.elementFromPoint(
            Math.max(0, Math.min(window.innerWidth - 1, x)),
            Math.max(0, Math.min(window.innerHeight - 1, y)),
          );
          if (element && !sampled.includes(element)) sampled.push(element);
        }
      }
    });

    let candidate = lowestCommonAncestor(sampled);
    while (candidate.parentElement && !containsRect(candidate, rect))
      candidate = candidate.parentElement;
    return candidate;
  }

  function cssSelector(element) {
    if (!(element instanceof Element)) return null;
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts = [];
    let current = element;
    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      parts.length < 8
    ) {
      let part = current.localName;
      if (!part) break;
      const siblings = current.parentElement
        ? [...current.parentElement.children].filter(
            (item) => item.localName === current.localName,
          )
        : [];
      if (siblings.length > 1)
        part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      parts.unshift(part);
      current = current.parentElement;
      if (current?.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
    }
    return parts.join(" > ");
  }

  function serializeRect(rect) {
    return {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.left + rect.width),
      bottom: Math.round(rect.top + rect.height),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }

  function placeEditor(rect) {
    const gap = 12;
    const width = Math.min(480, window.innerWidth - 24);
    const estimatedHeight = 285;
    let left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12,
    );
    let top = rect.top + rect.height + gap;
    if (top + estimatedHeight > window.innerHeight)
      top = Math.max(12, rect.top - estimatedHeight - gap);
    ui.editor.style.left = `${left}px`;
    ui.editor.style.top = `${top}px`;
  }

  function finishSelection(kind, rect, click) {
    const coveringElement = findCoveringElement(rect);
    const clickedElement = click ? elementAt(click.x, click.y) : null;
    const textSelection = click
      ? wordSelectionAtPoint(click)
      : textSelectionInRect(coveringElement, rect);
    annotation = {
      kind,
      rect,
      click,
      coveringElement,
      clickedElement,
      textSelection,
    };
    phase = "editing";
    ui.picker.classList.remove("active");
    ui.selection.classList.remove("active");
    ui.blocker.classList.add("active");
    const textRect = textSelection?.viewportRect;
    setRect(
      ui.highlight,
      textRect
        ? {
            left: textRect.left,
            top: textRect.top,
            width: textRect.width,
            height: textRect.height,
          }
        : rect,
    );
    ui.highlight.classList.add("active");
    if (textSelection?.text) {
      ui["text-target"].textContent =
        `“${textSelection.text.replace(/\s+/g, " ").trim()}”`;
      ui["text-target"].classList.add("active");
    }
    placeEditor(rect);
    ui.editor.classList.add("active");
    requestAnimationFrame(() => ui.note.focus());
  }

  async function capture(rect) {
    if (typeof window.html2canvas !== "function") {
      throw new Error("html2canvas did not load");
    }

    host.style.visibility = "hidden";
    try {
      const canvas = await window.html2canvas(document.documentElement, {
        x: window.scrollX + rect.left,
        y: window.scrollY + rect.top,
        width: rect.width,
        height: rect.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: null,
      });
      return {
        dataUrl: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
        mimeType: "image/png",
      };
    } finally {
      host.style.visibility = "";
    }
  }

  function elementInfo(element) {
    if (!(element instanceof Element)) return null;
    const bounds = element.getBoundingClientRect();
    const html = element.outerHTML;
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      classNames: [...element.classList],
      selector: cssSelector(element),
      bounds: serializeRect(bounds),
      html:
        html.length <= MAX_HTML_LENGTH ? html : html.slice(0, MAX_HTML_LENGTH),
      htmlTruncated: html.length > MAX_HTML_LENGTH,
      originalHtmlLength: html.length,
    };
  }

  function pageResources() {
    const resources = new Set();
    for (const script of document.scripts) {
      if (script.src) resources.add(script.src);
    }
    for (const link of document.querySelectorAll(
      'link[rel="stylesheet"][href]',
    )) {
      resources.add(link.href);
    }
    return [...resources].slice(0, 200);
  }

  function backendRequest(method, url, payload) {
    const body = payload === undefined ? undefined : JSON.stringify(payload);

    if (typeof GM_xmlhttpRequest === "function") {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method,
          url,
          headers: { "Content-Type": "application/json" },
          data: body,
          timeout: 30_000,
          onload(response) {
            let result;
            try {
              result = JSON.parse(response.responseText || "{}");
            } catch {
              reject(
                new Error(`Backend returned invalid JSON (${response.status})`),
              );
              return;
            }
            if (response.status < 200 || response.status >= 300) {
              reject(
                new Error(
                  result.error || `Backend returned HTTP ${response.status}`,
                ),
              );
              return;
            }
            resolve(result);
          },
          ontimeout() {
            reject(new Error("Backend request timed out"));
          },
          onerror() {
            reject(new Error("Could not connect to the MagicBro backend"));
          },
        });
      });
    }

    return fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    }).then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result.error || `Backend returned HTTP ${response.status}`,
        );
      return result;
    });
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function activityRow(kind, text, key, append = false) {
    if (!text || (!append && !text.trim())) return;
    let row = key ? activityRows.get(key) : null;
    if (!row) {
      if (!text.trim()) return;
      row = document.createElement("div");
      row.className = `activity-row ${kind}`;
      ui.activity.append(row);
      if (key) activityRows.set(key, row);
      text = text.replace(/^\s+/, "");
    }
    row.textContent = append ? `${row.textContent}${text}` : text;
    ui.activity.scrollTop = ui.activity.scrollHeight;
  }

  function compactValue(value) {
    if (typeof value === "string") return value;
    try {
      const serialized = JSON.stringify(value);
      return serialized.length > 1_200
        ? `${serialized.slice(0, 1_200)}…`
        : serialized;
    } catch {
      return String(value);
    }
  }

  function renderToolUpdate(update) {
    const key = update.toolCallId || `tool-${toolRows.size + 1}`;
    let tool = toolRows.get(key);
    if (!tool) {
      const details = document.createElement("details");
      details.className = "activity-row tool";
      const summary = document.createElement("summary");
      const output = document.createElement("pre");
      output.className = "tool-output";
      details.append(summary, output);
      ui.activity.append(details);
      tool = {
        details,
        summary,
        output,
        title: update.title || update.name || "Codex tool",
      };
      toolRows.set(key, tool);
    }

    if (update.title) tool.title = update.title;
    tool.details.classList.toggle("error", update.status === "failed");
    tool.summary.textContent = `${tool.title}${update.status ? ` · ${update.status}` : ""}`;

    const terminalOutput = update._meta?.terminal_output_delta?.data;
    const result = update.rawOutput ?? update.content;
    if (terminalOutput) {
      tool.output.textContent += terminalOutput;
    } else if (result && update.sessionUpdate === "tool_call_update") {
      const text = compactValue(result);
      if (text && !tool.output.textContent.includes(text))
        tool.output.textContent += text;
    }
    ui.activity.scrollTop = ui.activity.scrollHeight;
  }

  function renderRunEvent(event) {
    if (event.type === "run.configuring") {
      return;
    }
    if (event.type === "run.started") {
      ui["working-text"].textContent = "Magic is coming…";
      return;
    }
    if (event.type === "run.cancelling") {
      ui["working-text"].textContent = "Stopping Codex…";
      activityRow("error", "Cancellation requested…", "run-cancel");
      return;
    }
    if (event.type === "acp.permission") {
      renderToolUpdate({
        toolCallId: `permission-${event.id}`,
        title: `Permission: ${event.data.toolCall?.title || "Codex action"}`,
        status: event.data.decision,
      });
      return;
    }
    if (event.type === "run.completed") {
      activityRow("success", "✓ Codex finished successfully", "run-terminal");
      return;
    }
    if (event.type === "run.cancelled") {
      activityRow("error", "Generation stopped", "run-terminal");
      return;
    }
    if (event.type === "run.failed") {
      activityRow("error", event.data.error || "Codex failed", "run-terminal");
      return;
    }
    if (event.type !== "acp.update") return;

    const update = event.data;
    if (
      update.sessionUpdate === "agent_message_chunk" &&
      update.content?.type === "text"
    ) {
      activityRow(
        "agent",
        update.content.text,
        `agent:${update.messageId || "current"}`,
        true,
      );
    } else if (
      update.sessionUpdate === "tool_call" ||
      update.sessionUpdate === "tool_call_update"
    ) {
      renderToolUpdate(update);
    } else if (
      update.sessionUpdate === "plan" ||
      update.sessionUpdate === "plan_update"
    ) {
      activityRow(
        "tool",
        `Plan: ${compactValue(update.entries || update)}`,
        "plan",
      );
    }
  }

  function parseSseBuffer(buffer, onEvent) {
    const parts = buffer.split(/\r?\n\r?\n/);
    const remainder = parts.pop() || "";
    let terminalEvent = null;
    for (const part of parts) {
      const data = part
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      const event = JSON.parse(data);
      onEvent(event);
      if (["run.completed", "run.failed", "run.cancelled"].includes(event.type))
        terminalEvent = event;
    }
    return { remainder, terminalEvent };
  }

  function streamRunEvents(runId, onEvent) {
    const eventsUrl = `${BACKEND_URL.replace("/annotations", "/runs")}/${encodeURIComponent(runId)}/events`;

    if (typeof GM_xmlhttpRequest === "function") {
      return new Promise((resolve, reject) => {
        let consumed = 0;
        let buffer = "";
        let terminalEvent = null;
        const consume = (responseText) => {
          const fullText = responseText || "";
          buffer += fullText.slice(consumed);
          consumed = fullText.length;
          const parsed = parseSseBuffer(buffer, onEvent);
          buffer = parsed.remainder;
          terminalEvent ||= parsed.terminalEvent;
        };
        GM_xmlhttpRequest({
          method: "GET",
          url: eventsUrl,
          timeout: 15 * 60 * 1000,
          onprogress(response) {
            consume(response.responseText);
          },
          onload(response) {
            consume(response.responseText);
            if (terminalEvent) resolve(terminalEvent);
            else reject(new Error("Codex event stream ended unexpectedly"));
          },
          ontimeout() {
            reject(new Error("Codex event stream timed out"));
          },
          onerror() {
            reject(new Error("Could not read the Codex event stream"));
          },
        });
      });
    }

    return fetch(eventsUrl).then(async (response) => {
      if (!response.ok || !response.body)
        throw new Error(`Event stream returned HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let terminalEvent = null;
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const parsed = parseSseBuffer(buffer, onEvent);
        buffer = parsed.remainder;
        terminalEvent ||= parsed.terminalEvent;
        if (done) break;
      }
      if (!terminalEvent)
        throw new Error("Codex event stream ended unexpectedly");
      return terminalEvent;
    });
  }

  async function waitForRun(runId) {
    const runUrl = `${BACKEND_URL.replace("/annotations", "/runs")}/${encodeURIComponent(runId)}`;
    while (backendRunId === runId) {
      const run = await backendRequest("GET", runUrl);
      if (
        run.status === "completed" ||
        run.status === "failed" ||
        run.status === "cancelled"
      )
        return run;
      await delay(750);
    }
    throw new Error("Generation tracking was interrupted");
  }

  async function stopGeneration() {
    if (phase !== "submitting" || !backendRunId || ui.stop.disabled) return;
    ui.stop.disabled = true;
    ui.status.textContent = "Stopping Codex…";
    const runUrl = `${BACKEND_URL.replace("/annotations", "/runs")}/${encodeURIComponent(backendRunId)}`;
    try {
      await backendRequest("DELETE", runUrl);
    } catch (error) {
      ui.stop.disabled = false;
      ui.status.textContent = `Could not stop Codex: ${error.message}`;
    }
  }

  async function submit() {
    const note = ui.note.value.trim();
    if (!note || !annotation || phase !== "editing") return;

    phase = "submitting";
    ui.note.disabled = true;
    ui.cancel.disabled = true;
    ui.submit.disabled = true;
    ui.editor.classList.add("submitting");
    ui.stop.disabled = true;
    ui.status.textContent = "Creating screenshot…";

    try {
      const screenshot = await capture(annotation.rect);
      const payload = {
        version: 2,
        createdAt: new Date().toISOString(),
        note,
        execution: {
          model: ui.model.value.trim() || null,
          reasoningEffort: ui.reasoning.value || null,
        },
        page: {
          url: location.href,
          title: document.title,
          referrer: document.referrer || null,
          scroll: {
            x: Math.round(window.scrollX),
            y: Math.round(window.scrollY),
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
          },
          resources: pageResources(),
        },
        selection: {
          type: annotation.kind,
          viewportRect: serializeRect(annotation.rect),
          documentRect: serializeRect({
            ...annotation.rect,
            left: annotation.rect.left + window.scrollX,
            top: annotation.rect.top + window.scrollY,
          }),
          click: annotation.click
            ? {
                viewport: {
                  x: Math.round(annotation.click.x),
                  y: Math.round(annotation.click.y),
                },
                document: {
                  x: Math.round(annotation.click.x + window.scrollX),
                  y: Math.round(annotation.click.y + window.scrollY),
                },
              }
            : null,
        },
        clickedElement: elementInfo(annotation.clickedElement),
        coveringElement: elementInfo(annotation.coveringElement),
        textSelection: annotation.textSelection,
        screenshot,
      };

      console.log("[MagicBro] annotation payload:", payload);
      window.dispatchEvent(
        new CustomEvent("magicbro:annotation", { detail: payload }),
      );
      ui.status.textContent = "";
      const startedRun = await backendRequest("POST", BACKEND_URL, payload);
      backendRunId = startedRun.runId;
      ui.stop.disabled = false;
      let terminalEvent;
      try {
        terminalEvent = await streamRunEvents(backendRunId, renderRunEvent);
      } catch (streamError) {
        console.warn(
          "[MagicBro] live stream failed, falling back to status polling:",
          streamError,
        );
        const result = await waitForRun(backendRunId);
        terminalEvent = {
          type: `run.${result.status}`,
          data: { error: result.error },
        };
        renderRunEvent(terminalEvent);
      }
      if (terminalEvent.type === "run.cancelled") {
        console.log("[MagicBro] Codex generation cancelled:", terminalEvent);
        await delay(350);
        reset();
        return;
      }
      if (terminalEvent.type === "run.failed")
        throw new Error(terminalEvent.data.error || "Codex failed");
      console.log("[MagicBro] Codex completed:", terminalEvent);
      ui.status.textContent = "Done. Reloading…";
      await delay(500);
      window.location.reload();
    } catch (error) {
      console.error("[MagicBro] failed to create annotation:", error);
      phase = "editing";
      ui.note.disabled = false;
      ui.cancel.disabled = false;
      ui.submit.disabled = false;
      ui.editor.classList.remove("submitting");
      ui.status.textContent = error.message;
      ui.note.focus();
    }
  }

  ui["magic-button"].addEventListener("click", startPicking);

  ui.picker.addEventListener(
    "pointerdown",
    (event) => {
      if (phase !== "picking" || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      pointerStart = { x: event.clientX, y: event.clientY };
      ui.picker.setPointerCapture(event.pointerId);
      setRect(ui.selection, {
        left: event.clientX,
        top: event.clientY,
        width: 0,
        height: 0,
      });
      ui.selection.classList.add("active");
    },
    true,
  );

  ui.picker.addEventListener(
    "pointermove",
    (event) => {
      if (!pointerStart) return;
      event.preventDefault();
      setRect(
        ui.selection,
        normalizedRect(pointerStart, { x: event.clientX, y: event.clientY }),
      );
    },
    true,
  );

  ui.picker.addEventListener(
    "pointerup",
    (event) => {
      if (!pointerStart) return;
      event.preventDefault();
      event.stopPropagation();
      const end = { x: event.clientX, y: event.clientY };
      const dragged =
        Math.hypot(end.x - pointerStart.x, end.y - pointerStart.y) >=
        DRAG_THRESHOLD;
      const start = pointerStart;
      pointerStart = null;
      if (dragged) {
        finishSelection("area", normalizedRect(start, end), null);
      } else {
        finishSelection("point", pointRect(end), end);
      }
    },
    true,
  );

  ui.note.addEventListener("input", () => {
    ui.note.style.height = "auto";
    ui.note.style.height = `${Math.min(ui.note.scrollHeight, 110)}px`;
    ui.submit.disabled = !ui.note.value.trim();
  });
  ui.note.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit();
    }
  });
  ui.submit.addEventListener("click", submit);
  ui.cancel.addEventListener("click", reset);
  ui.stop.addEventListener("click", stopGeneration);

  backendRequest("GET", BACKEND_URL.replace("/annotations", "/config"))
    .then((config) => {
      const flattenOptions = (entries) =>
        entries.flatMap((entry) =>
          Array.isArray(entry.options)
            ? flattenOptions(entry.options)
            : [entry],
        );
      for (const option of config.configOptions || []) {
        if (option.type !== "select") continue;
        const values = flattenOptions(option.options || []);
        if (option.category === "model") {
          const current = ui.model.value;
          ui.model.replaceChildren(
            ...values.map((entry) => {
              const element = document.createElement("option");
              element.value = entry.value;
              element.textContent = entry.name || entry.value;
              if (entry.description) element.title = entry.description;
              return element;
            }),
          );
          const preferredModel = values.some((entry) => entry.value === current)
            ? current
            : values.some((entry) => entry.value === "gpt-5.6-sol")
              ? "gpt-5.6-sol"
              : option.currentValue;
          ui.model.value = preferredModel;
        } else if (option.category === "thought_level") {
          const current = ui.reasoning.value;
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Codex default";
          ui.reasoning.replaceChildren(
            defaultOption,
            ...values.map((entry) => {
              const element = document.createElement("option");
              element.value = entry.value;
              element.textContent = entry.name;
              return element;
            }),
          );
          ui.reasoning.value = values.some((entry) => entry.value === current)
            ? current
            : option.currentValue;
        }
      }
    })
    .catch(() => {
      // The backend may not be running yet; static defaults remain available.
    });

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.altKey && event.key.toLowerCase() === "m" && phase === "idle") {
        event.preventDefault();
        startPicking();
        return;
      }
      if (
        event.key === "Escape" &&
        phase !== "submitting" &&
        phase !== "idle"
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        reset();
      }
    },
    true,
  );
})();
