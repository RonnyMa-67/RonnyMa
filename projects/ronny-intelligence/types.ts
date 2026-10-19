
export enum ConclusionStatus {
  STRONGLY_RECOMMEND = '强烈推荐',
  WORKABLE = '可合作',
  CAUTION = '小心',
  ABANDON = '暂弃'
}

export interface SocialMediaProfile {
  platform: string; // 'LinkedIn', 'Twitter', 'Facebook', etc.
  url: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  socials: SocialMediaProfile[];
}

export type LeadSourceType = 'exhibition' | 'meta_daily' | 'general' | 'pending_confirmation';

export type MeetingPreference = 'guangzhou' | 'dubai' | 'online' | 'unspecified';

export interface FiveQuestionAnswers {
  q1BusinessDescription: string;      // what_best_describes_your_business? (自报业务类型，需联网核验)
  q2ProductsInterested: string;       // which_products_are_you_interested_in? (产品兴趣，不代表已采购)
  q3MeetingPreference: string;        // where_would_you_prefer_to_meet_supplier? (会面地点偏好)
  q4EstimatedMonthlyVolume: string;   // what_is_your_estimated_monthly_order_volume? (自报月采购量，仅辅助优先级，不覆盖V5)
  q5MainMarketServed: string;         // which_market_do_you_mainly_serve? (服务市场，不是注册国)
  meetingChoice?: MeetingPreference;  // guangzhou | dubai | online | unspecified
}

export interface MetaLeadMeta {
  leadId?: string;       // id (Meta Lead ID，去重主键)
  createdTime?: string;  // created_time
  adId?: string;         // ad_id
  adName?: string;       // ad_name
  adsetId?: string;      // adset_id
  adsetName?: string;    // adset_name
  campaignId?: string;   // campaign_id
  campaignName?: string; // campaign_name
  formId?: string;       // form_id
  formName?: string;     // form_name
  isOrganic?: string;    // is_organic
  platform?: string;     // platform (fb, ig, etc.)
  inboxUrl?: string;     // inbox_url
  leadStatus?: string;   // lead_status
}

export interface LeadEvidence {
  claim: string;
  url: string;
}

export interface LeadAssessment {
  businessFit: 'strong' | 'plausible' | 'weak' | 'unrelated' | 'unknown';
  verification: 'verified' | 'partial' | 'unverified';
  reason: string;
  procurementSignal?: string;
  risk?: { kind: 'confirmed' | 'concern'; reason: string; url: string };
}

export interface AnalysisResult {
  id: string;        // UUID for CRM tracking
  timestamp: number; // Date added
  serialNumber: number;
  name: string;      // Name only
  jobTitle?: string; // 职位 (如 CEO, MD, Brand manager)
  currentlySelling?: string; // 目前是否销售蛋白粉或饮料等
  interestedCooperation?: string; // 对什么合作感兴趣
  country: string;   // Country only
  nameAndCountry: string; // "John Doe (USA)"
  contactInfo: ContactInfo;
  companyNameMapping: string; // "ABC Ltd -> ABC Global Inc."
  actualBusinessType?: string; // 实际类型推测
  originalBusinessType?: string; // 业务类型原值
  businessType: string; // 业务类型
  productStrategy: string;
  assessment?: LeadAssessment;
  evidence?: LeadEvidence[]; 
  companyNature: {
    scale: string; // 规模与采购实力
    registration: string;
    mainBusiness: string;
    reputation: string;
    annualPurchaseEstimate?: string;
    legalRepresentative?: string;
  };
  conclusion: ConclusionStatus;
  riskFactors?: string[];
  assignedTo?: string; 
  followUpRecord?: string;
  note?: string;

  // ===== 展会与日常 Meta 推广专区扩展字段 =====
  sourceType?: LeadSourceType; // 'exhibition' | 'meta_daily' | 'general' | 'pending_confirmation'
  sourceTagManuallySet?: boolean; // 允许手动标记来源，旧记录不自动迁移
  metaLeadId?: string; // Meta lead id 用于去重
  whatsappNumber?: string; // WhatsApp 独立号码
  inboxUrl?: string; // Meta Messenger 收件箱 URL
  meta?: MetaLeadMeta; // Meta 完整广告追溯元数据
  fiveQuestions?: FiveQuestionAnswers; // 五题原始答案
  meetingPriority?: 'high' | 'medium' | 'standard' | 'online_only'; // 会面优先级（与客户资质档位彻底分开）
}

export interface ModelOption {
  id: string;
  name: string;
  version: string;
  badge: string;
  tag: string;
  description: string;
  speed: string;
  quality: string;
  isRecommended?: boolean;
}

export const FREE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    version: '3.8 Flash',
    badge: '最新旗舰 · 推荐',
    tag: '深度多步推理 · 穿透力最强',
    description: 'Google 最新一代 Flash 旗舰模型，具备强大深度思考与推理能力，对缩写公司名、复杂表单意向的穿透背调最精准。',
    speed: '快速',
    quality: '旗舰高精',
    isRecommended: true
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3.0 Flash Preview',
    version: '3.0 Preview',
    badge: '经典稳定',
    tag: '成熟稳定 · 批量名单高兼容',
    description: '成熟稳定的经典 Flash 模型，处理大批量原始混乱文本容错率极佳，支持实时 Google 搜索，响应平稳。',
    speed: '快速',
    quality: '高'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    version: 'Flash Latest',
    badge: '动态追新',
    tag: '自动同步 · 最新稳定内核',
    description: '官方动态对齐别名，自动匹配 Google 官方最新上线的生产环境 Flash 内核，始终享受最新优化成果。',
    speed: '快速',
    quality: '高'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    version: '3.1 Lite',
    badge: '极速低耗',
    tag: '轻量低延时 · 配额消耗最低',
    description: '针对高频次高吞吐设计的轻量极速模型，极速出结果，在配额紧张时能大幅节省免费调用额度。',
    speed: '极速',
    quality: '标准'
  }
];

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  progress: string;
}

export type FileUpload = {
  name: string;
  type: string;
  content: string; // Base64
};
