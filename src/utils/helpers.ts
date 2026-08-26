/**
 * Formats a date to a localized string
 */
export const formatDate = (date: string | Date | null): string => {
  if (!date) return '-';
  const d = new Date(date);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
};

/**
 * Formats a time to a localized string
 */
export const formatTime = (date: string | Date | null): string => {
  if (!date) return '-';
  const d = new Date(date);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);
};

/**
 * Formats a duration in seconds to HH:MM:SS
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');
};
