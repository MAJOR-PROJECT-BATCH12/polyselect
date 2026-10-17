/* ==========================================================
   api.js  -  talks to the backend.

   DESIGN PHASE: analyzeImage() returns SAMPLE data after a short
   delay so the interface can be built and reviewed without the
   ML models. The numbers below are placeholders for the UI only.

   LATER: replace the body of analyzeImage() with a real fetch()
   to the FastAPI backend (see the commented block). Keep the
   returned object in the same shape and main.js needs no change.
   ========================================================== */

const API_BASE_URL = "http://127.0.0.1:8000";

/* Shape of one result:
   {
     plastic:    { code, abbr, name, found, confidence },   // Model 1
     enzymes:    [ { name, score }, ... ],                  // Model 2, best first
     topReason:  "short sentence",
     conditions: { temperature, ph, hours, degradation }    // Model 2
   }
*/
const SAMPLE_RESULTS = {
  PET: {
    plastic: { code: 1, abbr: "PET", name: "Polyethylene terephthalate", found: "Drink bottles, food trays, packaging film", confidence: 0.94 },
    enzymes: [
      { name: "LCC-ICCG", score: 0.93 },
      { name: "FAST-PETase", score: 0.84 },
      { name: "IsPETase", score: 0.61 }
    ],
    topReason: "Engineered PET hydrolase with the highest suitability score for PET.",
    conditions: { temperature: 72, ph: 8.0, hours: 10, degradation: 90 }
  },
  HDPE: {
    plastic: { code: 2, abbr: "HDPE", name: "High-density polyethylene", found: "Milk jugs, detergent bottles, pipes", confidence: 0.91 },
    enzymes: [
      { name: "Laccase with mediator", score: 0.58 },
      { name: "Alkane hydroxylase (AlkB)", score: 0.52 },
      { name: "Manganese peroxidase", score: 0.44 }
    ],
    topReason: "Best available match. Polyethylene breaks down slowly, so expect a low percentage.",
    conditions: { temperature: 37, ph: 6.0, hours: 240, degradation: 8 }
  },
  PVC: {
    plastic: { code: 3, abbr: "PVC", name: "Polyvinyl chloride", found: "Pipes, cable insulation, window frames", confidence: 0.88 },
    enzymes: [
      { name: "Laccase with mediator", score: 0.41 },
      { name: "Dehalogenase", score: 0.37 },
      { name: "Manganese peroxidase", score: 0.33 }
    ],
    topReason: "Best available match. PVC is hard to degrade and the evidence is limited.",
    conditions: { temperature: 30, ph: 5.0, hours: 720, degradation: 4 }
  },
  LDPE: {
    plastic: { code: 4, abbr: "LDPE", name: "Low-density polyethylene", found: "Carrier bags, cling film, squeezable bottles", confidence: 0.9 },
    enzymes: [
      { name: "Laccase with mediator", score: 0.55 },
      { name: "Alkane hydroxylase (AlkB)", score: 0.49 },
      { name: "Manganese peroxidase", score: 0.41 }
    ],
    topReason: "Best available match for thin polyethylene film.",
    conditions: { temperature: 35, ph: 6.5, hours: 336, degradation: 10 }
  },
  PP: {
    plastic: { code: 5, abbr: "PP", name: "Polypropylene", found: "Food containers, bottle caps, straws", confidence: 0.92 },
    enzymes: [
      { name: "Manganese peroxidase", score: 0.52 },
      { name: "Laccase with mediator", score: 0.47 },
      { name: "Alkane hydroxylase (AlkB)", score: 0.38 }
    ],
    topReason: "Best available match. Polypropylene resists enzymes, so expect a low percentage.",
    conditions: { temperature: 37, ph: 5.5, hours: 480, degradation: 6 }
  },
  PS: {
    plastic: { code: 6, abbr: "PS", name: "Polystyrene", found: "Disposable cups, foam trays, packaging foam", confidence: 0.89 },
    enzymes: [
      { name: "Laccase with mediator", score: 0.5 },
      { name: "Manganese peroxidase", score: 0.46 },
      { name: "Peroxidase", score: 0.35 }
    ],
    topReason: "Best available match for polystyrene.",
    conditions: { temperature: 30, ph: 5.5, hours: 504, degradation: 7 }
  }
};

const SAMPLE_ORDER = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Picks a sample from the file name so the same photo gives the same result. */
function pickSampleCode(fileName) {
  let sum = 0;
  for (const ch of fileName) sum += ch.charCodeAt(0);
  return SAMPLE_ORDER[sum % SAMPLE_ORDER.length];
}

async function analyzeImage(file, productName) {
  // ---- DESIGN PHASE (sample data) ----
  await sleep(2200);
  return SAMPLE_RESULTS[pickSampleCode(file.name)];

  // ---- LATER: real backend call. Delete the two lines above and use this. ----
  // const body = new FormData();
  // body.append("image", file);
  // if (productName) body.append("product", productName);
  //
  // const response = await fetch(`${API_BASE_URL}/api/analyze`, { method: "POST", body });
  // if (!response.ok) throw new Error("The server could not analyse this photo.");
  // return await response.json();
}