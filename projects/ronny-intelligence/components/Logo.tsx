import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Ronny Intelligence 官方品牌标识
 * 简约精致的 B2B 品牌向量标识：
 * - 主体 R 采用专业科技蓝 (#2F6BFF / #1D4ED8)
 * - 左侧基座柱采用生机鲜绿 (#18B777)
 * - 瞳点微渐变与高对比度文字
 */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="harmony-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14D8C4" />
          <stop offset="35%" stopColor="#4C9BFF" />
          <stop offset="70%" stopColor="#8B7CFF" />
          <stop offset="100%" stopColor="#FF6FB5" />
        </linearGradient>
      </defs>

      {/* 1. 左侧基座柱：空间微光光柱 */}
      <rect 
        x="10" 
        y="36" 
        width="14" 
        height="50" 
        rx="7" 
        fill="url(#harmony-gradient)" 
      />

      {/* 2. 中间主垂直柱 */}
      <rect 
        x="30" 
        y="14" 
        width="15" 
        height="72" 
        rx="7.5" 
        fill="currentColor" 
      />

      {/* 3. R 的上半圆环 */}
      <path 
        d="M37 14 H64 C76 14 85 23 85 35 C85 47 76 56 64 56 H40" 
        stroke="currentColor" 
        strokeWidth="15" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* 圆环内部留白与瞳点 */}
      <circle cx="63" cy="35" r="7" fill="var(--bg, #0E1420)" />
      <circle cx="63" cy="35" r="3.5" fill="currentColor" />

      {/* 4. R 的右下对角支撑斜柱 */}
      <path 
        d="M51 52 L76 83 C78 85.5 81.5 86 85 86 H87 C89 86 90 84 89 82.5 L66 49 Z" 
        fill="currentColor" 
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      title="Ronny Intelligence - 客户背调系统"
    >
      <div className="relative flex items-center justify-center p-1.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)]">
        <LogoMark size={iconSize} />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-semibold text-[var(--ink)] tracking-tight text-[15px] sm:text-[16px]">
              Ronny
            </span>
            <span className="font-semibold text-[var(--ink)] tracking-tight text-[14px] sm:text-[15px]">
              Intelligence
            </span>
          </div>
          <span className="hidden sm:block text-[9px] font-medium text-[var(--ink-3)] tracking-[0.14em] uppercase mt-1 leading-none">
            PEOPLE · COMPANIES · VERIFICATION
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
