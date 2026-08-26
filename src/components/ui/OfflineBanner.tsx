import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

interface OfflineBannerProps {
  className?: string;
  message?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  className = '',
  message = 'You are currently offline. Clock in/out and correction submissions are disabled until internet connection is restored.'
}) => {
  return (
    <aside
      id="offline-status-banner"
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2.5 bg-amber-500/95 backdrop-blur-md text-amber-950 border-b border-amber-600/30 shadow-md transition-all duration-300 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium">
        <div className="w-5 h-5 rounded-full bg-amber-900/15 flex items-center justify-center shrink-0">
          <WifiOff className="w-3.5 h-3.5 text-amber-950" />
        </div>
        <span className="text-center font-medium leading-tight">
          {message}
        </span>
      </div>
    </aside>
  );
};

export default OfflineBanner;
