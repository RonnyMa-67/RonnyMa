import { AnalysisResult, ConclusionStatus, LeadAssessment, LeadEvidence } from '../types';
import { normalizeCountryName } from '../utils/countryUtils';
import { getLeadSource, parseMeetingPreference } from './metaLeadParser';

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const answered = (value: unknown) => text(value) && !['未填写', '-', 'null', 'undefined'].includes(text(value));
export const normalizeConclusion = (value: string): string => value === '放弃' ? '暂弃' : value;
export const isCantonFairInvitationPhase = (now = new Date()): boolean => {
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  return date >= '2026-09-01' && date <= '2026-10-19';
};

export const productFromInterest = (value: string): string => {
  const v = value.toLowerCase().replace(/_/g, ' ');
  const products: string[] = [];
  if (/multiple|多品类|多个产品/.test(v)) return '多款商用设备';
  if (/wine|分酒|葡萄酒/.test(v)) products.push('葡萄酒分酒机');
  if (/instant.*coffee|coffee.*machine|速溶咖啡/.test(v)) products.push('速溶咖啡机');
  if (/protein|蛋白粉/.test(v)) products.push('蛋白粉机');
  if (/beverage.*dispenser|饮品.*分发/.test(v)) products.push('商用饮品分发机');
  if (/slush|frozen.*drink|冰沙|雪泥/.test(v)) products.push('冰沙雪泥机');
  return products.join('、');
};

