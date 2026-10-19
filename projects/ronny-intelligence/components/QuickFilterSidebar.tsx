import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisResult, ConclusionStatus } from '../types';
import { DashboardFilter } from './StatsDashboard';
import { normalizeCountryName, getCountryVisual } from '../utils/countryUtils';
import { 
  X, RotateCcw, Check, Calendar, Award, Globe, 
  Search, SlidersHorizontal, Sparkles, AlertCircle, Clock
} from 'lucide-react';
import { IconAStar, IconBCheck, IconCAlert, IconDSlash, IconExclamation } from './Icons';

interface QuickFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  results: AnalysisResult[];
  activeFilter: DashboardFilter | null;
  onApplyFilter: (filter: DashboardFilter | null) => void;
}

type TimeRangeKey = 'all' | 'today' | '3days' | '7days' | '30days' | 'custom';

export const QuickFilterSidebar: React.FC<QuickFilterSidebarProps> = ({
  isOpen,
  onClose,
  results,
  activeFilter,
  onApplyFilter
}) => {
  const total = results.length;

  // 1. 时间周期状态
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 2. 客户资质等级状态 (多选)
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [pendingStrategyOnly, setPendingStrategyOnly] = useState(false);

  // 3. 国家与地区状态 (多选)
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [countrySearch, setCountrySearch] = useState('');

  // 监听 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 从当前传入的 activeFilter 初始化内部状态
  useEffect(() => {
    if (!isOpen) return;

    if (!activeFilter) {
      setTimeRange('all');
      setSelectedGrades(new Set());
      setPendingStrategyOnly(false);
      setSelectedCountries(new Set());
      setCustomStartDate('');
      setCustomEndDate('');
      return;
    }

    if (activeFilter.type === 'composite' && activeFilter.composite) {
      const comp = activeFilter.composite;
      setTimeRange(comp.timeRange || 'all');
      setCustomStartDate(comp.customStartDate || '');
      setCustomEndDate(comp.customEndDate || '');
      setSelectedGrades(new Set(comp.conclusions || []));
      setPendingStrategyOnly(!!comp.pendingStrategyOnly);
      setSelectedCountries(new Set(comp.countries || []));
    } else if (activeFilter.type === 'conclusion') {
      if (activeFilter.value === 'caution_abandon') {
        setSelectedGrades(new Set([ConclusionStatus.CAUTION, ConclusionStatus.ABANDON]));
      } else {
        setSelectedGrades(new Set([activeFilter.value]));
      }
    } else if (activeFilter.type === 'pendingStrategy') {
      setPendingStrategyOnly(true);
    } else if (activeFilter.type === 'country') {
      setSelectedCountries(new Set([normalizeCountryName(activeFilter.value)]));
    }
  }, [isOpen, activeFilter]);

  // 统计各时间周期的数量
  const timeCounts = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    let today = 0;
    let threeDays = 0;
    let sevenDays = 0;
    let thirtyDays = 0;

    results.forEach(r => {
      const ts = typeof r.timestamp === 'number' ? r.timestamp : new Date(r.timestamp).getTime();
      if (ts >= startOfToday) today++;
      if (ts >= now - 3 * 86400 * 1000) threeDays++;
      if (ts >= now - 7 * 86400 * 1000) sevenDays++;
      if (ts >= now - 30 * 86400 * 1000) thirtyDays++;
    });

    return { today, threeDays, sevenDays, thirtyDays };
  }, [results]);

  // 统计各等级数量
  const gradeCounts = useMemo(() => {
    let strongly = 0;
    let workable = 0;
    let caution = 0;
    let abandon = 0;
    let pending = 0;

    results.forEach(r => {
      if (r.conclusion === ConclusionStatus.STRONGLY_RECOMMEND) strongly++;
      else if (r.conclusion === ConclusionStatus.WORKABLE) workable++;
      else if (r.conclusion === ConclusionStatus.CAUTION) caution++;
      else if (r.conclusion === ConclusionStatus.ABANDON) abandon++;

      const s = (r.productStrategy || '').trim();
      if (!s || s === '待补充' || s === '暂无' || s === '未提供' || s.length < 5) {
        pending++;
      }
    });

    return { strongly, workable, caution, abandon, pending };
  }, [results]);

  // 获取所有唯一国家及其数量与国旗
  const allCountriesList = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach(r => {
      const norm = normalizeCountryName(r.country);
      if (norm && norm !== '未知地区') {
        map.set(norm, (map.get(norm) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([name, count]) => {
        const visual = getCountryVisual(name);
        return {
          name,
          count,
          flag: visual.flag,
          code: visual.code || ''
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [results]);

  // 过滤国家列表（基于搜索框）
  const filteredCountriesList = useMemo(() => {
    const term = countrySearch.trim().toLowerCase();
    if (!term) return allCountriesList;
    return allCountriesList.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.code.toLowerCase().includes(term)
    );
  }, [allCountriesList, countrySearch]);

  // 计算在当前筛选条件下的实时匹配总数
  const matchingCount = useMemo(() => {
    return results.filter(item => {
      // 1. 时间筛选
      if (timeRange !== 'all') {
        const now = Date.now();
        const ts = typeof item.timestamp === 'number' ? item.timestamp : new Date(item.timestamp).getTime();
        if (timeRange === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (ts < startOfToday) return false;
        } else if (timeRange === '3days') {
          if (ts < now - 3 * 86400 * 1000) return false;
        } else if (timeRange === '7days') {
          if (ts < now - 7 * 86400 * 1000) return false;
        } else if (timeRange === '30days') {
          if (ts < now - 30 * 86400 * 1000) return false;
        } else if (timeRange === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate).setHours(0, 0, 0, 0);
            if (ts < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate).setHours(23, 59, 59, 999);
            if (ts > end) return false;
          }
        }
      }

      // 2. 等级筛选
      if (selectedGrades.size > 0) {
        if (!selectedGrades.has(item.conclusion)) return false;
      }

      // 3. 待补策略筛选
      if (pendingStrategyOnly) {
        const s = (item.productStrategy || '').trim();
        const isPending = !s || s === '待补充' || s === '暂无' || s === '未提供' || s.length < 5;
        if (!isPending) return false;
      }

      // 4. 国家筛选
      if (selectedCountries.size > 0) {
        const itemC = normalizeCountryName(item.country);
        if (!selectedCountries.has(itemC)) return false;
      }

      return true;
    }).length;
  }, [results, timeRange, customStartDate, customEndDate, selectedGrades, pendingStrategyOnly, selectedCountries]);

  // 切换等级多选
  const handleToggleGrade = (grade: string) => {
    setSelectedGrades(prev => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  // 切换国家多选
  const handleToggleCountry = (countryName: string) => {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(countryName)) next.delete(countryName);
      else next.add(countryName);
      return next;
    });
  };

  // 重置全部条件
  const handleResetAll = () => {
    setTimeRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedGrades(new Set());
    setPendingStrategyOnly(false);
    setSelectedCountries(new Set());
    setCountrySearch('');
  };

  // 提交并应用筛选
  const handleApply = () => {
    const isDefault = 
      timeRange === 'all' && 
      selectedGrades.size === 0 && 
      !pendingStrategyOnly && 
      selectedCountries.size === 0;

    if (isDefault) {
      onApplyFilter(null);
      onClose();
      return;
    }

    // 组合多维摘要标签
    const labelParts: string[] = [];
    if (timeRange === 'today') labelParts.push('今日');
    else if (timeRange === '3days') labelParts.push('近3天');
    else if (timeRange === '7days') labelParts.push('近7天');
    else if (timeRange === '30days') labelParts.push('近30天');
    else if (timeRange === 'custom') labelParts.push('指定日期');

    if (selectedGrades.size > 0) {
      const gradeNames = Array.from(selectedGrades).map(g => {
        if (g === ConclusionStatus.STRONGLY_RECOMMEND) return 'A级';
        if (g === ConclusionStatus.WORKABLE) return 'B级';
        if (g === ConclusionStatus.CAUTION) return 'C级';
        if (g === ConclusionStatus.ABANDON) return 'D级';
        return g;
      });
      labelParts.push(gradeNames.join('/'));
    }

    if (pendingStrategyOnly) {
      labelParts.push('待补策略');
    }

    if (selectedCountries.size > 0) {
      const countryArr: string[] = Array.from(selectedCountries);
      const singleCountry = countryArr[0];
      if (countryArr.length === 1 && typeof singleCountry === 'string') {
        const visual = getCountryVisual(singleCountry);
        labelParts.push(`${visual.flag} ${singleCountry}`);
      } else {
        labelParts.push(`${countryArr.length}国`);
      }
    }

    const compositeFilter: DashboardFilter = {
      type: 'composite',
      value: 'composite_active',
      label: labelParts.join(' · ') || '多维筛选',
      composite: {
        timeRange,
        customStartDate,
        customEndDate,
        conclusions: Array.from<string>(selectedGrades),
        countries: Array.from<string>(selectedCountries),
        pendingStrategyOnly
      }
    };

    onApplyFilter(compositeFilter);
    onClose();
  };

  // 统计已选中的条件总数
  const activeConditionsCount = 
    (timeRange !== 'all' ? 1 : 0) +
    selectedGrades.size +
    (pendingStrategyOnly ? 1 : 0) +
    selectedCountries.size;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* 遮罩背景 (柔和空间模糊滤镜) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[8px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-8">
        <div className="w-screen sm:max-w-md md:max-w-lg bg-[var(--surface-float)] elevation-float flex flex-col z-10 border-l border-[var(--line)] shadow-2xl animate-in slide-in-from-right duration-250">
          
          {/* 顶边微光流注渐变线条 */}
          <div className="h-[2px] w-full shrink-0 opacity-90" style={{ background: 'linear-gradient(90deg, var(--glow-1), var(--glow-2), var(--glow-3))' }} />

          {/* 悬浮侧栏顶部标题栏 */}
          <div className="px-5 py-4 bg-[var(--surface-2)] border-b border-[var(--line)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.25)]">
                <SlidersHorizontal size={15} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-2">
                  <span>看板快速筛选</span>
                  {activeConditionsCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                      {activeConditionsCount} 项已选
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[var(--ink-2)] mt-0.5">跨时间、资质评级与客源国别快速动态穿透</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeConditionsCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex items-center gap-1 text-[11px] text-[var(--ink-2)] hover:text-rose-500 px-2 py-1 rounded-md hover:bg-[var(--surface)] transition-colors cursor-pointer select-none"
                  title="重置所有筛选条件"
                >
                  <RotateCcw size={11} />
                  <span>重置</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center transition-colors border border-[var(--line)] cursor-pointer select-none"
                title="关闭侧栏 (ESC)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 侧栏可滚动正文内容区 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar bg-[var(--bg)]">
            
            {/* =========================================================================
                维度 1: 时间周期 (Time Range)
               ========================================================================= */}
            <div className="rounded-[18px] p-4 bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/25">
                    <Clock size={13} />
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">时间周期</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">TIMEFRAME</span>
              </div>

              {/* 周期切换网格 (2列 / 3列自适应) */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'all', label: '全部时间', count: total },
                  { key: 'today', label: '今日新增', count: timeCounts.today },
                  { key: '3days', label: '近 3 天', count: timeCounts.threeDays },
                  { key: '7days', label: '近 7 天', count: timeCounts.sevenDays },
                  { key: '30days', label: '近 30 天', count: timeCounts.thirtyDays },
                  { key: 'custom', label: '自定义区间', count: null },
                ].map(t => {
                  const isActive = timeRange === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTimeRange(t.key as TimeRangeKey)}
                      className={`p-2 rounded-[12px] border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isActive
                          ? 'border-sky-500 bg-sky-500/15 shadow-[0_0_12px_rgba(56,189,248,0.2)] ring-1 ring-sky-500/40'
                          : 'border-[var(--line)] bg-[var(--surface)] hover:border-sky-500/30 hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <span className={`text-[11px] font-semibold truncate ${isActive ? 'text-sky-600 dark:text-sky-300' : 'text-[var(--ink)]'}`}>
                        {t.label}
                      </span>
                      {t.count !== null && (
                        <span className="text-[10px] font-mono text-[var(--ink-2)] mt-0.5">
                          {t.count} 家
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 自定义日期区间扩展面板 */}
              {timeRange === 'custom' && (
                <div className="pt-2 border-t border-[var(--line)] grid grid-cols-2 gap-2 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-medium text-[var(--ink-2)] mb-1">开始日期</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] focus:border-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[var(--ink-2)] mb-1">结束日期</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] focus:border-sky-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================================
                维度 2: 客户资质等级 (Client Qualification Grade)
               ========================================================================= */}
            <div className="rounded-[18px] p-4 bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/25">
                    <Award size={13} />
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">客户资质评级</span>
                </div>
                <span className="text-[10px] text-[var(--ink-3)] font-mono">多选生效</span>
              </div>

              {/* 4 档等级选择网格 */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* A 级 */}
                <div
                  onClick={() => handleToggleGrade(ConclusionStatus.STRONGLY_RECOMMEND)}
                  className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                    selectedGrades.has(ConclusionStatus.STRONGLY_RECOMMEND)
                      ? 'border-amber-500 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40'
                      : 'border-amber-500/25 bg-[var(--surface)] hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <IconAStar size={13} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-amber-600 dark:text-amber-400 leading-none">A 强烈推荐</div>
                      <div className="text-[10px] text-[var(--ink-2)] mt-1 font-mono">{gradeCounts.strongly} 家客户</div>
                    </div>
                  </div>
                  {selectedGrades.has(ConclusionStatus.STRONGLY_RECOMMEND) && (
                    <Check size={14} className="text-amber-500 shrink-0 font-bold" />
                  )}
                </div>

                {/* B 级 */}
                <div
                  onClick={() => handleToggleGrade(ConclusionStatus.WORKABLE)}
                  className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                    selectedGrades.has(ConclusionStatus.WORKABLE)
                      ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40'
                      : 'border-emerald-500/25 bg-[var(--surface)] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <IconBCheck size={13} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">B 合作推进</div>
                      <div className="text-[10px] text-[var(--ink-2)] mt-1 font-mono">{gradeCounts.workable} 家客户</div>
                    </div>
                  </div>
                  {selectedGrades.has(ConclusionStatus.WORKABLE) && (
                    <Check size={14} className="text-emerald-500 shrink-0 font-bold" />
                  )}
                </div>

                {/* C 级 */}
                <div
                  onClick={() => handleToggleGrade(ConclusionStatus.CAUTION)}
                  className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                    selectedGrades.has(ConclusionStatus.CAUTION)
                      ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_12px_rgba(139,92,246,0.25)] ring-1 ring-purple-500/40'
                      : 'border-purple-500/25 bg-[var(--surface)] hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-500 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <IconCAlert size={13} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-purple-600 dark:text-purple-400 leading-none">C 谨慎评估</div>
                      <div className="text-[10px] text-[var(--ink-2)] mt-1 font-mono">{gradeCounts.caution} 家客户</div>
                    </div>
                  </div>
                  {selectedGrades.has(ConclusionStatus.CAUTION) && (
                    <Check size={14} className="text-purple-500 shrink-0 font-bold" />
                  )}
                </div>

                {/* D 级 */}
                <div
                  onClick={() => handleToggleGrade(ConclusionStatus.ABANDON)}
                  className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                    selectedGrades.has(ConclusionStatus.ABANDON)
                      ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_12px_rgba(239,68,68,0.25)] ring-1 ring-rose-500/40'
                      : 'border-rose-500/25 bg-[var(--surface)] hover:border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
                      <IconDSlash size={13} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-rose-600 dark:text-rose-400 leading-none">D 暂弃归档</div>
                      <div className="text-[10px] text-[var(--ink-2)] mt-1 font-mono">{gradeCounts.abandon} 家客户</div>
                    </div>
                  </div>
                  {selectedGrades.has(ConclusionStatus.ABANDON) && (
                    <Check size={14} className="text-rose-500 shrink-0 font-bold" />
                  )}
                </div>
              </div>

              {/* 特殊状态开关：仅筛选待补全策略 */}
              <div 
                onClick={() => setPendingStrategyOnly(!pendingStrategyOnly)}
                className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                  pendingStrategyOnly
                    ? 'border-rose-500/60 bg-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'border-[var(--line)] bg-[var(--surface)] hover:border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <IconExclamation size={12} />
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[var(--ink)]">待补策略客户</span>
                    <span className="text-[10px] text-[var(--ink-2)] ml-2">需进一步制定推进方案</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-rose-500">{gradeCounts.pending} 家</span>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    pendingStrategyOnly ? 'bg-rose-500 border-rose-500 text-white' : 'border-[var(--line)] bg-[var(--surface)]'
                  }`}>
                    {pendingStrategyOnly && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                维度 3: 国家与地区 (Country & Region) - 集成全套高清国旗图标
               ========================================================================= */}
            <div className="rounded-[18px] p-4 bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center shrink-0 border border-teal-500/25">
                    <Globe size={13} />
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">国家与地区</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  共 {allCountriesList.length} 国 · 已选 {selectedCountries.size}
                </span>
              </div>

              {/* 实时搜索框 */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
                <input
                  type="text"
                  placeholder="搜索国家名称或代码 (如 智利、US)..."
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-[12px] text-[12px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] placeholder-[var(--ink-3)] outline-none focus:border-teal-500 transition-colors"
                />
                {countrySearch && (
                  <button 
                    onClick={() => setCountrySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* 国家标签网格滚动区 */}
              <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {filteredCountriesList.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-[var(--ink-3)]">
                    未找到匹配的国家或地区
                  </div>
                ) : (
                  filteredCountriesList.map(c => {
                    const isSelected = selectedCountries.has(c.name);
                    return (
                      <div
                        key={c.name}
                        onClick={() => handleToggleCountry(c.name)}
                        className={`px-3 py-1.5 rounded-[12px] border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500/15 shadow-[0_0_10px_rgba(20,216,196,0.2)] ring-1 ring-teal-500/40'
                            : 'border-[var(--line)] bg-[var(--surface)] hover:border-teal-500/35 hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[15px] leading-none shrink-0 drop-shadow-xs select-none" role="img" aria-label={c.name}>
                            {c.flag}
                          </span>
                          <span className="text-[12px] font-semibold text-[var(--ink)] truncate">
                            {c.name}
                          </span>
                          {c.code && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]">
                              {c.code}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-[var(--ink-2)] font-semibold">
                            {c.count} 家
                          </span>
                          <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-[var(--line)] bg-[var(--surface-2)]'
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* 悬浮侧栏底部常驻操作条 */}
          <div className="p-4 sm:p-5 bg-[var(--surface-2)] border-t border-[var(--line)] shrink-0 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--ink-3)] uppercase font-semibold">MATCHING RESULTS</span>
              <span className="text-[13px] font-bold text-[var(--ink)]">
                匹配到 <span className="font-mono text-sky-500 text-[15px]">{matchingCount}</span> / {total} 家企业
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3 py-2 rounded-full text-[12px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] transition-colors cursor-pointer select-none"
              >
                清空
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="harmony-btn-primary px-5 py-2 rounded-full text-[12px] font-semibold flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-transform cursor-pointer select-none"
              >
                <Sparkles size={13} />
                <span>完成筛选</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
