/* ==========================================================
   main.js  -  interface behaviour (no backend needed yet).
   Uses analyzeImage(), analyzeKnownPlastic(), SAMPLE_RESULTS
   and SAMPLE_ORDER from api.js.
   ========================================================== */

const DEMO_MODE = true; // true = show "preview another plastic" buttons. Set false for the real app.
const MAX_FILE_MB = 8;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const $ = (id) => document.getElementById(id);

const els = {
  tabPhoto: $("tab-photo"), tabKnown: $("tab-known"),
  panelPhoto: $("panel-photo"), panelKnown: $("panel-known"),

  input: $("imageInput"), dropzone: $("dropzone"), dropzoneText: $("dropzoneText"),
  dropzoneChange: $("dropzoneChange"), preview: $("previewImg"), fileError: $("fileError"),
  product: $("productInput"), photoBtn: $("photoBtn"), photoReset: $("photoReset"),

  options: $("plasticOptions"), knownBtn: $("knownBtn"), knownReset: $("knownReset"),

  empty: $("emptyState"), loading: $("loadingState"), progress: $("progressList"),
  error: $("errorState"), errorText: $("errorText"), result: $("resultState")
};

let currentFile = null;
let previewUrl = null;
let selectedCode = null;
let progressTimer = null;
let lastContext = { source: "photo", productName: "" };

/* ---------- helpers ---------- */
function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const pct = (n) => Math.round(n * 100);

function showOnly(which) {
  for (const key of ["empty", "loading", "error", "result"]) els[key].hidden = key !== which;
}

function resinSymbol(code, cls) {
  return (
    '<svg class="' + cls + '" viewBox="0 0 120 120" role="img" aria-label="Recycling code ' + code + '">' +
    '<path d="M60 12 L108 98 H12 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>' +
    '<text x="60" y="84" text-anchor="middle" font-size="42">' + code + "</text></svg>"
  );
}

/* ---------- tabs ---------- */
function setMode(mode) {
  const photo = mode === "photo";
  els.tabPhoto.classList.toggle("is-active", photo);
  els.tabKnown.classList.toggle("is-active", !photo);
  els.tabPhoto.setAttribute("aria-selected", String(photo));
  els.tabKnown.setAttribute("aria-selected", String(!photo));
  els.tabPhoto.tabIndex = photo ? 0 : -1;
  els.tabKnown.tabIndex = photo ? -1 : 0;
  els.panelPhoto.hidden = !photo;
  els.panelKnown.hidden = photo;
  stopProgress();
  els.result.classList.remove("is-revealed");
  showOnly("empty");
}

els.tabPhoto.addEventListener("click", () => setMode("photo"));
els.tabKnown.addEventListener("click", () => setMode("known"));
[els.tabPhoto, els.tabKnown].forEach((tab) =>
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tab === els.tabPhoto ? els.tabKnown : els.tabPhoto;
    setMode(next === els.tabPhoto ? "photo" : "known");
    next.focus();
  })
);

/* ---------- photo mode: file handling ---------- */
function setFile(file) {
  els.fileError.textContent = "";
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    els.fileError.textContent = "That file is not supported. Choose a PNG, JPG or WebP image.";
    els.input.value = "";
    return;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    els.fileError.textContent = "That image is larger than " + MAX_FILE_MB + " MB. Choose a smaller one.";
    els.input.value = "";
    return;
  }

  currentFile = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);

  els.preview.src = previewUrl;
  els.preview.alt = "Preview of the selected photo: " + file.name;
  els.preview.hidden = false;
  els.dropzoneText.hidden = true;
  els.dropzoneChange.hidden = false;
  els.dropzone.classList.add("has-image");
  els.photoBtn.disabled = false;
  els.photoReset.hidden = false;
}

