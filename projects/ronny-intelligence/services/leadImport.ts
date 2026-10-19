import * as XLSX from 'xlsx';
import { LeadSourceType } from '../types';
import { parseMetaLeadRow, ParsedMetaRow } from './metaLeadParser';

export interface LeadInputRecord {
  inputRowId: string;
  data: Record<string, unknown>;
  parsed: ParsedMetaRow;
}
const normalize = (v: unknown) => String(v || '').trim().replace(/^\uFEFF/, '').toLowerCase().replace(/[\s_?-]/g, '');
const headerKeys = new Set(['id', 'leadid', 'fullname', 'name', 'companyname', 'email', '姓名', '客户姓名', '企业名称', '电子邮箱', 'formid', 'campaignid', '序号', 'phone', 'country']);
export const recordsFromRows = (rows: Record<string, unknown>[], sourceHint?: LeadSourceType): LeadInputRecord[] => rows.map((data, index) => {
  const parsed = parseMetaLeadRow(data);
  // Only an explicit workspace selection can label non-Meta input; Meta metadata wins.
  if (!parsed.isMetaLead && sourceHint) parsed.sourceType = sourceHint;
  return { inputRowId: `row-${index + 1}`, data, parsed };
});
export const parseLeadTableText = (value: string, sourceHint?: LeadSourceType): LeadInputRecord[] | null => {
  if (!value.trim()) return [];
  const workbook = XLSX.read(value, { type: 'string', raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const header = matrix[0] || [];
  if (header.filter(v => headerKeys.has(normalize(v))).length < 2) return null;
  // Repeated headers from multiple pasted files are not customer records.
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false }).filter(row =>
    Object.values(row).some(v => String(v).trim()) && !Object.entries(row).every(([key, val]) => normalize(key) === normalize(val) || !String(val).trim())
  );
  return recordsFromRows(rows, sourceHint);
};
export const deduplicateRecords = (rows: LeadInputRecord[], existingIds: Iterable<string>): LeadInputRecord[] => {
  const seen = new Set(existingIds);
  return rows.filter(row => {
    const id = row.parsed.meta?.leadId;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id); return true;
  });
};
export const mergeAnalysisWithRow = (item: any, row: LeadInputRecord) => ({
  ...item,
  name: row.parsed.fullName !== '未知客户' ? row.parsed.fullName : item.name,
  jobTitle: row.parsed.jobTitle || item.jobTitle,
  country: row.parsed.countryOrMarket || item.country,
  sourceType: row.parsed.sourceType,
  metaLeadId: row.parsed.meta?.leadId,
  meta: row.parsed.meta,
  fiveQuestions: row.parsed.fiveQuestions,
  whatsappNumber: row.parsed.whatsappNumber,
  inboxUrl: row.parsed.inboxUrl,
  contactInfo: { ...item.contactInfo, email: row.parsed.email || item.contactInfo?.email || '', phone: row.parsed.phoneNumber || item.contactInfo?.phone || '' },
});
export const alignBatchResponse = (items: any[], batch: LeadInputRecord[]): any[] => {
  const byId = new Map<string, any>();
  for (const item of items) {
    if (!batch.some(row => row.inputRowId === item.inputRowId) || byId.has(item.inputRowId)) throw new Error('返回的线索对应关系不完整，请重试这批。');
    byId.set(item.inputRowId, item);
  }
  if (byId.size !== batch.length) throw new Error('模型漏了部分线索，本批未保存，请重试。');
  return batch.map(row => mergeAnalysisWithRow(byId.get(row.inputRowId), row));
};
