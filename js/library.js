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
 *   needsUpload - true if no file is bundled *yet*. This is just the
 *               starting assumption - app.js checks, on every load, whether
 *               a matching PDF now exists at assets/datasheets/<files[0]>
 *               (the conventional filename is simply "<id>.pdf") and treats
 *               the item as available automatically if so. So there are two
 *               ways to supply a missing datasheet:
 *                 1. Drop a PDF named exactly like `files[0]` below into
 *                    assets/datasheets/ and commit/redeploy - no code
 *                    change needed, the app finds it by itself.
 *                 2. Use the inline "needs file" upload control in the app
 *                    itself - that stores the PDF in the browser's
 *                    IndexedDB instead, so it only applies on that device.
 *
 * IMPORTANT: an item is only ever included in the generated PDF if its
 * checkbox is ticked. Scanning a quote (js/app.js) resets every checkbox
 * first and then ticks only what that quote actually matched, so the pack
 * never contains the whole library "just in case" - see README for details.
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
    id: "service",
    label: "SERVICE Riser Cupboard Door System",
    category: "Door System",
    files: ["service.pdf"],
    keywords: ["\\bSRV0[1-2]\\b", "\\bSERVICE\\b"]
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
    files: ["visilux.pdf"],
    needsUpload: true,
    keywords: ["\\bVisilux\\b"]
  },
  {
    id: "panorama",
    label: "Panorama Vision Panel",
    category: "Vision Panel",
    files: ["panorama.pdf"],
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

  // ---------------- Locking & access control ----------------
  { id: "kg245", label: "KG245 High Secure Electric Strike Housing", category: "Locking & Access Control", files: ["kg245.pdf"], keywords: ["\\bKG245\\b"] },
  { id: "kg222", label: "KG222 Triple Mag Lock with Architectural Housing", category: "Locking & Access Control", files: ["kg222.pdf"], keywords: ["\\bKG222\\b"] },
  { id: "kg240", label: "KG240 High Secure Electric Strike Release", category: "Locking & Access Control", files: ["kg240.pdf"], keywords: ["\\bKG240\\b"] },
  { id: "kg132", label: "KG132 Nightlatch Lockcase (electric strike compatible)", category: "Locking & Access Control", files: ["kg132.pdf"], keywords: ["\\bKG132\\b"] },
  { id: "kg241", label: "KG241 High Secure Electric Strike Release", category: "Locking & Access Control", files: ["kg241.pdf"], needsUpload: true, keywords: ["\\bKG241\\b"] },
  { id: "kg218", label: "KG218 High Secure 3-Point Locking System", category: "Locking & Access Control", files: ["kg218.pdf"], needsUpload: true, keywords: ["\\bKG218\\b"] },
  { id: "kg244", label: "KG244 Twin Mag Lock - Vertical Frame Mounted", category: "Locking & Access Control", files: ["kg244.pdf"], needsUpload: true, keywords: ["\\bKG244\\b"] },
  { id: "kg1400", label: "KG1400 Auto-Locking Lockset with Secondary Override", category: "Locking & Access Control", files: ["kg1400.pdf"], needsUpload: true, keywords: ["\\bKG1400\\b"] },
  { id: "kg1200", label: "KG1200 Bedroom Lockset with Secondary Override", category: "Locking & Access Control", files: ["kg1200.pdf"], needsUpload: true, keywords: ["\\bKG1200\\b"] },
  { id: "kg1500", label: "KG1500 Indicator Lockset with Secondary Override", category: "Locking & Access Control", files: ["kg1500.pdf"], needsUpload: true, keywords: ["\\bKG1500\\b"] },
  { id: "kg1700", label: "KG1700 Communal Auto-Locking Lockset", category: "Locking & Access Control", files: ["kg1700.pdf"], needsUpload: true, keywords: ["\\bKG1700\\b"] },
  { id: "kg1600", label: "KG1600 Communal Deadlock Lockset", category: "Locking & Access Control", files: ["kg1600.pdf"], needsUpload: true, keywords: ["\\bKG1600\\b"] },
  { id: "kg1300", label: "KG1300 Auto-Locking Lockset", category: "Locking & Access Control", files: ["kg1300.pdf"], needsUpload: true, keywords: ["\\bKG1300\\b"] },
  { id: "kg1100", label: "KG1100 Bedroom Lockset", category: "Locking & Access Control", files: ["kg1100.pdf"], needsUpload: true, keywords: ["\\bKG1100\\b"] },
  { id: "kg220-221", label: "KG220-221 Quarter Turn Deadbolt", category: "Locking & Access Control", files: ["kg220-221.pdf"], needsUpload: true, keywords: ["\\bKG22[01]\\b"] },

  // ---------------- Door closers & hinges ----------------
  { id: "kg21", label: "KG21 Recessed Side Door Closer", category: "Door Closers & Hinges", files: ["kg21.pdf"], keywords: ["\\bKG21\\b"] },
  { id: "kg35", label: "KG35 Double Action Transom Closer", category: "Door Closers & Hinges", files: ["kg35.pdf"], keywords: ["\\bKG35\\b"] },
  { id: "kg200", label: "KG200 Continuous Hinge", category: "Door Closers & Hinges", files: ["kg200.pdf"], keywords: ["\\bKG200\\b"] },
  { id: "kg201", label: "KG201 Continuous Hinge", category: "Door Closers & Hinges", files: ["kg201.pdf"], keywords: ["\\bKG201\\b"] },
  { id: "kg202e", label: "KG202E SwingHinge Electrical Modification", category: "Door Closers & Hinges", files: ["kg202e.pdf"], keywords: ["\\bKG202E\\b"] },
  { id: "kg280", label: "KG280 Switch Hinge", category: "Door Closers & Hinges", files: ["kg280.pdf"], keywords: ["\\bKG280\\b"] },
  { id: "kg37", label: "KG37 Double Action Transom Closer - Free Swing", category: "Door Closers & Hinges", files: ["kg37.pdf"], needsUpload: true, keywords: ["\\bKG37\\b"] },
  { id: "kg38", label: "KG38 Double Action Transom Closer - Electro Hold Open", category: "Door Closers & Hinges", files: ["kg38.pdf"], needsUpload: true, keywords: ["\\bKG38\\b"] },
  { id: "kg202", label: "KG202 SwingHinge", category: "Door Closers & Hinges", files: ["kg202.pdf"], needsUpload: true, keywords: ["\\bKG202\\b(?!E)"] },

  // ---------------- Handles, pulls & stops ----------------
  { id: "kg40", label: "KG40 Ergo Grip Pull Handle (on Backplate)", category: "Handles, Pulls & Stops", files: ["kg40.pdf"], keywords: ["\\bKG40\\b"] },
  { id: "kg82_84_86", label: "KG82, KG84 & KG86 Thumb Turns", category: "Handles, Pulls & Stops", files: ["kg82_84_86.pdf"], keywords: ["\\bKG82\\b", "\\bKG84[SO]?\\b", "\\bKG86[SO]?\\b"] },
  { id: "kg175_176", label: "KG175-176 Security Escutcheons", category: "Handles, Pulls & Stops", files: ["kg175_176.pdf"], keywords: ["\\bKG17[56]\\b"] },
  { id: "kg41", label: "KG41 Ergogrip Pull Handle Bolt Fixed", category: "Handles, Pulls & Stops", files: ["kg41.pdf"], needsUpload: true, keywords: ["\\bKG41\\b"] },
  { id: "kg61", label: "KG61 Classic Grip Pull Handle Bolt Fixed", category: "Handles, Pulls & Stops", files: ["kg61.pdf"], needsUpload: true, keywords: ["\\bKG61\\b"] },
  { id: "kg71", label: "KG71 Recessed Pull Handle Bolt Fixed Pair", category: "Handles, Pulls & Stops", files: ["kg71.pdf"], needsUpload: true, keywords: ["\\bKG71\\b"] },
  { id: "kg74", label: "KG74 Recessed Turn-Pull Handle", category: "Handles, Pulls & Stops", files: ["kg74.pdf"], needsUpload: true, keywords: ["\\bKG74\\b"] },
  { id: "kg31", label: "KG31 Easy Grip Pull Handle", category: "Handles, Pulls & Stops", files: ["kg31.pdf"], needsUpload: true, keywords: ["\\bKG31\\b"] },
  { id: "kg30", label: "KG30 Easy Grip Handle", category: "Handles, Pulls & Stops", files: ["kg30.pdf"], needsUpload: true, keywords: ["\\bKG30\\b"] },
  { id: "kg60", label: "KG60 Classic Grip Handle", category: "Handles, Pulls & Stops", files: ["kg60.pdf"], needsUpload: true, keywords: ["\\bKG60\\b"] },
  { id: "kg62", label: "KG62 ClassicGrip Cabinet Pull", category: "Handles, Pulls & Stops", files: ["kg62.pdf"], needsUpload: true, keywords: ["\\bKG62\\b"] },
  { id: "kg70", label: "KG70 Recessed Pull Handle", category: "Handles, Pulls & Stops", files: ["kg70.pdf"], needsUpload: true, keywords: ["\\bKG70\\b"] },
  { id: "kg75", label: "KG75 Electro Pull Handle", category: "Handles, Pulls & Stops", files: ["kg75.pdf"], needsUpload: true, keywords: ["\\bKG75\\b"] },
  { id: "kg184", label: "KG184 Large Rubber Wall Mounted Door Stop On Back Plate", category: "Handles, Pulls & Stops", files: ["kg184.pdf"], needsUpload: true, keywords: ["\\bKG184\\b"] },
  { id: "kg186", label: "KG186 Extended Rubber Wall Mounted Door Stop on Back Plate", category: "Handles, Pulls & Stops", files: ["kg186.pdf"], needsUpload: true, keywords: ["\\bKG186\\b"] },
  { id: "kg181", label: "KG181 Floor Mounted Door Stop", category: "Handles, Pulls & Stops", files: ["kg181.pdf"], needsUpload: true, keywords: ["\\bKG181\\b"] },
  { id: "kg182", label: "KG182 Wall Mounted Door Stop", category: "Handles, Pulls & Stops", files: ["kg182.pdf"], needsUpload: true, keywords: ["\\bKG182\\b"] },
  { id: "kg187", label: "KG187 Floor Mounted Door Stop", category: "Handles, Pulls & Stops", files: ["kg187.pdf"], needsUpload: true, keywords: ["\\bKG187\\b"] },
  { id: "kg206", label: "KG206 SwingStop 3 Point Single Key Lock, Hardwood", category: "Handles, Pulls & Stops", files: ["kg206.pdf"], needsUpload: true, keywords: ["\\bKG206\\b"] },
  { id: "kg205", label: "KG205 SwingStop 2 Point Lock, Hardwood Stop", category: "Handles, Pulls & Stops", files: ["kg205.pdf"], needsUpload: true, keywords: ["\\bKG205\\b"] },
  { id: "kg207", label: "KG207 SwingStop 2 Point Lock, Aluminium", category: "Handles, Pulls & Stops", files: ["kg207.pdf"], needsUpload: true, keywords: ["\\bKG207\\b"] },

  // ---------------- Other hardware ----------------
  { id: "kg231", label: "KG231 Anti-Ligature Mirror", category: "Other Hardware", files: ["kg231.pdf"], needsUpload: true, keywords: ["\\bKG231\\b"] },
  { id: "kg362", label: "KG362 Access Panel 450 x 450mm", category: "Other Hardware", files: ["kg362.pdf"], needsUpload: true, keywords: ["\\bKG362\\b"] },
  { id: "kg190-193", label: "KG190-KG193 Fire Discs", category: "Other Hardware", files: ["kg190-193.pdf"], needsUpload: true, keywords: ["\\bKG19[0-3]\\b"] }
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
  "Locking & Access Control",
  "Door Closers & Hinges",
  "Handles, Pulls & Stops",
  "Other Hardware",
  "Additional Datasheets"
];
EOF
