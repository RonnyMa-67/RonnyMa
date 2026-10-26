import json,sys,tempfile,unittest
from pathlib import Path
from openpyxl import load_workbook
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from parse_leads import load_rows,canonicalize,split_markdown
from export_xlsx import export,priority,wa_link
from validate_export import validate

class SmokeTests(unittest.TestCase):
    def test_parse(self):
        r=canonicalize(load_rows(ROOT/"examples/sample_leads.csv"))
        self.assertEqual(len(r),2)
        self.assertEqual(r[0]["lead_id"],"SYN-0001")
        self.assertFalse(r[1]["duplicate_exact_id"])
    def test_priority(self):
        self.assertEqual(priority("P1｜重点推荐"),"P1")
        self.assertEqual(priority("待核实"),"UNVERIFIED")
        with self.assertRaises(ValueError):priority("P9")
    def test_links(self):
        self.assertEqual(wa_link("+1 202 555 0127"),"https://wa.me/12025550127")
        self.assertEqual(wa_link("12025550127"),"")
    def test_export(self):
        r=json.loads((ROOT/"examples/sample_research.json").read_text())
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"a.xlsx"
            export(r,path)
            self.assertIn("PASS: 2 data rows",validate(path))
            w=load_workbook(path)
            self.assertEqual(w.active["G2"].value,"P2")
            self.assertTrue(w.active["C2"].alignment.wrap_text)
            self.assertTrue(w.active["A2"].comment)
            path2=Path(d)/"b.xlsx"
            export(r,path2,link_mode="independent")
            self.assertIn("16 columns",validate(path2,expect_links="independent"))
            self.assertEqual(load_workbook(path2).active["J3"].hyperlink.target,"https://wa.me/12025550127")
    def test_markdown(self):
        self.assertEqual(split_markdown("| One | Two\\|Three |"),["One","Two|Three"])
    def test_duplicate(self):
        r=json.loads((ROOT/"examples/sample_research.json").read_text())
        r[1]["lead_id"]=r[0]["lead_id"]
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):export(r,Path(d)/"bad.xlsx")
if __name__=="__main__":unittest.main()
