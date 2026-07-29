/**
 * app.js - wires the UI together.
 *
 * Defensive by design: every feature block below is wrapped so that a
 * problem in one part (a missing element, a bad quote PDF, etc.) can't
 * take down the rest of the app - e.g. a broken "Add datasheet" button
 * should never be able to leave the "Scan quote" button stuck disabled.
 */

let mergedLibrary = [];       // built-in (with overrides applied) + custom items
let lastQuoteText = "";       // cached extracted text from the last scanned quote

function $(id) {
  return document.getElementById(id);
}

/** Attach a listener only if the element actually exists; warn (not throw) otherwise. */
function on(id, event, handler) {
  const el = $(id);
  if (!el) {
    console.warn(`[app.js] Expected an element with id="${id}" but it wasn't found - skipping that control.`);
    return;
  }
  el.addEventListener(event, handler);
}

// ---------------------------------------------------------------------
// Library rendering
// ---------------------------------------------------------------------

async function getMergedLibrary() {
  const metaList = await idbGetAllMeta();
  const overrides = {};
  const customItems = [];
  for (const m of metaList) {
    if (m.overridesItem) overrides[m.overridesItem] = m.fileKey;
    else if (m.custom) customItems.push(m);
  }
  const builtIn = DATASHEET_LIBRARY.map((item) => {
    if (item.needsUpload && overrides[item.id]) {
      return { ...item, needsUpload: false, overridesItem: item.id, fileKey: overrides[item.id] };
    }
    return item;
  });
  return [...builtIn, ...customItems];
}

