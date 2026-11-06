<div align="center">

![🔎 Ronny Scout](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**[简体中文](README.md) · English**

</div>

# 🔎 Ronny Scout

**A closer look at the lead-research workflow.**

This is the static Ronny Scout workbench. Import leads, explore the A–J customer sheet, filter records, inspect a dashboard, and export CSV. The ten built-in customers are fictional. The demo does not research companies online.

[🎮 Open the demo](https://ronnyma-67.github.io/RonnyMa/projects/ronny-scout/) · [📦 Install the research Skill](../../skills/ronny-scout/README.en.md)

## 🧭 What to explore

- Import: paste text, CSV, or Excel-copied TSV; upload UTF-8 CSV / TSV / TXT.
- Customer sheet: fixed A–J columns, search, filters, record details, and original input.
- Dashboard: category, country, priority, and business-type distributions with clickable filters.
- Checks and export: missing fields, duplicates, formula prefixes, and ten-column CSV export of the current filters.

## 📎 What this demo does

Imported data stays in page memory and disappears on refresh. There is no authentication, cloud sync, or external research call. Imported customers remain unverified. Dashboard results and outreach advice are illustrative.

For Excel, save as CSV or paste cells as TSV; the native Skill has optional tools for real XLSX deliverables. Imports require headers, allow up to 2 MB per input, and cap the total at 1,000 records. Export anything you want to keep before restoring examples.

## 🛠️ Run locally

Download this directory and keep the relative page, stylesheet, script, and image paths intact. Open `index.html`, or use a static server. No dependencies, API keys, or backend.

```bash
node checks.cjs
```

See [the full technical guide](GUIDE.en.md) for the import contract, schema, and checks, and [brand rules](BRAND_POLICY.md) for the name and identity. Source licenses and brand permissions are separate.

---

[🏠 Home](https://github.com/RonnyMa-67/RonnyMa/blob/main/README.en.md) · [📦 Skills](https://github.com/RonnyMa-67/RonnyMa/blob/main/skills/README.en.md) · [🧪 Projects](https://github.com/RonnyMa-67/RonnyMa/blob/main/projects/README.en.md)

🌈 A little at a time. See you around.
