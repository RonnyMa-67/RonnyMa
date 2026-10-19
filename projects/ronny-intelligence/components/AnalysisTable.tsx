import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AnalysisResult, ConclusionStatus, ContactInfo, LeadSourceType } from '../types';
import { translateBusinessTypeToChinese } from '../services/geminiService';
import { exportDataToExcel, formatLeadToStandard19Columns, formatLeadToExtendedColumns } from '../services/excelExport';
import { 
  CheckCircle2, HelpCircle, TrendingUp, XCircle, 
  Globe, ArrowUpDown, Building2, MapPin, 
  BrainCircuit, Copy, Check, ChevronRight, ChevronDown,
  Download, FileSpreadsheet, ChevronLeft, ChevronsLeft, ChevronsRight,
  CheckCheck, LayoutList, LayoutGrid, Mail, Phone, ExternalLink,
  Sparkles, MessageSquare, Briefcase, DollarSign,
  Eye, X, Maximize2, Minimize2, Columns, UserCheck, ShieldCheck
} from 'lucide-react';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { LeadExpandedRow } from './LeadExpandedRow';
import { 
  CountryBadge, 
  BusinessTypeBadge, 
  PurchasingPowerCard, 
  FormInquiryPills, 
  StrategyStepCard 
} from './UIBadges';
import { IconAStar, IconBCheck, IconCAlert, IconDSlash } from './Icons';

export interface AnalysisTableProps {
  results: AnalysisResult[];
  mode?: 'batch' | 'crm';
  employees?: string[];
  searchTerm?: string;
  onUpdateAssignment?: (id: string, employee: string) => void;
  onUpdateFollowUp?: (id: string, record: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
  onUpdateContactInfo?: (id: string, contactInfo: ContactInfo) => void;
  onUpdateSourceType?: (id: string, sourceType: LeadSourceType) => void;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onToggleAll?: () => void;
}

export const getConclusionStyle = (status: ConclusionStatus) => {
  switch (status) {
    case ConclusionStatus.STRONGLY_RECOMMEND: 
      return 'grade-badge-a font-semibold';
    case ConclusionStatus.WORKABLE: 
      return 'grade-badge-b font-semibold'; 
    case ConclusionStatus.CAUTION: 
      return 'grade-badge-c font-semibold';
    case ConclusionStatus.ABANDON: 
      return 'grade-badge-d font-medium';
    default: 
      return 'bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)] font-medium';
  }
};

export const getConclusionIcon = (status: ConclusionStatus, size: number = 13) => {
  switch (status) {
    case ConclusionStatus.STRONGLY_RECOMMEND:
      return <IconAStar size={size} />;
    case ConclusionStatus.WORKABLE:
      return <IconBCheck size={size} />;
    case ConclusionStatus.CAUTION:
      return <IconCAlert size={size} />;
    case ConclusionStatus.ABANDON:
      return <IconDSlash size={size} />;
    default:
      return null;
  }
};

/**
 * 智能解析企业映射：将 ". -> Real Company" 净化为纯净的公司名与原始输入
 */
export const parseCompanyMapping = (mapping: string) => {
  if (!mapping) return { original: '', recognized: '' };
  if (mapping.includes('->')) {
    const parts = mapping.split('->');
    const orig = parts[0].trim();
    const recognized = parts.slice(1).join('->').trim();
    const isCleanOrig = orig && orig !== '.' && orig !== '-' && orig !== '无' && orig !== 'n/a';
    return {
      original: isCleanOrig ? orig : '',
      recognized: recognized || mapping
    };
  }
  return { original: '', recognized: mapping };
};

/**
 * 智能分条解析推销策略：按 "1. "、"2. " 等拆分为清晰结构化条目
 */
export const parseStrategyPoints = (strategy: string): string[] => {
  if (!strategy) return [];
  const rawList = strategy
    .split(/(?=(?:[1-9]\d*[\.、\)]|【\d+】))|\n+/)
    .map(s => s.trim())
    .filter(Boolean);
  return rawList.length > 0 ? rawList : [strategy];
};

/**
 * 格式化背调报告用于一键粘贴
 */
export const formatLeadForCopy = (item: AnalysisResult): string => {
  let formInquiryPart = '';
  const hasJob = !!item.jobTitle;
  const hasOpt1 = !!item.currentlySelling;
  const hasOpt2 = !!item.interestedCooperation;

  if (hasJob || hasOpt1 || hasOpt2) {
    const lines: string[] = [];
    if (hasJob) lines.push(`职位：${item.jobTitle}`);
    if (hasOpt1 && hasOpt2) {
      lines.push(`表单选项1 (现售/品类)：${item.currentlySelling}`);
      lines.push(`表单选项2 (合作意向)：${item.interestedCooperation}`);
    } else if (hasOpt2) {
      lines.push(`表单合作意向：${item.interestedCooperation}`);
    } else if (hasOpt1) {
      lines.push(`表单意向选项：${item.currentlySelling}`);
    }
    formInquiryPart = `\n[客户表单填报]\n${lines.join('\n')}\n--------------------------------`;
  }

  return `【客户背调报告】
--------------------------------
序号：${item.serialNumber}
姓名：${item.name}
国家：${item.country}
企业：${item.companyNameMapping}
实际类型：${item.actualBusinessType || translateBusinessTypeToChinese(item.businessType)}${item.originalBusinessType ? `\n业务类型 (表单)：${item.originalBusinessType}` : ''}${formInquiryPart}
联系方式：
- 邮箱: ${item.contactInfo?.email || '未公开'}
- 电话: ${item.contactInfo?.phone || '未公开'}
- 官网: ${item.contactInfo?.website || '未公开'}

主营业务：
${item.companyNature?.mainBusiness || '未公开'}

规模与采购力：
${item.companyNature?.scale || '未公开'}

背调结论：【${item.conclusion}】

推销策略：
${item.productStrategy}
--------------------------------`;
};

/**
 * 单行表格渲染组件 (支持宽幅全息平铺、行内全景展开、列动态显隐)
 */
