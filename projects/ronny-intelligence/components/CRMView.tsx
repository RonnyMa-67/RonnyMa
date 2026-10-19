import React, { useState, useMemo, useDeferredValue } from 'react';
import { AnalysisResult, ConclusionStatus, ContactInfo } from '../types';
import { AnalysisTable, formatLeadForCopy } from './AnalysisTable';
import { translateBusinessTypeToChinese } from '../services/geminiService';
import { 
  Search, Filter, Trash2, Download, Users, CheckSquare, 
  Plus, X, FileSpreadsheet, Check, ChevronDown, Calendar, Copy 
} from 'lucide-react';
import { StatsDashboard, DashboardFilter, matchDashboardFilter } from './StatsDashboard';
import { exportDataToExcel, formatLeadToStandard19Columns, formatLeadToExtendedColumns } from '../services/excelExport';
import { getCountryVisual, normalizeCountryName } from '../utils/countryUtils';
import { LeadSourceType } from '../types';

interface CRMViewProps {
  history: AnalysisResult[];
  onImportSource?: (source: LeadSourceType) => void;
  employees: string[];
  initialSourceFilter?: string;
  onClearHistory: () => void;
  onUpdateAssignment: (id: string, employee: string) => void;
  onBatchAssign: (ids: string[], employee: string) => void;
  onUpdateFollowUp: (id: string, record: string) => void;
  onBatchUpdateFollowUp: (ids: string[], record: string) => void;
  onBatchUpdateNote: (ids: string[], note: string) => void;
  onUpdateContactInfo: (id: string, contactInfo: ContactInfo) => void;
  onUpdateNote: (id: string, note: string) => void;
  onUpdateSourceType?: (id: string, sourceType: LeadSourceType) => void;
  onBatchUpdateSourceType?: (ids: string[], sourceType: LeadSourceType) => void;
  onAddEmployee: (name: string) => void;
  onRemoveEmployee: (name: string) => void;
}

const EXPORT_GROUPS = [
  { id: 'basic', label: '基本信息', fields: ['序号', '日期', '负责员工'] },
  { id: 'identity', label: '客户身份', fields: ['姓名', '国家', '业务类型'] },
  { id: 'contact', label: '联系信息', fields: ['邮箱', '电话', 'WhatsApp', '网站'] },
  { id: 'background', label: '背调详情', fields: ['主营业务', '规模 (含采购力)'] },
  { id: 'strategy', label: '策略与备注', fields: ['结论', '产品策略', '跟进记录'] },
  { id: 'meta', label: 'Meta 广告与五题问卷', fields: ['渠道分类', 'Meta ID', '表单ID/活动ID', 'Q1-Q5问卷明细', '会面优先级'] }
];

