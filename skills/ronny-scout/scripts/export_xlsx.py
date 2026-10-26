#!/usr/bin/env python3
"""Write a source-aware nine-column research workbook; input is researched JSON."""
import argparse, json, re
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter

ZH=["客户信息","国家","企业身份与主营","原始采购需求","联系方式","匹配与合作潜力","背调评级","开发切入点","与供应商业务匹配性"]
EN=["Customer","Country","Company background","Original buying intent","Contact channels","Cooperation potential","Priority","Next step","Supplier fit"]
EXTRA=["WhatsApp","Email","Website","Facebook","Instagram","LinkedIn","Messenger"]
def wa_link(value):
    value=str(value or "").strip()
    if not value:return ""
    if value.startswith("https://wa.me/"):
        digits=value.split("wa.me/",1)[1].split("?",1)[0]
    elif value.startswith("+"):
        digits=re.sub(r"\D","",value)
    else:return ""
    if not 8<=len(digits)<=15:return ""
    if len(digits)%2==0 and len(digits)>18 and digits[:len(digits)//2]==digits[len(digits)//2:]:return ""
    return "https://wa.me/"+digits
def priority(value):
    text=str(value or "").strip().upper()
    if text.startswith(("P1","P2","P3")):return text[:2]
    if text in ("待核实","UNVERIFIED",""):return "UNVERIFIED"
    raise ValueError("Invalid priority: "+text)
def sources_comment(obj,field):
    notes=obj.get("field_notes") or {}
    group={"company_profile":["company_profile","business_type","company_scale","business_background"],
           "phone":["phone","whatsapp","email","website","social_links"],
           "cooperation_potential":["cooperation_potential","supplier_fit"],
           "priority_level":["priority_level"],
           "development_suggestion":["development_suggestion"]}
    lines=[str(k)+": "+str(notes[k]) for k in group.get(field,[field]) if notes.get(k)]
    if field=="customer_name" and obj.get("lead_id"):lines.insert(0,"原始线索ID: "+str(obj["lead_id"]))
    for s in obj.get("sources",[]):
        if isinstance(s,dict) and s.get("url"):lines.append(str(s.get("claim","source"))+": "+str(s["url"]))
    return "\n".join(lines)
def export(records,out,lang="zh",link_mode="standard"):
    if isinstance(records,dict):records=records.get("records",[])
    ids=[str(r.get("lead_id") or "") for r in records if r.get("lead_id")]
    if len(ids)!=len(set(ids)):raise ValueError("Duplicate lead ID")
    wb=Workbook();ws=wb.active;ws.title="客户背调" if lang=="zh" else "Research"
    labels=(ZH if lang=="zh" else EN)+ (EXTRA if link_mode=="independent" else [])
    ws.append(labels)
    widths=[26,17,64,54,52,55,18,53,52]+([27]*len(EXTRA) if link_mode=="independent" else [])
    for j,width in enumerate(widths,1):ws.column_dimensions[get_column_letter(j)].width=width
    for c in ws[1]:c.fill=PatternFill("solid",fgColor="183C60");c.font=Font(bold=True,color="FFFFFF",size=11);c.alignment=Alignment(vertical="center")
    ws.row_dimensions[1].height=32
    for i,obj in enumerate(records,2):
        identity="｜".join(str(obj.get(k) or "") for k in ("customer_name","job_title") if obj.get(k))
        company="｜".join(str(obj.get(k) or "") for k in ("company_name","business_type") if obj.get(k))
        parts=[company]
        for label,key in (("主营","company_profile"),("背景","business_background"),("规模","company_scale")):
            if obj.get(key):parts.append(label+"："+str(obj[key]))
        company_text="\n".join(x for x in parts if x)
        social=obj.get("social_links") or {}
        contact=[x for x in ["Phone: "+str(obj["phone"]) if obj.get("phone") else "",
           "WhatsApp: "+str(obj["whatsapp"]) if obj.get("whatsapp") else "",
           "Email: "+str(obj["email"]) if obj.get("email") else "",
           "Website: "+str(obj["website"]) if obj.get("website") else ""] if x]
        contact.extend(str(k)+": "+str(v) for k,v in social.items() if v)
        row=[identity,str(obj.get("country") or ""),company_text,str(obj.get("original_purchase_intent") or ""),
           "\n".join(contact),str(obj.get("cooperation_potential") or ""),priority(obj.get("priority_level")),
           str(obj.get("development_suggestion") or ""),str(obj.get("supplier_fit") or "")]
        if link_mode=="independent":
            row += [obj.get("whatsapp") or "",obj.get("email") or "",obj.get("website") or ""]+[social.get(k) or "" for k in EXTRA[3:]]
        ws.append(row)
        for c in ws[i]:
            c.alignment=Alignment(wrap_text=True,vertical="top")
            c.font=Font(name="Arial",size=10,color="25374A")
            if i%2==0:c.fill=PatternFill("solid",fgColor="F5F8FB")
        ws.row_dimensions[i].height=min(185,max(78,20*max(3,len(parts),len(contact))))
        comment_fields={"A":"customer_name","C":"company_profile","E":"phone","F":"cooperation_potential","G":"priority_level","H":"development_suggestion","I":"supplier_fit"}
        for col,field in comment_fields.items():
            note=sources_comment(obj,field)
            if note:ws[f"{col}{i}"].comment=Comment(note,"Source notes")
        url=wa_link(obj.get("whatsapp"))
        if url:ws[f"E{i}"].hyperlink=url
        if obj.get("onsite_meeting_interest"):
            for col in ("A","D"):ws[f"{col}{i}"].font=Font(name="Arial",size=10,bold=True,color="B42334")
        if link_mode=="independent":
            links=[url,"mailto:"+str(obj.get("email")) if obj.get("email") else "",obj.get("website") or ""]+[social.get(k) or "" for k in EXTRA[3:]]
            for j,target in enumerate(links,10):
                if target and (str(target).startswith(("https://","http://","mailto:"))):
                    ws.cell(i,j).hyperlink=target
    ws.freeze_panes="C2";ws.auto_filter.ref=ws.dimensions;ws.sheet_view.showGridLines=False;ws.sheet_view.zoomScale=85
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True);wb.save(out);return out
def main():
    p=argparse.ArgumentParser();p.add_argument("--input",required=True);p.add_argument("--output",required=True);p.add_argument("--lang",default="zh",choices=["zh","en"]);p.add_argument("--link-mode",default="standard",choices=["standard","independent"])
    a=p.parse_args();rows=json.loads(Path(a.input).read_text(encoding="utf-8"))
    print(export(rows,a.output,a.lang,a.link_mode))
if __name__=="__main__":main()
