/**
 * app.js - wires the UI together.
 */

let mergedLibrary = [];       // built-in (with overrides applied) + custom items
let lastQuoteText = "";       // cached extracted text from the last scanned quote

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
  const container = document.getElementById("datasheet-groups");
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
  const summary = document.getElementById("selection-summary");
  if (!checked.length) {
    summary.textContent = "No datasheets selected yet.";
    return;
  }
  const labels = checked.map((cb) => {
    const item = mergedLibrary.find((i) => i.id === cb.dataset.id);
    return item ? item.label : cb.dataset.id;
  });
  summary.textContent = `${checked.length} item(s) selected: ${labels.join(", ")}`;
}

// ---------------------------------------------------------------------
// Add a new datasheet to the library
// ---------------------------------------------------------------------

document.getElementById("add-ds-btn").addEventListener("click", async (e) => {
  e.preventDefault();
  const label = document.getElementById("new-ds-label").value.trim();
  const category = document.getElementById("new-ds-category").value;
  const keywordsRaw = document.getElementById("new-ds-keywords").value.trim();
  const fileInput = document.getElementById("new-ds-file");

  if (!label || !fileInput.files.length) {
    alert("Please give the datasheet a label and choose a PDF file.");
    return;
  }
  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean).map((k) => k.replace(/[^\w\s\-.]/g, ""))
    : [];

  await saveCustomDatasheet({ label, category, keywords, file: fileInput.files[0] });

  document.getElementById("new-ds-label").value = "";
  document.getElementById("new-ds-keywords").value = "";
  fileInput.value = "";

  await renderDatasheetGroups();
});

// ---------------------------------------------------------------------
// Quote / schedule upload & parsing
// ---------------------------------------------------------------------

const quoteFileInput = document.getElementById("quote-file");
const parseQuoteBtn = document.getElementById("parse-quote-btn");

quoteFileInput.addEventListener("change", () => {
  parseQuoteBtn.disabled = !quoteFileInput.files.length;
});

parseQuoteBtn.addEventListener("click", async () => {
  const statusEl = document.getElementById("quote-status");
  const summaryBox = document.getElementById("quote-summary");
  const missingBox = document.getElementById("quote-missing");
  const missingList = document.getElementById("quote-missing-list");
  const unmatchedBox = document.getElementById("quote-unmatched");
  const unmatchedList = document.getElementById("quote-unmatched-list");

  summaryBox.classList.add("hidden");
  missingBox.classList.add("hidden");
  unmatchedBox.classList.add("hidden");
  missingList.innerHTML = "";
  unmatchedList.innerHTML = "";
  statusEl.className = "status";
  statusEl.textContent = "Reading quote...";

  try {
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
        const el = document.getElementById(elId);
        if (el && !el.value.trim()) {
          el.value = fields[field];
          filledCount++;
        }
      }
    }

    // ---- Step B: work out every datasheet the quote references ----
    mergedLibrary = await getMergedLibrary();
    const { matchedIds } = matchLibraryItems(text, mergedLibrary);

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
    summaryBox.classList.remove("hidden");
    summaryBox.innerHTML =
      `<strong>Scanned the quote and applied everything it could match:</strong>` +
      `<ul>` +
      `<li>${filledCount} project detail field(s) filled in</li>` +
      `<li>${tickedItems.length} datasheet(s) auto-ticked` +
      (tickedItems.length ? `: ${tickedItems.map((i) => i.label).join(", ")}` : "") +
      `</li>` +
      `</ul>`;

    if (missingFileItems.length) {
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

    if (unknownCodes.length) {
      unmatchedBox.classList.remove("hidden");
      for (const u of unknownCodes) {
        const li = document.createElement("li");
        li.textContent = `${u.code} (seen ${u.count}x)`;
        unmatchedList.appendChild(li);
      }
    }

    const gapCount = missingFileItems.length + unknownCodes.length;
    statusEl.className = "status ok";
    statusEl.textContent = gapCount
      ? `Done. ${gapCount} item(s) still need attention - see below.`
      : `Done. Everything the quote referenced has a datasheet ready to go.`;
  } catch (err) {
    console.error(err);
    statusEl.className = "status error";
    statusEl.textContent = "Could not read that PDF: " + err.message;
  }
});

/** Scrolls the datasheet list to a given item and briefly highlights its row. */
function jumpToDatasheetItem(itemId) {
  const cb = document.querySelector(`.ds-checkbox[data-id="${itemId}"]`);
  if (!cb) return;
  const row = cb.closest(".ds-item");
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.classList.remove("flash");
  // restart the animation even if it was already flashed once
  void row.offsetWidth;
  row.classList.add("flash");
}

// ---------------------------------------------------------------------
// Fire certificate section toggle
// ---------------------------------------------------------------------

const includeFireCertEl = document.getElementById("f-includeFireCert");
const fireCertFieldsEl = document.getElementById("firecert-fields");
function syncFireCertVisibility() {
  fireCertFieldsEl.style.display = includeFireCertEl.checked ? "grid" : "none";
}
includeFireCertEl.addEventListener("change", syncFireCertVisibility);

// ---------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------

function collectFormData() {
  const v = (id) => document.getElementById(id).value.trim();
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
    includeFireCert: includeFireCertEl.checked,
    fireCertArea: v("f-fireCertArea"),
    fireCertWards: v("f-fireCertWards"),
    fireCertDoorNumbers: v("f-fireCertDoorNumbers"),
    companyName: v("f-companyName"),
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

document.getElementById("generate-btn").addEventListener("click", async () => {
  const statusEl = document.getElementById("generate-status");
  statusEl.className = "status";
  statusEl.textContent = "Building PDF...";

  try {
    const selectedIds = [...document.querySelectorAll(".ds-checkbox:checked")].map((cb) => cb.dataset.id);
    const selectedItems = selectedIds
      .map((id) => mergedLibrary.find((i) => i.id === id))
      .filter(Boolean);

    if (!selectedItems.length) {
      const proceed = confirm("No datasheets are selected - the pack will only contain the cover, info and certificate pages. Continue?");
      if (!proceed) {
        statusEl.textContent = "";
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

    statusEl.className = "status ok";
    statusEl.textContent = "Done! Your PDF has been downloaded.";
  } catch (err) {
    console.error(err);
    statusEl.className = "status error";
    statusEl.textContent = "Something went wrong: " + err.message;
  }
});

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------

syncFireCertVisibility();
renderDatasheetGroups();
