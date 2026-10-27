# Ronny Scout

Reusable, privacy-conscious ChatGPT Skill for multilingual B2B lead qualification and spreadsheet preparation. **No vendor-specific client information is bundled.**

## What it does

- Ingests CSV, XLSX or pasted Markdown lead-form tables; preserves original fields.
- Guides source-based verification of company business, public website and social channels.
- Produces readable company background summaries, calibrated priorities and practical outreach suggestions.
- Creates one-sheet research exports and validates formatting, comments and hyperlinks.
- Documents what Excel-to-online-sheet import **cannot** guarantee (native comments and independently clickable links within one cell).

## Quick start

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