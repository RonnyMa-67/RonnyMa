# Standard report and JSON input

Default workbook: one sheet, nine columns in exact order:
`客户信息 | 国家 | 企业身份与主营 | 原始采购需求 | 联系方式 | 匹配与合作潜力 | 背调评级 | 开发切入点 | 与供应商业务匹配性`.

A record contains: `lead_id`, `customer_name`, `job_title`, `country`, `company_name`, `business_type`, `company_profile`, `business_background`, optional `company_scale`, `original_purchase_intent`, `phone`, `whatsapp`, `email`, `website`, `social_links` (dictionary), `cooperation_potential`, `priority_level`, `development_suggestion`, `supplier_fit`, `onsite_meeting_interest`, `sources` (claim URL objects), and `field_notes` (field-name note dictionary).

Preserve original lead ID and sources as cell comments, without inserting extra columns. Flag unconfirmed relationship to a public company. Company descriptions are divided into 主营、背景、optional 规模. The source data remains accessible separately from the formatted export.

One cell may have a single primary hyperlink only. Independent-link mode adds separate named contact columns, one hyperlink per channel. Do not claim those columns fit a fixed nine-column destination. Export does not create cloud-native notes.

Keep report headers stable between runs, filterable, wrapped, with readable row heights, restrained styling and no fake ratings or meeting confirmations. Source links must be real exact URLs; never build URLs from inferred social usernames.
