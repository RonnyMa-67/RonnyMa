#!/usr/bin/env python3
"""Validate a researched workbook before delivery."""
import argparse
from openpyxl import load_workbook
from export_xlsx import ZH,EN,EXTRA
def validate(path,lang="zh",expect_links="standard"):
    w=load_workbook(path);assert len(w.sheetnames)==1,"Expected one sheet"
    s=w.active;expected=(ZH if lang=="zh" else EN)+(EXTRA if expect_links=="independent" else [])
    assert [c.value for c in s[1]]==expected,"Header mismatch"
    ids=[];count=0
    for row in s.iter_rows(min_row=2):
        if not row[0].value:continue
        count+=1
        assert row[1].value,"Missing country"
        assert row[2].alignment.wrap_text,"Company cell not wrapped"
        assert row[6].value in ("P1","P2","P3","UNVERIFIED"),"Invalid priority"
        if row[0].comment:
            import re
            m=re.search(r"原始线索ID: ([^\n]+)",row[0].comment.text)
            if m:ids.append(m.group(1))
        if row[4].hyperlink: assert row[4].hyperlink.target.startswith("https://wa.me/")
    assert len(ids)==len(set(ids)),"Duplicate ID"
    return f"PASS: {count} data rows, {len(expected)} columns"
def main():
    p=argparse.ArgumentParser();p.add_argument("--input",required=True);p.add_argument("--lang",default="zh");p.add_argument("--expect-links",default="standard")
    a=p.parse_args();print(validate(a.input,a.lang,a.expect_links))
if __name__=="__main__":main()
