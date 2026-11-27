#!/usr/bin/env python3
"""Validate the fixed A-J research export, hyperlinks and readable row layout."""
import argparse,re
from pathlib import Path
from urllib.parse import urlparse
from openpyxl import load_workbook
try:
    from export_xlsx import HEADERS, COPYABLE_NOTE_HEADER
except ImportError:
    from scripts.export_xlsx import HEADERS, COPYABLE_NOTE_HEADER


def validate_sheet(ws, lang, ids):
    errors=[]
    headers=[ws.cell(1,i).value for i in range(1,11)]
    if headers!=HEADERS[lang]:errors.append(f'Incorrect A-J order: {headers!r}')
    copyable = ws.max_column == 11 and ws['K1'].value == COPYABLE_NOTE_HEADER[lang]
    if ws.max_column != 10 and not copyable:
        errors.append(f'Expected A–J or A–J and a recognized copyable note column, got {ws.max_column} columns')
    for r in range(2,ws.max_row+1):
        if not ws.cell(r,2).value:errors.append(f'Row {r}: missing customer')
        c=str(ws.cell(r,3).value or '')
        if '\n' in c or re.search(r'区号|电话前缀|phone prefix',c,re.I):errors.append(f'Row {r}: country column contaminated')
        d=str(ws.cell(r,4).value or '')
        if d and ('\n' not in d or ('主营：' not in d and '背景：' not in d)):
            errors.append(f'Row {r}: company not segmented')
        for col in (4,8,10):
            v=str(ws.cell(r,col).value or '')
            if re.search(r'(?i)multiple_categories|need_selection_advice|hotel_/_|retail_/_',v):
                errors.append(f'Row {r}: raw form code leaked into prose {col}')
        p=str(ws.cell(r,9).value or '')
        if not (p.startswith(('P1','P2','P3','待核实｜')) or p in ('待核实','UNVERIFIED')):
            errors.append(f'Row {r}: invalid priority {p}')
        for col in range(1,12 if copyable else 11):
            cell=ws.cell(r,col)
            if cell.value and not cell.alignment.wrap_text:errors.append(f'{cell.coordinate}: wrapping disabled')
            if cell.hyperlink:
                target=cell.hyperlink.target or ''
                try:u=urlparse(target)
                except ValueError:u=None
                if not u or u.scheme not in {'http','https','mailto'}:errors.append(f'{cell.coordinate}: invalid hyperlink')
                if 'wa.me/' in target and not re.fullmatch(r'\d{7,15}',target.split('wa.me/',1)[1].split('?',1)[0]):
                    errors.append(f'{cell.coordinate}: invalid WA link')
        if ws.row_dimensions[r].height and ws.row_dimensions[r].height>190:errors.append(f'Row {r}: excessive height')
        row_ids = set()
        for col in (2, 5):
            cm = ws.cell(r, col).comment
            if cm:
                row_ids.update(re.findall(r'^(?:原始线索ID|Meta Lead ID)[：:]\s*([^\n]+)', cm.text, re.M))
        if copyable:
            note = ws.cell(r, 11)
            note_ids = set(re.findall(r'^Meta Lead ID[：:]\s*([^\n]+)', str(note.value or ''), re.M))
            if note_ids != row_ids or (note.value and note.data_type != 's'):
                errors.append(f'Row {r}: copyable note must be plain text with the matching source ID')
        if len(row_ids) > 1:errors.append(f'Row {r}: conflicting source IDs')
        if row_ids & ids:errors.append(f'Row {r}: duplicate lead ID')
        ids.update(row_ids)
    last = 'K' if copyable else 'J'
    if ws.auto_filter.ref != f'A1:{last}{ws.max_row}':errors.append('Missing or incomplete filter')
    return [f'{ws.title}: {error}' for error in errors]


def validate(path, lang='zh'):
    wb = load_workbook(path)
    ids = set()
    errors = [error for sheet in wb for error in validate_sheet(sheet, lang, ids)]
    if errors:raise ValueError('\n'.join(errors))
    row_count = sum(sheet.max_row - 1 for sheet in wb)
    notes = sum(sheet.max_column == 11 for sheet in wb)
    extra = f', copyable K on {notes} sheet(s)' if notes else ''
    return f'PASS: {row_count} data rows, 10 columns A-J, {len(ids)} source IDs{extra}'

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True)
    p.add_argument('--lang',default='zh',choices=['zh','en']);a=p.parse_args();print(validate(a.input,a.lang))
