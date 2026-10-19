import React, { useState, useEffect } from 'react';
import { AnalysisResult, ContactInfo } from '../types';
import { translateBusinessTypeToChinese } from '../services/geminiService';
import { 
  Building2, Mail, Phone, Globe, ExternalLink, 
  Sparkles, MessageSquare, Check, Copy, CheckCheck, 
  ShieldCheck, Briefcase, Eye, UserCheck
} from 'lucide-react';
import { parseCompanyMapping, parseStrategyPoints, getConclusionStyle, getConclusionIcon } from './AnalysisTable';
import { 
  CountryBadge, 
  BusinessTypeBadge, 
  PurchasingPowerCard, 
  FormInquiryPills, 
  StrategyStepCard 
} from './UIBadges';

interface LeadExpandedRowProps {
  item: AnalysisResult;
  employees: string[];
  colSpan: number;
  onOpenDetail: (item: AnalysisResult) => void;
  onUpdateAssignment?: (id: string, employee: string) => void;
  onUpdateFollowUp?: (id: string, record: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
  onCopyReport: (item: AnalysisResult) => void;
  onCopyRow: (item: AnalysisResult) => void;
  isCopiedReport: boolean;
  isCopiedRow: boolean;
}

export const LeadExpandedRow: React.FC<LeadExpandedRowProps> = ({
  item,
  employees,
  colSpan,
  onOpenDetail,
  onUpdateAssignment,
  onUpdateFollowUp,
  onUpdateNote,
  onCopyReport,
  onCopyRow,
  isCopiedReport,
  isCopiedRow
}) => {
  const [localFollowUp, setLocalFollowUp] = useState(item.followUpRecord || '');
  const [localNote, setLocalNote] = useState(item.note || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setLocalFollowUp(item.followUpRecord || '');
    setLocalNote(item.note || '');
  }, [item.followUpRecord, item.note]);

  const { original: originalCompany, recognized: recognizedCompany } = parseCompanyMapping(item.companyNameMapping);
  const strategyPoints = parseStrategyPoints(item.productStrategy);

  const handleCopyText = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSaveFollowUp = () => {
    onUpdateFollowUp?.(item.id, localFollowUp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleSaveNote = () => {
    onUpdateNote?.(item.id, localNote);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <tr className="bg-[var(--surface)] border-b border-[var(--line)]">
      <td colSpan={colSpan} className="p-3 sm:p-4">
        <div className="rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
          
          {/* 顶栏：核心标识与操作 */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[11px] font-medium text-[var(--ink)] bg-[var(--surface)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
                #{item.serialNumber} 客户档案
              </span>
              <span className="text-[14px] font-semibold text-[var(--ink)]">{item.name}</span>
              {item.jobTitle && (
                <span className="text-[11px] font-normal text-[var(--ink-2)] bg-[var(--surface)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
                  {item.jobTitle}
                </span>
              )}
              <CountryBadge country={item.country} />

              {/* 专区来源标识 */}
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line)]">
                {item.sourceType === 'exhibition' ? '🏛️ 展会推广' : item.sourceType === 'meta_daily' ? '📢 日常 Meta' : item.sourceType === 'pending_confirmation' ? '⏳ 待确认' : '🔍 通用背调'}
              </span>

              {/* 会面跟进优先级 */}
              {item.meetingPriority && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                  会面: {item.meetingPriority === 'high' ? '🔥 重点' : item.meetingPriority === 'medium' ? '📌 常规' : item.meetingPriority === 'online_only' ? '💻 线上' : '标准'}
                </span>
              )}

              {/* 资质硬规则档位 */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] ${getConclusionStyle(item.conclusion)}`}>
                {getConclusionIcon(item.conclusion)}
                <span>资质: {item.conclusion}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenDetail(item)}
                className="harmony-btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium h-[32px]"
              >
                <Eye size={12} />
                <span>侧边抽屉全屏查看</span>
              </button>
              <button
                onClick={() => onCopyReport(item)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  isCopiedReport 
                    ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]' 
                    : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border-[var(--line)]'
                }`}
              >
                {isCopiedReport ? <Check size={12} /> : <Copy size={12} />}
                <span>{isCopiedReport ? '已复制' : '复制简报'}</span>
              </button>
            </div>
          </div>

          {/* 四栏核心情报卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. 企业主体与原单对比 */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-2)]">
                <Building2 size={13} className="text-[var(--ink-2)]" />
                <span>企业主体与原选类型</span>
              </div>
              <div className="text-[13px] font-medium text-[var(--ink)] select-all leading-snug">
                {recognizedCompany}
              </div>
              {originalCompany && (
                <div className="text-[11px] text-[var(--ink-2)] truncate">
                  <span className="text-[var(--ink-3)]">原单录入: </span>{originalCompany}
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-0.5">
                <BusinessTypeBadge 
                  actualType={item.actualBusinessType} 
                  businessType={item.businessType} 
                  showIcon={true}
                />
                {item.originalBusinessType && (
                  <span className="text-[11px] font-normal text-[var(--ink-2)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full truncate max-w-[120px]">
                    原填: {item.originalBusinessType}
                  </span>
                )}
              </div>
              <FormInquiryPills 
                currentlySelling={item.currentlySelling} 
                interestedCooperation={item.interestedCooperation} 
              />
            </div>

            {/* 2. 工商注册与资质信誉 */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-2)]">
                <ShieldCheck size={13} className="text-[var(--ink-2)]" />
                <span>工商信息与资质</span>
              </div>
              <div className="text-[12px] text-[var(--ink)] flex justify-between">
                <span className="text-[var(--ink-2)]">注册状态: </span>
                <span className="font-medium">{item.companyNature?.registration || '核查中'}</span>
              </div>
              <div className="text-[12px] text-[var(--ink)] flex justify-between">
                <span className="text-[var(--ink-2)]">法人/代表: </span>
                <span className="font-medium truncate max-w-[120px]">{item.companyNature?.legalRepresentative || '未公开'}</span>
              </div>
              <div className="text-[12px] text-[var(--ink)] flex justify-between">
                <span className="text-[var(--ink-2)]">信用评价: </span>
                <span className="font-medium text-[var(--ink)]">{item.companyNature?.reputation || '良好'}</span>
              </div>
              <div className="pt-0.5">
                <PurchasingPowerCard scale={item.companyNature?.scale || '评估中'} compact={true} />
              </div>
            </div>

            {/* 3. 联络通道 */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-2)]">
                <Mail size={13} className="text-[var(--ink-2)]" />
                <span>联络渠道</span>
              </div>
              
