/**
 * library.js
 * ---------------------------------------------------------------------
 * The built-in datasheet library. Each item describes:
 *   id        - unique id
 *   label     - shown in the UI
 *   category  - grouping used in the UI
 *   files     - array of asset paths (relative to assets/datasheets/) that
 *               get appended to the pack when this item is selected. Items
 *               can map to more than one file (e.g. SWITCH also pulls in
 *               its Operating Instructions sheet).
 *   note      - optional small explainer shown under the label
 *   keywords  - array of RegExp (as strings, case-insensitive) used to
 *               auto-detect this item when a quote/schedule PDF is parsed
 *   needsUpload - true if no file is bundled yet; the UI will offer an
 *               "upload datasheet" control instead of a plain checkbox
 *
 * Everything here can be extended at runtime by the user via the
 * "Add a datasheet" panel in the app - those custom items are merged
 * with this list and persisted in the browser (see js/db.js).
 * ---------------------------------------------------------------------
 */

const DATASHEET_LIBRARY = [
  // ---------------- Door systems ----------------
  {
    id: "switch",
    label: "SWITCH Anti-Barricade Door System",
    category: "Door System",
    files: ["switch.pdf", "switch_operating_instructions.pdf"],
    note: "Includes the SWITCH Operating Instructions sheet automatically.",
    keywords: ["\\bSCH0[1-4]\\b", "\\bSCH-DTM", "\\bSWITCH\\b"]
  },
  {
    id: "sentry",
    label: "SENTRY",
    category: "Door System",
    files: ["switch.pdf", "switch_operating_instructions.pdf"],
    note: "SENTRY doors are supplied using the SWITCH datasheet + operating instructions.",
    keywords: ["\\bSEN0[1-2]\\b", "\\bSENTRY\\b"]
  },
  {
    id: "swing",
    label: "SWING Anti-Barricade Door System",
    category: "Door System",
    files: ["swing.pdf"],
    keywords: ["\\bSWD0[1-6]\\b", "\\bSWING\\b"]
  },
  {
    id: "solo",
    label: "SOLO Single Action Door System",
    category: "Door System",
    files: ["solo.pdf"],
    keywords: ["\\bSOD0[1-6]\\b", "\\bSOD-DTM", "\\bSOLO\\b"]
  },
  {
    id: "seclusion",
    label: "SECLUSION High Strength Door System",
    category: "Door System",
    files: ["seclusion.pdf"],
    keywords: ["\\bSEC01\\b", "\\bSECLUSION\\b"]
  },
  {
    id: "shower",
    label: "SHOWER Door System",
    category: "Door System",
    files: ["shower.pdf"],
    keywords: ["\\bSHD01\\b", "\\bSHOWER\\b"]
  },
  {
    id: "stow",
    label: "STOW Door System",
    category: "Door System",
    files: ["stow.pdf"],
    keywords: ["\\bSTW0[1-2]\\b", "\\bSTOW\\b"]
  },
  {
    id: "stable",
    label: "STABLE Door System",
    category: "Door System",
    files: ["stable.pdf"],
    keywords: ["\\bSTB0[1-2]\\b", "\\bSTABLE\\b"]
  },

  // ---------------- Vision panels ----------------
  {
    id: "duralux405",
    label: "Duralux Vision Panel (405 x 405mm)",
    category: "Vision Panel",
    files: ["duralux_405.pdf"],
    keywords: ["\\bD44[0-9]{2}\\b", "\\bD45[0-9]{2}\\b"]
  },
  {
    id: "duralux800",
    label: "Duralux Vision Panel (800 x 250mm)",
    category: "Vision Panel",
    files: ["duralux_800x250.pdf"],
    keywords: ["\\bD8[45][0-9]{2}\\b"]
  },
  {
    id: "pyrolux",
    label: "Pyrolux Vision Panel",
    category: "Vision Panel",
    files: ["pyrolux.pdf"],
    keywords: ["\\bP[0-9]{4}(TB)?\\b", "\\bPyrolux\\b"]
  },
  {
    id: "visilux",
    label: "Visilux Vision Panel",
    category: "Vision Panel",
    files: [],
    needsUpload: true,
    keywords: ["\\bVisilux\\b"]
  },
  {
    id: "panorama",
    label: "Panorama Vision Panel",
    category: "Vision Panel",
    files: [],
    needsUpload: true,
    keywords: ["\\bPanorama\\b"]
  },

  // ---------------- Ligature monitoring ----------------
  {
    id: "dtm",
    label: "KG500 Door Top Monitor",
    category: "Ligature Monitoring",
    files: ["dtm.pdf", "dtm_checking_instructions.pdf"],
    note: "Includes the KG500 DTM Checking Instructions sheet automatically.",
    keywords: ["\\bKG500\\b", "\\bKG520\\b", "\\bKG530\\b", "Door Top Monitor"]
  },

  // ---------------- Access control / locking ----------------
  {
    id: "kg245",
    label: "KG245 High Secure Electric Strike Housing",
    category: "Access Control & Locking",
    files: ["kg245.pdf"],
    keywords: ["\\bKG245\\b"]
  },
  {
    id: "kg222",
    label: "KG222 Triple Mag Lock with Architectural Housing",
    category: "Access Control & Locking",
    files: ["kg222.pdf"],
    keywords: ["\\bKG222\\b"]
  }
];

// Fixed, non-selectable "boilerplate" pages that are always appended in
// this order after the generated info pages and before the datasheets.
const BOILERPLATE_ASSETS = [
  { file: "bmtrada_certifications.pdf", label: "BM TRADA Certificates of Registration" },
  { file: "guarantee_terms.pdf", label: "Kingsway Guarantee Document (terms)" },
  { file: "om_guide_intro.pdf", label: "Operation & Maintenance Guide (intro)" }
];

const CATEGORY_ORDER = [
  "Door System",
  "Vision Panel",
  "Ligature Monitoring",
  "Access Control & Locking",
  "Additional Datasheets"
];
