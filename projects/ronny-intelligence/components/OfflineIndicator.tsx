import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-full bg-[var(--surface-float)] text-[var(--ink)] px-4 py-2 text-[12px] font-medium elevation-float border border-[var(--line)] animate-in slide-in-from-bottom-2">
      <span className="h-2 w-2 rounded-full bg-[var(--danger)]" />
      <WifiOff size={14} className="text-[var(--danger)]" />
      <span>网络已断开 — 正在使用本地缓存数据</span>
    </div>
  );
};
