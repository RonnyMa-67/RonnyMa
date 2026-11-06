<div align="center">

![📋 LeadScope](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**[简体中文](README.md) · English**

</div>

# 📋 LeadScope

**Keep leads in order. Give your memory a break.**

A local browser workbench for B2B leads, made with HTML, CSS, and JavaScript. Starting with a complete loop: import, ownership, follow-up, and export.

## 🧭 What works now

CSV import → field preview → confirm → batch management → search and filters → lead details → owner, follow-up, and notes → CSV export. Pasted and manually entered records also work.

Sources include Meta, B2B platforms, independent websites, manually entered trade-show cards, email, and manual input. Export supports a 19-column expanded format and a compact format. Dashboards use the current batch, separating examples from entered data.

## 🛠️ Run

Requires Node.js; no dependency installation:

```bash
npm run dev
node checks/check.cjs
```

Open `http://localhost:4173/`; the workbench is at `/workspace.html`.

## 📎 Still unplugged

Automated research, Meta sync, card OCR, account permissions, cloud persistence, team collaboration, and payments are not connected. Convert XLSX to UTF-8 CSV first. Records use the current tab's sessionStorage and may disappear when it closes; export promptly.

Examples are not customer-research facts, and information completeness is not customer value.

## 🗺️ Source map

`site/`: pages · `site/local-data.js`: import and storage · `site/data.js`: examples, filters, and export · `checks/check.cjs`: route, language, and import/export checks · `examples/示例导入.csv`: fictional sample · `site/assets/phosphor/`: icons and MIT license.

---

[🏠 Home](https://github.com/RonnyMa-67/RonnyMa/blob/main/README.en.md) · [📦 Skills](https://github.com/RonnyMa-67/RonnyMa/blob/main/skills/README.en.md) · [🧪 Projects](https://github.com/RonnyMa-67/RonnyMa/blob/main/projects/README.en.md)

🌈 A little at a time. See you around.