interface LeadTableRowProps {
  item: AnalysisResult;
  isSelected: boolean;
  isExpanded: boolean;
  density: 'comfortable' | 'compact';
  employees: string[];
  tableFitMode: 'fit' | 'wide';
  visibleColumns: {
    identity: boolean;
    contacts: boolean;
    investigation: boolean;
    conclusion: boolean;
    strategy: boolean;
    actions: boolean;
  };
  totalVisibleCols: number;
  onToggleSelection?: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onUpdateAssignment?: (id: string, employee: string) => void;
  onUpdateFollowUp?: (id: string, record: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
  onCopyReport: (item: AnalysisResult) => void;
  onCopyRow: (item: AnalysisResult) => void;
  onOpenDetail: (item: AnalysisResult) => void;
  isCopiedReport: boolean;
  isCopiedRow: boolean;
}

const LeadTableRow: React.FC<LeadTableRowProps> = React.memo(({
  item,
  isSelected,
  isExpanded,
  density,
  employees,
  tableFitMode,
  visibleColumns,
  totalVisibleCols,
  onToggleSelection,
  onToggleExpand,
  onUpdateAssignment,
  onUpdateFollowUp,
  onUpdateNote,
  onCopyReport,
  onCopyRow,
  onOpenDetail,
  isCopiedReport,
  isCopiedRow
}) => {
  const [localFollowUp, setLocalFollowUp] = useState(item.followUpRecord || '');
  const [localNote, setLocalNote] = useState(item.note || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandStrategy, setExpandStrategy] = useState(false);
  const followUpDebounceRef = useRef<any>(null);
  const noteDebounceRef = useRef<any>(null);

  useEffect(() => {
    setLocalFollowUp(item.followUpRecord || '');
  }, [item.followUpRecord]);

  useEffect(() => {
    setLocalNote(item.note || '');
  }, [item.note]);

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalFollowUp(val);
    if (followUpDebounceRef.current) clearTimeout(followUpDebounceRef.current);
    followUpDebounceRef.current = setTimeout(() => {
      onUpdateFollowUp?.(item.id, val);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }, 800);
  };

  const handleFollowUpBlur = () => {
    if (followUpDebounceRef.current) clearTimeout(followUpDebounceRef.current);
    onUpdateFollowUp?.(item.id, localFollowUp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalNote(val);
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      onUpdateNote?.(item.id, val);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }, 800);
  };

