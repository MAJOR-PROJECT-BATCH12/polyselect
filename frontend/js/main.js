/* ==========================================================
   main.js  -  interface behaviour (no backend needed yet).
   Uses analyzeImage() and SAMPLE_RESULTS from api.js.
   ========================================================== */

const DEMO_MODE = true; // true = show "preview another plastic" buttons. Set false for the real app.
const MAX_FILE_MB = 8;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const els = {
  form: document.getElementById("analyzeForm"),
  input: document.getElementById("imageInput"),
  dropzone: document.getElementById("dropzone"),
  dropzoneText: document.getElementById("dropzoneText"),
  dropzoneChange: document.getElementById("dropzoneChange"),
  preview: document.getElementById("previewImg"),
  fileError: document.getElementById("fileError"),
  product: document.getElementById("productInput"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  resetBtn: document.getElementById("resetBtn"),
  empty: document.getElementById("emptyState"),
  loading: document.getElementById("loadingState"),
  loadingText: document.getElementById("loadingText"),
  error: document.getElementById("errorState"),
  errorText: document.getElementById("errorText"),
  result: document.getElementById("resultState")
};

let currentFile = null;
let previewUrl = null;
let loadingTimer = null;

/* ---------- helpers ---------- */
function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const pct = (n) => Math.round(n * 100);

function showOnly(which) {
  for (const key of ["empty", "loading", "error", "result"]) {
    els[key].hidden = key !== which;
  }
}

/* ---------- file handling ---------- */
function setFileError(message) { els.fileError.textContent = message; }

function setFile(file) {
  setFileError("");
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    setFileError("That file is not supported. Choose a PNG, JPG or WebP image.");
    els.input.value = "";
    return;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    setFileError("That image is larger than " + MAX_FILE_MB + " MB. Choose a smaller one.");
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

  els.analyzeBtn.disabled = false;
  els.resetBtn.hidden = false;
}

els.input.addEventListener("change", () => setFile(els.input.files[0]));

["dragenter", "dragover"].forEach((type) =>
  els.dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropzone.classList.add("is-dragging");
  })
);
["dragleave", "drop"].forEach((type) =>
  els.dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("is-dragging");
  })
);
els.dropzone.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));

/* ---------- loading messages ---------- */
function startLoading() {
  const messages = ["Identifying the plastic…", "Choosing an enzyme…", "Working out the conditions…"];
  let i = 0;
  els.loadingText.textContent = messages[0];
  showOnly("loading");
  loadingTimer = setInterval(() => {
    i = Math.min(i + 1, messages.length - 1);
    els.loadingText.textContent = messages[i];
  }, 800);
}
function stopLoading() { clearInterval(loadingTimer); }

/* ---------- render ---------- */
function resinSymbol(code) {
  return (
    '<svg class="resin-symbol" viewBox="0 0 120 120" role="img" aria-label="Resin code ' + code + '">' +
    '<path d="M60 12 L108 98 H12 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>' +
    '<text x="60" y="84" text-anchor="middle" font-size="42">' + code + "</text></svg>"
  );
}

function renderResult(data, productName) {
  const p = data.plastic;
  const c = data.conditions;
  const best = data.enzymes[0];
  const others = data.enzymes.slice(1);

  const productHtml = productName
    ? '<p class="plastic-product">Product: ' + esc(productName) + "</p>"
    : "";

  const othersHtml = others.length
    ? '<p class="others-title">Other options, best first</p><ul class="others">' +
      others.map((e) =>
        '<li class="other-row"><span>' + esc(e.name) + "</span>" +
        '<div class="meter is-green" role="img" aria-label="Suitability ' + pct(e.score) + ' percent">' +
        '<span style="--w:' + pct(e.score) + '%"></span></div>' +
        '<span class="score">' + pct(e.score) + "%</span></li>"
      ).join("") + "</ul>"
    : "";

  els.result.innerHTML =
    '<div class="result-body">' +

    '<section class="result-block" aria-labelledby="r-plastic">' +
      '<h3 id="r-plastic" tabindex="-1">Plastic identified</h3>' +
      '<div class="specimen">' + resinSymbol(p.code) +
        "<div>" +
          '<p class="plastic-abbr">' + esc(p.abbr) + "</p>" +
          '<p class="plastic-name">' + esc(p.name) + "</p>" +
          '<p class="plastic-found">Commonly found in: ' + esc(p.found) + "</p>" +
          productHtml +
          '<div class="confidence"><div class="confidence-row"><span>Confidence</span><span>' + pct(p.confidence) + "%</span></div>" +
          '<div class="meter" role="img" aria-label="Confidence ' + pct(p.confidence) + ' percent"><span style="--w:' + pct(p.confidence) + '%"></span></div></div>' +
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
        '<div class="cond"><dt>Temperature</dt><dd>' + esc(c.temperature) + '<span class="unit">°C</span></dd></div>' +
        '<div class="cond"><dt>pH</dt><dd>' + esc(c.ph.toFixed(1)) + "</dd></div>" +
        '<div class="cond"><dt>Reaction time</dt><dd>' + esc(c.hours) + '<span class="unit">hours</span></dd></div>' +
        '<div class="cond is-key"><dt>Expected degradation</dt><dd>' + esc(c.degradation) + '<span class="unit">%</span></dd></div>' +
      "</dl>" +
    "</section>" +

    '<p class="sample-note">These are sample values for the interface design. Real results will come from the trained models.</p>' +
    (DEMO_MODE ? demoSwitcherHtml(p.abbr) : "") +
    "</div>";

  showOnly("result");

  // Fill the meters on the next frame so the bars animate in.
  requestAnimationFrame(() => requestAnimationFrame(() => els.result.classList.add("is-revealed")));

  const heading = document.getElementById("r-plastic");
  if (heading) heading.focus({ preventScroll: false });
}

function demoSwitcherHtml(activeAbbr) {
  return (
    '<div class="demo-switch" id="demoSwitch"><span>Preview another plastic:</span>' +
    SAMPLE_ORDER.map((code) =>
      '<button type="button" data-code="' + code + '" aria-pressed="' + (code === activeAbbr) + '">' + code + "</button>"
    ).join("") + "</div>"
  );
}

els.result.addEventListener("click", (event) => {
  const btn = event.target.closest("#demoSwitch button");
  if (!btn) return;
  els.result.classList.remove("is-revealed");
  renderResult(SAMPLE_RESULTS[btn.dataset.code], els.product.value.trim());
});

/* ---------- submit / reset ---------- */
els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentFile) return;

  els.analyzeBtn.disabled = true;
  els.result.classList.remove("is-revealed");
  startLoading();

  try {
    const data = await analyzeImage(currentFile, els.product.value.trim());
    stopLoading();
    renderResult(data, els.product.value.trim());
  } catch (err) {
    stopLoading();
    els.errorText.textContent = "Check your connection and try again. If it keeps failing, try a different photo.";
    showOnly("error");
  } finally {
    els.analyzeBtn.disabled = false;
  }
});

els.resetBtn.addEventListener("click", () => {
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
  els.analyzeBtn.disabled = true;
  els.resetBtn.hidden = true;
  setFileError("");
  els.result.classList.remove("is-revealed");
  showOnly("empty");
});