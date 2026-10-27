# Ronny Scout

**Turn raw business leads into clearer commercial decisions.**

Ronny Scout is a practical open-source workflow for multilingual B2B lead intelligence: form ingestion, company research, buying-signal analysis, structured evidence notes, qualification and export-ready spreadsheets.

![Ronny Scout — interactive B2B lead intelligence preview](./showcase.svg)

### [Explore the interactive demo](https://ronnyma-67.github.io/RonnyMa/projects/ronny-scout/) · [Install native Skill · No API](../../skills/ronny-scout/references/no-api-quickstart.md) · [Source & Skill](../../skills/ronny-scout/) · [Creator profile](../../README.md)

**Try it in your own AI:** import the [Ronny Scout Skill folder](../../skills/ronny-scout/) (or its packaged `skill.zip`) into a Skills-compatible assistant and attach your leads. No external developer API key, server or paid integration is needed. Native web browsing is needed to check up-to-date company sites; native spreadsheet tools or optional free Python utilities create XLSX exports.

> **Demo notice:** The 10 built-in B2B customers, contact identifiers, business profiles and buying signals are fictional. No real names, phone numbers, email addresses, merchant details, account information or API keys are included. Imported data is processed only in page memory and cleared on refresh. This demo does not perform company research, authentication, cloud sync or external API calls. Imported records always remain **待核实**.

## What it demonstrates

| Workflow | Live demo experience |
| --- | --- |
| 导入线索 | Paste plain text, CSV or Excel-copied TSV; import UTF-8 `.csv`, `.tsv`, `.txt`; download a template or fill fictional examples |
| 客户明细 | Fixed A–J columns, search, country/category/priority filters, rating counts, sticky identity columns and a scrollable table |
| 客户详情 | Right-side drawer with all ten fields, original input and an explicit source / verification notice |
| 商情看板 | Category, country, priority and business-type distributions across all records; click a category or market to filter customer details |
| 开发建议 | Static guidance for P1/P2/P3 and unverified leads, clearly separate from actual research |
| 质量检测 | Ten-column structure, missing country/intent, duplicate customer-country pairs, pending verification and spreadsheet formula prefixes |
| Export | Filtered records as UTF-8 BOM CSV with exactly ten columns; formula prefixes are escaped for spreadsheet safety |
| Research standards | See the [source-aware skill](../../skills/ronny-scout/SKILL.md), including formatting checks and evidence integrity |

## Why the distinction matters

A source-backed business lead profile is different from a generic marketing summary. The full workflow preserves original customer inputs, distinguishes reliable evidence from candidate associations, produces usable business context and checks template alignment before delivery.

The **open-source implementation** and **interactive showcase** are visible for learning and reuse according to their respective licenses. The *Ronny Scout* product name and visual identity must not be used to imply an unauthorized official edition or endorsement; see [brand guidelines](./BRAND_POLICY.md). Public MIT-licensed versions retain their original license grants, including commercial use.

## Run the demo

Download this folder and open [index.html](./index.html) in a modern browser, or serve it with any local static server. Keep `style.css`, `data.js`, `app.js` and `logo.svg` beside it. No runtime dependencies, CDN, API keys or backend are needed. Offline use works from a local copy; GitHub links require a connection.

The existing [Pages workflow](../../.github/workflows/ronny-scout-pages.yml) deploys changes to this folder on `main`. [Open the live demo](https://ronnyma-67.github.io/RonnyMa/projects/ronny-scout/).

### Import and export contract

CSV / TSV requires a header row containing `公司` or `客户信息` (English `company` is also accepted). The downloadable template uses `公司,国家,产品,采购需求`. The exact exported A–J headers can also be imported. Plain text without delimiters creates one unverified lead per non-empty line. Quoted commas, escaped quotes and multiline fields are supported; malformed rows are rejected as a batch without partial writes. Limits: 2 MB per file/input, 1,000 total records. Imports append to existing data; restoring examples asks before clearing imported records. Export first if you need to retain them.

| Column | Field |
| --- | --- |
| A | 分配业务员 |
| B | 客户信息 |
| C | 国家 |
| D | 公司介绍（主营·背景·规模） |
| E | 原始采购需求 |
| F | 联系方式 / WhatsApp |
| G | 官网与社媒 |
| H | 匹配与合作潜力 |
| I | 背调评级 |
| J | 开发切入点 |

CSV export follows the customer filters, even when another tab is open; its confirmation states the number exported. The dashboard and quality check always cover all records. Percentages are rounded and may not sum to exactly 100%.

Native `.xlsx` import/export is deliberately omitted to keep the static demo dependency-free. Save Excel files as UTF-8 CSV or paste cells as TSV. The existing native Skill retains its spreadsheet tools for actual XLSX workflows. A copied or imported priority is retained in the raw-input drawer but never accepted as a verified rating.

### Checks

Run `node checks.cjs` for import parsing, CSV escaping, A–J schema and quality-check assertions. Browser validation covers tabs, filters, drawer keyboard behavior, file import, export, responsive layout and offline operation.

## Support the project

Open-source work is sustained by people who find it useful. [GitHub Sponsors](https://github.com/sponsors/RonnyMa-67) application has been submitted and is pending GitHub review and the repository has a sponsor declaration in `.github/FUNDING.yml`; **donations are not available until the creator's Sponsor profile is approved and payout details are completed**.

Copyright © 2026 Ronny Scout contributors. No real customer information or proprietary account details are distributed in the showcase.

