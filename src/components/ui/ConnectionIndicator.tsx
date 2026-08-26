import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300
        ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
            : 'bg-amber-500/15 text-amber-800 border border-amber-500/30 shadow-xs animate-pulse'
        }
      `}
      title={isOnline ? 'Network connected • Live sync active' : 'Offline • Local cache active'}
    >
      <span className="relative flex h-2 w-2">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isOnline ? 'bg-emerald-500' : 'bg-amber-600'
          }`}
        />
      </span>
      <span className="hidden xs:inline text-[11px] font-semibold tracking-tight">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

export default ConnectionIndicator;
