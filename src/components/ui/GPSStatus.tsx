import React from 'react';
import {
  Radio,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPinOff,
  Clock,
  Compass,
  RotateCcw
} from 'lucide-react';
import { GPS_STATUS, GPSStatusType } from '../../hooks/useGeolocation';

export interface GPSStatusProps {
  status: GPSStatusType;
  accuracy: number | null;
  isActive?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const GPSStatus: React.FC<GPSStatusProps> = ({
  status,
  accuracy,
  isActive = false,
  error,
  onRetry
}) => {
  const renderIcon = () => {
    switch (status) {
      case GPS_STATUS.SEARCHING:
        return <Loader2 className="w-5 h-5 text-[#FC9905] animate-spin" />;
      case GPS_STATUS.ACTIVE:
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case GPS_STATUS.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case GPS_STATUS.PERMISSION_DENIED:
        return <MapPinOff className="w-5 h-5 text-red-600" />;
      case GPS_STATUS.TIMEOUT:
        return <Clock className="w-5 h-5 text-amber-600" />;
      case GPS_STATUS.INSUFFICIENT_ACCURACY:
        return <Compass className="w-5 h-5 text-amber-600" />;
      case GPS_STATUS.INACTIVE:
      default:
        return <Radio className="w-5 h-5 text-[#110195]" />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case GPS_STATUS.ACTIVE:
        return 'gps-active border-emerald-500/30 bg-emerald-500/10 text-emerald-800';
      case GPS_STATUS.SEARCHING:
        return 'gps-searching border-[#FC9905]/40 bg-[#FC9905]/10 text-[#FC9905]';
      case GPS_STATUS.INACTIVE:
        return 'gps-inactive border-[#110195]/10 bg-white/70 text-gray-700';
      default:
        return 'gps-error border-red-500/30 bg-red-500/10 text-red-700';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case GPS_STATUS.INACTIVE:
        return 'GPS Inactive';
      case GPS_STATUS.SEARCHING:
        return 'Acquiring GPS signal...';
      case GPS_STATUS.ACTIVE:
        return `GPS OK - Accuracy: ${Math.round(accuracy || 0)}m`;
      case GPS_STATUS.ERROR:
        return 'GPS Error';
      case GPS_STATUS.PERMISSION_DENIED:
        return 'Location Permission Denied';
      case GPS_STATUS.TIMEOUT:
        return 'GPS Request Timed Out';
      case GPS_STATUS.INSUFFICIENT_ACCURACY:
        return `Weak Signal - ${Math.round(accuracy || 0)}m (> 50m)`;
      default:
        return 'GPS Inactive';
    }
  };

  const isRetryable =
    status === GPS_STATUS.ERROR ||
    status === GPS_STATUS.PERMISSION_DENIED ||
    status === GPS_STATUS.TIMEOUT ||
    status === GPS_STATUS.INSUFFICIENT_ACCURACY;

  return (
    <div
      id="gps-status-bar"
      className={`gps-status glass-panel flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${getStatusClass()}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="gps-icon relative w-10 h-10 shrink-0 flex items-center justify-center bg-white/80 rounded-xl shadow-sm border border-black/5">
          <span className="gps-icon-wrapper z-10">{renderIcon()}</span>
          {status === GPS_STATUS.SEARCHING && (
            <span className="gps-pulse absolute inset-0 rounded-xl bg-[#FC9905]/20 animate-ping"></span>
          )}
        </div>
        
        <div className="gps-info min-w-0">
          <div className="gps-status-text font-semibold text-sm sm:text-base leading-tight">
            {getStatusText()}
          </div>
          {error ? (
            <div className="gps-error-text text-xs text-red-600 font-medium mt-0.5 truncate max-w-[280px] sm:max-w-md">
              {error}
            </div>
          ) : status === GPS_STATUS.INACTIVE ? (
            <div className="text-xs text-gray-500 mt-0.5">
              GPS activates upon clicking CLOCK IN or CLOCK OUT
            </div>
          ) : null}
        </div>
      </div>

      {isRetryable && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="gps-retry-btn shrink-0 inline-flex items-center gap-1.5 bg-[#FC9905] hover:bg-[#e08804] active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
