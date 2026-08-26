/**
 * Utilitaires pour le calcul de ponctualité et la manipulation des horaires
 */

export interface PonctualiteStatus {
  status: 'ON_TIME' | 'EARLY' | 'LATE' | 'UNDEFINED';
  label: string;
  diffMinutes: number;
  expectedTime?: string;
}

/**
 * Compare l'heure actuelle avec l'heure de début prévue
 * @param scheduledTimeStr Chaîne formatée 'HH:MM' ou 'HH:MM:SS'
 * @param referenceDate Date de référence (par défaut maintenant)
 * @param toleranceMinutes Marge de tolérance (par défaut 5 min)
 */
export function calculatePunctuality(
  scheduledTimeStr?: string | null,
  referenceDate: Date = new Date(),
  toleranceMinutes: number = 5
): PonctualiteStatus {
  if (!scheduledTimeStr) {
    return {
      status: 'UNDEFINED',
      label: 'Heure de début non définie',
      diffMinutes: 0,
    };
  }

  const parts = scheduledTimeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return {
      status: 'UNDEFINED',
      label: 'Format horaire invalide',
      diffMinutes: 0,
    };
  }

  const [hours, minutes] = parts;
  const scheduledDate = new Date(referenceDate);
  scheduledDate.setHours(hours, minutes, 0, 0);

  const diffMs = referenceDate.getTime() - scheduledDate.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < -toleranceMinutes) {
    return {
      status: 'EARLY',
      label: 'En avance',
      diffMinutes: Math.abs(diffMinutes),
      expectedTime: scheduledTimeStr.substring(0, 5),
    };
  }

  if (diffMinutes > toleranceMinutes) {
    return {
      status: 'LATE',
      label: 'En retard',
      diffMinutes,
      expectedTime: scheduledTimeStr.substring(0, 5),
    };
  }

  return {
    status: 'ON_TIME',
    label: "À l'heure",
    diffMinutes,
    expectedTime: scheduledTimeStr.substring(0, 5),
  };
}

/**
 * Formate une heure au format 24h français (ex: 08:30:15)
 */
export function formatTime24h(date: Date = new Date()): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