              <div className="text-[12px]">
                <span className="text-[var(--ink-2)] text-[11px] block font-normal">邮箱:</span>
                {item.contactInfo?.email ? (
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-medium text-[var(--ink)] truncate select-all">{item.contactInfo.email}</span>
                    <button onClick={() => handleCopyText(item.contactInfo!.email, 'email')} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
                      {copiedField === 'email' ? <Check size={11} className="text-[var(--ink)]" /> : <Copy size={11} />}
                    </button>
                  </div>
                ) : <span className="text-[var(--ink-3)] italic text-[11px]">未提供</span>}
              </div>

              <div className="text-[12px]">
                <span className="text-[var(--ink-2)] text-[11px] block font-normal">电话:</span>
                {item.contactInfo?.phone ? (
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-medium text-[var(--ink)] truncate select-all">{item.contactInfo.phone}</span>
                    <button onClick={() => handleCopyText(item.contactInfo!.phone, 'phone')} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
                      {copiedField === 'phone' ? <Check size={11} className="text-[var(--ink)]" /> : <Copy size={11} />}
                    </button>
                  </div>
                ) : <span className="text-[var(--ink-3)] italic text-[11px]">未提供</span>}
              </div>

              {item.contactInfo?.website && (
                <div className="pt-0.5">
                  <a 
                    href={item.contactInfo.website.startsWith('http') ? item.contactInfo.website : `https://${item.contactInfo.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-normal text-[var(--ink)] hover:underline"
                  >
                    <Globe size={11} className="text-[var(--ink-2)]" />
                    <span className="truncate max-w-[150px]">{item.contactInfo.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={10} className="text-[var(--ink-3)]" />
                  </a>
                </div>
              )}
            </div>

            {/* 4. 跟进指派与记录 */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--ink-2)] flex items-center gap-1">
                  <UserCheck size={13} className="text-[var(--ink-2)]" /> 跟进负责人
                </span>
                {isSaved && <span className="text-[11px] font-medium text-[var(--ink)] flex items-center gap-0.5"><CheckCheck size={10} />已存</span>}
              </div>

              {onUpdateAssignment && (
                <select 
                  value={item.assignedTo || '未分配'} 
                  onChange={(e) => onUpdateAssignment(item.id, e.target.value)} 
                  className="w-full text-[12px] font-normal py-1 px-2.5 border border-[var(--line)] rounded-full bg-[var(--surface)] outline-none text-[var(--ink)]"
                >
                  {employees.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              )}

              <input 
                placeholder="重要备忘便签..." 
                value={localNote} 
                onChange={e => setLocalNote(e.target.value)}
                onBlur={handleSaveNote}
                className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)]"
              />
            </div>

          </div>

          {/* 下半部分：深度业务与销售策略 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-0.5">
            
            {/* 主营业务与供应链定位 */}
            <div className="p-3.5 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-2)]">
                <Briefcase size={13} className="text-[var(--ink-2)]" />
                <span>主营业务与行业定位</span>
              </div>
              <p className="text-[13px] text-[var(--ink)] leading-relaxed whitespace-pre-line font-normal">
                {item.companyNature?.mainBusiness || '暂无深度主营业务记录'}
              </p>
            </div>

            {/* 销售策略要点 */}
            <div className="p-3.5 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-2)]">
                  <Sparkles size={13} />
                  <span>针对性销售策略 ({strategyPoints.length} 步)</span>
                </span>
                <button
                  onClick={() => handleCopyText(item.productStrategy, 'strategy')}
                  className="text-[11px] font-medium text-[var(--ink)] bg-[var(--surface)] px-2.5 py-0.5 rounded-full border border-[var(--line)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  {copiedField === 'strategy' ? '已复制' : '复制策略'}
                </button>
              </div>

              <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {strategyPoints.map((pt, idx) => (
                  <StrategyStepCard key={idx} stepNumber={idx + 1} text={pt} compact={true} />
                ))}
              </div>
            </div>

          </div>

          {/* 跟进记录 */}
          <div className="pt-0.5">
            <label className="text-[12px] font-medium text-[var(--ink-2)] mb-1 flex items-center gap-1">
              <MessageSquare size={12} className="text-[var(--ink-2)]" />
              <span>跟进记录与谈判备忘</span>
            </label>
            <textarea 
              placeholder="记录与该客户的沟通进展、意向需求、商务备忘..." 
              value={localFollowUp} 
              onChange={e => setLocalFollowUp(e.target.value)}
              onBlur={handleSaveFollowUp}
              className="w-full h-16 text-[12px] p-2.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[12px] outline-none resize-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)] leading-relaxed"
            />
          </div>

        </div>
      </td>
    </tr>
  );
};
export default LeadExpandedRow;
