---
name: ronny-scout
description: Research and qualify multilingual B2B sales leads from Meta/CRM CSV, XLSX, pasted tables and event forms. Find real company websites, social profiles and related people; write rich, constructive company backgrounds, grounded business opportunity analysis and actionable next steps; export a precisely aligned A–J research table or safely append to a formatted multi-sheet CRM without changing downstream sales fields. Use for bulk lead intelligence, company due diligence, trade show lead qualification and spreadsheet updates.
---

# Ronny Scout

Produce **commercially useful**, source-aware B2B lead intelligence and correctly aligned spreadsheets. This skill is public and vendor-neutral; never embed private client data or a specific employer's product catalog.

## Workflow

1. **Preserve source** — Parse XLSX/CSV/Markdown/Meta form data (use `scripts/parse_leads.py`). Retain source lead ID, raw choices, exact product interests, quantities, time window, original country, meeting preference and contact channels separately. Never turn `1–5 units, <3 months` into “1–5 monthly” or translate an online-information request into a booth appointment. Deduplicate only by reliable ID.
2. **Investigate proactively** — Search exact organization and contact name, local-language variants, business domain, phone/contact signals, public company registries and owned social links. Explore credible same-name business and professional connections, company operating footprint, vertical and distribution opportunities. Go beyond the form; use first-party websites, social pages and public professional records where possible. Check `references/research-standard.md`.
3. **Synthesize positively** — Write **identity → 主营 → 背景 → 规模/渠道** as separate readable lines in one company cell. Make use of research findings and reasoned commercial interpretation without turning every line into disclaimers. Distinguish a candidate association *once where materially important*, in a note or compact qualifier, not a defensive essay. Avoid inventing corporate registration, branches, volumes, staff size, exclusivity or existing equipment deployments. See `references/writing-and-ranking.md`.
4. **Assess buying opportunity** — Preserve original intent in E; use H for business-fit, actual product/application value, scale or channel direction and partnership path. Use I for calibrated P1/P2/P3/待核实, J for one specific forward action. Avoid formulaic sales promises, generic VIP invitations, invented discounts, and dumping `multiple_categories_/_need_selection_advice` into narrative.
5. **Export the fixed A–J format** — The accepted **10-column visible research schema** is: `A 分配业务员 | B 客户信息 | C 国家 | D 公司介绍（主营·背景·规模） | E 原始采购需求 | F 联系方式 / WhatsApp | G 官网与社媒 | H 匹配与合作潜力 | I 背调评级 | J 开发切入点`. **Do not export 8/9 columns or move contacts into the company field**. Phone/email/WA stay together in F; websites and socials together in G. C contains country names only, never dial-code remarks. See `references/output-contract.md`.
6. **Existing master safe-mode** — Inspect exact template headers and preserve downstream K–U (owner feedback/dropdowns/formulas/comments), other tabs, dashboard charts, styles and colors. If template differs from A–J, stop rather than blindly paste. Append by mapped fields and stable lead IDs, not positional guessing. No extra V–AC contact-link columns unless the user explicitly requests an alternative schema. Do not overwrite existing rows or sheet structures; read `references/online-sheet-compatibility.md`.
7. **Validate and deliver** — Run `scripts/validate_export.py`, check row heights, comments, links, preserved original demand, header positions and client count. For template append run `scripts/append_to_template.py --help` and its checks. Treat Excel comments and one-link-per-cell constraints honestly; never claim destination-native online comments were created without readback.

## Style and integrity rules

- **Information density before caveats:** use useful people/company background, regional market position, procurement context and realistic channel/usage opportunities. A clear business hypothesis is useful when *grounded*; do not present it as verified corporate fact.
- Company profile is segmented and concise enough to scan; do not write placeholder strings such as “company unverified” as the entire profile. Leave scale blank when absent or discuss plausible project size in H rather than manufacturing numbers in D.
- Do not infer nationality from telephone prefix. Country C reflects user-supplied country or grounded geographic identity; ambiguous conflicts go in a comment, not appended to C.
- One F cell holds phone, WhatsApp attempt link (when appropriate), email; one G cell holds URLs for website and socials. In standard XLSX each cell can carry **one clickable hyperlink**; other URLs remain copyable. Do not falsely label all URL strings independently clickable or create Facebook Messenger URLs from lead IDs.
- Preserve business-owner colors and mark exhibition visit intention where template expects it, without claiming a confirmed appointment.
- Existing CRM may also include a supplier-specific fit column outside A–J. **Leave such columns untouched unless the user supplies mapping and explicitly asks to populate it**. Never hard-code a vendor name or product range.
- Never publish real lead IDs, contacts, email addresses, API secrets, proprietary templates or customer spreadsheets to GitHub. Public examples remain fictional and free-tool-compatible.

## Utilities

```bash
python scripts/parse_leads.py --input examples/sample_leads.csv --output /tmp/leads.json
python scripts/export_xlsx.py --input examples/sample_research.json --output /tmp/research.xlsx
python scripts/validate_export.py --input /tmp/research.xlsx
python scripts/append_to_template.py --template master.xlsx --input researched.json --output updated.xlsx
python -m unittest discover -s tests -v
```

Tools format **already researched** JSON; they do not conduct web research automatically. The accepted template and all source fields are defined in `references/output-contract.md`.