function groupByCategory(items) {
  const groups = {};
  for (const item of items) {
    const cat = item.category || "Additional Datasheets";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

async function renderDatasheetGroups(preserveChecked = true) {
  const checkedBefore = new Set(
    [...document.querySelectorAll(".ds-checkbox:checked")].map((el) => el.dataset.id)
  );

  mergedLibrary = await getMergedLibrary();
  const groups = groupByCategory(mergedLibrary);
  const container = $("datasheet-groups");
  if (!container) {
    console.warn('[app.js] #datasheet-groups not found - cannot render the datasheet picker.');
    return;
  }
  container.innerHTML = "";

  const orderedCats = [
    ...CATEGORY_ORDER.filter((c) => groups[c]),
    ...Object.keys(groups).filter((c) => !CATEGORY_ORDER.includes(c))
  ];

  for (const cat of orderedCats) {
    const groupEl = document.createElement("div");
    groupEl.className = "ds-group";
    const h3 = document.createElement("h3");
    h3.textContent = cat;
    groupEl.appendChild(h3);

    for (const item of groups[cat]) {
      groupEl.appendChild(renderItemRow(item, preserveChecked && checkedBefore.has(item.id)));
    }
    container.appendChild(groupEl);
  }

  updateSelectionSummary();
}

function renderItemRow(item, checked) {
  const row = document.createElement("div");
  row.className = "ds-item";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "ds-checkbox";
  cb.dataset.id = item.id;
  cb.id = "ds-" + item.id;
  cb.disabled = !!item.needsUpload;
  cb.checked = !!checked && !item.needsUpload;
  cb.addEventListener("change", updateSelectionSummary);

  const labelWrap = document.createElement("div");

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", cb.id);
  labelEl.className = "ds-label";
  labelEl.textContent = item.label;
  if (item.needsUpload) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "needs file";
    labelEl.appendChild(badge);
  }
  if (item.custom) {
    const badge = document.createElement("span");
    badge.className = "badge custom";
    badge.textContent = "custom";
    labelEl.appendChild(badge);
  }
  labelWrap.appendChild(labelEl);

  if (item.note) {
    const note = document.createElement("div");
    note.className = "ds-note";
    note.textContent = item.note;
    labelWrap.appendChild(note);
  }

  if (item.needsUpload) {
    const uploadWrap = document.createElement("div");
    uploadWrap.className = "ds-upload";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/pdf";
    fileInput.addEventListener("change", async () => {
      if (!fileInput.files.length) return;
      await attachFileToItem(item.id, fileInput.files[0]);
      await renderDatasheetGroups();
      // auto-check the item now that it has a file
      const newCb = document.querySelector(`.ds-checkbox[data-id="${item.id}"]`);
      if (newCb) { newCb.checked = true; updateSelectionSummary(); }
    });
    uploadWrap.appendChild(fileInput);
    labelWrap.appendChild(uploadWrap);
  }

  if (item.custom) {
    const del = document.createElement("button");
    del.textContent = "Remove";
    del.className = "btn secondary";
    del.style.marginTop = "6px";
    del.style.padding = "4px 10px";
    del.style.fontSize = "0.75rem";
    del.addEventListener("click", async (e) => {
      e.preventDefault();
      await idbDelete(item.id);
      await renderDatasheetGroups();
    });
    labelWrap.appendChild(del);
  }

  row.appendChild(cb);
  row.appendChild(labelWrap);
  return row;
}

function updateSelectionSummary() {
  const checked = [...document.querySelectorAll(".ds-checkbox:checked")];
  const summary = $("selection-summary");
  if (!summary) return;
  if (!checked.length) {
    summary.innerHTML = "No datasheets selected - the pack will only contain the cover, info and certificate pages.";
    return;
  }
  const labels = checked.map((cb) => {
    const item = mergedLibrary.find((i) => i.id === cb.dataset.id);
    return item ? item.label : cb.dataset.id;
  });
  summary.innerHTML =
    `<strong>${checked.length} datasheet(s) will be included in the PDF - and nothing else:</strong>` +
    `<ul>${labels.map((l) => `<li>${l}</li>`).join("")}</ul>`;
}

/** Scrolls the datasheet list to a given item and briefly highlights its row. */
function jumpToDatasheetItem(itemId) {
  const cb = document.querySelector(`.ds-checkbox[data-id="${itemId}"]`);
  if (!cb) return;
  const row = cb.closest(".ds-item");
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.classList.remove("flash");
  void row.offsetWidth; // restart the animation even if it already flashed once
  row.classList.add("flash");
}

// ---------------------------------------------------------------------
// Step 3 controls: clear-all + add-a-datasheet
// ---------------------------------------------------------------------

on("clear-selection-btn", "click", (e) => {
  e.preventDefault();
  document.querySelectorAll(".ds-checkbox:checked").forEach((cb) => (cb.checked = false));
  updateSelectionSummary();
});

on("add-ds-btn", "click", async (e) => {
  e.preventDefault();
  const label = $("new-ds-label").value.trim();
  const category = $("new-ds-category").value;
  const keywordsRaw = $("new-ds-keywords").value.trim();
  const fileInput = $("new-ds-file");

  if (!label || !fileInput.files.length) {
    alert("Please give the datasheet a label and choose a PDF file.");
    return;
  }
  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean).map((k) => k.replace(/[^\w\s\-.]/g, ""))
    : [];

  await saveCustomDatasheet({ label, category, keywords, file: fileInput.files[0] });

  $("new-ds-label").value = "";
  $("new-ds-keywords").value = "";
  fileInput.value = "";

  await renderDatasheetGroups();
});

// ---------------------------------------------------------------------
// Step 1: quote / schedule upload & parsing
// ---------------------------------------------------------------------

const quoteFileInput = $("quote-file");
const parseQuoteBtn = $("parse-quote-btn");

if (quoteFileInput && parseQuoteBtn) {
  // Belt-and-braces: re-check the disabled state any time the file input
  // changes AND right now, in case a browser restored a previously chosen
  // file on page reload (some browsers do this) while the button stayed
  // disabled from its default HTML attribute.
  const syncParseButtonState = () => {
    parseQuoteBtn.disabled = !quoteFileInput.files || quoteFileInput.files.length === 0;
  };
  quoteFileInput.addEventListener("change", syncParseButtonState);
  syncParseButtonState();
} else {
  console.warn("[app.js] Quote upload controls not found - check that index.html matches this app.js.");
}

