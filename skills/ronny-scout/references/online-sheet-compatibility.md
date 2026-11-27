# Safe master-sheet integration

## Accepted structure

A–J are fixed research columns (see `output-contract.md`), K and onward are operational / follow-up fields. In a multi-tab CRM, preserve **every sheet beyond the research sheet**, even if the example in one project uses four tabs.

1. Inspect original workbook headers before any append. Require the exact expected A–J semantic mapping, with explicit user-approved header aliases only. A misaligned 8/9-column file must not be pasted into A–J.
2. Back up first. Detect existing leads by persisted original ID (prefer B comments / original ID mapping). Never modify existing business records when a lead ID already exists; report duplicates instead of making another entry.
3. Append only the A–J research cells in new rows. Preserve K onward for business staff to fill. Do not erase or recreate dropdown validations, charts, other sheets, formulas, cell comments, conditional formatting, row color or data bars. Do not insert rows into a formula-driven dashboard, and never replace a workbook with a single-sheet reconstruction.
4. Keep **all phone/email/WhatsApp** under F, **all website/social** under G. Country C is a country name only. Do not invent new V–AC link columns. Standard Excel cell supports one hyperlink target. URLs written together are not automatically independently clickable.
5. D, E, H, J wrap with consistent line breaks; avoid overlong row height. Carry forward row styling and assignee markers. Event-intent text may be highlighted, not labeled “appointment confirmed.” Preserve source evidence and original data in structured field notes/comments rather than the primary cell text.
6. After save, reopen and check exact headers, all four (or more) tabs, dashboard chart counts, validation rules, previous rows, comments and links. Only then describe Excel artifact as updated. Never claim it is already written into DingTalk / Google Sheets online.

## Cloud limits

Excel comments are **not** cloud-native comments, and XLSX single-cell URLs are **not** multi-click rich text. Pasting/importing cannot guarantee either. Native online editing requires actual authenticated access and read-back verification. Do not bypass permissions or require paid sync integration.

## DingTalk copy-ready delivery

Use this option when a user requests a copyable handoff or reports that notes do not transfer. For a **standalone** Excel deliverable, keep A–J and append K `备注与来源（可复制）` as regular cell text. Keep each lead’s evidence summary, source details, actual matched Lead ID and useful URLs together on that lead’s row. Put the full WhatsApp URL in F as text too, alongside its native Excel hyperlink. Existing Excel notes can carry the full audit trail.

Set the researched JSON field `copyable_note` to the compact evidence and raw-answer excerpt. `export_xlsx.py --copyable-notes` adds K, the sourced ID and evidence links. A destination with fixed business fields after J should receive A–J in its existing mapped columns. Paste K separately into the destination’s matching notes field or a separate lead-ID-keyed notes sheet.
