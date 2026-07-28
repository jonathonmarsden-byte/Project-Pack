/**
 * db.js
 * ---------------------------------------------------------------------
 * Tiny IndexedDB wrapper used to persist:
 *   - custom datasheets the user has uploaded ("Add a datasheet")
 *   - the metadata describing them (label, category, keywords)
 * so the library keeps growing across visits without needing a backend.
 * ---------------------------------------------------------------------
 */

const DB_NAME = "kingsway-pack-builder";
const DB_VERSION = 1;
const STORE_FILES = "customFiles";      // key -> ArrayBuffer
const STORE_META = "customMeta";        // key -> {id,label,category,keywords,files,note}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbPutMeta(meta) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put(meta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAllMeta() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetFile(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, "readonly");
    const req = tx.objectStore(STORE_FILES).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_FILES, STORE_META], "readwrite");
    tx.objectStore(STORE_FILES).delete(id);
    tx.objectStore(STORE_META).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Save an uploaded File (PDF) as a custom library item and return its metadata. */
async function saveCustomDatasheet({ label, category, keywords, file, note }) {
  const id = "custom_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const buf = await file.arrayBuffer();
  await idbPut(STORE_FILES, id, buf);
  const meta = {
    id,
    label,
    category: category || "Additional Datasheets",
    files: [id], // for custom items, the "file" IS the idb key, not a path under assets/
    custom: true,
    keywords: keywords || [],
    note: note || "",
    fileName: file.name
  };
  await idbPutMeta(meta);
  return meta;
}

/** Replace/attach an uploaded PDF to an existing library item that needsUpload (e.g. Visilux). */
async function attachFileToItem(itemId, file) {
  const buf = await file.arrayBuffer();
  const key = "attach_" + itemId;
  await idbPut(STORE_FILES, key, buf);
  await idbPutMeta({
    id: "override_" + itemId,
    overridesItem: itemId,
    fileKey: key,
    fileName: file.name
  });
  return key;
}
