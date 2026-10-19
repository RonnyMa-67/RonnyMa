/**
 * Meta 广告表单线索解析与来源归类引擎
 *
 * 规范要求：
 * 虚构展会示例表单：
 *   form_id: demo_exhibition_form
 *   campaign_id: demo_exhibition_campaign
 *   form_name: 虚构展会演示表单
 *
 * Meta 导出列：
 *   id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,
 *   is_organic,platform,what_best_describes_your_business?,which_products_are_you_interested_in?,
 *   where_would_you_prefer_to_meet_supplier?,what_is_your_estimated_monthly_order_volume?,
 *   which_market_do_you_mainly_serve?,full_name,job_title,company_name,whatsapp_number,email,
 *   phone_number,inbox_url,lead_status
 */

import { MetaLeadMeta, LeadSourceType, FiveQuestionAnswers, MeetingPreference } from '../types';

export const EXHIBITION_FORM_ID = 'demo_exhibition_form';
export const EXHIBITION_CAMPAIGN_ID = 'demo_exhibition_campaign';
export const EXHIBITION_FORM_NAME_DEFAULT = '虚构展会演示表单';

export interface ParsedMetaRow {
  isMetaLead: boolean;
  meta?: MetaLeadMeta;
  sourceType: LeadSourceType;
  fiveQuestions?: FiveQuestionAnswers;
  fullName: string;
  companyName: string;
  jobTitle: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  inboxUrl: string;
  countryOrMarket: string;
  rawRow: Record<string, any>;
}

// 统一标准清理函数：空值返回“未填写”
export const cleanQuestionAnswer = (val: any): string => {
  if (val === undefined || val === null) return '未填写';
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '-') {
    return '未填写';
  }
  return str;
};

// 解析会面偏好
export const parseMeetingPreference = (q3Raw: string): MeetingPreference => {
  const lower = (q3Raw || '').toLowerCase();
  if (lower.includes('guangzhou') || lower.includes('canton') || lower.includes('广交会') || lower.includes('广州') || lower.includes('10月15') || lower.includes('10.15')) {
    return 'guangzhou';
  }
  if (lower.includes('dubai') || lower.includes('迪拜')) {
    return 'dubai';
  }
  if (lower.includes('online') || lower.includes('线上') || lower.includes('zoom') || lower.includes('meeting') || lower.includes('teams')) {
    return 'online';
  }
  return 'unspecified';
};

// 检查是否为 Meta 导出表头
export const isMetaExportHeaders = (headers: string[]): boolean => {
  const norm = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/\?/g, ''));
  const hasMetaKey = norm.includes('form_id') || norm.includes('campaign_id') || norm.includes('ad_id') || norm.includes('inbox_url');
  const hasFiveQ = norm.some(h => h.includes('what_best_describes') || h.includes('where_would_you_prefer') || h.includes('which_products'));
  return hasMetaKey || hasFiveQ;
};

// 标准化列查找
export const findColumnValue = (row: Record<string, any>, candidates: string[]): any => {
  const normalize = (value: string) => value.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/[\s\?_\-\.]/g, '');
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const key = keys.find(k => normalize(k) === normalize(cand));
    if (key !== undefined && row[key] !== undefined && row[key] !== null && String(row[key]).trim()) return row[key];
  }
  return '';
};

/**
 * 核心来源判断算法：
 * 1. form_id === 'demo_exhibition_form' 或 campaign_id === 'demo_exhibition_campaign' 优先判定为展会推广
 * 2. 其次若 form_name / campaign_name 包含“展会”、“canton”、“exhibition”、“Dubai”等判定为展会推广
 * 3. 其他明确包含 Meta 标识 (form_id / campaign_id / ad_id / platform === fb/meta) 归为日常 Meta 产品推广
 * 4. 其余未知来源归为待确认 (pending_confirmation)
 */
export const classifyMetaSource = (meta: MetaLeadMeta): LeadSourceType => {
  const formId = (meta.formId || '').trim();
  const campaignId = (meta.campaignId || '').trim();
  const formName = (meta.formName || '').trim().toLowerCase();
  const campaignName = (meta.campaignName || '').trim().toLowerCase();

  // 1. 严格 ID 优先匹配
  if (formId === EXHIBITION_FORM_ID || campaignId === EXHIBITION_CAMPAIGN_ID) {
    return 'exhibition';
  }

  // 2. 其次名称识别
  if (
    formName.includes('展会') || 
    formName.includes('canton') || 
    formName.includes('exhibition') || 
    formName.includes('dubai') ||
    campaignName.includes('展会') || 
    campaignName.includes('canton') || 
    campaignName.includes('exhibition')
  ) {
    return 'exhibition';
  }

  // 3. 其他明确 Meta 表单归日常推广
  if (formId || campaignId || meta.adId || ['fb', 'ig', 'facebook', 'instagram', 'meta'].includes((meta.platform || '').toLowerCase())) {
    return 'meta_daily';
  }

  return 'pending_confirmation';
};

/**
 * 解析单行对象为 Meta 结构化记录
 */
