import React, { useMemo, useState } from 'react';
import { AnalysisResult, ConclusionStatus } from '../types';
import { 
  IconAStar, 
  IconBCheck, 
  IconCAlert, 
  IconDSlash, 
  IconDocList, 
  IconExclamation, 
  IconGlobe, 
  IconGridCategory 
} from './Icons';
import { normalizeCountryName, getCountryVisual } from '../utils/countryUtils';
import { ChevronDown, ChevronUp, Filter, RotateCcw, Sparkles, TrendingUp, Layers, SlidersHorizontal, Settings2 } from 'lucide-react';
import { QuickFilterSidebar } from './QuickFilterSidebar';

// 保持对旧代码直接引入 normalizeCountryName 的完全兼容
export { normalizeCountryName };

export interface DashboardFilter {
  type: 'conclusion' | 'country' | 'category' | 'businessType' | 'purchasing' | 'pendingStrategy' | 'time' | 'composite' | 'sourceType' | 'all';
  value: string;
  label: string;
  composite?: {
    timeRange?: 'all' | 'today' | '3days' | '7days' | '30days' | 'custom';
    customStartDate?: string;
    customEndDate?: string;
    conclusions?: string[];
    countries?: string[];
    pendingStrategyOnly?: boolean;
    businessType?: string;
    purchasing?: string;
    category?: string;
    sourceType?: string;
  };
}

/**
 * 集中统一的多维筛选匹配器 (供 App.tsx、CRMView.tsx 和数据看板联动复用)
 */
export const matchDashboardFilter = (item: AnalysisResult, filter: DashboardFilter | null): boolean => {
  if (!filter) return true;

  if (filter.type === 'sourceType') {
    const itemSource = item.sourceType || 'pending_confirmation';
    return itemSource === filter.value;
  }

  if (filter.type === 'conclusion') {
    if (filter.value === 'caution_abandon') {
      return item.conclusion === ConclusionStatus.CAUTION || item.conclusion === ConclusionStatus.ABANDON;
    }
    return item.conclusion === filter.value;
  }

  if (filter.type === 'pendingStrategy') {
    const s = (item.productStrategy || '').trim();
    return !s || s === '待补充' || s === '暂无' || s === '未提供' || s.length < 5;
  }

  if (filter.type === 'country') {
    return normalizeCountryName(item.country) === normalizeCountryName(filter.value);
  }

  if (filter.type === 'category') {
    const cat = filter.value.toLowerCase();
    const targetText = `${item.interestedCooperation || ''} ${item.currentlySelling || ''}`.toLowerCase();
    return targetText.includes(cat);
  }

  if (filter.type === 'businessType') {
    const text = `${item.actualBusinessType || ''} ${item.businessType || ''} ${item.companyNature?.mainBusiness || ''}`.toLowerCase();
    if (filter.value === 'trader') return /贸易|批发|代理|分销|trader|trading|distributor|wholesale|broker|import/i.test(text);
    if (filter.value === 'manufacturer') return /制造|工厂|生产|manufacturer|factory|oem|odm|producer/i.test(text);
    if (filter.value === 'other') return !(/贸易|批发|制造|工厂/i.test(text));
  }

  if (filter.type === 'purchasing') {
    const text = `${item.companyNature?.scale || ''} ${item.companyNature?.annualPurchaseEstimate || ''}`.toLowerCase();
    if (filter.value === 'high') return />\s*30|30\s*万|50\s*万|100\s*万|high|大/i.test(text);
    if (filter.value === 'mid') return /10|20|中|mid/i.test(text);
  }

  if (filter.type === 'composite' && filter.composite) {
    const comp = filter.composite;

    // 1. 时间周期
    if (comp.timeRange && comp.timeRange !== 'all') {
      const now = Date.now();
      const ts = typeof item.timestamp === 'number' ? item.timestamp : new Date(item.timestamp).getTime();
      if (comp.timeRange === 'today') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        if (ts < startOfToday) return false;
      } else if (comp.timeRange === '3days') {
        if (ts < now - 3 * 86400 * 1000) return false;
      } else if (comp.timeRange === '7days') {
        if (ts < now - 7 * 86400 * 1000) return false;
      } else if (comp.timeRange === '30days') {
        if (ts < now - 30 * 86400 * 1000) return false;
      } else if (comp.timeRange === 'custom') {
        if (comp.customStartDate) {
          const start = new Date(comp.customStartDate).setHours(0, 0, 0, 0);
          if (ts < start) return false;
        }
        if (comp.customEndDate) {
          const end = new Date(comp.customEndDate).setHours(23, 59, 59, 999);
          if (ts > end) return false;
        }
      }
    }

    // 2. 客户资质等级
    if (comp.conclusions && comp.conclusions.length > 0) {
      if (!comp.conclusions.includes(item.conclusion)) return false;
    }

    // 3. 待补策略
    if (comp.pendingStrategyOnly) {
      const s = (item.productStrategy || '').trim();
      const isPending = !s || s === '待补充' || s === '暂无' || s === '未提供' || s.length < 5;
      if (!isPending) return false;
    }

    // 4. 国家与地区 (支持多选)
    if (comp.countries && comp.countries.length > 0) {
      const itemC = normalizeCountryName(item.country);
      if (!comp.countries.includes(itemC)) return false;
    }

    return true;
  }

  return true;
};

