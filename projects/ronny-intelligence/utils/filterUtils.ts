import { AnalysisResult, ConclusionStatus } from '../types';
import { normalizeCountryName } from './countryUtils';
import { DashboardFilter } from '../components/StatsDashboard';

/**
 * 集中统一的客户多维筛选与穿透匹配逻辑
 * 全面支持复合多选 (时间周期、客户资质等级、国家地区) 与看板单点下钻
 */
export const matchLeadWithFilter = (item: AnalysisResult, filter: DashboardFilter | null): boolean => {
  if (!filter) return true;

  // 1. 复合多维筛选 (来自快速筛选侧栏)
  if (filter.type === 'composite' && filter.composite) {
    const comp = filter.composite;

    // 时间周期筛选
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

    // 客户资质评级 (多选)
    if (comp.conclusions && comp.conclusions.length > 0) {
      if (!comp.conclusions.includes(item.conclusion)) {
        return false;
      }
    }

    // 待补策略专用过滤
    if (comp.pendingStrategyOnly) {
      const s = (item.productStrategy || '').trim();
      const isPending = !s || s === '待补充' || s === '暂无' || s === '未提供' || s.length < 5;
      if (!isPending) return false;
    }

    // 国家与地区 (多选)
    if (comp.countries && comp.countries.length > 0) {
      const itemCountry = normalizeCountryName(item.country);
      const matched = comp.countries.some(c => normalizeCountryName(c) === itemCountry);
      if (!matched) return false;
    }

    // 业务类型
    if (comp.businessType) {
      const text = `${item.actualBusinessType || ''} ${item.businessType || ''} ${item.companyNature?.mainBusiness || ''}`.toLowerCase();
      if (comp.businessType === 'trader' && !/贸易|批发|代理|分销|trader|trading|distributor|wholesale|broker|import/i.test(text)) return false;
      if (comp.businessType === 'manufacturer' && !/制造|工厂|生产|manufacturer|factory|oem|odm|producer/i.test(text)) return false;
      if (comp.businessType === 'other' && (/贸易|批发|制造|工厂/i.test(text))) return false;
    }

    // 采购潜力
    if (comp.purchasing) {
      const text = `${item.companyNature?.scale || ''} ${item.companyNature?.annualPurchaseEstimate || ''}`.toLowerCase();
      if (comp.purchasing === 'high' && !/>\s*30|30\s*万|50\s*万|100\s*万|high|大/i.test(text)) return false;
      if (comp.purchasing === 'mid' && !/10|20|中|mid/i.test(text)) return false;
    }

    // 意向品类
    if (comp.category) {
      const cat = comp.category.toLowerCase();
      const targetText = `${item.interestedCooperation || ''} ${item.currentlySelling || ''}`.toLowerCase();
      if (!targetText.includes(cat)) return false;
    }

    return true;
  }

  // 2. 单项点击下钻穿透 (来自看板直接点击)
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

  return true;
};
