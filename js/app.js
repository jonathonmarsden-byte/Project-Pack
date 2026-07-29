:root {
  --teal-dark: #082627;
  --teal-accent: #1fd9a8;
  --bg: #f4f6f6;
  --card-bg: #ffffff;
  --border: #e1e6e6;
  --text: #1b2323;
  --muted: #5c6a6a;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.topbar {
  background: var(--teal-dark);
  color: #fff;
  padding: 28px 24px;
}
.topbar h1 { margin: 0 0 6px; font-size: 1.6rem; }
.tagline { margin: 0; color: #b7ece0; max-width: 760px; }

main {
  max-width: 900px;
  margin: 24px auto;
  padding: 0 16px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 22px 24px;
}
.card h2 {
  margin-top: 0;
  font-size: 1.1rem;
  color: var(--teal-dark);
  border-bottom: 3px solid var(--teal-accent);
  display: inline-block;
  padding-bottom: 4px;
}
.optional { font-weight: normal; color: var(--muted); font-size: 0.85em; }

.hint { color: var(--muted); font-size: 0.92rem; }

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 12px 0;
}
.grid2 label.span2 { grid-column: 1 / -1; }

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--muted);
  font-weight: 600;
}

input[type="text"], select, input[type="file"] {
  font-family: inherit;
  font-size: 0.95rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  background: #fff;
}

.checkbox-row {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-weight: 600;
  color: var(--text);
}
.checkbox-row input { width: 16px; height: 16px; }

.company-details, .add-datasheet {
  margin-top: 16px;
  border-top: 1px dashed var(--border);
  padding-top: 12px;
}
.company-details summary, .add-datasheet summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--teal-dark);
}

.btn {
  border: none;
  border-radius: 7px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
}
.btn.primary { background: var(--teal-accent); color: #05201f; }
.btn.primary:hover { filter: brightness(0.95); }
.btn.secondary { background: var(--teal-dark); color: #fff; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.status { margin-top: 10px; font-size: 0.9rem; }
.status.ok { color: #0a7f4c; }
.status.error { color: #b3261e; }

.ds-group { margin-bottom: 18px; }
.ds-group h3 {
  font-size: 0.95rem;
  color: var(--teal-dark);
  margin-bottom: 8px;
}
.ds-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
}
.ds-item:hover { background: #f0f7f5; }
.ds-item input[type="checkbox"] { margin-top: 3px; width: 16px; height: 16px; }
.ds-item .ds-label { font-weight: 600; }
.ds-item .ds-note { color: var(--muted); font-size: 0.82rem; margin-top: 2px; }
.ds-item .ds-upload { margin-top: 6px; }

.badge {
  display: inline-block;
  background: #fde8c8;
  color: #7a4a00;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 8px;
  margin-left: 6px;
}
.badge.custom { background: #d8f0ff; color: #0b4a73; }

.unmatched-box {
  margin-top: 14px;
  background: #fff7ea;
  border: 1px solid #f0d9a6;
  border-radius: 8px;
  padding: 12px 16px;
}
.unmatched-box.hidden { display: none; }
.unmatched-box ul { margin: 6px 0; padding-left: 20px; }
.unmatched-box ul li a { color: #7a4a00; font-weight: 600; cursor: pointer; }

.summary-box {
  margin-top: 14px;
  background: #eafaf4;
  border: 1px solid #b7ece0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.92rem;
}
.summary-box.hidden { display: none; }
.summary-box ul { margin: 6px 0; padding-left: 20px; }

.ds-item.flash {
  animation: flash-highlight 1.6s ease;
}
@keyframes flash-highlight {
  0% { background: #ffe9b8; }
  100% { background: transparent; }
}

footer {
  text-align: center;
  color: var(--muted);
  font-size: 0.8rem;
  padding: 20px;
}
