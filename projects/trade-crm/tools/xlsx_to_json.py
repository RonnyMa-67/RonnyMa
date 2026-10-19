#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把每日产出的「背调分析明细.xlsx」转换为云数据库可直接导入的 JSON。

用法：
    python3 tools/xlsx_to_json.py ~/Downloads/背调分析明细_2026-09-28.xlsx

输出：
    data/customers_<日期>.json     每行一个 JSON 对象（云开发控制台导入格式）
    data/customers_<日期>.preview.md  前 3 条的可读预览，用于人工抽检

字段映射与清洗规则见 COLUMNS 常量，改表头时只改这一处。
"""
import json
import os
import re
import sys
from datetime import datetime, timedelta

try:
    import openpyxl
except ImportError:
    sys.exit("缺少依赖，请先执行：pip install openpyxl")

# 中文表头 -> CRM 字段名
COLUMNS = {
    "序号": "sourceId",
    "客户姓名": "contact",
    "职位": "jobTitle",
    "表单原选品类": "productCategory",
    "表单合作意向": "intent",
    "国家": "countryRaw",
    "企业识别映射": "companyMapping",
    "实际业务类型": "businessType",
    "表单原填类型": "formType",
    "电子邮箱": "email",
    "联络电话": "phone",
    "官方网站": "website",
    "主营业务与供应链": "profile",
    "企业规模与采购潜力": "scaleRaw",  # 兼容旧表头
    "企业规模与采购实力": "scaleRaw",
    "背调评估结论": "verdict",
    "针对性推销策略": "strategy",
    "负责人员": "ownerName",
    "跟进记录": "followupNote",
    "备忘便签": "notes",
}

# 背调结论 -> 客户等级（用于列表排序与筛选）
VERDICT_LEVEL = {
    "强烈推荐": "A",
    "推荐": "A",
    "可合作": "B",
    "一般": "C",
    "小心": "C",
    "谨慎": "C",
    "不推荐": "D",
}

# 表单里国家字段中英混杂，统一归一成中文，避免筛选时出现「美国」和「US」两个入口
COUNTRY_MAP = {
    "US": "美国", "USA": "美国", "U.S.": "美国", "United States": "美国",
    "UK": "英国", "GB": "英国", "United Kingdom": "英国", "England": "英国",
    "CN": "中国", "China": "中国",
    "VN": "越南", "Vietnam": "越南",
    "TH": "泰国", "Thailand": "泰国",
    "MY": "马来西亚", "Malaysia": "马来西亚",
    "AE": "阿联酋", "UAE": "阿联酋", "United Arab Emirates": "阿联酋",
    "AR": "阿根廷", "Argentina": "阿根廷",
    "CL": "智利", "Chile": "智利",
    "CA": "加拿大", "Canada": "加拿大",
    "PT": "葡萄牙", "Portugal": "葡萄牙",
    "ES": "西班牙", "Spain": "西班牙",
    "DE": "德国", "Germany": "德国",
    "FR": "法国", "France": "法国",
    "AU": "澳大利亚", "Australia": "澳大利亚",
    "SA": "沙特阿拉伯", "Saudi Arabia": "沙特阿拉伯",
    "ID": "印度尼西亚", "Indonesia": "印度尼西亚",
    "IN": "印度", "India": "印度",
    "BR": "巴西", "Brazil": "巴西",
    "MX": "墨西哥", "Mexico": "墨西哥",
    "RU": "俄罗斯", "Russia": "俄罗斯",
    "ZA": "南非", "South Africa": "南非",
    "JP": "日本", "Japan": "日本",
    "KR": "韩国", "Korea": "韩国", "South Korea": "韩国",
}

# 这些说明性文字不是公司名，不能写进 company 字段
INVALID_COMPANY = ("暂无", "未识别", "无明确", "未知", "未提供", "N/A")

# 商机阶段默认值为「待联系」，导入后由业务员在小程序里推进
DEFAULT_STAGE = "待联系"

# 默认跟进间隔（天）：A 级 2 天、B 级 5 天、C 级 10 天
FOLLOWUP_DAYS = {"A": 2, "B": 5, "C": 10, "D": 10}


def clean(value):
    if value is None:
        return ""
    return str(value).replace("\u00a0", " ").strip()


def parse_country(raw):
    """从「英国 (填报GB，电话属地为美国明尼苏达)」里取出主国家名，并统一成中文"""
    if not raw:
        return ""
    text = re.split(r"[(（]", raw)[0].strip()
    return COUNTRY_MAP.get(text, text)


def parse_company(mapping):
    """从「Knoxville gas station -> Knoxville Gas Station & Convenience Store」取箭头后的正式名；
    若识别结果是「暂无明确企业注册实体」这类无效值，返回空串，由调用方回退到联系人姓名"""
    if not mapping:
        return ""
    name = mapping.split("->")[-1].strip() if "->" in mapping else mapping.strip()
    if any(keyword in name for keyword in INVALID_COMPANY):
        return ""
    return name


def clean_potential(text):
    """把「年采购潜力约 $10万-30万美元」简化为「$10万-30万美元/年」"""
    if not text:
        return ""
    value = text.replace("年采购潜力约", "").strip()
    if value and not value.endswith("/年"):
        value = value + "/年"
    return value


def parse_scale(raw):
    """拆出人数规模与年采购潜力两段"""
    if not raw:
        return "", ""
    parts = raw.split("/")
    headcount = parts[0].strip()
    potential = parts[1].strip() if len(parts) > 1 else ""
    return headcount, potential


def to_iso_date(offset_days):
    d = datetime.now() + timedelta(days=offset_days)
    return d.strftime("%Y-%m-%d")


def convert(path, out_dir, team_id="", as_array=False):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active

    header_row = 1
    headers = [clean(c.value) for c in ws[header_row]]
    field_by_col = {}
    for idx, name in enumerate(headers):
        if name in COLUMNS:
            field_by_col[idx] = COLUMNS[name]

    missing = [v for v in COLUMNS.values() if v not in field_by_col.values()]
    if missing:
        print("警告：以下字段在表头里没找到，将留空：%s" % "、".join(sorted(set(missing))))

    records = []
    for row in ws.iter_rows(min_row=header_row + 1, values_only=True):
        if all(v is None or str(v).strip() == "" for v in row):
            continue

        item = {
            "sourceId": "",
            "company": "",
            "contact": "",
            "jobTitle": "",
            "country": "",
            "countryRaw": "",
            "email": "",
            "phone": "",
            "website": "",
            "productCategory": "",
            "intent": "",
            "businessType": "",
            "formType": "",
            "profile": "",
            "headcount": "",
            "purchasePotential": "",
            "verdict": "",
            "level": "C",
            "strategy": "",
            "stage": DEFAULT_STAGE,
            "ownerName": "",
            "notes": "",
            "followupNote": "",
            "nextFollowUpAt": "",
            "importedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        for idx, value in enumerate(row):
            field = field_by_col.get(idx)
            if not field:
                continue
            item[field] = clean(value)

        item["country"] = parse_country(item.pop("countryRaw"))
        item["company"] = parse_company(item.pop("companyMapping"))
        headcount, potential = parse_scale(item.pop("scaleRaw"))
        item["headcount"] = headcount
        item["purchasePotential"] = clean_potential(potential)

        verdict = item["verdict"]
        item["level"] = VERDICT_LEVEL.get(verdict, "C")
        if item["ownerName"] in ("未分配", ""):
            item["ownerName"] = ""
        item["nextFollowUpAt"] = to_iso_date(FOLLOWUP_DAYS.get(item["level"], 5))

        if not item["company"]:
            item["company"] = item["contact"] or "未命名线索"

        # teamId 是云函数做权限隔离的必带字段：控制台直接导入时必须写进去，
        # 否则这批数据在小程序里谁都看不到（查询永远带 teamId 条件）
        item["teamId"] = team_id
        item["ownerId"] = ""
        item["lastFollowUpAt"] = ""

        records.append(item)

    os.makedirs(out_dir, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d")
    json_path = os.path.join(out_dir, "customers_%s.json" % stamp)
    with open(json_path, "w", encoding="utf-8") as f:
        if as_array:
            # 数组格式：部分导入工具只认这种
            json.dump(records, f, ensure_ascii=False, indent=2)
        else:
            # 云开发控制台默认格式：每行一个独立 JSON 对象
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    preview_path = os.path.join(out_dir, "customers_%s.preview.md" % stamp)
    with open(preview_path, "w", encoding="utf-8") as f:
        f.write("# 导入预览 %s（共 %d 条）\n\n" % (stamp, len(records)))
        for r in records[:3]:
            f.write("## %s（%s 级 · %s）\n" % (r["company"], r["level"], r["country"]))
            f.write("- 联系人：%s / %s\n" % (r["contact"], r["jobTitle"]))
            f.write("- 规模：%s ｜ 潜力：%s\n" % (r["headcount"], r["purchasePotential"]))
            f.write("- 结论：%s\n" % r["verdict"])
            f.write("- 下次跟进：%s\n\n" % r["nextFollowUpAt"])

    print("已生成 %d 条记录" % len(records))
    print("导入文件：%s" % json_path)
    print("预览文件：%s" % preview_path)
    return json_path


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(
            "用法：python3 tools/xlsx_to_json.py <xlsx 路径> [--team-id=团队ID] [--array]\n"
            "  --team-id  写入团队归属，控制台直接导入时必须填（在云开发控制台 teams 集合里查 _id）\n"
            "  --array    输出为 JSON 数组，默认输出每行一条（云开发控制台格式）"
        )

    src = os.path.expanduser(args[0])
    team_id = ""
    for a in sys.argv[1:]:
        if a.startswith("--team-id="):
            team_id = a.split("=", 1)[1].strip()

    target = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    convert(src, target, team_id=team_id, as_array="--array" in sys.argv)