els.input.addEventListener("change", () => setFile(els.input.files[0]));
["dragenter", "dragover"].forEach((type) =>
  els.dropzone.addEventListener(type, (event) => { event.preventDefault(); els.dropzone.classList.add("is-dragging"); })
);
["dragleave", "drop"].forEach((type) =>
  els.dropzone.addEventListener(type, (event) => { event.preventDefault(); els.dropzone.classList.remove("is-dragging"); })
);
els.dropzone.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));

function resetPhoto() {
  currentFile = null;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  els.input.value = "";
  els.product.value = "";
  els.preview.hidden = true;
  els.preview.removeAttribute("src");
  els.dropzoneText.hidden = false;
  els.dropzoneChange.hidden = true;
  els.dropzone.classList.remove("has-image");
  els.photoBtn.disabled = true;
  els.photoReset.hidden = true;
  els.fileError.textContent = "";
  els.result.classList.remove("is-revealed");
  showOnly("empty");
}
els.photoReset.addEventListener("click", resetPhoto);

/* ---------- known-plastic mode: picker ---------- */
function buildPicker() {
  els.options.innerHTML = SAMPLE_ORDER.map((code) => {
    const p = SAMPLE_RESULTS[code].plastic;
    return (
      '<label class="plastic-option">' +
        '<input type="radio" name="plastic" value="' + esc(code) + '" class="visually-hidden">' +
        '<span class="plastic-card">' +
          resinSymbol(p.code, "mini-symbol") +
          '<span class="plastic-card-text"><strong>' + esc(p.abbr) + "</strong><span>" + esc(p.name) + "</span></span>" +
        "</span>" +
      "</label>"
    );
  }).join("");
}

els.options.addEventListener("change", (event) => {
  if (event.target.name !== "plastic") return;
  selectedCode = event.target.value;
  els.knownBtn.disabled = false;
  els.knownReset.hidden = false;
});

els.knownReset.addEventListener("click", () => {
  selectedCode = null;
  els.options.querySelectorAll("input").forEach((i) => { i.checked = false; });
  els.knownBtn.disabled = true;
  els.knownReset.hidden = true;
  els.result.classList.remove("is-revealed");
  showOnly("empty");
});

/* ---------- loading progress ---------- */
function startProgress(steps) {
  let active = 0;
  const draw = () => {
    els.progress.innerHTML = steps.map((label, i) => {
      const state = i < active ? "done" : i === active ? "active" : "todo";
      return '<li class="progress-step is-' + state + '"><span class="progress-dot" aria-hidden="true"></span>' +
             esc(label) + (state === "done" ? '<span class="visually-hidden"> (done)</span>' : "") + "</li>";
    }).join("");
  };
  draw();
  showOnly("loading");
  progressTimer = setInterval(() => {
    active = Math.min(active + 1, steps.length - 1);
    draw();
  }, 800);
}
function stopProgress() { clearInterval(progressTimer); }

/* ---------- render ---------- */
function timeNote(hours) {
  return hours >= 48 ? "about " + Math.round(hours / 24) + " days" : "";
}