  const handleNoteBlur = () => {
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    onUpdateNote?.(item.id, localNote);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleCopyText = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const { original: originalCompany, recognized: recognizedCompany } = parseCompanyMapping(item.companyNameMapping);
  const strategyPoints = parseStrategyPoints(item.productStrategy);
  // 默认折叠展示前2条核心策略；展开或在全息抽屉中展示全部
  const displayPoints = expandStrategy ? strategyPoints : strategyPoints.slice(0, 2);

  const tdPadding = density === 'comfortable' ? 'px-3 py-3' : 'px-2 py-2';
  const tdStyle = `${tdPadding} text-[13px] text-[var(--ink)] border-b border-[var(--line)] align-top transition-colors`;

  return (
    <>
      <tr className={`group transition-colors ${isSelected ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]/50'} ${isExpanded ? 'border-b-0' : ''}`}>
        {/* 1. 复选框、序号与行内详情展开器 */}
        <td className={`${tdStyle} text-center sticky left-0 z-20 w-[54px] min-w-[54px] ${isSelected ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)] group-hover:bg-[var(--surface-2)]'}`}>
          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={() => onToggleSelection?.(item.id)} 
              className="w-4 h-4 rounded border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--ink)] cursor-pointer"
            />
            <span className="text-[11px] font-mono font-medium text-[var(--ink-2)]">#{item.serialNumber}</span>
            
            {/* 行内全息详情展开折叠按钮 */}
            <button
              onClick={() => onToggleExpand(item.id)}
              className={`p-1 rounded-full transition-all ${
                isExpanded 
                  ? 'bg-[var(--ink)] text-white' 
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
              }`}
              title={isExpanded ? '收起详情' : '展开详情 (展示全部未截断信息)'}
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>
        </td>

        {/* 2. 客户身份与企业信息 */}
        {visibleColumns.identity && (
          <td className={`${tdStyle} ${tableFitMode === 'fit' ? 'w-[22%] min-w-[210px]' : 'w-[290px] min-w-[270px]'}`}>
            <div className="space-y-2">
              {/* 客户与国家一行紧凑排布 */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button 
                    onClick={() => onOpenDetail(item)}
                    className="font-medium text-[var(--ink)] text-[14px] hover:text-[var(--glow-2)] transition-colors truncate text-left"
                    title="点击在侧边抽屉中查看完整档案"
                  >
                    {item.name}
                  </button>
                  {item.jobTitle && (
                    <span className="text-[11px] font-normal text-[var(--ink-2)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--line)] truncate max-w-[90px]" title={item.jobTitle}>
                      {item.jobTitle}
                    </span>
                  )}
                </div>
                <CountryBadge country={item.country} />
              </div>

              {/* 企业主体卡片 */}
              <div 
                onClick={() => onOpenDetail(item)}
                className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--line)] space-y-1.5 cursor-pointer hover:border-[var(--ink)] transition-colors"
                title="点击查看完整企业识别与表单对比"
              >
                <div className="font-medium text-[var(--ink)] text-[13px] leading-tight line-clamp-1" title={recognizedCompany}>
                  {recognizedCompany}
                </div>
                {originalCompany && originalCompany !== recognizedCompany && (
                  <div className="text-[11px] text-[var(--ink-3)] truncate leading-none">
                    <span>原单: </span>
                    <span className="text-[var(--ink-2)] font-normal">{originalCompany}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  <BusinessTypeBadge 
                    actualType={item.actualBusinessType} 
                    businessType={item.businessType} 
                  />
                  {item.originalBusinessType && (
                    <span className="text-[11px] text-[var(--ink-2)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full truncate max-w-[100px]" title={`原选类型: ${item.originalBusinessType}`}>
                      原选: {item.originalBusinessType}
                    </span>
                  )}
                </div>
              </div>

              {/* 表单意向微标 */}
              <FormInquiryPills 
                currentlySelling={item.currentlySelling} 
                interestedCooperation={item.interestedCooperation} 
              />
            </div>
          </td>
        )}

        {/* 3. 联络渠道 */}
        {visibleColumns.contacts && (
          <td className={`${tdStyle} ${tableFitMode === 'fit' ? 'w-[14%] min-w-[150px]' : 'w-[190px] min-w-[170px]'}`}>
            <div className="space-y-1.5">
              {item.contactInfo?.email ? (
                <div className="flex items-center justify-between gap-1 bg-[var(--surface-2)] px-2.5 py-1 rounded-[12px] border border-[var(--line)] text-[var(--ink)]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Mail size={12} className="text-[var(--ink-2)] shrink-0" />
                    <span className="font-mono text-[12px] text-[var(--ink)] truncate select-all" title={item.contactInfo.email}>
                      {item.contactInfo.email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyText(item.contactInfo!.email, 'email')}
                    className="text-[var(--ink-3)] hover:text-[var(--ink)] p-0.5 rounded-full transition-colors shrink-0"
                    title="复制邮箱"
                  >
                    {copiedField === 'email' ? <Check size={11} className="text-[var(--ink)]" /> : <Copy size={11} />}
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-[var(--ink-3)] italic px-2.5 py-1 bg-[var(--surface-2)] rounded-[12px] border border-[var(--line)]">未公开邮箱</div>
              )}

              {/* 独立 WhatsApp 号码 */}
              {item.whatsappNumber && (
                <div className="flex items-center justify-between gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-[12px] border border-emerald-500/25 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 font-mono text-[12px]">
                    <span className="text-[10px] bg-emerald-500 text-white font-bold px-1 py-0.2 rounded shrink-0">WA</span>
                    <span className="truncate select-all" title={`WhatsApp: ${item.whatsappNumber}`}>{item.whatsappNumber}</span>
                  </div>
                  <button
                    onClick={() => handleCopyText(item.whatsappNumber!, 'whatsapp')}
                    className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded-full transition-colors shrink-0"
                    title="复制 WhatsApp 号码"
                  >
                    {copiedField === 'whatsapp' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  </button>
                </div>
              )}

              {/* 联络电话 */}
              {item.contactInfo?.phone && (
                <div className="flex items-center justify-between gap-1 bg-[var(--surface-2)] px-2.5 py-1 rounded-[12px] border border-[var(--line)] text-[var(--ink)]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 font-mono text-[12px] text-[var(--ink)]">
                    <Phone size={11} className="text-[var(--ink-2)] shrink-0" />
                    <span className="truncate select-all" title={item.contactInfo.phone}>{item.contactInfo.phone}</span>
                  </div>
                  <button
                    onClick={() => handleCopyText(item.contactInfo!.phone, 'phone')}
                    className="text-[var(--ink-3)] hover:text-[var(--ink)] p-0.5 rounded-full transition-colors shrink-0"
                    title="复制电话"
                  >
                    {copiedField === 'phone' ? <Check size={11} className="text-[var(--ink)]" /> : <Copy size={11} />}
                  </button>
                </div>
              )}

              {/* 官网或 Messenger Inbox 链接 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.contactInfo?.website && (
                  <a 
                    href={item.contactInfo.website.startsWith('http') ? item.contactInfo.website : `https://${item.contactInfo.website}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-normal text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface)] px-2.5 py-1 rounded-full border border-[var(--line)] transition-colors"
                  >
                    <Globe size={11} className="text-[var(--ink-2)]" />
                    <span className="truncate max-w-[100px]">{item.contactInfo.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={10} className="text-[var(--ink-3)]" />
                  </a>
                )}
                {item.inboxUrl && (
                  <a 
                    href={item.inboxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/25"
                    title="打开 Meta Messenger 会话"
                  >
                    <span>Inbox</span>
                    <ExternalLink size={9} />
                  </a>
                )}
              </div>
            </div>
          </td>
        )}

        {/* 4. 联网深度背调报告 */}
        {visibleColumns.investigation && (
          <td className={`${tdStyle} ${tableFitMode === 'fit' ? 'w-[22%] min-w-[210px]' : 'w-[300px] min-w-[280px]'}`}>
            <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)] space-y-2">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--ink-2)] mb-1">
                  <Briefcase size={11} className="text-[var(--ink-2)]" />
                  <span>主营业务与供应链定位</span>
                </div>
                <p 
                  className="text-[13px] text-[var(--ink)] leading-relaxed font-normal line-clamp-3"
                  title={item.companyNature?.mainBusiness || '暂无主营业务公开记录'}
                >
                  {item.companyNature?.mainBusiness || '暂无主营业务公开记录'}
                </p>
              </div>

              <PurchasingPowerCard 
                scale={item.companyNature?.scale || '评估中'} 
                compact={true} 
              />
            </div>
          </td>
        )}

        {/* 5. 评估结论与归属人员 */}
        {visibleColumns.conclusion && (
          <td className={`${tdStyle} ${tableFitMode === 'fit' ? 'w-[12%] min-w-[130px]' : 'w-[160px] min-w-[150px]'}`}>
            <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)] space-y-2">
              <div>
                <span className="text-[11px] font-medium text-[var(--ink-2)] block mb-1">评级结论</span>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] whitespace-nowrap shrink-0 ${getConclusionStyle(item.conclusion)}`}>
                  {getConclusionIcon(item.conclusion)}
                  <span className="whitespace-nowrap">{item.conclusion}</span>
                </div>
              </div>

              {onUpdateAssignment && (
                <div className="pt-1.5 border-t border-[var(--line)]">
                  <label className="text-[11px] font-medium text-[var(--ink-2)] block mb-1">负责员工</label>
                  <div className="relative">
                    <select 
                      value={item.assignedTo || '未分配'} 
                      onChange={(e) => onUpdateAssignment(item.id, e.target.value)} 
                      className="w-full text-[12px] font-normal py-1 pl-2.5 pr-6 border border-[var(--line)] rounded-full bg-[var(--surface)] appearance-none cursor-pointer text-[var(--ink)] transition-colors"
                    >
                      {employees.map(emp => (
                        <option key={emp} value={emp} className="bg-[var(--surface)] text-[var(--ink)]">{emp}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-2)] pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </td>
        )}

        {/* 6. 产品推销策略 */}
        {visibleColumns.strategy && (
          <td className={`${tdStyle} ${tableFitMode === 'fit' ? 'w-[18%] min-w-[190px]' : 'w-[290px] min-w-[270px]'}`}>
            <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)] space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--ink-2)]">
                  <Sparkles size={11} /> 销售策略 ({strategyPoints.length}条)
                </span>
                {strategyPoints.length > 2 && (
                  <button
                    onClick={() => setExpandStrategy(!expandStrategy)}
                    className="text-[11px] font-medium text-[var(--ink)] hover:underline"
                  >
                    {expandStrategy ? '收起' : `展开全部 (${strategyPoints.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {displayPoints.map((pt, idx) => (
                  <StrategyStepCard 
                    key={idx} 
                    stepNumber={idx + 1} 
                    text={pt} 
                    compact={!expandStrategy} 
                  />
                ))}
              </div>
            </div>
          </td>
        )}

        {/* 7. 操作与跟进记录 */}
        {visibleColumns.actions && (
          <td className={`${tdStyle} ${tableFitMode === 'fit' ? 'w-[12%] min-w-[130px]' : 'w-[180px] min-w-[160px]'}`}>
            <div className="bg-[var(--surface-2)] p-2.5 rounded-[16px] border border-[var(--line)] space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => onOpenDetail(item)}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[12px] font-medium transition-colors bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)]"
                  title="在侧边抽屉查看客户完整档案"
                >
                  <Eye size={12} />
                  <span className="truncate">档案</span>
                </button>

                <button 
                  onClick={() => onCopyReport(item)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[12px] font-medium transition-colors border ${
                    isCopiedReport 
                      ? 'bg-[var(--ink)] text-white border-[var(--ink)]' 
                      : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)] border-[var(--line)]'
                  }`}
                  title="复制背调简报"
                >
                  {isCopiedReport ? <Check size={12} /> : <Copy size={12} />}
                  <span className="truncate">{isCopiedReport ? '已复制' : '简报'}</span>
                </button>
              </div>

              <button 
                onClick={() => onCopyRow(item)}
                className={`w-full flex items-center justify-center gap-1 py-1 px-2 rounded-full text-[11px] font-normal transition-colors border ${
                  isCopiedRow 
                    ? 'bg-[var(--ink)] text-white border-[var(--ink)]' 
                    : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] border-[var(--line)]'
                }`}
                title="复制为 Excel 格式行"
              >
                <FileSpreadsheet size={11} className="text-[var(--ink-2)]" />
                <span>{isCopiedRow ? '已复制行' : '复制 Excel 行'}</span>
              </button>

              {/* 跟进输入 */}
              <div className="space-y-1 relative pt-1 border-t border-[var(--line)]">
                <input 
                  placeholder="最新跟进备忘..." 
                  value={localNote} 
                  onChange={handleNoteChange}
                  onBlur={handleNoteBlur}
                  className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)] transition-all" 
                />

                {isSaved && (
                  <div className="text-[11px] font-medium text-[var(--ink)] flex items-center gap-1">
                    <CheckCheck size={10} /> 已保存
                  </div>
                )}
              </div>
            </div>
          </td>
        )}
      </tr>

      {/* 行内全景卡片：当展开时，在下方渲染无截断的完整情报面板 */}
      {isExpanded && (
        <LeadExpandedRow
          item={item}
          employees={employees}
          colSpan={totalVisibleCols}
          onOpenDetail={onOpenDetail}
          onUpdateAssignment={onUpdateAssignment}
          onUpdateFollowUp={onUpdateFollowUp}
          onUpdateNote={onUpdateNote}
          onCopyReport={onCopyReport}
          onCopyRow={onCopyRow}
          isCopiedReport={isCopiedReport}
          isCopiedRow={isCopiedRow}
        />
      )}
    </>
  );
});

LeadTableRow.displayName = 'LeadTableRow';

/**
 * 档案卡片视图项 - 独立客户档案卡片
 */
const LeadCardItem: React.FC<{
  item: AnalysisResult;
  isSelected: boolean;
  employees: string[];
  onToggleSelection?: (id: string) => void;
  onUpdateAssignment?: (id: string, employee: string) => void;
  onUpdateFollowUp?: (id: string, record: string) => void;
  onUpdateNote?: (id: string, note: string) => void;
  onCopyReport: (item: AnalysisResult) => void;
  onCopyRow: (item: AnalysisResult) => void;
  onOpenDetail: (item: AnalysisResult) => void;
  isCopiedReport: boolean;
  isCopiedRow: boolean;
}> = React.memo(({
  item,
  isSelected,
  employees,
  onToggleSelection,
  onUpdateAssignment,
  onUpdateFollowUp,
  onUpdateNote,
  onCopyReport,
  onCopyRow,
  onOpenDetail,
  isCopiedReport,
  isCopiedRow
}) => {
  const [localFollowUp, setLocalFollowUp] = useState(item.followUpRecord || '');
  const [localNote, setLocalNote] = useState(item.note || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const followUpDebounceRef = useRef<any>(null);
  const noteDebounceRef = useRef<any>(null);

  useEffect(() => {
    setLocalFollowUp(item.followUpRecord || '');
  }, [item.followUpRecord]);

  useEffect(() => {
    setLocalNote(item.note || '');
  }, [item.note]);

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalFollowUp(val);
    if (followUpDebounceRef.current) clearTimeout(followUpDebounceRef.current);
    followUpDebounceRef.current = setTimeout(() => {
      onUpdateFollowUp?.(item.id, val);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }, 800);
  };

  const handleFollowUpBlur = () => {
    if (followUpDebounceRef.current) clearTimeout(followUpDebounceRef.current);
    onUpdateFollowUp?.(item.id, localFollowUp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalNote(val);
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      onUpdateNote?.(item.id, val);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }, 800);
  };

  const handleNoteBlur = () => {
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    onUpdateNote?.(item.id, localNote);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleCopyText = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const { original: originalCompany, recognized: recognizedCompany } = parseCompanyMapping(item.companyNameMapping);
  const strategyPoints = parseStrategyPoints(item.productStrategy);

  return (
    <div className={`harmony-card rounded-[20px] p-[20px] sm:p-[22px] bg-[var(--surface)] border transition-all ${isSelected ? 'border-[var(--ink)]' : 'border-[var(--line)]'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={() => onToggleSelection?.(item.id)} 
            className="w-4 h-4 rounded border-[var(--line)] text-[var(--ink)] focus:ring-[var(--ink)] cursor-pointer shrink-0"
          />
          <span className="font-mono text-[11px] font-medium text-[var(--ink-2)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--line)] shrink-0">
            #{item.serialNumber}
          </span>
          <button
            onClick={() => onOpenDetail(item)}
            className="text-[14px] font-medium text-[var(--ink)] tracking-tight hover:text-[var(--glow-2)] transition-colors truncate max-w-[200px] sm:max-w-none text-left"
          >
            {item.name}
          </button>
          {item.jobTitle && (
            <span className="text-[11px] font-normal text-[var(--ink-2)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--line)] shrink-0">
              {item.jobTitle}
            </span>
          )}
          <CountryBadge country={item.country} />
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between sm:justify-end">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] whitespace-nowrap ${getConclusionStyle(item.conclusion)}`}>
            {getConclusionIcon(item.conclusion)}
            <span>{item.conclusion}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onUpdateAssignment && (
              <div className="flex items-center gap-1 bg-[var(--surface-2)] pl-2.5 pr-1 py-1 rounded-full border border-[var(--line)]">
                <span className="text-[11px] font-medium text-[var(--ink-2)]">分配:</span>
                <select 
                  value={item.assignedTo || '未分配'} 
                  onChange={(e) => onUpdateAssignment(item.id, e.target.value)} 
                  className="bg-transparent text-[12px] font-normal text-[var(--ink)] border-none outline-none cursor-pointer pr-1 max-w-[80px]"
                >
                  {employees.map(emp => (
                    <option key={emp} value={emp} className="bg-[var(--surface)] text-[var(--ink)]">{emp}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={() => onOpenDetail(item)}
              className="p-1.5 rounded-full text-[12px] font-medium bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] transition-colors"
              title="查看完整客户档案详情"
            >
              <Eye size={13} />
            </button>

            <button 
              onClick={() => onCopyReport(item)}
              className={`p-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                isCopiedReport ? 'bg-[var(--ink)] text-white border-[var(--ink)]' : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border-[var(--line)]'
              }`}
              title="复制背调简报"
            >
              {isCopiedReport ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-3">
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
                <Building2 size={12} className="text-[var(--ink-2)]" /> 企业主体
              </span>
              <BusinessTypeBadge 
                actualType={item.actualBusinessType} 
                businessType={item.businessType} 
                showIcon={true}
              />
            </div>

            <div className="font-medium text-[13px] text-[var(--ink)] leading-snug">
              {recognizedCompany}
            </div>

            {originalCompany && (
              <div className="text-[11px] text-[var(--ink-2)] truncate">
                <span className="text-[var(--ink-3)]">原单录入:</span> {originalCompany}
              </div>
            )}

            {item.originalBusinessType && (
              <div className="text-[11px] text-[var(--ink-2)] font-normal">
                <span className="text-[var(--ink-3)]">表单类型:</span> {item.originalBusinessType}
              </div>
            )}

            <FormInquiryPills 
              currentlySelling={item.currentlySelling} 
              interestedCooperation={item.interestedCooperation} 
            />
          </div>

          <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
            <span className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
              <Mail size={12} className="text-[var(--ink-2)]" /> 联络渠道
            </span>
            <div className="text-[12px] space-y-1">
              {item.contactInfo?.email && (
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[var(--ink)] truncate select-all">{item.contactInfo.email}</span>
                  <button onClick={() => handleCopyText(item.contactInfo!.email, 'card-email')} className="text-[var(--ink-3)] hover:text-[var(--ink)]">
                    {copiedField === 'card-email' ? <Check size={11} className="text-[var(--ink)]" /> : <Copy size={11} />}
                  </button>
                </div>
              )}
              {item.contactInfo?.phone && (
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[var(--ink)] truncate select-all">{item.contactInfo.phone}</span>
                  <button onClick={() => handleCopyText(item.contactInfo!.phone, 'card-phone')} className="text-[var(--ink-3)] hover:text-[var(--ink)]">
                    {copiedField === 'card-phone' ? <Check size={11} className="text-[var(--ink)]" /> : <Copy size={11} />}
                  </button>
                </div>
              )}
              {item.contactInfo?.website && (
                <div>
                  <a href={item.contactInfo.website.startsWith('http') ? item.contactInfo.website : `https://${item.contactInfo.website}`} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-[var(--ink)] hover:underline inline-flex items-center gap-1">
                    <Globe size={11} className="text-[var(--ink-2)]" />
                    <span>访问官网</span>
                    <ExternalLink size={9} className="text-[var(--ink-3)]" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-2.5">
          <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
            <span className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
              <Briefcase size={12} className="text-[var(--ink-2)]" /> 主营业务与供应链定位
            </span>
            <p className="text-[13px] text-[var(--ink)] leading-relaxed font-normal whitespace-pre-line">
              {item.companyNature?.mainBusiness || '暂无主营业务公开记录'}
            </p>
            <div className="pt-0.5">
              <PurchasingPowerCard scale={item.companyNature?.scale || '评估中'} compact={true} />
            </div>
          </div>

          <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-1.5">
            <span className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
              <Sparkles size={12} /> 针对性销售策略
            </span>
            <div className="space-y-1">
              {strategyPoints.map((pt, idx) => (
                <StrategyStepCard key={idx} stepNumber={idx + 1} text={pt} compact={true} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-2.5">
          <div className="bg-[var(--surface-2)] p-3 rounded-[16px] border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--ink-2)] flex items-center gap-1">
                <MessageSquare size={12} className="text-[var(--ink-2)]" /> 跟进记录与备忘
              </span>
              {isSaved && <span className="text-[11px] font-medium text-[var(--ink)] flex items-center gap-0.5"><CheckCheck size={10} /> 已存</span>}
            </div>

            <textarea 
              placeholder="记录沟通要点与进展..." 
              value={localFollowUp} 
              onChange={handleFollowUpChange}
              onBlur={handleFollowUpBlur}
              className="w-full h-20 text-[12px] p-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] outline-none resize-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)] leading-relaxed" 
            />

            <input 
              placeholder="备忘便签..." 
              value={localNote} 
              onChange={handleNoteChange}
              onBlur={handleNoteBlur}
              className="w-full text-[12px] px-2.5 py-1 bg-[var(--surface)] border border-[var(--line)] rounded-[12px] outline-none focus:border-[var(--ink)] text-[var(--ink)] placeholder-[var(--ink-3)]" 
            />
          </div>
        </div>
      </div>
    </div>
  );
});

LeadCardItem.displayName = 'LeadCardItem';

export const AnalysisTable: React.FC<AnalysisTableProps> = ({ 
  results, mode = 'batch', employees = [], 
  onUpdateAssignment, onUpdateFollowUp, onUpdateNote, onUpdateContactInfo,
  onUpdateSourceType,
  selectedIds, onToggleSelection, onToggleAll
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof AnalysisResult | 'score'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // 视图模式与宽度控制：在移动端优先默认展示更适于单手浏览的卡片流，桌面端默认宽幅表格
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });
  const [tableFitMode, setTableFitMode] = useState<'wide' | 'fit'>('wide'); 
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // 行内全景展开状态（支持一键全部展开与单行展开）
  const [expandAllRows, setExpandAllRows] = useState<boolean>(false);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // 列可见性控制
  const [visibleColumns, setVisibleColumns] = useState({
    identity: true,
    contacts: true,
    investigation: true,
    conclusion: true,
    strategy: true,
    actions: true
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // 档案全览抽屉状态与动态同步 (以 ID 追踪，确保编辑实时生效)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const activeLeadForDetail = useMemo(() => {
    if (!selectedLeadId) return null;
    return results.find(r => r.id === selectedLeadId) || null;
  }, [results, selectedLeadId]);

  // 分页状态管理
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 计算总可见列数 (包括第一列复选框)
  const totalVisibleCols = useMemo(() => {
    let count = 1;
    if (visibleColumns.identity) count++;
    if (visibleColumns.contacts) count++;
    if (visibleColumns.investigation) count++;
    if (visibleColumns.conclusion) count++;
    if (visibleColumns.strategy) count++;
    if (visibleColumns.actions) count++;
    return count;
  }, [visibleColumns]);

  const handleToggleRowExpand = useCallback((id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleExpandAll = useCallback(() => {
    if (expandAllRows) {
      setExpandAllRows(false);
      setExpandedRowIds(new Set());
    } else {
      setExpandAllRows(true);
      setExpandedRowIds(new Set(results.map(r => r.id)));
    }
  }, [expandAllRows, results]);

  const handleSort = (key: any) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleCopy = useCallback((item: AnalysisResult) => {
    const text = formatLeadForCopy(item);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleCopyAsRow = useCallback((item: AnalysisResult) => {
    const baseRowBeforeCountry: (string | number)[] = [item.serialNumber, item.name];
    if (item.jobTitle) {
      baseRowBeforeCountry.push(item.jobTitle);
    }
    
    if (item.currentlySelling && item.interestedCooperation) {
      baseRowBeforeCountry.push(item.currentlySelling);
      baseRowBeforeCountry.push(item.interestedCooperation);
    } else if (item.interestedCooperation || item.currentlySelling) {
      baseRowBeforeCountry.push(item.interestedCooperation || item.currentlySelling || '');
    }

    const actualType = item.actualBusinessType || translateBusinessTypeToChinese(item.businessType) || '待背调';
    const origType = item.originalBusinessType || '';

    const row = [
      ...baseRowBeforeCountry,
      item.country,
      item.companyNameMapping,
      actualType,
      origType,
      item.contactInfo?.email || '',
      item.contactInfo?.phone || '',
      item.contactInfo?.website || '',
      item.companyNature?.mainBusiness || '',
      item.companyNature?.scale || '',
      item.conclusion,
      item.productStrategy,
      item.assignedTo || '未分配',
      item.followUpRecord || '',
      item.note || ''
    ].join('\t');
    
    navigator.clipboard.writeText(row).then(() => {
      setCopiedRowId(item.id);
      setTimeout(() => setCopiedRowId(null), 2000);
    });
  }, []);

  // 排序
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortKey === 'score') {
        const scoreMap: Record<ConclusionStatus, number> = {
          [ConclusionStatus.STRONGLY_RECOMMEND]: 4,
          [ConclusionStatus.WORKABLE]: 3,
          [ConclusionStatus.CAUTION]: 2,
          [ConclusionStatus.ABANDON]: 1
        };
        const sA = scoreMap[a.conclusion as ConclusionStatus] || 0;
        const sB = scoreMap[b.conclusion as ConclusionStatus] || 0;
        return sortDir === 'asc' ? sA - sB : sB - sA;
      }
      const vA = a[sortKey as keyof AnalysisResult] ?? '';
      const vB = b[sortKey as keyof AnalysisResult] ?? '';
      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortKey, sortDir]);

  // 分页计算
  const totalItems = sortedResults.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / (pageSize as number));
  
  const paginatedResults = useMemo(() => {
    if (pageSize === 'all') return sortedResults;
    const start = (currentPage - 1) * pageSize;
    return sortedResults.slice(start, start + pageSize);
  }, [sortedResults, currentPage, pageSize]);

  // 当筛选结果改变重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  };

  const thStyle = "px-3 py-2.5 text-[12px] font-medium text-[var(--ink-2)] bg-[var(--surface-2)] border-b border-[var(--line)] whitespace-nowrap sticky top-0 z-30";
  
  // 原 19 列标准兼容导出（完全保持原有格式不变）
  const handleExportStandard19 = () => {
    if (results.length === 0) return;
    const exportData = results.map(item => formatLeadToStandard19Columns(item));

    exportDataToExcel(exportData, {
      filename: `标准19列背调明细_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '背调明细'
    });
  };

  // 全息扩展导出（包含 Meta 表单ID、5题问卷及会面优先级）
  const handleExportExtended = () => {
    if (results.length === 0) return;
    const exportData = results.map(item => formatLeadToExtendedColumns(item));

    exportDataToExcel(exportData, {
      filename: `全渠道全息线索导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '全息线索'
    });
  };

  return (
    <div className="harmony-card rounded-[20px] bg-[var(--surface)] border border-[var(--line)] flex flex-col min-h-[380px] lg:min-h-[440px] overflow-hidden">
      {/* 顶部工具栏 (设置高层级 relative z-20 防止被下方 sticky 表头遮挡拦截点击) */}
      <div className="px-4 py-3 border-b border-[var(--line)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 bg-[var(--surface)] relative z-20">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-[var(--glow-2)] shadow-[0_0_8px_var(--glow-2)]" />
              <span>分析结果明细</span>
              <span className="text-[12px] font-mono text-[var(--ink-2)] bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
                共 {totalItems} 条
              </span>
            </h3>
            <p className="text-[13px] text-[var(--ink-2)] font-normal">
              显示第 {paginatedResults.length > 0 ? (currentPage - 1) * (pageSize === 'all' ? totalItems : pageSize) + 1 : 0} - {pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems)} 条
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
          {/* 视图布局切换 (全胶囊) */}
          <div className="harmony-capsule-bg inline-flex items-center gap-1 p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer select-none ${
                viewMode === 'table' ? 'bg-[var(--ink)] text-white shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              title="表格视图"
            >
              <LayoutList size={13} />
              <span>表格视图</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer select-none ${
                viewMode === 'cards' ? 'bg-[var(--ink)] text-white shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              title="档案卡片视图"
            >
              <LayoutGrid size={13} />
              <span>档案卡片</span>
            </button>
          </div>

          {/* 表格专属控制 (全胶囊) */}
          {viewMode === 'table' && (
            <>
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className={`harmony-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer select-none ${
                  expandAllRows 
                    ? 'bg-[var(--ink)] text-white border-[var(--ink)]' 
                    : ''
                }`}
                title={expandAllRows ? '一键折叠全部详情' : '一键展开全部客户详情'}
              >
                {expandAllRows ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{expandAllRows ? '收起全部' : '展开详情'}</span>
              </button>

              <div className="flex items-center bg-[var(--surface)] px-2 py-1 rounded-full border border-[var(--line)] text-[12px]">
                <span className="text-[12px] text-[var(--ink-2)] mr-1 pl-1 font-normal select-none">宽度</span>
                <button
                  type="button"
                  onClick={() => setTableFitMode('wide')}
                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium transition-all cursor-pointer select-none ${
                    tableFitMode === 'wide' ? 'bg-[var(--ink)] text-white shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                  title="宽幅展示"
                >
                  宽幅
                </button>
                <button
                  type="button"
                  onClick={() => setTableFitMode('fit')}
                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium transition-all cursor-pointer select-none ${
                    tableFitMode === 'fit' ? 'bg-[var(--ink)] text-white shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                  title="自适应屏幕宽度"
                >
                  紧凑
                </button>
              </div>

              {/* 列自定义显示筛选器 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  className="harmony-btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer select-none"
                  title="自定义表格列显示"
                >
                  <Columns size={13} />
                  <span>列显示</span>
                  <ChevronDown size={11} />
                </button>

                {showColumnDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] rounded-[16px] elevation-float border border-[var(--line)] p-3 z-50 space-y-2">
                    <div className="text-[12px] font-medium text-[var(--ink-2)] px-1">自定义显示列</div>
                    <label className="flex items-center gap-2 text-[12px] font-normal text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-2)] p-1.5 rounded-[8px]">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.identity} 
                        onChange={e => setVisibleColumns(prev => ({ ...prev, identity: e.target.checked }))} 
                        className="rounded text-[var(--ink)] focus:ring-[var(--ink)] border-[var(--line)]"
                      />
                      <span>客户身份与企业</span>
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-normal text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-2)] p-1.5 rounded-[8px]">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.contacts} 
                        onChange={e => setVisibleColumns(prev => ({ ...prev, contacts: e.target.checked }))} 
                        className="rounded text-[var(--ink)] focus:ring-[var(--ink)] border-[var(--line)]"
                      />
                      <span>联络渠道</span>
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-normal text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-2)] p-1.5 rounded-[8px]">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.investigation} 
                        onChange={e => setVisibleColumns(prev => ({ ...prev, investigation: e.target.checked }))} 
                        className="rounded text-[var(--ink)] focus:ring-[var(--ink)] border-[var(--line)]"
                      />
                      <span>深度背调报告</span>
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-normal text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-2)] p-1.5 rounded-[8px]">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.conclusion} 
                        onChange={e => setVisibleColumns(prev => ({ ...prev, conclusion: e.target.checked }))} 
                        className="rounded text-[var(--ink)] focus:ring-[var(--ink)] border-[var(--line)]"
                      />
                      <span>评估结论/归属</span>
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-normal text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-2)] p-1.5 rounded-[8px]">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.strategy} 
                        onChange={e => setVisibleColumns(prev => ({ ...prev, strategy: e.target.checked }))} 
                        className="rounded text-[var(--ink)] focus:ring-[var(--ink)] border-[var(--line)]"
                      />
                      <span>销售策略</span>
                    </label>
                    <label className="flex items-center gap-2 text-[12px] font-normal text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-2)] p-1.5 rounded-[8px]">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.actions} 
                        onChange={e => setVisibleColumns(prev => ({ ...prev, actions: e.target.checked }))} 
                        className="rounded text-[var(--ink)] focus:ring-[var(--ink)] border-[var(--line)]"
                      />
                      <span>操作与跟进记录</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowColumnDropdown(false)}
                      className="w-full text-center text-[12px] font-medium text-white bg-[var(--ink)] py-1.5 rounded-full mt-1 cursor-pointer"
                    >
                      完成
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 每页数量切换 (全胶囊) */}
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink)] font-medium bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--line)]">
            <span className="text-[12px] text-[var(--ink-2)] font-normal select-none">每页</span>
            <select 
              value={pageSize} 
              onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent border-none text-[var(--ink)] font-medium cursor-pointer outline-none text-[12px]"
            >
              <option value={10}>10 条</option>
              <option value={25}>25 条</option>
              <option value={50}>50 条</option>
              <option value={100}>100 条</option>
              <option value="all">全部展示</option>
            </select>
          </div>

          {/* 导出表格按钮组合 (全胶囊，支持原19列标准导出与全息扩展导出) */}
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={handleExportStandard19}
              className="harmony-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full cursor-pointer select-none"
              title="导出严格兼容的原 19 列标准 Excel"
            >
              <Download size={13} />
              <span>原19列导出</span>
            </button>
            <button 
              type="button"
              onClick={handleExportExtended}
              className="harmony-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full cursor-pointer select-none text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500"
              title="导出包含 Meta 表单ID、5题问卷及会面优先级的全息 Excel"
            >
              <FileSpreadsheet size={13} />
              <span>全息扩展导出</span>
            </button>
          </div>
        </div>
      </div>

      {/* 表格 / 档案主体区 (设置 relative z-0 形成独立层叠上下文，防止内部吸顶表头溢出遮挡上方工具栏及下拉菜单) */}
      {viewMode === 'table' ? (
        <div ref={tableContainerRef} className="overflow-auto flex-1 custom-scrollbar w-full relative z-0 bg-[var(--surface)] laptop-table-scroll">
          <table className={`w-full ${tableFitMode === 'fit' ? 'min-w-[1020px]' : 'min-w-[1720px]'} border-separate border-spacing-0`}>
            <thead>
              <tr>
                {/* 1. 复选框与序号 */}
                <th className={`${thStyle} w-[54px] min-w-[54px] text-center sticky left-0 z-40 bg-[var(--surface-2)]`}>
                  <input 
                    type="checkbox" 
                    checked={paginatedResults.length > 0 && paginatedResults.every(r => selectedIds?.has(r.id))} 
                    onChange={onToggleAll} 
                    className="w-4 h-4 rounded border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] focus:ring-[var(--ink)] cursor-pointer"
                    title="全选当前列表"
                  />
                </th>

                {/* 2. 身份与识别 */}
                {visibleColumns.identity && (
                  <th className={`${thStyle} ${tableFitMode === 'fit' ? 'w-[22%] min-w-[210px]' : 'w-[290px] min-w-[270px]'} cursor-pointer hover:text-[var(--ink)] transition-colors`} onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1.5">
                      <span>客户身份与企业</span> 
                      <ArrowUpDown size={11} className="opacity-40"/>
                    </div>
                  </th>
                )}

                {/* 3. 联络渠道 */}
                {visibleColumns.contacts && (
                  <th className={`${thStyle} ${tableFitMode === 'fit' ? 'w-[14%] min-w-[150px]' : 'w-[190px] min-w-[170px]'}`}>
                    <div className="flex items-center gap-1.5">
                      <span>联络渠道</span>
                    </div>
                  </th>
                )}

                {/* 4. 联网深度背调报告 */}
                {visibleColumns.investigation && (
                  <th className={`${thStyle} ${tableFitMode === 'fit' ? 'w-[22%] min-w-[210px]' : 'w-[300px] min-w-[280px]'}`}>
                     <div className="flex items-center gap-1.5">
                       <span>深度背调报告</span>
                     </div>
                  </th>
                )}

                {/* 5. 评估结论与分配 */}
                {visibleColumns.conclusion && (
                  <th className={`${thStyle} ${tableFitMode === 'fit' ? 'w-[12%] min-w-[130px]' : 'w-[160px] min-w-[150px]'} cursor-pointer hover:text-[var(--ink)] transition-colors`} onClick={() => handleSort('score')}>
                     <div className="flex items-center gap-1.5">
                       <span>评估结论 / 负责人员</span> 
                       <ArrowUpDown size={11} className="opacity-40"/>
                     </div>
                  </th>
                )}

                {/* 6. 产品推销策略 */}
                {visibleColumns.strategy && (
                  <th className={`${thStyle} ${tableFitMode === 'fit' ? 'w-[18%] min-w-[190px]' : 'w-[290px] min-w-[270px]'}`}>
                    <div className="flex items-center gap-1.5">
                      <span>销售策略</span>
                    </div>
                  </th>
                )}

                {/* 7. 快捷操作与跟进记录 */}
                {visibleColumns.actions && (
                  <th className={`${thStyle} ${tableFitMode === 'fit' ? 'w-[12%] min-w-[130px]' : 'w-[180px] min-w-[160px]'}`}>
                    <div className="flex items-center gap-1.5">
                      <span>操作 / 跟进记录</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedResults.length > 0 ? (
                paginatedResults.map((item) => (
                  <LeadTableRow
                    key={item.id}
                    item={item}
                    isSelected={selectedIds?.has(item.id) || false}
                    isExpanded={expandedRowIds.has(item.id)}
                    density={density}
                    employees={employees}
                    tableFitMode={tableFitMode}
                    visibleColumns={visibleColumns}
                    totalVisibleCols={totalVisibleCols}
                    onToggleSelection={onToggleSelection}
                    onToggleExpand={handleToggleRowExpand}
                    onUpdateAssignment={onUpdateAssignment}
                    onUpdateFollowUp={onUpdateFollowUp}
                    onUpdateNote={onUpdateNote}
                    onCopyReport={handleCopy}
                    onCopyRow={handleCopyAsRow}
                    onOpenDetail={(target) => setSelectedLeadId(target.id)}
                    isCopiedReport={copiedId === item.id}
                    isCopiedRow={copiedRowId === item.id}
                  />
                ))
              ) : (
                /* 空状态：居中，var(--ink-3)，一句话 + 一句指引，不要插画 */
                <tr>
                  <td colSpan={totalVisibleCols} className="text-center py-20 bg-[var(--surface)]">
                    <p className="text-[14px] font-normal text-[var(--ink-3)]">未发现符合条件的档案</p>
                    <p className="text-[13px] font-normal text-[var(--ink-3)] mt-1">请尝试更换搜索关键字或重置筛选条件</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* 档案卡片流模式 */
        <div ref={tableContainerRef} className="overflow-auto flex-1 custom-scrollbar p-4 space-y-3 bg-[var(--surface-2)]">
          {paginatedResults.length > 0 ? (
            paginatedResults.map((item) => (
              <LeadCardItem
                key={item.id}
                item={item}
                isSelected={selectedIds?.has(item.id) || false}
                employees={employees}
                onToggleSelection={onToggleSelection}
                onUpdateAssignment={onUpdateAssignment}
                onUpdateFollowUp={onUpdateFollowUp}
                onUpdateNote={onUpdateNote}
                onCopyReport={handleCopy}
                onCopyRow={handleCopyAsRow}
                onOpenDetail={(target) => setSelectedLeadId(target.id)}
                isCopiedReport={copiedId === item.id}
                isCopiedRow={copiedRowId === item.id}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-[var(--surface)] rounded-[20px] border border-[var(--line)]">
              <p className="text-[14px] font-normal text-[var(--ink-3)]">未发现符合条件的档案</p>
              <p className="text-[13px] font-normal text-[var(--ink-3)] mt-1">请尝试更换搜索关键字或重置筛选条件</p>
            </div>
          )}
        </div>
      )}

      {/* 分页导航栏 */}
      {pageSize !== 'all' && totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[12px] text-[var(--ink-2)] font-normal">
            第 <span className="font-semibold text-[var(--ink)]">{currentPage}</span> / <span className="font-semibold text-[var(--ink)]">{totalPages}</span> 页，
            共 <span className="font-semibold text-[var(--ink)]">{totalItems}</span> 条数据
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="首页"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 text-[12px] font-medium px-3"
            >
              <ChevronLeft size={14} /> 上一页
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => {
                  const isCurrent = p === currentPage;
                  const prev = arr[i - 1];
                  const hasGap = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {hasGap && <span className="px-1 text-[12px] text-[var(--ink-3)]">...</span>}
                      <button
                        onClick={() => handlePageChange(p as number)}
                        className={`min-w-[32px] h-8 px-2.5 rounded-full text-[12px] font-medium transition-colors ${
                          isCurrent
                            ? 'bg-[var(--ink)] text-white'
                            : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 text-[12px] font-medium px-3"
            >
              下一页 <ChevronRight size={14} />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="末页"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 完整档案详情侧边抽屉 (100% 深度全息展示，支持联络方式直接编辑保存与手动来源标记) */}
      <LeadDetailDrawer
        item={activeLeadForDetail}
        employees={employees}
        onClose={() => setSelectedLeadId(null)}
        onUpdateAssignment={onUpdateAssignment}
        onUpdateFollowUp={onUpdateFollowUp}
        onUpdateNote={onUpdateNote}
        onUpdateContactInfo={onUpdateContactInfo}
        onUpdateSourceType={onUpdateSourceType}
        onCopyReport={handleCopy}
        onCopyRow={handleCopyAsRow}
        isCopiedReport={copiedId === activeLeadForDetail?.id}
        isCopiedRow={copiedRowId === activeLeadForDetail?.id}
      />
    </div>
  );
};
export default AnalysisTable;
