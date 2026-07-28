# Post Project Pack Builder

A small, static, browser-only app for building a Kingsway-Group-style
**Post Project Information Pack** PDF: fill in the project details, tick the
datasheets that were supplied, and download a single assembled PDF (cover
page, info pack, fire certificate, certifications, guarantee, O&M intro,
then every selected product datasheet).

It can also read an uploaded **quotation / doorset schedule PDF** and try to
auto-fill the project details and auto-tick the matching datasheets, so most
of the time you only need to check the result and click **Generate**.

Everything runs client-side (HTML/CSS/vanilla JS + [pdf-lib](https://pdf-lib.js.org/)
for writing PDFs and [pdf.js](https://mozilla.github.io/pdf.js/) for reading
them). Nothing is uploaded to a server, and there is no backend/build step -
that's what makes it easy to host for free on GitHub Pages.

## Quick start

### Option A - GitHub Pages (recommended)

1. Create a new **public** GitHub repository and push everything in this
   folder to it (see below for the exact commands).
2. In the repo, go to **Settings → Pages**, set **Source** to
   `Deploy from a branch`, branch `main`, folder `/ (root)`, and save.
3. After a minute or two your app will be live at
   `https://<your-username>.github.io/<repo-name>/`.

```bash
cd post-project-pack-builder     # this folder
git init
git add .
git commit -m "Post Project Pack Builder"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### Option B - run it locally

Because the app fetches PDF assets with `fetch()`, it needs to be served over
`http://`, not opened directly as a `file://` path. Any static file server
works, e.g.:

```bash
cd post-project-pack-builder
python3 -m http.server 8000
# then open http://localhost:8000
```

## How to use it

1. **(Optional) Upload a quote / doorset schedule PDF** and click *Scan
   quote*. The app will try to fill in the client/project/customer/schedule
   fields and automatically tick any datasheets whose product codes it
   recognises (e.g. `SWD01`, `D8400`, `KG245`...). This is a best-effort
   text scan - table-heavy PDFs sometimes extract in a scrambled order, so
   always double check the fields it filled in.
2. **Fill in / correct the project details** - client, project, customer,
   doorset schedule reference, fire rating, frame spec, guarantee dates, and
   (if relevant) the Certificate of Fire Resistance details.
3. **Choose datasheets.** They're grouped by category:
   - **Door System** - SWITCH, SWING, SOLO, SECLUSION, SHOWER, STOW,
     STABLE, and SENTRY (SENTRY automatically uses the SWITCH datasheet +
     its Operating Instructions, per spec).
   - **Vision Panel** - Duralux (405×405mm and 800×250mm), Pyrolux,
     Visilux, Panorama. Visilux and Panorama don't ship with a bundled PDF
     yet - upload one inline and it's remembered for next time.
   - **Ligature Monitoring** - KG500 Door Top Monitor (automatically
     includes the KG500 DTM Checking Instructions sheet).
   - **Access Control & Locking** - KG245 Electric Strike Housing, KG222
     Mag Lock.
   - Selecting SWITCH automatically bundles the *SWITCH Operating
     Instructions* sheet; nothing extra to tick.
4. **Add more datasheets whenever you like** via "+ Add a new datasheet to
   the library" at the bottom of Step 3. Give it a label, a category, some
   optional keywords (comma separated - product codes work well, e.g.
   `KG240, Electric Strike Release`) so future quotes auto-detect it, and
   the PDF file. It's stored in your browser (IndexedDB) so it's there next
   time you open the app on the same device/browser - it isn't shared with
   anyone else automatically.
5. Click **Generate Post Project Pack PDF**. The file downloads straight to
   your machine.

## Repo layout

```
index.html               the whole UI
css/style.css
js/library.js             built-in datasheet catalogue + auto-include rules
js/db.js                  IndexedDB helper for custom/uploaded datasheets
js/quoteparse.js          quote PDF text extraction + field/keyword matching
js/pdfgen.js              draws the generated pages and assembles the final PDF
js/app.js                 UI wiring
assets/datasheets/*.pdf   the bundled product datasheets
assets/boilerplate/*.pdf  fixed certification / guarantee-terms / O&M pages
```

## Extending the built-in library permanently

Datasheets added through the UI live only in that browser's IndexedDB. If
you'd rather ship a new datasheet to everyone who uses the deployed site:

1. Drop the PDF into `assets/datasheets/`.
2. Add an entry to `DATASHEET_LIBRARY` in `js/library.js`:
   ```js
   {
     id: "kg240",
     label: "KG240 High Secure Electric Strike Release",
     category: "Access Control & Locking",
     files: ["kg240.pdf"],
     keywords: ["\\bKG240\\b"]
   }
   ```
3. Commit and push - GitHub Pages redeploys automatically.

## Known limitations

- Field auto-fill from an uploaded quote is heuristic. PDFs built from
  tables/forms sometimes extract label and value in a different order than
  they appear visually, so a field may come back empty even though it's on
  the page - just type it in manually.
- Very large datasheet PDFs (lots of high-resolution photography) make the
  final pack bigger and slower to assemble in the browser. The bundled
  datasheets have been recompressed with `qpdf --optimize-images` to keep
  things fast; if you add your own very large PDFs, consider compressing
  them first.
- Everything happens in the browser tab, so closing the tab mid-generation
  loses progress (nothing is uploaded, so there's nothing to recover from a
  server either).
