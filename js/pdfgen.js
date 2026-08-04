/**
 * pdfgen.js
 * ---------------------------------------------------------------------
 * Builds the final "Post Project Information Pack" PDF:
 *   1. Draws the dynamic pages (cover, info pack, fire certificate,
 *      guarantee) from the form data using pdf-lib.
 *   2. Appends the fixed boilerplate certificate/guarantee-terms/O&M
 *      intro pages.
 *   3. Appends every selected datasheet (built-in asset or custom
 *      upload) in the order they were selected.
 * ---------------------------------------------------------------------
 */

const { PDFDocument, StandardFonts, rgb } = PDFLib;

const TEAL_DARK = rgb(0.03, 0.15, 0.16);
const TEAL_ACCENT = rgb(0.12, 0.85, 0.66);
const TEXT_DARK = rgb(0.1, 0.12, 0.12);
const TEXT_MUTED = rgb(0.35, 0.4, 0.4);
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;

async function fetchAssetBytes(relPath) {
  const res = await fetch(`assets/datasheets/${encodeURIComponent(relPath)}`);
  if (!res.ok) throw new Error(`Could not load asset: ${relPath}`);
  return await res.arrayBuffer();
}

async function fetchBoilerplateBytes(relPath) {
  const res = await fetch(`assets/boilerplate/${encodeURIComponent(relPath)}`);
  if (!res.ok) throw new Error(`Could not load boilerplate asset: ${relPath}`);
  return await res.arrayBuffer();
}

class PageWriter {
  constructor(doc, fontRegular, fontBold) {
    this.doc = doc;
    this.fontRegular = fontRegular;
    this.fontBold = fontBold;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - 40;
    return this.page;
  }

  header(title, subtitle) {
    this.page.drawRectangle({ x: 0, y: PAGE_H - 110, width: PAGE_W, height: 110, color: TEAL_DARK });
    this.page.drawText(title, {
      x: 40, y: PAGE_H - 60, size: 20, font: this.fontBold, color: rgb(1, 1, 1)
    });
    if (subtitle) {
      this.page.drawText(subtitle, {
        x: 40, y: PAGE_H - 82, size: 11, font: this.fontRegular, color: TEAL_ACCENT
      });
    }
    this.page.drawRectangle({ x: 0, y: PAGE_H - 114, width: PAGE_W, height: 4, color: TEAL_ACCENT });
    this.y = PAGE_H - 145;
  }

  footer(companyLine) {
    this.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 26, color: TEAL_DARK });
    this.page.drawText(companyLine, {
      x: 40, y: 9, size: 8, font: this.fontRegular, color: rgb(1, 1, 1)
    });
  }

  heading(text, size = 13) {
    this.checkSpace(24);
    this.page.drawText(text, { x: 40, y: this.y, size, font: this.fontBold, color: TEAL_DARK });
    this.y -= size + 10;
  }

  para(text, opts = {}) {
    const size = opts.size || 10.5;
    const maxWidth = opts.maxWidth || PAGE_W - 80;
    const font = opts.bold ? this.fontBold : this.fontRegular;
    const color = opts.color || TEXT_DARK;
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      this.checkSpace(size + 6);
      this.page.drawText(line, { x: 40, y: this.y, size, font, color });
      this.y -= size + 6;
    }
    this.y -= opts.gapAfter ?? 4;
  }

  field(label, value, opts = {}) {
    this.checkSpace(16);
    const size = 10.5;
    this.page.drawText(label, { x: 40, y: this.y, size, font: this.fontBold, color: TEXT_DARK });
    const labelWidth = this.fontBold.widthOfTextAtSize(label + "  ", size);
    const valueLines = wrapText(value || "-", this.fontRegular, size, PAGE_W - 80 - labelWidth);
    this.page.drawText(valueLines[0] || "-", {
      x: 40 + labelWidth, y: this.y, size, font: this.fontRegular, color: TEXT_MUTED
    });
    this.y -= size + 8;
    for (let i = 1; i < valueLines.length; i++) {
      this.checkSpace(size + 6);
      this.page.drawText(valueLines[i], { x: 40 + labelWidth, y: this.y, size, font: this.fontRegular, color: TEXT_MUTED });
      this.y -= size + 6;
    }
  }

  spacer(h = 10) {
    this.y -= h;
  }

  checkSpace(needed) {
    if (this.y - needed < 40) {
      this.newPage();
    }
  }
}

