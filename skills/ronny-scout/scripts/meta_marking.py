"""Apply the Meta handoff colour rules to evidence-backed research records."""
import re

from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
from openpyxl.comments import Comment

RED = "FFC21D30"
HOSPITALITY = "酒店／餐厅／咖啡馆运营"
CHANNELS = {
    "importer": "进口贸易", "distributor": "经销", "wholesaler": "批发", "dealer": "经销",
    "importer distributor": "进口／经销", "importer or distributor": "进口／经销",
    "进口贸易": "进口贸易", "进口商": "进口贸易", "经销": "经销", "经销商": "经销",
    "分销商": "经销", "批发": "批发", "批发商": "批发", "进口／经销": "进口／经销",
}
QUANTITY = re.compile(
    r"(?:至少\s*|≥\s*|>=\s*)?(?P<minimum>\d+)"
    r"(?:\s*(?:[-–—~至]|to)\s*(?P<maximum>\d+)|\s*(?:\+|以上))?"
    r"\s*(?:台(?:及?以上)?|units?(?:\s+or more)?)?", re.I,
)


def identity(value):
    text = str(value or "").strip().casefold()
    normalized = re.sub(r"[\s_,/]+", " ", text).strip()
    if text == HOSPITALITY or (
        any(word in normalized for word in ("hotel", "restaurant", "café", "cafe"))
        and not any(word in normalized for word in ("supplier", "importer", "wholesaler", "distributor"))
    ) or text in {"酒店", "餐厅", "咖啡馆", "餐饮运营", "酒店餐厅运营"}:
        return HOSPITALITY
    return CHANNELS.get(text) or CHANNELS.get(normalized) or ""


def loud_quantity(value):
    match = QUANTITY.fullmatch(value.strip().replace("_", " "))
    if not match:
        return False
    minimum = int(match["minimum"])
    return minimum >= 6 and (match["maximum"] is None or int(match["maximum"]) >= minimum)


def marked_text(cell, value, bold=False):
    return TextBlock(InlineFont(rFont=cell.font.name, sz=cell.font.sz, color=RED, b=bold), value)


def highlight_span(cell, start, value, bold):
    end = start + len(value)
    runs = list(cell.value) if isinstance(cell.value, CellRichText) else [str(cell.value)]
    result = []
    offset = 0
    for run in runs:
        text = str(run)
        limit = offset + len(text)
        if limit <= start or offset >= end:
            result.append(run)
        else:
            before = text[:max(0, start - offset)]
            after = text[max(0, end - offset):]
            if before:
                result.append(TextBlock(run.font, before) if isinstance(run, TextBlock) else before)
            if offset <= start < limit:
                result.append(marked_text(cell, value, bold))
            if after:
                result.append(TextBlock(run.font, after) if isinstance(run, TextBlock) else after)
        offset = limit
    cell.value = CellRichText(result)


def mark_field(cell, labels, value, should_mark, prepend=False, bold=True):
    """Keep existing labelled field text when present; otherwise add a visible field."""
    if not value:
        return
    lines = str(cell.value or "").splitlines(keepends=True)
    for index, line in enumerate(lines):
        left, colon, right = line.partition("：")
        content = right.rstrip("\n")
        if colon and left in labels and (content == value or content.startswith(value + "／")):
            if should_mark:
                highlight_span(cell, sum(map(len, lines[:index])) + len(left + colon), value, bold)
            return
    # A field can be added without changing the supplied narrative or original answer.
    parts = [labels[0] + "：", marked_text(cell, value, bold) if should_mark else value]
    if cell.value:
        original = list(cell.value) if isinstance(cell.value, CellRichText) else [str(cell.value)]
        parts = parts + ["\n"] + original if prepend else original + ["\n"] + parts
    cell.value = CellRichText(parts) if should_mark or isinstance(cell.value, CellRichText) else "".join(parts)


def apply_meta_marks(sheet, row, item):
    raw = item.get("raw") or item.get("raw_fields") or {}
    source = identity(item.get("source_business_type") or raw.get("what_type_of_company_are_you?")
                      or raw.get("business_type"))
    evidence = str(item.get("identity_evidence") or "").strip()
    candidate = item.get("verified_hospitality_chain")
    chain = candidate.strip() if evidence and isinstance(candidate, str) else ""
    researched = identity(item.get("verified_channel_role")) if evidence else ""
    hospitality = HOSPITALITY in (source, identity(item.get("business_type")))
    channel = not hospitality and (source in CHANNELS.values() or researched in CHANNELS.values())
    marked = bool(chain or channel)
    priority = marked and item.get("priority_followup") is True
    name, profile, demand = (sheet.cell(row, col) for col in (2, 4, 5))
    if marked and not name.value:
        raise ValueError(f"{sheet.title} row {row}: marked identity needs a customer name or company")
    if marked:
        first, newline, rest = str(name.value).partition("\n")
        name.value = CellRichText(marked_text(name, first, priority), newline + rest)
    form_mark = marked and (source in CHANNELS.values() or source == HOSPITALITY)
    mark_field(demand, ("表单身份",), source, form_mark, prepend=True, bold=source != HOSPITALITY)
    verified_role = chain + "（已确认连锁）" if chain else (researched if channel else "")
    if verified_role:
        mark_field(profile, ("背调身份",), verified_role, True, prepend=True, bold=priority)
        note = profile.comment.text + "\n" if profile.comment else ""
        profile.comment = Comment(note + "身份依据：" + evidence, "Research notes")
    quantity = str(item.get("original_quantity") or raw.get("how_many_units_are_you_planning_to_purchase?")
                   or raw.get("quantity") or "").strip()
    mark_field(demand, ("数量", "填报数量／周期", "采购数量"), quantity, loud_quantity(quantity))
    return tuple(cell.value for cell in (name, profile, demand))


def mark_signature(value):
    text = str(value or "")
    if not isinstance(value, CellRichText):
        return text, ()
    spans = []
    offset = 0
    for part in value:
        token = str(part)
        if (isinstance(part, TextBlock) and part.font.color
                and part.font.color.type == "rgb" and part.font.color.rgb == RED):
            spans.append((offset, token, bool(part.font.b)))
        offset += len(token)
    return text, tuple(spans)
