# Ronny Scout — Zero-API Quick Start / 无 API 原生版

**Installation uses an AI assistant's native Skill support. You do not need to buy API credits, connect a cloud database, deploy a server, or enter an API key.**

## A. ChatGPT or any Skill-compatible AI / 支持 Skills 的 AI

1. Download the folder `skills/ronny-scout/` from this repository and preserve its internal structure. You can also download the entire repository as ZIP and extract `skills/ronny-scout/`.
2. In the AI product's Skills upload/import interface, install the `ronny-scout` folder or a ZIP containing just that folder, depending on what the product accepts. `SKILL.md` must remain at the root of the Skill folder.
3. Attach a CSV/XLSX/Markdown lead export or paste the original lead-form rows into the chat.
4. Ask: **“Use Ronny Scout. Research these 5 leads and give me an A–J research workbook. Keep all original buying signals. Search for official websites and related social channels if available.”**
5. The AI uses **its own native research/browsing and file tools** if available. No additional developer API is needed. Native platform subscriptions/usage limits may still apply.

**No manual configuration required:** leave product catalog, assignee names, region and ranking preferences at runtime. If a supplier-specific matching column is needed, explicitly provide its mapping. Do not edit the public Skill to hard-code a private employer or actual client details.

## B. AI without a Skill installer / 没有 Skills 安装入口的 AI

1. Open `SKILL.md`, paste its full contents into the AI chat/system instructions, or attach it as a reference file.
2. Supply any needed `references/*.md` files for the relevant workflow.
3. Attach source leads and issue a task. This prompt-based mode is portable, but an AI with no web/browser access **cannot independently look up current company sites, ownership or social accounts**.

### Copy-paste task prompt

```text
Use the attached Ronny Scout SKILL.md as the task standard.

Research and qualify the attached multilingual B2B leads. Preserve the
exact original product interest, quantity, schedule, country and meeting
preference. Search public company websites, professional profiles, company
registries and owned social accounts if your environment supports web
research. Write useful, confident commercial analysis with reasonable
opportunity interpretation, and keep speculative associations distinct
from verified entities.

Output one sheet in the exact A-J column order:
A 分配业务员
B 客户信息
C 国家
D 公司介绍（主营·背景·规模）
E 原始采购需求
F 联系方式 / WhatsApp
G 官网与社媒
H 匹配与合作潜力
I 背调评级
J 开发切入点

Keep phone/WA/email together in F and website/social together in G.
Use segmented company introductions, country name only, readable line
breaks, evidence notes, and practical next actions. Do not invent
WhatsApp confirmation or make Messenger URLs out of Meta lead IDs.
When updating an existing workbook, preserve K onward and other tabs.
```

## C. Native abilities vs. optional local scripts

| Feature | Works without any API key? | What is needed |
| --- | --- | --- |
| Parsing pasted leads, analyzing user-provided content | Yes | AI chat with sufficient context |
| Live company research, website/social verification | Yes **if the AI already offers browsing** | AI platform's native web/search function |
| Formatting an A–J table in chat | Yes | AI chat |
| Exporting an actual XLSX file | Yes **if the AI has spreadsheet/file tools** | Host artifact functionality or optional local script |
| Optional `scripts/export_xlsx.py` / validation | Yes | Local Python with `openpyxl`, a free open-source library |
| Automatically editing native DingTalk comments | **No** | Separate approved integration / browser interaction; never assume ordinary Excel import preserves comments |
| Automatically running research with no browser or sources | **No** | User-provided sources or web capability |

No API credential is embedded in the Skill. The optional `scripts/*.py` files are deterministic local utilities and do not contact external model APIs. The demo page uses synthetic company data and no live research.

## D. Data protection

Never upload real lead lists or customer phone numbers to a public repository. Keep source research and workbook exports in private local or organization storage. Public examples are synthetic.

## E. License

Refer to `LICENSE` and `projects/ronny-scout/BRAND_POLICY.md`. The previously published MIT license allows redistribution and commercial use **with attribution**; it does not allow impersonating the original author's official identity.
