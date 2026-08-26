// Utilities for handling and displaying dates, times and durations

/**
 * Formats a date into a readable string (e.g., Aug 25, 2026 or 08/25/2026)
 */
export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '--/--/----';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '--/--/----';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '--/--/----';
  }
}

/**
 * Formats a time into a readable string (e.g., 08:05 or 14:30)
 */
export function formatTime(dateString?: string | Date | null): string {
  if (!dateString) return '--:--';
  
  // If already a clean HH:mm or HH:mm:ss string
  if (typeof dateString === 'string') {
    if (/^\d{2}:\d{2}(:\d{2})?/.test(dateString)) {
      return dateString.substring(0, 5);
    }
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return typeof dateString === 'string' && dateString.length >= 5 ? dateString.substring(0, 5) : '--:--';
    }
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return '--:--';
  }
}

/**
 * Formats a duration (e.g., 8h 25m or 35m)
 */
export function formatDuration(duration?: any): string {
  if (!duration && duration !== 0) return '--:--';

  // If PostgreSQL interval object (e.g., { hours: 8, minutes: 30 })
  if (typeof duration === 'object' && duration !== null) {
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  // If string (e.g., "0h 35m", "8h 12m")
  if (typeof duration === 'string' && (duration.includes('h') || duration.includes('m'))) {
    return duration;
  }

  // If standard PostgreSQL interval string (e.g., "00:00:35.505733" or "08:25:00")
  if (typeof duration === 'string') {
    const parts = duration.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m`;
      }
      return `${minutes}m`;
    }
  }

  // If number in minutes or seconds
  if (typeof duration === 'number') {
    const totalMinutes = duration > 300 ? Math.floor(duration / 60) : Math.floor(duration);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${minutes}m`;
  }

  return '--:--';
}

/**
 * Formats a duration in seconds (for calculations)
 */
export function durationToSeconds(duration?: any): number {
  if (!duration) return 0;

  if (typeof duration === 'number') return duration;

  if (typeof duration === 'object' && duration !== null) {
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    const seconds = duration.seconds || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (typeof duration === 'string') {
    const parts = duration.split(':');
    if (parts.length >= 3) {
      return (
        (parseInt(parts[0], 10) || 0) * 3600 +
        (parseInt(parts[1], 10) || 0) * 60 +
        (parseInt(parts[2], 10) || 0)
      );
    } else if (parts.length === 2) {
      return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60;
    }
  }

  return 0;
}

/**
 * Checks if a date matches today
 */
export function isToday(dateString?: string | null): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString.startsWith(today);
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