function renderResult(data, ctx) {
  lastContext = ctx;
  const p = data.plastic;
  const c = data.conditions;
  const best = data.enzymes[0];
  const others = data.enzymes.slice(1);
  const fromPhoto = ctx.source === "photo" && p.confidence !== null && p.confidence !== undefined;

  const productHtml = ctx.productName
    ? '<p class="plastic-product">Product: ' + esc(ctx.productName) + "</p>" : "";

  const confidenceHtml = fromPhoto
    ? '<div class="confidence"><div class="confidence-row"><span>Confidence</span><span>' + pct(p.confidence) + "%</span></div>" +
      '<div class="meter" role="img" aria-label="Confidence ' + pct(p.confidence) + ' percent"><span style="--w:' + pct(p.confidence) + '%"></span></div></div>'
    : '<p class="plastic-chosen">You chose this plastic, so no photo check was needed.</p>';

  const othersHtml = others.length
    ? '<p class="others-title">Other options, best first</p><ul class="others">' +
      others.map((e) =>
        '<li class="other-row"><span>' + esc(e.name) + "</span>" +
        '<div class="meter is-green" role="img" aria-label="Suitability ' + pct(e.score) + ' percent"><span style="--w:' + pct(e.score) + '%"></span></div>' +
        '<span class="score">' + pct(e.score) + "%</span></li>"
      ).join("") + "</ul>"
    : "";

  const note = timeNote(c.hours);
  const evidenceHtml = data.evidence && data.evidence.length
    ? '<ul class="evidence">' + data.evidence.map((s) =>
        "<li><p class=\"evidence-title\">" + esc(s.title) + "</p>" +
        '<p class="evidence-meta">' + esc(s.authors) + ", " + esc(s.year) + "</p>" +
        '<p class="evidence-finding">' + esc(s.finding) + "</p></li>"
      ).join("") + "</ul>"
    : '<p class="evidence-empty">No supporting studies are stored for this plastic yet. Treat this recommendation as a starting point and confirm it in the lab.</p>';

  els.result.innerHTML =
    '<div class="result-body">' +

    '<section class="result-block" aria-labelledby="r-plastic">' +
      '<h3 id="r-plastic" tabindex="-1">' + (fromPhoto ? "Plastic identified" : "Plastic selected") + "</h3>" +
      '<div class="specimen">' + resinSymbol(p.code, "resin-symbol") +
        "<div>" +
          '<p class="plastic-abbr">' + esc(p.abbr) + "</p>" +
          '<p class="plastic-name">' + esc(p.name) + "</p>" +
          '<p class="plastic-found">Commonly found in: ' + esc(p.found) + "</p>" +
          productHtml + confidenceHtml +
        "</div>" +
      "</div>" +
    "</section>" +

    '<section class="result-block" aria-labelledby="r-enzyme">' +
      '<h3 id="r-enzyme">Recommended enzyme</h3>' +
      '<div class="top-pick">' +
        '<p class="top-pick-label">Best match</p>' +
        '<p class="top-pick-name">' + esc(best.name) + "</p>" +
        '<p class="top-pick-reason">' + esc(data.topReason) + "</p>" +
        '<div class="meter is-green" role="img" aria-label="Suitability ' + pct(best.score) + ' percent"><span style="--w:' + pct(best.score) + '%"></span></div>' +
        '<p class="top-pick-score">Suitability ' + pct(best.score) + "%</p>" +
      "</div>" + othersHtml +
    "</section>" +

    '<section class="result-block" aria-labelledby="r-cond">' +
      '<h3 id="r-cond">Conditions to use</h3>' +
      '<dl class="conditions">' +
        '<div class="cond"><dt>Temperature</dt><dd>' + esc(c.temperature) + '<span class="unit">°C</span>' +
          '<span class="scale scale-temp" role="img" aria-label="' + esc(c.temperature) + ' degrees on a 0 to 100 scale"><span style="--w:' + Math.min(100, Math.max(0, c.temperature)) + '%"></span></span></dd></div>' +
        '<div class="cond"><dt>pH</dt><dd>' + esc(c.ph.toFixed(1)) +
          '<span class="scale scale-ph" role="img" aria-label="pH ' + esc(c.ph.toFixed(1)) + ' on a 0 to 14 scale"><i style="--pos:' + (c.ph / 14 * 100).toFixed(1) + '%"></i></span></dd></div>' +
        '<div class="cond"><dt>Reaction time</dt><dd>' + esc(c.hours) + '<span class="unit">hours</span>' +
          (note ? '<span class="cond-note">' + esc(note) + "</span>" : "") + "</dd></div>" +
        '<div class="cond is-key"><dt>Expected degradation</dt>' +
          '<dd class="ring-wrap"><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-track" cx="50" cy="50" r="42" pathLength="100"/>' +
          '<circle class="ring-fill" cx="50" cy="50" r="42" pathLength="100" style="--pct:' + Math.min(100, Math.max(0, c.degradation)) + '"/></svg>' +
          '<span class="ring-num">' + esc(c.degradation) + '<span class="unit">%</span></span></dd></div>' +
      "</dl>" +
    "</section>" +

    '<section class="result-block" aria-labelledby="r-evidence">' +
      '<h3 id="r-evidence">Supporting research</h3>' + evidenceHtml +
    "</section>" +

    '<div class="result-footer">' +
      '<button type="button" class="btn btn-quiet" id="copyBtn">Copy summary</button>' +
      '<span class="copy-status" id="copyStatus" role="status"></span>' +
    "</div>" +
    '<p class="sample-note">These are sample values for the interface design. Real results will come from the trained models.</p>' +
    (DEMO_MODE ? demoSwitcherHtml(p.abbr) : "") +
    "</div>";

  els.result.dataset.summary = summaryText(data);
  showOnly("result");

  requestAnimationFrame(() => requestAnimationFrame(() => els.result.classList.add("is-revealed")));
  const heading = $("r-plastic");
  if (heading) heading.focus();
}