interface StatsDashboardProps {
  results: AnalysisResult[];
  activeFilter?: DashboardFilter | null;
  onFilterChange?: (filter: DashboardFilter | null) => void;
  className?: string;
  defaultCollapsed?: boolean;
}

/**
 * 展会/会议/行程关键词正则检测 (过滤活动标记，绝不拿活动充当品类)
 */
const isActivityOrMeetingTag = (text: string): boolean => {
  if (!text) return true;
  const clean = text.toLowerCase().trim();
  const activityPatterns = [
    /meeting/i, /fair/i, /canton/i, /cantion/i, /exhibition/i,
    /guangzhou/i, /dubai/i, /expo/i, /summit/i, /conference/i,
    /booth/i, /\boct(?:ober)?[\s_-]*\d+/i, /\bnov(?:ember)?[\s_-]*\d+/i,
    /\bdec(?:ember)?[\s_-]*\d+/i, /\bjan(?:uary)?[\s_-]*\d+/i,
    /\bfeb(?:ruary)?[\s_-]*\d+/i, /\bmar(?:ch)?[\s_-]*\d+/i,
    /\bapr(?:il)?[\s_-]*\d+/i, /\bmay[\s_-]*\d+/i, /\bjun(?:e)?[\s_-]*\d+/i,
    /\bjul(?:y)?[\s_-]*\d+/i, /\baug(?:ust)?[\s_-]*\d+/i,
    /\bsep(?:tember)?[\s_-]*\d+/i, /attend/i, /visit/i, /travel/i,
    /offline/i, /online_meeting/i, /roadshow/i,
  ];
  return activityPatterns.some(p => p.test(clean));
};

/**
 * StatsDashboard UI 优化重构
 * - 紧凑网格布局 (Grid System) 提升信息密度
 * - 色彩编码：专属高亮边框 (Highlight Borders) 与柔光背景 (Ambient Glow Backgrounds)
 * - 完备响应式排版 (Mobile 2-Col / Tablet 2-Col / Desktop 4-Col)
 * - 集成多国国旗图标 (Flag Icons) 提升地域识别度
 * - 全量点击联动交互 (Click-to-Filter)
 */
