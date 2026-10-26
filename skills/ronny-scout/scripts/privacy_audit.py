#!/usr/bin/env python3
"""Basic public-source privacy audit; manual review is still required."""
import re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
errors=[]
for p in root.rglob("*"):
    if not p.is_file() or "__pycache__" in p.parts:continue
    if p.suffix in (".xlsx",".xls",".db",".sqlite",".env"):errors.append(str(p))
    if p.suffix in (".md",".py",".json",".csv",".yaml",".yml",".txt"):
        t=p.read_text(encoding="utf-8",errors="replace")
        if re.search(r"(?i)(api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{18,}",t):errors.append(str(p)+" possibly secret")
        if p.parent.name=="examples":
            for email in re.findall(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}",t):
                if not email.endswith((".invalid",".example",".test")):errors.append(str(p)+" unexpected email")
if errors:raise SystemExit("\n".join(errors))
print("PASS: basic privacy checks; inspect public commits manually too")
