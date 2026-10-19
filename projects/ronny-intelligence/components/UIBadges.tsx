import React from 'react';
import { 
  Building2, Briefcase, ShoppingBag, Target, FileText, CheckCircle2, AlertTriangle, XCircle, Star
} from 'lucide-react';
import { translateBusinessTypeToChinese } from '../services/geminiService';
import { getCountryVisual, getCountryAccent, normalizeCountryName } from '../utils/countryUtils';
import { ConclusionStatus } from '../types';

export { getCountryVisual, getCountryAccent, normalizeCountryName };

/**
 * 多彩国家国旗徽章
 * 全面支持世界所有国家国旗 Emoji、中文标准名与多重大洲专属柔和色彩
 */
export const CountryBadge: React.FC<{ 
  country: string; 
  className?: string;
  colorful?: boolean;
}> = ({ country, className = '', colorful = true }) => {
  const { flag, label, normalizedName } = getCountryVisual(country);
  const accent = colorful ? getCountryAccent(country) : { border: 'border-[var(--line)]', bg: 'bg-[var(--surface-2)]', text: 'text-[var(--ink-2)]' };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border transition-all ${accent.bg} ${accent.border} ${accent.text} ${className}`}
      title={`${flag} ${label} (${normalizedName})`}
    >
      <span className="text-[13px] leading-none drop-shadow-sm select-none" role="img" aria-label={label}>{flag}</span>
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
};

/**
 * 业务类型多彩徽章 (按制造业、贸易商、零售分销赋予鲜明标识)
 */
export const BusinessTypeBadge: React.FC<{ 
  actualType?: string; 
  businessType?: string;
  className?: string;
  showIcon?: boolean;
}> = ({ actualType, businessType, className = '', showIcon = true }) => {
  const displayStr = actualType || translateBusinessTypeToChinese(businessType || '') || '综合商贸';
  const lower = displayStr.toLowerCase();

  let colorStyle = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25';
  if (/制造|工厂|生产|factory|manufacturer|oem|odm/i.test(lower)) {
    colorStyle = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25';
  } else if (/零售|电商|商超|retail|store|ecommerce/i.test(lower)) {
    colorStyle = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
  } else if (/非标|无关|服务|物流|freight|forwarder/i.test(lower)) {
    colorStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${colorStyle} ${className}`}>
      {showIcon && <Building2 size={11} className="shrink-0 opacity-80" />}
      <span className="truncate max-w-[200px]">{displayStr}</span>
    </span>
  );
};

/**
 * 采购规模与实力多彩卡片
 */
export const PurchasingPowerCard: React.FC<{ 
  scale: string; 
  className?: string;
  compact?: boolean;
  annualEstimate?: string;
}> = ({ scale, className = '', compact = false, annualEstimate }) => {
  const isHigh = />\s*30|30\s*万|50\s*万|100\s*万|high|大/i.test(annualEstimate || scale || '');
  const isMid = /10|20|中|mid/i.test(annualEstimate || scale || '');

  const tierBadge = isHigh 
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    : isMid
      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25'
      : 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/25';

  if (compact) {
    return (
      <div className={`px-2.5 py-1.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between gap-2 ${className}`}>
        <span className="text-[12px] font-normal text-[var(--ink)] truncate" title={scale || '评估中'}>
          {scale || '评估中'}
        </span>
        {annualEstimate && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono shrink-0 ${tierBadge}`}>
            {annualEstimate}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)] ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[12px] font-medium text-[var(--ink-2)]">采购实力评估</span>
        {annualEstimate && (
          <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border font-mono ${tierBadge}`}>
            年预估: {annualEstimate}
          </span>
        )}
      </div>
      <p className="text-[13px] font-normal text-[var(--ink)] leading-relaxed break-words">
        {scale || '企业处于考察期，建议初次小单试样'}
      </p>
    </div>
  );
};

/**
 * 表单填报选项交互胶囊 (现售品类、合作意向、职位) - 多彩半透明胶囊
 */
export const FormInquiryPills: React.FC<{
  currentlySelling?: string;
  interestedCooperation?: string;
  jobTitle?: string;
  className?: string;
}> = ({ currentlySelling, interestedCooperation, jobTitle, className = '' }) => {
  if (!currentlySelling && !interestedCooperation && !jobTitle) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {jobTitle && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
          <Briefcase size={10} className="shrink-0" />
          <span>{jobTitle}</span>
        </span>
      )}
      {currentlySelling && (
        <span className="inline-flex items-center gap-1 text-[11px] font-normal text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2.5 py-0.5 rounded-full" title={`现售品类: ${currentlySelling}`}>
          <ShoppingBag size={10} className="shrink-0" />
          <span>现售: {currentlySelling}</span>
        </span>
      )}
      {interestedCooperation && (
        <span className="inline-flex items-center gap-1 text-[11px] font-normal text-teal-700 dark:text-teal-300 bg-teal-500/10 border border-teal-500/25 px-2.5 py-0.5 rounded-full" title={`意向合作: ${interestedCooperation}`}>
          <Target size={10} className="shrink-0" />
          <span>意向: {interestedCooperation}</span>
        </span>
      )}
    </div>
  );
};

/**
 * 销售策略行动卡片步骤项
 */
export const StrategyStepCard: React.FC<{
  stepNumber: number;
  text: string;
  className?: string;
  compact?: boolean;
}> = ({ stepNumber, text, className = '', compact = false }) => {
  const cleanText = text.replace(/^[1-9]\d*[\.、\)]\s*/, '');

  if (compact) {
    return (
      <div className={`p-2 bg-[var(--surface-2)] border border-[var(--line)] rounded-[12px] ${className}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-4 h-4 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 inline-flex items-center justify-center font-mono text-[10px] font-semibold shrink-0">
            {stepNumber}
          </span>
          <span className="text-[11px] font-medium text-[var(--ink-2)]">
            步骤 {stepNumber}
          </span>
        </div>
        <p className="text-[12px] text-[var(--ink)] leading-snug line-clamp-2 font-normal" title={cleanText}>
          {cleanText}
        </p>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-[var(--surface-2)] border border-[var(--line)] rounded-[16px] flex items-start gap-2.5 ${className}`}>
      <div className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[11px] font-semibold">
        {stepNumber}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">
          第 {stepNumber} 步推进策略
        </span>
        <p className="text-[13px] text-[var(--ink)] leading-relaxed font-normal">
          {cleanText}
        </p>
      </div>
    </div>
  );
};

/**
 * 背调结论多彩样式表
 */
export const getConclusionColorStyle = (status: ConclusionStatus | string) => {
  switch (status) {
    case ConclusionStatus.STRONGLY_RECOMMEND:
    case '强烈推荐':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35 font-semibold';
    case ConclusionStatus.WORKABLE:
    case '可合作':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35 font-semibold';
    case ConclusionStatus.CAUTION:
    case '小心':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/35 font-semibold';
    case ConclusionStatus.ABANDON:
    case '暂弃':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/35 font-medium';
    default:
      return 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--line)]';
  }
};