export const parseMetaLeadRow = (row: Record<string, any>): ParsedMetaRow => {
  const leadId = String(findColumnValue(row, ['id', 'lead_id', 'leadid']) || '').trim();
  const createdTime = String(findColumnValue(row, ['created_time', 'created_at', 'date']) || '').trim();
  const adId = String(findColumnValue(row, ['ad_id', 'adid']) || '').trim();
  const adName = String(findColumnValue(row, ['ad_name', 'adname']) || '').trim();
  const adsetId = String(findColumnValue(row, ['adset_id', 'adsetid']) || '').trim();
  const adsetName = String(findColumnValue(row, ['adset_name', 'adsetname']) || '').trim();
  const campaignId = String(findColumnValue(row, ['campaign_id', 'campaignid']) || '').trim();
  const campaignName = String(findColumnValue(row, ['campaign_name', 'campaignname']) || '').trim();
  const formId = String(findColumnValue(row, ['form_id', 'formid']) || '').trim();
  const formName = String(findColumnValue(row, ['form_name', 'formname']) || '').trim();
  const isOrganic = String(findColumnValue(row, ['is_organic', 'organic']) || '').trim();
  const platform = String(findColumnValue(row, ['platform']) || '').trim();
  const inboxUrl = String(findColumnValue(row, ['inbox_url', 'inboxurl']) || '').trim();
  const leadStatus = String(findColumnValue(row, ['lead_status', 'status']) || '').trim();

  // 五题答案抽取
  const q1Raw = findColumnValue(row, [
    'what_best_describes_your_business?',
    'what_best_describes_your_business',
    'what best describes your business',
    'business_type',
    '自报业务类型'
  ]);
  const q2Raw = findColumnValue(row, [
    'which_products_are_you_interested_in?',
    'which_products_are_you_interested_in',
    'which products are you interested in',
    'products_interested',
    '感兴趣产品'
  ]);
  const q3Raw = findColumnValue(row, [
    'where_would_you_prefer_to_meet_supplier?',
    'where_would_you_prefer_to_meet_supplier',
    'where would you prefer to meet supplier',
    'meeting_preference',
    '会面意向',
    '会面地点'
  ]);
  const q4Raw = findColumnValue(row, [
    'what_is_your_estimated_monthly_order_volume?',
    'what_is_your_estimated_monthly_order_volume',
    'what is your estimated monthly order volume',
    'monthly_order_volume',
    '预估月采购量'
  ]);
  const q5Raw = findColumnValue(row, [
    'which_market_do_you_mainly_serve?',
    'which_market_do_you_mainly_serve',
    'which market do you mainly serve',
    'market_served',
    '主要服务市场'
  ]);

  const q1 = cleanQuestionAnswer(q1Raw);
  const q2 = cleanQuestionAnswer(q2Raw);
  const q3 = cleanQuestionAnswer(q3Raw);
  const q4 = cleanQuestionAnswer(q4Raw);
  const q5 = cleanQuestionAnswer(q5Raw);

  const meetingPreference = parseMeetingPreference(q3);

  // 客户身份与联络信息抽取
  const fullName = String(findColumnValue(row, ['full_name', 'fullname', 'name', '姓名', '客户姓名']) || '').trim();
  const jobTitle = String(findColumnValue(row, ['job_title', 'jobtitle', 'title', '职位']) || '').trim();
  const companyName = String(findColumnValue(row, ['company_name', 'companyname', 'company', '企业名称', '公司名称']) || '').trim();
  const whatsappNumber = String(findColumnValue(row, ['whatsapp_number', 'whatsapp', 'wa_number']) || '').trim();
  const email = String(findColumnValue(row, ['email', 'e-mail', '电子邮箱', '邮箱']) || '').trim();
  const phoneNumber = String(findColumnValue(row, ['phone_number', 'phone', '电话', '联络电话']) || '').trim();

  const isMeta = isMetaExportHeaders(Object.keys(row));

  const metaData: MetaLeadMeta = {
    leadId: leadId || undefined,
    createdTime: createdTime || undefined,
    adId: adId || undefined,
    adName: adName || undefined,
    adsetId: adsetId || undefined,
    adsetName: adsetName || undefined,
    campaignId: campaignId || undefined,
    campaignName: campaignName || undefined,
    formId: formId || undefined,
    formName: formName || undefined,
    isOrganic: isOrganic || undefined,
    platform: platform || undefined,
    inboxUrl: inboxUrl || undefined,
    leadStatus: leadStatus || undefined
  };

  const sourceType = isMeta ? classifyMetaSource(metaData) : 'pending_confirmation';

  const fiveQuestions: FiveQuestionAnswers = {
    q1BusinessDescription: q1,
    q2ProductsInterested: q2,
    q3MeetingPreference: q3,
    q4EstimatedMonthlyVolume: q4,
    q5MainMarketServed: q5,
    meetingChoice: meetingPreference
  };

  return {
    isMetaLead: isMeta,
    meta: isMeta ? metaData : undefined,
    sourceType,
    fiveQuestions: isMeta ? fiveQuestions : undefined,
    fullName: fullName || companyName || '未知客户',
    companyName: companyName || fullName || '未获取公司名',
    jobTitle,
    email,
    phoneNumber,
    whatsappNumber,
    inboxUrl,
    countryOrMarket: String(findColumnValue(row, ['country', '国家', '国家地区']) || '').trim(),
    rawRow: row
  };
};

export const getLeadSource = (item: { sourceType?: LeadSourceType }): LeadSourceType => item.sourceType || 'pending_confirmation';
export const getSourceLabel = (item: { sourceType?: LeadSourceType }): string => ({
  exhibition: '展会推广', meta_daily: '日常 Meta 产品推广', general: '通用背调', pending_confirmation: '待确认来源'
})[getLeadSource(item)];
