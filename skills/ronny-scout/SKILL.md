---
name: ronny-scout
description: Research and qualify B2B sales leads from CRM exports, lead-form CSV/XLSX, pasted tables, and multilingual notes. Verify company identity and public websites/social channels, preserve purchase intent and contact provenance, write concise company profiles and practical next steps, and export an auditable, well-formatted spreadsheet. Use for batch business due diligence, lead prioritization, distributor prospecting, trade-show lead research, and safe preparation for CRM/online-sheet import.
---

# Ronny Scout

Deliver usable, evidence-aware lead research. Prefer a correct, readable row over a long narrative. Never imply that an imported file, spreadsheet comment, or link has already been written into a third-party online sheet.

## Workflow

1. **Ingest and preserve**: Read the original spreadsheet, CSV/TSV, Markdown table, or pasted multilingual lead-form data. Use `scripts/parse_leads.py` where it helps. Preserve source row ID, full raw text, contact data, original product choices, quantity, lead time, meeting preference, date, and source. Do not translate or normalize by overwriting the original. Deduplicate on reliable IDs; if absent, flag possible duplicates rather than silently merging.
2. **Research**: Search reputable public sources using available search/browser tools. Start with the exact business name, then domain, locality, and names in the original script (including Arabic when provided). Search company website, recognized company profile, Facebook, Instagram, LinkedIn, public directories and business contact channels. Verify whether each result belongs to the *same entity* and whether the lead person is linked to it. Read `references/research-standard.md`.
3. **Separate evidence**: Mark company facts as confirmed, plausible/linked, candidate only, or not verified. Do not infer employee count from a similar business or equate a social username with a verified company account. Treat social profiles as leads to investigate, not proof of ownership. Preserve source URL and the claim it supports. Use only public business contact information; do not gather unrelated private profiles.
4. **Profile and evaluate**: Write `Company / type`, `Main business`, `Business background`, and `Scale` as separate lines within one cell. Only mention scale when supported. Write a distinct cooperation fit, a calibrated P1/P2/P3/unverified priority, and one specific next step informed by the original buying signal. Avoid repetitive disclaimers, flattering filler, invented products or defaulting to P1. Follow `references/writing-and-ranking.md`.
5. **Export**: For a new report, use the **default nine visible columns** in `references/output-contract.md`; run `scripts/export_xlsx.py`. For an existing customer-management master, first inspect the exact header schema, cell notes, validation dropdowns, formulas and links. Map by names, **never paste a new header in the middle**. Only append if safe; do not overwrite sales follow-up or user comments. See `references/online-sheet-compatibility.md`.
6. **Validate**: Run `scripts/validate_export.py` on the exported workbook; visually inspect width, wrapping and row heights. Confirm each populated record retains original demand, country, links and sources. Make claims about online-sheet comments/hyperlinks only after verifying *inside that destination*.

## Non-negotiable details

- Company background is structured: `Identity`, `Main business`, `Background`, optional `Scale`; never dump machine-coded survey options (e.g. `multiple_categories_/_need_selection_advice`) into prose. Never attach unrelated names or social pages to a lead.
- Preserve **request for on-site meeting** versus **confirmed appointment**, **online meeting** versus **declined event**. No fabricated meeting time.
- Store phone, WhatsApp, email, website and social URLs separately in the research data. Generate `wa.me/<digits>` only from an eligible number; WhatsApp availability is unverified unless supported. Do not duplicate country codes or phone digits.
- One ordinary XLSX cell typically has one hyperlink target. Multiple blue URL strings in the same cell **do not** become separately clickable. Default nine-column mode displays readable URLs and has at most one primary hyperlink in the contact cell. For truly independent links use `--link-mode independent`, which creates additional columns, or a verified destination-native integration.
- Excel comments are **not** destination-native comments. Copy/paste may strip both comments and rich-link runs; never claim compatibility without readback. Keep notes in cell comments and a structured source field, not in main text.
- Do not force a fixed row height too short to display content or expand notes into 500-point rows. A concise main cell plus a detailed comment is the default.
- Do not ship personal names, phones, emails, form IDs, client spreadsheets, tokens or proprietary catalogs in a public repository. Repository examples must be synthetic. Never require a paid API or a payment method. Use available free/manual research pathways when needed.

## Included utilities

- `python scripts/parse_leads.py --input examples/sample_leads.csv --output /tmp/leads.json`
- `python scripts/export_xlsx.py --input examples/sample_research.json --output /tmp/research.xlsx --lang zh`
- `python scripts/validate_export.py --input /tmp/research.xlsx --lang zh`
- `python -m unittest discover -s tests -v`

Use `python scripts/export_xlsx.py --help` for `--link-mode independent` and English headers. Utilities format **already researched** JSON; they do not fabricate web research or silently call an API. See `references/output-contract.md` for the JSON object and required fields.