on("parse-quote-btn", "click", async () => {
  const statusEl = $("quote-status");
  const summaryBox = $("quote-summary");
  const missingBox = $("quote-missing");
  const missingList = $("quote-missing-list");
  const unmatchedBox = $("quote-unmatched");
  const unmatchedList = $("quote-unmatched-list");

  if (summaryBox) summaryBox.classList.add("hidden");
  if (missingBox) missingBox.classList.add("hidden");
  if (unmatchedBox) unmatchedBox.classList.add("hidden");
  if (missingList) missingList.innerHTML = "";
  if (unmatchedList) unmatchedList.innerHTML = "";
  if (statusEl) { statusEl.className = "status"; statusEl.textContent = "Reading quote..."; }

  try {
    if (!quoteFileInput.files.length) {
      throw new Error("Choose a PDF file first.");
    }
    const file = quoteFileInput.files[0];
    const buf = await file.arrayBuffer();
    const text = await extractPdfText(buf);
    lastQuoteText = text;

    // ---- Step A: fill in every project field we can find (never stops early) ----
    const fields = guessFields(text);
    const fieldMap = {
      client: "f-client",
      project: "f-project",
      customer: "f-customer",
      scheduleRef: "f-scheduleRef",
      fireRating: "f-fireRating",
      frameSpecification: "f-frameSpecification",
      completionDate: "f-completionDate"
    };
    let filledCount = 0;
    for (const [field, elId] of Object.entries(fieldMap)) {
      if (fields[field]) {
        const el = $(elId);
        if (el && !el.value.trim()) {
          el.value = fields[field];
          filledCount++;
        }
      }
    }

    // ---- Step B: work out every datasheet the quote references ----
    mergedLibrary = await getMergedLibrary();
    const { matchedIds } = matchLibraryItems(text, mergedLibrary);

    // Start from a clean slate every time a quote is scanned, so the final
    // pack only ever contains what THIS quote actually references - any
    // previously ticked boxes (from an earlier quote, or manual testing)
    // are cleared first rather than just adding on top of them.
    document.querySelectorAll(".ds-checkbox:checked").forEach((cb) => (cb.checked = false));

    const tickedItems = [];       // library items we found AND could tick
    const missingFileItems = [];  // library items we recognised but have no PDF for

    for (const id of matchedIds) {
      const item = mergedLibrary.find((i) => i.id === id);
      if (!item) continue;
      const cb = document.querySelector(`.ds-checkbox[data-id="${id}"]`);
      if (item.needsUpload || !cb || cb.disabled) {
        missingFileItems.push(item);
      } else {
        cb.checked = true;
        tickedItems.push(item);
      }
    }
    updateSelectionSummary();

    // ---- Step C: anything left in the text that matched no library item at all ----
    const unknownCodes = findUnrecognisedCodes(text, mergedLibrary);

    // ---- Step D: always show a full "here's everything" summary, then the gaps ----
    if (summaryBox) {
      summaryBox.classList.remove("hidden");
      summaryBox.innerHTML =
        `<strong>Scanned the quote. Selection below was reset to match only this quote:</strong>` +
        `<ul>` +
        `<li>${filledCount} project detail field(s) filled in</li>` +
        `<li>${tickedItems.length} datasheet(s) ticked` +
        (tickedItems.length ? `: ${tickedItems.map((i) => i.label).join(", ")}` : " (none matched)") +
        `</li>` +
        `</ul>`;
    }

    if (missingFileItems.length && missingBox && missingList) {
      missingBox.classList.remove("hidden");
      for (const item of missingFileItems) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.textContent = item.label;
        a.href = "#ds-" + item.id;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          jumpToDatasheetItem(item.id);
        });
        li.appendChild(a);
        missingList.appendChild(li);
      }
    }

    if (unknownCodes.length && unmatchedBox && unmatchedList) {
      unmatchedBox.classList.remove("hidden");
      for (const u of unknownCodes) {
        const li = document.createElement("li");
        li.textContent = `${u.code} (seen ${u.count}x)`;
        unmatchedList.appendChild(li);
      }
    }

    const gapCount = missingFileItems.length + unknownCodes.length;
    if (statusEl) {
      statusEl.className = "status ok";
      statusEl.textContent = gapCount
        ? `Done. ${gapCount} item(s) still need attention - see below.`
        : `Done. Everything the quote referenced has a datasheet ready to go.`;
    }
  } catch (err) {
    console.error(err);
    if (statusEl) {
      statusEl.className = "status error";
      statusEl.textContent = "Could not read that PDF: " + err.message;
    }
  }
});