function wrapText(text, font, size, maxWidth) {
  if (!text) return [""];
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    const trial = current ? current + " " + w : w;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * data: all the form field values (see app.js collectFormData())
 * selectedItems: array of library item objects (already resolved, in order)
 * customFileResolver(item) -> Promise<ArrayBuffer> for custom/attached files
 */
async function buildPack(data, selectedItems, customFileResolver) {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pw = new PageWriter(doc, fontRegular, fontBold);
  const companyLine = `${data.companyName} | ${data.companyAddress} | ${data.companyPhone} | ${data.companyEmail}`;

  // ---------------- Cover page ----------------
  pw.newPage();
  pw.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: TEAL_DARK });
  pw.page.drawRectangle({ x: 0, y: PAGE_H - 260, width: PAGE_W, height: 6, color: TEAL_ACCENT });
  pw.page.drawText(`${data.companyName}`, {
    x: 40, y: PAGE_H - 90, size: 22, font: fontBold, color: rgb(1, 1, 1)
  });
  pw.page.drawText("Post Project Information Pack", {
    x: 40, y: PAGE_H - 120, size: 15, font: fontRegular, color: TEAL_ACCENT
  });

  let cy = PAGE_H - 300;
  const coverFields = [
    ["CLIENT", data.client],
    ["PROJECT", data.project],
    ["CUSTOMER", data.customer],
    ["DOORSET SCHEDULE", data.scheduleRef]
  ];
  for (const [label, value] of coverFields) {
    pw.page.drawText(label + ":", { x: 40, y: cy, size: 11, font: fontBold, color: TEAL_ACCENT });
    pw.page.drawText(value || "-", { x: 40, y: cy - 18, size: 14, font: fontRegular, color: rgb(1, 1, 1) });
    cy -= 55;
  }
  pw.footer(companyLine);

  // ---------------- Info pack page ----------------
  pw.newPage();
  pw.header("Post Project Information Pack");
  pw.para("Thank you for selecting " + data.companyName + " products for your latest project.");
  pw.para(
    "We have pleasure in providing a series of documents which set out the technical specifications and " +
      "product information to keep on file as a reference and O&M handbook."
  );
  pw.para(
    "Should you have any queries relating to the products please get in touch using the details below. " +
      "We hope you enjoy your purchase for many years to come and look forward to working with you again soon!"
  );
  pw.spacer(6);
  pw.field("Project Name:", data.project);
  pw.field("Project Completion Date:", data.completionDate);
  pw.field("Contractor / Customer Name:", data.customer);
  pw.field("Client Detail:", data.client);
  pw.spacer(6);
  pw.field("Contact Email:", data.companyEmail);
  pw.field("Contact Telephone:", data.companyPhone);
  pw.field("Door Schedule Reference:", data.scheduleRef);
  pw.field("Door Specification:", doorSpecSummary(selectedItems, data.companyName));
  pw.field("Frame Specification:", data.frameSpecification);
  pw.field("Fire Rating:", data.fireRating);
  pw.field("Vision Panel Specification:", visionSpecSummary(selectedItems, data.companyName));
  pw.field("Ironmongery Specification:", data.ironmongerySpecification);
  pw.footer(companyLine);

  // ---------------- Fire resistance certificate ----------------
  if (data.includeFireCert) {
    pw.newPage();
    pw.header("Certificate of Fire Resistance");
    pw.para(`${data.client} - ${data.project}`, { bold: true, size: 12, gapAfter: 10 });
    pw.field("Area:", data.fireCertArea);
    pw.field("Ward(s):", data.fireCertWards);
    pw.field("Door Number(s):", data.fireCertDoorNumbers);
    pw.field("Level of fire resistance:", data.fireRating);
    pw.field("Standard of Certification:", "BS 476 Part 22");
    pw.footer(companyLine);
  }

  // ---------------- Boilerplate certification pages ----------------
  for (const b of BOILERPLATE_ASSETS) {
    if (data.excludedBoilerplate && data.excludedBoilerplate.has(b.file)) continue;
    const bytes = await fetchBoilerplateBytes(b.file);
    await appendPdfBytes(doc, bytes);
  }

  // ---------------- Guarantee page ----------------
  pw.newPage();
  pw.header("Guarantee Document");
  pw.field("Product Type:", `${data.companyName} Integrated Solutions Doorsets`);
  pw.field("Project Name:", data.project);
  pw.field("Guarantee Issued To:", data.customer);
  pw.field("Guarantee Valid From:", data.guaranteeFrom);
  pw.field("Guarantee Valid To:", data.guaranteeTo);
  pw.footer(companyLine);

  // ---------------- Datasheets ----------------
  for (const item of selectedItems) {
    if (item.custom || item.overridesItem) {
      const bytes = await customFileResolver(item);
      if (bytes) await appendPdfBytes(doc, bytes);
    } else if (item.needsUpload) {
      // no file available and nothing uploaded - skip silently, UI already warns
      continue;
    } else {
      for (const f of item.files) {
        const bytes = await fetchAssetBytes(f);
        await appendPdfBytes(doc, bytes);
      }
    }
  }

  const finalBytes = await doc.save();
  return finalBytes;
}

async function appendPdfBytes(targetDoc, bytes) {
  const src = await PDFDocument.load(bytes);
  const pages = await targetDoc.copyPages(src, src.getPageIndices());
  pages.forEach((p) => targetDoc.addPage(p));
}

function doorSpecSummary(selectedItems, companyName) {
  const names = selectedItems
    .filter((i) => i.category === "Door System")
    .map((i) => i.label.split(" ")[0]); // first token e.g. "SWITCH"
  if (!names.length) return "-";
  return `${companyName} ` + [...new Set(names)].join(" / " + companyName + " ");
}

function visionSpecSummary(selectedItems, companyName) {
  const names = selectedItems
    .filter((i) => i.category === "Vision Panel")
    .map((i) => i.label.split(" ")[0]);
  if (!names.length) return "-";
  return `${companyName} ` + [...new Set(names)].join(" / " + companyName + " ");
}