function summaryText(data) {
  const p = data.plastic, c = data.conditions, best = data.enzymes[0];
  return [
    "PolySelect result",
    "Plastic: " + p.abbr + " (" + p.name + ")",
    "Best enzyme: " + best.name + " (suitability " + pct(best.score) + "%)",
    "Temperature: " + c.temperature + " °C",
    "pH: " + c.ph.toFixed(1),
    "Reaction time: " + c.hours + " hours",
    "Expected degradation: " + c.degradation + "%",
    "Note: sample values for interface design only."
  ].join("\n");
}

function demoSwitcherHtml(activeAbbr) {
  return (
    '<div class="demo-switch" id="demoSwitch"><span>Preview another plastic:</span>' +
    SAMPLE_ORDER.map((code) =>
      '<button type="button" data-code="' + code + '" aria-pressed="' + (code === activeAbbr) + '">' + code + "</button>"
    ).join("") + "</div>"
  );
}

els.result.addEventListener("click", async (event) => {
  const demo = event.target.closest("#demoSwitch button");
  if (demo) {
    els.result.classList.remove("is-revealed");
    const sample = SAMPLE_RESULTS[demo.dataset.code];
    const data = lastContext.source === "known" ? { ...sample, plastic: { ...sample.plastic, confidence: null } } : sample;
    renderResult(data, lastContext);
    return;
  }
  if (event.target.closest("#copyBtn")) {
    const status = $("copyStatus");
    try {
      await navigator.clipboard.writeText(els.result.dataset.summary);
      status.textContent = "Copied to clipboard.";
    } catch (err) {
      status.textContent = "Could not copy. Select the text and copy it yourself.";
    }
  }
});

/* ---------- submit: run a search ---------- */
async function runSearch(steps, source, button, task, productName) {
  button.disabled = true;
  els.result.classList.remove("is-revealed");
  startProgress(steps);
  try {
    const data = await task();
    stopProgress();
    renderResult(data, { source, productName });
  } catch (err) {
    stopProgress();
    els.errorText.textContent = "Check your connection and try again. If it keeps failing, try a different photo or plastic.";
    showOnly("error");
  } finally {
    button.disabled = false;
  }
}

els.panelPhoto.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentFile) return;
  const product = els.product.value.trim();
  runSearch(
    ["Identifying the plastic", "Choosing an enzyme", "Working out the conditions", "Finding supporting studies"],
    "photo", els.photoBtn, () => analyzeImage(currentFile, product), product
  );
});

els.panelKnown.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedCode) return;
  runSearch(
    ["Choosing an enzyme", "Working out the conditions", "Finding supporting studies"],
    "known", els.knownBtn, () => analyzeKnownPlastic(selectedCode), ""
  );
});

buildPicker();