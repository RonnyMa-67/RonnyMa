import json
import sys
import tempfile
import unittest
from pathlib import Path
from openpyxl import Workbook, load_workbook
from openpyxl.comments import Comment
from openpyxl.chart import BarChart, Reference
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from parse_leads import load_rows, canonicalize, split_markdown, META_EXPORT_FIELDS
from export_xlsx import export, priority, wa_link, HEADERS, row_values
from append_to_template import append
from validate_export import validate
from meta_marking import mark_signature

class Tests(unittest.TestCase):
    def sample(self):
        return json.loads((ROOT/'examples/sample_research.json').read_text(encoding='utf-8'))

    def test_input_csv(self):
        records = canonicalize(load_rows(ROOT/'examples/sample_leads.csv'))
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]['lead_id'],'SYN-0001')
        self.assertFalse(records[0]['duplicate_exact_id'])

    def test_meta_xml_xls_retains_id_and_sparse_cells(self):
        xml = """<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
          <Worksheet><Table>
          <Row><Cell><Data>id</Data></Cell><Cell><Data>full_name</Data></Cell>
          <Cell><Data>whatsapp_number</Data></Cell></Row>
          <Row><Cell><Data>900000000000000001</Data></Cell>
          <Cell ss:Index="3"><Data>+12025550127</Data></Cell></Row>
          </Table></Worksheet></Workbook>"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'meta.xls'
            path.write_text(xml, encoding='utf-8')
            record, = canonicalize(load_rows(path))
        self.assertEqual(record['lead_id'], '900000000000000001')
        self.assertEqual(record['customer_name'], '')
        self.assertEqual(record['whatsapp'], '+12025550127')

    def test_product_tabs_preserve_notes_and_filters(self):
        records = self.sample()
        records[0]['product_group'] = '产品甲'
        records[1]['product_group'] = '产品乙'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'grouped.xlsx'
            export(records, path, group_by_product=True)
            self.assertIn('2 source IDs', validate(path))
            workbook = load_workbook(path)
            self.assertEqual(workbook.sheetnames, ['产品甲', '产品乙'])
            for sheet, record in zip(workbook, records):
                self.assertEqual(sheet.auto_filter.ref, 'A1:J2')
                self.assertEqual(sheet.freeze_panes, 'D2')
                self.assertIn(str(record['lead_id']), sheet['E2'].comment.text)
            self.assertEqual(workbook['产品乙']['F2'].hyperlink.target, 'https://wa.me/12025550127')

    def test_copyable_notes_are_plain_text(self):
        records = self.sample()
        records[0]['copyable_note'] = '证据：公开资料支持主营。'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'copyable.xlsx'
            export(records, path, copyable_notes=True)
            self.assertIn('copyable K on 1 sheet(s)', validate(path))
            sheet = load_workbook(path).active
            self.assertEqual(sheet.auto_filter.ref, 'A1:K3')
            self.assertEqual(sheet['K2'].data_type, 's')
            self.assertIn(records[0]['copyable_note'], sheet['K2'].value)
            self.assertIn(records[0]['lead_id'], sheet['K2'].value)

    def test_meta_marks_are_linked_and_quantity_independent(self):
        base = self.sample()[0]
        scenarios = [
            {"source_business_type": "wholesaler", "original_quantity": "1–5 台"},
            {"source_business_type": "importer_/_distributor", "original_quantity": "6–20 台",
             "original_purchase_intent": "表单身份：进口／经销\n填报数量／周期：6–20 台／1 个月内",
             "priority_followup": True},
            {"source_business_type": "hotel,_restaurant_or_café_operator",
             "verified_hospitality_chain": "仅同名的门店", "original_quantity": "20 台以上",
             "onsite_meeting_interest": True, "priority_followup": True},
            {"source_business_type": "hotel,_restaurant_or_café_operator",
             "verified_hospitality_chain": "样例连锁餐饮", "identity_evidence": "虚构官网的门店页和联系人页",
             "original_quantity": "1–8 台"},
            {"verified_channel_role": "经销商", "identity_evidence": "虚构官网的经销业务与人员页",
             "raw": {"how_many_units_are_you_planning_to_purchase?": "20+_units"}},
        ]
        records = [dict(base, **scenario, lead_id=f"EXAMPLE-{index}", product_group="示例产品")
                   for index, scenario in enumerate(scenarios)]
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "meta.xlsx"
            export(records, target, group_by_product=True, meta_marking=True)
            wb = load_workbook(target, rich_text=True)
            try:
                ws = wb.active
                name_marks = [mark_signature(ws[f"B{row}"].value)[1] for row in range(2, 7)]
                self.assertEqual([spans[0][2] if spans else None for spans in name_marks],
                                 [False, True, None, False, False])
                demand_marks = [[(text, bold) for _, text, bold in mark_signature(ws[f"E{row}"].value)[1]]
                                for row in range(2, 7)]
                self.assertEqual(demand_marks, [
                    [("批发", True)], [("进口／经销", True), ("6–20 台", True)],
                    [("20 台以上", True)], [("酒店／餐厅／咖啡馆运营", False)], [("20+_units", True)],
                ])
                chain = mark_signature(ws["D5"].value)[1]
                self.assertEqual(chain[0][1:], ("样例连锁餐饮（已确认连锁）", False))
                self.assertIn("身份依据：", ws["D5"].comment.text)
                self.assertFalse(ws["B4"].font.b)
                self.assertNotEqual(ws["B4"].font.color.rgb, "FFC21D30")
            finally:
                wb.close()

    def test_whatsapp(self):
        self.assertEqual(wa_link('+1 202 555 0127'), 'https://wa.me/12025550127')
        self.assertEqual(wa_link('https://wa.me/12025550127'), 'https://wa.me/12025550127')
        self.assertEqual(wa_link('12025550127'), '')
        self.assertEqual(wa_link('https://wa.me/1202555012712025550127'), '')

    def test_priority(self):
        self.assertEqual(priority('P1｜重点推荐'),'P1')
        self.assertEqual(priority('待核实'),'UNVERIFIED')
        with self.assertRaises(ValueError):priority('P9')

    def test_fixed_a_j(self):
        r=self.sample()
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'sample.xlsx'
            export(r,p)
            self.assertIn('10 columns A-J',validate(p))
            ws=load_workbook(p).active
            self.assertEqual([c.value for c in ws[1]],HEADERS['zh'])
            self.assertEqual(ws.max_column,10)
            self.assertEqual(ws['C3'].value,'示例国家')
            self.assertIn('主营：',ws['D2'].value)
            self.assertIn('背景：',ws['D2'].value)
            self.assertIn('电话：',ws['F3'].value)
            self.assertIn('邮箱：',ws['F3'].value)
            self.assertNotIn('官网：',ws['F2'].value)
            self.assertIn('官网：',ws['G2'].value)
            self.assertEqual(ws['F3'].hyperlink.target,'https://wa.me/12025550127')
            self.assertEqual(ws['G2'].hyperlink.target,'https://example.com/')
            self.assertEqual(ws['I2'].value,'P2｜值得沟通')
            self.assertTrue(ws['B2'].comment.text.startswith('原始线索ID'))
            self.assertTrue(ws['B3'].font.bold)
            self.assertTrue(ws['E3'].font.bold)

    def test_no_extra_link_columns(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):export(self.sample(),Path(d)/'bad.xlsx',link_mode='independent')

    def test_preserve_master(self):
        w=Workbook();s=w.active;s.title='研究主表'
        for j,h in enumerate(HEADERS['zh'],1):s.cell(1,j,h)
        for j in range(11,22):s.cell(1,j,f'Staff Field {j}')
        s['B2']='Preexisting Client';s['B2'].comment=Comment('原始线索ID：EXIST-001','Ops')
        s['K2']='DO_NOT_CHANGE';s['K2'].comment=Comment('Existing staff note','Ops')
        s['U2']='Supplier match'
        d=DataValidation(type='list',formula1='"yes,no"');s.add_data_validation(d);d.add('L2:L100')
        ws=w.create_sheet('看板');ws['A1']='A';ws['A2']=1;ws['A3']=2
        chart=BarChart();chart.add_data(Reference(ws,min_col=1,min_row=1,max_row=3));ws.add_chart(chart,'C2')
        w.create_sheet('历史客户');w.create_sheet('现场登记')
        with tempfile.TemporaryDirectory() as t:
            src=Path(t)/'master.xlsx';dst=Path(t)/'result.xlsx';w.save(src)
            append(src,self.sample(),dst)
            a=load_workbook(src);b=load_workbook(dst)
            self.assertEqual(a.sheetnames,b.sheetnames)
            self.assertEqual(len(a['看板']._charts),len(b['看板']._charts))
            self.assertEqual(len(a['研究主表'].data_validations.dataValidation),len(b['研究主表'].data_validations.dataValidation))
            self.assertEqual(b['研究主表']['K2'].value,'DO_NOT_CHANGE')
            self.assertEqual(b['研究主表']['K2'].comment.text,'Existing staff note')
            self.assertEqual(b['研究主表']['U2'].value,'Supplier match')
            self.assertIsNone(b['研究主表']['K3'].value)
            self.assertIsNone(b['研究主表']['U3'].value)
            self.assertEqual(b['研究主表']['D3'].value,row_values(self.sample()[0])[3])
            self.assertEqual(b['研究主表']['F4'].hyperlink.target,'https://wa.me/12025550127')
            with self.assertRaises(ValueError):append(dst,self.sample(),Path(t)/'dup.xlsx')

    def test_mismatched_master_fails(self):
        w=Workbook();w.active['A1']='Customer'
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'wrong.xlsx';w.save(p)
            with self.assertRaises(ValueError):append(p,self.sample(),Path(t)/'out.xlsx')

    def test_duplicate_ids(self):
        r=self.sample();r[1]['lead_id']=r[0]['lead_id']
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):export(r,Path(d)/'bad.xlsx')

    def test_md_pipes(self):
        self.assertEqual(split_markdown('| A | B\\|C |'),['A','B|C'])

    def test_headerless_meta_md_preserves_first(self):
        fields=['2036052327060828','10/26/26','ad-id','ad','adset-id','adset','campaign-id','campaign',
                'form-id','form','false','fb','importer_/_distributor','slush_machines','online_meeting','',
                'Sample Country','test@example.invalid','Example Name','Example Company','+1 202 555 0127','complete']
        self.assertEqual(len(fields),len(META_EXPORT_FIELDS))
        with tempfile.TemporaryDirectory() as td:
            md=Path(td)/'in.md';md.write_text('| '+' | '.join(fields)+' |\n| '+' | '.join(['---']*22)+' |\n')
            rows=canonicalize(load_rows(md))
            self.assertEqual(len(rows),1)
            self.assertEqual(rows[0]['lead_id'],'2036052327060828')
            self.assertEqual(rows[0]['product_interest'],'slush_machines')

if __name__=='__main__':unittest.main()
