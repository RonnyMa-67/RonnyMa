import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  title?: string;
  ariaLabel?: string;
}

// 统一标准：24×24 viewBox, stroke-width 1.75, stroke-linecap round, stroke-linejoin round

/**
 * 强烈推荐 / A 级：实心星 (--glow-5 金 #FFB54C)
 * 唯一允许 fill 实心以体现最高优先级
 */
export const IconAStar: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'A 级强烈推荐', 
  ariaLabel = 'A 级强烈推荐' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="var(--glow-5)" 
    stroke="var(--glow-5)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/**
 * 可合作 / B 级：圆 + 对勾 (--glow-1 青 #14D8C4)
 */
export const IconBCheck: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'B 级可合作', 
  ariaLabel = 'B 级可合作' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-1)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <polyline points="9 12 11.5 14.5 15.5 9.5" />
  </svg>
);

/**
 * 小心 / C 级：圆 + 三角警示 (--glow-3 紫 #8B7CFF)
 */
export const IconCAlert: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'C 级小心推进', 
  ariaLabel = 'C 级小心推进' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-3)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5 L16.5 15.5 H7.5 Z" />
    <line x1="12" y1="11" x2="12" y2="12.5" />
    <circle cx="12" cy="14" r="0.5" fill="var(--glow-3)" />
  </svg>
);

/**
 * 暂弃 / D 级 / 无关：圆 + 斜杠 (灰 --lv-d #94A3B8)
 */
export const IconDSlash: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'D 级暂弃/行业无关', 
  ariaLabel = 'D 级暂弃/行业无关' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--lv-d)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
  </svg>
);

/**
 * 累计背调：清单 / 文档 (--glow-2 蓝 #4C9BFF)
 */
export const IconDocList: React.FC<IconProps> = ({ 
  size = 24, 
  className = '', 
  title = '累计背调', 
  ariaLabel = '累计背调' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-2)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/**
 * 待补策略：圆 + 感叹号 (--danger #FF6B6B)
 */
export const IconExclamation: React.FC<IconProps> = ({ 
  size = 24, 
  className = '', 
  title = '待补策略', 
  ariaLabel = '待补策略' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--danger)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12.5" />
    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
  </svg>
);

/**
 * 国家 / 地区：地球 (--glow-1 青 #14D8C4)
 */
export const IconGlobe: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '国家/地区', 
  ariaLabel = '国家/地区' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-1)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

/**
 * 意向品类：网格方块 (--glow-4 粉 #FF6FB5)
 */
export const IconGridCategory: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '意向品类', 
  ariaLabel = '意向品类' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-4)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

/**
 * L1 进口 / 分销：集装箱 / 货车 (--glow-2 蓝 #4C9BFF)
 */
export const IconL1Freight: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'L1 进口/分销', 
  ariaLabel = 'L1 进口/分销' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-2)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <rect x="2" y="6" width="13" height="10" rx="1.5" />
    <path d="M15 9h4l3 3v4h-7V9z" />
    <circle cx="6.5" cy="18" r="2" />
    <circle cx="17.5" cy="18" r="2" />
  </svg>
);

/**
 * L2 贸易代理：互换箭头 (--glow-1 青 #14D8C4)
 */
export const IconL2Arrows: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'L2 贸易代理', 
  ariaLabel = 'L2 贸易代理' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-1)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <path d="m7 7 10 0-3-3" />
    <path d="m17 17-10 0 3 3" />
  </svg>
);

/**
 * L3 终端单店：店铺 (--glow-3 紫 #8B7CFF)
 */
export const IconL3Store: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = 'L3 终端单店', 
  ariaLabel = 'L3 终端单店' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-3)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <path d="m3 9 2.5-5h13L21 9v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" />
    <path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
    <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
  </svg>
);

/**
 * L4 行业无关：圆 + 斜杠 (灰 --lv-d #94A3B8)
 */
export const IconL4Irrelevant: React.FC<IconProps> = IconDSlash;

/**
 * 采购量级 / 规模：柱状图 (--glow-5 金 #FFB54C)
 */
export const IconBarChart: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '采购量级/规模', 
  ariaLabel = '采购量级/规模' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-5)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <line x1="18" y1="20" x2="18" y2="6" />
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="6" y1="20" x2="6" y2="15" />
    <line x1="3" y1="20" x2="21" y2="20" />
  </svg>
);

/**
 * 邮箱：信封 (--glow-2 蓝 #4C9BFF)
 */
export const IconMail: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '官方邮箱', 
  ariaLabel = '官方邮箱' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-2)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

/**
 * 电话：听筒 (--glow-1 青 #14D8C4)
 */
export const IconPhone: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '电话通道', 
  ariaLabel = '电话通道' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-1)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/**
 * 官网：地球 + 链环 (--glow-3 紫 #8B7CFF)
 */
export const IconWebLink: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '官方网站', 
  ariaLabel = '官方网站' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-3)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
  </svg>
);

/**
 * 待确认 / 存疑 / 门店规模待确认：圆 + 问号 (--glow-5 金 #FFB54C)
 */
export const IconQuestionMark: React.FC<IconProps> = ({ 
  size = 16, 
  className = '', 
  title = '待确认/存疑', 
  ariaLabel = '待确认/存疑' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--glow-5)" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
    aria-label={ariaLabel}
    role="img"
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="16.5" x2="12.01" y2="16.5" strokeWidth="2.5" />
  </svg>
);
