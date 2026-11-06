<div align="center">

![🗂️ Ronny Intelligence](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**[简体中文](README.md) · English**

</div>

# 🗂️ Ronny Intelligence

**Lots of lead sources. One place to start.**

A React / TypeScript frontend prototype. I shaped the trade-operations requirements, lead fields, and assessment rules, with AI-assisted implementation. Company-specific prompts, form identifiers, and sample contacts have been replaced in this public snapshot.

## 🧭 What's inside

- CSV / Excel, text, and image input while retaining original records.
- Meta form mapping, batch alignment, and missing-row checks.
- Gemini and Google Search adapters, separating evidence, self-reports, inference, and unknowns.
- Lead assessment, CRM, filters, record details, dashboards, and Excel export.
- Local browser storage, optional Supabase adapter, and PWA configuration.

## 🛠️ Run locally

Requires Node.js and npm. From this directory:

```bash
npm install
npm run dev
# Checks
npm run lint
npm run build
```

The default port is 3000. Without a key, you can view the UI but cannot perform live AI research. For a trusted local trial, copy `.env.example` to `.env.local`, set your own `GEMINI_API_KEY`, and restart. Provider charges may apply.

## 📎 Where it stands

The current Vite setup embeds the key in the browser build. Do not publish a key-bearing build. Production needs a server-side proxy and access control. Local storage is not team cloud collaboration. No live paid API calls were tested for this public snapshot; research results require human review.

## 🗺️ Source map

`services/metaLeadParser.ts`: form mapping · `leadImport.ts`: batch alignment · `leadPrompt.ts`: research requirements · `leadRules.ts`: assessment · `components/CRMView.tsx`: follow-up · `StatsDashboard.tsx`: dashboard · `services/excelExport.ts`: export.

---

[🏠 Home](https://github.com/RonnyMa-67/RonnyMa/blob/main/README.en.md) · [📦 Skills](https://github.com/RonnyMa-67/RonnyMa/blob/main/skills/README.en.md) · [🧪 Projects](https://github.com/RonnyMa-67/RonnyMa/blob/main/projects/README.en.md)

🌈 A little at a time. See you around.