export const StatsDashboard: React.FC<StatsDashboardProps> = React.memo(({ 
  results, 
  activeFilter = null, 
  onFilterChange,
  className = '',
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showQuickFilter, setShowQuickFilter] = useState(false);
  const total = results.length;

  // 1. 等级统计
  const stronglyCount = useMemo(() => 
    results.filter(r => r.conclusion === ConclusionStatus.STRONGLY_RECOMMEND).length, 
    [results]
  );
  const workableCount = useMemo(() => 
    results.filter(r => r.conclusion === ConclusionStatus.WORKABLE).length, 
    [results]
  );
  const cautionCount = useMemo(() => 
    results.filter(r => r.conclusion === ConclusionStatus.CAUTION).length, 
    [results]
  );
  const abandonCount = useMemo(() => 
    results.filter(r => r.conclusion === ConclusionStatus.ABANDON).length, 
    [results]
  );
  const maxLevelCount = useMemo(() => 
    Math.max(stronglyCount, workableCount, cautionCount, abandonCount, 1),
    [stronglyCount, workableCount, cautionCount, abandonCount]
  );

  // 2. 来源专区统计（展会推广、日常Meta推广、通用背调、待确认来源）
  const sourceStats = useMemo(() => {
    let exhibition = 0;
    let metaDaily = 0;
    let general = 0;
    let pending = 0;

    results.forEach(r => {
      const src = r.sourceType || 'pending_confirmation';
      if (src === 'exhibition') exhibition++;
      else if (src === 'meta_daily') metaDaily++;
      else if (src === 'pending_confirmation') pending++;
      else general++;
    });

    return { exhibition, metaDaily, general, pending };
  }, [results]);

  // 3. 待补策略统计
  const pendingStrategyCount = useMemo(() => {
    return results.filter(r => {
      const s = (r.productStrategy || '').trim();
      return !s || s === '待补充' || s === '暂无' || s === '未提供' || s.length < 5;
    }).length;
  }, [results]);

  // 3. 业务性质统计
  const businessTypeStats = useMemo(() => {
    let trader = 0;
    let manufacturer = 0;
    let other = 0;

    results.forEach(r => {
      const text = `${r.actualBusinessType || ''} ${r.businessType || ''} ${r.companyNature?.mainBusiness || ''}`.toLowerCase();
      if (/贸易|批发|代理|分销|trader|trading|distributor|wholesale|broker|import/i.test(text)) {
        trader++;
      } else if (/制造|工厂|生产|manufacturer|factory|oem|odm|producer/i.test(text)) {
        manufacturer++;
      } else {
        other++;
      }
    });

    return [
      { key: 'manufacturer', label: '制造商', count: manufacturer, bg: '#3B82F6', percent: total > 0 ? (manufacturer / total) * 100 : 0 },
      { key: 'trader', label: '贸易商', count: trader, bg: '#14D8C4', percent: total > 0 ? (trader / total) * 100 : 0 },
      { key: 'other', label: '其他', count: other, bg: '#8B5CF6', percent: total > 0 ? (other / total) * 100 : 0 },
    ];
  }, [results, total]);

  // 4. 年采购潜力分档
  const purchasePotentialStats = useMemo(() => {
    let high = 0;
    let mid = 0;
    let unnoted = 0;

    results.forEach(r => {
      const text = `${r.purchasingPower?.annualEstimate || ''} ${r.purchasingPower?.scale || ''}`.toLowerCase();
      if (/>\s*30|30\s*万|50\s*万|100\s*万|high|大/i.test(text)) {
        high++;
      } else if (/10|20|中|mid/i.test(text)) {
        mid++;
      } else {
        unnoted++;
      }
    });

    return [
      { key: 'high', label: '$30万+', count: high, bg: '#10B981', percent: total > 0 ? (high / total) * 100 : 0 },
      { key: 'mid', label: '$10–30万', count: mid, bg: '#0EA5E9', percent: total > 0 ? (mid / total) * 100 : 0 },
      { key: 'unnoted', label: '未标注', count: unnoted, bg: '#94A3B8', percent: total > 0 ? (unnoted / total) * 100 : 0 },
    ];
  }, [results, total]);

  // 5. 全量国家统计与国家 TOP4 (带完整国旗 Emoji、ISO 代码与标准中文名)
  const { topCountries, totalCountriesCount, topFlagPreviews } = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach(r => {
      const c = normalizeCountryName(r.country);
      if (c && c !== '未知地区') {
        map.set(c, (map.get(c) || 0) + 1);
      }
    });

    const sorted = Array.from(map.entries())
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

    const top4 = sorted.slice(0, 4);
    const max = top4[0]?.count || 1;
    const colors = ['#14D8C4', '#38BDF8', '#818CF8', '#A78BFA'];

    const enrichedTop4 = top4.map((item, idx) => ({
      ...item,
      color: colors[idx] || colors[3],
      barWidth: Math.max(12, Math.round((item.count / max) * 100)),
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    const flagsPreview = sorted.slice(0, 5).map(s => s.flag);

    return {
      topCountries: enrichedTop4,
      totalCountriesCount: map.size,
      topFlagPreviews: flagsPreview
    };
  }, [results, total]);

  // 6. 意向需求 TOP4
  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach(r => {
      const raw = r.interestedCooperation || r.currentlySelling || '';
      if (!raw || isActivityOrMeetingTag(raw)) return;

      const tokens = raw.split(/[,，;；、\/|\n]+/).map(t => t.trim()).filter(Boolean);
      tokens.forEach(t => {
        if (!isActivityOrMeetingTag(t) && t.length >= 2 && t.length <= 15) {
          map.set(t, (map.get(t) || 0) + 1);
        }
      });
    });

    const sorted = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const max = sorted[0]?.count || 1;
    const colors = ['#F472B6', '#EC4899', '#D946EF', '#C084FC'];

    return sorted.map((item, idx) => ({
      ...item,
      color: colors[idx] || colors[3],
      barWidth: Math.max(12, Math.round((item.count / max) * 100)),
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));
  }, [results, total]);

  // 触发筛选
  const handleCardClick = (type: DashboardFilter['type'], value: string, label: string) => {
    if (!onFilterChange) return;
    if (activeFilter && activeFilter.type === type && activeFilter.value === value) {
      // 再次点击同一项，取消过滤
      onFilterChange(null);
    } else {
      onFilterChange({ type, value, label });
    }
  };

  const isCardActive = (type: DashboardFilter['type'], value: string) => {
    return activeFilter?.type === type && activeFilter?.value === value;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* 顶部活动过滤条 (当用户通过看板点击过滤或快速筛选时展现反馈与一键重置) */}
      {activeFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-[14px] bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border border-sky-500/35 text-[12px] shadow-[0_0_15px_rgba(56,189,248,0.12)] animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-medium min-w-0">
            <Filter size={13} className="animate-pulse text-sky-500 shrink-0" />
            <span className="truncate">看板联动过滤：<strong className="text-[var(--ink)] font-semibold">{activeFilter.label}</strong></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickFilter(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-300 border border-sky-500/30 transition-all cursor-pointer shadow-xs select-none"
              title="打开快速筛选悬浮侧栏调整条件"
            >
              <SlidersHorizontal size={11} />
              <span>调整条件</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange?.(null)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all cursor-pointer hover:border-sky-500/50 select-none"
            >
              <RotateCcw size={11} className="text-sky-500" />
              <span>清除筛选 (查看全部)</span>
            </button>
          </div>
        </div>
      )}

      {/* 专区来源快速分流标签组 (展会推广 / 日常 Meta 推广 / 通用背调 / 待确认来源) */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <span className="text-[12px] font-semibold text-[var(--ink)] flex items-center gap-1.5 mr-1">
          <span>线索专区:</span>
        </span>

        {/* 全部 */}
        <button
          type="button"
          onClick={() => onFilterChange?.(null)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border select-none ${
            !activeFilter || activeFilter.type !== 'sourceType'
              ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] shadow-xs'
              : 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--line)] hover:text-[var(--ink)]'
          }`}
        >
          <span>全部来源</span>
          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--surface)]/20">{total}</span>
        </button>

        {/* 展会推广专区 */}
        <button
          type="button"
          onClick={() => handleCardClick('sourceType', 'exhibition', '🏛️ 展会推广专区')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border select-none ${
            isCardActive('sourceType', 'exhibition')
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30'
              : 'bg-[var(--surface)] text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500'
          }`}
          title="筛选展会推广线索 (示例表单 demo_exhibition_form 及展会意向)"
        >
          <span>🏛️ 展会推广</span>
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20">{sourceStats.exhibition}</span>
        </button>

        {/* 日常 Meta 产品推广专区 */}
        <button
          type="button"
          onClick={() => handleCardClick('sourceType', 'meta_daily', '📢 日常 Meta 产品推广')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border select-none ${
            isCardActive('sourceType', 'meta_daily')
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
              : 'bg-[var(--surface)] text-blue-700 dark:text-blue-300 border-blue-500/30 hover:border-blue-500'
          }`}
          title="筛选日常 Meta 产品推广线索 (常规投放/商用设备)"
        >
          <span>📢 日常 Meta 推广</span>
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20">{sourceStats.metaDaily}</span>
        </button>

        {/* 通用背调 */}
        <button
          type="button"
          onClick={() => handleCardClick('sourceType', 'general', '🔍 通用背调')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border select-none ${
            isCardActive('sourceType', 'general')
              ? 'bg-[var(--ink)] text-white border-[var(--ink)] shadow-md'
              : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:text-[var(--ink)]'
          }`}
          title="常规/通用 B2B 名单背调"
        >
          <span>🔍 通用背调</span>
          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--surface-2)]">{sourceStats.general}</span>
        </button>

        {/* 待确认来源 */}
        {sourceStats.pending > 0 && (
          <button
            type="button"
            onClick={() => handleCardClick('sourceType', 'pending_confirmation', '⏳ 待确认来源')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border select-none ${
              isCardActive('sourceType', 'pending_confirmation')
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-[var(--surface)] text-purple-600 border-purple-500/30 hover:border-purple-500'
            }`}
            title="旧记录或未知表单线索，保留手动标记通道"
          >
            <span>⏳ 待确认来源</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-purple-500/20">{sourceStats.pending}</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          Block 1: 高密度 4 列网格 KPI 矩阵
          - 色彩编码：Sky Blue / Warm Gold / Rose Coral / Violet Purple
          - 柔光背景：渐变透明柔光 + 精细微光边框 + 悬停微凸
          - 响应式排版：Mobile 2列，Desktop 4列
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* 卡片 1: 累计背调 (Sky Blue 编码) */}
        <div 
          onClick={() => onFilterChange?.(null)}
          className={`relative overflow-hidden rounded-[18px] p-3.5 sm:p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            !activeFilter 
              ? 'border-2 border-sky-500/40 bg-gradient-to-br from-sky-500/[0.10] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_4px_20px_-4px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/30' 
              : 'border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.05] via-[var(--surface)] to-[var(--surface-2)] hover:border-sky-500/45 hover:shadow-[0_4px_16px_-2px_rgba(56,189,248,0.18)] hover:-translate-y-0.5'
          }`}
          title="点击展示全部目标客户"
        >
          {/* 柔光微晕氛围底饰 */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-sky-500/20 transition-colors" />

          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.25)] group-hover:scale-105 transition-transform">
                <IconDocList size={16} />
              </div>
              <span className="text-[12px] font-semibold text-[var(--ink-2)] truncate">累计背调</span>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25 shrink-0">
              全部
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-[26px] sm:text-[30px] font-extrabold tabular-nums text-[var(--ink)] leading-tight tracking-tight">
              {total}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mt-1">
              <span className="truncate">已建档目标企业</span>
              <span className="font-mono text-[10px] text-sky-500 shrink-0 font-medium">100% 覆盖</span>
            </div>
          </div>
        </div>

        {/* 卡片 2: 强烈推荐 (A级 - Warm Amber Gold 编码) */}
        <div 
          onClick={() => handleCardClick('conclusion', ConclusionStatus.STRONGLY_RECOMMEND, '强烈推荐 (A级)')}
          className={`relative overflow-hidden rounded-[18px] p-3.5 sm:p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            isCardActive('conclusion', ConclusionStatus.STRONGLY_RECOMMEND)
              ? 'border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/[0.16] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_6px_24px_-4px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/40 -translate-y-0.5'
              : 'border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-[var(--surface)] to-[var(--surface-2)] hover:border-amber-500/50 hover:shadow-[0_4px_18px_-2px_rgba(245,158,11,0.2)] hover:-translate-y-0.5'
          }`}
          title="点击筛选所有 A 级强烈推荐客户"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />

          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/35 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform">
                <IconAStar size={16} />
              </div>
              <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 truncate">强烈推荐</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/35 shrink-0 shadow-xs">
              A 级
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-[26px] sm:text-[30px] font-extrabold tabular-nums text-amber-500 leading-tight tracking-tight">
              {stronglyCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mt-1">
              <span className="truncate">重点推进客户</span>
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                {total > 0 ? Math.round((stronglyCount / total) * 100) : 0}% 占比
              </span>
            </div>
          </div>
        </div>

        {/* 卡片 3: 待补策略 (Rose Coral 编码) */}
        <div 
          onClick={() => handleCardClick('pendingStrategy', 'pending', '待补全策略')}
          className={`relative overflow-hidden rounded-[18px] p-3.5 sm:p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            isCardActive('pendingStrategy', 'pending')
              ? 'border-2 border-rose-500/60 bg-gradient-to-br from-rose-500/[0.16] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_6px_24px_-4px_rgba(244,63,94,0.25)] ring-2 ring-rose-500/40 -translate-y-0.5'
              : 'border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.08] via-[var(--surface)] to-[var(--surface-2)] hover:border-rose-500/50 hover:shadow-[0_4px_18px_-2px_rgba(244,63,94,0.2)] hover:-translate-y-0.5'
          }`}
          title="点击筛选需进一步补全跟进策略的客户"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/20 transition-colors" />

          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/35 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.3)] group-hover:scale-105 transition-transform">
                <IconExclamation size={16} />
              </div>
              <span className="text-[12px] font-semibold text-rose-600 dark:text-rose-400 truncate">待补策略</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/35 shrink-0 shadow-xs">
              需完善
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-[26px] sm:text-[30px] font-extrabold tabular-nums text-rose-500 leading-tight tracking-tight">
              {pendingStrategyCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mt-1">
              <span className="truncate">待定推进策略</span>
              <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-semibold shrink-0">
                {total > 0 ? Math.round((pendingStrategyCount / total) * 100) : 0}% 待办
              </span>
            </div>
          </div>
        </div>

        {/* 卡片 4: 谨慎暂弃 (C/D级 - Violet Purple 编码) */}
        <div 
          onClick={() => handleCardClick('conclusion', 'caution_abandon', '谨慎暂弃 (C/D级)')}
          className={`relative overflow-hidden rounded-[18px] p-3.5 sm:p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            isCardActive('conclusion', 'caution_abandon')
              ? 'border-2 border-purple-500/60 bg-gradient-to-br from-purple-500/[0.16] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_6px_24px_-4px_rgba(168,85,247,0.25)] ring-2 ring-purple-500/40 -translate-y-0.5'
              : 'border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.08] via-[var(--surface)] to-[var(--surface-2)] hover:border-purple-500/50 hover:shadow-[0_4px_18px_-2px_rgba(168,85,247,0.2)] hover:-translate-y-0.5'
          }`}
          title="点击筛选谨慎合作或建议暂弃的客户"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-500 border border-purple-500/35 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform">
                <IconDSlash size={16} />
              </div>
              <span className="text-[12px] font-semibold text-purple-600 dark:text-purple-400 truncate">谨慎暂弃</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/35 shrink-0 shadow-xs">
              C/D 级
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-[26px] sm:text-[30px] font-extrabold tabular-nums text-purple-600 dark:text-purple-400 leading-tight tracking-tight">
              {cautionCount + abandonCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-2)] mt-1">
              <span className="truncate">低优先级过滤</span>
              <span className="font-mono text-[10px] text-purple-500 shrink-0">
                C:{cautionCount} · D:{abandonCount}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 控制栏：说明提示 + 快速筛选悬浮侧栏开关 + 视图折叠开关 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[var(--ink-2)]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
            <Sparkles size={12} className="text-sky-500" />
            多维业务深度解析
          </span>
          <span className="hidden md:inline-block text-[var(--ink-3)]">· 点击任意色块、国旗或需求条目可快速联动下钻</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 快速筛选悬浮侧栏召唤按钮 */}
          <button
            type="button"
            onClick={() => setShowQuickFilter(true)}
            className={`flex items-center gap-1.5 font-semibold text-[11px] px-3 py-1 rounded-full transition-all cursor-pointer border shadow-xs select-none ${
              activeFilter?.type === 'composite'
                ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/50 ring-1 ring-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-sky-500/40'
            }`}
            title="打开快速筛选悬浮侧栏 (通过时间周期、资质等级、客源国别快速切换数据)"
          >
            <SlidersHorizontal size={12} className="text-sky-500" />
            <span>快速筛选</span>
            {activeFilter?.type === 'composite' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            ) : (
              <span className="text-[10px] font-mono text-[var(--ink-3)] font-normal hidden sm:inline">侧栏</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:text-[var(--ink)] flex items-center gap-1 font-medium transition-colors cursor-pointer bg-[var(--surface-2)] border border-[var(--line)] px-2.5 py-1 rounded-full select-none"
          >
            <span>{isCollapsed ? '展开多维图表' : '精简收起'}</span>
            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          Block 2: 4 列多维数据解析网格 (4-Column High-Density Grid)
          - 色彩编码：Emerald/Teal / Amber Gold / Cyan Flags / Rose Needs
          - 高亮边框 + 柔光背景 + 悬停微凸
          - 完美自适应：Mobile 1列/2列，Tablet 2列，Desktop 4列等高排布
         ========================================================================= */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 animate-in fade-in duration-200">
          
          {/* Panel 1: 业务定位与采购实力 (Emerald/Teal 柔光边框) */}
          <div className="rounded-[18px] p-3.5 border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_4px_16px_-4px_rgba(16,185,129,0.10)] hover:border-emerald-500/45 hover:shadow-[0_6px_20px_-2px_rgba(16,185,129,0.18)] transition-all duration-200 flex flex-col justify-between min-h-[162px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Layers size={11} />
                </div>
                <span className="text-[12px] font-bold text-[var(--ink)]">业务与实力构成</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.2 rounded-md font-semibold">
                DUAL-TRACK
              </span>
            </div>

            {/* 堆叠条 1：业务性质 */}
            <div className="space-y-1.5 my-1.5">
              <div className="flex justify-between items-center text-[11px] text-[var(--ink-2)]">
                <span className="font-medium">主营业务分类</span>
                <span className="font-mono text-[10px] font-semibold text-[var(--ink)]">{total} 家</span>
              </div>
              <div className="h-[9px] w-full rounded-full overflow-hidden flex bg-[var(--surface-2)] p-[1px] border border-[var(--line)] shadow-inner">
                {businessTypeStats.map(item => item.percent > 0 && (
                  <div
                    key={item.key}
                    onClick={() => handleCardClick('businessType', item.key, `业务: ${item.label}`)}
                    style={{ width: `${item.percent}%`, backgroundColor: item.bg }}
                    className="h-full cursor-pointer hover:opacity-90 transition-opacity first:rounded-l-full last:rounded-r-full"
                    title={`点击过滤 ${item.label}: ${item.count} 家 (${Math.round(item.percent)}%)`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                {businessTypeStats.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleCardClick('businessType', item.key, `业务: ${item.label}`)}
                    className={`flex items-center gap-1 hover:underline cursor-pointer transition-colors ${
                      isCardActive('businessType', item.key) 
                        ? 'font-bold text-sky-500 underline' 
                        : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.bg }} />
                    <span>{item.label}</span>
                    <span className="font-mono font-semibold">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 堆叠条 2：年采购潜力 */}
            <div className="space-y-1.5 pt-1 border-t border-[var(--line)]/60">
              <div className="flex justify-between items-center text-[11px] text-[var(--ink-2)]">
                <span className="font-medium">年采购潜力档位</span>
                <span className="font-mono text-[10px] font-semibold text-[var(--ink)]">{total} 家</span>
              </div>
              <div className="h-[9px] w-full rounded-full overflow-hidden flex bg-[var(--surface-2)] p-[1px] border border-[var(--line)] shadow-inner">
                {purchasePotentialStats.map(item => item.percent > 0 && (
                  <div
                    key={item.key}
                    onClick={() => handleCardClick('purchasing', item.key, `采购潜力: ${item.label}`)}
                    style={{ width: `${item.percent}%`, backgroundColor: item.bg }}
                    className="h-full cursor-pointer hover:opacity-90 transition-opacity first:rounded-l-full last:rounded-r-full"
                    title={`点击过滤 ${item.label}: ${item.count} 家 (${Math.round(item.percent)}%)`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                {purchasePotentialStats.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleCardClick('purchasing', item.key, `采购潜力: ${item.label}`)}
                    className={`flex items-center gap-1 hover:underline cursor-pointer transition-colors ${
                      isCardActive('purchasing', item.key) 
                        ? 'font-bold text-emerald-500 underline' 
                        : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.bg }} />
                    <span>{item.label}</span>
                    <span className="font-mono font-semibold">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2: 背调等级分布 (A/B/C/D 四等级 - Amber/Multi 色彩编码) */}
          <div className="rounded-[18px] p-3.5 border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_4px_16px_-4px_rgba(245,158,11,0.10)] hover:border-amber-500/45 hover:shadow-[0_6px_20px_-2px_rgba(245,158,11,0.18)] transition-all duration-200 flex flex-col justify-between min-h-[162px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <TrendingUp size={11} />
                </div>
                <span className="text-[12px] font-bold text-[var(--ink)]">背调资质等级分布</span>
              </div>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.2 rounded-md font-semibold">
                SPECTRUM
              </span>
            </div>

            <div className="space-y-1.5 my-auto pt-1">
              {/* A 推荐 */}
              <div 
                onClick={() => handleCardClick('conclusion', ConclusionStatus.STRONGLY_RECOMMEND, 'A 强烈推荐')}
                className={`h-[24px] flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-all ${
                  isCardActive('conclusion', ConclusionStatus.STRONGLY_RECOMMEND) 
                    ? 'bg-amber-500/20 ring-1 ring-amber-500/50 shadow-xs' 
                    : 'hover:bg-amber-500/10'
                }`}
                title="点击过滤 A 推荐"
              >
                <div className="w-[66px] shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
                  <IconAStar size={12} />
                  <span>A 推荐</span>
                </div>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden p-[0.5px]">
                  <div 
                    className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    style={{ 
                      width: `${Math.max(8, Math.round((stronglyCount / maxLevelCount) * 100))}%`,
                      backgroundColor: '#F59E0B'
                    }} 
                  />
                </div>
                <span className="w-[28px] shrink-0 text-right text-[11px] font-extrabold text-amber-500 font-mono tabular-nums">
                  {stronglyCount}
                </span>
              </div>

              {/* B 合作 */}
              <div 
                onClick={() => handleCardClick('conclusion', ConclusionStatus.WORKABLE, 'B 合作推进')}
                className={`h-[24px] flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-all ${
                  isCardActive('conclusion', ConclusionStatus.WORKABLE) 
                    ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50 shadow-xs' 
                    : 'hover:bg-emerald-500/10'
                }`}
                title="点击过滤 B 合作"
              >
                <div className="w-[66px] shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
                  <IconBCheck size={12} />
                  <span>B 合作</span>
                </div>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden p-[0.5px]">
                  <div 
                    className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    style={{ 
                      width: `${Math.max(8, Math.round((workableCount / maxLevelCount) * 100))}%`,
                      backgroundColor: '#10B981'
                    }} 
                  />
                </div>
                <span className="w-[28px] shrink-0 text-right text-[11px] font-extrabold text-emerald-500 font-mono tabular-nums">
                  {workableCount}
                </span>
              </div>

              {/* C 小心 */}
              <div 
                onClick={() => handleCardClick('conclusion', ConclusionStatus.CAUTION, 'C 谨慎评估')}
                className={`h-[24px] flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-all ${
                  isCardActive('conclusion', ConclusionStatus.CAUTION) 
                    ? 'bg-purple-500/20 ring-1 ring-purple-500/50 shadow-xs' 
                    : 'hover:bg-purple-500/10'
                }`}
                title="点击过滤 C 小心"
              >
                <div className="w-[66px] shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-purple-500">
                  <IconCAlert size={12} />
                  <span>C 小心</span>
                </div>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden p-[0.5px]">
                  <div 
                    className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    style={{ 
                      width: `${Math.max(8, Math.round((cautionCount / maxLevelCount) * 100))}%`,
                      backgroundColor: '#8B5CF6'
                    }} 
                  />
                </div>
                <span className="w-[28px] shrink-0 text-right text-[11px] font-extrabold text-purple-500 font-mono tabular-nums">
                  {cautionCount}
                </span>
              </div>

              {/* D 暂弃 */}
              <div 
                onClick={() => handleCardClick('conclusion', ConclusionStatus.ABANDON, 'D 暂弃归档')}
                className={`h-[24px] flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-all ${
                  isCardActive('conclusion', ConclusionStatus.ABANDON) 
                    ? 'bg-rose-500/20 ring-1 ring-rose-500/50 shadow-xs' 
                    : 'hover:bg-rose-500/10'
                }`}
                title="点击过滤 D 暂弃"
              >
                <div className="w-[66px] shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-rose-500">
                  <IconDSlash size={12} />
                  <span>D 暂弃</span>
                </div>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden p-[0.5px]">
                  <div 
                    className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ 
                      width: `${Math.max(8, Math.round((abandonCount / maxLevelCount) * 100))}%`,
                      backgroundColor: '#EF4444'
                    }} 
                  />
                </div>
                <span className="w-[28px] shrink-0 text-right text-[11px] font-extrabold text-rose-500 font-mono tabular-nums">
                  {abandonCount}
                </span>
              </div>
            </div>
          </div>

          {/* Panel 3: 客源国家与地区 TOP4 (高辨识度国旗图标集成 + Teal 编码) */}
          <div className="rounded-[18px] p-3.5 border border-teal-500/25 bg-gradient-to-br from-teal-500/[0.08] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_4px_16px_-4px_rgba(20,216,196,0.10)] hover:border-teal-500/45 hover:shadow-[0_6px_20px_-2px_rgba(20,216,196,0.18)] transition-all duration-200 flex flex-col justify-between min-h-[162px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-teal-500/15 text-teal-500 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <IconGlobe size={12} />
                </div>
                <span className="text-[12px] font-bold text-[var(--ink)]">客源国家与地区 TOP4</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/15 border border-teal-500/25 px-1.5 py-0.2 rounded-md font-semibold" title={`共覆盖 ${totalCountriesCount} 个国家/地区`}>
                <span>{totalCountriesCount} 国</span>
                <span className="tracking-tighter opacity-80">{topFlagPreviews.slice(0, 3).join('')}</span>
              </div>
            </div>

            <div className="space-y-1.5 my-auto pt-1">
              {topCountries.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-[var(--ink-3)]">
                  暂无国家分布数据
                </div>
              ) : (
                topCountries.map(item => (
                  <div 
                    key={item.name} 
                    onClick={() => handleCardClick('country', item.name, `${item.flag} ${item.name}`)}
                    className={`h-[24px] flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-all ${
                      isCardActive('country', item.name) 
                        ? 'bg-teal-500/20 ring-1 ring-teal-500/50 shadow-xs' 
                        : 'hover:bg-teal-500/10'
                    }`}
                    title={`点击过滤 ${item.name} 客户 (${item.count} 家, ${item.percent}%)`}
                  >
                    {/* 国旗图标 + 国家名称 + 编码 */}
                    <div className="w-[82px] shrink-0 flex items-center gap-1.5 text-[11px] text-[var(--ink)] truncate">
                      <span className="text-[14px] leading-none shrink-0 drop-shadow-sm select-none" role="img" aria-label={item.name}>
                        {item.flag}
                      </span>
                      <span className="truncate font-semibold">{item.name}</span>
                      {item.code && (
                        <span className="text-[9px] font-mono font-bold text-[var(--ink-3)] hidden sm:inline-block">
                          {item.code}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden p-[0.5px]">
                      <div 
                        className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(20,216,196,0.4)]"
                        style={{ 
                          width: `${item.barWidth}%`,
                          backgroundColor: item.color 
                        }} 
                      />
                    </div>
                    <span className="w-[28px] shrink-0 text-right text-[11px] font-extrabold text-[var(--ink)] font-mono tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel 4: 意向合作需求 TOP4 (Pink/Fuchsia 色彩编码) */}
          <div className="rounded-[18px] p-3.5 border border-pink-500/25 bg-gradient-to-br from-pink-500/[0.08] via-[var(--surface)] to-[var(--surface-2)] shadow-[0_4px_16px_-4px_rgba(236,72,153,0.10)] hover:border-pink-500/45 hover:shadow-[0_6px_20px_-2px_rgba(236,72,153,0.18)] transition-all duration-200 flex flex-col justify-between min-h-[162px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0 border border-pink-500/30">
                  <IconGridCategory size={12} />
                </div>
                <span className="text-[12px] font-bold text-[var(--ink)]">意向合作需求 TOP4</span>
              </div>
              <span className="text-[10px] font-mono text-pink-600 dark:text-pink-400 bg-pink-500/15 border border-pink-500/25 px-1.5 py-0.2 rounded-md font-semibold">
                NEEDS
              </span>
            </div>

            <div className="space-y-1.5 my-auto pt-1">
              {topCategories.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-[var(--ink-3)]">
                  暂无清洗后有效品类
                </div>
              ) : (
                topCategories.map(item => (
                  <div 
                    key={item.name} 
                    onClick={() => handleCardClick('category', item.name, `品类: ${item.name}`)}
                    className={`h-[24px] flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-all ${
                      isCardActive('category', item.name) 
                        ? 'bg-pink-500/20 ring-1 ring-pink-500/50 shadow-xs' 
                        : 'hover:bg-pink-500/10'
                    }`}
                    title={`点击过滤需求包含【${item.name}】的客户 (${item.count} 家)`}
                  >
                    <div className="w-[82px] shrink-0 flex items-center gap-1.5 text-[11px] text-[var(--ink)] truncate">
                      <span className="w-2 h-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-semibold">{item.name}</span>
                    </div>
                    <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden p-[0.5px]">
                      <div 
                        className="h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                        style={{ 
                          width: `${item.barWidth}%`,
                          backgroundColor: item.color 
                        }} 
                      />
                    </div>
                    <span className="w-[28px] shrink-0 text-right text-[11px] font-extrabold text-[var(--ink)] font-mono tabular-nums">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 快速筛选悬浮侧栏 (和谐空间设计规范：柔和磨砂遮罩、右侧滑出抽屉、多维联动) */}
      <QuickFilterSidebar
        isOpen={showQuickFilter}
        onClose={() => setShowQuickFilter(false)}
        results={results}
        activeFilter={activeFilter}
        onApplyFilter={(filter) => {
          onFilterChange?.(filter);
        }}
      />

    </div>
  );
});

StatsDashboard.displayName = 'StatsDashboard';