export const CRMView: React.FC<CRMViewProps> = ({ 
  history,
  onImportSource, 
  employees,
  initialSourceFilter = '全部',
  onClearHistory, 
  onUpdateAssignment,
  onBatchAssign,
  onBatchUpdateFollowUp,
  onBatchUpdateNote,
  onUpdateContactInfo,
  onUpdateNote,
  onUpdateFollowUp,
  onUpdateSourceType,
  onBatchUpdateSourceType,
  onAddEmployee,
  onRemoveEmployee
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);

  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [employeeFilter, setEmployeeFilter] = useState<string>('全部');
  const [countryFilter, setCountryFilter] = useState<string>('全部');
  const [sourceFilter, setSourceFilter] = useState<string>(initialSourceFilter);
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchEmployee, setBatchEmployee] = useState(employees[0] || '未分配');
  const [batchNote, setBatchNote] = useState('');
  const [batchSource, setBatchSource] = useState<LeadSourceType>('exhibition');
  const [isCopiedBatch, setIsCopiedBatch] = useState(false);

  const [showEmployeeManager, setShowEmployeeManager] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  // 导出弹窗状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [selectedExportGroups, setSelectedExportGroups] = useState<Set<string>>(new Set(['basic', 'identity', 'contact', 'background', 'strategy']));

  // 辅助获取国家
  const getCountry = (item: AnalysisResult) => {
    return normalizeCountryName(item.country) || '其他地区';
  };

  // 动态构建筛选项列表 (带归一化标准国名)
  const uniqueCountries = useMemo(() => {
    const s = new Set<string>();
    history.forEach(i => {
      const c = normalizeCountryName(i.country);
      if (c && c !== '未知' && c !== '未知地区' && c !== '全球/未公开') s.add(c);
    });
    return Array.from(s).sort();
  }, [history]);

  const uniqueBusinessTypes = useMemo(() => {
    const s = new Set<string>();
    history.forEach(i => {
      const t = i.actualBusinessType || translateBusinessTypeToChinese(i.businessType);
      if (t) s.add(t);
    });
    return Array.from(s).sort();
  }, [history]);

  const uniqueEmployees = useMemo(() => {
    return ['未分配', ...employees];
  }, [employees]);

  // 各专区动态线索实时统计
  const exhibitionCount = useMemo(() => history.filter(i => i.sourceType === 'exhibition').length, [history]);
  const metaDailyCount = useMemo(() => history.filter(i => i.sourceType === 'meta_daily').length, [history]);
  const generalCount = useMemo(() => history.filter(i => i.sourceType === 'general').length, [history]);
  const pendingCount = useMemo(() => history.filter(i => i.sourceType === 'pending_confirmation' || !i.sourceType).length, [history]);

  // 展会会面意向分布统计
  const guangzhouMeetingCount = useMemo(() => history.filter(i => i.sourceType === 'exhibition' && (i.fiveQuestions?.meetingChoice === 'guangzhou' || i.fiveQuestions?.q3MeetingPreference?.includes('广州') || i.fiveQuestions?.q3MeetingPreference?.includes('广交会'))).length, [history]);
  const dubaiMeetingCount = useMemo(() => history.filter(i => i.sourceType === 'exhibition' && (i.fiveQuestions?.meetingChoice === 'dubai' || i.fiveQuestions?.q3MeetingPreference?.toLowerCase().includes('dubai'))).length, [history]);
  const onlineMeetingCount = useMemo(() => history.filter(i => i.sourceType === 'exhibition' && (i.fiveQuestions?.meetingChoice === 'online' || i.fiveQuestions?.q3MeetingPreference?.toLowerCase().includes('online'))).length, [history]);

  // 快捷标准 19 列导出与全量扩展导出
  const handleExportQuick = (mode: 'standard19' | 'extended') => {
    if (filteredData.length === 0) {
      alert('当前筛选条件下没有可导出的数据');
      return;
    }
    const rows = filteredData.map(item => 
      mode === 'standard19' ? formatLeadToStandard19Columns(item) : formatLeadToExtendedColumns(item)
    );
    const prefix = sourceFilter === 'exhibition' ? 'Exhibition_Leads_' : sourceFilter === 'meta_daily' ? 'Meta_Daily_Leads_' : 'Leads_Report_';
    const typeName = mode === 'standard19' ? '19列标准' : '全量扩展';
    exportDataToExcel(rows, {
      filename: `${prefix}${typeName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: sourceFilter === 'exhibition' ? '展会推广线索' : sourceFilter === 'meta_daily' ? '日常Meta推广' : '客户背调报告'
    });
  };

  // 多维筛选计算 (工具栏筛选 + 看板点击交互下钻联动)
  const filteredData = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    return history.filter(item => {
      // 1. 看板卡片联动筛选 (点击看板任意元素直接下钻或快速筛选侧栏多维组合)
      if (dashboardFilter && !matchDashboardFilter(item, dashboardFilter)) {
        return false;
      }

      // 2. 关键词模糊匹配
      if (term) {
        const companyMatch = item.companyNameMapping?.toLowerCase().includes(term);
        const followUpMatch = item.followUpRecord?.toLowerCase().includes(term);
        const noteMatch = item.note?.toLowerCase().includes(term);
        const nameMatch = item.name?.toLowerCase().includes(term);
        const countryMatch = item.country?.toLowerCase().includes(term);
        const emailMatch = item.contactInfo?.email?.toLowerCase().includes(term);
        const phoneMatch = item.contactInfo?.phone?.toLowerCase().includes(term);
        const snMatch = String(item.serialNumber).includes(term);
        const mainMatch = item.companyNature?.mainBusiness?.toLowerCase().includes(term);

        if (!companyMatch && !followUpMatch && !noteMatch && !nameMatch && !countryMatch && !emailMatch && !phoneMatch && !snMatch && !mainMatch) {
          return false;
        }
      }

      // 3. 结论筛选
      if (statusFilter !== '全部' && item.conclusion !== statusFilter) {
        return false;
      }

      // 4. 业务类型筛选
      if (typeFilter !== '全部') {
        const actualType = item.actualBusinessType || translateBusinessTypeToChinese(item.businessType);
        if (actualType !== typeFilter) return false;
      }

      // 5. 负责人筛选
      if (employeeFilter !== '全部') {
        const emp = item.assignedTo || '未分配';
        if (emp !== employeeFilter) return false;
      }

      // 6. 国家筛选
      if (countryFilter !== '全部') {
        const c = normalizeCountryName(item.country);
        if (c !== normalizeCountryName(countryFilter)) return false;
      }

      // 7. 渠道专区筛选 (展会推广 / 日常 Meta 推广 / 通用背调 / 待确认)
      if (sourceFilter !== '全部') {
        const src = item.sourceType || 'pending_confirmation';
        if (src !== sourceFilter) return false;
      }

      return true;
    });
  }, [history, deferredSearch, dashboardFilter, statusFilter, typeFilter, employeeFilter, countryFilter, sourceFilter]);

  const handleToggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(i => i.id)));
    }
  };

  const handleBatchCopy = () => {
    const selectedItems = history.filter(i => selectedIds.has(i.id));
    if (selectedItems.length === 0) return;

    const report = selectedItems.map(item => formatLeadForCopy(item)).join('\n\n================================\n\n');
    navigator.clipboard.writeText(report).then(() => {
      setIsCopiedBatch(true);
      setTimeout(() => setIsCopiedBatch(false), 2000);
    });
  };

  // 执行高级导出
  const executeExport = () => {
    let dataToExport = history;

    if (exportStartDate || exportEndDate) {
      dataToExport = dataToExport.filter(item => {
        const itemDate = new Date(item.timestamp).toISOString().slice(0, 10);
        if (exportStartDate && itemDate < exportStartDate) return false;
        if (exportEndDate && itemDate > exportEndDate) return false;
        return true;
      });
    }

    if (selectedIds.size > 0) {
      dataToExport = dataToExport.filter(item => selectedIds.has(item.id));
    }

    if (dataToExport.length === 0) {
      alert('所选条件未匹配到任何数据');
      return;
    }

    const columns: { header: string, accessor: (item: AnalysisResult) => any }[] = [];

    if (selectedExportGroups.has('basic')) {
      columns.push({ header: '序号', accessor: i => i.serialNumber });
      columns.push({ header: '日期', accessor: i => new Date(i.timestamp).toLocaleDateString() });
      columns.push({ header: '负责员工', accessor: i => i.assignedTo || '未分配' });
    }
    if (selectedExportGroups.has('identity')) {
      columns.push({ header: '姓名', accessor: i => i.name });
      columns.push({ header: '职位', accessor: i => i.jobTitle || '' });
      columns.push({ header: '表单选项1 (品类/现售)', accessor: i => i.currentlySelling || '' });
      columns.push({ header: '表单选项2 (合作意向)', accessor: i => i.interestedCooperation || '' });
      columns.push({ header: '国家', accessor: i => getCountry(i) });
      columns.push({ header: '映射全称', accessor: i => i.companyNameMapping });
      columns.push({ header: '实际类型', accessor: i => i.actualBusinessType || translateBusinessTypeToChinese(i.businessType) });
      columns.push({ header: '业务类型', accessor: i => i.originalBusinessType || '' });
    }
    if (selectedExportGroups.has('contact')) {
      columns.push({ header: '邮箱', accessor: i => i.contactInfo?.email });
      columns.push({ header: '电话', accessor: i => i.contactInfo?.phone });
      columns.push({ header: 'WhatsApp', accessor: i => i.whatsappNumber || '' });
      columns.push({ header: '网站', accessor: i => i.contactInfo?.website });
    }
    if (selectedExportGroups.has('background')) {
      columns.push({ header: '主营业务', accessor: i => i.companyNature?.mainBusiness || '' });
      columns.push({ header: '规模', accessor: i => i.companyNature?.scale || '' });
    }
    if (selectedExportGroups.has('strategy')) {
      columns.push({ header: '结论', accessor: i => i.conclusion });
      columns.push({ header: '产品策略', accessor: i => i.productStrategy });
      columns.push({ header: '跟进记录', accessor: i => i.followUpRecord });
    }
    if (selectedExportGroups.has('meta')) {
      columns.push({ header: '线索专区分类', accessor: i => i.sourceType === 'exhibition' ? '展会推广' : i.sourceType === 'meta_daily' ? '日常Meta产品推广' : (!i.sourceType || i.sourceType === 'pending_confirmation') ? '待确认来源' : '通用背调' });
      columns.push({ header: 'Meta Lead ID', accessor: i => i.metaLeadId || i.meta?.leadId || '' });
      columns.push({ header: '表单ID (Form ID)', accessor: i => i.meta?.formId || '' });
      columns.push({ header: '表单名称 (Form Name)', accessor: i => i.meta?.formName || '' });
      columns.push({ header: '广告活动ID (Campaign ID)', accessor: i => i.meta?.campaignId || '' });
      columns.push({ header: '广告活动名称 (Campaign Name)', accessor: i => i.meta?.campaignName || '' });
      columns.push({ header: 'Messenger收件箱URL', accessor: i => i.inboxUrl || i.meta?.inboxUrl || '' });
      columns.push({ header: 'Q1自报业务类型(需核验)', accessor: i => i.fiveQuestions?.q1BusinessDescription || '未填写' });
      columns.push({ header: 'Q2产品兴趣(仅意向)', accessor: i => i.fiveQuestions?.q2ProductsInterested || '未填写' });
      columns.push({ header: 'Q3会面地点意向', accessor: i => i.fiveQuestions?.q3MeetingPreference || '未填写' });
      columns.push({ header: 'Q4自报月采购量(仅辅助优先级)', accessor: i => i.fiveQuestions?.q4EstimatedMonthlyVolume || '未填写' });
      columns.push({ header: 'Q5主要服务市场(非注册国)', accessor: i => i.fiveQuestions?.q5MainMarketServed || '未填写' });
      columns.push({ header: '会面跟进优先级', accessor: i => i.meetingPriority === 'high' ? '重点优先' : i.meetingPriority === 'medium' ? '常规跟进' : i.meetingPriority === 'online_only' ? '优先线上' : '标准' });
    }

    const exportData = dataToExport.map(item => {
      const row: any = {};
      columns.forEach(col => {
        row[col.header] = col.accessor(item) || '';
      });
      return row;
    });

    exportDataToExcel(exportData, {
      filename: `Ronny_AI_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '背调数据'
    });
    setShowExportModal(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-10">
      {/* 顶部统计卡片 (支持快速点击下钻筛选 + 紧凑缩排) */}
      <StatsDashboard 
        results={sourceFilter === '全部' ? history : history.filter(item => (item.sourceType || 'pending_confirmation') === sourceFilter)} 
        activeFilter={dashboardFilter}
        onFilterChange={setDashboardFilter}
      />

      {/* 批量操作浮动工具栏 */}
      {selectedIds.size > 0 && (
        <div className="rounded-[20px] p-3 sm:p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2.5 sm:gap-3.5 bg-[var(--surface-float)] text-[var(--ink)] border border-[var(--line)] elevation-float">
           <div className="flex items-center gap-2.5 font-medium shrink-0">
             <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
               <CheckSquare size={15} strokeWidth={2} />
             </div>
             <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[var(--ink)]">已选 <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{selectedIds.size}</span> 条客户档案</span>
                <button onClick={() => setSelectedIds(new Set())} className="text-left text-[11px] font-normal text-[var(--ink-2)] hover:text-rose-500 transition-colors cursor-pointer">取消全选</button>
             </div>
           </div>
           
           <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full xl:w-auto">
             <button 
                onClick={handleBatchCopy}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isCopiedBatch 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                }`}
             >
                {isCopiedBatch ? <Check size={13} /> : <Copy size={13} />}
                <span>{isCopiedBatch ? '已复制报告' : '复制背调简报'}</span>
             </button>

             <button 
                onClick={() => setShowExportModal(true)}
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
             >
                <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>批量导出表格</span>
             </button>

             <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 flex-1 sm:flex-none">
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium shrink-0">分配</span>
                <select 
                  value={batchEmployee} 
                  onChange={(e) => setBatchEmployee(e.target.value)}
                  className="bg-transparent border-none text-[var(--ink)] text-[12px] font-medium py-0.5 cursor-pointer outline-none min-w-0"
                >
                    {employees.map(emp => <option key={emp} value={emp} className="bg-[var(--surface-float)] text-[var(--ink)]">{emp}</option>)}
                </select>
                <button onClick={() => onBatchAssign(Array.from(selectedIds), batchEmployee)} className="bg-purple-500 text-white hover:bg-purple-600 font-medium text-[11px] px-2.5 py-0.5 rounded-full shrink-0 cursor-pointer">确认</button>
             </div>

             {/* 批量标记来源（旧记录支持手动打标，不自动迁移） */}
             {onBatchUpdateSourceType && (
               <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex-1 sm:flex-none">
                 <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0">标记来源</span>
                 <select 
                   value={batchSource} 
                   onChange={(e) => setBatchSource(e.target.value as LeadSourceType)}
                   className="bg-transparent border-none text-[var(--ink)] text-[12px] font-medium py-0.5 cursor-pointer outline-none min-w-0"
                 >
                   <option value="exhibition" className="bg-[var(--surface-float)] text-[var(--ink)]">🏛️ 展会推广</option>
                   <option value="meta_daily" className="bg-[var(--surface-float)] text-[var(--ink)]">📢 日常 Meta</option>
                   <option value="general" className="bg-[var(--surface-float)] text-[var(--ink)]">🔍 通用背调</option>
                   <option value="pending_confirmation" className="bg-[var(--surface-float)] text-[var(--ink)]">⏳ 待确认</option>
                 </select>
                 <button 
                   onClick={() => onBatchUpdateSourceType(Array.from(selectedIds), batchSource)} 
                   className="bg-blue-500 text-white hover:bg-blue-600 font-medium text-[11px] px-2.5 py-0.5 rounded-full shrink-0 cursor-pointer"
                 >
                   应用
                 </button>
               </div>
             )}

             <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex-grow">
               <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium shrink-0">备注</span>
               <input 
                  type="text" 
                  value={batchNote}
                  onChange={(e) => setBatchNote(e.target.value)}
                  placeholder="批量追加跟进备注..."
                  className="w-full border-none bg-transparent text-[12px] text-[var(--ink)] placeholder-[var(--ink-3)] font-normal outline-none py-0.5 min-w-0"
               />
               <button onClick={() => { onBatchUpdateNote(Array.from(selectedIds), batchNote); setBatchNote(''); }} className="bg-amber-500 text-white hover:bg-amber-600 font-medium text-[11px] px-2.5 py-0.5 rounded-full shrink-0 cursor-pointer">保存</button>
             </div>
           </div>
        </div>
      )}

      {onImportSource && <button onClick={() => onImportSource(sourceFilter === 'exhibition' ? 'exhibition' : sourceFilter === 'meta_daily' ? 'meta_daily' : 'pending_confirmation')} className="harmony-btn-primary px-4 py-2">导入本专区线索</button>}
      {/* 专区专享胶囊快速切换栏 (全部 / 展会推广专区 / 日常 Meta 推广 / 通用背调 / 待确认) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[var(--surface)] p-2.5 sm:p-3 rounded-[20px] border border-[var(--line)]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: '全部', label: '全部档案', icon: '📁', count: history.length },
            { id: 'exhibition', label: '展会推广专区', icon: '🏛️', count: exhibitionCount },
            { id: 'meta_daily', label: '日常 Meta 产品推广', icon: '📢', count: metaDailyCount },
            { id: 'general', label: '通用背调', icon: '🔍', count: generalCount },
            { id: 'pending_confirmation', label: '待确认来源', icon: '⏳', count: pendingCount }
          ].map(tab => {
            const isActive = sourceFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSourceFilter(tab.id);
                  if (dashboardFilter) setDashboardFilter(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--ink)] text-white shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] border border-[var(--line)]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface)] text-[var(--ink-2)]'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 快捷标准 19 列导出与全量扩展导出 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportQuick('standard19')}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
            title="严格导出标准 19 列兼容 Excel（格式完全保持原有标准）"
          >
            <Download size={12} />
            <span>标准 19 列导出</span>
          </button>
          <button
            onClick={() => handleExportQuick('extended')}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
            title="导出全量扩展表格（包含 5 题问卷明细、Meta 追溯 ID 及 WhatsApp 独立号码）"
          >
            <FileSpreadsheet size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span>全量扩展导出</span>
          </button>
        </div>
      </div>

      {/* 展会推广专区专属业务看板 */}
      {sourceFilter === 'exhibition' && (
        <div className="rounded-[20px] p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 border border-purple-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-500/15">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🏛️</span>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">展会推广专区 (Exhibition Campaign Hub)</h3>
                <p className="text-[11px] text-[var(--ink-2)]">
                  演示表单: <span className="font-mono text-[var(--ink)]">虚构展会演示表单</span> (form_id: <span className="font-mono text-purple-700 dark:text-purple-300">demo_exhibition_form</span> · campaign_id: <span className="font-mono text-purple-700 dark:text-purple-300">demo_exhibition_campaign</span>)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/15 px-2.5 py-1 rounded-full border border-purple-500/30 font-medium">
                展会线索共 {exhibitionCount} 条
              </span>
            </div>
          </div>

          {/* 会面意向分布与核心规则 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
            <div className="p-2.5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-[11px] text-[var(--ink-2)] mb-0.5">广州广交会赴会 (10.15-19)</div>
              <div className="text-[14px] font-bold text-[var(--ink)] flex items-center justify-between">
                <span>{guangzhouMeetingCount} 家</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">展前/展期邀约</span>
              </div>
            </div>
            <div className="p-2.5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-[11px] text-[var(--ink-2)] mb-0.5">Dubai 展会会面意向</div>
              <div className="text-[14px] font-bold text-[var(--ink)] flex items-center justify-between">
                <span>{dubaiMeetingCount} 家</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">迪拜现场洽谈</span>
              </div>
            </div>
            <div className="p-2.5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-[11px] text-[var(--ink-2)] mb-0.5">优先 1v1 线上视频会议</div>
              <div className="text-[14px] font-bold text-[var(--ink)] flex items-center justify-between">
                <span>{onlineMeetingCount} 家</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">视频演示优先</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-purple-500/20 text-[11px] text-[var(--ink-2)] leading-relaxed">
            <span className="font-semibold text-purple-700 dark:text-purple-300">五题规则与跟进要点：</span>
            <span>Q1自报业务须核验真实主体；Q2感兴趣产品代表兴趣意向而非已采购；Q3严格尊重客户各自会面选择；Q4自报月采购量仅辅助现场接待优先级，不覆盖 V5 硬规则；Q5主要服务市场非注册国；严禁无依据声称展位号、样机或高管已预留。</span>
          </div>
        </div>
      )}

      {/* 日常 Meta 产品推广专区专属业务看板 */}
      {sourceFilter === 'meta_daily' && (
        <div className="rounded-[20px] p-4 bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-blue-500/10 border border-blue-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-500/15">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">📢</span>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">日常 Meta 产品推广专区 (Daily Meta Product Promotion)</h3>
                <p className="text-[11px] text-[var(--ink-2)]">
                  覆盖日常 Meta 信息流广告、Messenger 闭环与常规产品线表单询盘
                </p>
              </div>
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-full border border-blue-500/30 font-medium">
              日常推广线索共 {metaDailyCount} 条
            </span>
          </div>

          <div className="p-2.5 rounded-[12px] bg-[var(--surface)] border border-blue-500/20 text-[11px] text-[var(--ink-2)] leading-relaxed">
            <span className="font-semibold text-blue-700 dark:text-blue-300">日常跟进规范：</span>
            <span>日常线索始终聚焦客户真实产品需求、经营场景核验、阶梯美金报价与样机测试推进；绝不因系统当前日期盲目切换广交会邀约话术；坚持事实核验，不虚假承诺已留样机、认证或特价。</span>
          </div>
        </div>
      )}

      {/* 搜索与多维筛选工具栏 */}
      <div className="harmony-card rounded-[20px] p-3 sm:p-4 relative z-20 border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col xl:flex-row gap-2.5 sm:gap-3 items-stretch xl:items-center justify-between">
            {/* 实时搜索栏 */}
            <div className="relative flex-1 min-w-0 max-w-xl">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]'}`} size={15} />
                <input
                    type="text"
                    placeholder="实时搜索公司名称、跟进记录、客户姓名或主营业务..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-20 py-2 rounded-[12px] border border-[var(--line)] focus:border-[var(--ink)] text-[13px] outline-none bg-[var(--surface-2)] focus:bg-[var(--surface)] font-normal text-[var(--ink)] placeholder-[var(--ink-3)] transition-colors"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchTerm && (
                    <>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]">
                        {filteredData.length}条
                      </span>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1 rounded-full hover:bg-[var(--surface-2)] transition-colors"
                        title="清空搜索"
                      >
                        <X size={13} />
                      </button>
                    </>
                  )}
                </div>
            </div>

            {/* 筛选项与操作按钮（一律全胶囊，默认白底灰字，激活 var(--ink) 底白字） */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center shrink-0">
                  <Filter size={13} strokeWidth={2} />
                </div>
                
                {/* 专区来源快速筛选 */}
                <div className="relative shrink-0">
                  <select
                    value={sourceFilter}
                    onChange={(e) => {
                      setSourceFilter(e.target.value);
                      if (dashboardFilter) setDashboardFilter(null);
                    }}
                    className={`appearance-none pl-3 pr-7 py-1.5 rounded-full border text-[12px] font-medium outline-none cursor-pointer transition-colors ${
                      sourceFilter !== '全部' 
                        ? 'bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs' 
                        : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--ink-3)] text-[var(--ink-2)]'
                    }`}
                  >
                    <option value="全部" className="bg-[var(--surface)] text-[var(--ink)]">全部专区</option>
                    <option value="exhibition" className="bg-[var(--surface)] text-[var(--ink)]">🏛️ 展会推广</option>
                    <option value="meta_daily" className="bg-[var(--surface)] text-[var(--ink)]">📢 日常 Meta 推广</option>
                    <option value="general" className="bg-[var(--surface)] text-[var(--ink)]">🔍 通用背调</option>
                    <option value="pending_confirmation" className="bg-[var(--surface)] text-[var(--ink)]">⏳ 待确认来源</option>
                  </select>
                  <ChevronDown size={11} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${sourceFilter !== '全部' ? 'text-white' : 'text-[var(--ink-2)]'}`}/>
                </div>

                {[
                    { val: countryFilter, set: setCountryFilter, opts: uniqueCountries, label: "国家" },
                    { val: typeFilter, set: setTypeFilter, opts: uniqueBusinessTypes, label: "业务" },
                    { val: statusFilter, set: setStatusFilter, opts: Object.values(ConclusionStatus), label: "结论" },
                    { val: employeeFilter, set: setEmployeeFilter, opts: uniqueEmployees, label: "负责人" }
                ].map((f, i) => (
                    <div key={i} className="relative shrink-0">
                        <select 
                            value={f.val}
                            onChange={(e) => {
                              f.set(e.target.value);
                              // 若手动切换下拉框，清除看板下钻项避免冲突
                              if (dashboardFilter) setDashboardFilter(null);
                            }}
                            className={`appearance-none pl-3 pr-7 py-1.5 rounded-full border text-[12px] font-medium outline-none cursor-pointer transition-colors ${
                              f.val !== '全部' 
                                ? 'bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs' 
                                : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--ink-3)] text-[var(--ink-2)]'
                            }`}
                        >
                            <option value="全部" className="bg-[var(--surface)] text-[var(--ink)]">全部{f.label}</option>
                            {f.opts.map((o: any) => {
                              if (f.label === '国家') {
                                const visual = getCountryVisual(o);
                                return (
                                  <option key={o} value={o} className="bg-[var(--surface)] text-[var(--ink)]">
                                    {visual.flag} {visual.label}
                                  </option>
                                );
                              }
                              if (f.label === '结论') {
                                const marker = o === ConclusionStatus.STRONGLY_RECOMMEND 
                                  ? '🌟 ' 
                                  : o === ConclusionStatus.WORKABLE 
                                    ? '✅ ' 
                                    : o === ConclusionStatus.CAUTION 
                                      ? '⚠️ ' 
                                      : '🚫 ';
                                return (
                                  <option key={o} value={o} className="bg-[var(--surface)] text-[var(--ink)]">
                                    {marker}{o}
                                  </option>
                                );
                              }
                              return <option key={o} value={o} className="bg-[var(--surface)] text-[var(--ink)]">{o}</option>;
                            })}
                        </select>
                        <ChevronDown size={11} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${f.val !== '全部' ? 'text-white' : 'text-[var(--ink-2)]'}`}/>
                    </div>
                ))}

                <div className="h-4 w-px bg-[var(--line)] mx-0.5 shrink-0 hidden xs:block sm:block"></div>

                {/* 团队成员管理 (胶囊按钮) */}
                <div className="relative">
                  <button 
                      onClick={() => setShowEmployeeManager(!showEmployeeManager)}
                      className={`harmony-btn-secondary flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                        showEmployeeManager 
                          ? 'bg-[var(--ink)] text-white border-[var(--ink)]' 
                          : ''
                      }`}
                      title="管理销售团队分配人员名单"
                  >
                      <Users size={13} />
                      <span className="hidden xs:inline sm:inline">人员配置</span>
                  </button>

                  {showEmployeeManager && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface)] rounded-[20px] elevation-float border border-[var(--line)] z-50 p-4 animate-in fade-in shadow-xl">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-[var(--ink)] text-[13px] flex items-center gap-1.5">
                              <Users size={14} className="text-blue-500" />
                              团队人员配置
                            </h4>
                            <button onClick={() => setShowEmployeeManager(false)} className="w-6 h-6 rounded-full hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer">
                              <X size={14} />
                            </button>
                          </div>
                          <div className="space-y-1.5 mb-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                              {employees.map(emp => {
                                const colors = [
                                  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
                                  'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
                                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
                                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
                                  'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
                                ];
                                let hash = 0;
                                for (let c = 0; c < emp.length; c++) hash = emp.charCodeAt(c) + ((hash << 5) - hash);
                                const empStyle = emp === '未分配' 
                                  ? 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--line)]' 
                                  : colors[Math.abs(hash) % colors.length];

                                return (
                                  <div key={emp} className={`flex items-center justify-between text-[12px] px-3 py-1.5 rounded-full border ${empStyle}`}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-[var(--surface)] text-[var(--ink)] font-bold text-[10px] flex items-center justify-center border border-black/5 shadow-xs">
                                          {emp.slice(0, 1)}
                                        </div>
                                        <span className="font-medium">{emp}</span>
                                      </div>
                                      {emp !== '未分配' && (
                                        <button onClick={() => onRemoveEmployee(emp)} className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1 rounded-full transition-colors cursor-pointer" title="移除该员工">
                                          <X size={12} />
                                        </button>
                                      )}
                                  </div>
                                );
                              })}
                          </div>
                          <form onSubmit={(e) => { e.preventDefault(); if(newEmployeeName.trim()) { onAddEmployee(newEmployeeName.trim()); setNewEmployeeName(''); } }} className="flex gap-2 border-t border-[var(--line)] pt-3">
                              <input 
                                value={newEmployeeName} 
                                onChange={e => setNewEmployeeName(e.target.value)} 
                                placeholder="输入新成员姓名" 
                                className="flex-1 text-[12px] px-3 py-1.5 border border-[var(--line)] rounded-full bg-[var(--surface-2)] outline-none focus:border-blue-500 text-[var(--ink)] placeholder-[var(--ink-3)]"
                              />
                              <button type="submit" className="harmony-btn-primary p-2 rounded-full h-[32px] w-[32px] flex items-center justify-center cursor-pointer">
                                <Plus size={14}/>
                              </button>
                          </form>
                      </div>
                  )}
                </div>

                {/* 导出表格按钮 */}
                <button 
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="harmony-btn-secondary flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium rounded-full cursor-pointer select-none"
                    title="自定义条件导出 Excel"
                >
                    <Download size={13} strokeWidth={2} />
                    <span className="hidden sm:inline">导出</span>
                </button>

                {/* 清空历史记录按钮 (危险操作：描边红 + 红字) */}
                <button 
                    type="button"
                    onClick={() => { if(window.confirm('确定清空所有历史客户背调记录吗？此操作无法撤销。')) onClearHistory(); }}
                    className="harmony-btn-danger p-2 rounded-full flex items-center justify-center cursor-pointer select-none"
                    title="清空历史数据库"
                >
                    <Trash2 size={13} strokeWidth={2} />
                </button>
            </div>
        </div>
      </div>

      {/* 分析表格主体 */}
      <AnalysisTable 
        results={filteredData} 
        mode="crm" 
        employees={employees}
        searchTerm={deferredSearch}
        onUpdateAssignment={onUpdateAssignment} 
        onUpdateFollowUp={onUpdateFollowUp}
        onUpdateNote={onUpdateNote}
        onUpdateContactInfo={onUpdateContactInfo}
        onUpdateSourceType={onUpdateSourceType}
        selectedIds={selectedIds}
        onToggleSelection={handleToggleSelection}
        onToggleAll={handleToggleAll}
      />

      {/* 导出弹窗 (符合 HarmonyOS 7 规范的 Level 100 全屏模态弹层) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-[var(--ink)]/40 flex items-center justify-center z-[100] p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[var(--surface)] rounded-[20px] elevation-float w-full max-w-lg overflow-hidden border border-[var(--line)] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--surface-2)] shrink-0">
              <h3 className="font-semibold text-[var(--ink)] flex items-center gap-2.5 text-[14px]">
                <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={15} strokeWidth={2}/>
                </div>
                <span>自定义导出背调 Excel</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--line)] transition-colors">
                <X size={14} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* 按时间下载功能 */}
              <div>
                <label className="block text-[12px] font-medium text-[var(--ink-2)] mb-2 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[var(--ink-2)]" /> 
                  <span>按日期区间过滤</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="date" 
                    value={exportStartDate}
                    onChange={e => setExportStartDate(e.target.value)}
                    className="w-full text-[12px] p-2.5 border border-[var(--line)] rounded-[12px] bg-[var(--surface-2)] outline-none focus:border-[var(--ink)] font-normal text-[var(--ink)]"
                  />
                  <input 
                    type="date" 
                    value={exportEndDate}
                    onChange={e => setExportEndDate(e.target.value)}
                    className="w-full text-[12px] p-2.5 border border-[var(--line)] rounded-[12px] bg-[var(--surface-2)] outline-none focus:border-[var(--ink)] font-normal text-[var(--ink)]"
                  />
                </div>
                <p className="text-[12px] text-[var(--ink-3)] mt-1.5">若不设置日期区间，则导出所有符合当前筛选的客户。</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                   <p className="text-[12px] font-medium text-[var(--ink)]">选择导出的字段模块</p>
                   <button 
                     onClick={() => setSelectedExportGroups(selectedExportGroups.size === EXPORT_GROUPS.length ? new Set() : new Set(EXPORT_GROUPS.map(g => g.id)))} 
                     className="text-[12px] text-[var(--ink)] font-normal hover:underline"
                   >
                     {selectedExportGroups.size === EXPORT_GROUPS.length ? '取消全选' : '全部勾选'}
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {EXPORT_GROUPS.map(group => {
                    const isSelected = selectedExportGroups.has(group.id);
                    return (
                      <div 
                        key={group.id} 
                        onClick={() => { 
                          const s = new Set(selectedExportGroups); 
                          if (s.has(group.id)) s.delete(group.id); 
                          else s.add(group.id); 
                          setSelectedExportGroups(s); 
                        }}
                        className={`p-3 rounded-[16px] border cursor-pointer transition-colors flex items-center gap-2.5 ${
                          isSelected 
                            ? 'border-[var(--ink)] bg-[var(--surface-2)] text-[var(--ink)] font-medium' 
                            : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink-2)]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] bg-[var(--surface)]'}`}>
                          {isSelected && <Check size={11} strokeWidth={3}/>}
                        </div>
                        <span className="text-[12px]">{group.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--surface-2)] border-t border-[var(--line)] flex justify-end gap-2.5">
              <button onClick={() => setShowExportModal(false)} className="harmony-btn-secondary px-4 py-1.5 text-[12px]">取消</button>
              <button 
                onClick={executeExport}
                className="harmony-btn-cta px-5 text-[13px] flex items-center gap-1.5"
              >
                <Download size={14} /> 确认生成并下载 Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CRMView;
