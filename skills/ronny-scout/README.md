# Ronny Scout

Reusable, privacy-conscious ChatGPT Skill for multilingual B2B lead qualification and spreadsheet preparation. **No vendor-specific client information is bundled.**

## What it does

- Ingests CSV, XLSX or pasted Markdown lead-form tables; preserves original fields.
- Guides source-based verification of company business, public website and social channels.
- Produces readable company background summaries, calibrated priorities and practical outreach suggestions.
- Creates one-sheet research exports and validates formatting, comments and hyperlinks.
- Documents what Excel-to-online-sheet import **cannot** guarantee (native comments and independently clickable links within one cell).

## Install in AI — No API key required / 直接安装使用

**Ronny Scout is a native AI Skill, not a paid API service.** Import this folder into a Skills-compatible AI, then provide your lead data and ask the AI to run Ronny Scout. No server, developer key, OAuth setup, metered model API or credit card is required by the Skill itself.

1. Use the GitHub **Code → Download ZIP** option, extract the repository, and find `skills/ronny-scout/`.
2. Keep `SKILL.md`, `agents/`, `references/`, `scripts/` and the other bundled contents together. If your AI accepts a Skill ZIP, compress **only** the `ronny-scout` folder, rather than uploading the whole GitHub profile repository.
3. Install/upload in the AI's Skills interface; or attach `SKILL.md` as instructions in any AI that lacks a Skill installer.
4. Attach your CSV/XLSX or paste your Meta/CRM leads and say:

> **Use Ronny Scout to research these leads. Find company websites, business profiles and social channels. Write a rich, positively framed commercial analysis and export the accepted A–J table. No paid API or setup.**

**Live research requires that the AI host itself offers web search/browsing.** Producing an XLSX file requires native file/spreadsheet tools or the included optional free Python utilities. The Skill does not bypass an AI provider's plan/usage limits and does not offer cloud-native DingTalk sync.

[Read the full no-API installation guide](references/no-api-quickstart.md) · [Original Skill instructions](SKILL.md)

## Optional local scripts (free)

```bash
python -m pip install -r requirements.txt
python scripts/parse_leads.py --input examples/sample_leads.csv --output /tmp/leads.json
python scripts/export_xlsx.py --input examples/sample_research.json --output /tmp/research.xlsx --lang zh
python scripts/validate_export.py --input /tmp/research.xlsx --lang zh
# Optional: append safely to a compatible existing master (never overwrite the original)
python scripts/append_to_template.py --template master.xlsx --input examples/sample_research.json --output master_updated.xlsx
python -m unittest discover -s tests -v
```

Upload the `skill.zip` bundle to a compatible Skills-enabled environment, or use this folder with an agent that follows `SKILL.md`. Research requires an available browsing/search tool; the local scripts do **not** perform external searches and do not require a paid API.

## Schema

Default output has one sheet and ten columns. All contact links stay grouped in F and all website/social URLs stay grouped in G; extra link columns are not added. See [output contract](references/output-contract.md) and [online-sheet limitations](references/online-sheet-compatibility.md).

## Privacy

Never commit actual lead IDs, names, personal contact details, API tokens, exported reports, auth cookies, CRM URLs or private catalogs. All `examples/` data is fabricated. Review new commits for secrets before publishing.

## License

MIT; see [LICENSE](LICENSE).

## Publish to GitHub

This package can be hosted in an independent `ronny-scout` repository or under a subfolder of an existing public repository. To create your own independent repository from a terminal:

```bash
cd ronny-scout
python scripts/privacy_audit.py
python -m unittest discover -s tests -v
git init
git add .
git commit -m "Release Ronny Scout with fixed A-J layout"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ronny-scout.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub handle. The remote GitHub repository must exist before the push. Do not add any real customer-data files to Git, including in issue descriptions or screenshots.


## v1.1 — Accepted layout

Default export now matches the fixed 10-column A–J research grid. Owner in A, person in B, country only in C, structured background in D, original intent in E, grouped contacts in F, website/social in G, commercial fit in H, rating in I, and next step in J. Existing master sheets preserve downstream sales feedback K onward, other tabs and charts. No extra link columns are added by default. Run the tests before importing to a CRM.