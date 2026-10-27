#!/usr/bin/env python3
"""Append new researched leads to the A-J zone of an existing CRM workbook only.

Conservative: does not change existing records, K+ fields, other tabs or charts.
"""
import argparse,json,re
from copy import copy
from pathlib import Path
from openpyxl import load_workbook
try:
    from export_xlsx import HEADERS,row_values,sources_comment,wa_link,valid_url,OWNER_COLORS
except ImportError:
    from scripts.export_xlsx import HEADERS,row_values,sources_comment,wa_link,valid_url,OWNER_COLORS
from openpyxl.comments import Comment

FIELD_MAP={2:'customer_name',3:'country',4:'company_profile',5:'original_purchase_intent',
           6:'phone',7:'social_links',8:'cooperation_potential',9:'priority_level',10:'development_suggestion'}


def append(template,records,output,sheet=None):
    wb=load_workbook(template)
    ws=wb[sheet] if sheet else wb.worksheets[0]
    actual=[ws.cell(1,j).value for j in range(1,11)]
    if actual!=HEADERS['zh']:
        raise ValueError('Original master A-J headers differ. Refuse positional append: '+repr(actual))
    known=set()
    existing=[]
    for r in range(2,ws.max_row+1):
        c=ws.cell(r,2)
        if c.value:existing.append(r)
        if c.comment:
            m=re.search(r'原始线索ID[：:]\s*([^\n]+)',c.comment.text)
            if m:known.add(m.group(1).strip())
    incoming=[str(x.get('lead_id')) for x in records if x.get('lead_id')]
    if len(incoming)!=len(set(incoming)):
        raise ValueError('Duplicate IDs in input')
    if any(v in known for v in incoming):
        raise ValueError('Lead ID already exists; do not overwrite or duplicate: '+str(set(incoming)&known))
    max_existing=max(existing) if existing else 1
    # Use rows after last occupied B; if preformatted empty rows, validate A-J empty.
    start=max_existing+1
    row=start
    for obj in records:
        values=row_values(obj)
        for j,val in enumerate(values,1):
            c=ws.cell(row,j)
            if c.value not in (None,'') or c.comment:
                raise ValueError(f'{c.coordinate} is already occupied; refusing overwrite')
            if row>2:
                prior=ws.cell(row-1,j)
                if not c.has_style:
                    c._style=copy(prior._style)
                if c.number_format=='General' and prior.number_format!='General':
                    c.number_format=prior.number_format
                if prior.alignment:c.alignment=copy(prior.alignment)
            c.value=val
            field=FIELD_MAP.get(j)
            if field:
                note=sources_comment(obj,field)
                if note:c.comment=Comment(note,'Research notes')
            if c.alignment and not c.alignment.wrap_text:
                al=copy(c.alignment);al.wrap_text=True;c.alignment=al
        if obj.get('assignee_color'):
            from openpyxl.styles import PatternFill
            color=OWNER_COLORS.get(str(obj['assignee_color']).lower())
            if color:ws.cell(row,1).fill=PatternFill('solid',fgColor=color)
        if obj.get('onsite_meeting_interest'):
            from openpyxl.styles import Font
            for j in (2,5):
                f=copy(ws.cell(row,j).font);f.bold=True;f.color='B42334';ws.cell(row,j).font=f
        if wa_link(obj.get('whatsapp')):ws.cell(row,6).hyperlink=wa_link(obj['whatsapp'])
        if valid_url(obj.get('website')):ws.cell(row,7).hyperlink=valid_url(obj['website'])
        # K onward must have no data; never populate them. Keep any existing style/formulas untouched.
        current=ws.row_dimensions[row].height or 0
        ws.row_dimensions[row].height=max(75,min(175,current or 105))
        row+=1
    # Extend filter range if one exists but do not create a conflicting auto-filter for a table.
    if ws.auto_filter.ref:
        from openpyxl.utils.cell import range_boundaries,get_column_letter
        minc,minr,maxc,maxr=range_boundaries(ws.auto_filter.ref)
        if maxr<row-1:
            ws.auto_filter.ref=f'{get_column_letter(minc)}{minr}:{get_column_letter(maxc)}{row-1}'
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True);wb.save(output)
    after=load_workbook(output)
    if after.sheetnames!=wb.sheetnames or after[ws.title].max_column!=ws.max_column:
        raise RuntimeError('Workbook structure changed')
    return output,start,row-1


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--template',type=Path,required=True)
    p.add_argument('--input',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--sheet',default=None)
    a=p.parse_args()
    records=json.loads(a.input.read_text(encoding='utf-8'))
    out,first,last=append(a.template,records,a.output,a.sheet)
    print(f'PASS: safely appended A-J rows {first}-{last}; preserved other columns/tabs: {out}')
if __name__=='__main__':main()