// ---------------------------------------------------------------------
// Step 2: fire certificate section toggle
// ---------------------------------------------------------------------

const includeFireCertEl = $("f-includeFireCert");
const fireCertFieldsEl = $("firecert-fields");
function syncFireCertVisibility() {
  if (fireCertFieldsEl) fireCertFieldsEl.style.display = includeFireCertEl && includeFireCertEl.checked ? "grid" : "none";
}
if (includeFireCertEl) includeFireCertEl.addEventListener("change", syncFireCertVisibility);

// ---------------------------------------------------------------------
// Step 4: generate
// ---------------------------------------------------------------------

function collectFormData() {
  const v = (id) => ($(id) ? $(id).value.trim() : "");
  return {
    client: v("f-client"),
    project: v("f-project"),
    customer: v("f-customer"),
    scheduleRef: v("f-scheduleRef"),
    completionDate: v("f-completionDate"),
    frameSpecification: v("f-frameSpecification"),
    fireRating: v("f-fireRating"),
    ironmongerySpecification: v("f-ironmongerySpecification"),
    guaranteeFrom: v("f-guaranteeFrom"),
    guaranteeTo: v("f-guaranteeTo"),
    includeFireCert: !!(includeFireCertEl && includeFireCertEl.checked),
    fireCertArea: v("f-fireCertArea"),
    fireCertWards: v("f-fireCertWards"),
    fireCertDoorNumbers: v("f-fireCertDoorNumbers"),
    companyName: v("f-companyName") || "Kingsway Group",
    companyAddress: v("f-companyAddress"),
    companyPhone: v("f-companyPhone"),
    companyEmail: v("f-companyEmail")
  };
}

async function customFileResolver(item) {
  if (item.custom) return await idbGetFile(item.id);
  if (item.overridesItem) return await idbGetFile(item.fileKey);
  return null;
}

on("generate-btn", "click", async () => {
  const statusEl = $("generate-status");
  if (statusEl) { statusEl.className = "status"; statusEl.textContent = "Building PDF..."; }

  try {
    const selectedIds = [...document.querySelectorAll(".ds-checkbox:checked")].map((cb) => cb.dataset.id);
    const selectedItems = selectedIds
      .map((id) => mergedLibrary.find((i) => i.id === id))
      .filter(Boolean);

    if (!selectedItems.length) {
      const proceed = confirm("No datasheets are selected - the pack will only contain the cover, info and certificate pages. Continue?");
      if (!proceed) {
        if (statusEl) statusEl.textContent = "";
        return;
      }
    }

    const data = collectFormData();
    const bytes = await buildPack(data, selectedItems, customFileResolver);

    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileSafeProject = (data.project || "Post_Project_Pack").replace(/[^\w\-]+/g, "_");
    a.href = url;
    a.download = `${fileSafeProject}_Post_Project_Pack.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (statusEl) { statusEl.className = "status ok"; statusEl.textContent = "Done! Your PDF has been downloaded."; }
  } catch (err) {
    console.error(err);
    if (statusEl) { statusEl.className = "status error"; statusEl.textContent = "Something went wrong: " + err.message; }
  }
});

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------

syncFireCertVisibility();
renderDatasheetGroups().catch((err) => {
  console.error("Failed to render the datasheet picker:", err);
  const container = $("datasheet-groups");
  if (container) {
    container.innerHTML = `<p style="color:#b3261e">Could not load the datasheet library: ${err.message}. Check the browser console for details.</p>`;
  }
});
