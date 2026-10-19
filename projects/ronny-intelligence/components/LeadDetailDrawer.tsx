import React, { useState, useEffect } from 'react';
import { AnalysisResult, ContactInfo, LeadSourceType } from '../types';
import { 
  Building2, Mail, Phone, Globe, ExternalLink, 
  Sparkles, MessageSquare, Check, Copy, CheckCheck, 
  X, UserCheck, ShieldCheck, DollarSign, Briefcase, 
  Calendar, Award, Share2, Edit3, Save, Layers, Clock
} from 'lucide-react';
import { getConclusionStyle, getConclusionIcon, parseCompanyMapping, parseStrategyPoints } from './AnalysisTable';
import { 
  CountryBadge, 
  BusinessTypeBadge, 
  PurchasingPowerCard, 
  FormInquiryPills, 
  StrategyStepCard 
} from './UIBadges';

interface LeadDetailDrawerProps {
  item: AnalysisResult | null;
  employees: string[];
  onClose: () => void;
  onUpdateAssignment?: (id: string, employee: string) => void;
  onUpdateFollowUp?: (id: string, record: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
  onUpdateContactInfo?: (id: string, contactInfo: ContactInfo) => void;
  onUpdateSourceType?: (id: string, sourceType: LeadSourceType) => void;
  onCopyReport: (item: AnalysisResult) => void;
  onCopyRow: (item: AnalysisResult) => void;
  isCopiedReport: boolean;
  isCopiedRow: boolean;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  item,
  employees,
  onClose,
  onUpdateAssignment,
  onUpdateFollowUp,
  onUpdateNote,
  onUpdateContactInfo,
  onUpdateSourceType,
  onCopyReport,
  onCopyRow,
  isCopiedReport,
  isCopiedRow
}) => {
  if (!item) return null;

  const [localFollowUp, setLocalFollowUp] = useState(item.followUpRecord || '');
  const [localNote, setLocalNote] = useState(item.note || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 联络方式就地编辑状态
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [editEmail, setEditEmail] = useState(item.contactInfo?.email || '');
  const [editPhone, setEditPhone] = useState(item.contactInfo?.phone || '');
  const [editWebsite, setEditWebsite] = useState(item.contactInfo?.website || '');
  const [editSocials, setEditSocials] = useState((item.contactInfo?.socials || []).join(', '));
  const [isContactSaved, setIsContactSaved] = useState(false);

  useEffect(() => {
    setLocalFollowUp(item.followUpRecord || '');
    setLocalNote(item.note || '');
    setEditEmail(item.contactInfo?.email || '');
    setEditPhone(item.contactInfo?.phone || '');
    setEditWebsite(item.contactInfo?.website || '');
    setEditSocials((item.contactInfo?.socials || []).join(', '));
  }, [item]);

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

  const handleSaveContacts = () => {
    const updatedSocials = editSocials
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const updatedContact: ContactInfo = {
      email: editEmail.trim(),
      phone: editPhone.trim(),
      website: editWebsite.trim(),
      socials: updatedSocials
    };

    onUpdateContactInfo?.(item.id, updatedContact);
    setIsContactSaved(true);
    setIsEditingContacts(false);
    setTimeout(() => setIsContactSaved(false), 2000);
  };

  const currentSource = item.sourceType || 'pending_confirmation';

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* 遮罩背景 */}
      <div 
        className="absolute inset-0 bg-[var(--ink)]/40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6">
        <div className="w-screen sm:max-w-2xl lg:max-w-4xl xl:max-w-[880px] bg-[var(--surface-float)] elevation-float flex flex-col z-10 border-l border-[var(--line)] animate-in slide-in-from-right duration-250">
          {/* 抽屉顶部微光流动顶线 */}
          <div className="h-[2px] w-full shrink-0 opacity-80" style={{ background: 'linear-gradient(90deg, var(--glow-1), var(--glow-2), var(--glow-3))' }} />
          
          {/* 抽屉顶部导航栏 */}
          <div className="px-4 sm:px-5 py-3 bg-[var(--surface-2)] border-b border-[var(--line)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="font-mono text-[11px] font-medium text-[var(--ink)] bg-[var(--surface-float)] px-2.5 py-0.5 rounded-full border border-[var(--line)] shrink-0">
                #{item.serialNumber}
              </span>
              <h2 className="text-[14px] font-semibold text-[var(--ink)] tracking-tight truncate">
                客户档案 · {item.name}
              </h2>
              {item.jobTitle && (
                <span className="hidden sm:inline-block text-[11px] font-normal text-[var(--ink-2)] bg-[var(--surface-float)] px-2.5 py-0.5 rounded-full border border-[var(--line)] truncate max-w-[120px]">
                  {item.jobTitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onCopyReport(item)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                  isCopiedReport 
                    ? 'bg-[var(--ink)] text-white border-[var(--ink)]' 
                    : 'bg-[var(--surface-float)] text-[var(--ink)] hover:bg-[var(--surface-2)] border-[var(--line)]'
                }`}
                title="复制此客户完整背调简报"
              >
                {isCopiedReport ? <Check size={12} /> : <Copy size={12} />}
                <span>{isCopiedReport ? '已复制' : '复制简报'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-[var(--surface-float)] hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center transition-colors border border-[var(--line)]"
                title="关闭抽屉"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 抽屉可滚动正文内容 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar bg-[var(--bg)]">
            
            {/* 顶层快览条 (Executive Snapshot Strip) */}
            <div className="rounded-[16px] bg-[var(--surface-2)] p-4 sm:p-5 border border-[var(--line)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] font-semibold text-[var(--ink)] tracking-tight">{item.name}</span>
                  {item.jobTitle && (
                    <span className="text-[11px] font-normal text-[var(--ink-2)] bg-[var(--surface)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
                      {item.jobTitle}
                    </span>
                  )}
                  <CountryBadge country={item.country} />

                  {/* 来源专区手动标记选择器（旧记录不自动猜，支持手动打标） */}
                  <div className="flex items-center gap-1 bg-[var(--surface-float)] px-2.5 py-0.5 rounded-full border border-[var(--line)] text-[11px]">
                    <span className="text-[var(--ink-3)] font-normal">来源:</span>
                    {onUpdateSourceType ? (
                      <select 
                        value={currentSource} 
                        onChange={(e) => onUpdateSourceType(item.id, e.target.value as LeadSourceType)}
                        className="bg-transparent border-none text-[var(--ink)] font-medium text-[11px] cursor-pointer outline-none"
                        title="手动更正/标记线索专区来源"
                      >
                        <option value="exhibition" className="bg-[var(--surface)] text-[var(--ink)]">🏛️ 展会推广</option>
                        <option value="meta_daily" className="bg-[var(--surface)] text-[var(--ink)]">📢 日常 Meta 推广</option>
                        <option value="general" className="bg-[var(--surface)] text-[var(--ink)]">🔍 通用背调</option>
                        <option value="pending_confirmation" className="bg-[var(--surface)] text-[var(--ink)]">⏳ 待确认来源</option>
                      </select>
                    ) : (
                      <span className="font-medium text-[var(--ink)]">
                        {currentSource === 'exhibition' ? '🏛️ 展会推广' : currentSource === 'meta_daily' ? '📢 日常 Meta 推广' : currentSource === 'pending_confirmation' ? '⏳ 待确认' : '🔍 通用背调'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 客户资质硬规则档位 与 会面跟进优先级 彻底分开展示 */}
                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  {/* 会面优先级微标（仅展会或有会面意向时显著标示） */}
                  {item.meetingPriority && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25" title="会面跟进优先级（与主体资质档位独立，辅助现场排期）">
                      <Clock size={11} />
                      <span>会面排期: {item.meetingPriority === 'high' ? '🔥 重点优先' : item.meetingPriority === 'medium' ? '📌 常规安排' : item.meetingPriority === 'online_only' ? '💻 优先线上' : '🏷️ 标准'}</span>
                    </div>
                  )}

                  {/* V5 客户资质硬规则档位 */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] whitespace-nowrap ${getConclusionStyle(item.conclusion)}`} title="基于主体核验与采购实力的硬规则评级">
                    {getConclusionIcon(item.conclusion)}
                    <span>资质档位: {item.conclusion}</span>
                  </div>
                </div>
              </div>

              {/* 四要素微型指标带 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-[12px]">
                <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)]">
                  <div className="text-[11px] text-[var(--ink-2)] font-medium mb-1 flex items-center gap-1">
                    <Building2 size={11} className="text-[var(--ink-2)]" /> 业务类型
                  </div>
                  <BusinessTypeBadge 
                    actualType={item.actualBusinessType} 
                    businessType={item.businessType} 
                    showIcon={false}
                    className="max-w-full"
                  />
                </div>

                <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)]">
                  <div className="text-[11px] text-[var(--ink-2)] font-medium mb-1 flex items-center gap-1">
                    <DollarSign size={11} className="text-[var(--ink-2)]" /> 采购实力分级
                  </div>
                  <PurchasingPowerCard scale={item.companyNature?.scale || '评估中'} compact={true} />
                </div>

                <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)]">
                  <div className="text-[11px] text-[var(--ink-2)] font-medium mb-1 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-[var(--ink-2)]" /> 资信评级
                  </div>
                  <div className="text-[12px] font-medium text-[var(--ink)] truncate">
                    {item.companyNature?.reputation || '良好 / 正常存续'}
                  </div>
                </div>

                <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)]">
                  <div className="text-[11px] text-[var(--ink-2)] font-medium mb-1 flex items-center gap-1">
                    <UserCheck size={11} className="text-[var(--ink-2)]" /> 归属跟进人
                  </div>
                  {onUpdateAssignment ? (
                    <select 
                      value={item.assignedTo || '未分配'} 
                      onChange={(e) => onUpdateAssignment(item.id, e.target.value)} 
                      className="w-full bg-[var(--surface-float)] px-2 py-0.5 rounded-full border border-[var(--line)] text-[11px] font-medium text-[var(--ink)] outline-none cursor-pointer"
                    >
                      {employees.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[12px] font-medium text-[var(--ink)] truncate">
                      {item.assignedTo || '未分配'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2列便当盒网格 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-start">
              
              {/* === 左侧列：主体核验、资质信誉、官方联络 (6 Cols) === */}
              <div className="lg:col-span-6 space-y-3 sm:space-y-3.5">
                
                {/* 1. 企业主体识别与表单录入对比 */}
                <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-medium text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={13} className="text-[var(--ink-2)]" />
                      企业主体核验与原单对比
                    </h3>
                    <button
                      onClick={() => handleCopyText(recognizedCompany, 'drawer-company')}
                      className="text-[11px] font-medium text-[var(--ink)] hover:underline px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] transition-colors"
                      title="复制企业全称"
                    >
                      {copiedField === 'drawer-company' ? '已复制' : '复制名称'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)]">
                      <div className="text-[11px] text-[var(--ink-2)] font-normal">AI 权威核验企业主体</div>
                      <div className="text-[13px] font-medium text-[var(--ink)] mt-0.5 select-all leading-snug">
                        {recognizedCompany}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)]">
                        <div className="text-[11px] text-[var(--ink-2)] font-normal">表单原填名称</div>
                        <div className="text-[12px] font-medium text-[var(--ink)] mt-0.5 truncate" title={originalCompany || '与识别主体一致'}>
                          {originalCompany || '与识别主体一致'}
                        </div>
                      </div>

                      <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)]">
                        <div className="text-[11px] text-[var(--ink-2)] font-normal">表单申报类型</div>
                        <div className="text-[12px] font-medium text-[var(--ink)] mt-0.5 truncate">
                          {item.originalBusinessType || '未明确提供'}
                        </div>
                      </div>
                    </div>

                    <FormInquiryPills 
                      currentlySelling={item.currentlySelling} 
                      interestedCooperation={item.interestedCooperation} 
                    />
                  </div>
                </div>

                {/* 2. 工商注册与资质核验 */}
                <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                  <h3 className="text-[12px] font-medium text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[var(--ink-2)]" />
                    工商注册与信誉核验
                  </h3>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                      <div className="flex items-center gap-1 text-[11px] text-[var(--ink-2)] mb-0.5">
                        <Calendar size={10} className="text-[var(--ink-2)]" />
                        <span>注册登记</span>
                      </div>
                      <div className="text-[12px] font-medium text-[var(--ink)] truncate">
                        {item.companyNature?.registration || '核验中'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                      <div className="flex items-center gap-1 text-[11px] text-[var(--ink-2)] mb-0.5">
                        <UserCheck size={10} className="text-[var(--ink-2)]" />
                        <span>法人代表</span>
                      </div>
                      <div className="text-[12px] font-medium text-[var(--ink)] truncate">
                        {item.companyNature?.legalRepresentative || '未公开'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                      <div className="flex items-center gap-1 text-[11px] text-[var(--ink-2)] mb-0.5">
                        <Award size={10} className="text-[var(--ink-2)]" />
                        <span>商业信用</span>
                      </div>
                      <div className="text-[12px] font-medium text-[var(--ink)] truncate">
                        {item.companyNature?.reputation || '良好 / 正常存续'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. 官方联络方式通道 */}
                <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-medium text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                      <Mail size={13} className="text-[var(--ink-2)]" />
                      联络渠道与官方网站
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {isContactSaved && (
                        <span className="text-[11px] font-medium text-[var(--ink)] flex items-center gap-0.5">
                          <CheckCheck size={11} /> 已更新
                        </span>
                      )}
                      {onUpdateContactInfo && (
                        <button
                          onClick={() => {
                            if (isEditingContacts) {
                              handleSaveContacts();
                            } else {
                              setIsEditingContacts(true);
                            }
                          }}
                          className="text-[11px] font-medium text-[var(--ink)] flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--line)] transition-colors border border-[var(--line)]"
                        >
                          {isEditingContacts ? <Save size={11} /> : <Edit3 size={11} />}
                          <span>{isEditingContacts ? '保存' : '编辑'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingContacts ? (
                    <div className="space-y-2 bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)]">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">邮箱地址</label>
                        <input 
                          type="text" 
                          value={editEmail} 
                          onChange={e => setEditEmail(e.target.value)}
                          placeholder="如: info@example.com" 
                          className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface-float)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">联络电话</label>
                        <input 
                          type="text" 
                          value={editPhone} 
                          onChange={e => setEditPhone(e.target.value)}
                          placeholder="如: +1 234 567 8900" 
                          className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface-float)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">官方网站</label>
                        <input 
                          type="text" 
                          value={editWebsite} 
                          onChange={e => setEditWebsite(e.target.value)}
                          placeholder="如: https://www.company.com" 
                          className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface-float)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">社交主页 (逗号分隔)</label>
                        <input 
                          type="text" 
                          value={editSocials} 
                          onChange={e => setEditSocials(e.target.value)}
                          placeholder="如: linkedin.com/company/abc, facebook.com/abc" 
                          className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface-float)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          onClick={() => setIsEditingContacts(false)}
                          className="px-3 py-1 text-[12px] font-medium text-[var(--ink-2)] bg-[var(--surface-float)] border border-[var(--line)] rounded-full hover:bg-[var(--surface-2)]"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleSaveContacts}
                          className="harmony-btn-primary px-3 py-1 text-[12px] h-[32px]"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* 电子邮箱 */}
                      <div className="flex items-center justify-between p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail size={13} className="text-[var(--ink-2)] shrink-0" />
                          <span className="font-mono text-[12px] font-medium text-[var(--ink)] truncate select-all">
                            {item.contactInfo?.email || '未公开'}
                          </span>
                        </div>
                        {item.contactInfo?.email && (
                          <button
                            onClick={() => handleCopyText(item.contactInfo!.email, 'drawer-email')}
                            className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[var(--surface-float)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                          >
                            {copiedField === 'drawer-email' ? '已复制' : '复制'}
                          </button>
                        )}
                      </div>

                      {/* 独立 WhatsApp 号码 */}
                      {item.whatsappNumber && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 rounded-[16px] border border-emerald-500/25">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded shrink-0">WhatsApp</span>
                            <span className="font-mono text-[12px] font-medium text-emerald-800 dark:text-emerald-300 truncate select-all">
                              {item.whatsappNumber}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyText(item.whatsappNumber!, 'drawer-whatsapp')}
                            className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[var(--surface-float)] border border-emerald-500/30 text-emerald-700 hover:text-emerald-900 transition-colors"
                          >
                            {copiedField === 'drawer-whatsapp' ? '已复制' : '复制'}
                          </button>
                        </div>
                      )}

                      {/* 联络电话 */}
                      <div className="flex items-center justify-between p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone size={13} className="text-[var(--ink-2)] shrink-0" />
                          <span className="font-mono text-[12px] font-medium text-[var(--ink)] truncate select-all">
                            {item.contactInfo?.phone || '未公开'}
                          </span>
                        </div>
                        {item.contactInfo?.phone && (
                          <button
                            onClick={() => handleCopyText(item.contactInfo!.phone, 'drawer-phone')}
                            className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[var(--surface-float)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                          >
                            {copiedField === 'drawer-phone' ? '已复制' : '复制'}
                          </button>
                        )}
                      </div>

                      {/* 官方网站 */}
                      <div className="flex items-center justify-between p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe size={13} className="text-[var(--ink-2)] shrink-0" />
                          <span className="font-mono text-[12px] text-[var(--ink)] truncate">
                            {item.contactInfo?.website || '未公开'}
                          </span>
                        </div>
                        {item.contactInfo?.website && (
                          <a
                            href={item.contactInfo.website.startsWith('http') ? item.contactInfo.website : `https://${item.contactInfo.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-[var(--surface-float)] border border-[var(--line)] text-[var(--ink)] hover:underline"
                          >
                            <span>访问官网</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>

                      {/* 社交平台 */}
                      {item.contactInfo?.socials && item.contactInfo.socials.length > 0 && (
                        <div className="p-2.5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)] space-y-1">
                          <div className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
                            <Share2 size={10} className="text-[var(--ink-2)]" />
                            <span>社交主页通道</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.contactInfo.socials.map((social, sIdx) => {
                              const url = social.startsWith('http') ? social : `https://${social}`;
                              return (
                                <a
                                  key={sIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-normal text-[var(--ink)] bg-[var(--surface-float)] px-2 py-0.5 rounded-full border border-[var(--line)] hover:bg-[var(--surface-2)] inline-flex items-center gap-1 transition-colors"
                                >
                                  <span>{social.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || social}</span>
                                  <ExternalLink size={8} />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* === 右侧列：五题填报/Meta追溯、主营业务、销售策略、CRM跟进便签 (6 Cols) === */}
              <div className="lg:col-span-6 space-y-3 sm:space-y-3.5">
                
                {/* Meta 广告表单来源追溯与五题问卷全景 (若为 Meta 表单线索) */}
                {item.fiveQuestions && (
                  <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[12px] font-semibold text-[var(--ink)] flex items-center gap-1.5">
                        <span className="text-[14px]">📋</span>
                        <span>Meta 广告问卷 (五题核验与偏好)</span>
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]">
                        {item.sourceType === 'exhibition' ? '展会推广表单' : '日常Meta推广'}
                      </span>
                    </div>

                    {/* Meta 广告元数据追踪 */}
                    {item.meta && (
                      <div className="p-2.5 bg-[var(--surface-2)] rounded-[14px] border border-[var(--line)] text-[11px] space-y-1">
                        <div className="text-[var(--ink-2)] flex justify-between">
                          <span>表单: <strong className="text-[var(--ink)]">{item.meta.formName || item.meta.formId || '未记录'}</strong></span>
                          <span>活动: <strong className="text-[var(--ink)]">{item.meta.campaignName || item.meta.campaignId || '未记录'}</strong></span>
                        </div>
                        {item.meta.leadId && (
                          <div className="text-[var(--ink-3)] font-mono text-[10px]">
                            Lead ID: {item.meta.leadId} {item.meta.adId ? `| Ad: ${item.meta.adId}` : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 五题问卷核验矩阵与规则警示 */}
                    <div className="space-y-2 text-[12px]">
                      {/* Q1 */}
                      <div className="p-2.5 bg-[var(--surface-2)] rounded-[14px] border border-[var(--line)]">
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mb-1">
                          <span className="font-semibold text-[var(--ink)]">Q1 自报业务类型</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">须联网核验</span>
                        </div>
                        <p className="text-[var(--ink)] font-medium">{item.fiveQuestions.q1BusinessDescription || '未填写'}</p>
                      </div>

                      {/* Q2 */}
                      <div className="p-2.5 bg-[var(--surface-2)] rounded-[14px] border border-[var(--line)]">
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mb-1">
                          <span className="font-semibold text-[var(--ink)]">Q2 感兴趣产品</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">仅代表兴趣·非已购</span>
                        </div>
                        <p className="text-[var(--ink)] font-medium">{item.fiveQuestions.q2ProductsInterested || '未填写'}</p>
                      </div>

                      {/* Q3 */}
                      <div className="p-2.5 bg-[var(--surface-2)] rounded-[14px] border border-[var(--line)]">
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mb-1">
                          <span className="font-semibold text-[var(--ink)]">Q3 会面地点意向</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">尊重会面选择</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[var(--ink)] font-medium">{item.fiveQuestions.q3MeetingPreference || '未填写'}</p>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]">
                            {item.fiveQuestions.meetingChoice === 'guangzhou' ? '🏛️ 广州广交会 10.15-19' : item.fiveQuestions.meetingChoice === 'dubai' ? '🏙️ Dubai 展会' : item.fiveQuestions.meetingChoice === 'online' ? '💻 优先线上会议' : '未指定'}
                          </span>
                        </div>
                      </div>

                      {/* Q4 */}
                      <div className="p-2.5 bg-[var(--surface-2)] rounded-[14px] border border-[var(--line)]">
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mb-1">
                          <span className="font-semibold text-[var(--ink)]">Q4 预估月采购量</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">仅辅助优先级·不覆盖V5</span>
                        </div>
                        <p className="text-[var(--ink)] font-medium">{item.fiveQuestions.q4EstimatedMonthlyVolume || '未填写'}</p>
                      </div>

                      {/* Q5 */}
                      <div className="p-2.5 bg-[var(--surface-2)] rounded-[14px] border border-[var(--line)]">
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mb-1">
                          <span className="font-semibold text-[var(--ink)]">Q5 主要服务市场</span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">服务市场≠注册国</span>
                        </div>
                        <p className="text-[var(--ink)] font-medium">{item.fiveQuestions.q5MainMarketServed || '未填写'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. 主营业务与供应链分析 */}
                <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                  <h3 className="text-[12px] font-medium text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={13} className="text-[var(--ink-2)]" />
                    主营业务与供应链研判
                  </h3>

                  <div className="space-y-2">
                    <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1">
                      <div className="text-[11px] font-medium text-[var(--ink-2)] uppercase tracking-wider">主营业务定位与行业深度</div>
                      <p className="text-[13px] text-[var(--ink)] leading-relaxed whitespace-pre-line font-normal">
                        {item.companyNature?.mainBusiness || '暂无主营业务公开深度记录'}
                      </p>
                    </div>

                    <div>
                      <PurchasingPowerCard 
                        scale={item.companyNature?.scale || '评估中'} 
                        annualEstimate={item.companyNature?.annualPurchaseEstimate} 
                      />
                    </div>
                  </div>
                </div>

                {/* 5. 销售策略建议 */}
                <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-medium text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[var(--ink-2)]" />
                      针对性推销策略
                    </h3>
                    <button
                      onClick={() => handleCopyText(item.productStrategy, 'drawer-strategy')}
                      className="text-[11px] font-medium text-[var(--ink)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--line)] hover:bg-[var(--surface-float)] transition-colors"
                    >
                      {copiedField === 'drawer-strategy' ? '已复制' : '复制策略'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {strategyPoints.map((pt, idx) => (
                      <StrategyStepCard key={idx} stepNumber={idx + 1} text={pt} />
                    ))}
                  </div>
                </div>

                {/* 6. 跟进记录与备忘便签 */}
                <div className="bg-[var(--surface-float)] border border-[var(--line)] rounded-[20px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-medium text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-[var(--ink-2)]" />
                      跟进记录与备忘
                    </h3>
                    {isSaved && (
                      <span className="text-[11px] font-medium text-[var(--ink)] flex items-center gap-1">
                        <CheckCheck size={11} /> 已自动保存
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">沟通纪要与商务跟进</label>
                      <textarea 
                        placeholder="在此记录与客户的沟通进展、意向需求、报价约谈纪要..." 
                        value={localFollowUp} 
                        onChange={(e) => setLocalFollowUp(e.target.value)}
                        onBlur={handleSaveFollowUp}
                        className="w-full h-20 text-[12px] p-2.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[12px] outline-none resize-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)] leading-relaxed transition-all" 
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-0.5">备忘便签</label>
                      <input 
                        placeholder="重要标签 / 备忘说明..." 
                        value={localNote} 
                        onChange={(e) => setLocalNote(e.target.value)}
                        onBlur={handleSaveNote}
                        className="w-full text-[12px] px-2.5 py-1.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)] transition-all" 
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* 抽屉底部操作栏 */}
          <div className="px-4 py-3 bg-[var(--surface-float)] border-t border-[var(--line)] flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => onCopyRow(item)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium bg-[var(--surface-2)] hover:bg-[var(--surface-float)] text-[var(--ink)] border border-[var(--line)] transition-colors"
              title="复制客户数据为制表符分隔行"
            >
              {isCopiedRow ? <Check size={12} /> : <Copy size={12} />}
              <span>{isCopiedRow ? '已复制表格行' : '复制表格行 (Excel)'}</span>
            </button>

            <button
              onClick={onClose}
              className="harmony-btn-primary px-5 py-1.5 text-[12px] h-[36px]"
            >
              关闭
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
export default LeadDetailDrawer;
