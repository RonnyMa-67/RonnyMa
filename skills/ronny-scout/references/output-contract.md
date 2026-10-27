# Output contract — accepted 10-column research zone

## Default A–J schema

| Col | Chinese | Purpose |
|---|---|---|
| A | 分配业务员 | Owner name and a compact assignment color marker; blank unless assigned |
| B | 客户信息 | Person and company, concise readable text |
| C | 国家 | **Country name only**; never add phone prefix, mixed regions, or explanatory prose |
| D | 公司介绍（主营·背景·规模） | Structured, interesting business profile |
| E | 原始采购需求 | Original interested product(s), quantity, timing and contact/meeting preference; no invented interpretation |
| F | 联系方式 / WhatsApp | Phone, WA attempt URL, email **together in one cell** |
| G | 官网与社媒 | Verified site/social and relevant professional candidate links **together in one cell** |
| H | 匹配与合作潜力 | Business context, use-case or channel fit, and viable collaboration path |
| I | 背调评级 | P1/P2/P3/待核实 from grounded evidence |
| J | 开发切入点 | Concise concrete next action, not generic optimistic selling |

The standard export has **exactly ten columns**, not 8, 9, 16 or more. Do not append separate social-link columns. The supplier-specific product fit in a downstream master field (e.g. U) is **not** a default A–J column. The example preserves generic data only.

## Company description format

```text
Fictional Harbor Supply｜设备渠道商
主营：经营餐饮设备与饮品配套用品，服务中小型餐饮客户。
背景：通过当地分销与项目采购触达餐饮及零售场景。
渠道：可从已有餐饮客户群切入，评估设备组合销售机会。
```

The example is fictional. `主营/背景` can include relevant business inference when supported by research. Do not claim outlets, staff, purchase volumes or registered status without evidence. Store uncertain-name associations in notes with a URL, rather than repeated defensive phrases in every main cell.

## Enriched JSON input

`lead_id, assignee, customer_name, job_title, country, company_name, business_type, company_profile, business_background, company_scale, company_channels, original_purchase_intent, original_quantity, purchase_time_window, meeting_preference, phone, whatsapp, email, website, social_links, cooperation_potential, priority_level, development_suggestion, supplier_fit, onsite_meeting_interest, sources, field_notes, raw`.

Any optional field may be absent. Supplier fit is usable only when explicitly mapped to a downstream column of an existing template.

`social_links` is a dictionary keyed `Facebook`, `Instagram`, `LinkedIn`, `Messenger`, etc. `sources` is an array of URL / claim pairs. `field_notes` is a field-name dictionary. All URLs should be exact discovered links rather than fabricated platform URLs.

## Workbook styling

- Single standalone research worksheet, navy header, sensible blue hyperlink cues, assignment-colored label in A, event-intention emphasis when appropriate.
- Freeze identifying columns, wrap text, allow readable 13-inch laptop review, modest row heights, filter; no notes inserted into the main cell as a giant blob.
- F contact links: phone, WA and email in the same cell; at most one cell-level hyperlink (prefer explicit WA or email where sensible). G contains website/social URLs, at most one cell-level hyperlink. For fully independent clicks, online rich text/native UI is required; *not* extra columns by default.
- Separate evidence and original raw data in field-specific Excel comments. **Excel comments are not cloud-sheet comments**.
- Existing master: preserve source sheets, visual styles, data validation, comments, formulas, charts, and sales feedback; never touch K–U when appending A–J.