// Ratings use evidence and fit, never a quota or the wording of the sales copy.
export const postProcessLeadItem = (item: any, idx: number, now = new Date()): AnalysisResult => {
  const evidence: LeadEvidence[] = (Array.isArray(item.evidence) ? item.evidence : []).filter((e: any) =>
    text(e.claim) && /^https?:\/\//i.test(text(e.url))
  ).map((e: any) => ({ claim: text(e.claim), url: text(e.url) }));
  const raw = item.assessment || {};
  const fit = ['strong', 'plausible', 'weak', 'unrelated', 'unknown'].includes(raw.businessFit) ? raw.businessFit : 'unknown';
  const verification = evidence.length ? (['verified', 'partial'].includes(raw.verification) ? raw.verification : 'partial') : 'unverified';
  const risk = raw.risk && text(raw.risk.reason) && evidence.some(e => e.url === raw.risk.url) ? raw.risk : undefined;
  const assessment: LeadAssessment = { businessFit: fit, verification, reason: text(raw.reason), procurementSignal: text(raw.procurementSignal), risk };
  const q = item.fiveQuestions;
  const selfReportedProduct = answered(q?.q2ProductsInterested) ? q.q2ProductsInterested : text(item.currentlySelling);
  const selectedProduct = productFromInterest(selfReportedProduct);
  const concreteContact = !!(text(item.whatsappNumber) || text(item.contactInfo?.email) || text(item.contactInfo?.phone));
  let conclusion = ConclusionStatus.WORKABLE;
  if ((risk?.kind === 'confirmed') || (fit === 'unrelated' && verification === 'verified')) conclusion = ConclusionStatus.ABANDON;
  else if (risk?.kind === 'concern' || fit === 'weak') conclusion = ConclusionStatus.CAUTION;
  else if (fit === 'strong' && verification === 'verified' && assessment.procurementSignal && concreteContact) conclusion = ConclusionStatus.STRONGLY_RECOMMEND;

  const country = normalizeCountryName(text(item.country)) || '未核实';
  const sourceType = getLeadSource(item);
  const choice = parseMeetingPreference(text(q?.q3MeetingPreference));
  const positiveVolume = answered(q?.q4EstimatedMonthlyVolume) && /50\s*[-–]\s*200|200\+/.test(q.q4EstimatedMonthlyVolume);
  const meetingPriority = choice === 'online' ? 'online_only' : (sourceType === 'exhibition' && choice !== 'unspecified' && positiveVolume ? 'high' : sourceType === 'exhibition' && choice !== 'unspecified' ? 'medium' : 'standard');
  const opportunity = conclusion === ConclusionStatus.STRONGLY_RECOMMEND ? '值得重点跟进。' : conclusion === ConclusionStatus.CAUTION ? '保留机会，先核实需求。' : conclusion === ConclusionStatus.ABANDON ? '目前不宜优先投入。' : '有合作切入点，建议主动联系。';
  const basis = verification === 'unverified'
    ? (selectedProduct ? `客户自报关注${selectedProduct}，公司业务和采购场景待核实。` : '客户已提交线索，具体业务和设备需求待确认。')
    : (fit === 'unrelated' ? '现有资料显示业务匹配度较低。' : fit === 'weak' ? '已有业务资料，但设备使用或分销场景仍需确认。' : '已有业务资料支持继续沟通；表单需求仍需向客户确认。');
  let action = selectedProduct ? `下一步：先核对${selectedProduct}的用途、配置和采购时间，再按需求提供资料。` : '下一步：先确认使用或分销场景，再选定设备和沟通方案。';
  if (sourceType === 'exhibition' && conclusion !== ConclusionStatus.ABANDON) {
    if (choice === 'guangzhou') action = isCantonFairInvitationPhase(now) ? '下一步：通过 WhatsApp 确认10月15–19日广州到访日期、关注机型和人数，再安排会面。' : '下一步：确认展后采购进度，并预约一次线上沟通。';
    else if (choice === 'dubai') action = '下一步：尊重客户的迪拜会面意向，先确认行程；具体展会日期和地点由业务员确认后发送。';
    else if (choice === 'online') action = '下一步：通过 WhatsApp 预约15–20分钟线上会议，先核对机型、用途和采购时间。';
    else action = '下一步：先确认客户方便的会面方式和具体设备需求。';
  }
  if (conclusion === ConclusionStatus.ABANDON) action = '下一步：保留记录；若客户补充相关采购场景或风险澄清，再重新评估。';
  const productStrategy = opportunity + basis + action;
  return {
    ...item,
    id: globalThis.crypto?.randomUUID?.() || `item-${now.getTime()}-${idx}`,
    timestamp: now.getTime(), serialNumber: idx + 1,
    name: text(item.name) || '未填写', jobTitle: text(item.jobTitle), country,
    nameAndCountry: `${text(item.name) || '未填写'} (${country})`,
    sourceType, meetingPriority, assessment, evidence,
    conclusion, productStrategy,
    currentlySelling: answered(q?.q2ProductsInterested) ? q.q2ProductsInterested : text(item.currentlySelling),
    interestedCooperation: answered(q?.q3MeetingPreference) ? q.q3MeetingPreference : text(item.interestedCooperation),
    originalBusinessType: answered(q?.q1BusinessDescription) ? q.q1BusinessDescription : text(item.originalBusinessType),
    businessType: text(item.actualBusinessType) || text(item.businessType) || '待核实',
    companyNameMapping: text(item.companyNameMapping) || `${text(item.name) || '未填写'} → 公司主体待核实`,
    companyNature: {
      ...item.companyNature,
      mainBusiness: text(item.companyNature?.mainBusiness) || '公司业务待核实。',
      scale: text(item.companyNature?.scale) || '员工数、门店数和采购能力未核实。',
      registration: text(item.companyNature?.registration) || '未核实',
      reputation: text(item.companyNature?.reputation) || '尚无充分资料判断',
      legalRepresentative: text(item.companyNature?.legalRepresentative) || '未核实',
    },
    contactInfo: { ...item.contactInfo, email: text(item.contactInfo?.email), phone: text(item.contactInfo?.phone), website: text(item.contactInfo?.website), socials: Array.isArray(item.contactInfo?.socials) ? item.contactInfo.socials : [] },
    assignedTo: text(item.assignedTo) || '未分配', followUpRecord: text(item.followUpRecord), note: text(item.note),
  };
};
