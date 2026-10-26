#!/usr/bin/env python3
"""Read lead-form CSV, XLSX and Markdown tables while keeping raw fields."""
import argparse,csv,json,re
from pathlib import Path

META_EXPORT_FIELDS=["lead_id","created_time","ad_id","ad_name","adset_id","adset_name","campaign_id","campaign_name","form_id","form_name","is_organic","platform","business_type","product_interest","meeting_preference","quantity","country","email","customer_name","company_name","phone","status"]
ALIASES={
"lead_id":["lead id","lead_id","id","线索编号","线索id"],
"customer_name":["name","full name","customer name","姓名","名字"],
"country":["country","国家","country/region"],
"company_name":["company","company name","公司","公司名称"],
"email":["email","邮箱"],"phone":["phone","phone number","mobile","telephone","电话"],
"product_interest":["interested products","products","产品","product"],
"meeting_preference":["meeting preference","meeting","appointment"],
"quantity":["expected quantity","quantity","数量"],
}
def split_markdown(line):
    s=line.strip()
    if s.startswith("|"):s=s[1:]
    if s.endswith("|"):s=s[:-1]
    return [re.sub(r"\\\|","|",x).strip() for x in re.split(r"(?<!\\)\|",s)]
def load_rows(file):
    file=Path(file); ext=file.suffix.lower()
    if ext==".csv":
        with file.open(encoding="utf-8-sig",newline="") as f:return list(csv.DictReader(f))
    if ext in (".xlsx",".xlsm"):
        from openpyxl import load_workbook
        w=load_workbook(file,read_only=True,data_only=True);rows=list(w.active.values)
        return [dict(zip(map(str,rows[0]),row)) for row in rows[1:]] if rows else []
    if ext in (".md",".txt"):
        lines=[split_markdown(s) for s in file.read_text(encoding="utf-8-sig").splitlines() if s.strip().startswith("|")]
        lines=[row for row in lines if not all(re.fullmatch(r":?-{2,}:?",v.strip()) for v in row)]
        if not lines:return []
        first=lines[0]
        header=first if any(re.search(r"(name|company|country|email|phone|姓名|公司|国家|邮箱)",v,re.I) for v in first) else (META_EXPORT_FIELDS if len(first)==len(META_EXPORT_FIELDS) else [f"field_{i}" for i in range(len(first))])
        data=lines[1:] if header is first else lines
        return [dict(zip(header,row)) for row in data]
    raise ValueError("Supported: CSV, XLSX, Markdown")
def canonicalize(rows):
    out=[];seen=set()
    for row in rows:
        normalized={str(k).lower().strip():v for k,v in row.items() if k is not None}
        entry={"raw_fields":row}
        for key,aliases in ALIASES.items():
            entry[key]=next((normalized[a.lower()] for a in aliases if normalized.get(a.lower()) not in (None,"")),row.get(key,""))
        entry["duplicate_exact_id"]=bool(entry.get("lead_id") and str(entry["lead_id"]) in seen)
        if entry.get("lead_id"):seen.add(str(entry["lead_id"]))
        for key in META_EXPORT_FIELDS:
            if key not in entry:entry[key]=row.get(key,"")
        out.append(entry)
    return out
def main():
    p=argparse.ArgumentParser();p.add_argument("--input",required=True);p.add_argument("--output",required=True)
    a=p.parse_args();data=canonicalize(load_rows(a.input));Path(a.output).write_text(json.dumps(data,ensure_ascii=False,indent=2,default=str),encoding="utf-8");print(f"{len(data)} records parsed")
if __name__=="__main__":main()
