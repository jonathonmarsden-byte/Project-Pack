/**
 * quoteparse.js
 * ---------------------------------------------------------------------
 * Reads an uploaded quotation / doorset schedule PDF with pdf.js, pulls
 * out plain text, and:
 *   1. tries to guess the project fields (client, project, customer...)
 *   2. scans for product codes/keywords that match items in the
 *      datasheet library (built-in + custom) so they can be auto-ticked
 *   3. reports any recognised keyword that has no matching file yet, so
 *      the UI can prompt "we found references to X - upload its datasheet"
 * ---------------------------------------------------------------------
 */

async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str);
    text += strings.join(" ") + "\n";
  }
  return text;
}

// Label -> form field id. Order matters: first match wins per field.
const FIELD_PATTERNS = {
  client: [
    /Client\s*Detail\s*[:\-]\s*([^\n\r]+)/i,
    /Client\s*[:\-]\s*([^\n\r]+)/i
  ],
  project: [
    /Project\s*Name\s*[:\-]\s*([^\n\r]+)/i,
    /Project\s*[:\-]\s*([^\n\r]+)/i,
    /Project\s*Reference\s*[:\-]\s*([^\n\r]+)/i
  ],
  customer: [
    /Contractor\s*\/\s*Customer\s*Name\s*[:\-]\s*([^\n\r]+)/i,
    /Customer\s*[:\-]\s*([^\n\r]+)/i
  ],
  scheduleRef: [
    /Kingsway\s*Door\s*Schedule\s*Reference\s*[:\-]\s*([^\n\r]+)/i,
    /Doorset\s*Schedule\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
    /Schedule\s*ref\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
    /Quotation\s*(?:Number|reference)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i
  ],
  fireRating: [/Fire\s*Rating\s*[:\-]\s*([A-Za-z0-9\s\/]+)/i],
  frameSpecification: [/Frame\s*Specification\s*[:\-]\s*([^\n\r]+)/i],
  completionDate: [/Project\s*Completion\s*Date\s*[:\-]\s*([^\n\r]+)/i]
};

function guessFields(text) {
  const out = {};
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1] && m[1].trim()) {
        out[field] = m[1].trim().replace(/\s{2,}/g, " ");
        break;
      }
    }
  }
  return out;
}

/**
 * Given the extracted text and the full merged library (built-in + custom),
 * returns { matchedIds: Set, unmatchedKeywordHits: [{keyword, sample}] }
 */
function matchLibraryItems(text, library) {
  const matchedIds = new Set();
  const hitLog = [];

  for (const item of library) {
    if (!item.keywords || !item.keywords.length) continue;
    for (const kw of item.keywords) {
      const re = new RegExp(kw, "i");
      const m = text.match(re);
      if (m) {
        matchedIds.add(item.id);
        hitLog.push({ itemId: item.id, keyword: kw, sample: m[0] });
        break;
      }
    }
  }
  return { matchedIds, hitLog };
}

/**
 * Very loose scan for "extra" product-looking tokens (e.g. KG###, or
 * ALLCAPS door-system-style codes) that did NOT match anything in the
 * library - useful to nudge the user toward uploading more datasheets.
 */
function findUnrecognisedCodes(text, library) {
  const known = new Set();
  library.forEach((i) => (i.keywords || []).forEach((k) => known.add(k)));

  const codeRe = /\b(KG\d{2,4}[A-Z]{0,3}|[A-Z]{2,4}\d{2}(?:\.\d{2})?(?:\.[A-Z])?)\b/g;
  const found = new Map();
  let m;
  while ((m = codeRe.exec(text))) {
    const code = m[0];
    // skip if it's already covered by a library match
    const isKnown = library.some((item) =>
      (item.keywords || []).some((k) => new RegExp(k, "i").test(code))
    );
    if (!isKnown) {
      found.set(code, (found.get(code) || 0) + 1);
    }
  }
  // Only keep things that look meaningful (appear or are clearly a product code)
  return [...found.entries()]
    .filter(([code]) => /^KG\d/.test(code) || /^[A-Z]{2,4}\d{2}/.test(code))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([code, count]) => ({ code, count }));
}
